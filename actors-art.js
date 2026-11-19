// Illustration coordinates are in game units. The canvas scales the paths at display density.
const paths = new Map();
function shape(c, d, fill, edge, width = .55) {
  let path = paths.get(d);
  if (!path) { path = new Path2D(d); paths.set(d, path); }
  if (fill) { c.fillStyle = fill; c.fill(path); }
  if (edge) { c.lineWidth = width; c.strokeStyle = edge; c.stroke(path); }
}
function oval(c, x, y, rx, ry, color) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI*2);
  c.fillStyle = color; c.fill();
}
function stroke(c, x, y, kx, ky, tx, ty, ink, width) {
  c.beginPath(); c.moveTo(x,y); c.lineTo(kx,ky); c.lineTo(tx,ty);
  c.strokeStyle=ink; c.lineWidth=width; c.stroke();
}
const family = {
  kirill: { height:.94, build:.91, hair:'#5d4035', shine:'#a07950', jacket:'#167c85', lit:'#4bb7b8', shade:'#124c59', shirt:'#24515d', pant:'#8a7050', shoe:'#405362' },
  maxim:  { height:1, build:1.16, hair:'#533932', shine:'#a16c43', jacket:'#302f3b', lit:'#5a5364', shade:'#252634', shirt:'#7951b5', pant:'#526480', shoe:'#6e4345' },
  mom:    { height:1.02, build:1, hair:'#62483e', shine:'#ac7b5a', jacket:'#42414e', lit:'#777482', shade:'#2d2c39', shirt:'#79374c', pant:'#474654', shoe:'#553f40' },
  dad:    { height:1.05, build:1.07, hair:'#594638', shine:'#907158', jacket:'#394b65', lit:'#6b849b', shade:'#293747', shirt:'#35465c', pant:'#485364', shoe:'#473e40' },
  pasha:  { height:1.05, build:.99, hair:'#413738', shine:'#796052', jacket:'#b47c43', lit:'#e1ad69', shade:'#79553d', shirt:'#34333e', pant:'#424554', shoe:'#8d8d96' },
};
const ink = '#302d3c', skin = '#efb58b', warm = '#c7846b';
const body = 'M-3.5 -15.1 Q-.3 -16.3 2.5 -15.1 Q3.7 -13.4 4 -9 L3.4 -7.8 Q-.4 -7 -4.1 -8.3 L-4.3 -12.5Z';

function torso(c,id,h) {
  c.save(); c.scale(h.build,1);
  shape(c,id==='maxim'?'M-3.5 -15.1Q-.3 -16.3 2.5 -15.1Q3.4 -14.3 3.8 -13.2Q5.65 -10.4 4.35 -8.5Q2.8 -7.2 -.3 -7.3L-4.1 -8.3 -4.3 -12.5Z':body,h.jacket,ink,.8);
  shape(c,'M-4 -13.8Q-3.7 -15.4 -.7 -15.4L-1.3 -14 -2.8 -13.1 -3.1 -9.3 -4 -8.7Z',h.lit);
  shape(c,'M-3.9 -9.1Q0 -8.6 3.8 -10L3.5 -8Q0 -7.1 -4 -8.4Z',h.shade);
  if(id==='maxim' || id==='pasha') {
    const shirt=id==='maxim'?'M-.55 -15.2Q.8 -14.4 2 -15.1Q4.72 -12 4.22 -9.07Q4.05 -7.42 .7 -7.63L-.95 -7.8 -.7 -12Z':'M-.55 -15.2Q.8 -14.4 2 -15.1L2.8 -12 3.1 -8Q1.3 -7.4 -.9 -7.8L-.7 -12Z';
    shape(c,shirt,h.shirt);
    shape(c,'M-1.4 -14.4L-.7 -13.2 -.95 -8.1',null,h.lit,.42);
    if(id==='maxim') shape(c,'M2 -14L.45 -11.9 1.5 -12 -.25 -9.7 2.35 -12.35 1.28 -12.25Z','#efe4ff');
  } else if(id==='mom') {
    shape(c,'M-3.3 -15Q-.7 -13.6 3 -15.2L3.3 -13.5Q.7 -12.1 -2.8 -13.4Z','#783549',ink,.4);
    shape(c,'M.4 -13.6L2 -13.6 .5 -9.7 -1 -10.4Z','#963b51');
    shape(c,'M-.5 -11.4L.9 -10.9M.1 -12.7L1.4 -12.2',null,'#e1b66e',.52);
  } else {
    shape(c,'M-2.8 -14.8L-.5 -12.8 .7 -14.5 2.4 -13.6 2.5 -15.1',null,h.lit,.6);
    shape(c,'M.8 -13.2L.8 -9.4',null,h.shade,.4);
  }
  c.restore();
}

