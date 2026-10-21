#!/usr/bin/env python3
"""Offline mobile FPS integration tests using the actual renderer and UI."""
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json,os,base64,mimetypes
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];qa=ROOT/'qa';qa.mkdir(exist_ok=True)
BASE='https://sops.test/'
def local_route(route):
 url=urlparse(route.request.url)
 if url.scheme!='https' or url.netloc!='sops.test':return route.abort()
 name=unquote(url.path).lstrip('/') or 'index.html';path=(ROOT/'dist'/name).resolve()
 if not path.is_relative_to((ROOT/'dist').resolve()) or not path.is_file():return route.fulfill(status=404,body='Missing bundled asset')
 mime='text/javascript' if path.suffix in ('.js','.mjs') else mimetypes.guess_type(str(path))[0] or 'application/octet-stream'
 route.fulfill(status=200,body=path.read_bytes(),content_type=mime)
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('SOPS_CHROMIUM'),args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  context=browser.new_context(viewport={'width':915,'height':412},device_scale_factor=1,is_mobile=True,has_touch=True)
  context.route('**/*',local_route)
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE,wait_until='domcontentloaded')
  page.evaluate("window.__touchEvents=[];for(const t of ['pointerdown','pointerup','pointercancel','lostpointercapture'])document.addEventListener(t,e=>window.__touchEvents.push([e.type,e.pointerId,e.target.id,e.clientX,e.clientY]),true)")
  try:
   page.wait_for_function("window.__sops && !document.querySelector('#start').disabled",timeout=60000)
   page.screenshot(path=str(qa/'01-menu.png'))
   page.locator('[data-map="south"]').tap();page.locator('[data-weapon="falcon"]').tap();page.locator('#start').tap()
   page.wait_for_function("__sops.getState().phase==='playing' && __sops.getState().map==='south'",timeout=15000)
   assert page.evaluate('__sops.getDebugState().bots.length')==5
   assert page.evaluate('__sops.getState().ammo')==24
   # Hold fire through actual keyboard events; state must advance and consume ammo.
   page.keyboard.down('Space');page.wait_for_function('__sops.getDebugState().shotsFired>=3',timeout=12000);page.keyboard.up('Space')
   page.locator('#reload').tap();page.wait_for_function('__sops.getState().reloading',timeout=5000)
   page.wait_for_function('!__sops.getState().reloading',timeout=12000)
   assert page.evaluate('__sops.getState().ammo')==24
   assert page.evaluate('__sops.getState().reserve')<168
   # Native DOM pointer capture: joystick moves player and then releases cleanly.
   before=page.evaluate('__sops.getDebugState().player')
   pad=page.locator('#joystick').bounding_box();cx=pad['x']+pad['width']/2;cy=pad['y']+pad['height']/2
   page.mouse.move(cx,cy);page.mouse.down();page.mouse.move(cx,cy-30,steps=3)
   page.wait_for_function('(before)=>Math.hypot(__sops.getDebugState().player.x-before.x,__sops.getDebugState().player.z-before.z)>.8',arg=before,timeout=12000)
   page.mouse.up()
   # Look gestures change orientation and ADS remains selectable.
   yaw=page.evaluate('__sops.getDebugState().yaw')
   page.mouse.move(500,180);page.mouse.down();page.mouse.move(570,180,steps=6);page.mouse.up()
   assert abs(page.evaluate('__sops.getDebugState().yaw')-yaw)>.1
   page.locator('#aim').tap();assert 'active' in page.locator('#aim').get_attribute('class')
   page.wait_for_function('__sops.getDebugState().aiming && __sops.getDebugState().fov<52',timeout=8000)
   page.wait_for_function('__sops.getDebugState().weaponProjection && !__sops.getDebugState().weaponProjection.centerOccluded',timeout=8000)
   page.screenshot(path=str(qa/'02-south-gameplay.png'));page.screenshot(path=str(qa/'02-south-gameplay.jpg'),type='jpeg',quality=65)
   page.locator('#aim').tap()
   # Real two-contact touch events, not a sequence of independent taps.
   client=context.new_cdp_session(page)
   def tp(i,x,y): return {'id':i,'x':x,'y':y,'radiusX':3,'radiusY':3,'force':1}
   def touch(kind,points): client.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':points})
   pad=page.locator('#joystick').bounding_box();jx=pad['x']+pad['width']/2;jy=pad['y']+pad['height']/2
   left=tp(11,jx,jy-35);right=tp(22,520,170)
   touch('touchStart',[left]);touch('touchStart',[left,right]);touch('touchMove',[left,tp(22,560,175)])
   page.wait_for_function('__sops.getDebugState().input.forward>.85 && __sops.getDebugState().sprinting',timeout=5000)
   touch('touchEnd',[tp(22,560,175)]);assert page.evaluate('__sops.getDebugState().input.forward')>.85
   fire=page.locator('#fire').bounding_box();fx=fire['x']+fire['width']/2;fy=fire['y']+fire['height']/2
   shots=page.evaluate('__sops.getDebugState().shotsFired');yaw_before=page.evaluate('__sops.getDebugState().yaw')
   touch('touchStart',[left,tp(22,fx,fy)]);touch('touchMove',[left,tp(22,fx+35,fy-10)])
   page.wait_for_function('(n)=>__sops.getDebugState().shotsFired>n && __sops.getDebugState().input.forward>.85 && __sops.getDebugState().input.fire',arg=shots,timeout=5000)
   assert abs(page.evaluate('__sops.getDebugState().yaw')-yaw_before)>.05,'Fire drag failed to look while moving'
   assert not page.evaluate('__sops.getDebugState().sprinting'),'Firing should reduce sprint to normal movement'
   touch('touchEnd',[tp(22,fx+35,fy-10)]);assert page.evaluate('__sops.getDebugState().input.forward')>.85
   assert not page.evaluate('__sops.getDebugState().input.fire')
   touch('touchEnd',[])
   assert page.evaluate('Math.abs(__sops.getDebugState().input.forward)')<.01
   # Sprint latch is a tap, so the left thumb can stay on the stick.
   page.locator('#sprint').tap();touch('touchStart',[tp(11,jx,jy-20)])
   page.wait_for_function('__sops.getDebugState().sprinting',timeout=3000);touch('touchEnd',[])
   page.locator('#sprint').tap()

   page.locator('#pause').tap();page.wait_for_function('__sops.getState().phase==="paused"')
   stopped=page.evaluate('__sops.getState().time');page.wait_for_timeout(900)
   assert page.evaluate('__sops.getState().time')==stopped
   page.locator('#resume').tap();page.wait_for_function('__sops.getState().phase==="playing"')
   page.locator('#pause').tap();page.locator('#back-menu').tap();page.locator('[data-map="north"]').tap();page.locator('[data-weapon="vx7"]').tap();page.locator('#start').tap()
   page.wait_for_function('__sops.getState().map==="north" && __sops.getState().phase==="playing"')
   assert page.evaluate('__sops.getState().ammo')==30
   assert page.evaluate('__sops.getState().kills')==0
   assert page.evaluate('__sops.getDebugState().colliders')>=10
   page.screenshot(path=str(qa/'03-north-gameplay.png'));page.screenshot(path=str(qa/'03-north-gameplay.jpg'),type='jpeg',quality=65)
   diagnostics=page.evaluate('__sops.getDebugState()')
   assert not errors,errors
   (qa/'report.json').write_text(json.dumps({'result':'passed','tests':['offline boot','both arena starts','two loadouts','five bot agents','firing ammo','timed reload','joystick movement','look drag','aim','pause freeze/resume','map switch reset','ADS center unobstructed','two finger move sprint look','fire drag while moving','independent contact release','sprint latch'],'diagnostics':diagnostics,'android_device_test':False},ensure_ascii=False,indent=2))
  except Exception:
   page.screenshot(path=str(qa/'failure.png'));page.screenshot(path=str(qa/'failure.jpg'),type='jpeg',quality=65)
   (qa/'errors.json').write_text(json.dumps({'errors':errors,'state':page.evaluate('window.__sops?__sops.getState():null'),'boot':page.locator('#boot-status').inner_text(),'debug':page.evaluate('window.__sops?__sops.getDebugState():null'),'touchEvents':page.evaluate('window.__touchEvents||[]')},ensure_ascii=False))
   raise
  finally:
   for image_path in sorted(qa.glob('*.png')):
    # Playwright screenshots are QA evidence, not source-image modification.
    print('QA_FILE='+image_path.name,flush=True)
   for image_path in sorted(qa.glob('*.jpg')):
    print('QA_IMAGE:'+image_path.stem+':'+base64.b64encode(image_path.read_bytes()).decode(),flush=True)
   print('QA_DEBUG='+json.dumps({'debug':page.evaluate('window.__sops?__sops.getDebugState():null'),'touchEvents':page.evaluate('window.__touchEvents||[]')}),flush=True)
   print('QA_REPORT='+json.dumps({'errors':errors,'state':page.evaluate('window.__sops?__sops.getState():null')}),flush=True)
   browser.close()
finally:pass
