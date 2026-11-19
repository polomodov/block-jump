import assert from 'node:assert/strict';
import test from 'node:test';
import { LEVELS } from '../levels.js';
import { createRun } from '../physics.js';

test('each course spans four screens and the checkpoints, flag and enemy patrols have solid footing', () => {
  assert.deepEqual(LEVELS.map(l => l.id), ['temple','arcade','waterpark','store','nether','castle','end']);
  for (const l of LEVELS) {
    assert.ok(l.width > 4*480 && l.height === 216);
    const banks = l.platforms.filter(p => p.kind !== 'ledge');
    const supported = (x,y) => banks.some(p => x >= p.x && x < p.x+p.w && y === p.y);
    assert.ok(supported(l.spawn.x,l.spawn.y+19));
    assert.ok(supported(l.flag.x,l.flag.y) && supported(l.checkpoint.x,l.checkpoint.y));
    assert.ok(l.checkpoint.x > .4*l.width && l.checkpoint.x < .6*l.width);
    for (const e of l.enemies) {
      assert.ok(supported(e.minX,e.y) && supported(e.maxX+16,e.y));
      assert.ok(e.minX <= e.x && e.x <= e.maxX);
    }
  }
});

test('release cuts a jump short and holding the button does not repeat on landing', () => {
  const short = createRun(), tall = createRun();
  for (const run of [short,tall]) run.update(.055,{jump:true});
  let high = 200, low = 200;
  for (let i=0; i<100; i++) {
    short.update(1/120,{});
    tall.update(1/120,{jump:true});
    high = Math.min(high,tall.state.player.y);
    low = Math.min(low,short.state.player.y);
  }
  assert.ok(high < low-20);
  assert.ok(short.state.player.onGround && tall.state.player.onGround);
});

function leaveFirstBank() {
  const run = createRun();
  Object.assign(run.state.player,{x:279,vx:132});
  while (run.state.player.onGround) run.update(1/120,{right:true});
  return run;
}

test('coyote time accepts a late takeoff only briefly after leaving the bank', () => {
  const late = leaveFirstBank();
  late.update(.055,{});
  late.update(.01,{jump:true});
  assert.ok(late.state.player.vy < -280);
  const missed = leaveFirstBank();
  missed.update(.15,{});
  missed.update(.01,{jump:true});
  assert.ok(missed.state.player.vy > 0);
});

test('a buffered tap before landing takes off on contact without permitting a midair jump', () => {
  const run = createRun();
  Object.assign(run.state.player,{y:143,vy:155,onGround:false});
  run.update(.012,{jump:true});
  assert.ok(run.state.player.vy > 0);
  run.update(.105,{jump:true});
  assert.ok(run.state.player.vy < -230);
});

test('solid steps stop a runner while a one-way ledge admits a jump from below', () => {
  const wall = createRun();
  Object.assign(wall.state.player,{x:482});
  wall.update(.55,{right:true});
  assert.equal(wall.state.player.x+wall.state.player.w,521);
  wall.update(.46,{right:true,jump:true});
  assert.ok(wall.state.player.x>521);

  const ledge = createRun();
  Object.assign(ledge.state.player,{x:142});
  ledge.update(.4,{jump:true});
  assert.ok(ledge.state.player.y+ledge.state.player.h < 137);
  ledge.update(.5,{jump:true});
  assert.equal(ledge.state.player.y+ledge.state.player.h,137);
  assert.ok(ledge.state.player.onGround);
});

test('stomping removes the enemy and bounces; a side hit costs one life', () => {
  const stomp = createRun(), enemy = stomp.state.enemies[0], p = stomp.state.player;
  Object.assign(p,{x:enemy.x,y:enemy.y-p.h-4,vy:145,onGround:false});
  stomp.update(.08,{});
  assert.equal(enemy.alive,false);
  assert.ok(p.vy < 0);
  assert.equal(stomp.state.lives,3);

  const hit = createRun(), foe = hit.state.enemies[0];
  Object.assign(hit.state.player,{x:foe.x});
  hit.update(.01,{});
  assert.equal(hit.state.lives,2);
  assert.equal(hit.state.player.x,hit.state.level.spawn.x);
  assert.ok(hit.state.invulnerable>1);
});

