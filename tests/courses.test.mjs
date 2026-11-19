import assert from 'node:assert/strict';
import test from 'node:test';
import { LEVELS } from '../levels.js';
import { createRun } from '../physics.js';

// Use only the normal player controls. The timing picks a route through each course,
// including optional upper paths; no powers, lives or emeralds are injected.
const jumpLead = { temple: 16, arcade: 16, waterpark: 38, store: 16, nether: 22, castle: 38, end: 15 };

function needsJump(state, lead) {
  const p = state.player, feet = p.y+p.h, center = p.x+p.w/2;
  const platforms = state.level.platforms;
  const underfoot = platforms.findLast(t =>
    Math.abs(t.y-feet)<.1 && p.x+p.w>t.x && p.x<t.x+t.w);
  const edge = underfoot.x+underfoot.w;
  const continuation = platforms.some(t => t.kind!=='ledge' && t.x===edge && t.y>=feet);
  const step = platforms.some(t => t.kind!=='ledge' && t.y<feet-.1 && t.y>feet-80 &&
    t.x>p.x && t.x-center<lead+7);
  const enemy = state.enemies.some(e => e.alive && e.stun===0 && e.x+e.w>p.x &&
    e.x-center<lead+13 && e.y<feet+2 && e.y+e.h>feet-33);
  return (edge-center<lead && !continuation) || step || enemy;
}

function canLand(state, velocity) {
  const player = state.player, feet = player.y+player.h;
  return state.level.platforms.some(platform => {
    if (platform.y < feet-.01) return false;
    const eta = (-player.vy+Math.sqrt(player.vy**2+2*830*(platform.y-feet)))/830;
    const x = player.x+velocity*eta;
    return x+player.w-1 > platform.x && x+1 < platform.x+platform.w;
  });
}

for (const level of LEVELS) {
  test(level.id+' can be completed with three lives by every hero using only run and jump', () => {
    for (const hero of ['kirill','maxim','mom','dad','pasha']) {
      const run = createRun(level.id,hero), state = run.state;
      let jump = false;
      for (let frame=0; frame<2400 && state.status==='playing'; frame++) {
        if (state.player.onGround) jump = !jump && needsJump(state,jumpLead[level.id]);
        // Ease off right on descent if coasting carries us past the next safe foothold.
        const brake = !state.player.onGround && state.player.vy>40 &&
          !canLand(state,132) && canLand(state,0);
        run.update(1/60,{ right: !brake, jump });
      }
      assert.equal(state.status,'won',hero);
      assert.equal(state.lives,3,hero);
      assert.ok(state.checkpointReached);
      assert.ok(state.collected>0 && state.collected<state.level.gems.length);
    }
  });
}
