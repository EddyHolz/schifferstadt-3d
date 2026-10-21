#!/usr/bin/env python3
"""Fetch public exterior reference metadata; never invent missing footprints/heights.
Python 3 standard library only. Network required on the research/build machine.
"""
import base64
import datetime
import html.parser
import json
import math
from pathlib import Path
import re
import time
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
USER_AGENT = 'SchifferstadtExteriorReferenceResearch/0.1 (public exterior geometry only)'
OVERPASS = 'https://overpass-api.de/api/interpreter'
SCHOOLS = [
    {'id':'north','name':'Grundschule Nord','street':'Rehbachstraße','number':'11',
     'official':'https://www.schifferstadt.de/bildung-kultur/schulen/grundschule-nord/'},
    {'id':'south','name':'Grundschule Süd','street':'Jägerstraße','number':'18',
     'official':'https://www.schifferstadt.de/bildung-kultur/schulen/grundschule-sued/'},
]
CITY_BBOX = '49.35,8.33,49.43,8.42'
KEEP = {'name','amenity','building','building:part','building:levels','height','min_height',
        'roof:shape','roof:height','roof:levels','roof:material','building:material',
        'addr:street','addr:housenumber','addr:city','source','source:geometry','start_date'}

def fetch(url, data=None):
    req=urllib.request.Request(url, data=data, headers={'User-Agent':USER_AGENT,'Accept':'application/json,text/html;q=0.9,*/*;q=0.5'})
    with urllib.request.urlopen(req,timeout=120) as res:
        return res.read()

def overpass(query):
    return json.loads(fetch(OVERPASS,urllib.parse.urlencode({'data':query}).encode()))

class Images(html.parser.HTMLParser):
    def __init__(self,base):
        super().__init__(); self.base=base; self.images=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='img':
            for key in ['src','data-src']:
                if a.get(key): self.add(a[key],a.get('alt',''),a.get('title',''))
            for key in ['srcset','data-srcset']:
                for part in a.get(key,'').split(','):
                    if part.strip(): self.add(part.strip().split()[0],a.get('alt',''),a.get('title',''))
        if tag=='a' and re.search(r'\.(?:jpe?g|png|webp)(?:\?|$)',a.get('href',''),re.I):
            self.add(a['href'],a.get('title',''),'')
    def add(self,url,alt,title):
        url=urllib.parse.urljoin(self.base,url)
        if url.startswith(('https://','http://')) and not any(x['url']==url for x in self.images):
            self.images.append({'url':url,'alt':alt,'title':title,'visualVerification':'pending'})

def coord(element):
    if 'lat' in element: return {'lat':element['lat'],'lon':element['lon']}
    return element.get('center')

def geocode(school,candidates):
    # A named school polygon is preferable to a potentially generic CMS coordinate.
    matching=[]
    for e in candidates:
        name=e.get('tags',{}).get('name','').casefold()
        if ('grundschule' in name or 'schule' in name or name.startswith('gs ')) and ('nord' if school['id']=='north' else 'süd') in name and coord(e): matching.append(e)
    exact=[e for e in matching if e.get('tags',{}).get('addr:street','').casefold()==school['street'].casefold() and e.get('tags',{}).get('addr:housenumber')==school['number']]
    if len(exact)==1:
        e=exact[0]
        return coord(e),{'method':'OSM school feature with exact official street and house number','osmType':e['type'],'osmId':e['id'],'tags':{k:v for k,v in e.get('tags',{}).items() if k in KEEP}}
    if len(matching)==1:
        e=matching[0]
        return coord(e),{'method':'OSM named school feature','osmType':e['type'],'osmId':e['id'],'tags':{k:v for k,v in e.get('tags',{}).items() if k in KEEP}}
    params={'format':'jsonv2','street':school['number']+' '+school['street'],
            'city':'Schifferstadt','country':'Deutschland','postalcode':'67105',
            'addressdetails':1,'limit':3,'bounded':1,'viewbox':'8.33,49.43,8.42,49.35'}
    time.sleep(1.1) # respect Nominatim public-service rate policy
    result=json.loads(fetch('https://nominatim.openstreetmap.org/search?'+urllib.parse.urlencode(params)))
    for item in result:
        address=item.get('address',{})
        if address.get('house_number')!=school['number']: continue
        road=address.get('road','').casefold().replace('strasse','straße')
        if road != school['street'].casefold(): continue
        return {'lat':float(item['lat']),'lon':float(item['lon'])},{'method':'Nominatim exact street and house number','displayName':item.get('display_name'),'osmType':item.get('osm_type'),'osmId':item.get('osm_id')}
    time.sleep(1.1)
    query=urllib.parse.urlencode({'q':school['name']+' Schifferstadt','format':'jsonv2','addressdetails':1,'limit':5,'bounded':1,'viewbox':'8.33,49.43,8.42,49.35'})
    named=json.loads(fetch('https://nominatim.openstreetmap.org/search?'+query))
    print('GEOCODE_CANDIDATES_'+school['id'].upper()+'='+json.dumps(named,ensure_ascii=False),flush=True)
    verified=[x for x in named if x.get('type')=='school' and ('nord' if school['id']=='north' else 'süd') in x.get('display_name','').lower()]
    if len(verified)==1:
        item=verified[0]
        return {'lat':float(item['lat']),'lon':float(item['lon'])},{'method':'Nominatim uniquely named school, public address pending footprint cross-check','displayName':item.get('display_name'),'osmType':item.get('osm_type'),'osmId':item.get('osm_id')}
    raise RuntimeError('No unambiguous school feature or verified address geocode for '+school['name'])

