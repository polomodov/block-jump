import assert from 'node:assert/strict';
import test from 'node:test';
import { createRun } from '../physics.js';

function approach(level, type, gap, hero = 'kirill') {
  const run = createRun(level, hero);
  const { player, enemies } = run.state;
  const enemy = enemies.find(e => e.type === type);
  Object.assign(player, { x: enemy.x - gap, y: enemy.y + enemy.h - player.h });
  return { run, enemy, state: run.state, player };
}

test('the skeleton holds a fixed aim, releases one short arrow and the runner can jump over it', () => {
  for (const jump of [true, false]) {
    const { run, enemy, state } = approach('arcade', 'skeleton', 54);
    run.update(.7);
    assert.equal(enemy.action.kind, 'draw');
    assert.equal(enemy.facing, -1);
    assert.deepEqual(state.monsterEffects, []);
    run.update(.06);
    assert.equal(enemy.action.kind, 'release');
    const arrow = state.monsterEffects[0];
    assert.equal(arrow.kind, 'arrow');
    assert.equal(arrow.dir, -1);
    run.update(.5, { jump });
    assert.equal(state.lives, jump ? 3 : 2);
    run.update(.6);
    assert.equal(state.monsterEffects.length, 0);
  }
});

test('only an unobstructed short line of sight starts a draw; a launched arrow stops at a wall', () => {
  const { state, run, enemy, player } = approach('arcade', 'skeleton', 132);
  run.update(.1);
  assert.equal(enemy.action, null);
  Object.assign(player, { x: enemy.x - 58, y: enemy.y + enemy.h - player.h, vy: 0 });
  const barrier = { kind: 'ground', x: enemy.x - 22, y: enemy.y, w: 3, h: enemy.h };
  state.level = { ...state.level, platforms: [...state.level.platforms, barrier] };
  run.update(.06);
  assert.equal(enemy.action, null);
  state.level.platforms.pop();
  run.update(.76);
  assert.equal(state.monsterEffects[0].kind, 'arrow');
  state.level.platforms.push(barrier);
  run.update(.6);
  assert.equal(state.monsterEffects.length, 0);
  assert.equal(state.lives, 3);
});

test('a creeper telegraphs even on contact, then a single blast leaves harmless smoke', () => {
  for (const dodge of [true, false]) {
    const { state, run, enemy, player } = approach('temple', 'creeper', 19);
    run.update(.5);
    assert.equal(enemy.action.kind, 'fuse');
    assert.equal(enemy.alive, true);
    run.update(.35,{left:dodge});
    assert.equal(enemy.alive, false);
    assert.equal(state.monsterEffects.length, 1);
    const [blast] = state.monsterEffects;
    assert.equal(blast.kind, 'blast');
    assert.equal(blast.radius, 26);
    assert.equal(state.lives, dodge ? 3 : 2);
    player.x = blast.x;
    run.update(.15);
    assert.equal(state.lives, dodge ? 3 : 2);
    run.update(.4);
    assert.equal(state.monsterEffects.length, 0);
  }
});

test('Enderman marks a grounded destination, leaves a trace of its former position, then patrols from the exit', () => {
  const { run, state, enemy } = approach('end', 'enderman', 39);
  run.update(.2);
  const x = enemy.x, {toX} = enemy.action;
  assert.equal(enemy.action.kind, 'blinkOut');
  assert.ok(Math.abs(toX-x) >= 24);
  run.update(.33);
  assert.equal(enemy.action.kind, 'blinkIn');
  assert.equal(enemy.x, toX);
  assert.ok(enemy.x >= enemy.minX && enemy.x <= enemy.maxX);
  assert.ok(state.level.platforms.some(p => p.kind !== 'ledge' && p.y === enemy.y + enemy.h &&
    p.x <= enemy.x && enemy.x + enemy.w <= p.x + p.w));
  assert.equal(state.monsterEffects[0].kind, 'portal');
  assert.equal(state.monsterEffects[0].x, x + enemy.w/2);
  run.update(.42);
  assert.equal(enemy.action, null);
  assert.equal(state.monsterEffects.length, 0);
  run.update(.4);
  assert.ok(Math.abs(enemy.x - toX) <= enemy.speed * .41);
  assert.equal(state.lives, 3);
});

test('an Enderman cancels its jump if the runner occupies the marked destination', () => {
  const { run, state, enemy, player } = approach('end', 'enderman', 37);
  run.update(.4);
  player.x = enemy.action.toX;
  const origin = enemy.x;
  run.update(.12);
  assert.equal(enemy.action, null);
  assert.equal(enemy.x, origin);
  assert.equal(state.lives, 3);
  assert.equal(state.monsterEffects.length, 0);
});

test('all three windups are interrupted by music, fear, a stun, or loss of sight', () => {
  for (const [level, type] of [['arcade','skeleton'], ['temple','creeper'], ['end','enderman']]) {
    for (const hero of ['pasha','dad','maxim','mom']) {
      const { run, enemy, state } = approach(level, type, 24, hero);
      run.update(.25);
      assert.ok(enemy.action);
      run.update(.14,{ability:true});
      assert.equal(enemy.action, null, type+' vs '+hero);
      if (hero === 'pasha') assert.ok(enemy.dance > 4);
      if (hero === 'maxim') assert.ok(enemy.stun > 3);
      run.update(.5);
      assert.equal(state.monsterEffects.length, 0);
      assert.equal(state.lives, 3);
    }
  }
});