function head(c,id,h,blink) {
  shape(c,'M-1.3 -17.6L1.8 -17.8 1.7 -14.8Q.3 -13.7 -1.6 -15Z',warm,ink,.45);
  shape(c,'M-3.8 -22.4Q-2.3 -26 1 -25.2Q4.6 -24.8 4.7 -21.8L4.65 -20.2 5.35 -19.35 4.56 -18.9Q4.2 -16.65 1.8 -16.2Q-.6 -15.9 -2.5 -17.9L-3.7 -19.8Z',skin,ink,.64);
  shape(c,'M-3.5 -22L-2 -21.5 -1.8 -18.8Q-.8 -17.1 1.7 -16.6Q-.8 -16.3 -2.6 -18Z','#d89575');
  if(id==='dad') {
    shape(c,'M-3.85 -19.1Q-5.9 -23.6 -2.65 -24.9Q-1.5 -25.5 .1 -25.25Q-2.6 -24.6 -2.45 -22.3L-2.28 -19.65Z',h.hair,ink,.45);
    shape(c,'M-2.9 -19.3Q-1.9 -17.7 -.55 -17.8L1.3 -18.55 2.85 -18.25 4.5 -18.9Q4.35 -15.7 1.2 -15.65Q-1.75 -15.65 -2.9 -18.5Z',h.hair,ink,.45);
    shape(c,'M-.2 -16.8L1 -16.5 2.1 -16.8',null,h.shine,.42);
  } else {
    const hair=id==='pasha'
      ? 'M-3.3 -18.8Q-4.95 -19.2 -4.7 -21.6L-5.5 -22.8 -4.45 -22.7 -5 -24.5 -3.6 -24.4 -3.7 -25.8 -2 -25.25 -.9 -26.9 .1 -25.9 1.7 -26.4 2.35 -25.55 4.15 -25.5 3.85 -24.75 5 -23.95Q4.7 -22.35 2.8 -21.9L3.05 -23 .95 -21.8 .7 -22.95 -1.65 -21.95 -2.15 -20.25 -3.1 -20.55Z'
      : id==='mom'
        ? 'M-3 -18.5L-4.6 -16.6 -4.5 -18.75 -5.35 -18.4Q-6.05 -22.7 -4.15 -24.1Q-2.6 -26.7 .8 -25.6Q4.4 -26.15 5.1 -23.1L4 -23.45 4.6 -22.25Q2.5 -22.7 1.4 -23.5Q.5 -21.6 -1.4 -21.25L-.85 -22.45 -2.4 -20.65Z'
        : 'M-3.1 -18.9Q-5.25 -20.1 -4.7 -22.2L-5.05 -23.65 -3.85 -23.6Q-3.4 -25.65 -.9 -25.45L.65 -26.2 1.05 -25.4Q4.6 -25.5 5 -22.95L3.9 -23.35 4 -22.25 2.35 -23.25 1.7 -21.9 .95 -23.25 -.45 -22.05 -.7 -23.15 -2.4 -21.55 -2.4 -20.1 -3.1 -20.35Z';
    shape(c,hair,h.hair,ink,.63);
    shape(c,'M-3.7 -23.4Q-2.9 -24.9 -1 -24.8M-.2 -24.85Q1.35 -25.1 2.2 -24.7',null,h.shine,.46);
  }
  oval(c,-2.8,-19.5,.83,1.12,'#dfa17d');
  shape(c,'M.05 -21.1Q.95 -21.52 1.6 -21.1M3.1 -21Q3.7 -21.35 4.25 -21.15',null,h.hair,.45);
  if(blink) shape(c,'M.3 -20.2L1.55 -20.1M3.4 -20.1L4.4 -20.15',null,ink,.48);
  else { oval(c,1.12,-20.24,.46,.65,ink); oval(c,3.92,-20.3,.38,.58,ink); }
  if(id==='pasha') shape(c,'M-2.7 -20.55L-.55 -20.8Q.6 -21 2.1 -20.65L2 -19.67Q1.25 -19.13 -.1 -19.58L-.5 -20.55M2.05 -20.4L2.95 -20.48 3 -20.85 4.7 -20.75 4.58 -19.76Q3.8 -19.3 3.15 -19.7Z',null,'#534e4e',.44);
  if(id==='mom') {
    shape(c,'M-3.15 -23.65L-1.9 -25.15 .45 -25.47 1.05 -25.2 3.62 -25.4',null,'#282635',.76);
    oval(c,-2.85,-18.4,.48,.58,'#ffdca6');
  }
  shape(c,'M2 -18.25Q2.9 -17.94 3.6 -18.45',null,id==='dad'?'#e5a987':'#ab695b',.4);
}