def geometry(data,origin):
    nodes={e['id']:e for e in data['elements'] if e['type']=='node'}
    ways={e['id']:e for e in data['elements'] if e['type']=='way'}
    cos=math.cos(math.radians(origin['lat']))
    def ring(way):
        ids=way.get('nodes',[])
        return [{'lat':nodes[i]['lat'],'lon':nodes[i]['lon'],
                 'x':round((nodes[i]['lon']-origin['lon'])*111320*cos,3),
                 'z':round(-(nodes[i]['lat']-origin['lat'])*111320,3)} for i in ids if i in nodes]
    buildings=[]
    for e in data['elements']:
        tags=e.get('tags',{})
        if not (tags.get('building') or tags.get('building:part')): continue
        entry={'osmType':e['type'],'osmId':e['id'],'tags':{k:v for k,v in tags.items() if k in KEEP},'visualVerification':'pending'}
        if e['type']=='way':
            entry['footprint']=ring(e)
            entry['complete']=len(entry['footprint'])==len(e.get('nodes',[])) and len(entry['footprint'])>=4 and e['nodes'][0]==e['nodes'][-1]
        elif e['type']=='relation':
            entry['members']=[{'role':m.get('role',''),'osmWayId':m['ref'],
                              'footprint':ring(ways[m['ref']]) if m['ref'] in ways else []}
                             for m in e.get('members',[]) if m['type']=='way']
            entry['complete']=False # rings must be assembled and reviewed before mesh conversion
        else: continue
        buildings.append(entry)
    return buildings

def main():
    stamp=datetime.datetime.now(datetime.timezone.utc).isoformat()
    candidates=overpass('[out:json][timeout:60];nwr[amenity=school]('+CITY_BBOX+');out tags center;')['elements']
    print('OSM_SCHOOL_CANDIDATES='+json.dumps(candidates,ensure_ascii=False),flush=True)
    result={'retrievedAt':stamp,'status':'public-reference-data-not-verified-exact-reconstruction',
            'license':{'osm':'ODbL 1.0; © OpenStreetMap contributors','officialImages':'Rights not assumed; metadata/links only'},
            'coordinateSystem':'local metres; x east, z south; origins geocoded from public OSM/address data',
            'schools':[]}
    for school in SCHOOLS:
        entry=dict(school)
        try:
            parser=Images(school['official']); parser.feed(fetch(school['official']).decode('utf-8',errors='replace'))
            entry['officialImageCandidates']=parser.images
            selected=[i for i in parser.images if re.search(r'grundschule|gs s.d|schulgeb|schulhof',i.get('alt','')+' '+i.get('title',''),re.I)]
            seen=set();photo_count=0
            for photo in selected:
                key=urllib.parse.urlsplit(photo['url']).path
                if key in seen:continue
                seen.add(key)
                if photo_count>=2:break
                try:
                    image_data=fetch(photo['url'])
                    if len(image_data)>900000:continue
                    if image_data.startswith(b'\x89PNG') or image_data.startswith(b'\xff\xd8') or image_data.startswith(b'RIFF'):
                        print('REFERENCE_PHOTO_'+school['id'].upper()+'_'+str(photo_count)+'='+base64.b64encode(image_data).decode(),flush=True)
                        print('REFERENCE_PHOTO_URL_'+school['id'].upper()+'_'+str(photo_count)+'='+photo['url'],flush=True)
                        photo_count+=1
                except Exception as photo_error:print('Reference photo unavailable: '+str(photo_error),flush=True)
        except Exception as exc: entry['officialPageError']=str(exc)
        origin,provenance=geocode(school,candidates)
        entry['origin']=origin;entry['locationProvenance']=provenance
        query='[out:json][timeout:90];(way[building](around:180,%(lat)s,%(lon)s);way["building:part"](around:180,%(lat)s,%(lon)s);relation[building](around:180,%(lat)s,%(lon)s););out body;>;out skel qt;'%origin
        raw=overpass(query)
        entry['buildings']=geometry(raw,origin)
        entry['query']=query;entry['overpass']=OVERPASS
        entry['bounds']={'radiusMetres':180,'scope':'surrounding reference candidates; school membership NOT inferred'}
        entry['osmTimestamp']=raw.get('osm3s',{}).get('timestamp_osm_base')
        result['schools'].append(entry)
        print(json.dumps({'school':entry['name'],'origin':origin,'locationProvenance':provenance,
                          'officialImageCandidates':entry.get('officialImageCandidates',[]),
                          'buildings':entry['buildings']},ensure_ascii=False),flush=True)
    out=ROOT/'dist/data/school-reference.json';out.parent.mkdir(parents=True,exist_ok=True)
    tmp=out.with_suffix('.json.tmp');tmp.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');tmp.replace(out)
    print('Saved '+str(out),flush=True)
if __name__=='__main__':
    try: main()
    except Exception as exc: raise SystemExit('Reference retrieval failed; no invented substitute written: '+str(exc))
