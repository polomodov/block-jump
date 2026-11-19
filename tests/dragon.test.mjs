import assert from 'node:assert/strict';
import test from 'node:test';
import { LEVELS } from '../levels.js';
import { createRun } from '../physics.js';

function waitFor(run, predicate, seconds = 5, input = {}) {
  for (let frames = 0; frames < seconds * 120; frames++) {
    if (predicate(run.state)) return;
    run.update(1 / 120, input);
  }
  assert.fail('Dragon encounter did not reach the expected state');
}

function startAttack(heroId = 'kirill') {
  const run = createRun('end', heroId);
  run.update(1 / 3, { right: true });
  waitFor(run, s => s.dragon.phase === 'warning');
  return run;
}

test('only the End has a dragon, with independent flight and cloud state for each run', () => {
  for (const level of LEVELS.filter(l => l.id !== 'end')) {
    const run = createRun(level.id);
    run.update(5, {});
    assert.equal(run.state.dragon, null);
  }
  const first = startAttack(), fresh = createRun('end');
  assert.equal(fresh.state.dragon.phase, 'patrol');
  assert.equal(fresh.state.dragon.clouds.length, 0);
  assert.notEqual(first.state.dragon.targets, fresh.state.dragon.targets);
});

test('a warning stays put as the player escapes, then the diving dragon releases each cloud from its low pass', () => {
  const run = startAttack(), { dragon, player } = run.state;
  const spots = dragon.targets.map(m => m.x);
  assert.equal(spots.length, 3);
  run.update(.62, { right: true });
  assert.ok(player.x > Math.max(...spots) + dragon.targets[0].radius);
  assert.deepEqual(dragon.targets.map(m => m.x), spots);
  assert.equal(dragon.clouds.length, 0);
  waitFor(run, s => s.dragon.phase === 'dive');
  const high = dragon.y, hitTimes = [];
  for (let i = 0; i < spots.length; i++) {
    waitFor(run, () => dragon.clouds.length > i);
    assert.ok(dragon.y > high + 55);
    const c = dragon.clouds[i];
    assert.ok(Math.abs(c.x - (dragon.x + dragon.dir * 22)) < 2);
    assert.ok(c.y > dragon.y && c.y - dragon.y < 32);
    assert.ok(Math.abs(c.x - spots[i]) < .001);
    assert.equal(c.duration, 3);
    hitTimes.push(run.state.time);
  }
  assert.ok(hitTimes[1] > hitTimes[0] + .12 && hitTimes[2] > hitTimes[1] + .12);
  waitFor(run, s => s.dragon.phase === 'recover');
  waitFor(run, s => s.dragon.phase === 'patrol');
  assert.ok(dragon.y < dragon.clouds[0].y - 65);
  assert.equal(dragon.clouds.length, spots.length);
  waitFor(run, () => dragon.clouds.length === 0);
  assert.ok(run.state.time >= hitTimes.at(-1) + 3 - 1 / 120);
  assert.equal(run.state.lives, 3);
});

test('standing in live breath costs one life, and the respawn has a fresh patrol and no lingering breath', () => {
  const run = startAttack();
  waitFor(run, s => s.lives === 2);
  assert.equal(run.state.player.x, run.state.level.spawn.x);
  assert.equal(run.state.dragon.phase, 'patrol');
  assert.deepEqual(run.state.dragon.clouds, []);
  run.update(5);
  assert.equal(run.state.lives, 2);
});

test('a normal jump can cross lingering breath and Mom and Dad can pass through it with their powers', () => {
  const run = startAttack();
  run.update(.62, { right: true });
  waitFor(run, s => s.dragon.clouds.length === 3);
  run.update(.68, { left: true, jump: true });
  assert.ok(run.state.player.x < Math.max(...run.state.dragon.clouds.map(c => c.x)));
  assert.equal(run.state.lives, 3);
  for (const hero of ['mom', 'dad']) {
    const protectedRun = startAttack(hero);
    waitFor(protectedRun, s => s.dragon.clouds.length === 1);
    protectedRun.update(1, { ability: true });
    assert.equal(protectedRun.state.lives, 3);
    assert.equal(protectedRun.state.dragon.clouds.length, 3);
    protectedRun.update(.7, { right: true });
    protectedRun.update(3);
    assert.equal(protectedRun.state.lives, 3);
  }
});

test('a breath hit at the checkpoint restores the hero there and only a fresh run returns to the start', () => {
  const run = createRun('end'), s = run.state, cp = s.level.checkpoint;
  Object.assign(s.player, { x: cp.x - s.player.w / 2, y: cp.y - s.player.h });
  run.update(.1, { jump: true });
  run.update(.8, {});
  assert.equal(s.checkpointReached, true);
  waitFor(run, state => state.lives === 2, 7);
  assert.equal(s.player.x, cp.x - s.player.w / 2);
  assert.equal(s.player.y, cp.y - s.player.h);
  assert.deepEqual(s.dragon.clouds, []);
  run.update(5);
  assert.equal(s.lives, 2);
  const fresh = createRun('end').state;
  assert.equal(fresh.checkpointReached, false);
  assert.equal(fresh.lives, 3);
  assert.equal(fresh.player.x, fresh.level.spawn.x);
});
