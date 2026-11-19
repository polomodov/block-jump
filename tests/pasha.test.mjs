import assert from 'node:assert/strict';
import test from 'node:test';
import { createRun } from '../physics.js';

const frame = 1/120;
function until(run, condition, limit = 240) {
  for (let i=0; i<limit && !condition(); i++) run.update(frame,{});
  assert.ok(condition());
}

test('Pasha has the ordinary jump and variable height until the ability is pressed', () => {
  const pasha = createRun('temple','pasha'), other = createRun('temple','maxim');
  assert.equal(pasha.state.heroId,'pasha');
  for (const [dt,input] of [[.1,{jump:true,right:true}],[.12,{right:true}],[.6,{}]]) {
    pasha.update(dt,input);
    other.update(dt,input);
    assert.deepEqual(pasha.state.player,other.state.player);
    assert.equal(pasha.state.abilityTime,0);
    assert.equal(pasha.state.cooldown,0);
  }
});

test('a vault from rest clears a nearby enemy and rises much higher than an ordinary jump', () => {
  const run = createRun('temple','pasha'), s = run.state, p = s.player;
  const foe = s.enemies[0];
  // The monster overlaps Pasha on takeoff; his short forward leap clears it without a run-up.
  foe.minX = foe.maxX = foe.x = p.x+9;
  const x = p.x, y = p.y;
  run.update(frame,{jump:true,ability:true});
  assert.ok(!p.onGround && p.vy < -400 && s.abilityTime > 0);
  run.update(.48,{}); // Releasing ordinary jump must not clip the vault.
  assert.ok(y-p.y > 105 && p.x > x+30);
  assert.equal(s.lives,3);
  assert.equal(foe.alive,true);
  until(run,()=>p.onGround);
  assert.equal(s.abilityTime,0);
  assert.equal(s.invulnerable,0);
  assert.ok(p.x > foe.x+foe.w);
  assert.equal(s.lives,3);
});

test('Pasha can vault while falling from a normal jump and steer back the other way', () => {
  const run=createRun('temple','pasha'), s=run.state, p=s.player;
  run.update(.45,{jump:true});
  assert.ok(!p.onGround && p.vy>0);
  const y=p.y, x=p.x;
  run.update(frame,{ability:true,left:true});
  assert.ok(p.vy < -300 && p.facing === -1 && s.abilityTime>0);
  let highest=p.y;
  for (let i=0; i<65; i++) {
    run.update(frame,{left:true});
    highest=Math.min(highest,p.y);
  }
  assert.ok(highest>=5 && highest<y-55);
  assert.ok(p.x<x);
});

test('each cast spends a 30-second cooldown and holding ability cannot trigger another cast', () => {
  const run=createRun('temple','pasha'), s=run.state;
  run.update(1,{ability:true});
  run.update(.1,{});
  assert.ok(s.player.onGround && s.cooldown>28);
  run.update(.1,{ability:true});
  assert.ok(s.player.onGround && s.abilityTime===0);
  run.update(28.8,{ability:true});
  assert.equal(s.cooldown,0);
  assert.equal(s.abilityTime,0);
  run.update(frame,{});
  run.update(frame,{ability:true});
  assert.ok(s.player.vy < -400 && s.cooldown>29);
});

test('a vault passes through monsters on descent; a monster on the landing tile hits in the landing step', () => {
  const run=createRun('temple','pasha'), s=run.state, p=s.player, foe=s.enemies[0];
  foe.minX = foe.maxX = foe.x = 66; // Where the unsteered leap lands.
  run.update(.8,{ability:true});
  until(run,()=>p.y+p.h>foe.y+2);
  assert.ok(p.vy>0 && !p.onGround && s.abilityTime>0);
  assert.equal(foe.alive,true);
  assert.equal(s.lives,3);
  let previousFeet;
  for (let i=0; i<25 && s.lives===3; i++) {
    previousFeet=p.y+p.h;
    run.update(frame,{});
  }
  assert.ok(previousFeet>169 && previousFeet<174);
  assert.equal(s.lives,2);
  assert.equal(s.abilityTime,0);
  assert.equal(foe.alive,true);
});

test('landing on a one-way ledge also ends the vault immediately', () => {
  const run=createRun('temple','pasha'), s=run.state, p=s.player;
  p.x=100;
  run.update(frame,{ability:true});
  until(run,()=>p.onGround);
  assert.equal(p.y+p.h,137);
  assert.equal(s.abilityTime,0);
  assert.equal(s.invulnerable,0);
});

test('the ability cannot pull Pasha back from below the bottom of the screen', () => {
  for (const y of [210,237]) {
    const run=createRun('temple','pasha'), s=run.state;
    Object.assign(s.player,{x:294,y,vy:280,onGround:false});
    run.update(.15,{ability:true});
    assert.equal(s.lives,2);
    assert.equal(s.cooldown,0);
    assert.equal(s.abilityTime,0);
    assert.equal(s.player.y,s.level.spawn.y);
  }
});

test('a simultaneous jump and vault has the same trajectory with large or small input frames', () => {
  const a=createRun('temple','pasha'), b=createRun('temple','pasha');
  a.update(.25,{jump:true,ability:true});
  for (let n=0; n<30; n++) b.update(frame,{jump:true,ability:true});
  a.update(.25,{});
  for (let n=0; n<30; n++) b.update(frame,{});
  assert.ok(Math.abs(a.state.player.x-b.state.player.x)<1e-7);
  assert.ok(Math.abs(a.state.player.y-b.state.player.y)<1e-7);
  assert.ok(a.state.player.y<45);
});
