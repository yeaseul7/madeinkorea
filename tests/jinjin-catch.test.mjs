import test from 'node:test';
import assert from 'node:assert/strict';
import { createCatchGame, LEVELS } from '../src/scripts/jinjin-catch-engine.mjs';
const first = game => game.state().targets[0];

test('only visible targets score once; empty jars do nothing', () => {
 const game=createCatchGame(()=>0); assert.equal(game.hit(0,0),false);
 game.start(0); assert.equal(game.state().targets.length,1); assert.equal(first(game).appeared,0); assert.equal(game.hit(1,100),false); game.tick(400);
 assert.equal(game.hit(1,410),false); assert.equal(game.hit(0,420),true);
 assert.equal(game.hit(0,421),false); assert.equal(game.state().score,100);
 game.tick(640); assert.equal(first(game).index,1);
});
test('six exact five-second boundaries, per-level caps, exposure and independent arrivals', () => {
 const game=createCatchGame(()=>.4); game.start(0);
 const maxima=Array(6).fill(0); const seen=new Set();
 for(let now=0;now<30000;now+=10){
  const state=game.tick(now);const level=Math.floor(now/5000)+1;
  assert.equal(state.level,level);assert.ok(state.targets.length<=LEVELS[level-1].max);
  assert.equal(new Set(state.targets.map(t=>t.index)).size,state.targets.length);
  maxima[level-1]=Math.max(maxima[level-1],state.targets.length);
  for(const target of state.targets){
   assert.ok(!target.fake);
   if(!seen.has(target.id)){
    const spawnLevel=Math.floor(target.appeared/5000);
    assert.equal(target.until-target.appeared,Math.min(LEVELS[spawnLevel].exposure,30000-target.appeared));
    seen.add(target.id);
   }
  }
  if(state.targets.length>1) assert.equal(new Set(state.targets.map(t=>t.appeared)).size,state.targets.length);
 }
 assert.deepEqual(maxima,[1,2,3,3,4,5]);
 assert.equal(game.tick(30000).phase,'ended');assert.deepEqual(game.state().targets,[]);
});
test('expired targets and clicks at the deadline never score',()=>{
 const game=createCatchGame(()=>0);game.start(0);game.tick(400);
 assert.equal(game.hit(0,1600),false);game.tick(29900);
 assert.equal(game.hit(first(game).index,30000),false);assert.equal(game.state().score,0);
});
test('concurrent targets can each be caught; catching one leaves the others untouched',()=>{
 const game=createCatchGame(()=>.2);game.start(0);game.tick(10000);game.tick(10270);game.tick(10540);
 const targets=game.state().targets;assert.equal(targets.length,3);
 targets.forEach(t=>assert.equal(game.hit(t.index,10541),true));
 assert.equal(game.state().score,300);assert.equal(game.state().combo,3);assert.deepEqual(game.state().targets,[]);
});
test('pause freezes stage, spawn delay and every target remaining lifetime',()=>{
 const game=createCatchGame(()=>.4);game.start(0);game.tick(10000);game.tick(10270);
 const before=game.pause(10300);assert.equal(before.level,3);assert.deepEqual(before.targets,[]);
 game.tick(90000);assert.equal(game.state().remaining,19700);
 game.resume(90000);const targets=game.state().targets;
 assert.equal(targets.length,2);assert.equal(targets[0].until-90000,550);assert.equal(targets[1].until-90000,820);
 assert.equal(game.tick(90549).targets.some(t=>t.id===targets[0].id),true);
 assert.equal(game.tick(90550).targets.some(t=>t.id===targets[0].id),false);
 assert.equal(game.tick(94699).level,3);assert.equal(game.tick(94700).level,4);
 assert.equal(game.tick(109700).phase,'ended');
 game.start(120000);assert.equal(game.state().level,1);assert.equal(game.state().score,0);assert.equal(game.state().combo,0);
});
test('multipliers apply after five and ten catches',()=>{
 const game=createCatchGame(()=>0);game.start(0);let now=400;
 [100,200,300,400,500,650,800,950,1100,1250,1450].forEach((total,i)=>{
  game.tick(now);game.hit(first(game).index,now+1);
  assert.equal(game.state().score,total);assert.equal(game.state().combo,i+1);now+=221;
 });
});
test('other dogs cost 50 and reset combo; missing any dog preserves combo',()=>{
 for(const decoy of [false,true]){
  let calls=0;const game=createCatchGame(()=>(++calls===4&&decoy?.6:0));
  game.start(0);game.tick(400);game.hit(0,401);game.tick(621);
  assert.equal(first(game).kind,decoy?'gold':'jinjin');
  game.tick(1821);assert.equal(game.state().combo,1);
 }
 let calls=0;const game=createCatchGame(()=>(++calls===4?.8:0));
 game.start(0);game.tick(400);game.hit(0,401);game.tick(621);
 game.hit(first(game).index,622);assert.equal(game.state().score,50);assert.equal(game.state().combo,0);
 const negative=createCatchGame(()=>.9);negative.start(0);negative.tick(400);negative.hit(first(negative).index,401);
 assert.equal(negative.state().score,-50);
});
test('fake appearances begin at 20 seconds and retain character identity and scoring',()=>{
 const game=createCatchGame(()=>0);game.start(0);game.tick(19999);
 assert.equal(first(game).fake,false);assert.equal(first(game).until-first(game).appeared,700);
 game.tick(20000);const fake=game.state().targets.find(t=>t.fake);
 assert.equal(fake.kind,'jinjin');assert.equal(fake.until-fake.appeared,360);
 assert.equal(game.hit(fake.index,20001),true);assert.equal(game.state().score,100);
 game.tick(25000);const rush=first(game);assert.equal(rush.fake,true);assert.equal(rush.until-rush.appeared,300);
});
test('large clock jumps do not replay expired spawns or overflow jars',()=>{
 const game=createCatchGame(()=>.4);game.start(0);game.tick(400);
 const state=game.tick(27000);assert.equal(state.level,6);assert.equal(state.targets.length,1);
 assert.equal(first(game).appeared,27000);
});

