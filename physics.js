import { LEVELS } from './levels.js';

const RUN_SPEED = 132;
const JUMP_SPEED = 322;
const GRAVITY = 830;
const PLAYER_W = 13, PLAYER_H = 19;

// Width, height and patrol speed are in logical pixels and pixels per second.
// Hoppers spring from the bank. Flying creatures keep a little space below them.
const beasts = {
  zombie: [14,18,22], creeper: [13,16,27], slime: [16,12,23,'hop'], skeleton: [13,18,29],
  drowned: [14,17,22], guardian: [16,13,26,'float'], spider: [17,10,37], witch: [14,19,25],
  magma_cube: [16,12,23,'hop'], blaze: [13,16,20,'float'], ghost: [14,15,25,'float'],
  pumpkin_guard: [16,18,21], enderman: [13,21,30], shulker: [15,13,0],
};
const powers = { kirill: 4, maxim: .35, mom: 4, dad: 3 };
const overlaps = (a, b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
const approaches = (value, target, delta) => value < target ? Math.min(target,value+delta) : Math.max(target,value-delta);
const remaining = (value,dt) => value <= dt+1e-8 ? 0 : value-dt;

function spawnEnemy(def, index) {
  const [w,h,speed,motion] = beasts[def.type];
  const hover = motion === 'float' ? 14 : 0;
  return { ...def, y: def.y-h-hover, baseY: def.y-h, w, h, speed, motion,
    vx: index%2 ? speed : -speed, facing: index%2 ? 1 : -1,
    phase: index*.53, alive: true, stun: 0 };
}

export function createRun(levelId = 'temple', heroId = 'kirill') {
  const level = LEVELS.find(l => l.id === levelId) || LEVELS[0];
  if (!Object.hasOwn(powers,heroId)) heroId = 'kirill';
  const player = { ...level.spawn, w: PLAYER_W, h: PLAYER_H, vx: 0, vy: 0, facing: 1, onGround: true };
  const state = {
    level, heroId, player, lives: 3, collected: 0, cooldown: 0, time: 0, status: 'playing',
    gems: level.gems.map(g => ({ ...g, taken: false })), enemies: level.enemies.map(spawnEnemy),
    checkpointReached: false, invulnerable: 0, abilityTime: 0,
  };
  let coyote = 0, jumpBuffer = 0, heldJump = false, heldAbility = false;

  function loseLife() {
    state.lives--;
    if (state.lives === 0) {
      state.status = 'lost';
      return;
    }
    const spawn = state.checkpointReached
      ? { x: level.checkpoint.x - PLAYER_W/2, y: level.checkpoint.y - PLAYER_H } : level.spawn;
    Object.assign(player,spawn,{ vx: 0, vy: 0, onGround: true, facing: 1 });
    state.invulnerable = 1.6;
    state.abilityTime = 0;
    coyote = jumpBuffer = 0;
  }

  function movePlayer(dt, input) {
    const dir = Number(!!input.right) - Number(!!input.left);
    const boost = heroId === 'kirill' && state.abilityTime > 0;
    player.vx = approaches(player.vx,dir*(boost ? 184 : RUN_SPEED),dt*(dir ? 1060 : 1370));
    if (dir) player.facing = dir;
    if (player.onGround) coyote = .11;
    else coyote = remaining(coyote,dt);
    if (jumpBuffer > 0 && coyote > 0) {
      player.vy = input.jump ? -JUMP_SPEED : -154;
      player.onGround = false;
      coyote = jumpBuffer = 0;
    } else jumpBuffer = remaining(jumpBuffer,dt);

    const lastX = player.x;
    player.x = Math.max(0, Math.min(level.width-player.w, player.x + player.vx*dt));
    for (const p of level.platforms) {
      if (p.kind === 'ledge' || !overlaps(player,p)) continue;
      if (player.vx > 0 && lastX+player.w <= p.x+.001) player.x = p.x-player.w;
      else if (player.vx < 0 && lastX >= p.x+p.w-.001) player.x = p.x+p.w;
      else continue;
      player.vx = 0;
    }

    const lastY = player.y;
    player.vy = Math.min(470,player.vy+GRAVITY*dt);
    player.y += player.vy*dt;
    player.onGround = false;
    for (const p of level.platforms) {
      if (player.x+player.w <= p.x || player.x >= p.x+p.w) continue;
      if (player.vy >= 0 && lastY+player.h <= p.y+.001 && player.y+player.h >= p.y) {
        player.y = p.y-player.h;
        player.vy = 0;
        player.onGround = true;
      } else if (p.kind !== 'ledge' && player.vy < 0 && lastY >= p.y+p.h-.001 && player.y <= p.y+p.h) {
        player.y = p.y+p.h;
        player.vy = 0;
      }
    }
    return lastY+player.h;
  }

  function moveEnemy(enemy, dt, frightened) {
    enemy.stun = remaining(enemy.stun,dt);
    if (enemy.stun > 0) return;
    if (frightened) enemy.facing = enemy.x+enemy.w/2 >= player.x+player.w/2 ? 1 : -1;
    // Even the normally anchored shulker scoots to safety when Dad shouts.
    const speed = frightened ? Math.max(20,enemy.speed)*1.65 : enemy.speed;
    enemy.vx = enemy.facing*speed;
    enemy.x = Math.max(enemy.minX,Math.min(enemy.maxX,enemy.x+enemy.vx*dt));
    if (!frightened && (enemy.x === enemy.minX || enemy.x === enemy.maxX)) {
      enemy.facing = enemy.x === enemy.minX ? 1 : -1;
    }
    enemy.phase += dt;
    if (enemy.motion === 'float') enemy.y = enemy.baseY-14-4*Math.sin(enemy.phase*2.4);
    if (enemy.motion === 'hop') {
      const t = enemy.phase % 1.9;
      enemy.y = enemy.baseY - (t < .62 ? 15*Math.sin(Math.PI*t/.62) : 0);
    }
  }

  function enemies(dt, previousFeet) {
    const active = state.abilityTime > 0;
    const protectedByPower = active && (heroId === 'dad' || heroId === 'mom');
    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      moveEnemy(enemy,dt,active && heroId === 'dad');
      if (active && heroId === 'maxim' &&
          Math.abs(enemy.x+enemy.w/2-player.x-player.w/2) < 34 && Math.abs(enemy.y-player.y) < 24) {
        enemy.stun = 4;
      }
      if (enemy.stun > 0 || !overlaps(player,enemy)) continue;
      if (player.vy > 0 && previousFeet <= enemy.y+4) {
        enemy.alive = false;
        player.y = enemy.y-player.h;
        player.vy = -185;
        player.onGround = false;
        coyote = 0;
      } else if (!protectedByPower && state.invulnerable === 0) {
        loseLife();
        return;
      }
    }
  }

  function step(dt,input) {
    state.time += dt;
    state.invulnerable = remaining(state.invulnerable,dt);
    state.cooldown = remaining(state.cooldown,dt);
    const previousFeet = movePlayer(dt,input);
    if (player.y > level.height+20) {
      loseLife();
      return;
    }
    const cx = player.x+player.w/2, cy = player.y+player.h/2;
    for (const gem of state.gems) {
      if (!gem.taken && Math.abs(gem.x-cx) < player.w/2+4 && Math.abs(gem.y-cy) < player.h/2+4) {
        gem.taken = true;
        state.collected++;
      }
    }
    if (cx >= level.checkpoint.x && player.y+player.h <= level.checkpoint.y+3) state.checkpointReached = true;
    if (cx >= level.flag.x && player.y+player.h <= level.flag.y+3) {
      state.status = 'won';
      return;
    }
    enemies(dt,previousFeet);
    state.abilityTime = remaining(state.abilityTime,dt);
  }

  function update(dt,input = {}) {
    if (state.status !== 'playing' || !Number.isFinite(dt) || dt <= 0) return;
    if (input.ability && !heldAbility && state.cooldown === 0) {
      state.abilityTime = powers[heroId];
      state.cooldown = 30;
    }
    if (input.jump && !heldJump) jumpBuffer = .14;
    if (!input.jump && heldJump && player.vy < -154) player.vy = -154;
    heldJump = !!input.jump;
    heldAbility = !!input.ability;
    // Small steps keep short ledges and fast falls consistent across display refresh rates.
    while (dt > 1e-8 && state.status === 'playing') {
      const slice = Math.min(1/120,dt);
      step(slice,input);
      dt -= slice;
    }
  }
  return { state, update };
}
