import test from 'node:test';
import assert from 'node:assert/strict';
import { createVisibilityPause } from '../src/scripts/jinjin-visibility.mjs';
import { createCatchGame } from '../src/scripts/jinjin-catch-engine.mjs';
test('temporary page hiding resumes the same round and preserves remaining playing time',()=>{
 const game=createCatchGame(()=>0);let now=0;game.start(now);now=7000;
 const visibility=createVisibilityPause({isPlaying:()=>game.state().phase==='playing',pause:()=>game.pause(now),resume:()=>game.resume(now)});
 visibility.hide();assert.equal(game.state().phase,'paused');assert.equal(game.state().remaining,23000);
 visibility.hide();now=60000;visibility.show();assert.equal(game.state().phase,'playing');
 game.tick(61000);assert.equal(game.state().remaining,22000);
 game.tick(83000);assert.equal(game.state().phase,'ended');
 visibility.hide();visibility.show();assert.equal(game.state().phase,'ended');
});
test('manual pauses and the start screen never resume merely because the tab becomes visible',()=>{
 let phase='idle',resumes=0;
 const visibility=createVisibilityPause({isPlaying:()=>phase==='playing',pause:()=>{phase='paused';},resume:()=>{resumes++;phase='playing';}});
 visibility.hide();visibility.show();assert.equal(resumes,0);
 phase='playing';visibility.hide();visibility.manual();visibility.show();assert.equal(phase,'paused');assert.equal(resumes,0);
});