function leg(c,phase,run,air,ascent,front,h) {
  const swing=Math.sin(phase), lift=(1-Math.cos(phase))*.5;
  const sign=front?1:-1;
  // Tuck at the apex; extend both feet below the hips during the descent.
  const rising=(1+ascent)/2, apex=1-Math.abs(ascent);
  const kneeX=air ? .7+sign*(.8+2.9*rising)+apex*1.9 : swing*run*2.55+.6;
  const kneeY=air ? -4.25-(front?3.3:1.3)*rising-1.45*apex : -4.2-run*lift*1.65;
  const footX=air ? sign*(.95+3.65*rising+2.1*apex)-.7 : swing*run*5.35+sign*.8;
  const footY=air ? -1.15-(front?4.45:1.75)*rising-(front?1.7:3.45)*apex : -1.0-run*lift*2.4;
  stroke(c,sign*.75,-8,kneeX,kneeY,footX,footY,ink,3.15);
  stroke(c,sign*.75,-7.8,kneeX,kneeY,footX,footY,front?h.pant:'#3e4355',2.2);
  c.save();c.translate(footX,footY);c.rotate(air?sign*.2:swing*.28*run);
  shape(c,'M-1.22 -.55L.9 -.6 1.63 -.1 2.55 .09 2.7 .87Q.9 1.18 -1.35 .85Z',h.shoe,ink,.53);
  shape(c,'M-1.03 .76Q.2 1 2.48 .72',null,'#e5daca',.45);c.restore();
}
function arm(c,phase,run,air,ascent,front,h) {
  const swing=Math.sin(phase), sign=front?1:-1;
  const elbowX=-1.55+swing*run*2.7 + (air? -sign*(2+ascent) : 0);
  const palmX=elbowX+.45+run*(2.4+swing) + (air? sign*2.8:0);
  const palmY=-8.6-run*(1.55+swing*1.15)-(air?2.6+sign*1.7+ascent*(front?2.6:-1):0);
  stroke(c,-1.45,-14.15,elbowX,-11.25,palmX,palmY,ink,2.95);
  stroke(c,-1.5,-14,elbowX,-11.25,palmX,palmY,front?h.jacket:h.shade,2.12);
  if(front)stroke(c,-1.8,-13.8,elbowX-.4,-11.4,palmX-.3,palmY-.3,h.lit,.38);
  oval(c,palmX,palmY,1.12,1.08,skin);
}

