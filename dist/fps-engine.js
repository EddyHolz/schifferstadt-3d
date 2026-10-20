import * as THREE from './vendor/three.module.js';
import { MAPS } from './maps.js';

const WEAPONS={vx7:{name:'VX-7',mag:30,reserve:180,damage:28,rate:.115,reload:1.65,spread:.012},falcon:{name:'FALCON',mag:24,reserve:168,damage:36,rate:.18,reload:1.45,spread:.008}};
const UP=new THREE.Vector3(0,1,0),CELL=2;
export function initGame(container,{onState=()=>{},onEvent=()=>{}}={}){
  const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
  renderer.domElement.style.cssText='display:block;width:100%;height:100%;touch-action:none';container.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#b8c8c9');scene.fog=new THREE.Fog('#b8c8c9',60,145);
  const camera=new THREE.PerspectiveCamera(76,1,.04,180);camera.rotation.order='YXZ';scene.add(camera);
  const world=new THREE.Group();scene.add(world);
  scene.add(new THREE.HemisphereLight(0xe5f2ff,0x656054,2.5));
  const sun=new THREE.DirectionalLight(0xffe1b1,3.2);sun.position.set(-35,65,24);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:1,far:160});sun.shadow.bias=-.0008;scene.add(sun);
  let map=null,mapId='north',weaponId='vx7',phase='menu',health=100,ammo=30,reserve=180,kills=0,deaths=0,score=0,time=120,capture=0,streak=0;
  let shotsFired=0,yaw=0,pitch=0,clock=0,shotAt=-9,reloadLeft=0,respawnLeft=0,invincible=0,regenAt=0,hudAt=0,captureTick=0,recoil=0,bob=0,destroyed=false,frame=0;
  const position=new THREE.Vector3(),input={forward:0,right:0,fire:false,aim:false,sprint:false};
  let colliders=[],bots=[],grid=[],gridW=0,gridD=0,objectiveRing=null,muzzle=null,viewmodel=null;
  const materials=new Map(),unitBox=new THREE.BoxGeometry(1,1,1),unitSphere=new THREE.SphereGeometry(1,8,6);
  const v1=new THREE.Vector3(),v2=new THREE.Vector3(),hitPoint=new THREE.Vector3(),ray=new THREE.Ray(),sphere=new THREE.Sphere();
  function event(type,text){onEvent({type,text})}
  function state(){return {health:Math.ceil(health),ammo,reserve,kills,deaths,time:Math.ceil(time),score:Math.floor(score),phase,map:mapId,weapon:weaponId,reloading:reloadLeft>0,capture:Math.round(capture),streak}}
  function emit(){onState(state())}
  function material(color,metal=0,rough=.8){const key=color+':'+metal+':'+rough;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough}));return materials.get(key)}
  function box(parent,x,y,z,w,h,d,mat,shadow=true){const mesh=new THREE.Mesh(unitBox,mat);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=shadow;mesh.receiveShadow=true;parent.add(mesh);return mesh}
  function clearWorld(){const owned=new Set();for(const root of [world,viewmodel])root?.traverse(o=>{if(o.geometry&&o.geometry!==unitBox&&o.geometry!==unitSphere)owned.add(o.geometry);if(o.isInstancedMesh)o.dispose();if(o.material&&!Array.from(materials.values()).includes(o.material)&&o.material!==facadeMats.brick&&o.material!==facadeMats.concrete){o.material.dispose()}});owned.forEach(g=>g.dispose());world.clear();colliders=[];bots=[];if(viewmodel){camera.remove(viewmodel);viewmodel=null}}
  function facadeTexture(kind){const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle=kind==='brick'?'#a78972':'#c6c7bb';ctx.fillRect(0,0,128,128);if(kind==='brick'){ctx.strokeStyle='#827361';ctx.lineWidth=2;for(let y=0;y<128;y+=16){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(128,y);ctx.stroke();for(let x=(y/16%2)*16;x<128;x+=32){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+16);ctx.stroke()}}}else{ctx.strokeStyle='#a5aca5';ctx.strokeRect(1,1,126,126)}const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(3,2);return tex}
  const facadeMats={brick:new THREE.MeshStandardMaterial({map:facadeTexture('brick'),roughness:.95}),concrete:new THREE.MeshStandardMaterial({map:facadeTexture('concrete'),roughness:.9})};
  const glass=material('#364b55',.45,.26),trim=material('#777d74',.25),gold=material('#d6ac56',.25),dark=material('#242e31',.6,.45);
  function environment(){
    const pal=map.palette||{};scene.background.set(pal.sky||'#b8c8c9');scene.fog.color.copy(scene.background);
    const ground=box(world,0,-.22,0,map.width||100,.4,map.depth||100,material(pal.ground||'#77796b'));ground.castShadow=false;
    const stripeMat=material('#c2b995');
    for(let z=-44;z<48;z+=8)box(world,0,.005,z,.15,.015,3,stripeMat,false);
    for(const b of map.boxes||map.obstacles||[]){
      const mat=b.kind==='brick'?facadeMats.brick:['concrete','gym'].includes(b.kind)?facadeMats.concrete:material(b.color||'#8b8c78');
      box(world,b.x,b.h/2,b.z,b.w,b.h,b.d,mat);
      colliders.push(new THREE.Box3(new THREE.Vector3(b.x-b.w/2,0,b.z-b.d/2),new THREE.Vector3(b.x+b.w/2,b.h,b.z+b.d/2)));
      if(b.h>3){
        box(world,b.x,b.h+.12,b.z,b.w+.3,.24,b.d+.3,trim);
        for(let y=2.3;y<b.h-1;y+=3.2){for(let x=-b.w/2+1.3;x<b.w/2-.5;x+=3){box(world,b.x+x,y,b.z+b.d/2+.025,1.35,1.3,.06,glass,false);box(world,b.x+x,y,b.z-b.d/2-.025,1.35,1.3,.06,glass,false)}for(let z=-b.d/2+1.3;z<b.d/2-.5;z+=3){box(world,b.x+b.w/2+.025,y,b.z+z,.06,1.3,1.35,glass,false);box(world,b.x-b.w/2-.025,y,b.z+z,.06,1.3,1.35,glass,false)}}
        box(world,b.x,1.2,b.z+b.d/2+.05,1.3,2.4,.1,dark,false);
      }else if(b.kind==='crate'){box(world,b.x,b.h+.015,b.z,b.w+.03,.04,b.d+.03,trim);box(world,b.x,Math.min(.5,b.h/2),b.z+b.d/2+.02,b.w,.08,.04,gold,false)}
    }
    const boundaryMat=material('#515d58');
    for(const x of [-1,1])box(world,x*((map.width||100)/2+.35),1,0,.6,2,map.depth||100,boundaryMat);
    for(const z of [-1,1])box(world,0,1,z*((map.depth||100)/2+.35),map.width||100,2,.6,boundaryMat);
    const obj=map.objective;const ringGeo=new THREE.RingGeometry(obj.radius-.2,obj.radius,48);objectiveRing=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:0xe8b955,side:THREE.DoubleSide,transparent:true,opacity:.8}));objectiveRing.rotation.x=-Math.PI/2;objectiveRing.position.set(obj.x,.035,obj.z);world.add(objectiveRing);
    box(world,obj.x,.9,obj.z,.12,1.8,.12,trim);box(world,obj.x+.5,1.5,obj.z,1,.55,.05,gold,false);
    batchEnvironment();makeGrid();
  }
  function batchEnvironment(){
    const batches=new Map();for(const child of [...world.children]){if(!child.isMesh||child.geometry!==unitBox)continue;const key=child.material.uuid+':'+child.castShadow;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(child)}
    for(const items of batches.values()){const batch=new THREE.InstancedMesh(unitBox,items[0].material,items.length);batch.castShadow=items[0].castShadow;batch.receiveShadow=true;items.forEach((mesh,i)=>{mesh.updateMatrix();batch.setMatrixAt(i,mesh.matrix);world.remove(mesh)});batch.computeBoundingSphere();world.add(batch)}
  }
  function makeWeapon(){
    viewmodel=new THREE.Group();camera.add(viewmodel);const light=new THREE.PointLight(0xffe8ca,3,3);viewmodel.add(light);light.position.set(.1,.4,0);
    const rifle=weaponId==='vx7',len=rifle?.8:.64;
    box(viewmodel,0,0,0,.13,.17,len,dark,false);box(viewmodel,0,.075,-.13,.15,.07,.42,material('#56625f',.5),false);
    box(viewmodel,0,-.13,.1,.09,.22,.13,dark,false).rotation.x=-.2;
    box(viewmodel,0,-.15,-.09,.09,.25,.15,material('#58645d',.5),false).rotation.x=.12;
    box(viewmodel,0,.025,len/2+.1,.12,.15,.25,material('#45524f',.45),false);
    const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.026,.026,.35,8),dark);barrel.rotation.x=Math.PI/2;barrel.position.set(0,.015,-len/2-.13);viewmodel.add(barrel);
    box(viewmodel,0,.145,-.11,.065,.09,.13,dark,false);box(viewmodel,0,.195,-.11,.048,.015,.1,glass,false);
    for(let z=-.31;z<.12;z+=.07)box(viewmodel,0,.118,z,.12,.025,.016,trim,false);
    box(viewmodel,.015,-.12,.24,.14,.1,.25,material('#a7987c'),false);
    box(viewmodel,-.045,-.09,-.21,.1,.09,.23,material('#a7987c'),false);
    muzzle=new THREE.Mesh(new THREE.ConeGeometry(.09,.2,6),new THREE.MeshBasicMaterial({color:0xffd477,transparent:true,opacity:.9,depthTest:false}));muzzle.rotation.x=-Math.PI/2;muzzle.position.set(0,.015,-len/2-.36);muzzle.visible=false;viewmodel.add(muzzle);
    viewmodel.position.set(.25,-.24,-.54);
  }
  function makeBot(i,spawn){
    const group=new THREE.Group(),armor=material(i%2?'#68756f':'#7d8275',.4,.55),joint=material('#263436',.5),visor=new THREE.MeshStandardMaterial({color:0xff8b51,emissive:0xff6a2a,emissiveIntensity:1.2,metalness:.5,roughness:.25});
    box(group,0,1.15,0,.65,.65,.38,armor);box(group,0,1.69,0,.4,.35,.37,joint);box(group,0,1.72,-.2,.32,.1,.035,visor,false);
    box(group,-.22,.4,0,.19,.7,.21,joint);box(group,.22,.4,0,.19,.7,.21,joint);box(group,-.43,1.1,0,.19,.58,.22,armor);box(group,.43,1.1,-.1,.19,.58,.22,armor);box(group,.25,1.15,-.42,.13,.13,.65,joint);
    group.position.set(spawn.x,0,spawn.z);world.add(group);
    return {id:i,group,pos:group.position,health:100,alive:true,respawn:0,shoot:1+i*.21,path:[],pathAt:0,moveSeed:i*.7,visor};
  }
  function canStand(x,z,r=.4){const hw=(map?.width||100)/2,hd=(map?.depth||100)/2;if(Math.abs(x)>hw-r||Math.abs(z)>hd-r)return false;for(const b of colliders)if(x>b.min.x-r&&x<b.max.x+r&&z>b.min.z-r&&z<b.max.z+r)return false;return true}
  function moveActor(pos,dx,dz,r){if(canStand(pos.x+dx,pos.z,r))pos.x+=dx;if(canStand(pos.x,pos.z+dz,r))pos.z+=dz}
  function makeGrid(){gridW=Math.ceil((map.width||100)/CELL);gridD=Math.ceil((map.depth||100)/CELL);grid=new Uint8Array(gridW*gridD);for(let z=0;z<gridD;z++)for(let x=0;x<gridW;x++){const p=cellPoint(z*gridW+x);grid[z*gridW+x]=canStand(p.x,p.z,.65)?1:0}}
  function cellIndex(pos){const x=THREE.MathUtils.clamp(Math.floor((pos.x+(map.width||100)/2)/CELL),0,gridW-1),z=THREE.MathUtils.clamp(Math.floor((pos.z+(map.depth||100)/2)/CELL),0,gridD-1);return z*gridW+x}
  function cellPoint(id){return {x:(id%gridW+.5)*CELL-(map.width||100)/2,z:(Math.floor(id/gridW)+.5)*CELL-(map.depth||100)/2}}
  function route(from,to){const start=cellIndex(from),end=cellIndex(to);const prev=new Int32Array(grid.length);prev.fill(-1);const queue=new Int32Array(grid.length);let read=0,write=1;queue[0]=start;prev[start]=start;let best=start,bestDist=1e9;while(read<write){const id=queue[read++],p=cellPoint(id),dist=(p.x-to.x)**2+(p.z-to.z)**2;if(dist<bestDist){best=id;bestDist=dist}if(id===end)break;for(const n of [id-1,id+1,id-gridW,id+gridW]){if(n<0||n>=grid.length||prev[n]!==-1||!grid[n]||Math.abs(n%gridW-id%gridW)>1)continue;prev[n]=id;queue[write++]=n}}const path=[];for(let n=best;n!==start&&n!==-1;n=prev[n])path.push(cellPoint(n));return path.reverse()}
  function lineBlocked(from,to){v2.copy(to).sub(from);const length=v2.length();ray.set(from,v2.normalize());for(const b of colliders){const hit=ray.intersectBox(b,hitPoint);if(hit&&hit.distanceTo(from)<length-.15)return true}return false}
  function reload(){if(phase!=='playing'||reloadLeft>0||ammo>=WEAPONS[weaponId].mag||reserve<=0)return;reloadLeft=WEAPONS[weaponId].reload;event('reload','MAGAZINWECHSEL');emit()}
  function shoot(){const w=WEAPONS[weaponId];if(reloadLeft||clock-shotAt<w.rate||input.sprint&&!input.aim)return;if(ammo<=0){reload();return}shotAt=clock;ammo--;shotsFired++;event('shoot','');recoil=Math.min(.13,recoil+.065);muzzle.visible=true;
    const spread=w.spread*(input.aim?.24:1);v1.set((Math.random()-.5)*spread,(Math.random()-.5)*spread,-1).normalize().applyQuaternion(camera.quaternion);ray.set(camera.position,v1);let nearest=150,hitBot=null;
    for(const b of colliders){const hit=ray.intersectBox(b,hitPoint);if(hit)nearest=Math.min(nearest,hit.distanceTo(camera.position))}
    for(const bot of bots){if(!bot.alive)continue;sphere.center.copy(bot.pos);sphere.center.y=1.1;sphere.radius=.64;const hit=ray.intersectSphere(sphere,hitPoint);if(hit&&hit.distanceTo(camera.position)<nearest){nearest=hit.distanceTo(camera.position);hitBot=bot}}
    if(hitBot){hitBot.health-=w.damage;hitBot.visor.emissiveIntensity=4;event('hit','TREFFER');if(hitBot.health<=0){hitBot.alive=false;hitBot.respawn=3.5;hitBot.group.visible=false;kills++;streak++;score+=100;event('kill','TRAININGSBOT AUSGESCHALTET · +100')}}
  }
  function damage(amount){if(invincible>0||phase!=='playing')return;health=Math.max(0,health-amount);regenAt=clock+4;event('hurt','TREFFER ERHALTEN');if(!health){deaths++;streak=0;phase='respawn';respawnLeft=3;input.fire=false;event('hurt','NEUER EINSATZ IN 3 SEKUNDEN');emit()}}
  function spawnPlayer(){position.set(map.spawn.x,1.7,map.spawn.z);yaw=map.spawn.yaw||0;pitch=0;health=100;ammo=WEAPONS[weaponId].mag;reserve=Math.max(reserve,WEAPONS[weaponId].mag*3);reloadLeft=0;invincible=2.5;regenAt=clock+4;phase='playing';camera.position.copy(position);camera.rotation.set(pitch,yaw,0);event('spawn','EINSATZ BEREIT')}
  function start(nextMap='north',nextWeapon='vx7'){mapId=MAPS[nextMap]?nextMap:'north';weaponId=WEAPONS[nextWeapon]?nextWeapon:'vx7';map=MAPS[mapId];clearWorld();clock=0;shotsFired=0;shotAt=-9;health=100;ammo=WEAPONS[weaponId].mag;reserve=WEAPONS[weaponId].reserve;kills=deaths=score=capture=streak=0;time=120;reloadLeft=respawnLeft=0;captureTick=0;recoil=0;Object.assign(input,{forward:0,right:0,fire:false,aim:false,sprint:false});environment();makeWeapon();bots=Array.from({length:5},(_,i)=>makeBot(i,map.botSpawns[i%map.botSpawns.length]));spawnPlayer();emit()}
  function updateBots(dt){for(const bot of bots){if(!bot.alive){bot.respawn-=dt;if(bot.respawn<=0){const spawns=[...map.botSpawns].sort((a,b)=>Math.hypot(b.x-position.x,b.z-position.z)-Math.hypot(a.x-position.x,a.z-position.z)),spawn=spawns[bot.id%Math.min(3,spawns.length)];bot.pos.set(spawn.x,0,spawn.z);bot.health=100;bot.alive=true;bot.group.visible=true;bot.pathAt=0;bot.shoot=1.2}continue}
    bot.visor.emissiveIntensity=THREE.MathUtils.lerp(bot.visor.emissiveIntensity,1.2,dt*8);const dist=Math.hypot(position.x-bot.pos.x,position.z-bot.pos.z);v1.set(bot.pos.x,1.45,bot.pos.z);const visible=dist<44&&!lineBlocked(v1,position);
    bot.group.rotation.y=Math.atan2(bot.pos.x-position.x,bot.pos.z-position.z);
    if(clock>=bot.pathAt){let goal=visible&&dist>11?{x:position.x+Math.cos(bot.moveSeed)*4,z:position.z+Math.sin(bot.moveSeed)*4}:{x:map.objective.x+Math.cos(bot.moveSeed+clock*.05)*3,z:map.objective.z+Math.sin(bot.moveSeed+clock*.05)*3};bot.path=route(bot.pos,goal);bot.pathAt=clock+1.2+bot.id*.07}
    if(bot.path.length&&(!visible||dist>12)){const p=bot.path[0],dx=p.x-bot.pos.x,dz=p.z-bot.pos.z,len=Math.hypot(dx,dz);if(len<.4)bot.path.shift();else moveActor(bot.pos,dx/len*dt*3.5,dz/len*dt*3.5,.4)}
    bot.shoot-=dt;if(visible&&bot.shoot<=0&&phase==='playing'){bot.shoot=.65+bot.id*.07;bot.visor.emissiveIntensity=3;if(Math.random()<Math.max(.2,.8-dist*.01))damage(6+Math.floor(Math.random()*4))}
  }}
  function update(dt){clock+=dt;time=Math.max(0,time-dt);invincible=Math.max(0,invincible-dt);if(time<=0){phase='finished';input.fire=false;event('finished','EINSATZ ABGESCHLOSSEN');emit();return}
    if(phase==='respawn'){respawnLeft-=dt;if(respawnLeft<=0)spawnPlayer()}else{
      const f=input.forward,r=input.right,len=Math.max(1,Math.hypot(f,r)),speed=(input.sprint&&!input.aim?8:input.aim?3:5.2)*dt;
      moveActor(position,(-Math.sin(yaw)*f+Math.cos(yaw)*r)/len*speed,(-Math.cos(yaw)*f-Math.sin(yaw)*r)/len*speed,.36);bob+=dt*Math.hypot(f,r)*10;
      if(reloadLeft>0){reloadLeft=Math.max(0,reloadLeft-dt);if(!reloadLeft){const add=Math.min(WEAPONS[weaponId].mag-ammo,reserve);ammo+=add;reserve-=add;emit()}}
      if(health<100&&clock>regenAt)health=Math.min(100,health+18*dt);
      camera.position.copy(position);camera.position.y+=Math.sin(bob)*.025*Math.min(1,Math.hypot(f,r));camera.rotation.set(pitch,yaw,0);
      if(input.fire)shoot();
      const obj=map.objective,inside=Math.hypot(position.x-obj.x,position.z-obj.z)<obj.radius,contested=bots.some(b=>b.alive&&Math.hypot(b.pos.x-obj.x,b.pos.z-obj.z)<obj.radius);
      if(inside&&!contested){capture=Math.min(100,capture+32*dt);if(capture>=100){captureTick+=dt;if(captureTick>=1){score+=25;captureTick-=1}}}else if(!inside)capture=Math.max(0,capture-10*dt);
      objectiveRing.material.color.set(inside?(contested?0xf28a5c:0x7ce6bc):0xe8b955);
    }
    updateBots(dt);
  }
  function render(now){if(destroyed)return;frame=requestAnimationFrame(render);const dt=Math.min(.05,(now-(render.last||now))/1000);render.last=now;
    if(phase==='playing'||phase==='respawn')update(dt);
    if(viewmodel){recoil=Math.max(0,recoil-dt*.65);const a=input.aim&&phase==='playing',t=1-Math.exp(-dt*14);viewmodel.position.x=THREE.MathUtils.lerp(viewmodel.position.x,a?0:.25,t);viewmodel.position.y=THREE.MathUtils.lerp(viewmodel.position.y,a?-.19:-.24,t);viewmodel.position.z=(a?-.44:-.54)+recoil+Math.sin(bob*.5)*.005;viewmodel.rotation.x=recoil*.5+(reloadLeft?-.3*Math.sin(reloadLeft/WEAPONS[weaponId].reload*Math.PI):0);viewmodel.rotation.z=reloadLeft?-.25:0;muzzle.visible=clock-shotAt<.045&&phase==='playing';camera.fov=THREE.MathUtils.lerp(camera.fov,a?51:76,t);camera.updateProjectionMatrix();viewmodel.visible=phase!=='respawn'&&phase!=='menu'}
    if(now-hudAt>100){hudAt=now;emit()}renderer.render(scene,camera);
  }
  function resize(){const w=container.clientWidth||innerWidth,h=container.clientHeight||innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
  const observer=new ResizeObserver(resize);observer.observe(container);resize();frame=requestAnimationFrame(render);emit();
  function pause(){if(phase==='playing'||phase==='respawn'){pause.previous=phase;phase='paused';Object.assign(input,{forward:0,right:0,fire:false,aim:false,sprint:false});emit()}}
  function resume(){if(phase==='paused'){phase=pause.previous||'playing';emit()}}
  function visibility(){if(document.hidden)pause()};document.addEventListener('visibilitychange',visibility);
  return {start,pause,resume,restart(){start(mapId,weaponId)},setInput(next){for(const k of ['forward','right'])if(k in next)input[k]=THREE.MathUtils.clamp(Number(next[k])||0,-1,1);for(const k of ['fire','aim','sprint'])if(k in next)input[k]=Boolean(next[k])},look(dx,dy){if(phase!=='playing')return;yaw-=THREE.MathUtils.clamp(Number(dx)||0,-200,200)*.003;pitch=THREE.MathUtils.clamp(pitch-(Number(dy)||0)*.003,-1.35,1.35)},reload,getState:state,getDebugState(){return {player:{x:position.x,z:position.z},shotsFired,position:{x:position.x,y:position.y,z:position.z},yaw,pitch,phase,loaded:!!map,map:mapId,colliders:colliders.length,bots:bots.map(b=>({id:b.id,x:b.pos.x,z:b.pos.z,health:b.health,alive:b.alive,pathLength:b.path.length})),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,respawnLeft,invincible}},dispose(){destroyed=true;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',visibility);const geometries=new Set(),mats=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mats.add(m))});geometries.forEach(g=>g.dispose());mats.forEach(m=>{m.map?.dispose();m.dispose()});renderer.dispose();renderer.domElement.remove()}};
}
