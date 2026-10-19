#!/usr/bin/env python3
"""Fetch real OSM geometry and pinned Three.js for a fully bundled Android build."""
import json
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlencode
ROOT = Path(__file__).resolve().parents[1]
QUERY = '''[out:json][timeout:60];(way[building](49.374,8.354,49.399,8.395);way[highway](49.374,8.354,49.399,8.395);way[landuse](49.374,8.354,49.399,8.395);way[leisure](49.374,8.354,49.399,8.395);way[natural](49.374,8.354,49.399,8.395);node[natural=tree](49.374,8.354,49.399,8.395););out body;>;out skel qt;'''
def download(url, data=None):
    with urlopen(Request(url, data=data, headers={'User-Agent':'SchifferstadtExplorePrototype/0.1'}), timeout=100) as r:
        return r.read()
def save(relative, content):
    p=ROOT / 'dist' / relative
    p.parent.mkdir(parents=True, exist_ok=True)
    tmp=p.with_suffix(p.suffix+'.tmp')
    tmp.write_bytes(content)
    tmp.replace(p)
def main():
    # v0.170.0 module is self-contained, requiring no core-module dependency.
    library=download('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js')
    if len(library)<100000 or b'WebGLRenderer' not in library:
        raise ValueError('Unexpected Three.js response')
    license_text=download('https://cdn.jsdelivr.net/npm/three@0.170.0/LICENSE')
    raw=download('https://overpass-api.de/api/interpreter',urlencode({'data':QUERY}).encode())
    city=json.loads(raw)
    elements=city.get('elements',[])
    buildings=sum(e.get('type')=='way' and bool(e.get('tags',{}).get('building')) for e in elements)
    roads=sum(e.get('type')=='way' and bool(e.get('tags',{}).get('highway')) for e in elements)
    if buildings<10 or roads<10: raise ValueError('Incomplete city response; will not overwrite assets')
    save('vendor/three.module.js',library)
    save('vendor/THREE-LICENSE.txt',license_text)
    save('data/city.json',raw)
    print(f'Bundled genuine OSM data: {buildings} buildings, {roads} road ways. Coverage: town-centre bounding box; not entire municipal area.')
if __name__=='__main__':
    try: main()
    except Exception as exc: raise SystemExit(f'Asset preparation failed: {exc}. Existing assets preserved unless download validation completed.')
