const DuskScene = (() => {
  'use strict';

  const { TILE, MAP_W, MAP_H, themes, seeded } = DuskDungeon;

  function box(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  function bakeWorld(dungeon) {
    const layer = document.createElement('canvas');
    layer.width = MAP_W * TILE;
    layer.height = MAP_H * TILE;
    const ctx = layer.getContext('2d');
    const { grid, rooms } = dungeon;
    const random = seeded(dungeon.seed ^ 0x74fa13bd);
    box(ctx, 0, 0, layer.width, layer.height, '#191824');

    for (let row = 0; row < MAP_H; row++) {
      for (let col = 0; col < MAP_W; col++) {
        const index = row * MAP_W + col;
        const id = grid[index];
        const x = col * TILE;
        const y = row * TILE;
        if (id === -1) {
          if (random() < .2) box(ctx, x + 4, y + 10, 5, 1, '#292537');
          continue;
        }
        const room = rooms[id];
        const theme = room?.theme ?? themes[2];
        const dx = room ? Math.abs(col - room.centerX) : 0;
        const dy = room ? Math.abs(row - room.centerY) : 0;
        const isPaved = !room || dx <= 2 || dy <= 1 || dx ** 2 + dy ** 2 < 31 || (theme === themes[3] && dx < 8);
        const palette = isPaved ? theme.floor : theme.grass;
        box(ctx, x, y, TILE, TILE, palette[Math.floor(random() * 3)]);
        if (isPaved) {
          for (let p = 0; p < 3; p++) {
            const left = x + 1 + (p % 2) * 3;
            const top = y + 2 + p * 5;
            box(ctx, left, top + 2, 11, 2, '#2a243452');
            box(ctx, left, top, 10, 2, '#d0b4ae24');
            if (random() < .65) box(ctx, left + 1, top - 1, 7, 1, '#d9c2b430');
          }
          if (random() < .23) box(ctx, x + 11, y + 9, 2, 5, '#362e3a61');
        } else {
          for (let p = 0; p < 4; p++) {
            const left = x + 1 + Math.floor(random() * 13);
            const top = y + 1 + Math.floor(random() * 13);
            const color = random() > .62 ? '#99a074' : '#253a37';
            box(ctx, left, top, 1, 3, color);
            box(ctx, left - 1, top + 2, 3, 1, color);
            if (p === 0 && random() > .72) {
              box(ctx, left - 1, top, 3, 1, theme.accent);
              box(ctx, left, top - 1, 1, 3, theme.accent);
              box(ctx, left, top, 1, 1, '#f0cda4');
            }
          }
        }
        if (grid[index - MAP_W] === -1) box(ctx, x, y, TILE, 5, '#28233a59');
        if (grid[index + MAP_W] === -1) box(ctx, x, y + 14, TILE, 2, '#98838b76');
        if (grid[index - 1] === -1) box(ctx, x, y, 3, TILE, '#2425386b');
        if (grid[index + 1] === -1) box(ctx, x + 13, y, 3, TILE, '#2522355c');
      }
    }

    for (let row = 1; row < MAP_H - 1; row++) {
      for (let col = 1; col < MAP_W - 1; col++) {
        const index = row * MAP_W + col;
        if (grid[index] !== -1) continue;
        const x = col * TILE;
        const y = row * TILE;
        if (grid[index + MAP_W] !== -1) {
          box(ctx, x, y + 2, 16, 14, '#322b43');
          box(ctx, x, y + 1, 16, 5, '#6b5e6e');
          box(ctx, x + 1, y + 1, 13, 2, '#92808b');
          box(ctx, x + 1, y + 7, 7, 3, '#53465d');
          box(ctx, x + 9, y + 7, 7, 3, '#4f435b');
          box(ctx, x + 4, y + 11, 8, 3, '#51445a');
          box(ctx, x, y + 15, 16, 2, '#241f33');
          if (random() < .22) {
            box(ctx, x + 8, y + 3, 2, 8, '#70744e');
            box(ctx, x + 7, y + 8, 4, 2, '#888256');
          }
        } else if (grid[index + 1] !== -1 || grid[index - 1] !== -1 || grid[index - MAP_W] !== -1) {
          box(ctx, x, y + 2, 16, 12, '#3a3448');
          box(ctx, x + 1, y + 1, 14, 9, '#4e4659');
          box(ctx, x + 2, y + 2, 12, 2, '#756678');
          box(ctx, x + 2, y + 9, 12, 2, '#302a40');
          if (random() < .32) box(ctx, x + 4, y + 4, 5, 2, '#5f6650');
        }
      }
    }
    for (const room of rooms) {
      const { cx, cy } = room;
      const color = '#c2a6a14b';
      const accent = room.id === 0 ? '#dbc1959f' : '#a898b67c';
      for (let n = -1; n <= 1; n += 2) {
        for (let p = -1; p <= 1; p += 2) {
          for (let i = 0; i < 8; i++) {
            const x = cx + n * (20 + 5 * i);
            const y = cy + p * (50 - i * 4);
            box(ctx, x - 2, y, 5, 2, color);
            if (i % 4 === 0) box(ctx, x - 1, y - 1, 3, 4, accent);
          }
        }
      }
      for (let i = -6; i <= 6; i++) {
        const y = cy + i;
        const reach = 12 - Math.abs(i) * 2;
        box(ctx, cx - reach, y, 2, 1, accent);
        box(ctx, cx + reach - 1, y, 2, 1, accent);
      }
    }
    return layer;
  }

  function makeGlow(radius, color) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = radius * 2;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(radius, radius, 1, radius, radius, radius);
    gradient.addColorStop(0, color + 'ac');
    gradient.addColorStop(.26, color + '53');
    gradient.addColorStop(.7, color + '23');
    gradient.addColorStop(1, color + '00');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
  }

  function drawExit(ctx, room, ready, time) {
    const { cx: x, cy: y } = room;
    box(ctx, x - 16, y - 4, 32, 10, '#2a2538');
    box(ctx, x - 17, y - 7, 34, 8, '#7e7189');
    box(ctx, x - 13, y - 9, 26, 6, '#9a87a5');
    box(ctx, x - 12, y - 27, 24, 20, '#55455e');
    box(ctx, x - 8, y - 29, 16, 6, '#946f95');
    box(ctx, x - 14, y - 23, 4, 17, '#aa90a3');
    box(ctx, x + 10, y - 23, 4, 17, '#aa90a3');
    box(ctx, x - 7, y - 22, 14, 14, ready ? '#477e72' : '#292438');
    for (let i = -6; i <= 6; i += 4) {
      box(ctx, x + i, y - 22, 1, 13, ready ? '#95d5bb' : '#74617e');
    }
    if (ready) {
      const bob = Math.floor(time * 5) % 4;
      box(ctx, x - 1, y - 40 + bob, 3, 8, '#d2ffd4');
      box(ctx, x - 4, y - 37 + bob, 9, 2, '#d2ffd4');
    }
  }

  return { bakeWorld, makeGlow, drawExit };
})();
