#!/usr/bin/env python3
"""Offline mobile browser smoke check; does not substitute an Android device test."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
qa=ROOT/'qa';qa.mkdir(exist_ok=True)
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT/'dist')))
Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  context=browser.new_context(viewport={'width':412,'height':915},device_scale_factor=1,is_mobile=True,has_touch=True)
  # No external requests are allowed, like the Android asset handler.
  context.route('**/*',lambda route:route.continue_() if route.request.url.startswith('http://127.0.0.1:') else route.abort())
  page=context.new_page();errors=[]
  page.on('pageerror',lambda error:errors.append(str(error)))
  page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='domcontentloaded')
  try:
   page.wait_for_function("document.querySelector('#notice').textContent.includes('Gebäude')",timeout=120000)
   status=page.locator('#notice').inner_text()
   assert page.locator('canvas').count()==1
   page.screenshot(path=str(qa/'city-overview.png'))
   page.locator('#save').click()
   assert page.locator('#count').inner_text()=='1'
   page.reload(wait_until='domcontentloaded')
   page.wait_for_function("document.querySelector('#notice').textContent.includes('Gebäude')",timeout=120000)
   assert page.locator('#count').inner_text()=='1','Favorite did not persist'
   page.locator('#time').fill('20')
   assert page.locator('#hour').inner_text()=='20:00'
   page.locator('#walk').click()
   assert page.locator('.motion').is_visible()
   page.locator('.motion button[data-f="1"]').tap()
   page.screenshot(path=str(qa/'walk-mode.png'))
   page.locator('#home').click()
   assert not page.locator('.motion').is_visible()
   page.locator('#places').click()
   assert page.locator('#list').inner_text().startswith('Entdeckung 1')
   assert not errors,errors
   (qa/'report.json').write_text(json.dumps({'result':'passed','status':status,'tests':['offline real data load','mobile WebGL render','favorites persistence','daylight','walk controls','reset','saved places'],'android_device_test':False},ensure_ascii=False,indent=2))
  except Exception:
   page.screenshot(path=str(qa/'failure.png'))
   (qa/'errors.json').write_text(json.dumps({'errors':errors,'status':page.locator('#notice').inner_text()},ensure_ascii=False))
   raise
  finally:
   browser.close()
finally:
 server.shutdown()
