// Foreground materials keep a bright, continuous top edge at the exact collision height.
export const THEMES = {
  temple:    { sheet: 'world', row: 0, sky: '#638a82', fog: '#355b51', abyss: '#20413d', rim: '#d6df79', top: '#71a452', shade: '#475f52', face: '#73846d', light: '#9aab84', joint: '#475957', accent: '#e7ba54' },
  arcade:    { sheet: 'world', row: 1, sky: '#503865', fog: '#513c66', abyss: '#302943', rim: '#ffdd8b', top: '#ef9558', shade: '#5c4f83', face: '#807cb1', light: '#9cadd1', joint: '#42415f', accent: '#f58c99' },
  waterpark: { sheet: 'world', row: 2, sky: '#528fa8', fog: '#26677a', abyss: '#175671', rim: '#feefbc', top: '#e2bd6c', shade: '#367f87', face: '#57a8aa', light: '#94c6b9', joint: '#346a78', accent: '#ff8a54' },
  store:     { sheet: 'world', row: 3, sky: '#696c76', fog: '#536066', abyss: '#343e49', rim: '#ffe8a2', top: '#dfad56', shade: '#785e49', face: '#aa8056', light: '#c89b6a', joint: '#584c46', accent: '#edbd43' },
  nether:    { sheet: 'realm', row: 0, sky: '#6c3444', fog: '#652f3d', abyss: '#802f31', rim: '#d69a85', top: '#8f6572', shade: '#513842', face: '#72505a', light: '#90676b', joint: '#49313e', accent: '#ffad4b' },
  castle:    { sheet: 'realm', row: 1, sky: '#35485c', fog: '#384157', abyss: '#272c40', rim: '#c5bfd1', top: '#8d86a1', shade: '#4a425a', face: '#695f78', light: '#908198', joint: '#423b51', accent: '#ffad54' },
  end:       { sheet: 'realm', row: 2, sky: '#45305c', fog: '#493556', abyss: '#2b223f', rim: '#f2e3b2', top: '#cbc497', shade: '#777469', face: '#b2ac8c', light: '#d2c8a3', joint: '#77746e', accent: '#e9a4ed' },
};

export function rect(c, ink, x, y, w, h) {
  c.fillStyle = ink;
  c.fillRect(Math.round(x), Math.round(y), w, h);
}

function line(c, ink, x, y, tx, ty, weight = 1) {
  const steps = Math.max(1, Math.abs(tx-x), Math.abs(ty-y));
  for (let i=0; i<=steps; i++) rect(c,ink,x+(tx-x)*i/steps,y+(ty-y)*i/steps,weight,weight);
}

function vine(c,x,y,length) {
  rect(c,'#537349',x,y,1,length);
  for(let i=3;i<length;i+=5) rect(c,i%2 ? '#607e4c' : '#94a75f',x+(i%2 ? -2:0),y+i,3,2);
}

function platformFace(c, theme, id, p) {
  const {x,y,w,h}=p;
  rect(c,theme.joint,x,y,w,h);
  rect(c,theme.face,x+1,y+3,w-2,Math.max(1,h-4));
  const bw=id==='waterpark' ? 9 : id==='store' ? 29 : 17;
  const bh=id==='waterpark' ? 9 : id==='store' ? 7 : 10;
  // All texturing stays inside the actual bounds, including short flying platforms.
  c.save();
  c.beginPath(); c.rect(x+1,y+3,w-2,Math.max(0,h-4)); c.clip();
  for(let row=0,py=y+5;py<y+h;row++,py+=bh) {
    const offset=(row%2 && id!=='waterpark') ? Math.floor(bw/2):0;
    const band=py+bh-1;
    rect(c,theme.shade,x,band,w,1);
    for(let px=x-offset;px<x+w;px+=bw) {
      const seed=Math.abs((px*47 + py*23)%103);
      if(id==='end') {
        rect(c,theme.shade,px+seed%10+2,py+3,3,2);
        rect(c,theme.light,px+seed%10+2,py+5,3,1);
      } else {
        rect(c,theme.shade,px,py,1,bh-1);
        rect(c,theme.light,px+2,py+1,2+seed%6,1);
        if(id==='store') rect(c,theme.shade,px+7+seed%9,py+4,4,1);
        else if(seed%4===0) rect(c,theme.shade,px+4,py+5,3,1);
      }
    }
  }
  if(id==='arcade') {
    for(let px=x+6;px<x+w;px+=32) {
      line(c,theme.shade,px,y+7,px+11,y+18,2);
      line(c,theme.light,px+11,y+17,px+22,y+7,1);
    }
  }
  if(id==='nether') {
    for(let px=x+12;px<x+w;px+=38) {
      const py=y+15+(px%9);
      line(c,'#bd6654',px,py,px+5,py+1);
      line(c,'#e08c61',px+5,py+1,px+8,py-2);
      rect(c,'#b46850',px+8,py-2,4,1);
    }
  }
  c.restore();
}

