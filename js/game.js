/* ══════════ Core Game — suspension landing, perf scaling, safe finalize ══════════ */
import {INDIA_LOCATIONS, BIOMES, LANES, VEHICLES, ACHIEVEMENTS, CHALLENGES} from './config.js';
import {SaveManager} from './save.js';
import {Audio} from './audio.js';
import {Scene} from './scene.js';
import {Models} from './models.js';
import {Traffic, SpatialGrid} from './traffic.js';
import {Particles} from './particles.js';

export const Game = (() => {
  const S = {
    mode:'menu', t:0, dist:0, speed:0, px:1.6, pvx:0, py:0, vy:0,
    score:0, coins:0, combo:0, comboT:0, maxMult:1, maxComboRun:0,
    nitro:40, nitroOn:false, shield:0, invuln:0,
    misses:0, flys:0, topSpeed:0, nitroUsed:0,
    biome:0, nextKm:1000, oncomingOpen:false,
    timescale:1, shake:0, cdT:0, cdNum:4, crashT:0,
    demoLane:2, demoT:0, decorAcc:0, lampAcc:0, postAcc:0,
    coinAcc:0, nitroAcc:0, shieldAcc:0, rampAcc:0,
    trafT:1, oncT:3, lampSide:1, tumble:0, skidAcc:0,
    susp:0, suspV:0, landT:0,          // suspension + landing grace
    cleanDist:0, maxCleanDist:0, speedBonusGates:0, nextSpeedGate:250, lastMilestone:0, hornT:0,
    decorMult:1, perfLevel:2, trafficMult:1, pickupMult:1
  };
  const P = {};
  const coins=[], nitroCans=[], ramps=[], cones=[];
  const shieldOrb = {g:null, ring:null, active:false};
  let groundTarget=null, reducedMotion=false;

  const rnd=(a,b)=>a+Math.random()*(b-a);
  const clamp=(v,a,b)=>v<a?a:v>b?b:v;
  const mult=()=>1+Math.min(S.combo,30)*.08;
  const vehicle=()=>VEHICLES[SaveManager.self().vehSel]||VEHICLES[0];
  const speedCap=()=>44+SaveManager.self().upg[0]*2.2;
  const nitroMax=()=>100+SaveManager.self().upg[1]*20;
  const nitroPick=()=>38+SaveManager.self().upg[1]*6;
  const steerF=()=>(46+SaveManager.self().upg[2]*7)*vehicle().handl;
  const shieldMax=()=>Math.max(1,SaveManager.self().upg[3]+vehicle().armor);
  const startShield=()=>Math.min(shieldMax(),SaveManager.self().upg[3]+vehicle().armor);
  const magnetR=()=>1.5+SaveManager.self().upg[4]*.5;
  const bountyM=()=>1+SaveManager.self().upg[5]*.15;

  function box(g,m,w,h,d,x,y,z,rx,ry,rz,sh){
    const o=new THREE.Mesh(Scene.geo.box,m);
    o.scale.set(w,h,d); o.position.set(x,y,z);
    if(rx)o.rotation.x=rx; if(ry)o.rotation.y=ry; if(rz)o.rotation.z=rz;
    if(sh!==false)o.castShadow=true;
    g.add(o); return o;
  }
  function cone(g,m,r,h,x,y,z,sh){
    const o=new THREE.Mesh(Scene.geo.cone,m);
    o.scale.set(r,h,r); o.position.set(x,y,z);
    if(sh!==false)o.castShadow=true;
    g.add(o); return o;
  }
  const mkGlow=(col,scale,op)=>new THREE.Sprite(new THREE.SpriteMaterial({
    map:Scene.textures.glow,color:col,transparent:true,opacity:op,
    blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));

  function init(rm){
    reducedMotion=rm;
    groundTarget=new THREE.Color(BIOMES[0].ground);
    buildPlayer(SaveManager.self().vehSel);
    buildPickups();
    Traffic.build();
  }
  function buildPlayer(vehId){
    if(P.g)Scene.scene.remove(P.g);
    const built=Models.buildPlayer(VEHICLES[vehId]||VEHICLES[0]);
    Object.assign(P,built);
    P.g.position.set(S.px,0,0);
    Scene.scene.add(P.g);
  }
  function rebuildPlayer(){
    buildPlayer(SaveManager.self().vehSel);
    if(P.shield)P.shield.visible=S.shield>0&&S.mode!=='menu';
  }

  function buildPickups(){
    const goldMat=new THREE.MeshStandardMaterial({color:0xffc93c,metalness:.9,roughness:.25,
      emissive:0x8a5a00,emissiveIntensity:.4});
    for(let i=0;i<44;i++){
      const g=new THREE.Group();
      const c=new THREE.Mesh(Scene.geo.cyl,goldMat);
      c.scale.set(.55,.12,.55); c.rotation.x=Math.PI/2; g.add(c);
      const inn=new THREE.Mesh(Scene.geo.cyl,Scene.mat(0xffe08a,{metalness:.9,roughness:.3}));
      inn.scale.set(.34,.14,.34); inn.rotation.x=Math.PI/2; g.add(inn);
      g.visible=false; Scene.scene.add(g);
      coins.push({g,active:false,baseY:1,ph:rnd(0,TAU())});
    }
    for(let i=0;i<3;i++){
      const g=new THREE.Group();
      const body=new THREE.Mesh(Scene.geo.cyl,new THREE.MeshStandardMaterial({
        color:0x1a9ac4,metalness:.6,roughness:.3,emissive:0x1a9ac4,emissiveIntensity:.5}));
      body.scale.set(.4,.9,.4); g.add(body);
      const band=new THREE.Mesh(Scene.geo.cyl,Scene.materials.white);
      band.scale.set(.42,.22,.42); g.add(band);
      g.add(mkGlow(0x41e0ff,1.8,.5));
      g.visible=false; Scene.scene.add(g);
      nitroCans.push({g,active:false,ph:rnd(0,TAU())});
    }
    const sg=new THREE.Group();
    const core=new THREE.Mesh(Scene.geo.sph,new THREE.MeshStandardMaterial({
      color:0x41e0ff,metalness:.4,roughness:.2,emissive:0x2090c4,emissiveIntensity:.9}));
    core.scale.set(.5,.5,.5); sg.add(core);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.8,.07,8,20),
      new THREE.MeshStandardMaterial({color:0x9feaff,emissive:0x41e0ff,emissiveIntensity:.8}));
    sg.add(ring); sg.add(mkGlow(0x41e0ff,2.4,.6));
    sg.visible=false; Scene.scene.add(sg);
    shieldOrb.g=sg; shieldOrb.ring=ring;
    for(let i=0;i<2;i++){
      const g=new THREE.Group();
      const top=new THREE.Mesh(Scene.geo.box,new THREE.MeshStandardMaterial({
        map:Scene.textures.chev,roughness:.6}));
      top.scale.set(3.2,.18,4.4); top.rotation.x=-.22;
      top.position.set(0,.55,-.3); top.castShadow=true; g.add(top);
      box(g,Scene.materials.dark,3.2,.55,.4,0,.28,1.65);
      box(g,Scene.materials.yellow,.14,.5,4.2,-1.62,.35,-.2);
      box(g,Scene.materials.yellow,.14,.5,4.2,1.62,.35,-.2);
      g.visible=false; Scene.scene.add(g);
      ramps.push({g,active:false,used:false,lane:2});
    }
    for(let i=0;i<6;i++){
      const g=new THREE.Group();
      cone(g,Scene.materials.coneM,.34,.75,0,.4,0);
      box(g,Scene.materials.coneM,.62,.06,.62,0,.03,0);
      const b=new THREE.Mesh(Scene.geo.cyl,Scene.materials.white);
      b.scale.set(.24,.16,.24); b.position.y=.42; g.add(b);
      g.visible=false; Scene.scene.add(g);
      cones.push({g,active:false,hit:false,vx:0,vy:0,vr:0,x:0,y:0,z:0});
    }
  }
  const TAU=()=>Math.PI*2;

  function currentLocation(){
    const km=(S.dist*24)/1000;
    let idx=0;
    for(let i=0;i<INDIA_LOCATIONS.length;i++)
      if(km>=INDIA_LOCATIONS[i].km*.1)idx=i;
    return INDIA_LOCATIONS[idx];
  }

  function clearRun(){
    Traffic.clear();
    coins.forEach(c=>{c.active=false;c.g.visible=false;});
    nitroCans.forEach(n=>{n.active=false;n.g.visible=false;});
    shieldOrb.active=false; shieldOrb.g.visible=false;
    ramps.forEach(r=>{r.active=false;r.g.visible=false;});
    cones.forEach(c=>{c.active=false;c.g.visible=false;});
    Particles.clear();
  }
  function resetRun(){
    clearRun();
    Object.assign(S,{dist:0,speed:0,px:1.6,pvx:0,py:0,vy:0,score:0,coins:0,combo:0,comboT:0,
      maxMult:1,maxComboRun:0,nitro:Math.min(40,nitroMax()),nitroOn:false,
      shield:startShield(),invuln:0,misses:0,flys:0,topSpeed:0,nitroUsed:0,
      biome:0,nextKm:1000,oncomingOpen:false,timescale:1,shake:0,crashT:0,
      decorAcc:0,lampAcc:20,postAcc:10,coinAcc:120,nitroAcc:300,shieldAcc:900,
      rampAcc:500,trafT:.5,oncT:3,tumble:0,skidAcc:0,susp:0,suspV:0,landT:0,
      cleanDist:0,maxCleanDist:0,speedBonusGates:0,nextSpeedGate:250,lastMilestone:0,hornT:0,
      decorMult:1,trafficMult:1,pickupMult:1});
    groundTarget.setHex(BIOMES[0].ground);
    if(P.shield)P.shield.visible=S.shield>0;
    P.g.position.set(S.px,0,0);
    P.tilt.rotation.set(0,0,0); P.tilt.position.set(0,0,0); P.tilt.visible=true;
  }

  /* Spawning */
  function placeDecor(it,type,x,z){
    const g=it.g; g.position.set(x,0,z);
    const s=type==='building'||type==='windmill'?1:rnd(.75,1.3);
    g.scale.set(s,s,s);
    g.rotation.y=rnd(0,TAU());
    if(type==='billboard')g.rotation.y=x<0?Math.PI/2:-Math.PI/2;
    if(type==='lamp')g.rotation.y=x<0?0:Math.PI;
    it.active=true; g.visible=true;
  }
  function spawnDecor(){
    const b=BIOMES[S.biome], side=Math.random()<.55?'left':'right';
    let list=b[side];
    if(side==='right'&&S.biome===3)list=['bush','billboard','rock','bush'];
    const type=(a=>a[Math.random()*a.length|0])(list);
    const pool=Scene.decor[type]; let it=null;
    for(const p of pool)if(!p.active){it=p;break;}
    if(!it)return;
    let x;
    if(type==='building')x=-rnd(16,34);
    else if(type==='windmill')x=-rnd(45,70);
    else if(type==='billboard')x=(side==='left'?-1:1)*rnd(10.5,15.5);
    else if(type==='parasol')x=rnd(11,26);
    else if(type==='hydrant')x=-rnd(9.5,12);
    else x=(side==='left'?-1:1)*rnd(11,36);
    placeDecor(it,type,x,-rnd(150,210));
    if(['palm','bush','rock','cactus','pine'].includes(type)&&Math.random()<.45){
      for(const p2 of pool){if(p2.active)continue;
        placeDecor(p2,type,x+rnd(-4,4),-rnd(150,210));break;}}
  }
  function spawnLamp(){
    let it=null; for(const p of Scene.decor.lamp)if(!p.active){it=p;break;}
    if(!it)return;
    S.lampSide*=-1;
    const side=S.biome===3&&Math.random()<.5?1:S.lampSide;
    placeDecor(it,'lamp',side*10.2,-165);
  }
  function spawnPost(){
    for(const s of[-7.9,7.9]){
      let it=null; for(const p of Scene.posts)if(!p.active){it=p;break;}
      if(!it)return;
      it.g.position.set(s,0,-160); it.active=true; it.g.visible=true;
    }
  }
  function spawnCoins(){
    const placeCoin=(x,z,y)=>{for(const c of coins){if(c.active)continue;
      c.active=true;c.g.visible=true;c.g.position.set(x,y,z);c.baseY=y;c.ph=rnd(0,TAU());return;}};
    const pat=Math.random();
    if(pat<.4){const lane=Math.random()<.2?0:1+(Math.random()*3|0);
      for(let i=0;i<5;i++)placeCoin(LANES[lane],-140-i*8,1);}
    else if(pat<.75){const l0=1+(Math.random()*2|0);
      const lp=(a,b,t)=>a+(b-a)*t;
      for(let i=0;i<6;i++)placeCoin(lp(LANES[l0],LANES[l0+1],i%2),-140-i*9,1);}
    else{const r=ramps.find(r=>r.active);
      if(r){for(let i=0;i<7;i++){const t=i/6;
        placeCoin(LANES[r.lane],r.g.position.z+14-t*30,1+Math.sin(t*Math.PI)*2.8);}}
      else{const lane=1+(Math.random()*3|0);
        for(let i=0;i<5;i++)placeCoin(LANES[lane],-140-i*8,1);}}
  }
  function spawnRamp(){for(const r of ramps){if(r.active)continue;
    r.active=true;r.used=false;r.lane=1+(Math.random()*3|0);
    r.g.position.set(LANES[r.lane],0,-165);r.g.visible=true;return;}}
  function spawnNitro(){for(const n of nitroCans){if(n.active)continue;
    n.active=true;n.g.visible=true;
    n.g.position.set(LANES[1+(Math.random()*3|0)],1.1,-160);return;}}
  function spawnShield(){if(shieldOrb.active)return;
    shieldOrb.active=true;shieldOrb.g.visible=true;
    shieldOrb.g.position.set(LANES[1+(Math.random()*3|0)],1.2,-160);}
  function spawnCone(){for(const c of cones){if(c.active)continue;
    c.active=true;c.hit=false;c.g.visible=true;
    c.x=LANES[1+(Math.random()*3|0)]+rnd(-.8,.8);c.z=-160;c.y=0;
    c.g.position.set(c.x,0,c.z);c.g.rotation.set(0,0,0);return;}}
  function populateDecor(){
    for(let i=0;i<70;i++){spawnDecor();
      for(const type in Scene.decor)for(const it of Scene.decor[type])
        if(it.active)it.g.position.z=rnd(-150,40);}
    for(let i=0;i<6;i++)spawnPost();
    Scene.posts.forEach(p=>{if(p.active)p.g.position.z=rnd(-140,30);});
    for(let i=0;i<6;i++)spawnLamp();
    if(Scene.decor.lamp)Scene.decor.lamp.forEach(l=>{if(l.active)l.g.position.z=rnd(-150,30);});
  }

  function crash(car){
    S.mode='crashed'; S.crashT=0; S.timescale=.35;
    S.shake=reducedMotion?0:1.5; S.nitroOn=false; S.cleanDist=0;
    const flash=document.getElementById('flash');
    if(flash){flash.classList.remove('on');void flash.offsetWidth;flash.classList.add('on');}
    const fp=new THREE.Vector3((S.px+car.x)/2,1,0);
    Particles.burst(fp,0xff8a30,16,9,.9,14,.22);
    Particles.burst(fp,0x3a3f4a,12,7,1.1,12,.2);
    Particles.burst(fp,0xffd23f,8,8,.7,14,.12);
    car.dead=true; car.vy=rnd(6,9); car.spin=rnd(-5,5);
    S.pvx=rnd(-3,3); S.vy=5; S.tumble=rnd(-4,4);
    Audio.sfx.crash(); Audio.setEngine(0,false);
  }

  function update(dt,raw,keys,touch,onUpdate){
    S.t+=raw; Scene.skyUni.uTime.value=S.t; S.hornT=Math.max(0,S.hornT-raw);
    const playing=S.mode==='play', demo=S.mode==='menu';
    const CR=vehicle();

    let base=Math.min(22+S.dist*.008,speedCap())*CR.speed;
    if(demo)base=24;
    const brake=(keys.ArrowDown||keys.KeyS||touch.B)&&playing;
    S.nitroOn=playing&&(keys.Space||keys.ShiftLeft||keys.ShiftRight||touch.N)&&S.nitro>0&&!brake;
    let target=base*(S.nitroOn?1.55:1)+(playing&&(keys.ArrowUp||keys.KeyW)?2:0);
    if(brake)target=base*.35;
    if(S.mode==='count'||S.mode==='crashed')target=0;
    const acc=S.nitroOn?26:(target>S.speed?13:30);
    S.speed+=clamp(target-S.speed,-acc*dt,acc*dt*(S.mode==='count'?3:1));
    if(S.nitroOn){const used=28/CR.nitro*dt;S.nitro=Math.max(0,S.nitro-used);S.nitroUsed+=used;
      if(S.nitro<=0)S.nitroOn=false;}

    const inL=keys.ArrowLeft||keys.KeyA||touch.L, inR=keys.ArrowRight||keys.KeyD||touch.R;
    let ix=(inR?1:0)-(inL?1:0);
    if(demo){S.demoT-=raw;
      if(S.demoT<=0){S.demoT=rnd(2.2,4);S.demoLane=1+(Math.random()*3|0);}
      let blocked=false;
      for(const c of Traffic.list())
        if(c.active&&!c.oncoming&&!c.dead&&Math.abs(c.x-S.px)<2&&c.z<-5&&c.z>-32)blocked=true;
      if(blocked)S.demoLane=clamp(S.demoLane+(Math.random()<.5?-1:1),1,3);
      ix=clamp((LANES[S.demoLane]-S.px)*1.2,-1,1);}
    const air=S.py>0.05, sf=steerF();
    S.pvx+=ix*(air?sf*.42:sf)*dt;
    S.pvx*=Math.exp((air?-2:-8.5)*dt);
    S.px=clamp(S.px+S.pvx*dt,-5.55,5.55);
    if(Math.abs(S.px)>=5.55&&Math.abs(S.pvx)>2){
      S.pvx*=-.25; S.shake=Math.max(S.shake,reducedMotion?0:.3);
      Particles.dust(new THREE.Vector3(S.px,.2,1),2,2);}

    const hardTurn=(inL||inR)&&Math.abs(S.pvx)>3.4&&S.speed>17;
    S.skidAcc+=raw;
    if(playing&&S.py<=.05&&!reducedMotion&&S.skidAcc>.034&&(hardTurn||(brake&&S.speed>16))){
      S.skidAcc=0;
      Particles.skid(S.px-(P.isBike?.15:.82),1.35);
      if(!P.isBike)Particles.skid(S.px+.82,1.35);
      if(hardTurn&&Math.random()<.4)
        Particles.dust(new THREE.Vector3(S.px+rnd(-.9,.9),.12,1.3),1,1.5);}

    /* Jump + LANDING with suspension impulse */
    if(S.py>0||S.vy>0){
      S.py+=S.vy*dt; S.vy-=22*dt;
      if(S.py<=0){
        const impact=-S.vy;
        S.py=0; S.vy=0;
        if(impact>3){
          S.suspV=-impact*.055;           // compress spring
          S.landT=.18;                    // landing grace
          S.shake=Math.max(S.shake,reducedMotion?0:Math.min(.5,impact*.03));
          Particles.dust(new THREE.Vector3(S.px,.1,1),6,2.5);
          Audio.sfx.thud();
        }
      }
    }
    S.landT=Math.max(0,S.landT-dt);

    const ph=((S.dist/4200)+.015)%1;
    Scene.applyPhase(ph,S);
    if(playing||demo){
      const nb=Math.floor(S.dist/1300)%4;
      if(nb!==S.biome){S.biome=nb;groundTarget.setHex(BIOMES[nb].ground);
        if(playing)onUpdate('biome',BIOMES[nb]);}
      Scene.groundMat.color.lerp(groundTarget,1-Math.exp(-dt*.5));}

    const dz=S.speed*dt;
    Scene.textures.asphalt.offset.y+=dz/7.14;
    Scene.textures.dash.offset.y+=dz/12;
    Scene.textures.shimmer.offset.y-=dt*.05;

    if(playing){
      S.dist+=dz; S.cleanDist+=dz; S.maxCleanDist=Math.max(S.maxCleanDist,S.cleanDist); S.score+=dz*.5*mult();
      S.topSpeed=Math.max(S.topSpeed,S.speed*3.6);
      if(S.dist>=S.nextKm){
        const checkpoint=Math.round(S.nextKm/1000);
        const clean=S.cleanDist>=5000;
        const bonus=clean?1500:500;
        S.score+=bonus;
        onUpdate('km',checkpoint);
        onUpdate('checkpoint',{bonus,clean});
        S.nextKm+=1000;
      }
      if(S.speed>35 && S.dist>=S.nextSpeedGate){
        const gate=Math.round(250+Math.min(2500,S.speed*8));
        S.score+=gate; S.speedBonusGates++; S.nextSpeedGate+=250;
        onUpdate('speedBonus',{v:gate,gates:S.speedBonusGates});
        Audio.sfx.levelup();
      }
      if(S.combo>0){
        const m=Math.floor(S.combo/10)*10;
        if(m>=10 && m>S.lastMilestone){
          S.lastMilestone=m; S.score+=m*25;
          onUpdate('milestone',{n:m,v:m*25}); Audio.sfx.levelup();
        }
      }
      if(!S.oncomingOpen&&S.dist>600){S.oncomingOpen=true;onUpdate('oncoming');}
    }

    if(playing||demo){
      S.decorAcc+=dz; let gap=9*S.decorMult;
      while(S.decorAcc>gap){spawnDecor();S.decorAcc-=gap;gap=rnd(8,16)*S.decorMult;}
      S.lampAcc+=dz; if(S.lampAcc>32){spawnLamp();S.lampAcc-=32;}
      S.postAcc+=dz; if(S.postAcc>22){spawnPost();S.postAcc-=22;}
      S.trafT-=dt;
      const trafficGap=Math.max(.58,1.6-S.dist*.00025)/S.trafficMult;
      if(S.trafT<=0){Traffic.spawn(false,S.dist);
        S.trafT=trafficGap*rnd(.7,1.3);}
      if(playing){
        if(S.oncomingOpen){S.oncT-=dt;if(S.oncT<=0){Traffic.spawn(true);S.oncT=rnd(2.8,4.8)/S.trafficMult;}}
        S.coinAcc+=dz; if(S.coinAcc>rnd(180,260)/S.pickupMult){spawnCoins();S.coinAcc=0;}
        S.nitroAcc+=dz; if(S.nitroAcc>rnd(500,700)/S.pickupMult){spawnNitro();S.nitroAcc=0;}
        S.shieldAcc+=dz; if(S.shieldAcc>1500/S.pickupMult){spawnShield();S.shieldAcc=0;}
        S.rampAcc+=dz; if(S.rampAcc>rnd(850,1150)/S.pickupMult&&S.dist>300){spawnRamp();S.rampAcc=0;}
        if(S.biome===3&&Math.random()<dt*.25)spawnCone();}}

    for(const type in Scene.decor)for(const it of Scene.decor[type]){
      if(!it.active)continue;
      it.g.position.z+=dz;
      if(it.g.position.z>60){it.active=false;it.g.visible=false;}
      else if(it.update)it.update(it,S.t,dt);}
    for(const p of Scene.posts){if(!p.active)continue;
      p.g.position.z+=dz;
      if(p.g.position.z>30){p.active=false;p.g.visible=false;}}
    for(const m of Scene.mounts){
      if(!m.active){m.m.position.set(rnd(-140,-70),0,-rnd(300,420));
        if(Math.random()<.3)m.m.position.x=rnd(110,160);
        const s=rnd(18,42); m.m.scale.set(s,s*rnd(.7,1.2),s);
        m.active=true;m.m.visible=true;}
      m.m.position.z+=dz*.12;
      if(m.m.position.z>90){m.active=false;m.m.visible=false;}}
    for(const c of Scene.clouds){
      if(!c.active){c.g.position.set(rnd(-130,130),rnd(38,68),-rnd(150,420));
        c.active=true;c.g.visible=true;}
      c.g.position.z+=dz*.22; c.g.position.x+=c.dx*dt;
      if(c.g.position.z>100||c.g.position.x>160){c.active=false;c.g.visible=false;}}

    const steerVis=clamp(S.pvx*.06,-.5,.5);
    if(P.steerL)P.steerL.rotation.y=steerVis;
    if(P.steerR)P.steerR.rotation.y=steerVis;
    const wspin=S.speed*dt/(P.isBike?.32:.35);
    P.wheels.forEach(w=>w.rotation.x-=wspin);

    SpatialGrid.clear();
    for(const c of Traffic.list()) if(c.active) SpatialGrid.insert(c);

    for(const c of Traffic.list()){
      if(!c.active)continue;
      const rel=c.oncoming?S.speed+c.speed:S.speed-c.speed;
      if(c.dead){c.vy-=20*dt;c.y+=c.vy*dt;
        c.g.rotation.z+=c.spin*dt;c.g.rotation.y+=c.spin*.6*dt;
        c.z+=rel*dt*.4; if(c.y<0)c.y=0;
        c.g.position.set(c.x,c.y,c.z);
        if(c.z>50||(c.y<=0&&c.vy<0)){c.active=false;c.g.visible=false;}continue;}
      c.z+=rel*dt;
      if(!c.oncoming&&c.kind!=='auto'&&S.dist>500){
        if(c.changeT>0){c.changeT-=dt;
          const tx=LANES[c.targetLane];
          c.x+=clamp(tx-c.x,-2.4*dt,2.4*dt);
          if(c.blinkMat)c.blinkMat.emissiveIntensity=(Math.floor(S.t*6)%2)?2.4:.1;
          if(c.changeT<=0){c.lane=c.targetLane;
            if(c.blinkMat)c.blinkMat.emissiveIntensity=.1;}}
        else if(Math.random()<dt*.12){
          const d2=Math.random()<.5?-1:1, tl=c.lane+d2;
          if(tl>=1&&tl<=3){let free=true;
            for(const o of Traffic.list())
              if(o.active&&!o.dead&&o.lane===tl&&Math.abs(o.z-c.z)<26)free=false;
            if(free){c.targetLane=tl;c.changeT=1.1;}}}}
      c.g.position.set(c.x,Math.sin(S.t*9+c.z*.4)*.02,c.z);
      c.g.rotation.y=c.oncoming?Math.PI:clamp((LANES[c.lane]-c.x)*.15,-.3,.3);
      c.wheels.forEach(w=>w.rotation.x-=c.speed*dt/.4);
      if(c.coneMat)c.coneMat.opacity=.14*Scene.nightF;
      if(c.z>48||c.z<-260){c.active=false;c.g.visible=false;}
      if(playing){
        const dx=Math.abs(c.x-S.px), dzp=Math.abs(c.z);
        const hitX=dx<(c.wid+(P.isBike?.6:1.7))/2;
        const hitZ=dzp<(c.len+(P.isBike?2.2:4.1))/2;
        if(hitX&&hitZ&&S.py<=1.25&&S.invuln<=0&&S.landT<=0){
          if(S.shield>0){S.shield--;P.shield.visible=S.shield>0;
            S.invuln=1.3;S.shake=Math.max(S.shake,reducedMotion?0:.7);
            Audio.sfx.whoosh();Audio.sfx.thud();
            c.dead=true;c.vy=9;c.spin=rnd(-6,6);
            onUpdate('shield',{pos:new THREE.Vector3(c.x,2,c.z)});}
          else crash(c);}
        if(!c.passed&&c.z>.4){c.passed=true;
          if(!c.dead&&S.invuln<=0){
            if(S.py>1.25&&dx<2.8){const v=Math.round(120*mult());
              S.score+=v;S.combo++;S.comboT=3.5;
              S.maxComboRun=Math.max(S.maxComboRun,S.combo);S.flys++;
              onUpdate('fly',{pos:new THREE.Vector3(c.x,2.5,c.z),v});
              Audio.sfx.whoosh();}
            else if(dx<(P.isBike?2.0:3.3)){const v=Math.round((c.oncoming?90:60)*mult());
              S.score+=v;S.combo++;S.comboT=3.5;
              S.maxComboRun=Math.max(S.maxComboRun,S.combo);S.misses++;
              onUpdate('miss',{pos:new THREE.Vector3(c.x,1.8,c.z),v,oncoming:c.oncoming});
              Audio.sfx.whoosh();}}}}
    }

    if(playing){
      S.invuln=Math.max(0,S.invuln-dt);
      P.tilt.visible=!(S.invuln>0&&Math.floor(S.t*12)%2);
      S.comboT-=dt; if(S.comboT<=0&&S.combo>0)S.combo=0;
      S.maxMult=Math.max(S.maxMult,mult());}

    const mr=magnetR();
    for(const c of coins){if(!c.active)continue;
      c.g.position.z+=dz; c.g.rotation.y+=3*dt;
      c.g.position.y=c.baseY+Math.sin(S.t*3+c.ph)*.15;
      if(c.g.position.z>20){c.active=false;c.g.visible=false;continue;}
      if(playing&&Math.abs(c.g.position.x-S.px)<mr&&Math.abs(c.g.position.z)<2.2&&
         Math.abs((S.py+.9)-c.g.position.y)<1.9+SaveManager.self().upg[4]*.3){
        c.active=false;c.g.visible=false;
        S.coins++;S.combo++;S.comboT=3.5;
        S.maxComboRun=Math.max(S.maxComboRun,S.combo);
        const v=Math.round(100*mult()); S.score+=v;
        Particles.burst(c.g.position,0xffd23f,7,5,.5,10,.12);
        onUpdate('coin',{pos:c.g.position.clone(),v});
        Audio.sfx.coin();}}
    for(const n of nitroCans){if(!n.active)continue;
      n.g.position.z+=dz; n.g.rotation.y+=2.4*dt;
      n.g.position.y=1.1+Math.sin(S.t*2.6+n.ph)*.18;
      if(n.g.position.z>20){n.active=false;n.g.visible=false;continue;}
      if(playing&&Math.abs(n.g.position.x-S.px)<1.6&&Math.abs(n.g.position.z)<2.2&&S.py<2){
        n.active=false;n.g.visible=false;
        const gain=nitroPick();
        S.nitro=Math.min(nitroMax(),S.nitro+gain);
        onUpdate('nitro',{pos:n.g.position.clone(),gain});
        Audio.sfx.nitro();
        if(S.nitro>=nitroMax())onUpdate('nitroFull');}}
    if(shieldOrb.active){
      shieldOrb.g.position.z+=dz;
      shieldOrb.ring.rotation.x+=2*dt; shieldOrb.ring.rotation.y+=1.4*dt;
      shieldOrb.g.position.y=1.2+Math.sin(S.t*2.4)*.18;
      if(shieldOrb.g.position.z>20){shieldOrb.active=false;shieldOrb.g.visible=false;}
      else if(playing&&Math.abs(shieldOrb.g.position.x-S.px)<1.6&&
              Math.abs(shieldOrb.g.position.z)<2.2&&S.py<2){
        shieldOrb.active=false;shieldOrb.g.visible=false;
        if(S.shield<shieldMax()){S.shield++;P.shield.visible=true;
          onUpdate('shieldPick',{pos:shieldOrb.g.position.clone(),gain:1});}
        else{S.score+=300;
          onUpdate('shieldPick',{pos:shieldOrb.g.position.clone(),score:300});}
        Audio.sfx.shield();}}
    for(const r of ramps){if(!r.active)continue;
      r.g.position.z+=dz;
      if(r.g.position.z>25){r.active=false;r.g.visible=false;continue;}
      if(playing&&!r.used&&S.py<.5&&S.speed>10&&
         Math.abs(r.g.position.x-S.px)<1.8&&Math.abs(r.g.position.z)<2.6){
        r.used=true;S.vy=7.5+S.speed*.16;S.py=.1;
        Audio.sfx.whoosh();
        onUpdate('ramp');
        Particles.dust(new THREE.Vector3(S.px,.2,1),5,3);}}
    for(const c of cones){if(!c.active)continue;
      if(c.hit){c.vy-=18*dt;c.x+=c.vx*dt;c.z+=dz*.5;c.vx*=.98;c.y+=c.vy*dt;
        c.g.position.set(c.x,Math.max(0,c.y),c.z);
        c.g.rotation.x+=c.vr*dt;c.g.rotation.z+=c.vr*.7*dt;
        if(c.z>25){c.active=false;c.g.visible=false;}}
      else{c.g.position.z+=dz;c.z=c.g.position.z;
        if(c.g.position.z>25){c.active=false;c.g.visible=false;continue;}
        if(playing&&S.py<.8&&Math.abs(c.g.position.x-S.px)<1.3&&Math.abs(c.g.position.z)<1.5){
          c.hit=true;c.vy=rnd(5,8);
          c.vx=(c.g.position.x>S.px?1:-1)*rnd(4,7);
          c.y=0;c.vr=rnd(6,12);
          S.score=Math.max(0,S.score-50);
          S.shake=Math.max(S.shake,reducedMotion?0:.35);
          S.combo=0;
          onUpdate('cone',{pos:c.g.position.clone()});
          Audio.sfx.thud();}}}

    /* Suspension spring (damped) */
    S.suspV+=(-80*S.susp-10*S.suspV)*dt;
    S.susp+=S.suspV*dt;

    P.g.position.set(S.px,S.py,0);
    if(S.mode==='crashed'){
      S.crashT+=raw;
      S.py=Math.max(0,S.py+S.vy*raw); S.vy-=20*raw;
      P.tilt.rotation.z+=S.tumble*raw;
      P.tilt.rotation.x+=S.tumble*.5*raw;
      P.g.position.y=S.py;
      if(S.crashT>1.5)onUpdate('gameOver');
    }else{
      P.tilt.rotation.z=clamp(-S.pvx*.028,-.2,.2);
      P.tilt.rotation.y=clamp(S.pvx*.03,-.25,.25);
      P.tilt.rotation.x=clamp((target-S.speed)*.008,-.06,.06)+clamp(S.susp*.08,-.12,.12);
      P.tilt.position.y=Math.sin(S.t*14)*.012*Math.min(1,S.speed/20)+S.susp;
    }
    P.tailMat.emissiveIntensity=brake?2.8:.9;
    if(P.blinkL)P.blinkL.emissiveIntensity=inL&&Math.floor(S.t*5)%2?2.4:.1;
    if(P.blinkR)P.blinkR.emissiveIntensity=inR&&Math.floor(S.t*5)%2?2.4:.1;
    if(P.shield)P.shield.rotation.y+=dt*1.5;
    P.flames.forEach(f=>{f.visible=S.nitroOn;
      if(S.nitroOn){f.scale.y=rnd(.6,1.3);f.scale.x=f.scale.z=rnd(.7,1.1);}});
    if(P.hlCone){P.hlCone.material.opacity=.15*Scene.nightF;
      P.hlCone.visible=Scene.nightF>.05;}
    if(P.hlGlow)P.hlGlow.forEach(s=>s.material.opacity=.7*Scene.nightF);
    if(P.hlLight)P.hlLight.intensity=Scene.nightF*(P.isBike?2:2.6);

    const streakOn=!reducedMotion&&S.perfLevel>0&&(S.nitroOn||S.speed>36);
    Particles.update(dt,dz,S,streakOn,reducedMotion);

    S.shake*=Math.exp(-5*raw);
    const fovT=58+S.speed*.28+(S.nitroOn?6:0);
    Scene.camera.fov+=(fovT-Scene.camera.fov)*Math.min(1,raw*5);
    Scene.camera.updateProjectionMatrix();
    const sh=reducedMotion?0:S.shake;
    Scene.camera.position.set(
      S.px*.62+rnd(-1,1)*sh*.3,
      4.6+S.py*.55+S.speed*.02+rnd(-1,1)*sh*.3-S.susp*1.5,
      9.2);
    Scene.camera.lookAt(S.px*.85,1.4+S.py*.5,-10);
    if(!reducedMotion)Scene.camera.rotateZ(-clamp(S.pvx*.012,-.05,.05));
    Audio.setEngine(S.mode==='menu'?.3:S.speed/46,S.nitroOn,vehicle().type);
  }

  function finalizeRun(){
    const save=SaveManager.self();
    const sc=Math.floor(S.score);
    const rec=sc>save.best;
    SaveManager.recordRun(sc,S.dist,S.coins,save.vehSel,S.topSpeed,S.maxComboRun,S.misses,S.flys);
    if(vehicle().type==='bike')save.st.bikeRuns++;
    save.st.nitroT+=Math.floor(S.nitroUsed);
    if(S.biome>=3)save.st.city=1;
    const chalGot=[];
    for(const c of CHALLENGES){
      if(save.chal&(1<<c.id))continue;
      let val=0;
      if(c.type==='score')val=sc;
      else if(c.type==='speed')val=Math.round(S.topSpeed);
      else if(c.type==='combo')val=S.maxComboRun;
      else if(c.type==='dist')val=S.dist;
      else if(c.type==='coins')val=S.coins;
      else if(c.type==='nitro')val=save.st.nitroT;
      else if(c.type==='fly')val=S.flys;
      else if(c.type==='friend')
        val=save.friends.length>0&&sc>Math.max(...save.friends.map(f=>f.best))?1:0;
      else if(c.type==='bikeScore')val=vehicle().type==='bike'?sc:0;
      else if(c.type==='speedBonus')val=S.speedBonusGates;
      else if(c.type==='clean')val=S.maxCleanDist;
      if(val>=c.goal){save.chal|=1<<c.id;save.gold+=c.rw;chalGot.push(c);}}
    const achGot=[];
    for(const a of ACHIEVEMENTS){
      if(save.ach&(1<<a.id))continue;
      if(a.get(save)>=a.goal){save.ach|=1<<a.id;save.gold+=a.rw;achGot.push(a);}}
    const runGold=Math.floor((S.coins*20+sc*.03)*bountyM());
    save.gold+=runGold;
    SaveManager.persist();
    const beaten=SaveManager.selfBestBeaten(sc);
    return {score:sc,rec,gold:runGold,achGot,chalGot,beaten,
      dist:S.dist,coins:S.coins,combo:S.maxMult,misses:S.misses,
      biome:BIOMES[S.biome].name,vehicle:vehicle().name,speedBonusGates:S.speedBonusGates,cleanDist:S.maxCleanDist};
  }

  return {
    S,P,init,resetRun,rebuildPlayer,populateDecor,update,finalizeRun,currentLocation,
    startCount(){S.mode='count';S.cdT=3.4;S.cdNum=4;},
    setMode(m){S.mode=m;},
    startPlay(){S.mode='play';},
    setPaused(p){S.mode=p?'pause':'play';},
    setPerf(l){
      S.perfLevel=l;
      S.decorMult=l===0?1.65:l===1?1.25:1;
      S.trafficMult=l===0?0.72:l===1?0.9:1;
      S.pickupMult=l===0?0.78:l===1?0.9:1;
    },
    horn(){ if(S.hornT>0 || S.mode==='crashed') return; S.hornT=.45; Audio.sfx.horn(); }
  };
})();