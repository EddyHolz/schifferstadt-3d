import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
// Load as ESM regardless of the host project's package.json module setting.
const text = readFileSync(new URL('../dist/maps.js', import.meta.url), 'utf8');
const {MAPS} = await import(`data:text/javascript;base64,${Buffer.from(text).toString('base64')}`);
const radius=.65, step=1;
for (const map of Object.values(MAPS)) {
  const limitX=map.width/2-radius, limitZ=map.depth/2-radius;
  const free=(x,z)=>Math.abs(x)<limitX && Math.abs(z)<limitZ &&
    !map.boxes.some(b=>Math.abs(x-b.x)<b.w/2+radius && Math.abs(z-b.z)<b.d/2+radius);
  for (const b of map.boxes) {
    for (const key of ['x','z','w','d','h']) assert(Number.isFinite(b[key]),`${map.id}: invalid ${key}`);
    assert(b.w>0 && b.d>0 && b.h>0);
    assert(Math.abs(b.x)+b.w/2<map.width/2 && Math.abs(b.z)+b.d/2<map.depth/2);
  }
  const targets=[map.spawn,map.objective,...map.botSpawns,...map.waypoints];
  for(const p of targets) assert(free(p.x,p.z),`${map.id}: blocked point ${JSON.stringify(p)}`);
  const seen=new Set(), queue=[[Math.round(map.spawn.x),Math.round(map.spawn.z)]];
  seen.add(queue[0].join(','));
  for(let i=0;i<queue.length;i++){
    const [x,z]=queue[i];
    for(const [dx,dz] of [[step,0],[-step,0],[0,step],[0,-step]]){
      const nx=x+dx,nz=z+dz,key=`${nx},${nz}`;
      if(!seen.has(key)&&free(nx,nz)){seen.add(key);queue.push([nx,nz]);}
    }
  }
  for(const p of targets) assert(seen.has(`${Math.round(p.x)},${Math.round(p.z)}`),`${map.id}: unreachable target`);
  for(const lane of map.lanes) for(let i=1;i<lane.length;i++){
    const a=lane[i-1],b=lane[i],samples=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)*4);
    for(let n=0;n<=samples;n++) assert(free(a.x+(b.x-a.x)*n/samples,a.z+(b.z-a.z)*n/samples),`${map.id}: lane obstructed`);
  }
  // Bots cannot fire down an unobstructed sightline into the initial spawn.
  for(const bot of map.botSpawns) {
    const samples=Math.ceil(Math.hypot(bot.x-map.spawn.x,bot.z-map.spawn.z)*10);
    let screened=false;
    for(let n=1;n<samples;n++) {
      const x=map.spawn.x+(bot.x-map.spawn.x)*n/samples;
      const z=map.spawn.z+(bot.z-map.spawn.z)*n/samples;
      if(map.boxes.some(b=>b.h>=1.7 && Math.abs(x-b.x)<=b.w/2 && Math.abs(z-b.z)<=b.d/2)) { screened=true; break; }
    }
    assert(screened,`${map.id}: exposed initial spawn to ${JSON.stringify(bot)}`);
  }
  // The immediate start must have room for a player to turn and move out.
  for(let angle=0;angle<Math.PI*2;angle+=Math.PI/8)
    assert(free(map.spawn.x+2*Math.cos(angle),map.spawn.z+2*Math.sin(angle)),`${map.id}: cramped spawn`);
  console.log(`${map.name}: ${map.boxes.length} solids, ${queue.length} reachable grid cells; all spawns/objective/waypoints and 3 lanes clear.`);
}