function surface(c,t,id,p) {
  const {x,y,w}=p;
  rect(c,t.top,x,y,w,4);
  rect(c,t.rim,x,y,w,1);
  rect(c,t.shade,x,y+4,w,1);
  for(let dx=3;dx<w-3;dx+=id==='waterpark'?11:16) {
    if(id==='temple') {
      rect(c,t.top,x+dx,y+3,3+(dx%4),2+(dx%3));
      if(dx%3===0) vine(c,x+dx+1,y+5,5+dx%8);
    } else if(id==='arcade') {
      rect(c,'#f7c778',x+dx,y+1,6,2);
      rect(c,'#d88474',x+dx+7,y+1,5,2);
    } else if(id==='store') {
      rect(c,t.rim,x+dx,y+2,5,1);
    } else {
      rect(c,t.shade,x+dx,y+1,1,2);
    }
  }
}

function masonryDetail(c,id,t,x,y) {
  if(id==='temple') {
    rect(c,t.shade,x-8,y-4,17,9); rect(c,t.joint,x-6,y-5,13,11);
    for(let i=-3;i<=3;i++) rect(c,Math.abs(i)>1?t.light:t.face,x-3+Math.abs(i),y+i,7-2*Math.abs(i),1);
    rect(c,'#a2ba79',x-1,y-2,2,2);
    vine(c,x+9,y-8,10);
  } else if(id==='arcade') {
    rect(c,t.joint,x-12,y-5,25,10); rect(c,'#5f698b',x-11,y-4,23,8);
    for(const dx of [-7,0,7]) {
      rect(c,'#d9a88d',x+dx-1,y-1,3,3); rect(c,'#ffe0a1',x+dx-1,y-1,2,1);
    }
  } else if(id==='waterpark') {
    rect(c,t.shade,x-10,y-4,21,9); rect(c,t.light,x-9,y-3,19,7);
    for(let dx=-7;dx<9;dx+=4) rect(c,t.joint,x+dx,y-1,2,4);
  } else if(id==='store') {
    rect(c,t.joint,x-16,y-6,33,14); rect(c,t.face,x-15,y-5,31,12);
    for(let dx=-12;dx<=4;dx+=16) {
      rect(c,t.light,x+dx,y-3,10,8); rect(c,t.shade,x+dx+3,y-2,5,2);
    }
  } else if(id==='nether') {
    rect(c,t.joint,x-8,y-2,10,3); rect(c,t.shade,x-3,y-4,10,4);
    line(c,'#c67d67',x-5,y-2,x-1,y);
    rect(c,'#e29468',x,y,3,1); rect(c,'#a96c5b',x+3,y-2,2,2);
  } else if(id==='castle') {
    rect(c,t.joint,x-5,y-3,11,11); rect(c,t.joint,x-3,y-5,7,2);
    rect(c,t.light,x-5,y-4,2,8); rect(c,'#b78b6c',x-2,y-3,5,8);
    rect(c,'#e8ad6e',x-1,y-2,3,5); rect(c,t.joint,x,y-4,1,11);
    rect(c,t.shade,x-6,y+7,13,2);
  } else {
    for(const [dx,dy] of [[-6,0],[-3,-3],[0,-6],[3,-3],[6,0],[3,3],[0,6],[-3,3]]) {
      rect(c,'#94849a',x+dx,y+dy,3,2);
    }
    rect(c,'#d2c0c4',x,y-5,2,2); rect(c,'#9b8a99',x,y,2,2);
  }
}

function bridge(c,t,id,p) {
  const {x,y,w,h}=p;
  const depth=Math.max(4,Math.min(h,12));
  rect(c,t.joint,x,y+2,w,depth-2);
  rect(c,t.top,x,y,w,4);
  rect(c,t.rim,x,y,w,1);
  for(let i=0;i<w;i+=8) {
    rect(c,t.shade,x+i,y+1,1,3);
    if(i+4<w) rect(c,t.light,x+i+2,y+1,3,1);
  }
  for(let i=2; i+13<w;i+=16) {
    line(c,t.face,x+i,y+4,x+i+5,y+depth-2);
    line(c,t.light,x+i+6,y+depth-2,x+i+12,y+4);
  }
  rect(c,t.shade,x+1,y+depth-1,w-2,1);
  if(id==='temple') for(let i=10;i<w-3;i+=27) vine(c,x+i,y+depth,5+i%7);
}

function ledge(c,t,id,p) {
  const {x,y,w,h}=p;
  const depth=Math.max(4,Math.min(10,h));
  rect(c,t.joint,x,y+1,w,depth-2);
  rect(c,t.face,x+1,y+2,w-2,depth-3);
  rect(c,t.rim,x,y,w,1);
  rect(c,t.top,x+1,y+1,w-2,2);
  for(let dx=4;dx<w-3;dx+=10) {
    rect(c,t.light,x+dx,y+4,4,1);
    if(dx+2<w-2) rect(c,t.shade,x+dx+1,y+depth-2,3,1);
  }
  if(id==='waterpark' || id==='arcade') {
    rect(c,t.accent,x+2,y+depth-1,w-4,1);
  }
}

