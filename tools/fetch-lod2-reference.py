#!/usr/bin/env python3
"""Inspect the official RLP LoD2 download index; no guessed tile filenames."""
import json
from pathlib import Path
from urllib.request import Request,urlopen
URL='https://geoshop.rlp.de/files/anpassungen/hvd/products/geb3dlo.json'
ROOT=Path(__file__).resolve().parents[1]
with urlopen(Request(URL,headers={'User-Agent':'SchifferstadtExteriorResearch/0.3'}),timeout=90) as response:
 data=json.load(response)
output={'source':URL,'data':data,'neededTilesEPSG25832':{'north':[454000,5470000,455000,5471000],'south':[454000,5469000,455000,5470000]},'status':'index-only-neither-tile-nor-building-model-verified'}
p=ROOT/'dist/data/lod2-reference-config.json';p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(output,ensure_ascii=False,indent=2))
print('LOD2_CONFIG='+json.dumps(output,ensure_ascii=False),flush=True)
