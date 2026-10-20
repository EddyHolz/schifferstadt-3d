#!/usr/bin/env python3
"""Offline mobile FPS integration tests using the actual renderer and UI."""
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];qa=ROOT/'qa';qa.mkdir(exist_ok=True)
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT/'dist')))
Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  context=browser.new_context(viewport={'width':915,'height':412},device_scale_factor=1,is_mobile=True,has_touch=True)
  context.route('**/*',lambda route:route.continue_() if route.request.url.startswith('http://127.0.0.1:') else route.abort())
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='domcontentloaded')
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
   page.screenshot(path=str(qa/'02-south-gameplay.png'))
   page.locator('#pause').tap();page.wait_for_function('__sops.getState().phase==="paused"')
   stopped=page.evaluate('__sops.getState().time');page.wait_for_timeout(900)
   assert page.evaluate('__sops.getState().time')==stopped
   page.locator('#resume').tap();page.wait_for_function('__sops.getState().phase==="playing"')
   page.locator('#pause').tap();page.locator('#back-menu').tap();page.locator('[data-map="north"]').tap();page.locator('[data-weapon="vx7"]').tap();page.locator('#start').tap()
   page.wait_for_function('__sops.getState().map==="north" && __sops.getState().phase==="playing"')
   assert page.evaluate('__sops.getState().ammo')==30
   assert page.evaluate('__sops.getState().kills')==0
   assert page.evaluate('__sops.getDebugState().colliders')>=10
   page.screenshot(path=str(qa/'03-north-gameplay.png'))
   diagnostics=page.evaluate('__sops.getDebugState()')
   assert not errors,errors
   (qa/'report.json').write_text(json.dumps({'result':'passed','tests':['offline boot','both arena starts','two loadouts','five bot agents','firing ammo','timed reload','joystick movement','look drag','aim','pause freeze/resume','map switch reset'],'diagnostics':diagnostics,'android_device_test':False},ensure_ascii=False,indent=2))
  except Exception:
   page.screenshot(path=str(qa/'failure.png'))
   (qa/'errors.json').write_text(json.dumps({'errors':errors,'state':page.evaluate('window.__sops?__sops.getState():null'),'boot':page.locator('#boot-status').inner_text()},ensure_ascii=False))
   raise
  finally:browser.close()
finally:server.shutdown()
