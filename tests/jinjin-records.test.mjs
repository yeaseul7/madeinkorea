import test from 'node:test';
import assert from 'node:assert/strict';
import { readRecords,saveRecords,RECORD_KEY } from '../src/scripts/jinjin-records.mjs';
import { createCatchGame } from '../src/scripts/jinjin-catch-engine.mjs';
function memory(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};}
test('personal records survive reloads, do not decrease, and retain independent combo bests',()=>{
 const storage=memory();assert.equal(readRecords(storage).played,false);
 assert.equal(saveRecords(storage,550,8).newBest,true);
 assert.deepEqual(readRecords(storage),{version:1,played:true,bestScore:550,maxCombo:8});
 const next=saveRecords(storage,300,10);assert.equal(next.newBest,false);assert.equal(next.record.bestScore,550);assert.equal(next.record.maxCombo,10);
 assert.equal(saveRecords(storage,550,4).newBest,false);
 assert.equal(saveRecords(storage,650,2).newBest,true);
});
test('malformed records and unavailable storage do not break the game',()=>{
 const storage=memory();storage.setItem(RECORD_KEY,'broken');assert.equal(readRecords(storage).played,false);
 storage.setItem(RECORD_KEY,JSON.stringify({version:1,played:true,bestScore:'900',maxCombo:2}));assert.equal(readRecords(storage).played,false);
 const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
 const first=saveRecords(blocked,-50,0);assert.equal(first.saved,false);assert.equal(first.record.bestScore,-50);
 const second=saveRecords(blocked,-100,0,first.record);assert.equal(second.record.bestScore,-50);
});
test('game remembers its maximum combo even after a wrong catch and resets it for a new round',()=>{
 let calls=0;const game=createCatchGame(()=>++calls===4?.8:0);game.start(0);
 game.hit(game.state().targets[0].index,1);assert.equal(game.state().maxCombo,1);
 game.tick(121);game.hit(game.state().targets[0].index,122);
 assert.equal(game.state().combo,0);assert.equal(game.state().maxCombo,1);
 game.start(200);assert.equal(game.state().maxCombo,0);
});
