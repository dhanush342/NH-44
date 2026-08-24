/* ══════════ Vehicle Models — HIGH QUALITY (cars + bikes) ══════════ */
import {TRAFFIC_COLORS} from './config.js';

export const Models = (() => {
  let Scene = null;
  const TIRE = new THREE.CylinderGeometry(1,1,1,18);
  const HUB  = new THREE.CylinderGeometry(1,1,1,12);

  function init(S){ Scene = S; }

  function wheel(g,x,y,z,r,detail){
    const wg = new THREE.Group(); wg.position.set(x,y,z);
    const t = new THREE.Mesh(TIRE, Scene.materials.tire);
    t.scale.set(r, r*0.78, r); t.rotation.z = Math.PI/2; t.castShadow = true;
    const h = new THREE.Mesh(HUB, Scene.materials.silver);
    h.scale.set(r*0.6, r*0.82, r*0.6); h.rotation.z = Math.PI/2;
    wg.add(t,h);
    if(detail){
      const c = new THREE.Mesh(HUB, Scene.materials.dark);
      c.scale.set(r*0.22, r*0.86, r*0.22); c.rotation.z = Math.PI/2;
      wg.add(c);
    }
    g.add(wg); return wg;
  }
  function box(g,m,w,h,d,x,y,z,rx,ry,rz,sh){
    const o = new THREE.Mesh(Scene.geo.box,m);
    o.scale.set(w,h,d); o.position.set(x,y,z);
    if(rx)o.rotation.x=rx; if(ry)o.rotation.y=ry; if(rz)o.rotation.z=rz;
    if(sh!==false)o.castShadow=true;
    g.add(o); return o;
  }
  function cyl(g,m,rt,rb,h,x,y,z,seg,sh){
    const o = new THREE.Mesh(Scene.geo.cyl,m);
    o.scale.set(rb,h,rt); o.position.set(x,y,z);
    if(sh!==false)o.castShadow=true;
    g.add(o); return o;
  }
  function cone(g,m,r,h,x,y,z,sh){
    const o = new THREE.Mesh(Scene.geo.cone,m);
    o.scale.set(r,h,r); o.position.set(x,y,z);
    if(sh!==false)o.castShadow=true;
    g.add(o); return o;
  }
  function sph(g,m,r,x,y,z,sh){
    const o = new THREE.Mesh(Scene.geo.sph,m);
    o.scale.set(r,r,r); o.position.set(x,y,z);
    if(sh!==false)o.castShadow=true;
    g.add(o); return o;
  }
  const pick = a => a[Math.random()*a.length|0];

  /* Modern emissive strips */
  const drlMat = () => new THREE.MeshStandardMaterial({color:0xdfe8ee,emissive:0xbfe8ff,emissiveIntensity:.9});
  const blinkMatM = () => new THREE.MeshStandardMaterial({color:0x6a4a10,emissive:0xffa020,emissiveIntensity:.1});

  /* ══════════ TRAFFIC CAR (upgraded) ══════════ */
  function buildCarBody(color){
    const g = new THREE.Group();
    const p = Scene.paintM(color); p.roughness=.3; p.metalness=.7;
    const glass = new THREE.MeshStandardMaterial({color:0x0e1a24,metalness:.9,roughness:.12});
    box(g,p,1.84,.42,4.3,0,.5,0);
    const hood = box(g,p,1.72,.1,1.4,0,.76,-1.35); hood.rotation.x=.05;
    const trunk = box(g,p,1.72,.1,.9,0,.76,1.6); trunk.rotation.x=-.07;
    box(g,glass,1.5,.42,1.9,0,.95,.1);
    box(g,glass,1.46,.44,.08,0,.9,-.84,-.4);
    box(g,glass,1.46,.4,.08,0,.92,1.0,.42);
    box(g,p,1.46,.05,1.6,0,1.18,.1);
    box(g,p,.3,.06,.14,-.98,.9,-.55); box(g,p,.3,.06,.14,.98,.9,-.55);
    box(g,Scene.materials.dark,1.9,.2,.42,0,.36,-2.16);
    box(g,Scene.materials.dark,1.9,.2,.42,0,.36,2.16);
    box(g,drlMat(),1.5,.05,.04,0,.62,-2.18);                 // DRL bar
    const tl = new THREE.MeshStandardMaterial({color:0x5a1210,emissive:0xff2a1a,emissiveIntensity:.9});
    box(g,tl,1.6,.06,.04,0,.66,2.18);                        // light bar
    box(g,Scene.materials.white,.5,.13,.03,0,.42,-2.17);
    box(g,Scene.materials.white,.5,.13,.03,0,.42,2.17);
    const bm = blinkMatM();
    box(g,bm,.1,.12,.3,-.93,.55,-1.8); box(g,bm,.1,.12,.3,.93,.55,-1.8);
    const wl = [
      wheel(g,-.82,.32,-1.42,.34,false), wheel(g,.82,.32,-1.42,.34,false),
      wheel(g,-.82,.32,1.42,.34,false),  wheel(g,.82,.32,1.42,.34,false)
    ];
    const cm = new THREE.Mesh(Scene.geo.plane, new THREE.MeshBasicMaterial({
      color:0xfff3c9,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
    cm.scale.set(2.2,7,1); cm.rotation.x=-Math.PI/2; cm.position.set(0,.1,-5.4); g.add(cm);
    return {g,wheels:wl,blinkMat:bm,coneMat:cm.material,len:4.3,wid:1.85};
  }

  function buildTruck(color){
    const g = new THREE.Group();
    const p = Scene.paintM(color);
    const trim = Scene.paintM(pick(TRAFFIC_COLORS));
    box(g,Scene.materials.dark,1.8,.3,6.8,0,.5,0);
    box(g,p,1.9,1.0,1.7,0,1.15,-2.5);
    box(g,new THREE.MeshStandardMaterial({color:0x0e1a24,metalness:.9,roughness:.12}),1.7,.5,.08,0,1.5,-3.32);
    box(g,trim,.34,.08,.14,-1.05,1.42,-2.3); box(g,trim,.34,.08,.14,1.05,1.42,-2.3);
    const tm = new THREE.MeshStandardMaterial({map:Scene.textures.truck,roughness:.75});
    const cargo = new THREE.Mesh(Scene.geo.box,[tm,tm,trim,trim,trim,trim]);
    cargo.scale.set(2.0,2.0,3.9); cargo.position.set(0,1.75,1.3); cargo.castShadow=true; g.add(cargo);
    box(g,drlMat(),1.4,.06,.04,0,.95,-3.36);
    const tl = new THREE.MeshStandardMaterial({color:0x5a1210,emissive:0xff2a1a,emissiveIntensity:.9});
    box(g,tl,1.7,.08,.04,0,.8,3.32);
    box(g,Scene.materials.white,.7,.18,.03,0,.62,3.36);
    const bm = blinkMatM();
    box(g,bm,.1,.14,.3,-.96,.9,-2.2); box(g,bm,.1,.14,.3,.96,.9,-2.2);
    const wl = [-2.6,-1.9,2.2,2.9].flatMap(z=>[
      wheel(g,-.9,.42,z,.42,false), wheel(g,.9,.42,z,.42,false)]);
    return {g,wheels:wl,blinkMat:bm,coneMat:null,len:7.4,wid:2.0};
  }

  function buildBus(){
    const g = new THREE.Group();
    const p = Scene.paintM(pick([0xe8a030,0x3fa7c4,0xe05040,0x2e8b47]));
    box(g,p,2.0,1.5,6.4,0,1.1,0);
    box(g,new THREE.MeshStandardMaterial({color:0x0e1a24,metalness:.9,roughness:.12}),2.06,.55,5.4,0,1.45,0);
    box(g,p,2.0,.12,6.4,0,1.9,0);
    box(g,drlMat(),1.6,.07,.04,0,.78,-3.22);
    const tl = new THREE.MeshStandardMaterial({color:0x5a1210,emissive:0xff2a1a,emissiveIntensity:.9});
    box(g,tl,1.8,.08,.04,0,.8,3.22);
    const bm = blinkMatM();
    const wl = [wheel(g,-.88,.4,-2.2,.4,false),wheel(g,.88,.4,-2.2,.4,false),
                wheel(g,-.88,.4,2.2,.4,false),wheel(g,.88,.4,2.2,.4,false)];
    return {g,wheels:wl,blinkMat:bm,coneMat:null,len:6.6,wid:2.0};
  }

  function buildAuto(){
    const g = new THREE.Group();
    const body = Scene.paintM(pick([0x2e8b47,0xe8b830,0x2a6ab0]));
    box(g,Scene.materials.dark,1.26,.18,2.3,0,.24,0);
    box(g,body,1.42,.85,2.05,0,.82,.08);
    box(g,body,1.3,.35,.5,0,1.2,-.75);
    box(g,new THREE.MeshStandardMaterial({color:0x0e1a24,metalness:.9,roughness:.12}),1.24,.42,.06,0,1.18,-.98,-.15);
    box(g,Scene.paintM(0x181a1e),1.46,.12,1.8,0,1.55,.15);
    cyl(g,Scene.materials.dark,.05,.05,.5,-.68,1.3,.1,6,false);
    cyl(g,Scene.materials.dark,.05,.05,.5,.68,1.3,.1,6,false);
    box(g,Scene.materials.head,.16,.14,.05,0,.78,-1.04);
    const tl = new THREE.MeshStandardMaterial({color:0x5a1210,emissive:0xff2a1a,emissiveIntensity:.9});
    box(g,tl,.9,.06,.04,0,.66,1.12);
    const wF=wheel(g,0,.28,-.92,.28,false),wL=wheel(g,-.6,.28,.82,.28,false),wR=wheel(g,.6,.28,.82,.28,false);
    return {g,wheels:[wF,wL,wR],blinkMat:null,coneMat:null,len:2.7,wid:1.5};
  }

  /* ══════════ PLAYER CAR — show-quality ══════════ */
  function buildPlayerCar(cd){
    const g = new THREE.Group(), tilt = new THREE.Group(); g.add(tilt);
    const paint = Scene.paintM(cd.color); paint.roughness=.26; paint.metalness=.78;
    const stripeM = Scene.mat(cd.stripe); stripeM.metalness=.4; stripeM.roughness=.4;
    const glass = new THREE.MeshStandardMaterial({color:0x0e1a24,metalness:.9,roughness:.1});
    const dark = Scene.materials.dark;

    box(tilt,paint,1.92,.34,4.5,0,.42,0);                       // chassis
    const hood = box(tilt,paint,1.8,.12,1.5,0,.66,-1.42); hood.rotation.x=.06;
    const trunk = box(tilt,paint,1.8,.12,1.0,0,.66,1.66); trunk.rotation.x=-.08;
    box(tilt,glass,1.5,.42,1.9,0,.98,.12);                     // cabin glass
    box(tilt,glass,1.46,.5,.09,0,.92,-.86,-.42);               // windshield
    box(tilt,glass,1.46,.44,.09,0,.95,1.06,.45);               // rear glass
    box(tilt,paint,1.5,.06,1.7,0,1.22,.12);                    // roof
    sph(tilt,Scene.mat(0xd8d8d8),.2,0,1.05,.1);                // driver helmet
    box(tilt,stripeM,.5,.02,1.5,0,.735,-1.42);
    box(tilt,stripeM,.5,.02,1.9,0,1.26,.12);
    box(tilt,dark,2.0,.1,.5,0,.18,-2.28);                      // splitter
    box(tilt,dark,2.0,.12,.45,0,.2,2.28);                      // diffuser
    box(tilt,dark,.12,.16,3.6,-.98,.22,0);
    box(tilt,dark,.12,.16,3.6,.98,.22,0);
    box(tilt,paint,.3,.07,.16,-1.06,.98,-.6);
    box(tilt,paint,.3,.07,.16,1.06,.98,-.6);
    box(tilt,drlMat(),1.6,.06,.05,0,.55,-2.26);                // DRL
    const tailMat = new THREE.MeshStandardMaterial({color:0x5a1210,emissive:0xff2a1a,emissiveIntensity:.9});
    box(tilt,tailMat,1.7,.07,.05,0,.62,2.28);                  // light bar
    box(tilt,Scene.materials.white,.5,.14,.03,0,.42,-2.27);
    box(tilt,Scene.materials.white,.5,.14,.03,0,.42,2.27);
    cyl(tilt,Scene.materials.silver,.06,.06,.22,-.5,.3,2.32,10,false).rotation.x=Math.PI/2;
    cyl(tilt,Scene.materials.silver,.06,.06,.22,.5,.3,2.32,10,false).rotation.x=Math.PI/2;
    box(tilt,dark,.09,.22,.09,-.7,.86,2.05);                   // spoiler struts
    box(tilt,dark,.09,.22,.09,.7,.86,2.05);
    box(tilt,paint,1.7,.07,.42,0,1.0,2.12);
    const blinkL = blinkMatM(), blinkR = blinkMatM();
    box(tilt,blinkL,.1,.13,.32,-.97,.58,-1.85);
    box(tilt,blinkR,.1,.13,.32,.97,.58,-1.85);

    const flames = [-.45,.45].map(x=>{
      const f = new THREE.Mesh(Scene.geo.cone,new THREE.MeshBasicMaterial({
        color:0x86d9ff,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}));
      f.scale.set(.17,.9,.17); f.rotation.x=Math.PI/2; f.position.set(x,.34,2.75);
      f.visible=false; g.add(f); return f;});
    const hlCone = new THREE.Mesh(Scene.geo.plane,new THREE.MeshBasicMaterial({
      color:0xfff3c9,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
    hlCone.scale.set(2.6,8,1); hlCone.rotation.x=-Math.PI/2; hlCone.position.set(0,.1,-5.8);
    hlCone.visible=false; g.add(hlCone);
    const mkGlow=(col,scale,op)=>new THREE.Sprite(new THREE.SpriteMaterial({
      map:Scene.textures.glow,color:col,transparent:true,opacity:op,
      blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
    const hlGlow = [-.62,.62].map(x=>{const s=mkGlow(0xfff1c4,1.6,0);s.position.set(x,.64,-2.4);g.add(s);return s;});
    const hlLight = new THREE.SpotLight(0xffe2ae,0,46,.55,.5,1.4);
    hlLight.position.set(0,.9,-1.6); g.add(hlLight);
    hlLight.target.position.set(0,.2,-20); g.add(hlLight.target);
    const shield = new THREE.Mesh(Scene.geo.sph,new THREE.MeshBasicMaterial({
      color:0x41e0ff,transparent:true,opacity:.14,blending:THREE.AdditiveBlending,depthWrite:false}));
    shield.scale.set(2.3,1.7,2.6); shield.position.y=1; shield.visible=false; g.add(shield);

    const steerL=new THREE.Group(), steerR=new THREE.Group();
    steerL.position.set(-.84,.35,-1.46); steerR.position.set(.84,.35,-1.46);
    g.add(steerL,steerR);
    const wheels=[wheel(steerL,0,0,0,.35,true),wheel(steerR,0,0,0,.35,true),
                  wheel(g,-.84,.35,1.46,.35,true),wheel(g,.84,.35,1.46,.35,true)];
    return {g,tilt,wheels,tailMat,blinkL,blinkR,flames,hlCone,hlGlow,hlLight,shield,
            steerL,steerR,isBike:false,wid:1.9,len:4.5};
  }

  /* ══════════ PLAYER BIKE — show-quality ══════════ */
  function buildPlayerBike(cd){
    const g = new THREE.Group(), tilt = new THREE.Group(); g.add(tilt);
    const p = Scene.paintM(cd.color); p.roughness=.28; p.metalness=.75;
    const s = Scene.mat(cd.stripe);
    const glass = new THREE.MeshStandardMaterial({color:0x0e1a24,metalness:.9,roughness:.12});
    box(tilt,p,.42,.38,1.9,0,.58,0);
    box(tilt,p,.54,.42,.95,0,.98,-.32);
    box(tilt,s,.56,.12,.55,0,1.0,-.32);
    box(tilt,glass,.4,.25,.06,0,1.25,-.62,-.3);               // windscreen
    box(tilt,Scene.paintM(0x1a1a1a),.4,.13,1.0,0,.94,.58);
    const rider = Scene.paintM(0x2a2a2a);
    box(tilt,rider,.4,.52,.34,0,1.28,-.05);
    box(tilt,Scene.paintM(0x111111),.32,.32,.32,0,1.68,-.1);   // helmet
    box(tilt,Scene.paintM(0xc4a587),.22,.14,.22,0,1.52,-.02);
    box(tilt,rider,.24,.38,.24,-.24,1.18,-.32);
    box(tilt,rider,.24,.38,.24,.24,1.18,-.32);
    box(tilt,rider,.3,.38,.34,-.2,.97,.58);
    box(tilt,rider,.3,.38,.34,.2,.97,.58);
    box(tilt,Scene.materials.dark,.72,.09,.09,0,1.14,-.72);
    box(tilt,Scene.materials.dark,.1,.58,.1,0,.62,-.98,.2);
    box(tilt,Scene.materials.head,.24,.2,.07,0,.92,-1.08);
    const tailMat = new THREE.MeshStandardMaterial({color:0x5a1210,emissive:0xff2a1a,emissiveIntensity:.9});
    box(tilt,tailMat,.22,.09,.06,0,.87,1.02);
    cyl(tilt,Scene.materials.silver,.05,.05,.85,.24,.47,.92,10,false).rotation.x=Math.PI/2;
    box(tilt,p,.3,.06,.42,0,.52,-.98);
    box(tilt,Scene.materials.white,.22,.12,.03,0,.72,1.08);
    const blinkL = blinkMatM(), blinkR = blinkMatM();
    box(tilt,blinkL,.08,.1,.2,-.38,.7,-.9);
    box(tilt,blinkR,.08,.1,.2,.38,.7,-.9);
    const flames=[0].map(()=>{const f=new THREE.Mesh(Scene.geo.cone,new THREE.MeshBasicMaterial({
      color:0x86d9ff,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}));
      f.scale.set(.12,.7,.12); f.rotation.x=Math.PI/2; f.position.set(.24,.47,1.4);
      f.visible=false; g.add(f); return f;});
    const hlCone = new THREE.Mesh(Scene.geo.plane,new THREE.MeshBasicMaterial({
      color:0xfff3c9,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
    hlCone.scale.set(1.6,6,1); hlCone.rotation.x=-Math.PI/2; hlCone.position.set(0,.1,-4);
    hlCone.visible=false; g.add(hlCone);
    const mkGlow=(col,scale,op)=>new THREE.Sprite(new THREE.SpriteMaterial({
      map:Scene.textures.glow,color:col,transparent:true,opacity:op,
      blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
    const hlGlow=[0].map(()=>{const sp=mkGlow(0xfff1c4,1.2,0);sp.position.set(0,.92,-1.1);g.add(sp);return sp;});
    const hlLight = new THREE.SpotLight(0xffe2ae,0,36,.5,.5,1.4);
    hlLight.position.set(0,.9,-.8); g.add(hlLight);
    hlLight.target.position.set(0,.2,-15); g.add(hlLight.target);
    const shield = new THREE.Mesh(Scene.geo.sph,new THREE.MeshBasicMaterial({
      color:0x41e0ff,transparent:true,opacity:.14,blending:THREE.AdditiveBlending,depthWrite:false}));
    shield.scale.set(1.5,1.4,2.2); shield.position.y=1.1; shield.visible=false; g.add(shield);
    const wheels=[wheel(g,0,.32,-.98,.34,true),wheel(g,0,.32,.88,.34,true)];
    return {g,tilt,wheels,tailMat,blinkL,blinkR,flames,hlCone,hlGlow,hlLight,shield,
            steerL:null,steerR:null,isBike:true,wid:.6,len:2.2};
  }

  function buildPlayer(cd){
    return cd.type === 'bike' ? buildPlayerBike(cd) : buildPlayerCar(cd);
  }

  return {init, buildCarBody, buildTruck, buildBus, buildAuto, buildPlayer};
})();