const motion = new WeakMap();
export function drawHero(c,s,camera) {
  const p=s.player,h=family[s.heroId];
  let m=motion.get(s);
  if(!m) { m={time:s.time,x:p.x,phase:0,ground:p.onGround,vy:p.vy,land:-5,impact:0}; motion.set(s,m); }
  const dt=s.time-m.time;
  if(dt>0) {
    const traveled=Math.abs(m.x-p.x);
    if(dt<.12 && traveled<=26) {
      if(p.onGround) m.phase+=traveled*.17;
      if(!m.ground && p.onGround) { m.land=s.time; m.impact=Math.min(1,Math.max(.38,m.vy/320)); }
    } else m.land=-5;
    Object.assign(m,{time:s.time,x:p.x,ground:p.onGround,vy:p.vy});
  }
  const run=Math.min(1,Math.abs(p.vx)/132),air=!p.onGround;
  const since=s.time-m.land, landing=since<.17?Math.sin(since/.17*Math.PI)*m.impact:0;
  const bob=air?0:-Math.abs(Math.cos(m.phase))*run*.83;
  const idle=Math.sin(s.time*3.2)*.16*(1-run);
  const ascent=Math.max(-1,Math.min(1,-p.vy/280));
  c.save();c.translate(p.x+p.w/2-camera,p.y+p.h);
  c.scale(p.facing*h.height*(1+.1*landing),h.height*(1-.12*landing));
  c.lineJoin='round';c.lineCap='round';
  leg(c,m.phase+Math.PI,run,air,ascent,false,h);
  leg(c,m.phase,run,air,ascent,true,h);
  c.translate(0,bob+idle);c.rotate((air?.048*ascent:.064*run));
  arm(c,m.phase,run,air,ascent,false,h);
  torso(c,s.heroId,h);
  head(c,s.heroId,h,s.time%3.8>3.66);
  if(!s.solo)arm(c,m.phase+Math.PI,run,air,ascent,true,h);
  c.restore();
  if(since<.19 && p.onGround && m.impact>.52) {
    const k=since/.19;
    c.save();c.globalAlpha*=.43*(1-k);
    for(const sign of [-1,1])oval(c,p.x+p.w/2-camera+sign*(3+6*k),p.y+p.h-.4-Math.sin(k*Math.PI)*1.5,1.6-k,.8-k*.35,'#f4e8d6');
    c.restore();
  }
}

