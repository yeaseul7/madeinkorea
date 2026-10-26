import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameClock } from '../src/scripts/jinjin-clock.mjs';
import { createCatchGame } from '../src/scripts/jinjin-catch-engine.mjs';
function scheduler() {
 const callbacks=new Map();let id=0,time=0;
 return { callbacks, options:{ now:()=>time,schedule:fn=>{callbacks.set(++id,fn);return id;},cancel:id=>callbacks.delete(id)}, at(t){time=t;[...callbacks.values()].forEach(fn=>fn());} };
}
test('freshly started round continues spawning and finishes even without animation frames',()=>{
 const s=scheduler(),game=createCatchGame(()=>0);game.start(0);
 const seen=new Set(game.state().targets.map(t=>t.id));
 const clock=createGameClock(now=>{const state=game.tick(now);state.targets.forEach(t=>seen.add(t.id));return state.phase==='playing';},s.options);
 clock.start();game.hit(game.state().targets[0].index,10);
 for(let t=33;t<=30030;t+=33)s.at(t);
 assert.ok(seen.size>10);assert.equal(game.state().remaining,0);assert.equal(game.state().phase,'ended');assert.equal(s.callbacks.size,0);
});
test('restart replaces the old loop and pause cancels ticks until resumed',()=>{
 const s=scheduler();let calls=0;
 const clock=createGameClock(()=>{calls++;return true;},s.options);
 clock.start();clock.start();assert.equal(s.callbacks.size,1);
 s.at(100);assert.equal(calls,1);clock.stop();s.at(200);assert.equal(calls,1);
 clock.start();s.at(300);assert.equal(calls,2);clock.stop();assert.equal(s.callbacks.size,0);
});
