#!/usr/bin/env python3
"""Fetch only the official, indexed RLP tiles and extract exterior LoD2 surfaces.
Data are research/authoring inputs, not a claim of photorealistic reconstruction.
"""
import base64,gzip,json,math,xml.etree.ElementTree as ET
from pathlib import Path
from urllib.request import Request,urlopen
ROOT=Path(__file__).resolve().parents[1]
GML='{http://www.opengis.net/gml}'
SITES={'north':(49.3881791,8.3712224),'south':(49.3777108,8.378745)}
def utm(lat,lon):
 a=6378137.;e=0.00669437999014;k=.9996;phi=math.radians(lat);lam=math.radians(lon);l0=math.radians(9)
 ep=e/(1-e);n=a/math.sqrt(1-e*math.sin(phi)**2);t=math.tan(phi)**2;c=ep*math.cos(phi)**2;A=math.cos(phi)*(lam-l0)
 m=a*((1-e/4-3*e**2/64-5*e**3/256)*phi-(3*e/8+3*e**2/32+45*e**3/1024)*math.sin(2*phi)+(15*e**2/256+45*e**3/1024)*math.sin(4*phi)-35*e**3/3072*math.sin(6*phi))
 return (500000+k*n*(A+(1-t+c)*A**3/6+(5-18*t+t*t+72*c-58*ep)*A**5/120),k*(m+n*math.tan(phi)*(A*A/2+(5-t+9*c+4*c*c)*A**4/24+(61-58*t+t*t+600*c-330*ep)*A**6/720)))
def rings(poly):
 ext=poly.find(GML+'exterior');out=[]
 for node in ([ext] if ext is not None else [])+list(poly.findall(GML+'interior')):
  pos=node.find('.//'+GML+'posList')
  if pos is None:continue
  values=list(map(float,(pos.text or '').split()));dim=int(pos.attrib.get('srsDimension','3'))
  if dim!=3 or len(values)%3:raise ValueError('Unsupported GML coordinate dimensions')
  pts=[values[i:i+3] for i in range(0,len(values),3)]
  if len(pts)>1 and pts[0]==pts[-1]:pts.pop()
  if len(pts)>=3:out.append(pts)
 return out
config=json.loads((ROOT/'dist/data/lod2-reference-config.json').read_text())['data']
scheme=config['selection_hierarchy'][-1]['urls']['data']['scheme']
if not scheme.startswith('https://geobasis-rlp.de/data/geb3dlo/'):raise ValueError('Unexpected official data origin')
rawdir=ROOT/'research-cache/lod2';rawdir.mkdir(parents=True,exist_ok=True)
origins={key:utm(*ll) for key,ll in SITES.items()};sites={key:[] for key in SITES};sources=[]
for east,north in [(454,5470),(454,5469),(455,5469)]:
 url=scheme.replace('{kachel,0,3}',str(east)).replace('{kachel,3}',str(north))
 filename=rawdir/url.rsplit('/',1)[1]
 with urlopen(Request(url,headers={'User-Agent':'SchifferstadtExteriorResearch/0.3'}),timeout=120) as response:
  size=0
  with filename.open('wb') as f:
   while block:=response.read(1024*1024):
    size+=len(block)
    if size>100*1024*1024:raise ValueError('Tile exceeds research download budget')
    f.write(block)
 print('LOD2_TILE='+json.dumps({'url':url,'bytes':size}),flush=True);sources.append(url)
 for event,element in ET.iterparse(filename,events=('end',)):
  if element.tag.rsplit('}',1)[-1]!='Building':continue
  face_data=[]
  for surface in element.iter():
   kind=surface.tag.rsplit('}',1)[-1]
   if kind not in ('GroundSurface','WallSurface','RoofSurface'):continue
   for poly in surface.iter(GML+'Polygon'):
    contours=rings(poly)
    if contours:face_data.append((kind,contours))
  allpoints=[p for kind,contours in face_data for ring in contours for p in ring]
  if not allpoints:element.clear();continue
  minx=min(p[0] for p in allpoints);maxx=max(p[0] for p in allpoints);miny=min(p[1] for p in allpoints);maxy=max(p[1] for p in allpoints)
  for key,(ox,oy) in origins.items():
   if maxx<ox-140 or minx>ox+140 or maxy<oy-140 or miny>oy+140:continue
   base=min(p[2] for p in allpoints);height=max(p[2] for p in allpoints)-base
   def local(p):return {'x':round(p[0]-ox,3),'y':round(p[2]-base,3),'z':round(oy-p[1],3)}
   surfaces=[{'type':kind,'points':[local(p) for p in contours[0]],'holes':[[local(p) for p in ring] for ring in contours[1:]]} for kind,contours in face_data]
   ground=[s['points'] for s in surfaces if s['type']=='GroundSurface']
   def area(p):return abs(sum(p[i]['x']*p[(i+1)%len(p)]['z']-p[(i+1)%len(p)]['x']*p[i]['z'] for i in range(len(p))))/2
   footprint=max(ground,key=area) if ground else []
   sites[key].append({'id':element.attrib.get(GML+'id'),'footprint':[{k:p[k] for k in ('x','z')} for p in footprint],'h':round(height,3),'baseElevation':base,'surfaces':surfaces,'source':url,'groundPolygons':len(ground),'requiresReview':len(ground)!=1})
  element.clear()
result={'provider':'GeoBasis-DE / LVermGeoRP','license':'dl-de/by-2-0','sourceIndex':'https://geoshop.rlp.de/opendata-geb3dlo.html','tiles':sources,'origins':origins,'coordinateNote':'Original EPSG25832 exterior mesh; each building locally flattened to its minimum source elevation. No surveyed ground or school membership claim.','status':'authoring-input-not-photorealistic-or-map-approved','sites':sites}
if not all(sites.values()):raise ValueError('No verified buildings extracted for one or more sites')
p=ROOT/'dist/data/official-exteriors.json';p.parent.mkdir(exist_ok=True);p.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')))
print('LOD2_SUMMARY='+json.dumps({k:{'buildings':len(v),'surfaces':sum(len(b['surfaces']) for b in v),'withGround':sum(bool(b['footprint']) for b in v)} for k,v in sites.items()}),flush=True)
print('LOD2_DATA='+base64.b64encode(gzip.compress(p.read_bytes())).decode(),flush=True)