// Bevelled, three-quarter boxes retain the monsters' block-game silhouettes.
function facet(c, points, color) {
  c.beginPath(); c.moveTo(points[0],points[1]);
  for(let i=2;i<points.length;i+=2)c.lineTo(points[i],points[i+1]);
  c.closePath(); c.fillStyle=color; c.fill();
}
function cube(c,x,y,w,h,d,palette) {
  const [face,light,shade]=palette, rise=d*.52;
  c.fillStyle=face; c.fillRect(x,y,w,h);
  facet(c,[x,y, x-d,y-rise, x+w-d,y-rise, x+w,y],light);
  facet(c,[x,y, x-d,y-rise, x-d,y+h-rise, x,y+h],shade);
  c.fillStyle='rgba(245,248,219,.18)';c.fillRect(x,y,w,.45);
  c.fillStyle='rgba(25,24,37,.24)';c.fillRect(x,y+h-.42,w,.42);
}
const stone=['#b7beb9','#e1e0ce','#74848b'], coal=['#302d3d','#534a59','#211e2c'];
const moss=['#7d9e58','#b0c878','#4c7256'], zombie=['#769b7b','#aec590','#506b65'];
const sea=['#4a9690','#88c8ad','#356c73'], fire=['#dd8037','#ffd36b','#a4483a'];
const purple=['#86569d','#bf86c8','#584272'], teal=['#398a87','#62b1a6','#35646d'];
const violet=['#574c78','#7d6c9c','#413950'], red=['#a64d37','#de8a47','#6e3634'];
function eyes(c,x,y,gap,color='#272936') {
  c.fillStyle=color;c.fillRect(x,y,1.12,1.5);c.fillRect(x+gap,y,1.1,1.5);
}
function humanoid(c,id,gait) {
  const bone=id==='skeleton', dark=id==='enderman', pumpkin=id==='pumpkin_guard', witch=id==='witch';
  const face=bone?stone:dark?coal:pumpkin?fire:witch?['#aa8c81','#d3b8a0','#776575']:id==='drowned'?sea:zombie;
  const coat=bone?stone:dark?coal:pumpkin?['#686f46','#a5a060','#414c3e']:witch?purple:teal;
  const pants=bone?stone:dark?coal:pumpkin?red:violet;
  for(const leg of [-1,1]) {
    const dx=gait*leg*1.85;
    stroke(c,leg*1.25,-6,leg*1.25+dx*.75,-3.5,leg*1.25+dx,-.8,pants[2],bone||dark?1.05:2.05);
    cube(c,leg*1.25+dx-.65,-1.55,1.8,1.3,.7,pants);
  }
  c.save();c.translate(0,-Math.abs(gait)*.46);
  if(witch)shape(c,'M-2.8 -11.7L2 -11.7 4.1 -3Q.5 -2 -4.15 -3.3Z',coat[0],coat[2],.65);
  else cube(c,-2.15,-11.8,4.6,6.5,1.5,coat);
  if(bone) for(let i=0;i<3;i++){c.fillStyle=coal[0];c.fillRect(-1.6,-10.9+i*1.5,3.8,.62);}
  const reach=dark?-.9:-5.9;
  stroke(c,-2.95,-11.1,-2.7+gait,-8.4,-2.8+gait*2,reach,face[2],dark?1.05:1.62);
  stroke(c,2.5,-11.1,3.25-gait,-8.3,3.5-gait*1.8,reach,face[0],dark?1.1:1.78);
  if(pumpkin){shape(c,'M-2.1 -10.7L1.8 -8.9M-.35 -11.4L-1.65 -8.4',null,'#cc9c61',.75);}
  cube(c,-2.7,-17.45,6.65,5.65,1.65,face);
  if(pumpkin) {
    shape(c,'M.3 -18.2Q-.4 -20 .8 -20.3L1.6 -20.1 .9 -18Z','#697c43');
    shape(c,'M-1.9 -14.5L-.8 -16 0 -14.55ZM1.8 -14.6L2.75 -16.1 3.5 -14.65ZM-.9 -13.8L.25 -13.2 1.15 -13.75 2 -13.25 2.8 -13.7 2.25 -12.6 .15 -12.5Z','#552e36');
  }else if(dark) {
    c.fillStyle='#ef91f9';c.fillRect(-2.1,-14.7,2.1,.84);c.fillRect(1.85,-14.7,1.7,.84);
  }else{
    eyes(c,-1.25,-15.3,3.68,bone?'#373945':witch?'#ae436d':'#273638');
    c.fillStyle=face[2];c.fillRect(.25,-13.3,1.4,.7);
    if(!bone && !witch){c.fillStyle=face[1];c.fillRect(-2.5,-16.65,2.3,.72);c.fillRect(2.55,-16.10,1.25,.7);}
  }
  if(witch){
    shape(c,'M-4.8 -17.2L-3.2 -18.2 -2 -21.7 -.3 -20.85 .45 -23.2 2.1 -22.2 .6 -21.7 2.55 -18.2 4.7 -17.3 3.3 -16.75 -2.1 -16.65Z',coal[0],coal[2],.5);
    shape(c,'M-2.7 -18L2.3 -17.9',null,'#bf9658',.68);
    oval(c,.5,-14,.72,1.1,'#c7a08d');
  }
  if(bone)shape(c,'M5 -10Q9 -7.9 4.2 -4.2L5 -10',null,'#b4855a',.67);
  c.restore();
}
function creature(c,id,t,gait) {
  if(['zombie','drowned','skeleton','pumpkin_guard','enderman','witch'].includes(id)) { humanoid(c,id,gait);return; }
  if(id==='creeper'){
    for(const i of [-1,1]) cube(c,i*2.2-1.1+gait*i,-2.8,3,2.55,1.25,moss);
    cube(c,-1.5,-11,4.2,8.5,1.65,moss);cube(c,-2.6,-17.4,6.7,6,2,moss);
    eyes(c,-1.7,-15.8,3.7); shape(c,'M.15 -14.55L1.75 -14.55 1.75 -13.65 2.55 -13.65 2.55 -12 1.75 -12 1.75 -12.6 .1 -12.6 .1 -12 -.65 -12 -.65 -13.65 .15 -13.65Z',coal[2]);
    c.fillStyle='#93b86d';c.fillRect(-1,-9.5,1.1,1.15);c.fillRect(1,-6.7,1.3,1.5);
  }else if(id==='slime'||id==='magma_cube'||id==='shulker'){
    const shell=id==='shulker',hot=id==='magma_cube';
    const col=shell?purple:hot?red:['#58b388','#aff1a7','#38857b'];
    c.save();c.scale(1+Math.sin(t*5)*.035,1-Math.sin(t*5)*.065);
    if(hot){
      for(let i=0;i<3;i++){cube(c,-5.55,-3.9-i*4.3,12,3.4,2,col);if(i<2)cube(c,-4.9,-4.65-i*4.3,10.9,.85,1,fire);}
      eyes(c,-2.65,-10.5,5.2,'#ffde65');
    }else if(shell){
      cube(c,-5,-4.4,11,4.2,2.4,col);cube(c,-2.3,-9,6.7,5.4,1.2,['#c4c486','#ede5a9','#93946c']);
      cube(c,-5,-13+Math.sin(t*3)*.45,11,4.9,2.4,col);eyes(c,-.9,-7.65,2.9);
    }else{
      cube(c,-5.5,-12.2,11.8,12,2.4,col);
      c.fillStyle='#75d397';c.fillRect(-4.25,-11.2,2.4,.9);eyes(c,-2.4,-7.9,5.3);
      c.fillStyle='#34826a';c.fillRect(.3,-4.7,2.2,1.12);
    }
    c.restore();
  }else if(id==='spider'){
    for(let i=0;i<4;i++)for(const side of [-1,1]){
      const step=Math.sin(t*10+i*1.9)*1.15;
      stroke(c,-1.5+i,-7,side*(5.8+i*.4),-10.4+i*1.3,side*(7+i*.5)+step,-1.6+i*.35,'#2d2b3b',1.35);
    }
    cube(c,-4.5,-10.7,7,6.2,2.6,coal);cube(c,.85,-8.85,5.7,5.4,1.9,['#473c49','#665462','#312c3e']);
    eyes(c,2,-7.2,2.7,'#ff817a');
  }else if(id==='blaze'){
    for(let i=0;i<6;i++){
      const a=t*2.7+i*Math.PI/3;
      cube(c,Math.cos(a)*4.6-1,-6.1+Math.sin(a)*2.2,1.55,3.75,.7,fire);
    }
    cube(c,-3,-14.9,7.4,6.8,2.2,fire);eyes(c,-1.7,-12.6,4.2);
    shape(c,'M-2 -15L-2.35 -18.5 -1.1 -17.7 .1 -19.2 .8 -16.8 2.75 -17.8 2.6 -15.65Z','#ffca67');
  }else if(id==='guardian'){
    for(const [x,y] of [[-4,-9],[-2,-13],[2,-14],[6,-9],[1,-4]]){
      facet(c,[x,y,x+Math.sign(x)*2,y-3.2,x+1.6,y+1.1],'#e89a58');
    }
    cube(c,-4.45,-11.5,9.3,8.4,2,sea);
    cube(c,-.7,-9.8,4.3,3.6,.55,['#e7dbc2','#fff2ce','#a3aca4']);oval(c,2,-8,1.1,1.15,'#b65442');
    shape(c,'M-5.2 -8.1L-8.5 -9 -9.7 -11 -9 -6.15 -6.4 -6.9Z',sea[2]);
  }else if(id==='ghost'){
    shape(c,'M-5.8 -3Q-4.2 -5.9 -4.65 -9Q-5.5 -15.2 .1 -15.6Q5.5 -15.4 5 -9.2Q4.8 -5.8 6 -4.4L3.8 -4.9 3.2 -2.4 1 -4 -.4 -1.7 -2.9 -3.45Z','#c5d9e6','#747aab',.8);
    shape(c,'M-3.5 -9.8Q-3.5 -13.4 -.6 -14',null,'#edf3f5',.75);
    eyes(c,-.9,-10.6,3.6,'#5a597f');
  }
}
export function drawBeast(c,actor,camera,time) {
  const x=actor.x+actor.w/2-camera, foot=actor.y+actor.h;
  if(x < -24||x>504||!actor.alive)return;
  const dancing=actor.dance>0,beat=Math.sin(actor.dance*10.8);
  const speed=actor.stun?0:Math.min(1,Math.abs(actor.vx)/25);
  const gait=dancing?beat:Math.sin(actor.x*.37)*speed;
  const sizing=actor.type==='enderman'?1.16:actor.type==='spider'?.94:1;
  c.save();c.lineJoin='round';c.lineCap='round';
  oval(c,x,actor.baseY+actor.h-.4,actor.w*.4,1.05,'rgba(16,24,32,.29)');
  c.translate(x+(dancing?beat*1.55:0),foot-(dancing?Math.abs(beat)*3.1:0));
  c.scale(actor.facing*sizing,sizing);
  if(dancing)c.rotate(beat*.14);
  if(actor.stun)c.globalAlpha*=.65;
  creature(c,actor.type,actor.stun?0:time,gait);
  c.restore();
}
