/** Original, fictional sport arenas. No real school address, footprint or floor plan. */
const box = (x,z,w,d,h,kind,color) => ({x,z,w,d,h,kind,color});
function arena(spec) {
  return {...spec, width:100, depth:100, bounds:{width:100,depth:100},
    obstacles:spec.boxes, fictional:true,
    description:'Frei erfundene Wettkampfarena. Keine Nachbildung einer realen Schule.'};
}
export const MAPS = {
  north: arena({
    id:'north', name:'Nordcampus', subtitle:'Backsteinhof · drei offene Routen',
    spawn:{x:0,z:41,yaw:0}, objective:{x:0,z:-7,radius:6},
    botSpawns:[{x:-36,z:-39},{x:0,z:-41},{x:36,z:-39}],
    palette:{sky:0xb9d4df,ground:0x8a948d,wall:0x9b6250,accent:0xffc56c},
    boxes:[
      box(0,33,5,2,2.3,'cover',0xb3b0a1),
      // Four separate wings frame a courtyard; middle and both flank lanes stay open.
      box(-21,18,18,18,8,'brick',0x9b6250),
      box(21,18,18,18,8,'brick',0xae735b),
      box(-21,-21,18,20,10,'brick',0x935a49),
      box(21,-21,18,20,10,'brick',0xa36a54),
      // Low courtyard cover allows alternating peeks without closing the crossroads.
      box(-8,-3,5,3,1.5,'planter',0x697e68),
      box(9,3,5,3,1.5,'planter',0x697e68),
      box(-33,6,3,8,1.8,'cover',0xb3b0a1),
      box(33,-7,3,8,1.8,'cover',0xb3b0a1),
      box(-16,37,6,3,1.5,'cover',0xb3b0a1),
      box(16,-39,6,3,1.5,'cover',0xb3b0a1),
      box(29,37,5,5,2.4,'crate',0x88734e),
      box(-23,-39,5,5,2.4,'crate',0x88734e)
    ],
    waypoints:[{x:0,z:41},{x:0,z:29},{x:-37,z:30},{x:37,z:30},
      {x:-37,z:0},{x:0,z:0},{x:37,z:0},{x:-37,z:-39},{x:0,z:-41},
      {x:37,z:-39},{x:0,z:-7}],
    lanes:[[{x:-37,z:39},{x:-37,z:0},{x:-37,z:-39}],
      [{x:0,z:41},{x:7,z:36},{x:7,z:28},{x:0,z:0},{x:0,z:-41}],
      [{x:37,z:39},{x:37,z:0},{x:37,z:-39}]]
  }),
  south: arena({
    id:'south', name:'Südcampus', subtitle:'Sporthalle & Ladehof · drei offene Routen',
    spawn:{x:0,z:41,yaw:0}, objective:{x:10,z:-7,radius:6},
    botSpawns:[{x:-43,z:-40},{x:0,z:-41},{x:40,z:-40}],
    palette:{sky:0xcad9db,ground:0x929c9d,wall:0xc4cbc6,accent:0x66d5cf},
    boxes:[
      box(0,33,5,2,2.3,'cover',0x818d90),
      // A broad gym creates a long western bypass and a connected central service lane.
      box(-25,-6,26,34,11,'gym',0xb8c2be),
      box(25,20,18,22,8,'concrete',0xc7ccc8),
      box(26,-28,16,18,9,'concrete',0xaab9b5),
      // Loading-yard cover is staggered rather than a complete cross-map barricade.
      box(7,18,5,10,2.5,'crate',0x77938a),
      box(24,-4,8,4,1.6,'cover',0x818d90),
      box(-22,29,9,4,1.6,'cover',0x818d90),
      box(-7,29,4,7,1.6,'cover',0x818d90),
      box(42,5,4,7,1.6,'cover',0x818d90),
      box(7,-29,5,8,2.5,'crate',0x77938a),
      box(-28,-35,7,5,2.5,'crate',0x77938a),
      box(25,40,8,3,1.4,'planter',0x688779)
    ],
    waypoints:[{x:0,z:41},{x:0,z:29},{x:-43,z:29},{x:40,z:35},
      {x:-43,z:0},{x:0,z:0},{x:10,z:-7},{x:39,z:-8},
      {x:-43,z:-40},{x:0,z:-41},{x:40,z:-40}],
    lanes:[[{x:-40,z:39},{x:-40,z:25},{x:-43,z:10},{x:-43,z:-40}],
      [{x:0,z:41},{x:7,z:36},{x:0,z:27},{x:0,z:0},{x:0,z:-41}],
      [{x:40,z:39},{x:38,z:14},{x:38,z:-8},{x:40,z:-40}]]
  })
};
