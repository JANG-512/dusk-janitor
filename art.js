const DuskArt = (() => {
  'use strict';

  const monsterTypes = [
    { body: '#9f467e', light: '#da6fae', eye: '#ffd1ab' },
    { body: '#8061a0', light: '#bd8fe0', eye: '#fff0b1' },
    { body: '#934b56', light: '#ed846d', eye: '#ffe3a9' }
  ];

  const barriers = {
    house: [23, 10, -5], chapel: [30, 13, -9], well: [10, 7, -4],
    tree: [6, 5, -1], fruit: [6, 5, -1], fence: [17, 3, -3],
    crate: [6, 4, -2], bench: [9, 4, -2], lamp: [3, 3, 0], grave: [4, 3, 0]
  };

  function randomSource(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  function pixelEllipse(ctx, x, y, rx, ry, color, step = 1) {
    for (let row = -ry; row <= ry; row += step) {
      const width = Math.floor(rx * Math.sqrt(1 - (row / (ry + .5)) ** 2));
      rect(ctx, x - width, y + row, width * 2 + 1, step, color);
    }
  }

  function buildStain(type, seed) {
    const stain = document.createElement('canvas');
    stain.width = 116;
    stain.height = 76;
    const ctx = stain.getContext('2d');
    const random = randomSource(seed);
    const colors = [
      ['#433347', '#66425c', '#7b4c66', '#91607a'],
      ['#3a314a', '#514062', '#695077', '#8b688d'],
      ['#48333e', '#67424b', '#82545b', '#9f6a6d']
    ][type];
    const spots = [
      [57, 38, 34 + Math.floor(random() * 6), 16 + Math.floor(random() * 7)],
      [26 + Math.floor(random() * 20), 33 + Math.floor(random() * 16), 19, 9],
      [74 + Math.floor(random() * 11), 39 + Math.floor(random() * 12), 21, 11],
      [60 + Math.floor(random() * 12), 23 + Math.floor(random() * 9), 16, 8]
    ];
    for (const [x, y, w, h] of spots) pixelEllipse(ctx, x, y, w, h, colors[0], 2);
    for (const [x, y, w, h] of spots) pixelEllipse(ctx, x - 1, y, w - 5, h - 4, colors[1], 2);
    pixelEllipse(ctx, 57, 38, 23, 11, colors[2], 2);
    for (let n = 0; n < 114; n++) {
      const x = 5 + Math.floor(random() * 106);
      const y = 5 + Math.floor(random() * 66);
      const distance = Math.hypot((x - 57) / 45, (y - 38) / 23);
      if (distance > 1.22) continue;
      const color = colors[Math.floor(random() * colors.length)];
      rect(ctx, x, y, Math.floor(random() * 6) + 1, n % 4 === 0 ? 2 : 1, color);
      if (n % 21 === type) rect(ctx, x, y - 1, 2, 2, '#c77c9f');
    }
    return stain;
  }

  function timberHouse(ctx, x, y, color, chapel) {
    const half = chapel ? 32 : 24;
    pixelEllipse(ctx, x + 5, y + 4, half + 7, 9, '#23253391', 2);
    rect(ctx, x - half + 2, y - 20, half * 2 - 4, 23, '#2c2639');
    rect(ctx, x - half + 4, y - 19, half * 2 - 8, 19, '#a08885');
    rect(ctx, x - half + 5, y - 16, half * 2 - 10, 3, '#735c66');
    rect(ctx, x - half + 4, y - 3, half * 2 - 8, 3, '#777580');
    for (let col = -half + 4; col < half; col += 11) {
      rect(ctx, x + col, y - 15, 2, 14, '#5a454d');
    }
    rect(ctx, x - 5, y - 14, 11, 17, '#3e2e42');
    rect(ctx, x - 3, y - 12, 7, 13, '#625061');
    rect(ctx, x + 2, y - 6, 1, 2, '#cf9e68');
    for (const offset of [-15, 12]) {
      rect(ctx, x + offset - 1, y - 13, 7, 8, '#4a3546');
      rect(ctx, x + offset, y - 12, 5, 5, '#d59e71');
      rect(ctx, x + offset + 2, y - 12, 1, 5, '#8d5c64');
    }
    for (let row = 0; row < 7; row++) {
      const w = Math.min(half + 3, (row + 1) * 5);
      const top = y - 45 + row * 4;
      rect(ctx, x - w - 1, top, (w + 1) * 2, 5, '#382d44');
      rect(ctx, x - w, top + 1, w * 2, 3, color);
      rect(ctx, x - w, top + 1, w, 1, '#b17890');
      for (let col = -w + 3 + row % 2 * 3; col < w - 3; col += 7) {
        rect(ctx, x + col, top + 2, 1, 2, '#4b364b');
      }
    }
    rect(ctx, x - half - 3, y - 18, (half + 3) * 2, 3, '#362b41');
    rect(ctx, x - half, y - 18, half * 2, 1, '#a37688');
    // Loose shutters and moss gather around the older stonework.
    for (const side of [-1, 1]) {
      const ledge = x + side * 14;
      rect(ctx, ledge - 4, y - 5, 8, 2, '#593f49');
      rect(ctx, ledge - 3, y - 6, 6, 1, '#bd9280');
      for (let leaf = 0; leaf < 4; leaf++) {
        rect(ctx, x + side * (half - 4 + leaf % 2), y - 16 + leaf * 2, 3, 3, '#5c795e');
      }
    }
    if (!chapel) {
      rect(ctx,x+9,y-43,5,10,'#725869');
      rect(ctx,x+8,y-44,7,3,'#aa8591');
      rect(ctx,x-9,y+2,18,2,'#8e7b83');
    }
    if (chapel) {
      rect(ctx, x - 5, y - 48, 10, 15, '#493951');
      rect(ctx, x - 3, y - 46, 6, 9, '#ae827b');
      rect(ctx, x - 10, y - 47, 20, 3, '#986379');
      rect(ctx, x - 6, y - 52, 12, 5, '#986379');
      rect(ctx, x - 1, y - 56, 2, 4, '#ba8d91');
    }
  }

  function tree(ctx, x, y, fruit) {
    pixelEllipse(ctx, x + 6, y + 3, 15, 5, '#242c3e85', 2);
    rect(ctx, x - 3, y - 15, 7, 16, '#49404a');
    rect(ctx, x - 2, y - 12, 2, 13, '#8b6f64');
    rect(ctx, x + 4, y - 1, 4, 2, '#4d454e');
    pixelEllipse(ctx, x, y - 18, 17, 10, '#273844', 2);
    pixelEllipse(ctx, x + 1, y - 25, 14, 12, '#2f4148', 2);
    pixelEllipse(ctx, x - 7, y - 24, 10, 9, '#405851', 2);
    pixelEllipse(ctx, x + 6, y - 20, 11, 8, '#425751', 2);
    pixelEllipse(ctx, x - 2, y - 29, 10, 7, '#5a6d5c', 2);
    rect(ctx, x - 10, y - 23, 5, 2, '#667b65');
    rect(ctx, x + 5, y - 21, 6, 2, '#556a5d');
    rect(ctx, x - 4, y - 32, 5, 2, '#76836a');
    if (fruit) {
      for (const [dx, dy] of [[-9, -22], [-3, -27], [7, -23], [2, -17]]) {
        rect(ctx, x + dx, y + dy, 3, 3, '#be7a6c');
        rect(ctx, x + dx, y + dy, 1, 1, '#ecac80');
      }
    }
  }

  function drawProp(ctx, [type, x, y], zone, clean, time) {
    ctx.save();
    ctx.globalAlpha = .18 + clean * .1;
    if (type === 'lamp') {
      pixelEllipse(ctx, x, y - 8, 16, 11, '#dfac66', 2);
    }
    ctx.restore();
    switch (type) {
      case 'shelf':
        rect(ctx,x-15,y-22,30,23,'#3a2933');
        for (let row=0; row<2; row++) {
          for(let i=0;i<7;i++) {
            const h=5+(row+i)%3;
            rect(ctx,x-12+i*4,y-13+row*10-h,3,h,['#9d6556','#6f9391','#af926a','#83768d'][(i+row)%4]);
          }
          rect(ctx,x-14,y-13+row*10,28,2,'#ba9069');
        }
        break;
      case 'net':
        for (const end of [-12,12]) rect(ctx,x+end,y-18,3,19,'#896957');
        for(let i=-11;i<=12;i++){
          const sag=Math.round((1-(i/12)**2)*5);
          for(let j=0;j<=8;j++) if(j===0 || (i+j)%4===0 || (i-j)%4===0)
            rect(ctx,x+i,y-16+sag+j,1,1,'#c0af8f');
        }
        break;
      case 'furnace':
        rect(ctx,x+4,y-24,7,11,'#594d55');
        rect(ctx,x-12,y-16,25,17,'#343440');
        rect(ctx,x-10,y-14,21,12,'#857377');
        rect(ctx,x-7,y-10,15,8,'#4e363e');
        for(let i=0;i<5;i++) rect(ctx,x-6+i*3,y-7-Math.floor(2*Math.sin(time*4+i)),2,5,i%2?'#e19255':'#ffbf71');
        break;
      case 'house':
      case 'chapel':
        timberHouse(ctx, x, y, zone.roof, type === 'chapel');
        break;
      case 'tree':
      case 'fruit':
        tree(ctx, x, y, type === 'fruit');
        break;
      case 'well':
        pixelEllipse(ctx, x + 3, y + 1, 16, 8, '#2b2938', 2);
        pixelEllipse(ctx, x, y - 4, 13, 10, '#484654', 2);
        pixelEllipse(ctx, x, y - 8, 13, 8, zone.stone, 2);
        pixelEllipse(ctx, x, y - 8, 9, 5, clean >= 1 ? '#538e9a' : '#444358');
        rect(ctx, x - 5, y - 8, 7, 1, clean >= 1 ? '#b8e9d9' : '#827084');
        for (let brick = -9; brick <= 9; brick += 6) rect(ctx, x + brick, y - 1, 4, 2, '#9893a0');
        break;
      case 'bench':
      case 'fence': {
        const half = type === 'bench' ? 10 : 18;
        rect(ctx, x - half, y - 9, half * 2, 3, '#75575b');
        rect(ctx, x - half, y - 4, half * 2, 3, '#80635f');
        for (let post = -half; post < half; post += 8) {
          rect(ctx, x + post, y - 11, 2, 12, '#4c3e4c');
          rect(ctx, x + post, y - 11, 2, 2, '#a58370');
        }
        break;
      }
      case 'lamp':
        rect(ctx, x - 2, y - 16, 4, 16, '#403641');
        rect(ctx, x - 4, y - 17, 8, 7, '#54424b');
        rect(ctx, x - 3, y - 16, 6, 5, Math.floor(time * 2) % 4 ? '#e5b17d' : '#f2c390');
        rect(ctx, x - 1, y - 15, 2, 3, '#f9d39a');
        rect(ctx, x - 2, y - 19, 4, 2, '#55414f');
        break;
      case 'crate':
        rect(ctx, x - 6, y - 10, 12, 11, '#3d3442');
        rect(ctx, x - 5, y - 9, 10, 8, '#8b6b61');
        rect(ctx, x - 2, y - 8, 5, 5, '#604950');
        rect(ctx, x - 4, y - 9, 8, 1, '#ae8b73');
        break;
      case 'grave':
        rect(ctx, x - 5, y - 8, 10, 9, '#393542');
        rect(ctx, x - 3, y - 10, 6, 9, '#8b8795');
        rect(ctx, x - 1, y - 7, 3, 1, '#555463');
        rect(ctx, x - 4, y - 1, 8, 2, '#696674');
        break;
    }
  }

  // Every character is one source pixel. Shared timber and brass keep the village fixtures related.
  const stationSprites = [
    ['   bbbbbbbbbbb   ', '   b..g..i..gb   ', '   b..g.ii..gb   ', '   b..g..i...b   ', '   bbbbbbbbbbb   ', '  ii   gg    ll  ', ' diii  gg  llll  ', ' bGGGGGGGGGGGGGb ', ' dBBBBBBBBBBBBBd ', '  bd  ggggg  db  ', '  bd  bGGGb  db  ', '  dd  ddddd  dd  '],
    ['      lll      ', '     lgggl     ', '      gig      ', '    iiigiii    ', '   iggiiiggi   ', '  diiiiiiiiid  ', '   ibbbbb b i  ', '   i b    b i  ', '   i  llll  i  ', '  iillLLllliii ', ' diiigggggiiid ', '  dbiibbiibbd  ', '  diibbiibbid  '],
    ['     gggg      ', '   bbGGGGbbb   ', '  bBGGBBBGGBb  ', '  bBGGBBBGGBb  ', '  bgggggggggb  ', '  dBBBgigBBBd  ', '  dBGBgigBGBd  ', '  dBGGBBBGGBd  ', '  dbbbbbbbbbd  ', '   dd     dd   ']
  ];
  function drawStation(ctx, station, time) {
    const {x, y, kind, used} = station;
    const palette = { b:'#6f4754', B:'#a06759', d:'#392e41', g:'#c89763', G:'#d99a73', i:'#9090a1', l:'#86cbb4', L:'#def9c3' };
    pixelEllipse(ctx, x + 2, y, 17, 5, '#24213299');
    const rows = stationSprites[kind];
    rows.forEach((row, iy) => {
      for (let ix = 0; ix < row.length; ix++) {
        const color = palette[row[ix]];
        if (color) rect(ctx, x - 16 + ix * 2, y - rows.length * 2 + iy * 2, 2, 2, color);
      }
    });
    if (!used) {
      const top = y - rows.length * 2 - 7 + Math.round(Math.sin(time * 4) * 2);
      rect(ctx,x-1,top,3,5,'#ffdc97');
      rect(ctx,x-2,top+1,5,2,'#ffedbd');
    }
  }

  function drawHero(ctx, hero, time) {
    const { x, y } = hero;
    const side = hero.facing.x < -.05 ? -1 : 1;
    const step = hero.moving ? Math.floor(time * 13) % 2 : 0;
    pixelEllipse(ctx, x, y, 8, 3, '#242035b8', 2);
    ctx.save();
    if (hero.invulnerable > 0 && Math.floor(time * 18) % 2) ctx.globalAlpha = .45;
    rect(ctx, x - 5, y - 6, 10, 5, '#363549');
    rect(ctx, x - 4, y - 4 - step, 3, 5, '#211e2e');
    rect(ctx, x + 1, y - 4 + step, 3, 4, '#211e2e');
    rect(ctx, x - 5, y - 11, 10, 7, '#c69a62');
    rect(ctx, x - 3, y - 10, 6, 7, '#826b8c');
    rect(ctx, x - 2, y - 9, 4, 2, '#b997bd');
    rect(ctx, x - 4, y - 15, 8, 6, '#edd0ad');
    rect(ctx, x + side * 2, y - 13, 1, 2, '#3a2c40');
    rect(ctx, x - 6, y - 16, 12, 2, '#3a334b');
    rect(ctx, x - 4, y - 19, 8, 4, '#d5b580');
    rect(ctx, x - 3, y - 19, 6, 1, '#f2d8a3');
    rect(ctx, x + side * 6 - 1, y - 12, 2, 11, '#885f54');
    rect(ctx, x + side * 6 - 2, y - 4, 4, 5, '#dfb575');
    rect(ctx, x + side * 6 - 2, y - 2, 4, 2, '#a87858');
    // A tied scarf, tool belt and stitched satchel follow the cleaner's stride.
    rect(ctx,x-4,y-11,8,2,hero.scarf || '#69ada0');
    rect(ctx,x-side*6,y-11+step,3,4,'#48877e');
    rect(ctx,x-5,y-6,10,2,'#564151');
    rect(ctx,x,y-6,2,2,'#f3cb83');
    rect(ctx,x-side*5-2,y-8,4,5,'#935e52');
    rect(ctx,x-side*5-2,y-8,4,1,'#dfad77');
    rect(ctx,x-5,y-17,10,2,'#987054');
    rect(ctx,x-7,y-16,14,1,'#edce94');
    if (hero.role === 'alchemist') {
      rect(ctx,x-4,y-16,9,3,'#4b3a53');
      rect(ctx,x-3,y-16,3,2,'#a9dfda');
      rect(ctx,x+2,y-16,2,2,'#a9dfda');
      rect(ctx,x-6,y-6,3,4,'#f29479');
    } else if (hero.role === 'keeper') {
      rect(ctx,x-6,y-20,3,5,'#a488be');
      rect(ctx,x-7,y-21,2,3,'#d3afdb');
      rect(ctx,x+5,y-7,3,4,'#a9e5b3');
    }
    for (let n=0;n<3;n++) rect(ctx,x+side*6-2+n*2,y-1,1,3,'#f1ca83');
    ctx.restore();
  }

  function drawKeg(ctx,x,y,time) {
    pixelEllipse(ctx,x+2,y,9,3,'#302434');
    rect(ctx,x-7,y-12,14,12,'#663b48');
    rect(ctx,x-5,y-14,10,14,'#a65d4c');
    for (const dy of [-12,-4]) rect(ctx,x-7,y+dy,14,2,'#c6a476');
    rect(ctx,x-2,y-10,4,2,'#ffd681');
    rect(ctx,x-1,y-8,2,3,'#ffba51');
    rect(ctx,x+2,y-17,2,4,'#5c4245');
    rect(ctx,x+3,y-18,2,2,Math.floor(time*6)%2 ? '#fff4a7' : '#ee805d');
  }

  function drawTerrain(ctx, patch, time) {
    const {x,y,rx,ry,kind}=patch;
    const wave=Math.sin(time*2+x);
    if(kind==='pool') {
      pixelEllipse(ctx,x,y,rx,ry,'#716c64',2);
      pixelEllipse(ctx,x,y-1,rx-2,ry-2,'#345866',2);
      pixelEllipse(ctx,x+3,y,rx-8,ry-5,'#467783',2);
      for(let n=0;n<5;n++) {
        rect(ctx,x-15+n*7+wave,y+(n%3)*4-5,4+n%3,1,'#97c9bd');
        const stalk=x-18+n*3;
        rect(ctx,stalk,y-7-n%3,1,7,'#819469');
        rect(ctx,stalk,y-10-n%3,2,4,'#c79783');
      }
    } else if(kind==='wind') {
      pixelEllipse(ctx,x,y,rx,ry,'#4a5156',2);
      for(let n=-1;n<=1;n++) {
        const px=x+n*13;
        rect(ctx,px-4,y-7,10,13,'#758080');
        rect(ctx,px-4,y-7,9,2,'#a7a899');
        for(let k=0;k<4;k++) {
          const color=wave+n*.3>0 ? '#c9e3bd' : '#9ab8ae';
          rect(ctx,px+k-2,y-4+k,2,2,color);
          rect(ctx,px+k-2,y+4-k,2,2,color);
        }
      }
    } else {
      pixelEllipse(ctx,x,y,rx,ry,'#405748',2);
      for(let n=0;n<12;n++) {
        const a=n*2.4;
        const xx=x+Math.cos(a)*(8+n), yy=y+Math.sin(a)*(4+n*.55);
        rect(ctx,xx,yy-2,2,5,'#829365');
        rect(ctx,xx-2,yy-3,5,2,patch.spent?'#8c897c':'#e6b8bc');
        rect(ctx,xx,yy-5,1,4,patch.spent?'#a19b80':'#f5dca3');
        if(!patch.spent && n%3===0) rect(ctx,xx+wave*2,yy-7-Math.sin(time+a)*3,2,2,'#eee6a6');
      }
    }
  }

  function drawMonster(ctx, monster, time) {
    const { x, y, type, friendly, fear, hp, maxHp, windup } = monster;
    const tone = friendly ? { body: '#477b6b', light: '#89cba3', eye: '#e8ffce' } : monsterTypes[type];
    const bob = Math.floor(time * (fear > 0 ? 18 : 5) + monster.id) % 2;
    const shake = fear > 0 ? bob * 2 - 1 : 0;
    const mid = x + shake;
    const base = y - bob - (type === 1 ? 3 : 0);
    const half = type === 2 ? 8 : 7;
    pixelEllipse(ctx, x, y, half + 1, 3, '#2d2037c5', 2);
    if (type === 0) {
      rect(ctx, mid - 9, base - 5, 3, 5, '#35233f');
      rect(ctx, mid + 6, base - 5, 3, 5, '#35233f');
      rect(ctx, mid - 9, base - 5, 2, 2, tone.light);
      rect(ctx, mid + 7, base - 5, 2, 2, tone.light);
    } else if (type === 2) {
      rect(ctx, mid - 10, base - 15, 4, 8, '#392641');
      rect(ctx, mid + 6, base - 15, 4, 8, '#392641');
      rect(ctx, mid - 10, base - 15, 2, 5, tone.light);
      rect(ctx, mid + 8, base - 15, 2, 5, tone.light);
    }
    rect(ctx, mid - half, base - 9, half * 2, 8, '#35233f');
    rect(ctx, mid - half + 1, base - 9, half * 2 - 2, 7, tone.body);
    rect(ctx, mid - half + 3, base - 12, half * 2 - 6, 5, tone.body);
    rect(ctx, mid - half + 3, base - 11, half * 2 - 6, 2, tone.light);
    rect(ctx, mid - half + 2, base - 4, 3, 4, tone.body);
    rect(ctx, mid + half - 5, base - 4, 3, 4, tone.body);
    rect(ctx, mid - 4, base - 7, 8, 4, '#392441');
    if (type === 1) {
      rect(ctx, mid - 3, base - 7, 6, 3, tone.eye);
      rect(ctx, mid, base - 8, 2, 4, '#52345d');
      rect(ctx, mid - 1, base, 2, 3, tone.light);
    } else {
      rect(ctx, mid - 3, base - 7, 2, fear > 0 ? 4 : 2, tone.eye);
      rect(ctx, mid + 1, base - 7, 2, fear > 0 ? 4 : 2, tone.eye);
      if (type === 2) {
        rect(ctx, mid - 4, base - 3, 8, 2, '#392441');
        rect(ctx, mid - 3, base - 3, 1, 2, tone.eye);
        rect(ctx, mid + 2, base - 3, 1, 2, tone.eye);
      }
    }
    if (type === 1) {
      for (const side of [-1, 1]) {
        rect(ctx, mid + side*8-2, base-10-bob*2, 4, 5, tone.body);
        rect(ctx, mid + side*11-1, base-13-bob*2, 3, 6, tone.light);
        rect(ctx, mid + side*13, base-15-bob*2, 1, 5, tone.eye);
      }
    } else if (type === 2) {
      for (const side of [-1, 1]) {
        rect(ctx,mid+side*9-1,base-18,3,4,'#e8c6a1');
        rect(ctx,mid+side*6-2,base-8,4,3,'#715364');
        rect(ctx,mid+side*6-1,base-8,3,1,'#cca19a');
      }
    } else {
      for (const side of [-1,1]) {
        rect(ctx,mid+side*8,base-4,2,4,tone.body);
        rect(ctx,mid+side*10,base-2+bob,2,3,tone.light);
      }
      rect(ctx,mid-3,base-13,2,3,tone.light);
      rect(ctx,mid,base-15,2,4,tone.body);
    }
    if (monster.spore || monster.warden) {
      const boss = monster.warden;
      const width = boss ? 15 : 10;
      rect(ctx,mid-width,base-14,width*2,5,boss ? '#ad844e' : '#bb6989');
      rect(ctx,mid-width+3,base-18,width*2-6,5,boss ? '#d7aa6a' : '#de91ab');
      rect(ctx,mid-3,base-20,6,3,boss ? '#ffde96' : '#f5bbcb');
      for (const dx of [-5,2]) rect(ctx,mid+dx,base-16,3,2,'#ffe3c0');
      if (boss) {
        rect(ctx,mid-14,base-25,28,3,'#392736');
        rect(ctx,mid-14,base-25,Math.ceil(28*hp/maxHp),2,'#f3af72');
      }
    }
    if(monster.breed==='prism') {
      for(const side of [-1,1]) {
        const wing=mid+side*11;
        pixelEllipse(ctx,wing,base-13-bob*2,5,6,'#706293',2);
        rect(ctx,wing-3,base-16-bob*2,5,3,'#ada1dd');
        rect(ctx,wing-1,base-15-bob*2,2,4,windup>0?'#fff1a7':'#81d0cf');
      }
    } else if(monster.breed==='mender') {
      rect(ctx,mid-8,base-13,16,3,'#648166');
      for(let n=-1;n<=1;n++) {
        rect(ctx,mid+n*5-2,base-16-Math.abs(n),4,4,'#91ae84');
        rect(ctx,mid+n*5,base-18-Math.abs(n),2,4,'#d6d89e');
      }
      rect(ctx,mid+7,base-10,2,12,'#7b6559');
      rect(ctx,mid+6,base-13,4,4,'#a7ebba');
    } else if(monster.breed==='crab') {
      pixelEllipse(ctx,mid,base-11,8,5,monster.shell?'#6893a1':'#69555e',2);
      rect(ctx,mid-5,base-14,8,2,monster.shell?'#d2e7d7':'#927578');
      for(const side of [-1,1]) {
        rect(ctx,mid+side*11-2,base-9,5,5,'#bb8268');
        rect(ctx,mid+side*12,base-11,2,3,'#e0ad83');
      }
    }
    if (monster.flash > .075) {
      rect(ctx,mid-4,base-9,8,4,'#fff0cd');
      rect(ctx,mid-2,base-11,4,8,'#fff0cd');
    }
    if (friendly) {
      rect(ctx,mid-5,base-3,10,1,'#ead29c');
      rect(ctx, x, base - 19, 1, 5, '#c3ffce');
      rect(ctx, x - 2, base - 17, 5, 1, '#c3ffce');
    } else if (fear > 0 || windup > 0) {
      const color = fear > 0 ? '#fff1ab' : '#ff9a8a';
      rect(ctx, x, base - 21, 2, 4, color);
      rect(ctx, x, base - 16, 2, 2, color);
      if (fear > 0) rect(ctx, x + 5, base - 15, 2, 2, '#a9e4fa');
    } else if (hp < maxHp) {
      rect(ctx, x - 6, base - 17, 12, 2, '#382840');
      rect(ctx, x - 6, base - 17, Math.ceil(12 * hp / maxHp), 2, '#f0a7bd');
    }
  }

  return { barriers, buildStain, drawProp, drawHero, drawMonster, drawStation, drawKeg, drawTerrain };
})();