export function terrainLayer(level,viewHeight) {
  const image=document.createElement('canvas');
  image.width=level.width;
  image.height=viewHeight;
  const c=image.getContext('2d'), t=THEMES[level.id];
  for(const p of level.platforms) {
    if(p.kind==='bridge') bridge(c,t,level.id,p);
    else if(p.kind==='ledge') ledge(c,t,level.id,p);
    else {
      platformFace(c,t,level.id,p);
      surface(c,t,level.id,p);
      const inset=32+(p.x%67);
      for(let dx=inset;dx<p.w-19;dx+=127) {
        if(p.h>27) masonryDetail(c,level.id,t,p.x+dx,p.y+19);
      }
    }
  }
  return image;
}

function farObject(c,id,t,x,y) {
  const dark=t.abyss, light=t.fog;
  if(id==='temple') {
    // Broken stepped masonry and jade shoots.
    rect(c,dark,x-15,y-7,31,7);
    rect(c,dark,x-9,y-12,20,6);
    rect(c,dark,x-5,y-25,10,16);
    rect(c,light,x-5,y-25,3,14);
    line(c,light,x+12,y-2,x+19,y-15,2);
    rect(c,light,x+17,y-17,6,3);
  } else if(id==='arcade') {
    rect(c,dark,x-2,y-28,4,28);
    rect(c,light,x-8,y-30,17,4);
    rect(c,dark,x-11,y-29,3,6);
    rect(c,dark,x+9,y-29,3,6);
    for(const dx of [-8,7]) { rect(c,dark,x+dx,y-25,1,12); rect(c,light,x+dx-2,y-13,5,2); }
    rect(c,dark,x-6,y-2,13,2);
  } else if(id==='waterpark') {
    rect(c,dark,x-9,y-18,3,18); rect(c,dark,x+8,y-16,3,16);
    line(c,light,x-17,y-21,x-4,y-21,3);
    line(c,light,x-4,y-21,x+8,y-10,3);
    rect(c,light,x+9,y-10,9,3);
  } else if(id==='store') {
    for(const dx of [-10,10]) rect(c,dark,x+dx,y-25,2,25);
    for(const dy of [-24,-14,-3]) rect(c,light,x-10,y+dy,22,2);
    rect(c,dark,x-7,y-10,9,7); rect(c,dark,x+3,y-20,6,6);
  } else if(id==='nether') {
    for(const [dx,h,w] of [[-11,10,8],[-5,22,10],[4,15,6]]) {
      rect(c,dark,x+dx,y-h,w,h);
      rect(c,light,x+dx+1,y-h,2,h-2);
    }
  } else if(id==='castle') {
    rect(c,dark,x-13,y-15,27,15);
    for(const dx of [-14,8]) {
      rect(c,dark,x+dx,y-23,7,23);
      rect(c,light,x+dx+1,y-27,5,4); rect(c,light,x+dx+3,y-30,1,3);
      rect(c,light,x+dx+2,y-17,2,5);
    }
  } else {
    rect(c,dark,x-3,y-23,6,23);
    rect(c,light,x-3,y-23,2,22);
    rect(c,dark,x-8,y-13,8,3);
    rect(c,dark,x-9,y-17,3,6);
    rect(c,dark,x+1,y-7,9,3);
    rect(c,dark,x+8,y-13,3,7);
    rect(c,light,x-4,y-26,6,4);
  }
}

export function midgroundLayer(level,viewWidth,viewHeight) {
  const image=document.createElement('canvas');
  // An independent slower layer allows the skyline to slide behind the platforms.
  image.width=viewWidth+Math.ceil((level.width-viewWidth)*.36);
  image.height=viewHeight;
  const c=image.getContext('2d'), t=THEMES[level.id];
  const horizon=187;
  for(let i=0,x=-12;x<image.width+30;i++,x+=41) {
    const y=horizon + Math.round(3*Math.sin(i*1.64));
    rect(c,t.abyss,x,y,42,viewHeight-y);
    if(i%2===1) farObject(c,level.id,t,x+10,y);
  }
  return image;
}

export function drawDepth(c,level,camera,time,width,height) {
  const id=level.id,t=THEMES[id];
  const hot=id==='nether', wet=id==='waterpark' || id==='temple';
  const base=hot ? 207 : 211;
  rect(c,t.abyss,0,base,width,height-base);
  if(hot||wet) {
    const phase=Math.floor(time*6);
    for(let i=-1;i<width/13+1;i++) {
      const x=i*13-(Math.floor(camera*.58)%13);
      const dy=(i+phase)%4===0 ? -1:0;
      rect(c,hot?'#ec713a':id==='waterpark'?'#66babc':'#54968a',x,base+dy,10,1);
      rect(c,hot?'#c74732':'#457c82',x+3,base+3+dy,7,1);
      if(hot && (i+phase)%7===0) rect(c,'#ffae4d',x+4,base-3,2,2);
    }
  }
}
