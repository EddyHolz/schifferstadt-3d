#!/usr/bin/env python3
"""Bundle the pinned, MIT-licensed renderer; arenas use original procedural assets."""
from pathlib import Path
from urllib.request import Request,urlopen
ROOT=Path(__file__).resolve().parents[1]
def fetch(name):
 url='https://cdn.jsdelivr.net/npm/three@0.170.0/'+name
 with urlopen(Request(url,headers={'User-Agent':'SchifferstadtSOPS/0.2'}),timeout=60) as response:
  return response.read()
def main():
 library=fetch('build/three.module.js');license_text=fetch('LICENSE')
 if len(library)<100000 or b'WebGLRenderer' not in library:raise ValueError('Unexpected Three.js response')
 if b'MIT License' not in license_text:raise ValueError('License validation failed')
 target=ROOT/'dist/vendor';target.mkdir(parents=True,exist_ok=True)
 for name,data in [('three.module.js',library),('THREE-LICENSE.txt',license_text)]:
  tmp=target/(name+'.tmp');tmp.write_bytes(data);tmp.replace(target/name)
 print('Three.js r170 and MIT license bundled. All arena and game assets are original and offline.')
if __name__=='__main__':
 try:main()
 except Exception as error:raise SystemExit(f'Asset download failed: {error}')
