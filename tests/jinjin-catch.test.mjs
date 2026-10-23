import test from 'node:test';
import assert from 'node:assert/strict';
import { createCatchGame } from '../src/scripts/jinjin-catch-engine.mjs';

test('only a visible Jinjin scores, once; consecutive spawns use different jars', () => {
  const game = createCatchGame(() => 0);
  assert.equal(game.hit(0, 0), false);
  game.start(0);
  assert.equal(game.hit(0, 100), false);
  assert.equal(game.tick(400).active, 0);
  assert.equal(game.hit(1, 410), false);
  assert.equal(game.hit(0, 420), true);
  assert.equal(game.hit(0, 421), false);
  assert.equal(game.state().score, 100);
  assert.equal(game.tick(640).active, 1);
});
test('expired targets and clicks at the time limit cannot score', () => {
  const game = createCatchGame(() => 0);
  game.start(0); game.tick(400);
  assert.equal(game.hit(0, 1650), false);
  game.tick(29000);
  assert.equal(game.hit(game.state().active, 30000), false);
  assert.equal(game.state().phase, 'ended');
  assert.equal(game.state().remaining, 0);
});
test('pausing freezes the remaining time, resuming restores the pending target, restart resets scores', () => {
  const game = createCatchGame(() => 0);
  game.start(100); game.tick(500); game.hit(0, 550);
  game.pause(1100);
  assert.equal(game.tick(90000).remaining, 29000);
  assert.equal(game.hit(0, 90000), false);
  game.resume(90000);
  assert.equal(game.state().active, 1);
  assert.equal(game.tick(118999).phase, 'playing');
  assert.equal(game.tick(119000).phase, 'ended');
  game.start(120000);
  assert.equal(game.state().score, 0);
  assert.equal(game.state().remaining, 30000);
});

test('multipliers begin after the fifth and tenth successful Jinjin catches', () => {
 const game = createCatchGame(() => 0); game.start(0);
 let now = 400;
 const totals = [100,200,300,400,500,650,800,950,1100,1250,1450];
 totals.forEach((total, i) => {
  const target = game.tick(now).active; game.hit(target, now + 1);
  assert.equal(game.state().score, total);
  assert.equal(game.state().combo, i + 1);
  now += 221;
 });
});
test('other dogs subtract 50 and clear combo; an empty jar does nothing', () => {
 let randomCalls = 0;
 const game = createCatchGame(() => (++randomCalls === 4 ? .8 : 0));
 game.start(0); game.tick(400); game.hit(0,401);
 const target = game.tick(621).active;
 assert.equal(game.state().kind, 'white');
 assert.equal(game.hit((target + 1) % 9,622),false);
 assert.equal(game.state().combo,1);
 game.hit(target,623);
 assert.equal(game.state().score,50);
 assert.equal(game.state().combo,0);
 assert.equal(game.hit(target,624),false);
});
test('missing Jinjin clears combo, but missing another dog does not', () => {
 for (const decoy of [false,true]) {
  let calls=0;
  const game=createCatchGame(() => (++calls===4 && decoy ? .6 : 0));
  game.start(0); game.tick(400);game.hit(0,401);game.tick(621);
  game.tick(2000);
  assert.equal(game.state().combo,decoy ? 1 : 0);
 }
});
test('negative scores are retained and restarting resets the combo and multiplier', () => {
 const game=createCatchGame(()=>.9);game.start(0);const target=game.tick(400).active;
 game.hit(target,401);assert.equal(game.state().score,-50);
 game.start(500);assert.equal(game.state().score,0);assert.equal(game.state().combo,0);assert.equal(game.state().multiplier,1);
});
