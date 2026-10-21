#!/usr/bin/env python3
"""Bundle attributed public DOP20 site images; never invent/upscale source detail."""
import base64, hashlib, json, struct, time, xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
SERVICE = 'https://geo4.service24.rlp.de/wms/rp_dop20.fcgi'
# Same documented EPSG:25832 origins as the official exterior importer.
from importlib.util import spec_from_file_location, module_from_spec
# Keep this script independent of the network-running LoD2 importer.
import math
def utm(lat,lon):
 a=6378137.;e=0.00669437999014;k=.9996;phi=math.radians(lat);lam=math.radians(lon);l0=math.radians(9)
 ep=e/(1-e);n=a/math.sqrt(1-e*math.sin(phi)**2);t=math.tan(phi)**2;c=ep*math.cos(phi)**2;A=math.cos(phi)*(lam-l0)
 m=a*((1-e/4-3*e**2/64-5*e**3/256)*phi-(3*e/8+3*e**2/32+45*e**3/1024)*math.sin(2*phi)+(15*e**2/256+45*e**3/1024)*math.sin(4*phi)-35*e**3/3072*math.sin(6*phi))
 return (500000+k*n*(A+(1-t+c)*A**3/6+(5-18*t+t*t+72*c-58*ep)*A**5/120),k*(m+n*math.tan(phi)*(A*A/2+(5-t+9*c+4*c*c)*A**4/24+(61-58*t+t*t+600*c-330*ep)*A**6/720)))
def fetch(params):
 url=SERVICE+'?'+urlencode(params)
 for attempt in range(3):
  try:
   with urlopen(Request(url,headers={'User-Agent':'SchifferstadtExteriorStudy/0.3'}),timeout=60) as r:
    data=r.read(12*1024*1024+1)
    if len(data)>12*1024*1024:raise ValueError('DOP20 response exceeds budget')
    return data,url
  except Exception:
   if attempt==2:raise
   time.sleep(2*(attempt+1))
caps,url=fetch({'SERVICE':'WMS','REQUEST':'GetCapabilities','VERSION':'1.3.0'})
root=ET.fromstring(caps);ns={'w':'http://www.opengis.net/wms'}
layers=[{'name':n.findtext('w:Name',namespaces=ns),'title':n.findtext('w:Title',namespaces=ns)} for n in root.findall('.//w:Layer',ns) if n.find('w:Name',ns) is not None]
print('ORTHO_LAYERS='+json.dumps(layers,ensure_ascii=False),flush=True)
selected=[v for v in layers if v['name']=='rp_dop20']
if not selected:
 selected=[v for v in layers if 'dop20' in v['name'].lower() and not any(x in v['name'].lower() for x in ['meta','jahr','cir'])]
if len(selected)!=1:raise ValueError('No unambiguous public RGB DOP20 layer; inspect capabilities before changing selection')
layer=selected[0]['name'];out=ROOT/'dist/orthophotos';out.mkdir(parents=True,exist_ok=True)
manifest={'provider':'GeoBasis-DE / LVermGeoRP','license':'dl-de/by-2-0','licenseUrl':'https://www.govdata.de/dl-de/by-2-0','attribution':'©GeoBasis-DE / LVermGeoRP2026, dl-de/by-2-0, www.lvermgeo.rlp.de [Daten bearbeitet]','source':'https://lvermgeo.rlp.de/geodaten-geoshop/open-data','service':SERVICE,'layer':layer,'projection':'EPSG:25832','acquisitionYear':'not determined from current service','sites':{}}
for key,ll in {'north':(49.3881791,8.3712224),'south':(49.3777108,8.378745)}.items():
 ox,oy=utm(*ll);size=280;pixels=1400;bbox=[ox-size/2,oy-size/2,ox+size/2,oy+size/2]
 data,url=fetch({'SERVICE':'WMS','VERSION':'1.3.0','REQUEST':'GetMap','LAYERS':layer,'STYLES':'','CRS':'EPSG:25832','BBOX':','.join(str(v) for v in bbox),'WIDTH':pixels,'HEIGHT':pixels,'FORMAT':'image/png','TRANSPARENT':'FALSE'})
 if not data.startswith(b'\x89PNG\r\n\x1a\n') or struct.unpack('>II',data[16:24])!=(pixels,pixels):raise ValueError('Not the requested PNG image: '+data[:160].decode(errors='replace'))
 path=out/(key+'.png');path.write_bytes(data)
 manifest['sites'][key]={'image':key+'.png','origin':[ox,oy],'widthMeters':size,'depthMeters':size,'widthPixels':pixels,'heightPixels':pixels,'sourceResolutionMeters':.2,'bbox':bbox,'request':url,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
 print('ORTHO_IMAGE:'+key+':'+base64.b64encode(data).decode(),flush=True)
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(out/'LICENSE.txt').write_text(manifest['attribution']+'\n'+manifest['licenseUrl']+'\n'+manifest['source']+'\nAerial image projected on a flat surface; not a facade photo or current ground survey.\n')
print('ORTHO_MANIFEST='+json.dumps(manifest,ensure_ascii=False),flush=True)
