// One private, host-authoritative support channel. No lobby enumeration.
const SweepRoom = (() => {
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const prefix='ssaks-v19-';
  let peer, channel, timer, generation=0;
  function close(){
    generation++;clearTimeout(timer);
    const old=peer;peer=null;channel=null;
    if(old)old.destroy();
  }
  function open(code, hooks){
    close();
    const gen=generation;
    const hosting=!code;
    if(hosting)code=Array.from(crypto.getRandomValues(new Uint8Array(8)),n=>alphabet[n%32]).join('');
    const fail=msg=>{if(gen===generation){close();hooks.end(msg);}};
    try{peer=hosting?new Peer(prefix+code):new Peer();}catch{fail('이 브라우저에서 협동 연결을 열 수 없습니다.');return;}
    timer=setTimeout(()=>fail('연결 시간이 초과됐습니다. 코드를 확인하고 다시 시도하세요.'),18000);
    function attach(conn){
      if(gen!==generation || channel || conn.label!=='ssaks-support'){conn.close();return;}
      channel=conn;
      conn.on('open',()=>{if(gen!==generation)return;clearTimeout(timer);hooks.ready();});
      conn.on('data',data=>{if(gen===generation && data && typeof data==='object')hooks.data(data);});
      conn.on('close',()=>fail('상대가 방을 나갔습니다.'));
      conn.on('error',()=>fail('협동 연결이 끊겼습니다.'));
    }
    peer.on('error',err=>fail(err.type==='peer-unavailable'?'해당 코드의 방을 찾을 수 없습니다.':'방 연결 실패 · 네트워크를 확인하고 다시 시도하세요.'));
    peer.on('disconnected',()=>{if(!channel?.open)fail('방 연결이 끊겼습니다.');});
    peer.on('connection',conn=>{if(hosting)attach(conn);else conn.close();});
    peer.on('open',()=>{
      if(gen!==generation)return;
      if(hosting){clearTimeout(timer);hooks.code(code);}
      else attach(peer.connect(prefix+code,{label:'ssaks-support',reliable:true,serialization:'json'}));
    });
  }
  function paintBoard(canvas,frame){
    if(!Number.isFinite(frame.x)||!Number.isFinite(frame.y)||!Array.isArray(frame.targets))return;
    const ctx=canvas.getContext('2d');
    if(canvas.worldSeed!==frame.world || canvas.region!==frame.region){
      canvas.floor=DuskScene.bakeWorld(DuskDungeon.generateDungeon(frame.world,frame.region));
      canvas.worldSeed=frame.world;canvas.region=frame.region;
    }
    const center=canvas.width/2;
    ctx.fillStyle='#201c28';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(canvas.floor,Math.round(center-frame.x),Math.round(center-frame.y));
    DuskArt.drawHero(ctx,{x:center,y:center,role:frame.role,facing:{x:1,y:0}},0);
    const points=[];
    for(const t of frame.targets.slice(0,6)){
      if(![0,1,2].includes(t.type))continue;
      const x=center+t.dx,y=center+t.dy;
      DuskArt.drawMonster(ctx,{...t,x,y},frame.time);
      ctx.strokeStyle='#ffca85';ctx.strokeRect(x-11,y-21,22,22);
      points.push({id:t.id,x,y:y-10});
    }
    canvas.onpointerdown=e=>{
      const bounds=canvas.getBoundingClientRect();
      const x=(e.clientX-bounds.left)*canvas.width/bounds.width,y=(e.clientY-bounds.top)*canvas.height/bounds.height;
      const nearest=points.sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];
      if(nearest && Math.hypot(nearest.x-x,nearest.y-y)<30 && channel?.open)
        channel.send({kind:'strike',id:nearest.id,world:frame.world});
    };
  }
  return {open,close,paintBoard,send(data){if(channel?.open)channel.send(data);},connected:()=>!!channel?.open};
})();
