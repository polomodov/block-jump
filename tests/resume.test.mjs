import assert from 'node:assert/strict';
import test from 'node:test';
import { createRun, restoreRun } from '../physics.js';
import { LEVELS } from '../levels.js';

function roundTrip(run) {
  const save = JSON.parse(JSON.stringify(run.snapshot()));
  const restored = restoreRun(save);
  assert.ok(restored);
  assert.deepEqual(restored.state, run.state);
  for (const input of [{right:true, jump:true, ability:true}, {right:true}, {}, {jump:true}]) {
    run.update(.09, input);
    restored.update(.09, input);
    assert.deepEqual(restored.state, run.state);
  }
}

test('each course and hero resumes the identical mid-jump simulation, including input edges and powers', () => {
  for (const level of LEVELS) {
    for (const hero of ['kirill','maxim','mom','dad','pasha']) {
      const run = createRun(level.id, hero);
      run.update(.46, {right:true});
      run.update(.06, {jump:true, ability:true});
      const snapshot = run.snapshot();
      assert.ok(snapshot.progress.input.heldJump && snapshot.progress.input.heldAbility);
      assert.equal(snapshot.hero, hero);
      assert.equal(snapshot.level, level.id);
      roundTrip(run);
    }
  }
});

test('restore keeps a checkpoint, gem ownership and live dragon breath without sharing mutable objects', () => {
  const run = createRun('end', 'mom'), s = run.state;
  const gem = s.gems[0];
  s.player.x = gem.x - s.player.w / 2;
  s.player.y = gem.y - s.player.h / 2;
  run.update(1 / 120);
  assert.ok(gem.taken);
  s.player.x = s.level.checkpoint.x-5;
  s.player.y = s.level.checkpoint.y-s.player.h;
  run.update(.1, {right:true});
  run.update(2.3);
  assert.equal(s.checkpointReached, true);
  assert.equal(s.dragon.phase, 'warning');
  run.update(1.9, {ability:true});
  assert.ok(s.dragon.clouds.length > 0);
  const saved = run.snapshot(), resumed = restoreRun(saved);
  assert.deepEqual(resumed.state.dragon, s.dragon);
  saved.progress.dragon.clouds[0].x = -9999;
  assert.notEqual(resumed.state.dragon.clouds[0].x, -9999);
  roundTrip(run);
});

test('damaged, incompatible and finished saves never become active runs', () => {
  for (const damage of [
    s => { s.version++; }, s => { s.level = 'unknown'; }, s => { s.hero = 'unknown'; },
    s => { s.progress.player.vx = null; }, s => { s.progress.input.jumpBuffer = undefined; },
    s => { s.progress.gems.pop(); }, s => { s.progress.lives = 0; },
    s => { s.progress.enemies[0].action = {kind:'compress', age:0, duration:1}; },
    s => { s.progress.dragon.phase = 'dive'; }, s => { s.progress.monsterEffects = [null]; },
  ]) {
    const saved = createRun('end').snapshot();
    damage(saved);
    assert.equal(restoreRun(saved), null);
  }
  for (const status of ['won','lost']) {
    const run = createRun();
    run.state.status = status;
    assert.equal(run.snapshot(), null);
  }
});
