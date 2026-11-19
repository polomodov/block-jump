import { THEMES, rect, terrainLayer, midgroundLayer, drawDepth } from './world-art.js';

const WIDTH=480, HEIGHT=216;
const actorColumns=['kirill','maxim','mom','dad','zombie','creeper','slime','skeleton','drowned','guardian','spider','witch','magma_cube','blaze','ghost','pumpkin_guard','enderman','shulker','pasha'];
const imageFiles={world:'world-panoramas.png',realm:'realm-panoramas.png',actors:'platform-actors.png?v=family-five-1'};
const images=new Map(), scenes=new WeakMap();

function sheet(key) {
  if(!images.has(key)) {
    const image=new Image();
    image.src=new URL('./assets/'+imageFiles[key],import.meta.url).href;
    images.set(key,image);
  }
  const image=images.get(key);
  return image.complete && image.naturalWidth ? image : null;
}

function sceneFor(canvas,level) {
  const cached=scenes.get(canvas);
  if(cached?.level===level) return cached;
  const haze=canvas.getContext('2d').createLinearGradient(0,30,0,187);
  haze.addColorStop(0,'rgba(16,24,36,0.16)');
  haze.addColorStop(.5,'rgba(16,24,36,0.28)');
  haze.addColorStop(.82,'rgba(16,24,36,0.43)');
  haze.addColorStop(1,THEMES[level.id].fog);
  const scene={level,haze,terrain:terrainLayer(level,HEIGHT),scenery:midgroundLayer(level,WIDTH,HEIGHT)};
  scenes.set(canvas,scene);
  return scene;
}

function drawLandscape(c,t,scene,level,camera) {
  const atlas=sheet(t.sheet);
  rect(c,t.fog,0,0,WIDTH,HEIGHT);
  if(atlas) {
    const h=187, w=Math.round(h*4.8);
    const progress=camera/Math.max(1,level.width-WIDTH);
    const scroll=Math.round(153+progress*(w-WIDTH-153));
    c.drawImage(atlas,0,t.row*100,480,100,-scroll,-3,w,h);
  }
  // Atmospheric perspective separates the detailed vista from collision surfaces.
  c.fillStyle=scene.haze; c.fillRect(0,0,WIDTH,HEIGHT);
  c.drawImage(scene.scenery,-Math.round(camera*.36),0);
}

function gem(c,x,y,t) {
  x=Math.round(x); y=Math.round(y + Math.sin(t*3.1+x*.17)*1.25);
  rect(c,'#143b37',x-2,y-5,5,11); rect(c,'#143b37',x-4,y-3,9,7);
  rect(c,'#299758',x-3,y-3,7,7); rect(c,'#67ee80',x-2,y-4,5,2);
  rect(c,'#bffba4',x-2,y-3,2,5); rect(c,'#51da72',x,y-2,2,5);
  rect(c,'#27af71',x+2,y-2,1,5); rect(c,'#218b62',x-2,y+3,5,1);
  if((Math.floor(t*4)+Math.round(x))%9===0) {
    rect(c,'#e8ffdb',x-3,y-5,4,1); rect(c,'#e8ffdb',x-1,y-7,1,4);
  }
}

function checkpoint(c,x,y,on,time) {
  const color=on ? '#81eab2' : '#f4bd72';
  rect(c,'#243638',x-6,y-3,13,3);
  rect(c,'#435458',x-2,y-30,4,28); rect(c,'#c0b89d',x-2,y-28,1,23);
  rect(c,'#283c42',x-5,y-31,10,10); rect(c,color,x-3,y-29,6,6);
  rect(c,'#f6ecd3',x-2,y-28,2,2);
  if(on) {
    const dy=Math.floor(time*3)%3;
    rect(c,color,x-7,y-31-dy,2,2); rect(c,color,x+6,y-28-dy,1,2);
  }
}

function flag(c,x,y,t,time) {
  rect(c,'#303c42',x-7,y-4,15,4); rect(c,t.light,x-5,y-5,11,2);
  rect(c,'#2b3540',x-2,y-47,5,43); rect(c,'#dfcca1',x-1,y-46,2,40);
  rect(c,'#f8e6a7',x-2,y-49,5,3);
  const flutter=Math.floor(time*3)%2;
  for(let i=0; i<5; i++) {
    const py=y-45+(i>2 ? flutter : 0);
    rect(c,'#29353b',x+2+i*4,py,4,14);
    for(let j=0; j<3;j++) rect(c,(i+j)%2 ? '#384957' : '#fff2cd',x+2+i*4,py+1+j*4,4,4);
  }
}

const airborne=new Set(['blaze','guardian','ghost']);
const hoppers=new Set(['slime','magma_cube']);
function pose(actor,hero=false) {
  if(hero && !actor.onGround) return 3;
  if(actor.stun>0 || Math.abs(actor.vx||0)<1) return 0;
  if(!hero && (airborne.has(actor.type)||hoppers.has(actor.type)||actor.type==='shulker')) return 0;
  return 1+(Math.floor(Math.abs(actor.x)/5)%2);
}

