const DuskDungeon = (() => {
  'use strict';

  const TILE = 16;
  const COLS = 4;
  const ROWS = 3;
  const CELL_W = 25;
  const CELL_H = 21;
  const MAP_W = COLS * CELL_W + 4;
  const MAP_H = ROWS * CELL_H + 4;
  const DIRECTIONS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  const themes = [
    { name: '달안개 광장', floor: ['#57545d', '#615a62', '#6f636a'], grass: ['#344d46', '#45594a', '#525e4d'], roof: '#8a596f', stone: '#9a8390', accent: '#e3aa7f' },
    { name: '잠든 과수원', floor: ['#5b5860', '#626165', '#736d6e'], grass: ['#3b5049', '#4d614e', '#576752'], roof: '#8a606c', stone: '#a59a8a', accent: '#e2ad76' },
    { name: '달빛 묘지', floor: ['#514e65', '#5d586e', '#686179'], grass: ['#414753', '#494e59', '#545965'], roof: '#806084', stone: '#a59aac', accent: '#c1b1e4' },
    { name: '침묵의 예배당', floor: ['#4f4c62', '#5e546c', '#6b6178'], grass: ['#373e4c', '#474354', '#514c61'], roof: '#865970', stone: '#a294ae', accent: '#e1a5bb' },
    { name: '무너진 상점가', floor: ['#61545d', '#6c5c62', '#7d6870'], grass: ['#434d46', '#4f5546', '#626053'], roof: '#925e66', stone: '#a2938b', accent: '#ecaf86' }
  ];

  function seeded(seed) {
    let value = seed >>> 0;
    return () => {
      value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function choice(list, random) {
    return list[Math.floor(random() * list.length)];
  }

  function adjacent(cell) {
    return DIRECTIONS.map(([dx, dy]) => ({ gx: cell.gx + dx, gy: cell.gy + dy }))
      .filter(({ gx, gy }) => gx >= 0 && gx < COLS && gy >= 0 && gy < ROWS);
  }

  const cellKey = ({ gx, gy }) => gy * COLS + gx;
  const tileIndex = (x, y) => y * MAP_W + x;

  const regions = [
    {name:'달안개 마을', material:'stone'},
    {name:'황혼 서고', material:'wood', rooms:['대출 홀','서쪽 서가','제본실','필사실','기록 보관소'], floor:['#655047','#74594d','#694f49'], prop:'shelf'},
    {name:'물비늘 포구', material:'dock', rooms:['나루 광장','그물 시장','염전 길','등대 언덕','뱃사공 골목'], floor:['#496565','#526e70','#587675'], prop:'net'},
    {name:'잿불 주조소', material:'metal', rooms:['반입 홀','용광로실','단조 작업장','냉각실','주물 창고'], floor:['#505360','#4a4d55','#5d5961'], prop:'furnace'}
  ];

  function generateDungeon(seed, regionIndex = 0) {
    const profile = regions[regionIndex % regions.length];
    const random = seeded(seed);
    const region = {...profile};
    if (regionIndex >= regions.length) {
      const place = choice(['은버들','잔별','여울','이슬','솔바람','노을','초승달','흰자작'], random);
      const site = {stone:'마을', wood:'문서관', dock:'나루', metal:'제련소'};
      region.name = place + ' ' + site[region.material];
    }
    const grid = new Int16Array(MAP_W * MAP_H).fill(-1);
    const rooms = [];
    const links = [];
    const cells = new Map();
    const roomCount = 8 + Math.floor(random() * 4);

    function addRoom(cell, parent) {
      const id = rooms.length;
      const centerX = 2 + cell.gx * CELL_W + Math.floor(CELL_W / 2) + Math.floor(random() * 3) - 1;
      const centerY = 2 + cell.gy * CELL_H + Math.floor(CELL_H / 2) + Math.floor(random() * 3) - 1;
      const w = id === 0 ? 23 : 17 + Math.floor(random() * 6);
      const h = id === 0 ? 19 : 13 + Math.floor(random() * 6);
      const x = centerX - Math.floor(w / 2);
      const y = centerY - Math.floor(h / 2);
      const variant = id === 0 ? 0 : 1 + Math.floor(random() * 4);
      const theme = region.rooms ? {...themes[variant], name:region.rooms[variant], floor:region.floor} : themes[variant];
      const room = { ...cell, id, x, y, w, h, centerX, centerY, theme, paths: [], props: [], lamps: [], cores: [], seen: false, state: 'dormant' };
      rooms.push(room);
      cells.set(cellKey(cell), room);
      if (parent) links.push([parent.id, id]);
      const trim = [0, 1, 2, 3].map(() => region.material !== 'wood' && region.material !== 'metal' && random() < .65 ? 2 + Math.floor(random() * 3) : 0);
      for (let ry = 0; ry < h; ry++) {
        for (let rx = 0; rx < w; rx++) {
          if (rx + ry < trim[0] || w - 1 - rx + ry < trim[1] ||
            rx + h - 1 - ry < trim[2] || w + h - 2 - rx - ry < trim[3]) continue;
          grid[tileIndex(x + rx, y + ry)] = id;
        }
      }
      return room;
    }

    addRoom({ gx: random() < .5 ? 1 : 2, gy: 1 });
    while (rooms.length < roomCount) {
      const frontier = rooms.flatMap(parent => adjacent(parent)
        .filter(cell => !cells.has(cellKey(cell))).map(cell => ({ cell, parent })));
      const { cell, parent } = choice(frontier, random);
      addRoom(cell, parent);
    }

    const optional = rooms.flatMap(room => adjacent(room)
      .map(cell => cells.get(cellKey(cell)))
      .filter(other => other && other.id > room.id && !links.some(([a, b]) => a === room.id && b === other.id))
      .map(other => [room.id, other.id]));
    // Extra passages form loops whenever the occupied cells allow them.
    if (optional.length) links.push(...optional.filter((_, i) => i === 0 || random() < .55));

    function paintCorridor(x, y, width, path) {
      const left = -Math.floor(width / 2);
      for (let dy = left; dy < left + width; dy++) {
        for (let dx = left; dx < left + width; dx++) {
          const i = tileIndex(x + dx, y + dy);
          if (grid[i] === -1) grid[i] = -2;
          if (grid[i] === -2) path.add(i);
        }
      }
    }

    for (const [from, to] of links) {
      const a = rooms[from];
      const b = rooms[to];
      const horizontal = a.gy === b.gy;
      const wiggle = Math.floor(random() * 5) - 2;
      const width = region.material === 'wood' ? 3 : region.material === 'metal' ? 5 : random() < .32 ? 4 : 3;
      const path = new Set();
      const bendX = Math.round((a.centerX + b.centerX) / 2) + (horizontal ? wiggle : 0);
      const bendY = Math.round((a.centerY + b.centerY) / 2) + (horizontal ? 0 : wiggle);
      function segment(x, y, dx, dy) {
        const sx = Math.sign(dx - x);
        const sy = Math.sign(dy - y);
        while (x !== dx || y !== dy) {
          paintCorridor(x, y, width, path);
          x += sx;
          y += sy;
        }
        paintCorridor(x, y, width, path);
      }
      if (horizontal) {
        segment(a.centerX, a.centerY, bendX, a.centerY);
        segment(bendX, a.centerY, bendX, b.centerY);
        segment(bendX, b.centerY, b.centerX, b.centerY);
      } else {
        segment(a.centerX, a.centerY, a.centerX, bendY);
        segment(a.centerX, bendY, b.centerX, bendY);
        segment(b.centerX, bendY, b.centerX, b.centerY);
      }
      a.paths.push({ to, tiles: path });
      b.paths.push({ to: from, tiles: path });
    }

    const distances = rooms.map(() => Infinity);
    distances[0] = 0;
    const queue = [0];
    for (const id of queue) {
      for (const { to } of rooms[id].paths) {
        if (distances[to] !== Infinity) continue;
        distances[to] = distances[id] + 1;
        queue.push(to);
      }
    }
    const exitId = distances.indexOf(Math.max(...distances));
    const exit = rooms[exitId];

    for (const room of rooms) {
      const cx = room.centerX * TILE + 8;
      const cy = room.centerY * TILE + 8;
      room.cx = cx;
      room.cy = cy;
      room.tier = distances[room.id];
      room.batches = 2 + Math.min(3, room.tier);
      const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
      for (const [sx, sy] of corners) {
        const px = cx + sx * (Math.floor(room.w / 2) - 4) * TILE;
        const py = cy + sy * (Math.floor(room.h / 2) - 3) * TILE;
        const accentType = room.theme === themes[1] ? 'fruit' : room.theme === themes[2] ? 'grave' : 'tree';
        const topSprite = room.theme === themes[4] || room.id === 0 ? 'house' : sx < 0 && sy < 0 && room.theme === themes[3] ? 'chapel' : accentType;
        let landmark = sy < 0 ? topSprite : accentType;
        if (region.prop) {
          const filler = region.material === 'dock' ? 'tree' : 'crate';
          landmark = random() < .65 || (sx < 0 && sy < 0) ? region.prop : filler;
        }
        room.props.push([landmark, px, py]);
        room.props.push(['lamp', px - sx * 22, py - sy * 18]);
        room.lamps.push([px - sx * 22, py - sy * 18 - 10]);
        if (random() < .75) room.props.push([room.theme === themes[2] ? 'grave' : 'crate', px - sx * 34, py + 4]);
        if (random() < .62) room.props.push(['bench', px + sx * 20, py - sy * 22]);
      }
      if (room.id !== exitId) {
        room.props.push([region.prop || 'well', cx, cy - 38]);
        room.lamps.push([cx, cy - 47]);
      }
      for (let i = 0; i < 4; i++) {
        const [sx, sy] = corners[i];
        room.cores.push({
          x: cx + sx * (45 + Math.floor(random() * 35)),
          y: cy + sy * (39 + Math.floor(random() * 30)),
          type: i % 3,
          seed: Math.floor(random() * 99999),
          dirt: 1
        });
      }
    }
    return { seed, region, regionIndex, grid, rooms, links, exit };
  }

  function cellAt(x, y) {
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    return tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H ? -1 : tileIndex(tx, ty);
  }

  function walkable(grid, x, y, radius = 0) {
    const free = (px, py) => {
      const tile = grid[cellAt(px, py)];
      return tile >= 0 || tile === -2;
    };
    return free(x - radius, y - radius) && (radius === 0 ||
      (free(x + radius, y - radius) && free(x - radius, y + radius) && free(x + radius, y + radius)));
  }

  function buildDistances(grid, start, result, queue) {
    result.fill(-1);
    if (start < 0) return;
    let end = 1;
    queue[0] = start;
    result[start] = 0;
    for (let offset = 0; offset < end; offset++) {
      const index = queue[offset];
      const x = index % MAP_W;
      for (const next of [x > 0 ? index - 1 : -1, x < MAP_W - 1 ? index + 1 : -1, index - MAP_W, index + MAP_W]) {
        if (next < 0 || next >= grid.length || grid[next] === -1 || result[next] !== -1) continue;
        result[next] = result[index] + 1;
        queue[end++] = next;
      }
    }
  }

  return { TILE, MAP_W, MAP_H, themes, seeded, generateDungeon, cellAt, walkable, buildDistances };
})();
