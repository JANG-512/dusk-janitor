// Sixteenth-note score. Pitches are MIDI notes; each phrase spans one bar.
const SweepAudio = (() => {
  const chords = [[50,53,57],[46,50,53],[53,57,60],[48,52,55],
    [50,53,57],[43,46,50],[46,50,53],[45,49,52],
    [55,58,62],[48,52,55],[53,57,60],[46,50,53],
    [43,46,50],[50,53,57],[45,49,52],[50,53,57]];
  const phrases = [
    [0,4,7,9,7,4],[7,4,2,0,4,7],[4,7,11,9,7,4],[7,4,2,-1,2,4],
    [0,4,7,12,11,7],[4,2,0,4,7,9],[7,9,12,9,7,4],[4,2,-1,2,4,7],
    [7,12,11,9,7,4],[9,7,4,2,4,7],[11,9,7,4,7,9],[7,4,2,0,2,4],
    [4,7,9,12,9,7],[7,4,2,4,7,4],[4,2,-1,2,4,2],[0,4,7,4,0,0]];
  const rhythm=[0,3,6,8,11,14];
  const hz=n=>440*2**((n-69)/12);
  let ctx,master,bgm,noise,due=0,step=0;
  function connect(context) {
    if(ctx) return;
    ctx=context;
    master=ctx.createGain();bgm=ctx.createGain();
    const limiter=ctx.createDynamicsCompressor();
    master.connect(limiter).connect(ctx.destination);bgm.connect(master);
    noise=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.15),ctx.sampleRate);
    const data=noise.getChannelData(0);
    let shift=1;
    for(let i=0;i<data.length;i++){shift=(shift>>1)|(((shift^(shift>>1))&1)<<14);data[i]=(shift&1)?1:-1;}
  }
  function voice(bus,wave,from,to,time,len,level) {
    const node=ctx.createOscillator(), env=ctx.createGain();
    node.type=wave;node.frequency.setValueAtTime(from,time);
    node.frequency.exponentialRampToValueAtTime(to,time+len);
    env.gain.setValueAtTime(.0001,time);
    env.gain.linearRampToValueAtTime(level,time+.004);
    env.gain.exponentialRampToValueAtTime(.0001,time+len);
    node.connect(env).connect(bus);
    node.onended=()=>{node.disconnect();env.disconnect();};
    node.start(time);node.stop(time+len+.002);
  }
  function drum(t,len,volume,cutoff) {
    const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),env=ctx.createGain();
    src.buffer=noise;filter.type='highpass';filter.frequency.value=cutoff;
    env.gain.setValueAtTime(volume,t);env.gain.exponentialRampToValueAtTime(.0001,t+len);
    src.connect(filter).connect(env).connect(bgm);
    src.onended=()=>{src.disconnect();filter.disconnect();env.disconnect();};
    src.start(t);src.stop(t+len);
  }
  function tick(settings,screen,boss,region) {
    if(!ctx || ctx.state!=='running') return;
    const t=ctx.currentTime, active=settings.sound && !document.hidden;
    master.gain.setTargetAtTime(active?settings.volume/100:0,t,.012);
    const playing=screen==='playing',story=screen==='story';
    const musicOn=active && settings.music && (playing || story || screen==='title' || screen==='roles');
    bgm.gain.setTargetAtTime(musicOn?.7:0,t,.025);
    if(!musicOn){due=0;return;}
    if(due<t) due=t+.02;
    const beat=60/(boss?151:playing?121:92)/4;
    while(due<t+.12){
      const bar=Math.floor(step/16)%16, pos=step%16, chord=chords[bar];
      const key=boss?-2:(region%4===1?5:region%4===2?2:0);
      const i=rhythm.indexOf(pos);
      if(i>=0){
        const note=hz(chord[0]+12+phrases[bar][i]+key);
        voice(bgm,'square',note,note,due,beat*(i===5?1.75:2.4),.053);
      }
      if(pos%4===0 || (boss && pos%4===2)){
        const bass=hz(chord[pos===8?2:0]-12+key);
        voice(bgm,'triangle',bass,bass,due,beat*3.2,.22);
      }
      if(pos%2 || boss){
        const arp=hz(chord[(pos+bar)%3]+12+key);
        voice(bgm,'triangle',arp,arp,due,beat*.85,.064);
      }
      if(playing){
        if(pos===0 || pos===8 || (boss && pos===11)) voice(bgm,'triangle',121,38,due,.12,.32);
        if(pos===4 || pos===12) drum(due,.095,.095,950);
        else if(pos%2===0 || (bar%4===3 && pos>=13)) drum(due,.032,.035,3900);
      }
      due+=beat;step=(step+1)%256;
    }
  }
  function effect(from,to,len,wave,delay) {
    if(!ctx || ctx.state!=='running')return;
    const t=ctx.currentTime+delay;
    voice(master,wave,from,to,t,len,.15);
    voice(master,'square',from*2,to*1.5,t+.012,len*.55,.032);
  }
  return {connect,tick,effect};
})();
