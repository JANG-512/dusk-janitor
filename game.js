(() => {
  'use strict';

  const { buildStain, drawProp, drawHero, drawMonster, barriers } = DuskArt;
  const { TILE, MAP_W, MAP_H, cellAt, walkable, seeded, generateDungeon, buildDistances } = DuskDungeon;
  const { bakeWorld, makeGlow, drawExit } = DuskScene;

  const ui = Object.fromEntries([...document.querySelectorAll('[id]')].map(el => [el.id, el]));
  const canvas = ui.world;
  const ctx = canvas.getContext('2d', { alpha: false });
  const map = ui.map.getContext('2d', { alpha: false });
  const keys = new Set();
  const stick = { id: null, x: 0, y: 0 };
  const field = new Int16Array(MAP_W * MAP_H);
  const queue = new Int16Array(field.length);

  const weaponData = {
    broom: { label: '달빛 빗자루', icon: 'M16 9l7-7m-5 8-5-3-5 4-3 9 6-1 6-4 1-5ZM8 16l5 3m-2-7 5 3', desc: '공격 범위와 피해가 증가합니다.' },
    soap: { label: '회전 비눗방울', icon: 'M15 6h5v5h-5zM5 10h7l3 3v6l-3 3H5l-3-3v-6zm0 5h3m0-3v6', desc: '몸 주위를 도는 비눗방울이 적을 스칠 때마다 공격합니다.' },
    spray: { label: '별가루 분무기', icon: 'M4 12h9v10H4zm2 0V7h5v5m-6-5V4h9v3H5m11-2h3m0-3 3-1m-2 8 3 1', desc: '가까운 적을 향해 벽에 닿을 때까지 관통하는 물줄기를 쏩니다.' },
    ring: { label: '정화의 파동', icon: 'M12 3l8 4 3 6-4 7-7 3-8-4-3-7 4-6zm0 5 4 2 2 3-2 4-4 2-4-2-2-4 2-3z', desc: '일정 간격으로 사방에 정화 파동을 퍼뜨립니다.' }
  };
  const utility = [
    { key: 'haste', label: '손놀림 연습', icon: 'M2 15h6m-3-4h5m-1-4h6m2-4-4 9h7l-8 10 3-9', desc: '빗자루의 재사용 대기시간과 자동 공격 주기가 12% 짧아집니다.', max: 3 },
    { key: 'magnet', label: '수거용 자석', icon: 'M3 4h6v10l3 3 3-3V4h6v10l-3 6-6 2-6-2-3-6zM3 8h6m6 0h6', desc: '멀리 있는 경험치까지 끌어당깁니다.', max: 3 },
    { key: 'heal', label: '따뜻한 차', icon: 'M4 9h12v7l-3 4H7l-3-4zm12 2h4v5h-4M7 6l2-4m3 4 2-4', desc: '최대 체력과 현재 체력이 1씩 증가합니다.', max: 4 }
  ];
  const warmGlow = makeGlow(47, '#f8a568');
  const coldGlow = makeGlow(46, '#ac85fa');
  const cleanGlow = makeGlow(51, '#99e4b3');
  const gemGlow = makeGlow(12, '#a6e9d0');
  const heroGlow = makeGlow(90, '#edba91');
  const dawnGlow = makeGlow(144, '#e0cd8d');
  const hints = ['금이 간 오염 통을 빗자루로 치면 주변 통까지 연쇄 폭발합니다.', '길이 갈라지면 어디든 먼저 탐색할 수 있습니다.', '피격 없이 연속 처치하면 겁먹은 몬스터가 청소를 돕습니다.'];
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  let dungeon, world, navigation, run, hero, monsters, gems, effects, shots, currentRoom, camera, motes;
  const roles = {
    sweeper: {name:'솔 · 광장 파수꾼', color:'#69ada0', icon:'broom', start:'세 번째 빗질마다 공명 파동을 냅니다.', paths:[
      ['울림 증폭','공명 파동 피해 +2'], ['장대 빗자루','모든 빗질과 파동의 사거리 +12']]},
    alchemist: {name:'루비 · 화약 조제사', color:'#ed9276', icon:'spray', start:'네 번째 빗질이 적중하면 지연 폭발을 일으킵니다.', paths:[
      ['고농축 약제','기폭제 폭발 피해 +2'], ['확산 배합','기폭제 폭발 반경 +10']]},
    keeper: {name:'모아 · 정령지기', color:'#ad96ec', icon:'soap', start:'회전 비눗방울을 지니고, 무피격 2연속 처치부터 동료를 모읍니다.', paths:[
      ['무리 훈련','임시 동료의 공격 피해 +1'], ['수호 궤도','비눗방울 접촉 피해 +1']]}
  };
  let hardMode = false;
  let hardUnlocked = false;
  try { hardUnlocked = localStorage.getItem('dusk-hard') === '1'; } catch {}
  let role = 'sweeper';
  const defaults = { auto:false, sound:false, volume:65, shake:true, damage:true, particles:100, map:true, zoom:100, left:false, sensitivity:100, opacity:85 };
  let settings = {...defaults};
  try {
    const saved = JSON.parse(localStorage.getItem('dusk-settings') || '{}');
    for (const key of Object.keys(defaults)) {
      if (typeof saved[key] === typeof defaults[key]) settings[key] = saved[key];
    }
  } catch { /* Storage may be unavailable in private browsing. */ }
  let muted = !settings.sound;
  let sessionStarted = false;
  let audio;
  let mode;
  let noticeUntil;
  let lastFocus;
  let uiState = {};

  function vector(x, y) {
    const d = Math.hypot(x, y) || 1;
    return { x: x / d, y: y / d };
  }
  const toward = (a, b) => vector(b.x - a.x, b.y - a.y);

  function tone(from, to, length, type = 'triangle', delay = 0) {
    if (muted || !settings.volume || audio?.state !== 'running') return;
    const now = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, now);
    oscillator.frequency.exponentialRampToValueAtTime(to, now + length);
    gain.gain.setValueAtTime(Math.max(.001,.08 * settings.volume / 100), now);
    gain.gain.exponentialRampToValueAtTime(.001, now + length);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + length);
  }

  function svg(path) {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="' + path +
      '" stroke="currentColor" stroke-width="1.5" stroke-linejoin="miter"/></svg>';
  }

  function releaseStick() {
    const id = stick.id;
    if (id !== null && ui.stick.hasPointerCapture(id)) ui.stick.releasePointerCapture(id);
    stick.id = null;
    stick.x = 0;
    stick.y = 0;
    ui.stick.firstElementChild.style.transform = '';
  }

  let heldAttack = null;
  function releaseAttack() {
    const held = heldAttack;
    heldAttack = null;
    if (held?.element.hasPointerCapture(held.id)) held.element.releasePointerCapture(held.id);
  }

  function resetInput() {
    releaseAttack();
    keys.clear();
    releaseStick();
  }

  const focus = { x: 0, y: 0 };
  function resize() {
    const { clientWidth: w, clientHeight: h } = ui.game;
    const zoom = clamp(Math.min(w, h) / 335, 1.55, 2.95) * settings.zoom / 100;
    canvas.width = Math.ceil(w / zoom);
    canvas.height = Math.ceil(h / zoom);
    focus.x = ui['camera-center'].offsetLeft * canvas.width / w;
    focus.y = ui['camera-center'].offsetTop * canvas.height / h;
    ctx.imageSmoothingEnabled = false;
  }

  function newRun(seed = crypto.getRandomValues(new Uint32Array(1))[0], travel = false, regionIndex = travel ? dungeon.regionIndex + 1 : 0) {
    dungeon = generateDungeon(seed, regionIndex);
    world = bakeWorld(dungeon);
    navigation = dungeon.grid.map((value, i) => {
      const x = (i % MAP_W + .5) * TILE;
      const y = (Math.floor(i / MAP_W) + .5) * TILE;
      return feetFree(x, y, 3) ? value : -1;
    });
    currentRoom = dungeon.rooms[0];
    if (!travel) {
      hero = {
        x: currentRoom.cx, y: currentRoom.cy + 22, hp: 6, max: 6, moving: false,
        facing: { x: 0, y: -1 }, invulnerable: 0, dash: 0, dashCooldown: 0
      };
      run = {
        bossLevel: 0, cardKills: 0, time: 0, kills: 0, allies: 0, streak: 0, mercy: 0, clean: 0, id: 0,
        xp: 0, need: 7, level: 1, weapons: { broom: 1 }, bonus: {}, timers: {}, shake: 0,
        charges: [], blastKills: 0, catalyst: 0, echo: 0, extension: 0, swings: 0, shield: false, fieldAt: -1, fieldCooldown: 0, hints: 0
      };
      run.circuits = [role==='alchemist' ? circuit('broom','mine','heavy') : role==='keeper' ? circuit('gem','lure','wide') : circuit('broom','nova','wide')];
      hero.role = role;
      hero.scarf = roles[role].color;
      if (role === 'sweeper') run.echo = 1;
      if (role === 'alchemist') run.catalyst = 1;
      if (role === 'keeper') run.weapons.soap = 1;
      run.hand = [];
      run.pendingReveals = [];
      run.revealUntil = 0;
      ui['card-reveal'].hidden = true;
      run.mirrorUntil = run.fogUntil = 0;
    } else {
      hero.x = currentRoom.cx;
      hero.y = currentRoom.cy + 22;
      hero.moving = false;
      hero.dash = 0;
      hero.invulnerable = 1;
      run.clean = run.allies = run.streak = run.mercy = 0;
      run.fieldAt = -1;
      run.fieldCooldown = 0;
      run.charges = [];
    }
    camera = { x: hero.x, y: hero.y };
    monsters = [];
    gems = [];
    effects = [];
    shots = [];
    mode = 'playing';
    for (const room of dungeon.rooms) {
      const kinds=['pool','wind','bloom'];
      room.terrain = [
        {kind:kinds[room.id%3],x:room.cx+42,y:room.cy-16,rx:24,ry:13},
        {kind:kinds[(room.id+1)%3],x:room.cx-27,y:room.cy+44,rx:24,ry:13}
      ];
      room.casks = [-1, 1].map(side => ({x: room.cx - 58, y: room.cy + side * 20, used: false}));
      room.station = { x: room.cx + 30, y: room.cy + 24, kind: room.id % 3, used: false };
      for (const core of room.cores) core.sprite = buildStain(core.type, core.seed);
    }
    const artworkRandom = seeded(seed ^ 0x92efc318);
    motes = Array.from({ length: 94 }, () => ({
      x: artworkRandom() * MAP_W * TILE, y: artworkRandom() * MAP_H * TILE,
      phase: artworkRandom() * 6.28, speed: .4 + artworkRandom(), warm: artworkRandom() > .65
    }));
    uiState = {};
    ui.modal.hidden = true;
    ui.hud.inert = false;
    ui.hint.hidden = false;
    ui['map-seed'].textContent = (seed >>> 0).toString(36).toUpperCase().padStart(4, '0').slice(-4);
    ui.pause.setAttribute('aria-label', '일시 정지');
    resetInput();
    activate(currentRoom, true);
    if (run.bossLevel) spawnBatch(currentRoom,run.bossLevel);
    announce((travel ? '다음 지역 도착 · ' : '탐험 시작 · ') + dungeon.region.name, 4.2);
    updateHud();
    ui.game.focus({ preventScroll: true });
  }

  function announce(text, duration = 2.8) {
    ui.message.textContent = text;
    noticeUntil = run.time + duration;
  }

  function activate(room, first = false) {
    if (room.state !== 'dormant') return;
    room.state = 'active';
    room.seen = true;
    room.spawned = 0;
    room.resolved = 0;
    room.batchSize = room.id === 0 ? 8 : 6 + Math.min(4, room.tier);
    room.total = room.batches * room.batchSize;
    room.next = 0;
    if (!first) announce(room.theme.name + ' · 오염 무리 출현');
    spawnBatch(room);
  }

  function tileFree(x, y, radius = 0) {
    return walkable(dungeon.grid, x, y, radius);
  }

  function feetFree(x, y, radius) {
    if (!tileFree(x, y, radius)) return false;
    const room = dungeon.rooms[dungeon.grid[cellAt(x, y)]];
    return !room?.props.some(([kind, px, py]) => {
      if (kind !== 'house' && kind !== 'chapel' && kind !== 'well') return false;
      const [w, h, lift] = barriers[kind];
      return Math.abs(px - x) < w + radius && Math.abs(py + lift - y) < h + radius;
    });
  }

  function terrainAt(actor) {
    const room=dungeon.rooms[dungeon.grid[cellAt(actor.x,actor.y)]];
    return room?.terrain.find(t=>((actor.x-t.x)/t.rx)**2+((actor.y-t.y)/t.ry)**2<=1);
  }

  function move(actor, dx, dy, radius = 4) {
    const ground=terrainAt(actor);
    const pace=ground?.kind==='wind' ? 1.35 : ground?.kind==='pool' && actor.type!==1 ? .65 : 1;
    dx*=pace;
    dy*=pace;
    if (feetFree(actor.x + dx, actor.y, radius)) actor.x += dx;
    if (feetFree(actor.x, actor.y + dy, radius)) actor.y += dy;
  }

  function clearLine(a, b) {
    const length = distance(a, b);
    const steps = Math.ceil(length / 10);
    for (let i = 1; i < steps; i++) {
      if (!tileFree(a.x + (b.x - a.x) * i / steps, a.y + (b.y - a.y) * i / steps)) return false;
    }
    return true;
  }

  function spawnBatch(room, bossLevel = 0) {
    if (!bossLevel) {
      room.spawned++;
      room.next = room.id === 0 ? 8.5 : 7.2;
    }
    const offset = Math.floor(Math.random() * room.cores.length);
    for (let i = 0; i < (bossLevel ? 1 : room.batchSize); i++) {
      const core = room.cores[(i + offset) % room.cores.length];
      let x = core.x;
      let y = core.y;
      for (let j = 0; j < 16; j++) {
        const px = core.x + (Math.random() - .5) * 48;
        const py = core.y + (Math.random() - .5) * 35;
        if (!feetFree(px, py, 6) || dungeon.grid[cellAt(px, py)] !== room.id) continue;
        if (distance(hero, { x: px, y: py }) < 40 && j < 10) continue;
        x = px;
        y = py;
        break;
      }
      const warden = !!bossLevel || room === dungeon.exit && room.spawned === room.batches && i === 0;
      const spore = !warden && room.spawned >= 2 && i === 0;
      if (bossLevel) announce(bossLevel === 50 ? '중간 보스 · 황혼의 종지기 출현' : '최종 보스 · 자정의 종지기 출현', 6);
      else if (warden) announce('종지기 출현 · 바닥의 붉은 종소리를 피하세요', 4);
      const breed = i===1 ? ['prism','mender','crab'][(room.id+room.spawned-1)%3] : '';
      const type = breed==='prism' ? 1 : breed==='crab' ? 2 : breed==='mender' ? 0 : warden ? 2 : spore ? 1 : room.id === 0 && room.spawned === 1 ? (i === 3 ? 1 : 0) : i % 5 === 3 ? 2 : i % 4 === 1 ? 1 : 0;
      const baseHp = (bossLevel || (warden ? 24 : spore ? 5 : [2, 3, 4][type]) + Math.floor(room.tier / 3));
      const maxHp = Math.ceil(baseHp * (1 + .045 * (run.level - 1)) * (hardMode ? 1.5 : 1));
      monsters.push({
        id: run.id++, room, x, y, type, bossLevel, warden, spore, breed, shell:breed==='crab', specialTimer: 1.8, hp: maxHp, maxHp, fear: 0, friendly: false,
        cooldown: .65 + Math.random() * .7, windup: 0, recoil: 0, rush: 0, flash: 0, grace: .45,
        aim: { x: 0, y: 0 }, soapHit: 0
      });
      burst(x, y, '#d887b8', 7, 21);
    }
  }

  function iconBox(name, level) {
    const slot = document.createElement('div');
    slot.className = 'slot' + (level ? ' active' : '');
    slot.title = weaponData[name].label + (level ? ' Lv. ' + level : ' · 잠김');
    if (name === 'broom' && run.extension) slot.title += ' · 사거리 +' + run.extension;
    if (name === 'broom' && run.echo) slot.title += ' · 공명 피해 ' + run.echo;
    slot.setAttribute('role', 'img');
    slot.setAttribute('aria-label', slot.title);
    slot.innerHTML = svg(weaponData[name].icon) + (level ? '<b>' + level + '</b>' : '');
    return slot;
  }

  function updateCombatHud() {
    const tenth = Math.floor(run.time * 10);
    if (uiState.combatTick === tenth) return;
    uiState.combatTick = tenth;
    const remaining = seconds => seconds > 0 ? (Math.ceil(seconds*10)/10).toFixed(1)+'초' : '준비';
    const tools = ['빗자루 '+remaining(run.timers.broom), '회피 '+remaining(hero.dashCooldown)];
    if (run.weapons.spray) tools.push('분무기 '+remaining(run.timers.spray));
    if (run.weapons.ring) tools.push('파동 '+remaining(run.timers.ring));
    const specials = [];
    if (run.echo) specials.push('공명 '+(3-run.swings%3)+'회 후');
    if (run.catalyst) specials.push('기폭제 '+(4-run.swings%4)+'회 후');
    if (run.weapons.soap) specials.push('비눗방울 접촉 간격 '+soapInterval+'초/적');
    const lines = [(settings.auto ? '자동' : '수동')+' · 공속 '+(1/attackInterval(broomInterval)).toFixed(2)+'회/초',tools.join(' · ')];
    if (specials.length) lines.push(specials.join(' · '));
    for (const [i,slot] of run.circuits.entries()) {
      lines.push((i+1)+' '+formulas[slot.formula][0]+' '+remaining(slot.ready-run.time));
    }
    if(run.curseNoticeUntil>run.time) lines.push('저주 발동 · '+run.curseNotice);
    const ground=terrainAt(hero);
    if(ground) lines.push({pool:'갈대 여울 · 감속',wind:'바람 돌길 · 가속',bloom:'반딧불 화단'}[ground.kind]);
    if(run.fogUntil>run.time) lines.push('달안개 '+remaining(run.fogUntil-run.time));
    if(run.mirrorUntil>run.time) lines.push('반전 '+remaining(run.mirrorUntil-run.time));
    const display = lines.join('\n');
    if (uiState.combatText !== display) ui.combat.textContent = uiState.combatText = display;
  }

  const cardInterval = () => 18 + 2 * Math.floor((run.level - 1) / 3);
  const deck = [
    {name:'새벽의 종', kind:'축복', desc:'현재 화면에 보이는 적(레벨 보스 제외)을 모두 처치합니다. 동료는 보호됩니다.', play(){
      const {x,y}=viewOrigin();
      const visible = monsters.filter(m => m.hp>0 && !m.bossLevel && !m.friendly &&
        m.x>=x && m.x<x+canvas.width && m.y>=y && m.y<y+canvas.height &&
        (run.fogUntil<=run.time || distance(hero,m)<=95));
      for (const m of visible) {
        m.fear=0;
        damageMonster(m,m.hp,hero,false,-1,'새벽의 종');
      }
    }},
    {name:'접힌 지도', kind:'변화', desc:'새 던전으로 이동합니다. 레벨·장비·체력·카드는 가져가고 방 정화와 동료는 처음부터 시작합니다.', play(){newRun(undefined,true);}},
    {name:'거울 마을', kind:'저주', desc:'20초 동안 필드와 미니맵이 좌우 반전됩니다. 경험치 +6.', play(){run.mirrorUntil=run.time+20;run.xp+=6;}},
    {name:'달안개', kind:'저주', desc:'18초 동안 주변만 보입니다. 대가로 경험치 +8.', play(){run.fogUntil=run.time+18;run.xp+=8;}},
    {name:'샘의 선물', kind:'축복', desc:'체력 3을 회복하고 다음 피해를 한 번 막습니다.', play(){hero.hp=Math.min(hero.max,hero.hp+3);run.shield=true;}},
    {name:'서리밤', kind:'축복', desc:'이미 출현한 적들의 추격 속도를 8초 동안 낮춥니다.', play(){for(const m of hostiles()) m.chilledUntil=Math.max(m.chilledUntil||0,run.time+8);}},
    {name:'가시 계약', kind:'저주', desc:'체력을 최대 2 소모하고 경험치 12를 얻습니다. 체력은 최소 1이 남습니다.', play(){hero.hp=Math.max(1,hero.hp-2);run.xp+=12;}},
    {name:'맑은 바람', kind:'축복', desc:'안개와 필드 반전을 해제하고 회피를 즉시 준비합니다.', play(){run.fogUntil=run.mirrorUntil=0;hero.dashCooldown=0;}}
  ];
  function updateReveal() {
    if (run.time < run.revealUntil) return;
    const panel = ui['card-reveal'];
    if (!run.pendingReveals.length) {
      panel.hidden = true;
      return;
    }
    const id = run.pendingReveals.shift();
    const card = deck[id];
    const curse = card.kind === '저주';
    panel.hidden = false;
    panel.classList.toggle('curse', curse);
    ui['card-sigil'].textContent = ['♬','◇','◈','≋','✦','❄','†','≈'][id];
    ui['card-state'].textContent = curse ? '저주 · 즉시 발동' : card.kind + ' · 손패에 추가';
    ui['card-name'].textContent = card.name;
    ui['card-effect'].textContent = card.desc;
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      panel.animate([{opacity:0,transform:'perspective(320px) rotateY(-72deg) translateY(10px)'},{opacity:1,transform:'none'}],{duration:380,easing:'ease-out'});
    }
    run.revealUntil = run.time + 5;
  }

  function openHand() {
    if(mode!=='playing') return;
    const counts=new Map();
    for(const id of run.hand) counts.set(id,(counts.get(id)||0)+1);
    const buttons=[...counts].map(([id,count])=>{
      const card=deck[id];
      const button=action('',()=>{
        const index=run.hand.indexOf(id);
        if(mode!=='cards' || index<0) return;
        if (run.bossLevel && card.name === '접힌 지도') {
          announce('보스 정화 후 이동할 수 있습니다');
          resume();
          return;
        }
        run.hand.splice(index,1);
        resume();
        card.play();
        burst(hero.x,hero.y-8,'#ead6a9',18,45);
        updateHud();
        announce(card.name+' 사용',2.5);
        if (!run.bossLevel && run.xp >= run.need) levelUp();
      });
      button.className='choice';
      button.innerHTML='<b>'+card.name+' ×'+count+'</b><small>'+card.kind+' · '+card.desc+'</small>';
      return button;
    });
    buttons.push(action('닫기',resume,true));
    dialog('cards','달안개 카드','카드 손패','현재 레벨에서는 '+cardInterval()+'마리마다 한 장을 뽑습니다. 축복과 지도는 골라 쓰고, 저주는 즉시 발동합니다.',buttons);
  }

  function updateHud() {
    updateCombatHud();
    const handText='카드 '+run.hand.length+' · '+run.cardKills+'/'+cardInterval();
    if(ui.cards.textContent!==handText) ui.cards.textContent=handText;
    if (uiState.blastKills !== run.blastKills) {
      uiState.blastKills = run.blastKills;
      ui.contract.textContent = run.blastKills === 3 ? '✓ 폭파 의뢰 완료' : '폭파 의뢰 · 폭발로 처치 ' + run.blastKills + '/3';
    }
    const second = Math.floor(run.time);
    if (uiState.second !== second) {
      uiState.second = second;
      ui.clock.textContent = String(Math.floor(second / 60)).padStart(2, '0') + ':' + String(second % 60).padStart(2, '0');
    }
    if (uiState.room !== currentRoom.id) {
      uiState.room = currentRoom.id;
      ui.region.textContent = (hardMode ? '하드 · ' : '') + (dungeon.regionIndex + 1) + '구역 · ' + currentRoom.theme.name;
    }
    if (uiState.clean !== run.clean) {
      uiState.clean = run.clean;
      ui['area-progress'].textContent = '정화 ' + run.clean + ' / ' + dungeon.rooms.length;
    }
    if (uiState.hp !== hero.hp || uiState.max !== hero.max) {
      uiState.hp = hero.hp;
      uiState.max = hero.max;
      ui.health.setAttribute('aria-label', '체력 ' + hero.hp + ' / ' + hero.max);
      ui.health.replaceChildren(...Array.from({ length: hero.max }, (_, i) => {
        const span = document.createElement('i');
        span.className = 'heart' + (i >= hero.hp ? ' empty' : '');
        span.setAttribute('aria-hidden', 'true');
        return span;
      }));
    }
    if (uiState.kills !== run.kills) ui.kills.textContent = uiState.kills = run.kills;
    if (uiState.allies !== run.allies) ui.party.textContent = uiState.allies = run.allies;
    const boss = run.bossLevel && monsters.find(m => m.bossLevel && m.hp > 0);
    const encounter = boss ? (boss.bossLevel === 50 ? '황혼의 종지기' : '자정의 종지기')+' · '+boss.hp+'/'+boss.maxHp : currentRoom.state === 'clean' ? '이 구역 정화 완료' :
      '무리 ' + currentRoom.spawned + ' / ' + currentRoom.batches + ' · 정화 ' + Math.round(currentRoom.resolved / currentRoom.total * 100) + '%';
    if (uiState.encounter !== encounter) ui.encounter.textContent = uiState.encounter = encounter;
    const weapons = Object.keys(weaponData).map(key => run.weapons[key] ?? 0).concat(run.extension, run.echo).join('/');
    if (uiState.weapons !== weapons) {
      uiState.weapons = weapons;
      ui.loadout.replaceChildren(...Object.keys(weaponData).map(key => iconBox(key, run.weapons[key])));
    }
    if (uiState.xp !== run.xp || uiState.level !== run.level) {
      uiState.xp = run.xp;
      uiState.level = run.level;
      ui.level.textContent = 'Lv. ' + run.level;
      ui.xp.textContent = run.xp + ' / ' + run.need;
      ui['xp-track'].setAttribute('aria-valuemax', run.need);
      ui['xp-track'].setAttribute('aria-valuenow', Math.min(run.xp, run.need));
      ui['xp-fill'].style.width = Math.min(100, 100 * run.xp / run.need) + '%';
    }
  }

  function action(label, select, secondary = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = secondary ? 'action secondary' : 'action';
    button.textContent = label;
    button.onclick = select;
    return button;
  }

  function dialog(next, label, title, detail, buttons) {
    ui.modal.dataset.screen = next;
    mode = next;
    lastFocus = document.activeElement;
    resetInput();
    ui['dialog-label'].textContent = label;
    ui['dialog-title'].textContent = title;
    ui['dialog-detail'].textContent = detail;
    ui['dialog-actions'].replaceChildren(...buttons);
    ui.modal.hidden = false;
    ui.hud.inert = true;
    buttons[0].focus();
  }

  function resume() {
    mode = 'playing';
    ui.modal.hidden = true;
    ui.hud.inert = false;
    if (lastFocus === ui.pause) ui.pause.focus();
    else ui.game.focus({ preventScroll: true });
  }

  const stationNames = ['수리 작업대', '샘물 제단', '청소부의 보급함'];
  function nearbyStation() {
    const station = currentRoom.station;
    return !station.used && distance(hero, station) <= 36 ? station : null;
  }

  function useStation() {
    if (mode !== 'playing') return;
    const station = nearbyStation();
    if (!station) return;
    function reward(label, apply) {
      return action(label, () => {
        station.used = true;
        apply();
        burst(station.x, station.y - 12, '#e9c885', 24, 55);
        tone(420, 830, .22);
        resume();
        updateHud();
        announce(label);
      });
    }
    let options;
    if (station.kind === 0) {
      options = [
        reward('기폭제 · 정화탄 룬 +1 · 네 번째 빗질 폭발 피해 '+(3+run.catalyst), () => { run.catalyst++; }),
          reward('빗살 연장 · 빗질 사거리와 빗질 룬 반경 +12', () => { run.extension += 12; }),
        reward('공명 손잡이 · 공명과 충격파 룬 피해 +2', () => { run.echo += 2; })
      ];
    } else if (station.kind === 1) {
      options = [reward('샘물 마시기 · 최대 체력 +1, 체력 3 회복', () => {
        hero.max++;
        hero.hp = Math.min(hero.hp + 3, hero.max);
      })];
      if (!run.shield) options.push(reward('샘물 부적 · 다음 피해 1회 방어', () => { run.shield = true; }));
    } else {
      const tools = ['soap','spray','ring'].filter(key => (run.weapons[key] ?? 0) < 5);
      const key = tools.length ? tools[currentRoom.id % tools.length] : null;
      options = [reward('경험치 결정 +8', () => { run.xp += 8; })];
      if (key) options.unshift(reward(weaponData[key].label + ' +1', () => {
        run.weapons[key] = (run.weapons[key] ?? 0) + 1;
      }));
    }
    options.push(action('나중에', resume, true));
    dialog('station', currentRoom.theme.name, stationNames[station.kind], '이곳에서는 한 번만 보상을 받을 수 있습니다.', options);
  }

  function applySettings(save = true) {
    const game = ui.game;
    muted = !settings.sound;
    game.classList.toggle('southpaw',settings.left);
    game.style.setProperty('--control-opacity',settings.opacity / 100);
    ui.map.parentElement.hidden = !settings.map;
    ui.sound.setAttribute('aria-pressed',String(settings.sound));
    ui.sound.title = muted ? '소리 켜기' : '소리 끄기';
    ui.sound.setAttribute('aria-label',ui.sound.title);
    if (save) {
      try { localStorage.setItem('dusk-settings',JSON.stringify(settings)); } catch { /* Keep session preferences. */ }
    }
    resize();
  }
  async function unlockAudio() {
    if (muted) return;
    audio ??= new AudioContext();
    await audio.resume();
  }
  function titleScreen() {
    const buttons = [];
    if (sessionStarted) buttons.push(action('탐험 이어하기',resume));
    buttons.push(action(sessionStarted ? '새 탐험 준비' : '탐험 준비',()=>{hardMode=false;selectRole();}),action('설정',()=>settingsScreen(titleScreen),true));
    if (hardUnlocked) buttons.push(action('하드모드 탐험',()=>{hardMode=true;selectRole();}));
    dialog('title','DUSK JANITOR','황혼의 청소부','달안개 마을의 마지막 야간 근무',buttons);
  }
  function selectRole() {
    const cards = Object.entries(roles).map(([key,data])=>{
      const button = action('',()=>{
        role = key;
        sessionStarted = true;
        unlockAudio();
        newRun();
        announce(data.name + ' · 장비 칸을 누르면 조합을 설계합니다',5);
      });
      button.className = 'role-card';
      const portrait = document.createElement('canvas');
      portrait.width = 36;
      portrait.height = 32;
      drawHero(portrait.getContext('2d'),{x:18,y:27,facing:{x:1,y:0},role:key,scarf:data.color},0);
      const name = document.createElement('b');
      name.textContent = data.name;
      const desc = document.createElement('small');
      desc.textContent = data.start;
      button.append(portrait,name,desc);
      return button;
    });
    dialog('roles','청소반 명부','캐릭터 선택',sessionStarted ? '선택하면 진행 중인 탐험을 끝내고 새 던전에서 시작합니다.' : '청소부를 선택하면 탐험이 시작됩니다.',[...cards,action('뒤로',titleScreen,true)]);
  }
  function settingsScreen(back) {
    const groups = [
      ['공격 방식',[['auto','기본 공격 자동 조준·연사']]],
      ['소리',[['sound','효과음'],['volume','효과음 음량',0,100]]],
      ['화면과 효과',[['zoom','화면 배율',75,130],['map','미니맵'],['shake','화면 흔들림'],['particles','입자 효과 밀도',0,100],['damage','피해 숫자']]],
      ['터치 조작',[['left','오른손 이동 스틱'],['sensitivity','스틱 감도',60,160],['opacity','조작 버튼 불투명도',35,100]]]
    ];
    dialog('settings','환경 설정','설정','변경 사항은 이 기기에 자동 저장됩니다.',[action('완료',back)]);
    const form = document.createElement('div');
    form.className = 'settings-grid';
    for (const [heading,items] of groups) {
      const group = document.createElement('fieldset');
      const legend = document.createElement('legend');
      legend.textContent = heading;
      group.append(legend);
      for (const [key,name,min,max] of items) {
        const label = document.createElement('label');
        const input = document.createElement('input');
        const value = document.createElement('output');
        input.type = min === undefined ? 'checkbox' : 'range';
        if (input.type === 'checkbox') input.checked = settings[key];
        else {
          input.min=min; input.max=max; input.step=5; input.value=settings[key];
          value.textContent=settings[key]+'%';
        }
        input.oninput=()=>{
          settings[key]=input.type==='checkbox' ? input.checked : Number(input.value);
          if (input.type==='range') value.textContent=settings[key]+'%';
          applySettings();
          if (key==='sound' || key==='volume') unlockAudio().then(()=>tone(440,630,.08));
        };
        label.append(name,input,value);
        group.append(label);
      }
      form.append(group);
    }
    ui['dialog-actions'].prepend(form);
  }

  let installPrompt;
  function installed() {
    return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  }
  addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    if (mode === 'paused') showPauseMenu();
  });
  addEventListener('appinstalled', () => {
    installPrompt = null;
    if (mode === 'paused') showPauseMenu();
  });
  function showPauseMenu() {
    const buttons = [action('계속하기', resume), action('내 빌드',()=>buildBook(showPauseMenu),true), action('설정',()=>settingsScreen(showPauseMenu),true), action('타이틀로',titleScreen,true)];
    let detail = '빗자루를 내려놓고 잠시 쉬어 갑니다.';
    if (!installed() && installPrompt) {
      buttons.push(action('홈 화면에 설치', async () => {
        const prompt = installPrompt;
        installPrompt = null;
        if (prompt) await prompt.prompt();
        if (mode === 'paused') showPauseMenu();
      }, true));
    } else if (!installed() && location.protocol === 'https:' &&
      (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))) {
      detail = '홈 화면에 설치하려면 Safari의 공유 메뉴에서 ‘홈 화면에 추가’를 선택하세요.';
    }
    dialog('paused', 'PAUSE', '일시 정지', detail, buttons);
  }

  function togglePause() {
    if (mode === 'paused') resume();
    else if (mode === 'playing') {
      showPauseMenu();
    }
  }

  const triggers = {
    broom:'수동 빗질 적중', dash:'회피 시작', gem:'경험치 수거', kill:'몬스터 처치',
    blast:'아군 폭발', ally:'동료 공격 적중', spray:'분무기 적중'
  };
  const formulas = {
    nova:['충격파','주변 적 전체에 피해를 줍니다.',3,'#ffcc80'],
    frost:['서릿가루','주변 적에게 피해를 주고 이동 속도를 55% 낮춥니다.',4,'#a8e8ff'],
    arc:['연쇄 번개','가까운 적부터 최대 네 마리 사이를 건너뜁니다.',3.6,'#cfacff'],
    darts:['팔방 분사','여덟 방향으로 관통하는 물방울을 발사합니다.',4,'#90e0d2'],
    lure:['소용돌이','벽 너머를 제외한 적과 경험치 결정을 발동 지점으로 당깁니다.',3.2,'#b1eed2'],
    mine:['시한 정화탄','잠시 뒤 폭발해 피해를 주고 주변 오염 통을 점화합니다.',4.6,'#ffa57d'],
    drain:['생기 환원','주변 적에게 피해를 줍니다. 한 마리라도 맞히면 체력 1을 회복합니다.',9,'#f4acbd']
  };
  const styles = { wide:'광역형', fast:'속사형', heavy:'고출력형' };
  const modules = [
    {key:'coil',label:'증폭 코일',desc:'두 슬롯의 조합 피해 +1',icon:weaponData.ring.icon,max:3},
    {key:'lens',label:'확장 렌즈',desc:'두 슬롯의 조합 반경과 탄 비행거리 +15%',icon:weaponData.spray.icon,max:3},
    {key:'relay',label:'순환 계전기',desc:'두 슬롯의 조합 재사용 시간 10% 단축',icon:weaponData.soap.icon,max:3}
  ];
  function circuit(trigger,formula,style) {
    return {trigger,formula,style,ready:0,count:0};
  }
  function specs(slot) {
    const {style,formula} = slot;
    return {
      power: (formula === 'mine' ? 1 + run.catalyst : formula === 'nova' ? run.echo : 0) + (style === 'heavy' ? 4 : style === 'fast' ? 1 : 2) + (run.bonus.coil ?? 0),
      radius: Math.round(((style === 'wide' ? 72 : 48) + (slot.trigger === 'broom' ? run.extension : 0)) * (1 + .15*(run.bonus.lens ?? 0))),
      delay: formulas[formula][2] * (style === 'heavy' ? 1.45 : style === 'fast' ? .55 : 1) * .9**(run.bonus.relay ?? 0)
    };
  }
  function circuitEvent(trigger,point,sourceSlot=-1) {
    // Effects may feed a later slot, but never retrigger themselves or an earlier slot.
    for (let i=sourceSlot+1;i<run.circuits.length;i++) {
      const slot=run.circuits[i];
      if (slot.trigger !== trigger || slot.ready > run.time) continue;
      const {power,radius,delay} = specs(slot);
      slot.ready = run.time + delay;
      slot.count++;
      const color = formulas[slot.formula][3];
      effects.push({kind:'ring',x:point.x,y:point.y-4,radius,life:.26,full:.26,color});
      const targets = hostiles().filter(m=>distance(point,m)<=radius && clearLine(point,m));
      switch (slot.formula) {
        case 'mine':
          arm(point,radius,.48,power,i,'정화탄');
          break;
        case 'darts':
          for (let ray=0;ray<8;ray++) {
            const a=ray*Math.PI/4;
            shots.push({x:point.x,y:point.y,vx:Math.cos(a)*145,vy:Math.sin(a)*145,life:radius/145,
              strength:power,friendly:true,sourceSlot:i,hits:new Set()});
          }
          break;
        case 'arc': {
          const struck = new Set();
          let from = point;
          for (let hop=0;hop<4;hop++) {
            const next=nearest(from,hostiles().filter(m=>!struck.has(m) && clearLine(from,m)),radius);
            if (!next) break;
            effects.push({kind:'bolt',x:from.x,y:from.y-6,toX:next.x,toY:next.y-6,color,life:.2});
            damageMonster(next,power,from,true,i,formulas[slot.formula][0]);
            struck.add(next);
            from=next;
          }
          break;
        }
        default:
          for (const m of targets) {
            if (slot.formula==='frost') m.chilledUntil=run.time+1.5+power*.25;
            if (slot.formula==='lure') {
              const dir=toward(m,point);
              const steps = Math.min(8,Math.floor(distance(m,point)/4));
              for(let i=0;i<steps;i++) move(m,dir.x*4,dir.y*4,3);
            }
            damageMonster(m,power,point,true,i,formulas[slot.formula][0]);
          }
          if (slot.formula==='drain' && targets.length) hero.hp=Math.min(hero.max,hero.hp+1);
          if (slot.formula==='lure') {
            for (const gem of gems) if(distance(point,gem)<=radius && clearLine(point,gem)) {
              gem.x=point.x; gem.y=point.y; gem.magnetized=true;
            }
          }
      }
    }
  }

  function buildBook(back=resume) {
    dialog('build','청소 장비','조합 작업실','발동 조건, 효과, 개조 방식을 선택하세요. 첫 슬롯의 폭발·처치로 두 번째 슬롯을 연쇄 발동할 수 있습니다.',[action('완료',back)]);
    const book=document.createElement('div');
    book.className='build-book';
    for(const [i,slot] of run.circuits.entries()) {
      const field=document.createElement('fieldset');
      const legend=document.createElement('legend');
      legend.textContent='조합 슬롯 '+(i+1);
      field.append(legend);
      const preview=document.createElement('p');
      const refresh=()=>{
        const stats=specs(slot);
        const prerequisite = {spray:'분무기 탄환이 필요합니다. ', ally:'임시 동료가 필요합니다. ', blast:'오염 통, 기폭제 또는 앞 슬롯의 정화탄 폭발로 발동합니다. '}[slot.trigger] ?? '';
        preview.textContent=prerequisite + formulas[slot.formula][1]+' 피해 '+stats.power+' · 반경 '+stats.radius+' · 재사용 '+stats.delay.toFixed(1)+'초 · 발동 '+slot.count+'회';
      };
      for(const [key,label,items] of [['trigger','조건',triggers],['formula','효과',formulas],['style','개조',styles]]) {
        const row=document.createElement('label');
        row.textContent=label;
        const select=document.createElement('select');
        for(const [value,text] of Object.entries(items)) select.add(new Option(Array.isArray(text)?text[0]:text,value));
        select.value=slot[key];
        select.onchange=()=>{slot[key]=select.value;refresh();};
        row.append(select);
        field.append(row);
      }
      refresh();
      field.append(preview);
      book.append(field);
    }
    const inventory=document.createElement('p');
    const owned=[...Object.entries(weaponData).map(([key,data])=>[data.label,run.weapons[key]]),
      ...[...utility,...modules].map(data=>[data.label,run.bonus[data.key]]),
      ...roles[role].paths.map(([name],i)=>[name,run.bonus[role+i]]),
      ['빗살 추가 사거리',run.extension], ['공명 피해',run.echo], ['기폭제 피해',run.catalyst && 2+run.catalyst]];
    inventory.textContent=(run.level<4?'Lv.4에서 두 번째 슬롯 개방 · ':'')+owned.filter(([,lv])=>lv).map(([name,lv])=>name+' '+lv).join(' · ');
    book.append(inventory);
    ui['dialog-actions'].prepend(book);
  }

  function levelUp() {
    run.xp -= run.need;
    run.level++;
    if (run.level === 50 || run.level === 100) {
      run.bossLevel = run.level;
      spawnBatch(currentRoom, run.level);
    }
    if(run.level===4) run.circuits.push(circuit('dash','frost','fast'));
    run.need = Math.floor(6 + run.level * 2.7);
    const tools = Object.entries(weaponData).filter(([key]) => (run.weapons[key] ?? 0) < 5)
      .map(([key, data]) => ({ ...data, key, weapon: true }));
    const passives = [...utility,...modules].filter(({ key, max }) => (run.bonus[key] ?? 0) < max);
    const available = [...tools, ...passives];
    const unowned = tools.filter(({ key }) => !run.weapons[key]);
    const specialty = roles[role].paths.map(([label,desc],i)=>({
      key:role+i, label, desc, icon:weaponData[roles[role].icon].icon
    })).filter(item=>(run.bonus[item.key] ?? 0)<4);
    const options = specialty.length ? [specialty[Math.floor(Math.random()*specialty.length)]] : [];
    // On milestone levels, offer both branches so the player can deliberately specialize.
    if (run.level % 3 === 0 && specialty.length === 2) options.push(specialty.find(item=>item!==options[0]));
    if (unowned.length) options.push(unowned[Math.floor(Math.random() * unowned.length)]);
    const upgrades=modules.filter(item=>(run.bonus[item.key]??0)<item.max);
    if(upgrades.length) options.push(upgrades[Math.floor(Math.random()*upgrades.length)]);
    while (options.length < 4 && available.some(item => !options.includes(item))) {
      const pool = available.filter(item => !options.includes(item));
      options.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    if (options.length === 0) {
      hero.hp = Math.min(hero.max, hero.hp + 1);
      return;
    }
    tone(540, 720, .15);
    tone(740, 1000, .18, 'triangle', .12);
    dialog('upgrade', 'LEVEL ' + run.level, '청소 도구를 강화하세요', run.level===4 ? '두 번째 조합 슬롯 개방! 장비 칸에서 두 조합을 편집하세요.' : '하나를 선택하면 탐험을 이어갑니다.', options.map(option => {
      const button = document.createElement('button');
      const holder = option.weapon ? run.weapons : run.bonus;
      const next = (holder[option.key] ?? 0) + 1;
      button.type = 'button';
      button.className = 'choice';
      button.innerHTML = svg(option.icon) + '<b>' + option.label + ' Lv.' + next + '</b><small>' + option.desc + '</small>';
      button.onclick = () => {
        holder[option.key] = next;
        if (option.key === 'sweeper0') run.echo += 2;
        if (option.key === 'sweeper1') run.extension += 12;
        if (option.key === 'alchemist0') run.catalyst += 2;
        if (option.key === 'heal') {
          hero.max++;
          hero.hp++;
        }
        updateHud();
        resume();
      };
      return button;
    }));
  }

  function burst(x, y, color, amount, speed) {
    for (let i = 0; i < Math.round(amount * settings.particles / 100); i++) {
      const angle = Math.random() * Math.PI * 2;
      const pace = speed * (.25 + Math.random() * .75);
      effects.push({ kind: 'pixel', x, y, vx: Math.cos(angle) * pace, vy: Math.sin(angle) * pace, color, life: .16 + Math.random() * .43, size: Math.random() < .28 ? 3 : 2 });
    }
  }

  function nearest(origin, pool, range = Infinity) {
    let hit = null;
    for (const m of pool) {
      const d = distance(origin, m);
      if (d >= range) continue;
      hit = m;
      range = d;
    }
    return hit;
  }

  function hostiles() {
    return monsters.filter(m => m.hp > 0 && !m.friendly && m.fear <= 0);
  }

  function showFear(origin) {
    if (run.streak < (role === 'keeper' ? 2 : 4) || run.allies >= 2) return;
    if (monsters.filter(m => m.hp > 0 && m.fear > 0).length + run.allies >= 2) return;
    const candidates = hostiles().filter(m => !m.warden && m.room === origin.room && distance(origin, m) < 115);
    if (candidates.length < 2) return;
    if (Math.random() > .48 && run.mercy < 3) {
      run.mercy++;
      return;
    }
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    chosen.fear = .93;
    chosen.windup = chosen.rush = 0;
    run.mercy = 0;
    burst(chosen.x, chosen.y - 16, '#ffe7aa', 12, 34);
    announce('화들짝! 몬스터가 겁에 질렸습니다', 1.5);
    tone(480, 750, .12, 'square');
  }

  function updateRoomClean(room) {
    if (room.state === 'clean' || room.resolved < room.total) return;
    room.state = 'clean';
    run.clean++;
    for (const ally of monsters) {
      if (!ally.friendly || ally.hp <= 0 || ally.room !== room) continue;
      ally.hp = 0;
      run.allies--;
      burst(ally.x, ally.y - 8, '#a1e8bd', 18, 59);
    }
    for (const core of room.cores) burst(core.x, core.y, '#bbefab', 20, 68);
    for (const shot of shots) {
      if (shot.room === room) shot.life = 0;
    }
    hero.hp = Math.min(hero.max, hero.hp + 1);
    tone(392, 494, .17);
    tone(587, 785, .26, 'triangle', .11);
    announce(run.clean === dungeon.rooms.length ? '모든 방 정화 완료' : room.theme.name + ' 정화 완료 · 체력 +1', 4);
  }

  function placeGem(m) {
    gems.push({ x: m.x, y: m.y, value: m.warden ? 12 : m.spore ? 3 : m.type === 2 ? 2 : 1, magnetized: false });
  }

  // Both hazards and player-triggered charges use the same telegraph and blast radius.
  function arm(point, radius, delay, damage, sourceSlot=-1, source='기폭제') {
    run.charges.push({x:point.x, y:point.y, radius, delay, damage, sourceSlot,source});
  }

  function updateCharges(dt) {
    const pending = run.charges;
    run.charges = [];
    for (const c of pending) {
      c.delay -= dt;
      if (c.delay > 0) {
        run.charges.push(c);
        continue;
      }
      const color = c.damage ? '#ffb359' : '#ec88b9';
      effects.push({kind:'blast', x:c.x, y:c.y, radius:c.radius, color, full:.65, life:.65});
      burst(c.x,c.y-5,color,24,95);
      if (distance(hero,c) < 190) {
        run.shake = Math.max(run.shake,.17);
        tone(130,35,.21,'sawtooth');
      }
      if (!c.damage) {
        if (distance(hero,c) <= c.radius && clearLine(c,hero)) damageHero();
        continue;
      }
      circuitEvent('blast',c,c.sourceSlot);
      for (const m of hostiles()) {
        if (distance(m,c) > c.radius || !clearLine(c,m)) continue;
          damageMonster(m,c.damage,c,true,c.sourceSlot,c.source);
          if (m.hp === 0 && run.blastKills < 3) {
            run.blastKills++;
            if (run.blastKills === 3) {
              run.xp += 10;
              announce('폭파 의뢰 완료 · 경험치 +10', 4);
            }
          }
      }
      for (const room of dungeon.rooms) {
        for (const keg of room.casks) {
          if (!keg.used && distance(keg,c) <= c.radius && clearLine(c,keg)) ignite(keg);
        }
      }
    }
  }

  function ignite(keg) {
    keg.used = true;
    arm(keg,56,.24,5,-1,'오염 통');
    burst(keg.x,keg.y-8,'#ffe3a1',8,36);
  }

  function damageMonster(m, amount, origin, player = true, sourceSlot = -1, source = '빗질') {
    if (m.hp <= 0 || m.friendly || m.fear > 0) return;
    if (m.shell && source!=='새벽의 종') {
      m.shell=false;
      m.specialTimer=5;
      burst(m.x,m.y-8,'#bde1eb',12,54);
      effects.push({kind:'ring',x:m.x,y:m.y-6,radius:15,full:.3,life:.3,color:'#bde1eb'});
      return;
    }
    const lostHp = Math.min(m.hp,amount);
    m.hp -= lostHp;
    m.flash = .15;
    effects.push({kind:'impact', x:m.x, y:m.y-7, angle:Math.atan2(m.y-origin.y,m.x-origin.x), full:.18, life:.18});
    if (distance(hero,m) < 100) tone(m.hp ? 210 : 145,65,.055,'triangle');
    m.rush = m.windup = 0;
    m.cooldown = Math.max(m.cooldown, .29);
    m.recoil = .14;
    m.aim = toward(origin, m);
    burst(m.x, m.y - 7, m.hp ? '#e798b7' : '#dc91ba', m.hp ? 5 : 12, m.hp ? 36 : 61);
    if (settings.damage) {
      const lane = (m.hitCounter ?? 0) % 3;
      m.hitCounter = lane + 1;
      effects.push({ kind:'text', x:m.x+(lane-1)*7, y:m.y-15-lane*8, text:source+' −'+lostHp,
        color:sourceSlot>=0 ? '#ccaeff' : !player ? '#a6efc2' : source==='빗질' ? '#ffe4b0' : '#abe5ff', life:.65 });
    }
    if (m.hp > 0) return;
    if (player) {
      run.streak++;
      showFear(m);
    }
    run.kills++;
    if (++run.cardKills >= cardInterval()) {
      run.cardKills = 0;
      const id=Math.floor(Math.random()*deck.length);
      const card=deck[id];
      run.pendingReveals.push(id);
      updateReveal();
      if (card.kind==='저주') {
        card.play();
        run.curseNotice=card.name;
        run.curseNoticeUntil=run.time+3;
        burst(hero.x,hero.y-7,'#df86c5',18,46);
        tone(230,100,.22);
      } else {
        run.hand.push(id);

      }
    }
    if (m.bossLevel) {
      run.bossLevel = 0;
      if (m.bossLevel === 100) {
        hardUnlocked = true;
        try { localStorage.setItem('dusk-hard','1'); } catch {}
        sessionStarted = false;
        dialog('victory','LV.100','자정의 종지기 정화 완료','하드모드가 열렸습니다.',[action('제목 화면',titleScreen)]);
      } else announce('황혼의 종지기 정화 완료', 5);
    } else m.room.resolved++;
    placeGem(m);
    updateRoomClean(m.room);
    if(source!=='새벽의 종') circuitEvent('kill',m,sourceSlot);
  }

  function recruit(m) {
    m.friendly = true;
    run.allies++;
    m.cooldown = .15;
    m.room.resolved++;
    placeGem(m);
    burst(m.x, m.y - 8, '#b0f9c9', 19, 52);
    announce('임시 동료 합류 · 이 구역의 정화를 돕습니다');
    tone(490, 660, .11);
    tone(670, 940, .17, 'triangle', .1);
    updateRoomClean(m.room);
  }

  function damageHero() {
    if (hero.dash > 0 || hero.invulnerable > 0 || mode !== 'playing') return;
    if (run.shield) {
      run.shield = false;
      hero.invulnerable = .95;
      burst(hero.x, hero.y-8, '#9debd9', 20, 57);
      announce('샘물 부적이 피해를 막았습니다');
      return;
    }
    hero.hp = Math.max(0, hero.hp - (1 + Math.floor((run.level - 1) / 25) + Number(hardMode)));
    hero.invulnerable = .95;
    run.streak = run.mercy = 0;
    run.shake = .25;
    burst(hero.x, hero.y - 7, '#f3819f', 14, 57);
    tone(135, 68, .24, 'sawtooth');
    if (hero.hp > 0) return;
    updateHud();
    dialog('lost', 'RUN ENDED', '마을에 밤이 남았습니다', '정화 ' + run.clean + ' / ' + dungeon.rooms.length + ' · 처치 ' + run.kills, [
      action('캐릭터 다시 선택', () => {sessionStarted=false;selectRole();}), action('같은 던전 다시 도전', () => newRun(dungeon.seed, false, dungeon.regionIndex), true)
    ]);
  }

  const broomInterval = .61;
  const soapInterval = .55;
  function attackInterval(base) {
    return base * .88 ** (run.bonus.haste ?? 0);
  }
  function cooldown(key, duration) {
    run.timers[key] = attackInterval(duration);
  }

  function sweep(origin, aim, color, radius) {
    effects.push({ kind: 'sweep', x: origin.x, y: origin.y - 6, life: .24, full: .24,
      angle: Math.atan2(aim.y, aim.x), radius, color });
  }

  function orbit(index) {
    const count = 1 + (run.weapons.soap ?? 0);
    const angle = run.time * 2.9 + index * Math.PI * 2 / count;
    const radius = 28 + (run.weapons.soap ?? 0) * 4;
    return { x: hero.x + Math.cos(angle) * radius, y: hero.y + Math.sin(angle) * radius };
  }

  function swingBroom(aim = hero.facing) {
    if (mode !== 'playing' || (run.timers.broom ?? 0) > 0) return;
    const broom = run.weapons.broom;
    const reach = 59 + 6 * broom + run.extension;
    hero.facing = aim;
    sweep(hero, aim, '#ffe9a9', reach);
    cooldown('broom', broomInterval);
    run.swings++;
    if (run.echo && run.swings % 3 === 0) {
      effects.push({kind:'ring', x:hero.x, y:hero.y-4, radius:reach, life:.38, full:.38, color:'#9cebc2'});
      for (const m of hostiles()) {
        if (distance(hero,m) <= reach && clearLine(hero,m)) damageMonster(m,run.echo,hero,true,-1,'공명');
      }
    }
    for (const room of dungeon.rooms) {
      for (const keg of room.casks) {
        if (keg.used || distance(hero,keg) > reach || !clearLine(hero,keg)) continue;
        const dir = toward(hero,keg);
        if (dir.x*aim.x + dir.y*aim.y > 0) ignite(keg);
      }
    }
    let primed = run.catalyst > 0 && run.swings % 4 === 0;
    tone(304, 154, .08);
    for (const m of hostiles()) {
      const r = distance(hero, m);
      if (r > reach || !clearLine(hero, m)) continue;
      const dir = toward(hero, m);
      if (r <= 18 || dir.x * aim.x + dir.y * aim.y > -.02) {
        if (primed) {
          arm(m,42 + 10*(run.bonus.alchemist1 ?? 0),.35,2 + run.catalyst);
          primed = false;
        }
        damageMonster(m, broom, hero);
        circuitEvent('broom',m);
      }
    }
  }

  function updateWeapons(dt) {
    for (const key of Object.keys(run.weapons)) run.timers[key] = (run.timers[key] ?? 0) - dt;
    if (run.timers.broom <= 0) {
      if (heldAttack) swingHeld();
      else if (settings.auto) {
        const reach = 59 + 6 * run.weapons.broom + run.extension;
        const target = nearest(hero,hostiles().filter(m=>clearLine(hero,m)),reach);
        if (target) swingBroom(toward(hero,target));
      }
    }
    const spray = run.weapons.spray;
    const ring = run.weapons.ring;
    const soap = run.weapons.soap;
    if (!spray && !ring && !soap) return;
    const visible = hostiles().filter(m => distance(hero, m) <= 170 && clearLine(hero, m));
    if (spray && run.timers.spray <= 0) {
      const enemy = nearest(hero, visible.filter(m => m.hp > 0 && m.fear <= 0), 150);
      if (enemy) {
        const aim = toward(hero, enemy);
        for (let i = 0; i < (spray >= 3 ? 3 : 1); i++) {
          const angle = Math.atan2(aim.y, aim.x) + (i ? (i === 1 ? -.17 : .17) : 0);
          shots.push({ x: hero.x, y: hero.y, vx: Math.cos(angle) * 186, vy: Math.sin(angle) * 186,
            life: .85, strength: spray, friendly: true, hits: new Set() });
        }
        cooldown('spray', 1.12);
      }
    }
    const radius = 50 + ring * 9;
    if (ring && run.timers.ring <= 0 && visible.some(m => m.hp > 0 && distance(hero, m) <= radius)) {
      effects.push({ kind: 'ring', x: hero.x, y: hero.y - 4, radius, life: .38, full: .38, color: '#d4a2fa' });
      for (const m of visible) {
        if (distance(hero, m) <= radius) damageMonster(m, ring + 1, hero,true,-1,'정화 파동');
      }
      cooldown('ring', 2.7);
    }
    if (!soap) return;
    for (let i = 0; i <= soap; i++) {
      const bubble = orbit(i);
      if (!tileFree(bubble.x, bubble.y)) continue;
      for (const m of visible) {
        if (m.soapHit <= 0 && distance(bubble, m) <= 11) {
          damageMonster(m, soap + (run.bonus.keeper1 ?? 0), bubble,true,-1,'비눗방울');
          m.soapHit = soapInterval;
        }
      }
    }
  }

  function steerEnemy(m) {
    const index = cellAt(m.x, m.y);
    const tx = index % MAP_W;
    const direct = toward(m, hero);
    if (distance(m, hero) < 49 && clearLine(m, hero) &&
      feetFree(m.x + direct.x * 10, m.y + direct.y * 10, 3)) return direct;
    let best = index;
    for (const next of [tx > 0 ? index - 1 : -1, tx < MAP_W - 1 ? index + 1 : -1, index - MAP_W, index + MAP_W]) {
      if (field[next] >= 0 && (field[best] < 0 || field[next] < field[best])) best = next;
    }
    if (best === index) return direct;
    const target = { x: (best % MAP_W + .5) * TILE, y: (Math.floor(best / MAP_W) + .5) * TILE };
    if (!feetFree(target.x, target.y, 3)) return direct;
    return toward(m, target);
  }

  function updateEnemy(m, dt) {
    if (m.fear > 0) {
      m.fear = Math.max(0, m.fear - dt);
      if (m.fear === 0) recruit(m);
      return;
    }
    if (m.friendly) {
      const target = nearest(m, hostiles().filter(other => other.room === m.room && clearLine(m, other)), 155);
      const goal = target ?? (currentRoom === m.room ? hero : { x: m.room.cx, y: m.room.cy });
      const dir = toward(m, goal);
      if (distance(m, goal) > (target ? 24 : 32)) move(m, dir.x * dt * 71, dir.y * dt * 71, 3);
      if (target && m.cooldown <= 0 && distance(m, target) < 29) {
        m.cooldown = .84;
        sweep(m, toward(m, target), '#a8ebc3', 26);
        damageMonster(target, 1 + (run.bonus.keeper0 ?? 0), m, false,-1,'동료');
        circuitEvent('ally',target);
      }
      return;
    }
    if (m.grace > 0) {
      m.grace -= dt;
      return;
    }
    const r = distance(m, hero);
    if (m.breed==='crab' && !m.shell) {
      m.specialTimer-=dt;
      if(m.specialTimer<=0) m.shell=true;
    }
    if(m.breed==='mender') {
      m.specialTimer-=dt;
      if(m.specialTimer<=0) {
        const wounded=nearest(m,monsters.filter(other=>other!==m && other.hp>0 && other.hp<other.maxHp && !other.friendly && !other.fear && clearLine(m,other)),68);
        if(wounded) {
          wounded.hp=Math.min(wounded.maxHp,wounded.hp+2);
          effects.push({kind:'bolt',x:m.x,y:m.y-10,toX:wounded.x,toY:wounded.y-8,color:'#acf1c7',life:.4});
          burst(wounded.x,wounded.y-6,'#acf1c7',7,20);
        }
        m.specialTimer=wounded ? 3.8 : .4;
      }
    }
    if ((m.spore || m.warden) && r < 120 && clearLine(m,hero)) {
      m.specialTimer -= dt;
      if (m.specialTimer <= 0) {
        m.specialTimer = m.warden ? 3 : 4.5;
        arm(hero,m.warden ? 32 : 22,.95,0);
        if (m.warden) {
          for (const dx of [-39,39]) {
            if (tileFree(hero.x+dx,hero.y)) arm({x:hero.x+dx,y:hero.y},24,1.3,0);
          }
        }
      }
    }
    if (m.recoil > 0) {
      m.recoil -= dt;
      move(m, m.aim.x * dt * 51, m.aim.y * dt * 51, 3);
      return;
    }
    if (m.rush > 0) {
      m.rush -= dt;
      move(m, m.aim.x * dt * 139, m.aim.y * dt * 139, 3);
      if (r < 11) damageHero();
      return;
    }
    if (m.windup > 0) {
      m.windup -= dt;
      if (m.windup <= 0) {
        m.cooldown = [1.05, 1.95, 1.9][m.type];
        if (m.type === 0 && r <= 18 && clearLine(m, hero)) damageHero();
        if (m.type === 1) {
          const aim=Math.atan2(m.aim.y,m.aim.x);
          for(const offset of (m.breed==='prism' ? [-.28,0,.28] : [0])) {
            shots.push({room:m.room,x:m.x,y:m.y,friendly:false,vx:Math.cos(aim+offset)*100,vy:Math.sin(aim+offset)*100,life:2.4});
          }
        }
        if (m.type === 2) m.rush = .41;
      }
      return;
    }
    if (m.cooldown <= 0 && r < [18, 107, 67][m.type] && clearLine(m, hero)) {
      m.windup = [.29, .52, .39][m.type];
      m.aim = toward(m, hero);
      return;
    }
    if (r < 9 || (m.type === 1 && r < 74 && clearLine(m, hero))) return;
    let { x, y } = steerEnemy(m);
    for (const other of monsters) {
      if (other === m || other.hp <= 0 || other.friendly) continue;
      const dx = m.x - other.x;
      const dy = m.y - other.y;
      const d = Math.hypot(dx, dy);
      if (d > 0 && d < 12) {
        x += dx / d * (12 - d) / 23;
        y += dy / d * (12 - d) / 23;
      }
    }
    const speed = ([38, 30, 44][m.type] + Math.min(13, m.room.tier * 3)) * (m.chilledUntil > run.time ? .45 : 1) * dt;
    move(m, x * speed, y * speed, 3);
  }

  function dash() {
    if (mode !== 'playing' || hero.dashCooldown > 0) return;
    hero.dash = .2;
    circuitEvent('dash',hero);
    hero.dashCooldown = .9;
    const aim = movementAim();
    hero.dashDirection = aim.x || aim.y ? vector(aim.x, aim.y) : hero.facing;
    burst(hero.x, hero.y - 4, '#c3b1f5', 13, 49);
    tone(225, 440, .09);
  }

  function movementAim() {
    const x = Number(keys.has('d') || keys.has('ArrowRight')) - Number(keys.has('a') || keys.has('ArrowLeft'));
    const y = Number(keys.has('s') || keys.has('ArrowDown')) - Number(keys.has('w') || keys.has('ArrowUp'));
    const dir=x || y ? vector(x,y) : stick;
    return run.mirrorUntil>run.time ? {x:-dir.x,y:dir.y} : dir;
  }

  function updateHero(dt) {
    const aim = movementAim();
    hero.moving = Math.hypot(aim.x, aim.y) > .04;
    hero.invulnerable -= dt;
    hero.dashCooldown -= dt;
    if (hero.dash > 0) {
      hero.dash -= dt;
      move(hero, hero.dashDirection.x * 260 * dt, hero.dashDirection.y * 260 * dt);
      if (Math.random() < .55) burst(hero.x, hero.y - 4, '#c3b1f5', 2, 24);
    } else if (hero.moving) {
      hero.facing = vector(aim.x, aim.y);
      move(hero, aim.x * 107 * dt, aim.y * 107 * dt);
    }
    const patch=terrainAt(hero);
    if (patch?.kind==='bloom' && !patch.spent && hero.hp<hero.max) {
      patch.spent=true;
      hero.hp=Math.min(hero.max,hero.hp+2);
      burst(patch.x,patch.y,'#cdeca2',18,35);
      announce('반딧불 꽃가루 · 체력 회복');
    }
    const cell = cellAt(hero.x, hero.y);
    const room = dungeon.rooms[dungeon.grid[cell]];
    if (room && currentRoom !== room) {
      currentRoom = room;
      activate(room);
    }
    run.fieldCooldown -= dt;
    if (run.fieldAt !== cell && run.fieldCooldown <= 0) {
      run.fieldAt = cell;
      run.fieldCooldown = .13;
      buildDistances(navigation, cell, field, queue);
    }
  }

  function updateFallout(dt) {
    for (const shot of shots) {
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.life -= dt;
      if (!tileFree(shot.x, shot.y)) shot.life = 0;
      if (shot.life <= 0) continue;
      if (shot.friendly) {
        for (const m of hostiles()) {
          if (!shot.hits.has(m.id) && distance(shot, m) < 9) {
            shot.hits.add(m.id);
            damageMonster(m, shot.strength, shot,true,shot.sourceSlot,shot.sourceSlot===undefined ? '분무기' : '팔방 분사');
            if (shot.sourceSlot === undefined) circuitEvent('spray',m);
          }
        }
      } else if (distance(shot, hero) < 9) {
        shot.life = 0;
        damageHero();
        if (mode !== 'playing') return;
      }
    }
    shots = shots.filter(s => s.life > 0);
    const radius = 31 + 22 * (run.bonus.magnet ?? 0);
    for (const gem of gems) {
      const range = distance(gem, hero);
      if (range < 10) {
        run.xp += gem.value;
        gem.value = 0;
        circuitEvent('gem',hero);
        burst(gem.x, gem.y, '#c0f6c7', 3, 24);
      } else if ((gem.magnetized || range <= radius) && clearLine(gem, hero)) {
        gem.magnetized = true;
        const dir = toward(gem, hero);
        gem.x += dir.x * 190 * dt;
        gem.y += dir.y * 190 * dt;
      }
    }
    gems = gems.filter(gem => gem.value > 0);
    for (const fx of effects) {
      fx.life -= dt;
      if (fx.kind === 'pixel') {
        fx.x += fx.vx * dt;
        fx.y += fx.vy * dt;
      } else if (fx.kind === 'text') fx.y -= dt * 16;
    }
    effects = effects.filter(fx => fx.life > 0);
  }

  function update(dt) {
    run.time += dt;
    updateReveal();
    run.shake = Math.max(0, run.shake - dt);
    if (run.time >= noticeUntil && ui.message.textContent) ui.message.textContent = '';
    if (run.time > 8 && !ui.hint.hidden) ui.hint.hidden = true;
    if (run.hints < hints.length && run.time > [5, 17, 37][run.hints] && run.time >= noticeUntil) {
      announce(hints[run.hints++], 4);
    }
    updateHero(dt);
    const station = nearbyStation();
    ui.interact.hidden = !station;
    if (station) ui.interact.textContent = 'E · ' + stationNames[station.kind];
    camera.x = Math.round(hero.x);
    camera.y = Math.round(hero.y);
    if (currentRoom.state === 'active' && currentRoom.spawned < currentRoom.batches) {
      currentRoom.next -= dt;
      if (currentRoom.next <= 0 || currentRoom.resolved >= currentRoom.spawned * currentRoom.batchSize) spawnBatch(currentRoom);
    }
    updateWeapons(dt);
    if (mode !== 'playing') return;
    updateCharges(dt);
    if (mode !== "playing") return;
    for (const m of monsters) {
      if (m.hp <= 0) continue;
      m.cooldown -= dt;
      m.flash -= dt;
      m.soapHit -= dt;
      updateEnemy(m, dt);
      if (mode !== 'playing') return;
    }
    monsters = monsters.filter(m => m.hp > 0);
    updateFallout(dt);
    if (mode !== 'playing') return;
    for (const room of dungeon.rooms) {
      const cleared = room.total ? room.resolved / room.total : 0;
      for (let i = 0; i < room.cores.length; i++) {
        const goal = 1 - clamp(cleared * 1.6 - i * .2, 0, 1);
        room.cores[i].dirt = Math.max(goal, room.cores[i].dirt - dt * .75);
      }
    }
    if (!run.bossLevel && run.clean === dungeon.rooms.length) {
      for (const gem of gems) run.xp += gem.value;
      newRun(undefined, true);
    }
    if (!run.bossLevel && run.xp >= run.need) levelUp();
    updateHud();
  }

  function drawMap() {
    map.fillStyle = '#191723';
    map.fillRect(0, 0, 140, 99);
    const sx = 132 / MAP_W;
    const sy = 91 / MAP_H;
    for (const room of dungeon.rooms) {
      if (!room.seen) continue;
      for (const path of room.paths) {
        map.fillStyle = dungeon.rooms[path.to].seen ? '#685870' : '#4c3c53';
        for (const index of path.tiles) {
          map.fillRect(4 + Math.floor(index % MAP_W * sx), 4 + Math.floor(Math.floor(index / MAP_W) * sy), 2, 2);
        }
      }
    }
    for (const room of dungeon.rooms) {
      if (!room.seen) continue;
      const x = 4 + Math.round(room.x * sx);
      const y = 4 + Math.round(room.y * sy);
      const w = Math.round(room.w * sx);
      const h = Math.round(room.h * sy);
      map.fillStyle = room.state === 'clean' ? '#688f83' : room === currentRoom ? '#a783ac' : '#72546f';
      map.fillRect(x, y, w, h);
      map.fillStyle = room.state === 'clean' ? '#3f665d' : '#58425e';
      map.fillRect(x + 1, y + 1, w - 2, h - 2);
      if (room === dungeon.exit) {
        map.fillStyle = run.clean === dungeon.rooms.length ? '#f9d896' : '#b28b85';
        map.fillRect(x + (w >> 1) - 2, y + (h >> 1) - 2, 5, 5);
      }
    }
    map.fillStyle = '#fff0b1';
    map.fillRect(3 + Math.round(hero.x / TILE * sx), 3 + Math.round(hero.y / TILE * sy), 3, 3);
  }

  function box(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  function glow(sprite, x, y, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.drawImage(sprite, Math.round(x - sprite.width / 2), Math.round(y - sprite.height / 2));
    ctx.globalAlpha = 1;
  }

  function drawEffects() {
    for (const fx of effects) {
      const fade = Math.min(1, fx.life * 5);
      ctx.globalAlpha = fade;
      if (fx.kind === 'bolt') {
        ctx.strokeStyle=fx.color;
        ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(fx.x,fx.y);
        ctx.lineTo((fx.x+fx.toX)/2+3,(fx.y+fx.toY)/2-4);
        ctx.lineTo(fx.toX,fx.toY);ctx.stroke();
      } else if (fx.kind === 'impact' || fx.kind === 'blast') {
        const t = 1 - fx.life / fx.full;
        const blast = fx.kind === 'blast';
        if (blast) {
          for (let i=0; i<8; i++) {
            const a = i*Math.PI/4;
            const x = fx.x + Math.cos(a)*fx.radius*t*.65;
            const y = fx.y + Math.sin(a)*fx.radius*t*.6 - t*13;
            const size = Math.round((1-t)*14)+2;
            box(x-size/2,y-size/2,size,size,t<.32 ? '#fff2bd' : t<.65 ? fx.color : '#87697f');
          }
        }
        const count = blast ? 72 : 8;
        for (let i=0;i<count;i++) {
          const a = (fx.angle ?? 0) + i*Math.PI*2/count;
          const radius = blast ? fx.radius*Math.sqrt(t) : (i%2 ? 9 : 17)*(1-t*.55);
          const steps = blast ? 1 : 6;
          for (let j=1;j<=steps;j++) {
            const r = radius*j/steps;
            box(fx.x+Math.cos(a)*r,fx.y+Math.sin(a)*r,blast ? 4 : 2,2,blast ? fx.color : '#fff4c5');
          }
        }
      } else if (fx.kind === 'pixel') {
        box(fx.x, fx.y, fx.size, fx.size, fx.color);
      } else if (fx.kind === 'text') {
        ctx.font = '11px Galmuri, monospace';
        ctx.strokeStyle = '#2c1e32';
        ctx.lineWidth = 2;
        ctx.save();
        ctx.translate(Math.round(fx.x), Math.round(fx.y));
        if(run.mirrorUntil>run.time) ctx.scale(-1,1);
        ctx.strokeText(fx.text,0,0);
        ctx.fillStyle = fx.color;
        ctx.fillText(fx.text,0,0);
        ctx.restore();
      } else {
        const progress = 1 - fx.life / fx.full;
        const segments = fx.kind === 'ring' ? 90 : 44;
        const span = fx.kind === 'ring' ? Math.PI * 2 : 3.05;
        const radius = fx.radius * (.3 + progress * .7);
        for (let i = 0; i < segments; i++) {
          const u = i / segments;
          const angle = (fx.angle ?? 0) + (u - .5) * span;
          const r = radius - (fx.kind === 'sweep' ? 8 * Math.abs(u - .5) : 0);
          const x = fx.x + Math.cos(angle) * r;
          const y = fx.y + Math.sin(angle) * r * .82;
          box(x, y, fx.kind === 'ring' ? 2 : 3, 2, fx.color);
          if (i % 3 === 0) box(x - Math.cos(angle) * 4, y - Math.sin(angle) * 4, 2, 2, '#fff7d2');
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function viewOrigin() {
    const shakeX = Math.sin(run.time * 95) * Number(settings.shake) * run.shake * 14;
    const shakeY = Math.cos(run.time * 128) * Number(settings.shake) * run.shake * 10;
    return {
      x: Math.round(camera.x - (run.mirrorUntil>run.time ? canvas.width-focus.x : focus.x) + shakeX),
      y: Math.round(camera.y - focus.y + shakeY)
    };
  }

  function draw() {
    const w = canvas.width;
    const h = canvas.height;
    const { x: left, y: top } = viewOrigin();
    const inView = (x, y, pad = 45) => x > left - pad && x < left + w + pad && y > top - pad && y < top + h + pad;
    box(0, 0, w, h, '#191824');
    ctx.save();
    const mirror=run.mirrorUntil>run.time;
    ui.map.style.transform=mirror ? 'scaleX(-1)' : '';
    if (mirror) { ctx.translate(w,0); ctx.scale(-1,1); }
    ctx.translate(-left, -top);
    ctx.drawImage(world, 0, 0);
    const actors = [];
    for (const room of dungeon.rooms) {
      if (!inView(room.cx, room.cy, 203)) continue;
      if (room.state === 'clean') glow(dawnGlow, room.cx, room.cy, .26);
      for (const core of room.cores) {
        if (!inView(core.x, core.y, 75)) continue;
        if (core.dirt > 0) {
          ctx.globalAlpha = core.dirt * .91;
          ctx.drawImage(core.sprite, core.x - 69, core.y - 44, 138, 88);
          ctx.globalAlpha = 1;
          glow(coldGlow, core.x, core.y, core.dirt * (.45 + .12 * Math.sin(run.time * 2 + core.seed)));
        } else {
          glow(cleanGlow, core.x, core.y, .34);
          for (const [dx, dy] of [[-14, 1], [5, 13], [15, -9]]) {
            box(core.x + dx, core.y + dy, 1, 4, '#90b58b');
            box(core.x + dx - 1, core.y + dy - 1, 3, 2, '#bfdeb0');
          }
        }
      }
      for (const feature of room.terrain) DuskArt.drawTerrain(ctx,feature,run.time);
      for (const keg of room.casks) {
        if (!keg.used) actors.push({y:keg.y, paint:() => DuskArt.drawKeg(ctx,keg.x,keg.y,run.time)});
      }
      const station = room.station;
      actors.push({ y: station.y, paint: () => DuskArt.drawStation(ctx, station, run.time) });
      for (const prop of room.props) {
        if (inView(prop[1], prop[2])) actors.push({ y: prop[2], paint: () => drawProp(ctx, prop, room.theme, Number(room.state === 'clean'), run.time) });
      }
      for (const [x, y] of room.lamps) {
        if (inView(x, y, 54)) glow(warmGlow, x, y, .58 + .07 * Math.sin(run.time * 4 + x));
      }
    }
    for (const c of run.charges) {
      for (let i=0;i<48;i++) {
        const angle = i*Math.PI/24;
        box(c.x+Math.cos(angle)*c.radius,c.y+Math.sin(angle)*c.radius,2,2,c.damage ? '#ffd48e' : '#ff7b90');
      }
      const size = 3 + Math.floor(run.time*9)%3;
      box(c.x-size,c.y,size*2+1,1,'#ffdcc4');
      box(c.x,c.y-size,1,size*2+1,'#ffdcc4');
    }
    glow(heroGlow, hero.x, hero.y - 8, .36);
    if (run.shield) {
      for (let i = 0; i < 12; i++) {
        const angle = i * Math.PI / 6 + run.time;
        box(hero.x + Math.cos(angle) * 13, hero.y - 8 + Math.sin(angle) * 13, 2, 2, '#a1e8da');
      }
    }
    if (inView(dungeon.exit.cx, dungeon.exit.cy)) {
      const ready = run.clean === dungeon.rooms.length;
      glow(ready ? cleanGlow : coldGlow, dungeon.exit.cx, dungeon.exit.cy - 17, .7);
      actors.push({ y: dungeon.exit.cy, paint: () => drawExit(ctx, dungeon.exit, ready, run.time) });
    }
    for (const gem of gems) {
      if (!inView(gem.x, gem.y)) continue;
      const y = gem.y + Math.round(Math.sin(run.time * 5 + gem.x) * 2);
      glow(gemGlow, gem.x, y, .65);
      box(gem.x - 2, y - 1, 5, 3, '#79b4a0');
      box(gem.x - 1, y - 3, 3, 5, '#b6efb5');
      box(gem.x, y - 2, 1, 2, '#ecffd6');
    }
    for (const m of monsters) {
      if (m.hp <= 0 || !inView(m.x, m.y)) continue;
      if (m.type === 2 && m.windup > 0) {
        for (let n = 10; n < 51; n += 6) {
          const x = m.x + m.aim.x * n;
          const y = m.y + m.aim.y * n;
          if (!tileFree(x, y)) break;
          box(x, y, 3, 2, '#f7a08c8c');
        }
      }
      actors.push({ y: m.y, paint: () => drawMonster(ctx, m, run.time) });
    }
    actors.push({ y: hero.y, paint: () => drawHero(ctx, hero, run.time) });
    actors.sort((a, b) => a.y - b.y);
    for (const actor of actors) actor.paint();
    for (const shot of shots) {
      if (!inView(shot.x, shot.y)) continue;
      box(shot.x - 2, shot.y - 6, 5, 4, shot.friendly ? '#9bd9ed' : '#d67bd9');
      box(shot.x - 1, shot.y - 5, 3, 2, shot.friendly ? '#e9fff2' : '#ffe1f0');
    }
    for (let i = 0; i <= (run.weapons.soap ?? -1); i++) {
      const bubble = orbit(i);
      if (!tileFree(bubble.x, bubble.y)) continue;
      glow(gemGlow, bubble.x, bubble.y - 2, .48);
      box(bubble.x - 3, bubble.y - 4, 7, 5, '#788bc8');
      box(bubble.x - 2, bubble.y - 5, 5, 7, '#8ecad4');
      box(bubble.x - 1, bubble.y - 4, 2, 2, '#eaf9e2');
    }
    for (const mote of motes) {
      const x = mote.x + Math.cos(mote.phase + run.time * mote.speed) * 11;
      const y = mote.y + Math.sin(mote.phase + run.time * mote.speed) * 15;
      if (!inView(x, y, 0) || !tileFree(x, y)) continue;
      ctx.globalAlpha = .4 + Math.sin(run.time * 2 + mote.phase) * .25;
      box(x, y, 2, 2, mote.warm ? '#f6cd84' : '#d7bafa');
    }
    ctx.globalAlpha = 1;
    drawEffects();
    if(run.fogUntil>run.time) {
      const mist=ctx.createRadialGradient(hero.x,hero.y,25,hero.x,hero.y,95);
      mist.addColorStop(0,'#4a465000');mist.addColorStop(.65,'#686774a8');mist.addColorStop(1,'#555260');
      ctx.fillStyle=mist;ctx.fillRect(left,top,w,h);
    }
    ctx.restore();
    if (settings.map) drawMap();
  }

  const control = new Set(['w', 'a', 's', 'd', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'Shift', 'Escape', ' ']);

  function swingForward() {
    const { x, y } = movementAim();
    swingBroom(Math.hypot(x, y) > .04 ? vector(x, y) : hero.facing);
  }

  addEventListener('keydown', event => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (key === 'Tab' && !ui.modal.hidden) {
      const items = [...ui['dialog-actions'].querySelectorAll('button,input,select')];
      const at = items.indexOf(document.activeElement);
      items[(at + (event.shiftKey ? items.length - 1 : 1)) % items.length].focus();
      event.preventDefault();
    }
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
    if (key === 'c' && !event.repeat) openHand();
    if (key === 'b' && !event.repeat && mode === 'playing') buildBook();
    if (key === 'e' && !event.repeat) useStation();
    if (!control.has(key)) return;
    if (key === ' ' && event.target instanceof HTMLButtonElement) return;
    event.preventDefault();
    if (key === 'Escape' && !event.repeat) togglePause();
    if (mode !== 'playing') return;
    if (key === 'Shift' && !event.repeat) dash();
    if (key === ' ' && !event.repeat) swingForward();
    keys.add(key);
  });

  addEventListener('keyup', event => keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key));
  addEventListener('blur', resetInput);
  addEventListener('pagehide', resetInput);
  addEventListener('orientationchange', resetInput);
  addEventListener('resize', () => { resetInput(); resize(); });
  new ResizeObserver(resize).observe(ui.game);
  for (const axis of ['horizontal', 'vertical']) {
    matchMedia('(' + axis + '-viewport-segments: 2)').addEventListener('change', resize);
  }
  if (location.protocol !== 'file:' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(error => console.warn('오프라인 준비 실패', error));
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && mode === 'playing') togglePause();
  });

  function steer(event) {
    if (event.pointerId !== stick.id) return;
    const bounds = ui.stick.getBoundingClientRect();
    const x = event.clientX - (bounds.left + bounds.width / 2);
    const y = event.clientY - (bounds.top + bounds.height / 2);
    const length = Math.hypot(x, y);
    const dir = vector(x, y);
    const strength = Math.min(1, length * settings.sensitivity / 2600);
    stick.x = dir.x * strength;
    stick.y = dir.y * strength;
    ui.stick.firstElementChild.style.transform = 'translate(' + stick.x * 24 + 'px,' + stick.y * 24 + 'px)';
  }
  // WebKit can still start native selection or zoom during simultaneous play controls.
  for (const name of ['gesturestart', 'gesturechange', 'selectstart', 'dragstart', 'contextmenu']) {
    ui.game.addEventListener(name, event => event.preventDefault(), { passive: false });
  }
  ui.game.addEventListener('touchstart', event => {
    if (event.touches.length > 1 || event.target.closest('#world, #stick, #sweep, #dash')) {
      event.preventDefault();
    }
  }, { passive: false });
  ui.game.addEventListener('touchmove', event => {
    if (event.touches.length > 1) event.preventDefault();
  }, { passive: false });

  ui.stick.addEventListener('pointerdown', event => {
    if (mode !== 'playing') return;
    releaseStick();
    stick.id = event.pointerId;
    ui.stick.setPointerCapture(event.pointerId);
    steer(event);
  });
  ui.stick.addEventListener('pointermove', steer);
  function finishPointer(event) {
    if (event.pointerId === stick.id) releaseStick();
    if (event.pointerId === heldAttack?.id) releaseAttack();
  }
  for (const name of ['pointerup','pointercancel','lostpointercapture']) {
    window.addEventListener(name,finishPointer,true);
  }
  // A system gesture can terminate the touch stream without a matching capture event.
  function reconcileTouches(event) {
    if (heldAttack?.touch && !Array.from(event.touches).some(t=>heldAttack.element.contains(t.target))) releaseAttack();
    if (stick.id !== null && !Array.from(event.touches).some(t=>ui.stick.contains(t.target))) releaseStick();
  }
  for (const name of ['touchstart','touchmove','touchend','touchcancel']) {
    window.addEventListener(name,reconcileTouches,{capture:true, passive:true});
  }
  ui.dash.addEventListener('pointerdown', dash);
  ui.dash.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') dash();
  });
  function swingHeld() {
    if (heldAttack.element === ui.sweep) {
      swingForward();
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const origin = viewOrigin();
    const localX=(heldAttack.x-rect.left)*canvas.width/rect.width;
    const x=origin.x+(run.mirrorUntil>run.time ? canvas.width-localX : localX);
    const y = origin.y + (heldAttack.y - rect.top) * canvas.height / rect.height;
    const aim = toward(hero, { x, y });
    swingBroom(aim.x || aim.y ? aim : hero.facing);
  }
  function beginAttack(event) {
    const element = event.currentTarget;
    if (mode !== 'playing' || event.button !== 0 || (element === canvas && event.pointerType !== 'mouse')) return;
    event.preventDefault();
    releaseAttack();
    ui.game.focus({ preventScroll:true });
    heldAttack = {element,id:event.pointerId,touch:event.pointerType==='touch',x:event.clientX,y:event.clientY};
    element.setPointerCapture(event.pointerId);
    swingHeld();
  }
  for (const element of [canvas, ui.sweep]) element.addEventListener('pointerdown',beginAttack);
  canvas.addEventListener('pointermove',event=>{
    if (heldAttack?.id !== event.pointerId) return;
    if (!(event.buttons & 1)) { releaseAttack(); return; }
    heldAttack.x=event.clientX;
    heldAttack.y=event.clientY;
  });
  ui.sweep.addEventListener('click', event => {
    if (event.detail === 0) swingForward();
  });

  ui.game.tabIndex = -1;
  ui.cards.addEventListener('click',openHand);
  ui.loadout.addEventListener('click',()=>{ if(mode==='playing') buildBook(); });
  ui.interact.addEventListener('click', useStation);
  ui.pause.addEventListener('click', togglePause);
  ui.sound.addEventListener('click', async () => {
    settings.sound = !settings.sound;
    applySettings();
    await unlockAudio();
    tone(440,640,.12);
  });
  ui.fullscreen.hidden = !document.fullscreenEnabled;
  ui.fullscreen.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await ui.game.requestFullscreen();
    } catch {
      announce('현재 브라우저에서 전체 화면을 사용할 수 없습니다');
    }
  });
  document.addEventListener('fullscreenchange', () => {
    const full = Boolean(document.fullscreenElement);
    const label = full ? '전체 화면 끄기' : '전체 화면 켜기';
    ui.fullscreen.setAttribute('aria-pressed', String(full));
    ui.fullscreen.setAttribute('aria-label', label);
    ui.fullscreen.title = label;
    resize();
  });

  applySettings(false);
  newRun();
  titleScreen();
  let lastFrame = performance.now();
  function loop(now) {
    const dt = Math.min(.033, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    if (mode === 'playing' && dt > 0) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
