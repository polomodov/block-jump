import assert from 'node:assert/strict';
import test from 'node:test';
import { createRun } from '../physics.js';

function scene(type, hero='kirill') {
  const run=createRun('nether',hero), {state}=run;
  const monster=state.enemies.find(e=>e.type===type);
  for(const e of state.enemies) if(e!==monster) e.alive=false;
  return {run,state,monster};
}

test('magma cube crouches, jumps over a real lava channel, and settles onto a new patrol bank',()=>{
  const {run,state,monster}=scene('magma_cube');
  state.player.x=90;
  const origin=monster.x, takeoffY=monster.y;
  run.update(.53);
  assert.equal(monster.action.kind,'compress');
  assert.equal(monster.x,origin);
  const destination=monster.action.landing;
  run.update(.47);
  assert.equal(monster.action.kind,'vault');
  const mid=monster.x+monster.w/2;
  assert.ok(!state.level.platforms.some(p=>p.kind!=='ledge' && mid>=p.x && mid<=p.x+p.w));
  assert.ok(monster.y<takeoffY-25);
  run.update(.43);
  assert.equal(monster.action.kind,'land');
  assert.equal(monster.x,destination.x);
  assert.ok(state.level.platforms.some(p=>p.y===monster.y+monster.h && monster.x>=p.x && monster.x+monster.w<=p.x+p.w));
  assert.ok(state.monsterEffects.some(e=>e.kind==='cinders'));
  run.update(1);
  assert.ok(monster.x>=monster.minX && monster.x<=monster.maxX);
});

test('music interrupts the crouch and fear in midair lets the cube land safely',()=>{
  const first=scene('magma_cube','pasha');
  first.state.player.x=120;
  first.run.update(.12);
  first.run.update(.6,{ability:true});
  assert.ok(first.monster.dance>0 && first.monster.action===null);
  const next=scene('magma_cube','dad');
  next.state.player.x=100;
  next.run.update(.85);
  const destination=next.monster.action.landing;
  next.run.update(.59,{ability:true});
  assert.equal(next.monster.y,destination.y);
  assert.ok(next.monster.x>=next.monster.minX && next.monster.x<=next.monster.maxX);
});

test('the ghast charges first, fires a locked shot, and the runner can dodge the fireball',()=>{
  for(const dodge of [true,false]){
    const {run,state,monster}=scene('ghast');
    state.player.x=294; state.player.y=162-state.player.h;
    run.update(.8);
    assert.equal(monster.action.kind,'inhale');
    assert.equal(state.monsterEffects.length,0);
    run.update(.34);
    assert.equal(monster.action.kind,'exhale');
    const fireball=state.monsterEffects.find(fx=>fx.kind==='fireball');
    assert.ok(fireball && fireball.vx<0 && fireball.vy>0);
    run.update(.32,{right:dodge});
    run.update(1.1);
    assert.equal(state.lives,dodge?3:2);
    assert.ok(!state.monsterEffects.some(e=>e.kind==='fireball'));
  }
});

test('invisibility cancels the windup and blocks an already launched fireball',()=>{
  for(const seconds of [.42,1.3]) {
    const {run,state,monster}=scene('ghast','mom');
    state.player.x=294; state.player.y=162-state.player.h;
    run.update(seconds);
    run.update(1.5,{ability:true});
    assert.equal(state.lives,3);
    assert.equal(monster.action,null);
    assert.ok(!state.monsterEffects.some(e=>e.kind==='fireball'));
  }
});
