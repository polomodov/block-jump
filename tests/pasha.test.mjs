import assert from 'node:assert/strict';
import test from 'node:test';
import { createRun } from '../physics.js';
import { performanceAge } from '../guitar.js';

const frame = 1/120;

test('playing the guitar never changes standing, running, jumping or falling trajectories', () => {
  const scenarios = [
    [[.3,{ability:true}], [.5,{}]],
    [[.1,{right:true,ability:true}], [.3,{right:true}]],
    [[.1,{jump:true,ability:true}], [.5,{}]],
    [[.04,{jump:true}], [.3,{ability:true}]],
    [[.45,{jump:true}], [.1,{right:true,ability:true}]],
  ];
  for (const actions of scenarios) {
    const pasha = createRun('temple','pasha'), other = createRun('temple','maxim');
    for (const [dt,input] of actions) {
      pasha.update(dt,input);
      other.update(dt,{...input,ability:false});
      assert.deepEqual(pasha.state.player,other.state.player);
      assert.equal(pasha.state.invulnerable,0);
    }
    assert.ok(pasha.state.solo);
    assert.ok(pasha.state.cooldown > 29);
  }
});

// Place stationary enemies by center offset from the musician on an open bank.
function placeListener(state, index, dx, dy=0) {
  const player = state.player, enemy = state.enemies[index];
  const x = player.x + (player.w-enemy.w)/2 + dx;
  Object.assign(enemy,{ x, y: player.y+(player.h-enemy.h)/2+dy, minX:x, maxX:x, speed:0 });
  return enemy;
}

test('the first chord stops a touching monster and lets Pasha run through it', () => {
  const run = createRun('temple','pasha'), s = run.state;
  const foe = placeListener(s,0,9);
  run.update(frame,{ability:true,right:true});
  assert.equal(foe.dance,5);
  assert.equal(foe.stun,0);
  run.update(.36,{right:true});
  assert.ok(s.player.x > foe.x+foe.w);
  assert.ok(foe.alive && foe.dance < 4.7);
  assert.equal(s.lives,3);
  assert.equal(s.invulnerable,0);
});

test('the wave travels in both directions from a fixed center up to a 120-pixel radius', () => {
  const run = createRun('temple','pasha'), s = run.state;
  s.player.x = 140;
  const left = placeListener(s,0,-70), right = placeListener(s,1,70);
  const edge = placeListener(s,2,120), outside = placeListener(s,3,121);
  const above = placeListener(s,4,0,-121);
  const cx = s.player.x+s.player.w/2, cy = s.player.y+s.player.h/2;
  run.update(.15,{ability:true,right:true});
  assert.equal(left.dance,0);
  assert.equal(right.dance,0);
  run.update(.2,{right:true});
  assert.ok(left.dance > 4.8 && right.dance > 4.8);
  assert.equal(edge.dance,0);
  assert.equal(s.solo.x,cx);
  assert.equal(s.solo.y,cy);
  assert.ok(s.player.x > cx);
  run.update(.25,{});
  assert.equal(edge.dance,5);
  assert.equal(s.solo.front,120);
  assert.equal(outside.dance,0);
  assert.equal(above.dance,0);
  // Once the wave has passed, entering its former radius is safe for the monster.
  outside.x = outside.minX = outside.maxX = cx+27;
  run.update(.6,{});
  assert.equal(s.solo,null);
  assert.equal(outside.dance,0);
});

test('a dancer holds its position for five seconds, then resumes patrol and can hurt Pasha again', () => {
  const run = createRun('temple','pasha'), s = run.state;
  const foe = s.enemies[0];
  s.player.x = foe.x-8;
  const x = foe.x, y = foe.y;
  run.update(frame,{ability:true});
  run.update(4.99,{});
  assert.ok(foe.dance>0 && foe.dance<.02);
  assert.equal(foe.x,x); assert.equal(foe.y,y);
  assert.equal(s.lives,3);
  run.update(.03,{});
  assert.equal(foe.dance,0);
  assert.ok(foe.x !== x);
  assert.equal(s.lives,2);
});

test('a monster outside the music can still hurt Pasha during a solo', () => {
  const run = createRun('temple','pasha'), s = run.state;
  run.update(.7,{ability:true});
  assert.ok(s.solo);
  const unaffected = s.enemies[0];
  assert.equal(unaffected.dance,0);
  s.player.x = unaffected.x;
  run.update(frame,{});
  assert.equal(s.lives,2);
  assert.equal(s.solo,null);
});

test('falling during a solo costs a life, clears the performance and leaves the cooldown running', () => {
  const run = createRun('temple','pasha'), s = run.state;
  const foe = placeListener(s,0,16);
  run.update(.1,{ability:true});
  assert.ok(foe.dance>0);
  Object.assign(s.player,{x:299,y:s.level.height+21,vy:320,onGround:false});
  run.update(frame,{});
  assert.equal(s.lives,2);
  assert.equal(s.solo,null);
  assert.equal(performanceAge(s),null);
  assert.equal(s.abilityTime,0);
  assert.equal(foe.dance,0);
  assert.ok(s.cooldown>29);

  const fresh = createRun('temple','pasha');
  Object.assign(fresh.state.player,{x:299,y:s.level.height+21,vy:320,onGround:false});
  fresh.update(frame,{ability:true});
  assert.equal(fresh.state.lives,2);
  assert.equal(fresh.state.cooldown,0);
  assert.equal(fresh.state.solo,null);
});

test('the solo has a thirty-second cooldown and requires a new button press', () => {
  const run=createRun('temple','pasha'), s=run.state;
  run.update(1.3,{ability:true});
  assert.equal(s.solo,null);
  assert.equal(s.abilityTime,0);
  assert.ok(Math.abs(performanceAge(s) - 1.3) < 1e-7);
  run.update(.1,{});
  run.update(.1,{ability:true});
  assert.equal(s.solo,null);
  run.update(28.5,{ability:true});
  assert.equal(s.cooldown,0);
  assert.equal(performanceAge(s),null);
  assert.equal(s.solo,null);
  run.update(frame,{});
  run.update(frame,{ability:true});
  assert.ok(s.solo && s.cooldown>29);
});

test('wave timing and dance duration agree at different frame rates', () => {
  const a=createRun('temple','pasha'), b=createRun('temple','pasha');
  placeListener(a.state,0,62); placeListener(b.state,0,62);
  a.update(.5,{ability:true,right:true,jump:true});
  for (let i=0; i<60; i++) b.update(frame,{ability:true,right:true,jump:true});
  for (const property of ['x','y','front','age']) {
    assert.ok(Math.abs(a.state.solo[property] - b.state.solo[property]) < 1e-7);
  }
  assert.ok(Math.abs(a.state.enemies[0].dance - b.state.enemies[0].dance) < 1e-7);
  assert.ok(a.state.enemies[0].dance>4.6);
});
