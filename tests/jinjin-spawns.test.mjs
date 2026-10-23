import test from 'node:test';
import assert from 'node:assert/strict';
import { createSpawnDirector } from '../src/scripts/jinjin-spawns.mjs';
function seeded(seed) { return () => ((seed = (Math.imul(seed,1664525) + 1013904223) >>> 0) / 4294967296); }

test('long-run character mix is 35% Jinjin and equally shared decoys, with no long drought',()=>{
 for(const random of [()=>0,()=>.999999,seeded(7),seeded(381)]){
  const director=createSpawnDirector(random);let streak=0;
  for(let batch=0;batch<100;batch++){
   const counts={jinjin:0,white:0,gold:0,black:0};
   for(let n=0;n<60;n++){
    const kind=director.nextKind();counts[kind]++;
    streak=kind==='jinjin'?0:streak+1;assert.ok(streak<=4);
   }
   assert.deepEqual(counts,{jinjin:21,white:13,gold:13,black:13});
  }
 }
});
test('recent jars are avoided when alternatives exist and only available jars are selected',()=>{
 const director=createSpawnDirector(seeded(42));const history=[];
 const counts=Array(9).fill(0);
 for(let n=0;n<9000;n++){
  const index=director.nextJar([0,1,2,3,4,5,6,7,8]);
  assert.ok(!history.slice(-3).includes(index));history.push(index);counts[index]++;
 }
 assert.ok(Math.max(...counts)-Math.min(...counts)<150);
 assert.equal(director.nextJar([]),null);
 assert.equal(director.nextJar([4]),4);
 for(let n=0;n<30;n++)assert.ok([2,6].includes(director.nextJar([2,6])));
});
test('different seeds produce different character sequences',()=>{
 const a=createSpawnDirector(seeded(1)),b=createSpawnDirector(seeded(2));
 assert.notDeepEqual(Array.from({length:60},()=>a.nextKind()),Array.from({length:60},()=>b.nextKind()));
});