function figure(c,atlas,id,actor,frame,cam) {
  const cx=Math.round(actor.x+actor.w/2-cam), foot=Math.round(actor.y+actor.h);
  const size=Math.max(14,Math.min(27,actor.h));
  const width=Math.round(size*24/16),height=Math.round(size*20/16);
  const facing=actor.facing ?? (actor.vx<0 ? -1:1);
  if(atlas) {
    c.save(); c.translate(cx,foot); c.scale(facing<0 ? -1:1,1);
    const col=actorColumns.indexOf(id);
    if(col>=0) c.drawImage(atlas,col*24,frame*20,24,20,-Math.floor(width/2),-height,width,height);
    c.restore();
  } else {
    rect(c,'#403a44',cx-5,foot-size,10,size);
    rect(c,'#dfbb95',cx-4,foot-size+1,8,6);
  }
}

const guitarPixels=[
  '...............qs', '..............qtq', '.............qcs.',
  '.....qqq....qcsq.', '..qqqtrrqq.qcsq..', '.qtrrrhrrqqcsq...',
  'qtrwhhhrrqcsq....', 'qtrrrhrrscsq.....', 'qtbbrsrrrqq......',
  '.qrbbrrqq........', '..qrrrq..........', '...qqq...........',
];
const guitarInks={q:'#312337',r:'#dc634b',t:'#ffa572',h:'#592d36',s:'#fff2be',c:'#ab784e',w:'#fff2cb',b:'#94423e'};
let guitarImage;

function drawGuitar(c,x,y,age,facing) {
  if(!guitarImage) {
    guitarImage=document.createElement('canvas');
    guitarImage.width=guitarPixels[0].length;
    guitarImage.height=guitarPixels.length;
    const pixels=guitarImage.getContext('2d');
    guitarPixels.forEach((row,py)=>{
      for(let px=0;px<row.length;px++) {
        const ink=guitarInks[row[px]];
        if(ink) rect(pixels,ink,px,py,1,1);
      }
    });
  }
  c.save();
  c.translate(x,y); c.scale(facing,1);
  c.drawImage(guitarImage,-6,-6);
  const strum=Math.floor(age*9)%2;
  rect(c,'#cf956e',-3,1-strum*2,3,2);
  rect(c,'#f7cf9f',-2,2-strum*2,3,1);
  rect(c,'#f7cf9f',5,-2,2,2);
  c.restore();
}

function musicNote(c,x,y,color) {
  const outline='#302238';
  rect(c,outline,x+2,y,5,4);
  rect(c,outline,x+2,y+3,3,4);
  rect(c,outline,x-1,y+5,5,4);
  rect(c,color,x+3,y+1,1,6);
  rect(c,color,x+4,y+1,2,2);
  rect(c,color,x,y+6,3,2);
}

function drawSoundWave(c,solo,camera) {
  const alpha=Math.max(0,Math.min(1,(.93-solo.age)/.33));
  if(!alpha) return;
  const x=solo.x-camera, y=solo.y, radius=solo.front;
  // Pixel dashes preserve the view of the platforms through the expanding wave.
  const count=Math.max(16,Math.round(radius*.75));
  c.save();
  c.globalAlpha=alpha*.78;
  for(let i=0;i<count;i++) {
    const angle=2*Math.PI*i/count;
    const dx=Math.cos(angle)*radius, dy=Math.sin(angle)*radius;
    rect(c,'#354249',x+dx,y+dy,3,3);
    rect(c,'#a3ead6',x+dx,y+dy,2,2);
  }
  c.globalAlpha=alpha;
  for(const side of [-1,1]) {
    for(const [angle,color] of [[-.80,'#b3f5dc'],[-.19,'#ffc1dc']]) {
      const nx=x+side*radius*Math.cos(angle);
      musicNote(c,nx-2,y+radius*Math.sin(angle)-5,color);
    }
  }
  c.restore();
}

