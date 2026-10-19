import * as THREE from './vendor/three.module.js';

const CENTER = {lat:49.386, lon:8.374};
const METERS = 111320, COS = Math.cos(CENTER.lat*Math.PI/180);
const project = (lat,lon) => new THREE.Vector3((lon-CENTER.lon)*METERS*COS,0,-(lat-CENTER.lat)*METERS);
const unproject = p => ({lat:CENTER.lat-p.z/METERS,lon:CENTER.lon+p.x/(METERS*COS)});
export function initWorld(container,onStatus=()=>{}) {
  const mobile=matchMedia('(pointer: coarse)').matches;
  const scene = new THREE.Scene();
  scene.background=new THREE.Color('#c8e1df');
  scene.fog=new THREE.FogExp2('#c8e1df',0.00033);
  const camera=new THREE.PerspectiveCamera(48,1,0.3,9000);
  const renderer=new THREE.WebGLRenderer({antialias:!mobile,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(mobile?1:Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled=!mobile;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.12;
  renderer.domElement.style.cssText='width:100%;height:100%;display:block;touch-action:none;outline:none';
  renderer.domElement.tabIndex=0;
  container.appendChild(renderer.domElement);
  const hemi=new THREE.HemisphereLight(0xe4f5ff,0x536447,2.5);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffefcf,3.1);sun.position.set(-600,1000,450);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-1100;sun.shadow.camera.right=1100;sun.shadow.camera.top=1100;sun.shadow.camera.bottom=-1100;sun.shadow.camera.far=3500;sun.shadow.bias=-0.0003;scene.add(sun);scene.add(sun.target);
  const groups={buildings:new THREE.Group(),roads:new THREE.Group(),nature:new THREE.Group(),labels:new THREE.Group()};Object.values(groups).forEach(g=>scene.add(g));
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(15000,15000),new THREE.MeshStandardMaterial({color:'#b0bea1',roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  const grid=new THREE.GridHelper(8000,80,0xa2b29a,0xa7b69d);grid.position.y=.012;scene.add(grid);
  const mats={road:new THREE.MeshStandardMaterial({color:0x76877f,roughness:.96}),path:new THREE.MeshStandardMaterial({color:0xc8c7a7,roughness:1}),park:new THREE.MeshStandardMaterial({color:0x8eae82,roughness:1}),water:new THREE.MeshStandardMaterial({color:0x67a8ac,roughness:.3,metalness:.15})};
  const obstacles=[];const target=new THREE.Vector3(0,0,0);let mode='orbit',theta=.56,phi=.78,distance=1150,yaw=0,pitch=0,last=performance.now(),destroyed=false,quality=!mobile;
  const touches=new Map();let pinchDistance=0;
  let pointer=null,loaded=false,forward=0,right=0;const keys=new Set();const walkPos=new THREE.Vector3(0,2.2,0);
  
  function resize(){const w=container.clientWidth||innerWidth,h=container.clientHeight||innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  function setMode(next){if(next===mode)return;if(next==='walk'){walkPos.copy(target);walkPos.y=2.2;safeSpawn();yaw=theta;pitch=0;mode='walk';onStatus('Zu Fuß unterwegs · WASD oder Pfeiltasten')}else{target.copy(walkPos);target.y=0;distance=700;mode='orbit';onStatus('Stadtansicht · Ziehen zum Drehen, Scrollen zum Zoomen')}}
  function setTime(hour){const t=Number(hour);const daylight=Math.max(.08,Math.sin((t-6)/12*Math.PI));sun.position.set(Math.cos((t-6)/12*Math.PI)*1100,Math.max(70,daylight*1400),500);sun.intensity=daylight*3.2;sun.color.set(t<8||t>17?0xffc38b:0xffefcf);hemi.intensity=.6+daylight*1.9;const sky=new THREE.Color().setHSL(.49,.22,.17+daylight*.66);scene.background.copy(sky);scene.fog.color.copy(sky);renderer.toneMappingExposure=.82+daylight*.3}
  function goTo(lat,lon){const p=project(Number(lat),Number(lon));if(!Number.isFinite(p.x)||!Number.isFinite(p.z))return;p.x=THREE.MathUtils.clamp(p.x,-4500,4500);p.z=THREE.MathUtils.clamp(p.z,-4500,4500);target.copy(p);walkPos.copy(p);walkPos.y=2.2;safeSpawn();if(mode==='orbit')distance=550}
  function reset(){target.set(0,0,0);walkPos.set(0,2.2,0);theta=.56;phi=.78;distance=1150;mode='orbit'}
  function keydown(e){if(mode!=='walk'||/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase())}
  function keyup(e){keys.delete(e.key.toLowerCase())}
  function blur(){keys.clear();forward=right=0;pointer=null;touches.clear();pinchDistance=0}
  function down(e){if(e.pointerType==='touch'){touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touches.size===2){const [a,b]=[...touches.values()];pinchDistance=Math.hypot(a.x-b.x,a.y-b.y)}}if(e.button!==0&&e.button!==2)return;renderer.domElement.focus({preventScroll:true});pointer={x:e.clientX,y:e.clientY,button:e.button};renderer.domElement.setPointerCapture(e.pointerId)}
  function move(e){if(touches.has(e.pointerId))touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touches.size>=2){const [a,b]=[...touches.values()],next=Math.hypot(a.x-b.x,a.y-b.y);if(mode==='orbit'&&pinchDistance>0&&next>0)distance=THREE.MathUtils.clamp(distance*pinchDistance/next,70,3200);pinchDistance=next;pointer=null;return}if(!pointer)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer.x=e.clientX;pointer.y=e.clientY;if(mode==='orbit'){if(pointer.button===2||e.shiftKey){const speed=distance*.0015;target.x-=dx*Math.cos(theta)*speed;target.z+=dx*Math.sin(theta)*speed;target.x-=dy*Math.sin(theta)*speed;target.z-=dy*Math.cos(theta)*speed}else{theta-=dx*.005;phi=THREE.MathUtils.clamp(phi+dy*.004,.15,1.44)}}else{yaw-=dx*.004;pitch=THREE.MathUtils.clamp(pitch-dy*.003,-1.25,1.25)}}
  function up(e){touches.delete(e.pointerId);pinchDistance=0;const remaining=[...touches.values()][0];pointer=remaining?{...remaining,button:0}:null}
  function wheel(e){e.preventDefault();if(mode==='orbit')distance=THREE.MathUtils.clamp(distance*Math.exp(e.deltaY*.001),70,3200)}
  const canvas=renderer.domElement;canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('contextmenu',e=>e.preventDefault());window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);
  const geometryBatches=new Map();
  const buildingMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9});
  const wallColor=new THREE.Color(0xe4dfca);
  function batchGeometry(geo,material,group,points){
    const tileX=Math.floor(points[0].x/250),tileZ=Math.floor(points[0].z/250);
    const key=group+':'+tileX+':'+tileZ+':'+material.uuid;
    let batch=geometryBatches.get(key);
    if(!batch){batch={geometries:[],material,group};geometryBatches.set(key,batch)}
    batch.geometries.push(geo);
  }
  async function flushBatches(){
    let done=0;
    for(const batch of geometryBatches.values()){
      if(destroyed)return;
      const attributes=batch.group==='buildings'?['position','normal','color']:['position','normal'];
      const geo=new THREE.BufferGeometry();
      const count=batch.geometries.reduce((sum,g)=>sum+g.attributes.position.count,0);
      for(const name of attributes){
        const combined=new Float32Array(count*3);let offset=0;
        for(const part of batch.geometries){combined.set(part.attributes[name].array,offset);offset+=part.attributes[name].array.length}
        geo.setAttribute(name,new THREE.BufferAttribute(combined,3));
      }
      geo.computeBoundingBox();geo.computeBoundingSphere();
      const mesh=new THREE.Mesh(geo,batch.material);mesh.castShadow=batch.group==='buildings';mesh.receiveShadow=true;groups[batch.group].add(mesh);
      for(const part of batch.geometries)part.dispose();batch.geometries.length=0;
      if(++done%12===0)await new Promise(resolve=>setTimeout(resolve,0));
    }
    geometryBatches.clear();
  }
  function polygon(points,material,height=.04){if(points.length<3)return;const shape=new THREE.Shape(points.map(p=>new THREE.Vector2(p.x,-p.z)));const geo=new THREE.ShapeGeometry(shape);const mesh=new THREE.Mesh(geo,material);mesh.rotation.x=-Math.PI/2;mesh.position.y=height;mesh.receiveShadow=true;return mesh}
  function road(points,width,material){if(points.length<2)return;const vertices=[],indices=[];for(let i=0;i<points.length;i++){const prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],dx=next.x-prev.x,dz=next.z-prev.z,len=Math.hypot(dx,dz)||1,nx=-dz/len*width/2,nz=dx/len*width/2;vertices.push(points[i].x+nx,.08,points[i].z+nz,points[i].x-nx,.08,points[i].z-nz);if(i<points.length-1){let j=i*2;indices.push(j,j+2,j+1,j+1,j+2,j+3)}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();const flat=geo.toNonIndexed();geo.dispose();batchGeometry(flat,material,'roads',points)}
  async function build(data){if(destroyed)return;if(!Array.isArray(data?.elements)||!data.elements.length)throw Error('Keine Stadtdaten vorhanden');const nodes=new Map();for(const e of data.elements||[])if(e.type==='node')nodes.set(e.id,e);let buildings=0,roads=0,processed=0;const roofColors=[0xc8b49a,0xd2c7ae,0xb4beb1,0xdac7b0,0xc3ad91];for(const e of data.elements||[]){if(++processed%150===0){await new Promise(resolve=>setTimeout(resolve,0));if(destroyed)return}if(e.type!=='way'||!e.nodes)continue;const points=e.nodes.map(id=>nodes.get(id)).filter(Boolean).map(n=>project(n.lat,n.lon));if(points.length<2)continue;const t=e.tags||{};if(t.building&&points.length>=4){const height=Math.min(70,Math.max(3,parseFloat(t.height)||((parseFloat(t['building:levels'])||2)*3.2+2)));const shape=new THREE.Shape(points.map(p=>new THREE.Vector2(p.x,-p.z)));const geo=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false});geo.rotateX(-Math.PI/2);const roofColor=new THREE.Color(roofColors[Math.abs(e.id)%roofColors.length]);
      const colors=new Float32Array(geo.attributes.position.count*3);
      for(const part of geo.groups){const color=part.materialIndex===0?roofColor:wallColor;for(let i=part.start;i<part.start+part.count;i++){colors[i*3]=color.r;colors[i*3+1]=color.g;colors[i*3+2]=color.b}}
      geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
      geo.computeBoundingBox();obstacles.push({box:geo.boundingBox.clone().expandByScalar(.8),points});
      batchGeometry(geo,buildingMaterial,'buildings',points);buildings++;}else if(t.highway){const widths={motorway:15,trunk:12,primary:10,secondary:9,tertiary:8,residential:6,living_street:5,service:4,footway:2,cycleway:2.5,path:1.8,pedestrian:5,track:3};road(points,widths[t.highway]||5,['footway','cycleway','path','track','pedestrian'].includes(t.highway)?mats.path:mats.road);roads++;}else if(['park','garden','pitch','playground'].includes(t.leisure)||['forest','grass','meadow','recreation_ground','village_green'].includes(t.landuse)||t.natural==='wood'){const mesh=polygon(points,mats.park);if(mesh)groups.nature.add(mesh)}else if(t.natural==='water'||t.waterway==='riverbank'){const mesh=polygon(points,mats.water,.06);if(mesh)groups.nature.add(mesh)}}
    await flushBatches();if(destroyed)return;
    const trunkGeo=new THREE.CylinderGeometry(.5,.8,5,5),crownGeo=new THREE.IcosahedronGeometry(4,1),trunkMat=new THREE.MeshStandardMaterial({color:0x77644c}),leafMat=new THREE.MeshStandardMaterial({color:0x73986b,roughness:1});
    const treeNodes=[...nodes.values()].filter(n=>n.tags?.natural==='tree').slice(0,1400);const trunks=new THREE.InstancedMesh(trunkGeo,trunkMat,treeNodes.length),crowns=new THREE.InstancedMesh(crownGeo,leafMat,treeNodes.length);const dummy=new THREE.Object3D();treeNodes.forEach((n,i)=>{const p=project(n.lat,n.lon);dummy.position.set(p.x,2.5,p.z);dummy.scale.setScalar(1);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);dummy.position.y=7;dummy.scale.set(1,1.3,1);dummy.updateMatrix();crowns.setMatrixAt(i,dummy.matrix)});crowns.castShadow=true;groups.nature.add(trunks,crowns);loaded=true;safeSpawn();onStatus(`${buildings.toLocaleString('de-DE')} Gebäude · ${roads.toLocaleString('de-DE')} Straßen · OpenStreetMap`)}
  const dataController=new AbortController();
  async function loadCity(){
    const valid=data=>Array.isArray(data?.elements)&&data.elements.some(e=>e.type==='way')&&data.elements.some(e=>e.type==='node');
    try{const response=await fetch(new URL('./data/city.json',import.meta.url),{signal:dataController.signal});if(response.ok){const data=await response.json();if(valid(data))return data}}catch(error){if(dataController.signal.aborted)throw error}
    try{const cached=JSON.parse(localStorage.getItem('schifferstadt-osm-v1')||'null');if(valid(cached)){onStatus('Gespeicherte OpenStreetMap-Daten werden geladen …');return cached}}catch{}
    if(destroyed)throw Error('Abgebrochen');
    onStatus('Echte Stadtdaten werden von OpenStreetMap geladen …');
    const query='[out:json][timeout:30];(way[building](49.374,8.354,49.399,8.395);way[highway](49.374,8.354,49.399,8.395);way[leisure](49.374,8.354,49.399,8.395);way[landuse](49.374,8.354,49.399,8.395);way[natural](49.374,8.354,49.399,8.395);node[natural=tree](49.374,8.354,49.399,8.395););out body;>;out skel qt;';
    const timeout=setTimeout(()=>dataController.abort(),35000);
    try{const response=await fetch('https://overpass-api.de/api/interpreter?data='+encodeURIComponent(query),{signal:dataController.signal});if(!response.ok)throw Error('OpenStreetMap HTTP '+response.status);const data=await response.json();if(!valid(data))throw Error('Keine gültigen OpenStreetMap-Daten');try{localStorage.setItem('schifferstadt-osm-v1',JSON.stringify(data))}catch{}return data}finally{clearTimeout(timeout)}
  }
  onStatus('Schifferstadt wird aufgebaut …');loadCity().then(build).catch(error=>{if(destroyed)return;console.error('Stadtdaten konnten nicht geladen werden',error);onStatus('Stadtdaten fehlen. Internetverbindung prüfen und erneut laden.')});

  function safeSpawn(){if(!blocked(walkPos.x,walkPos.z))return;for(let radius=4;radius<=150;radius+=4){for(let a=0;a<16;a++){const x=walkPos.x+Math.cos(a*Math.PI/8)*radius,z=walkPos.z+Math.sin(a*Math.PI/8)*radius;if(!blocked(x,z)){walkPos.x=x;walkPos.z=z;return}}}}
  function blocked(x,z){for(const {box:b,points:p} of obstacles){if(x<b.min.x||x>b.max.x||z<b.min.z||z>b.max.z)continue;for(const [ox,oz] of [[0,0],[.65,0],[-.65,0],[0,.65],[0,-.65]]){let inside=false;const px=x+ox,pz=z+oz;for(let i=0,j=p.length-1;i<p.length;j=i++){if((p[i].z>pz)!==(p[j].z>pz)&&px<(p[j].x-p[i].x)*(pz-p[i].z)/(p[j].z-p[i].z)+p[i].x)inside=!inside}if(inside)return true}}return false}
  function animate(now){if(destroyed)return;requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.045);last=now;if(mode==='walk'){let f=forward+(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0),r=right+(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);const length=Math.max(1,Math.hypot(f,r)),speed=(keys.has('shift')?17:6)*dt;const dx=(-Math.sin(yaw)*f+Math.cos(yaw)*r)/length*speed,dz=(-Math.cos(yaw)*f-Math.sin(yaw)*r)/length*speed;if(dx!==0&&!blocked(walkPos.x+dx,walkPos.z))walkPos.x+=dx;if(dz!==0&&!blocked(walkPos.x,walkPos.z+dz))walkPos.z+=dz;walkPos.x=THREE.MathUtils.clamp(walkPos.x,-4500,4500);walkPos.z=THREE.MathUtils.clamp(walkPos.z,-4500,4500);camera.position.copy(walkPos);camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0)}else{target.x=THREE.MathUtils.clamp(target.x,-4500,4500);target.z=THREE.MathUtils.clamp(target.z,-4500,4500);camera.position.set(target.x+distance*Math.sin(phi)*Math.sin(theta),distance*Math.cos(phi),target.z+distance*Math.sin(phi)*Math.cos(theta));camera.lookAt(target)}renderer.render(scene,camera)}requestAnimationFrame(animate);
  return {setMode,setTime,goTo,reset,zoom(delta){if(mode==='orbit')distance=THREE.MathUtils.clamp(distance*Math.exp(Number(delta)*.2),70,3200)},setLayer(name,visible){if(groups[name])groups[name].visible=visible},getPosition(){return {...unproject(mode==='walk'?walkPos:target),mode,loaded}},setMotion(f,r){forward=Number(f)||0;right=Number(r)||0},setQuality(enabled){quality=enabled;renderer.setPixelRatio(enabled?Math.min(devicePixelRatio,2):1);renderer.shadowMap.enabled=enabled;resize()},dispose(){destroyed=true;dataController.abort();observer.disconnect();window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);scene.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())});renderer.dispose();canvas.remove()}};
}