test('checkpoint respawns preserve emeralds, and only a fresh run replenishes the three lives', () => {
  const run = createRun('temple','mom'), s = run.state;
  const gem=s.gems[0], cp=s.level.checkpoint;
  Object.assign(s.player,{x:gem.x-5,y:gem.y-5});
  run.update(.01,{});
  assert.equal(s.collected,1);
  Object.assign(s.player,{x:cp.x,y:cp.y-s.player.h});
  run.update(.01,{});
  assert.equal(s.checkpointReached,true);
  for (let n=2; n>=0; n--) {
    s.player.y=s.level.height+30;
    run.update(.01,{ability:true});
    assert.equal(s.lives,n);
    assert.ok(gem.taken);
    if (n) assert.equal(s.player.x,cp.x-s.player.w/2);
  }
  assert.equal(s.status,'lost');
  const frozen=s.time;
  run.update(2,{jump:true});
  assert.equal(s.time,frozen);
  const fresh=createRun('temple','mom').state;
  assert.equal(fresh.lives,3);
  assert.equal(fresh.checkpointReached,false);
  assert.equal(fresh.collected,0);
});

test('touching the flag wins independently of emerald count and freezes the finished run', () => {
  const run=createRun(), s=run.state;
  Object.assign(s.player,{x:s.level.flag.x,y:s.level.flag.y-s.player.h});
  run.update(.01,{});
  assert.equal(s.status,'won');
  assert.equal(s.collected,0);
  const t=s.time;
  run.update(1,{right:true});
  assert.equal(s.time,t);
});

test('Kirill runs faster for four seconds; the power has a 30s cooldown and needs a fresh press', () => {
  const run=createRun('temple','kirill'), s=run.state;
  run.update(.25,{right:true,ability:true});
  assert.equal(s.player.vx,184);
  run.update(4,{});
  assert.equal(s.abilityTime,0);
  run.update(.1,{right:true});
  assert.ok(s.player.vx <=132);
  run.update(25.65,{ability:true});
  assert.equal(s.cooldown,0);
  run.update(.1,{ability:true});
  assert.equal(s.abilityTime,0);
  run.update(.01,{});
  run.update(.01,{ability:true});
  assert.ok(s.cooldown > 29);
});

test('Maxim stuns nearby enemies, Mom can pass through them, and Dad sends them running away', () => {
  const max = createRun('temple','maxim'), target=max.state.enemies[0];
  max.state.player.x=target.x-6;
  max.update(.08,{ability:true});
  assert.equal(max.state.lives,3);
  assert.ok(target.stun>3.9 && max.state.enemies[1].stun===0);
  const mom = createRun('temple','mom'), mob=mom.state.enemies[0];
  mom.state.player.x=mob.x-6;
  mom.update(.15,{ability:true,right:true});
  assert.equal(mom.state.lives,3);
  assert.ok(mob.alive && mom.state.abilityTime>3.8);
  const dad=createRun('temple','dad'), foe=dad.state.enemies[0];
  dad.state.player.x=foe.x-5;
  const x=foe.x;
  dad.update(.1,{ability:true});
  assert.equal(dad.state.lives,3);
  assert.ok(foe.x>x);
  dad.update(2.9,{});
  assert.equal(dad.state.abilityTime,0);

  const end=createRun('end','dad'), shell=end.state.enemies.find(e=>e.type==='shulker');
  const shellX=shell.x;
  end.update(.2,{});
  assert.equal(shell.x,shellX);
  end.update(.2,{ability:true});
  assert.ok(shell.x>shellX);
});

test('large and small rendering frames produce the same trajectory', () => {
  const a=createRun(), b=createRun();
  const input={right:true,jump:true};
  a.update(.25,input);
  for(let n=0; n<30; n++) b.update(1/120,input);
  assert.ok(Math.abs(a.state.player.x-b.state.player.x)<1e-7);
  assert.ok(Math.abs(a.state.player.y-b.state.player.y)<1e-7);
  const t=a.state.time;
  for (const invalid of [0, -1, NaN, Infinity]) a.update(invalid,input);
  assert.equal(a.state.time,t);
});