test('a hit retires immediately, cannot score twice, and reserves its jar during the exit',()=>{
 const game=createCatchGame(()=>0);game.start(0);game.tick(25000);
 const target=first(game);assert.equal(game.hit(target.index,25001),true);
 assert.ok(!game.state().targets.some(t=>t.id===target.id));
 assert.ok(game.state().retiring.some(t=>t.id===target.id));
 assert.equal(game.hit(target.index,25002),false);
 for(let now=25003;now<25161;now++){
  game.tick(now);assert.ok(!game.state().targets.some(t=>t.index===target.index));
 }
 game.tick(25161);assert.ok(!game.state().retiring.some(t=>t.id===target.id));
});
test('clicking an empty jar never hits a new target spawned by the same event',()=>{
 const game=createCatchGame(()=>0);game.start(0);
 assert.equal(game.hit(1,1400),false);assert.equal(game.state().score,0);
 assert.equal(game.hit(1,1401),true);
});
test('active and retiring appearances never overlap, even under rapid clicking',()=>{
 const game=createCatchGame(()=>.3);game.start(0);
 for(let now=0;now<30000;now+=10){
  const s=game.tick(now);const occupied=[...s.targets,...s.retiring];
  assert.equal(new Set(occupied.map(t=>t.index)).size,occupied.length);
  for(const t of s.targets)game.hit(t.index,now);
 }
});

test('the first catch is followed by a new visible target without stopping the round',()=>{
 const game=createCatchGame(()=>0);game.start(0);
 const initial=first(game);assert.ok(initial);
 game.hit(initial.index,10);
 assert.equal(game.state().targets.length,0);
 const followup=game.tick(130);
 assert.equal(followup.phase,'playing');
 assert.equal(followup.targets.length,1);
 assert.notEqual(followup.targets[0].index,initial.index);
 assert.equal(followup.remaining,29870);
 game.tick(6000);assert.ok(game.state().targets.length>0);
});

test('missing targets preserves an earned multiplier and the next Jinjin bonus',()=>{
 const game=createCatchGame(()=>0);game.start(0);let now=0;
 for(let i=0;i<5;i++) {game.tick(now);game.hit(first(game).index,now+1);now+=221;}
 assert.equal(game.state().multiplier,1.5);
 game.tick(now);game.tick(now+1300);
 assert.equal(game.state().combo,5);assert.equal(game.state().multiplier,1.5);
 game.tick(now+1500);const target=first(game);assert.ok(target);
 game.hit(target.index,now+1501);assert.equal(game.state().score,650);
 game.tick(30000);assert.equal(game.state().combo,6);
});

test('round results count catches by kind, empty taps and missed Jinjin exactly once',()=>{
 const game=createCatchGame(()=>0);game.start(0);
 const firstTarget=first(game);game.hit(firstTarget.index,1);game.hit(8,2);
 assert.equal(game.state().stats.caught.jinjin,1);assert.equal(game.state().stats.empty,1);
 game.tick(121);game.tick(1321);assert.equal(game.state().stats.missed,1);
 game.tick(1322);assert.equal(game.state().stats.missed,1);
 game.tick(1501);game.tick(30000);const missed=game.state().stats.missed;
 game.tick(31000);assert.equal(game.state().stats.missed,missed);
 const snapshot=game.state();snapshot.stats.caught.jinjin=999;
 assert.equal(game.state().stats.caught.jinjin,1);
 game.start(32000);assert.deepEqual(game.state().stats,{caught:{jinjin:0,white:0,gold:0,black:0},missed:0,empty:0});
 const wrong=createCatchGame(()=>.9);wrong.start(0);const dog=first(wrong);
 wrong.hit(dog.index,1);assert.equal(wrong.state().stats.caught[dog.kind],1);assert.equal(wrong.state().score,-50);
});