function playerEffects(c,s,cx,cy,front) {
  if(s.abilityTime<=0) return;
  const dir=s.player.facing||1;
  if(!front && s.heroId==='kirill') {
    for(let i=0;i<3;i++) rect(c,i ? '#67c6c5':'#c9ffeb',cx-dir*(11+i*4),cy-6+i*3,5-i,1);
  } else if(front && s.solo) {
    drawGuitar(c,cx,cy,s.solo.age,dir);
    const rise=Math.floor(s.solo.age*12)%7;
    musicNote(c,cx+dir*11-2,cy-17-rise,'#ffbdda');
  } else if(front && s.heroId==='maxim') {
    const x=cx+dir*11;
    rect(c,'#ffe3a2',x,cy-6,3,7); rect(c,'#ffc270',x+dir*3,cy-4,2,5);
    rect(c,'#fff4cb',x+dir*6,cy-1,3,2);
  } else if(front && s.heroId==='mom') {
    for(const [dx,dy] of [[-9,4],[8,-5],[-6,-9]]) {
      const shift=Math.floor(s.time*5)%3;
      rect(c,'#e4c0fd',cx+dx,cy+dy-shift,2,1);
    }
  } else if(front && s.heroId==='dad') {
    // Three pixel letters stay recognizable at the internal game resolution.
    const px=Math.max(2,Math.min(WIDTH-22,cx+5)),py=Math.max(1,cy-23);
    rect(c,'#3a3340',px,py,20,12); rect(c,'#fff0ba',px+1,py+1,18,10);
    rect(c,'#fff0ba',px+2,py+11,3,2);
    const letters=['111 101 1','100 101 1','111 011 1','101 001 0','111 110 1'];
    letters.forEach((row,j)=>{for(let i=0;i<row.length;i++) if(row[i]==='1') rect(c,'#5d3d42',px+2+i*1.6,py+3+j,1.5,1);});
  }
}

function enemy(c,atlas,actor,cam,time) {
  const cx=Math.round(actor.x+actor.w/2-cam), y=Math.round(actor.y);
  if(cx < -30 || cx>WIDTH+30 || !actor.alive) return;
  const floor=Math.round(actor.baseY+actor.h);
  rect(c,'rgba(23,23,34,.35)',cx-actor.w*.4,floor-1,Math.round(actor.w*.8),2);
  c.save();
  if(actor.stun>0) c.globalAlpha=.66;
  let frame=pose(actor);
  if(actor.dance>0) {
    // Sway around the feet with a small hop on each beat; physics stays in world coordinates.
    const beat=Math.sin(actor.dance*11);
    const foot=Math.round(actor.y+actor.h);
    c.translate(cx+Math.round(beat*2),foot-Math.round(Math.abs(beat)*4));
    c.transform(1,0,beat*.11,1,0,0);
    c.translate(-cx,-foot);
    frame=beat>0 ? 1 : 2;
  }
  figure(c,atlas,actor.type,actor,frame,cam);
  c.restore();
  if(actor.dance>0) {
    const beat=Math.floor(actor.dance*4);
    const rise=Math.floor(actor.dance*12)%4;
    musicNote(c,cx+(beat%2 ? 4 : -7),Math.max(1,y-16-rise),'#ffc1dc');
  } else if(actor.stun>0) {
    const d=Math.floor(time*5)%3;
    rect(c,'#ffe998',cx-5+d,y-3,3,1); rect(c,'#ffe998',cx+3-d,y-4,2,2);
  }
}

export function drawRun(canvas,state) {
  if(canvas.width!==WIDTH) canvas.width=WIDTH;
  if(canvas.height!==HEIGHT) canvas.height=HEIGHT;
  const c=canvas.getContext('2d'), level=state.level, hero=state.player;
  c.imageSmoothingEnabled=false;
  const t=THEMES[level.id], time=state.time;
  const camera=Math.round(Math.max(0,Math.min(level.width-WIDTH,hero.x-146)));
  const scene=sceneFor(canvas,level);
  drawLandscape(c,t,scene,level,camera);
  drawDepth(c,level,camera,time,WIDTH,HEIGHT);
  if(state.solo) drawSoundWave(c,state.solo,camera);
  c.drawImage(scene.terrain,camera,0,WIDTH,HEIGHT,0,0,WIDTH,HEIGHT);
  const post=level.checkpoint, end=level.flag;
  if(post.x>=camera-12 && post.x<camera+WIDTH+12) checkpoint(c,Math.round(post.x-camera),post.y,state.checkpointReached,time);
  if(end.x>=camera-30 && end.x<camera+WIDTH+8) flag(c,Math.round(end.x-camera),end.y,t,time);
  for(const item of state.gems) {
    if(!item.taken && item.x>camera-9 && item.x<camera+WIDTH+9) gem(c,item.x-camera,item.y,time);
  }
  const atlas=sheet('actors');
  for(const actor of state.enemies) enemy(c,atlas,actor,camera,time);
  const cx=Math.round(hero.x+hero.w/2-camera),cy=Math.round(hero.y+hero.h/2);
  if(hero.onGround) rect(c,'rgba(20,22,29,.5)',cx-6,Math.round(hero.y+hero.h)-1,13,2);
  playerEffects(c,state,cx,cy,false);
  c.save();
  if(state.invulnerable>0 && Math.floor(time*8)%2===1) c.globalAlpha=.55;
  if(state.heroId==='mom' && state.abilityTime>0) c.globalAlpha=.48;
  figure(c,atlas,state.heroId,hero,pose(hero,true),camera);
  c.restore();
  playerEffects(c,state,cx,cy,true);
}
