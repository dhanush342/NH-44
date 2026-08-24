/* ══════════ Three.js Scene Setup ══════════ */
import {INDIA_LOCATIONS, BILLBOARD_ADS} from './config.js';

export const Scene = {
  renderer: null, scene: null, camera: null,
  skyUni: null, textures: {}, materials: {}, geo: {},
  groundMat: null, seaMat: null, cloudMat: null, mountMat: null,
  mounts: [], clouds: [], posts: [], decor: {},
  dir: null, hemi: null, amb: null, sunDisc: null, sunGlow: null, moonDisc: null,
  nightF: 0,

  init(W, H) {
    if(!window.THREE) return false;
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true, powerPreference: 'high-performance'
      });
    } catch(e) { return false; }

    this.renderer.setPixelRatio(Math.min(
      devicePixelRatio || 1,
      /Mobi|Android/i.test(navigator.userAgent) ? 1.75 : 2
    ));
    this.renderer.setClearColor(0x070d1b, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.domElement.setAttribute('role','img');
    this.renderer.domElement.setAttribute('aria-label','NH-44 3D scene');
    document.getElementById('stage').appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xdd9067, 30, 185);
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 900);
    this.camera.position.set(0, 5, 10);
    this.resize(W, H);

    this.geo = {
      box: new THREE.BoxGeometry(1,1,1),
      cyl: new THREE.CylinderGeometry(1,1,1,14),
      cone: new THREE.ConeGeometry(1,1,7),
      sph: new THREE.SphereGeometry(1,12,10),
      dod: new THREE.DodecahedronGeometry(1),
      cir: new THREE.CircleGeometry(1,14),
      plane: new THREE.PlaneGeometry(1,1)
    };
    this.buildMaterials();
    this.buildSky();
    this.buildLights();
    this.buildGround();
    this.buildDecor();
    return true;
  },

  resize(W, H) {
    this.renderer.setSize(W, H);
    this.camera.aspect = W / H;
    this.camera.updateProjectionMatrix();
  },

  cTex(w, h, fn, rep) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    fn(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    if(rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
    t.anisotropy = 4;
    return t;
  },

  rnd(a, b) { return a + Math.random() * (b - a); },

  buildMaterials() {
    const rnd = this.rnd;
    const cTex = this.cTex.bind(this);
    const MC = {};
    const mat = (c, o) => {
      const k = c + JSON.stringify(o || {});
      if(MC[k]) return MC[k];
      return MC[k] = new THREE.MeshStandardMaterial(
        Object.assign({color: c, roughness: 0.85, metalness: 0.05}, o || {})
      );
    };
    this.mat = mat;
    this.paintM = c => mat(c, {metalness: 0.55, roughness: 0.34});

    this.textures.glow = cTex(64,64,g=>{
      const r = g.createRadialGradient(32,32,2,32,32,30);
      r.addColorStop(0,'rgba(255,255,255,1)');
      r.addColorStop(1,'rgba(255,255,255,0)');
      g.fillStyle = r; g.fillRect(0,0,64,64);
    });
    this.textures.asphalt = cTex(128,128,(g,w,h)=>{
      g.fillStyle = '#484d58'; g.fillRect(0,0,w,h);
      for(let i = 0; i < 420; i++) {
        g.fillStyle = `rgba(${Math.random()>.5?255:0},${Math.random()>.5?255:20},${Math.random()>.5?255:40},${rnd(.03,.12)})`;
        g.fillRect(Math.random()*w, Math.random()*h, rnd(1,3), rnd(1,3));
      }
    }, true);
    this.textures.asphalt.repeat.set(6, 42);
    this.textures.dash = cTex(32,256,(g,w,h)=>{
      g.clearRect(0,0,w,h); g.fillStyle = '#f5f1e2';
      g.fillRect(7,10,18,66);
    }, true);
    this.textures.dash.repeat.set(1,25);
    this.textures.chev = cTex(128,128,(g,w,h)=>{
      g.fillStyle = '#e8a020'; g.fillRect(0,0,w,h); g.fillStyle = '#1c1c1c';
      for(let i = 0; i < 3; i++) {
        const y = 18 + i*40;
        g.beginPath();
        g.moveTo(64,y); g.lineTo(104,y+26); g.lineTo(84,y+26);
        g.lineTo(64,y+13); g.lineTo(44,y+26); g.lineTo(24,y+26);
        g.closePath(); g.fill();
      }
    });
    const winTex = () => cTex(128,256,(g,w,h)=>{
      g.fillStyle = '#262b36'; g.fillRect(0,0,w,h);
      for(let r = 0; r < 12; r++)
        for(let c = 0; c < 6; c++) {
          const lit = Math.random() < 0.55;
          g.fillStyle = lit ? (Math.random()<0.7?'#ffd98a':'#bfe3ff') : '#12161f';
          g.fillRect(8 + c*20, 10 + r*20, 13, 13);
        }
    });
    this.textures.win = [winTex(), winTex(), winTex()];

    // Billboard textures from config
    this.textures.bb = BILLBOARD_ADS.map(([t,bg,fg]) => cTex(256,128,(g,w,h)=>{
      g.fillStyle = bg; g.fillRect(0,0,w,h);
      g.strokeStyle = '#f2f2f2'; g.lineWidth = 8;
      g.strokeRect(8,8,w-16,h-16);
      g.fillStyle = fg;
      g.font = '700 38px "Russo One","Segoe UI",sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(t, w/2, h/2 + 2);
    }));

    // Dynamic India location billboards
    this.textures.locBB = INDIA_LOCATIONS.map(loc => cTex(256,128,(g,w,h)=>{
      g.fillStyle = '#0b6e4f'; g.fillRect(0,0,w,h);
      g.strokeStyle = '#f2f2f2'; g.lineWidth = 8;
      g.strokeRect(8,8,w-16,h-16);
      g.fillStyle = '#fff';
      g.font = '700 32px "Russo One","Segoe UI",sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(loc.name, w/2, h/2 - 15);
      g.font = '400 18px "Segoe UI",sans-serif';
      g.fillStyle = '#ffd23f';
      g.fillText(loc.state + ' · ' + loc.famous, w/2, h/2 + 20);
    }));

    this.textures.truck = cTex(256,128,(g,w,h)=>{
      g.fillStyle = '#a3262a'; g.fillRect(0,0,w,h);
      const cols = ['#f2c230','#2a6ab0','#2e8b47','#e86a1a'];
      cols.forEach((c,i) => {
        g.fillStyle = c; g.fillRect(0, h-14-i*9, w, 7);
      });
      g.fillStyle = '#f5efe0';
      g.font = '700 28px "Russo One","Segoe UI",sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('HORN OK PLEASE', w/2, 40);
      g.font = '700 18px "Russo One","Segoe UI",sans-serif';
      g.fillStyle = '#ffd23f';
      g.fillText('· NH-44 ·', w/2, 70);
    });
    this.textures.shimmer = cTex(64,64,(g,w,h)=>{
      g.clearRect(0,0,w,h);
      g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.5;
      for(let i = 0; i < 6; i++) {
        g.beginPath();
        const y = rnd(4,60);
        g.moveTo(0,y);
        g.bezierCurveTo(16,y-3,48,y+3,64,y);
        g.stroke();
      }
    }, true);
    this.textures.shimmer.repeat.set(10, 26);

    const M = this.materials = {};
    M.dark = mat(0x1c2128, {roughness: 0.6});
    M.tire = mat(0x16181c, {roughness: 0.95});
    M.silver = mat(0xb9c0c9, {metalness: 0.8, roughness: 0.3});
    M.glass = mat(0x18242e, {metalness: 0.85, roughness: 0.1});
    M.white = mat(0xf2efe4);
    M.red = mat(0xc8322b);
    M.trunk = mat(0x7a5a3c);
    M.leaf = mat(0x2f8f4e, {flatShading: true});
    M.pine = mat(0x256b45, {flatShading: true});
    M.cactus = mat(0x3f9455, {roughness: 0.7});
    M.rockM = mat(0x8a8578, {flatShading: true, roughness: 0.95});
    M.bush = mat(0x3c7a44, {flatShading: true});
    M.head = new THREE.MeshStandardMaterial({
      color: 0xd8dee6, emissive: 0xfff1c4, emissiveIntensity: 0.25, roughness: 0.3
    });
    M.tailT = new THREE.MeshStandardMaterial({
      color: 0x5a1210, emissive: 0xff2a1a, emissiveIntensity: 0.9
    });
    M.lampHead = new THREE.MeshStandardMaterial({
      color: 0x8a8070, emissive: 0xffd9a0, emissiveIntensity: 0.3
    });
    M.blinkRed = new THREE.MeshStandardMaterial({
      color: 0x551010, emissive: 0xff2020, emissiveIntensity: 0.1
    });
    M.stripe = mat(0xf5efe0);
    M.yellow = mat(0xf5b31e);
    M.gravel = mat(0x8d8272);
    M.asphalt = new THREE.MeshStandardMaterial({
      color: 0xffffff, map: this.textures.asphalt, roughness: 0.95
    });
    M.dash = new THREE.MeshBasicMaterial({
      map: this.textures.dash, transparent: true, color: 0xf5f1e2
    });
    M.coneM = mat(0xe86a1a, {roughness: 0.6});
    this.groundMat = new THREE.MeshStandardMaterial({color: 0xcfa872, roughness: 1});
    this.seaMat = new THREE.MeshPhongMaterial({color: 0x2e7d9c, shininess: 110, specular: 0x88aabb});
    this.cloudMat = new THREE.MeshStandardMaterial({color: 0xffd9b8, roughness: 1, flatShading: true});
    this.mountMat = new THREE.MeshStandardMaterial({color: 0x584a6e, roughness: 1, flatShading: true});
  },

  buildSky() {
    this.skyUni = {
      uTop:{value:new THREE.Color()}, uMid:{value:new THREE.Color()},
      uBot:{value:new THREE.Color()}, uSunCol:{value:new THREE.Color()},
      uSunDir:{value:new THREE.Vector3(0,1,0)}, uNight:{value:0}, uTime:{value:0}
    };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(620,24,16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: this.skyUni,
      vertexShader: 'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `varying vec3 vP;
        uniform vec3 uTop,uMid,uBot,uSunCol,uSunDir;
        uniform float uNight,uTime;
        void main(){
          vec3 d = normalize(vP); float h = d.y;
          vec3 c = mix(uBot,uMid,smoothstep(-.04,.14,h));
          c = mix(c,uTop,smoothstep(.12,.62,h));
          float sd = max(dot(d,normalize(uSunDir)),0.);
          c += uSunCol * (pow(sd,6.)*.28 + pow(sd,48.)*.85);
          vec3 g = floor(d*240.);
          float n = fract(sin(dot(g,vec3(12.9898,78.233,37.719)))*43758.5453);
          float tw = .6 + .4*sin(uTime*2.5 + n*40.);
          c += vec3(.9,.95,1.) * step(.9985,n) * smoothstep(.03,.35,h) * uNight * tw;
          gl_FragColor = vec4(c,1.);
        }`
    }));
    sky.renderOrder = -10;
    this.scene.add(sky);

    this.sunDisc = new THREE.Mesh(
      new THREE.CircleGeometry(26,24),
      new THREE.MeshBasicMaterial({color:0xffdf9e,fog:false,transparent:true})
    );
    this.scene.add(this.sunDisc);

    const glowTex = this.textures.glow;
    const mkGlow = (col,scale,op) => new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: col, transparent: true, opacity: op,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false
    }));
    this.sunGlow = mkGlow(0xffcf8a, 200, 0.9);
    this.scene.add(this.sunGlow);

    this.moonDisc = new THREE.Mesh(
      new THREE.CircleGeometry(13,20),
      new THREE.MeshBasicMaterial({color:0xe8f2ff,fog:false,transparent:true,opacity:0})
    );
    this.scene.add(this.moonDisc);
  },

  buildLights() {
    this.hemi = new THREE.HemisphereLight(0xffb37e, 0x4a4038, 0.9);
    this.scene.add(this.hemi);
    this.amb = new THREE.AmbientLight(0x26304a, 0.5);
    this.scene.add(this.amb);
    this.dir = new THREE.DirectionalLight(0xffd7a3, 1.15);
    this.dir.castShadow = true;
    this.dir.shadow.mapSize.set(1024, 1024);
    this.dir.shadow.camera.left = -30;
    this.dir.shadow.camera.right = 30;
    this.dir.shadow.camera.top = 26;
    this.dir.shadow.camera.bottom = -46;
    this.dir.shadow.camera.near = 10;
    this.dir.shadow.camera.far = 190;
    this.dir.shadow.bias = -0.0006;
    this.scene.add(this.dir);
    this.scene.add(this.dir.target);
  },

  plane(g, m, w, l, x, y, z, rx, ry) {
    const o = new THREE.Mesh(this.geo.plane, m);
    o.scale.set(w, l, 1); o.position.set(x, y, z);
    o.rotation.x = rx === undefined ? -Math.PI/2 : rx;
    if(ry) o.rotation.y = ry;
    g.add(o);
    return o;
  },

  buildGround() {
    const p = this.plane.bind(this);
    p(this.scene, this.groundMat, 900, 900, 0, -0.02, 0).receiveShadow = true;
    p(this.scene, this.seaMat, 460, 900, 240, -0.3, -150);
    p(this.scene, new THREE.MeshBasicMaterial({
      map: this.textures.shimmer, transparent: true, opacity: 0.1,
      blending: THREE.AdditiveBlending, depthWrite: false
    }), 440, 700, 240, -0.18, -140);
    p(this.scene, this.materials.asphalt, 13.6, 300, 0, 0, -110).receiveShadow = true;
    p(this.scene, this.materials.gravel, 2.6, 300, -8.1, 0.005, -110);
    p(this.scene, this.materials.gravel, 2.6, 300, 8.1, 0.005, -110);
    p(this.scene, new THREE.MeshBasicMaterial({color:0xf5f1e2}), 0.18, 300, -6.5, 0.02, -110);
    p(this.scene, new THREE.MeshBasicMaterial({color:0xf5f1e2}), 0.18, 300, 6.5, 0.02, -110);
    p(this.scene, new THREE.MeshBasicMaterial({color:0xf5b31e}), 0.14, 300, -3.38, 0.02, -110);
    p(this.scene, new THREE.MeshBasicMaterial({color:0xf5b31e}), 0.14, 300, -3.02, 0.02, -110);
    [[0],[3.2]].forEach(([x]) => p(this.scene, this.materials.dash, 0.22, 300, x, 0.025, -110));
    const wearM = new THREE.MeshBasicMaterial({
      color: 0x26282f, transparent: true, opacity: 0.22, depthWrite: false
    });
    [-4.8,-1.6,1.6,4.8].forEach(x => p(this.scene, wearM, 1.12, 300, x, 0.012, -110));
    for(let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(this.geo.cone, this.mountMat);
      this.scene.add(m);
      this.mounts.push({m, active: false});
    }
    for(let i = 0; i < 8; i++) {
      const g = new THREE.Group();
      const sph = (g,m,r,x,y,z,sy,sh) => {
        const o = new THREE.Mesh(this.geo.sph, m);
        o.scale.set(r, r*(sy||1), r); o.position.set(x,y,z); g.add(o); return o;
      };
      const rnd = this.rnd;
      sph(g, this.cloudMat, rnd(5,8), 0, 0, 0, 0.42, false);
      sph(g, this.cloudMat, rnd(3.5,5), rnd(4,7), rnd(-1,1), 0, 0.42, false);
      sph(g, this.cloudMat, rnd(3,4.5), -rnd(4,6), rnd(-1,0), 0, 0.42, false);
      this.scene.add(g);
      this.clouds.push({g, active: false, dx: rnd(0.8, 2)});
    }
  },

  buildDecor() {
    const rnd = this.rnd;
    const box = (g,m,w,h,d,x,y,z,rx,ry,rz,sh) => {
      const o = new THREE.Mesh(this.geo.box, m);
      o.scale.set(w,h,d); o.position.set(x,y,z);
      if(rx) o.rotation.x = rx; if(ry) o.rotation.y = ry; if(rz) o.rotation.z = rz;
      if(sh !== false) o.castShadow = true;
      g.add(o); return o;
    };
    const cyl = (g,m,rt,rb,h,x,y,z,seg,sh) => {
      const o = new THREE.Mesh(this.geo.cyl, m);
      o.scale.set(rb,h,rt); o.position.set(x,y,z);
      if(sh !== false) o.castShadow = true;
      g.add(o); return o;
    };
    const cone = (g,m,r,h,x,y,z,sh) => {
      const o = new THREE.Mesh(this.geo.cone, m);
      o.scale.set(r,h,r); o.position.set(x,y,z);
      if(sh !== false) o.castShadow = true;
      g.add(o); return o;
    };
    const sph = (g,m,r,x,y,z,sy,sh) => {
      const o = new THREE.Mesh(this.geo.sph, m);
      o.scale.set(r, r*(sy||1), r); o.position.set(x,y,z);
      if(sh !== false) o.castShadow = true;
      g.add(o); return o;
    };
    const TAU = Math.PI * 2;
    const regDecor = (type, g, upd) => {
      g.visible = false; this.scene.add(g);
      (this.decor[type] = this.decor[type] || []).push({g, active: false, update: upd || null, ph: rnd(0, TAU)});
    };

    // Palm
    const counts = {palm:16,pine:14,cactus:12,rock:14,bush:14,windmill:5,building:12,billboard:7,parasol:8,hydrant:8,lamp:16};

    for(let i = 0; i < counts.palm; i++) {
      const g = new THREE.Group();
      const t = cyl(g, this.materials.trunk, 0.1, 0.17, 3, 0, 1.5, 0);
      t.rotation.z = 0.12;
      for(let j = 0; j < 6; j++) {
        const pv = new THREE.Group(); pv.position.set(0.18, 2.9, 0);
        pv.rotation.y = j/6 * TAU;
        const lf = cone(pv, this.materials.leaf, 0.34, 2.0, 0.95, 0.15, 0);
        lf.rotation.z = -1.25; lf.scale.z = 0.16;
      }
      regDecor('palm', g, (it,t) => { g.rotation.z = Math.sin(t*1.3 + it.ph) * 0.05; });
    }
    for(let i = 0; i < counts.pine; i++) {
      const g = new THREE.Group();
      cyl(g, this.materials.trunk, 0.16, 0.2, 0.9, 0, 0.45, 0);
      cone(g, this.materials.pine, 1.3, 1.7, 0, 1.5, 0);
      cone(g, this.materials.pine, 1.0, 1.5, 0, 2.4, 0);
      cone(g, this.materials.pine, 0.68, 1.3, 0, 3.2, 0);
      regDecor('pine', g);
    }
    for(let i = 0; i < counts.cactus; i++) {
      const g = new THREE.Group();
      cyl(g, this.materials.cactus, 0.28, 0.32, 1.9, 0, 0.95, 0);
      const a = cyl(g, this.materials.cactus, 0.15, 0.15, 0.62, 0.42, 1.25, 0);
      a.rotation.z = 0.2;
      cyl(g, this.materials.cactus, 0.14, 0.14, 0.5, 0.5, 1.0, 0).rotation.z = Math.PI/2;
      const b = cyl(g, this.materials.cactus, 0.14, 0.14, 0.55, -0.4, 0.9, 0);
      b.rotation.z = -0.2;
      cyl(g, this.materials.cactus, 0.13, 0.13, 0.44, -0.48, 0.72, 0).rotation.z = Math.PI/2;
      if(Math.random() < 0.5) sph(g, this.mat(0xff6a9a), 0.1, 0, 1.95, 0);
      regDecor('cactus', g);
    }
    for(let i = 0; i < counts.rock; i++) {
      const g = new THREE.Group();
      const r = new THREE.Mesh(this.geo.dod, this.materials.rockM);
      r.scale.set(1, 0.66, 1); r.position.y = 0.5;
      r.rotation.set(rnd(0,3), rnd(0,3), 0); r.castShadow = true;
      g.add(r); regDecor('rock', g);
    }
    for(let i = 0; i < counts.bush; i++) {
      const g = new THREE.Group();
      sph(g, this.materials.bush, 0.52, 0, 0.36, 0, 0.8);
      sph(g, this.materials.bush, 0.38, 0.42, 0.3, 0.2, 0.8);
      if(Math.random() < 0.6) sph(g, this.materials.bush, 0.34, -0.4, 0.28, -0.15, 0.8);
      regDecor('bush', g);
    }
    for(let i = 0; i < counts.windmill; i++) {
      const g = new THREE.Group();
      cyl(g, this.materials.white, 0.3, 0.55, 9, 0, 4.5, 0);
      box(g, this.materials.white, 1.1, 0.75, 0.8, 0, 9.1, 0);
      const hub = new THREE.Group(); hub.position.set(0, 9.1, 0.55); g.add(hub);
      for(let j = 0; j < 3; j++) {
        const bp = new THREE.Group(); bp.rotation.z = j/3 * TAU;
        box(bp, this.materials.white, 0.34, 4.4, 0.12, 0, 2.3, 0);
        hub.add(bp);
      }
      box(g, this.materials.blinkRed, 0.16, 0.16, 0.16, 0, 9.7, 0);
      regDecor('windmill', g, (it,t,dt) => { hub.rotation.z += dt * 1.5; });
    }
    const pick = a => a[Math.random() * a.length | 0];
    for(let i = 0; i < counts.building; i++) {
      const g = new THREE.Group();
      const w = rnd(6,9), d = rnd(6,9), h = rnd(9,22);
      const wm = new THREE.MeshStandardMaterial({
        map: pick(this.textures.win), color: 0xffffff,
        emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.8
      });
      wm.emissiveMap = wm.map;
      const roof = this.mat(pick([0x4a4f5a, 0x5a5048, 0x3f4550]));
      const b = new THREE.Mesh(this.geo.box, [wm,wm,roof,roof,wm,wm]);
      b.scale.set(w,h,d); b.position.y = h/2;
      b.castShadow = true; b.receiveShadow = true;
      g.add(b);
      box(g, roof, rnd(0.8,1.6), 0.7, rnd(0.8,1.6), rnd(-w/4,w/4), h+0.35, rnd(-d/4,d/4));
      const ant = cyl(g, this.materials.dark, 0.04, 0.04, 2.2, rnd(-w/4,w/4), h+1.1, rnd(-d/4,d/4), 6, false);
      const bl = new THREE.Mesh(this.geo.sph, this.materials.blinkRed);
      bl.scale.set(0.12, 0.12, 0.12); bl.position.y = 1.1; ant.add(bl);
      regDecor('building', g);
    }
    for(let i = 0; i < counts.billboard; i++) {
      const g = new THREE.Group();
      cyl(g, this.materials.dark, 0.1, 0.12, 3, -1.9, 1.5, 0, 8);
      cyl(g, this.materials.dark, 0.1, 0.12, 3, 1.9, 1.5, 0, 8);
      const t = pick(this.textures.bb);
      const fm = new THREE.MeshStandardMaterial({
        map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.7
      });
      const p = new THREE.Mesh(this.geo.box, [this.materials.dark,this.materials.dark,this.materials.dark,this.materials.dark,fm,this.materials.dark]);
      p.scale.set(5.6, 2.7, 0.22); p.position.y = 3.6; p.castShadow = true;
      g.add(p);
      regDecor('billboard', g);
    }
    for(let i = 0; i < counts.parasol; i++) {
      const g = new THREE.Group();
      cyl(g, this.materials.trunk, 0.05, 0.05, 1.7, 0, 0.85, 0, 8);
      cone(g, this.paintM(pick([0xe05040,0xf2a030,0x3fa7c4])), 1.35, 0.75, 0, 1.85, 0);
      g.rotation.z = 0.1;
      regDecor('parasol', g);
    }
    for(let i = 0; i < counts.hydrant; i++) {
      const g = new THREE.Group();
      cyl(g, this.materials.red, 0.2, 0.24, 0.55, 0, 0.3, 0);
      sph(g, this.materials.red, 0.2, 0, 0.62, 0, 0.8);
      cyl(g, this.materials.red, 0.08, 0.08, 0.42, -0.24, 0.4, 0, 8);
      cyl(g, this.materials.red, 0.08, 0.08, 0.42, 0.24, 0.4, 0, 8);
      regDecor('hydrant', g);
    }
    for(let i = 0; i < counts.lamp; i++) {
      const g = new THREE.Group();
      cyl(g, this.mat(0x3a4048), 0.08, 0.12, 4.6, 0, 2.3, 0, 8);
      box(g, this.mat(0x3a4048), 1.5, 0.09, 0.09, 0.7, 4.55, 0);
      box(g, this.materials.lampHead, 0.55, 0.15, 0.3, 1.35, 4.48, 0);
      const mkGlow = (col,scale,op) => new THREE.Sprite(new THREE.SpriteMaterial({
        map: this.textures.glow, color: col, transparent: true, opacity: op,
        blending: THREE.AdditiveBlending, depthWrite: false, fog: false
      }));
      const gl = mkGlow(0xffd9a0, 2.6, 0);
      gl.position.set(1.35, 4.4, 0); g.add(gl);
      regDecor('lamp', g);
    }
    for(let i = 0; i < 30; i++) {
      const g = new THREE.Group();
      box(g, this.materials.white, 0.13, 0.42, 0.13, 0, 0.24, 0, undefined, undefined, undefined, false);
      box(g, this.materials.red, 0.13, 0.13, 0.13, 0, 0.5, 0, undefined, undefined, undefined, false);
      g.visible = false; this.scene.add(g);
      this.posts.push({g, active: false});
    }
  },

  applyPhase(ph, S) {
    const KF = [
      {p:0,   top:'#2f3a6e',mid:'#cf6a52',bot:'#ffbf70',sun:'#ffdf9e',fog:'#dd9067',hS:'#ffb37e',hG:'#4a4038',dir:'#ffd7a3',di:1.15,night:0,  sea:'#2e7d9c',cloud:'#ffd9b8'},
      {p:.28, top:'#1a2150',mid:'#7c4068',bot:'#e08154',sun:'#ff9e5e',fog:'#9c5a68',hS:'#d98a70',hG:'#3a3444',dir:'#ff9e70',di:.6,  night:.35,sea:'#255f80',cloud:'#c98a90'},
      {p:.52, top:'#05081a',mid:'#0d1736',bot:'#1d2c55',sun:'#cfe0ff',fog:'#131c3a',hS:'#2c3f66',hG:'#14161f',dir:'#93b4ff',di:.32, night:1,  sea:'#0b2740',cloud:'#232c47'},
      {p:.72, top:'#05081a',mid:'#0d1736',bot:'#1d2c55',sun:'#cfe0ff',fog:'#131c3a',hS:'#2c3f66',hG:'#14161f',dir:'#93b4ff',di:.32, night:1,  sea:'#0b2740',cloud:'#232c47'},
      {p:.88, top:'#2c3a70',mid:'#b06070',bot:'#ffc98a',sun:'#ffd9a6',fog:'#c98a70',hS:'#e8a580',hG:'#40383c',dir:'#ffcf9e',di:.85, night:.12,sea:'#2a6f8e',cloud:'#f0c0a0'},
      {p:1,   top:'#2f3a6e',mid:'#cf6a52',bot:'#ffbf70',sun:'#ffdf9e',fog:'#dd9067',hS:'#ffb37e',hG:'#4a4038',dir:'#ffd7a3',di:1.15,night:0,  sea:'#2e7d9c',cloud:'#ffd9b8'}
    ];
    const clamp = (v,a,b) => v<a?a:v>b?b:v;
    const lerp = (a,b,t) => a + (b-a)*t;
    KF.forEach(k => {
      for(const f of ['top','mid','bot','sun','fog','hS','hG','dir','sea','cloud'])
        k[f] = new THREE.Color(k[f]);
    });
    const _c = new THREE.Color();
    const sunV = new THREE.Vector3();
    const moonV = new THREE.Vector3(0.45, 0.6, -0.65);
    const lightV = new THREE.Vector3();

    let i = 0;
    while(i < KF.length-2 && ph > KF[i+1].p) i++;
    const a = KF[i], b = KF[i+1];
    const f = clamp((ph - a.p) / (b.p - a.p), 0, 1);
    this.skyUni.uTop.value.copy(a.top).lerp(b.top, f);
    this.skyUni.uMid.value.copy(a.mid).lerp(b.mid, f);
    this.skyUni.uBot.value.copy(a.bot).lerp(b.bot, f);
    this.skyUni.uSunCol.value.copy(a.sun).lerp(b.sun, f);
    _c.copy(a.fog).lerp(b.fog, f);
    this.scene.fog.color.copy(_c);
    this.hemi.color.copy(a.hS).lerp(b.hS, f);
    this.hemi.groundColor.copy(a.hG).lerp(b.hG, f);
    this.dir.color.copy(a.dir).lerp(b.dir, f);
    this.dir.intensity = lerp(a.di, b.di, f);
    this.nightF = lerp(a.night, b.night, f);
    this.seaMat.color.copy(a.sea).lerp(b.sea, f);
    this.cloudMat.color.copy(a.cloud).lerp(b.cloud, f);
    let sunY;
    if(ph < 0.30) sunY = 0.38 - ph/0.30 * 0.55;
    else if(ph < 0.84) sunY = -0.2;
    else sunY = -0.15 + (ph-0.84)/0.16 * 0.55;
    sunV.set(-0.5, sunY, -0.85).normalize();
    this.skyUni.uSunDir.value.copy(sunV);
    this.skyUni.uNight.value = this.nightF;
    this.sunDisc.visible = sunY > -0.05;
    if(this.sunDisc.visible) {
      this.sunDisc.position.copy(sunV).multiplyScalar(560);
      this.sunDisc.lookAt(0,4,10);
      this.sunDisc.material.color.copy(this.skyUni.uSunCol.value);
      this.sunDisc.material.opacity = clamp((sunY+0.05)/0.15, 0, 1);
      this.sunGlow.position.copy(this.sunDisc.position);
      this.sunGlow.material.color.copy(this.skyUni.uSunCol.value);
      this.sunGlow.material.opacity = 0.9 * this.sunDisc.material.opacity;
    } else {
      this.sunGlow.material.opacity = 0;
    }
    this.moonDisc.visible = this.nightF > 0.25;
    if(this.moonDisc.visible) {
      this.moonDisc.position.copy(moonV).multiplyScalar(560);
      this.moonDisc.lookAt(0,4,10);
      this.moonDisc.material.opacity = this.nightF;
    }
    lightV.copy(sunV).lerp(moonV, this.nightF).normalize();
    lightV.y = Math.max(lightV.y, 0.24);
    lightV.normalize();
    this.dir.position.copy(lightV).multiplyScalar(80);
    this.materials.head.emissiveIntensity = 0.25 + this.nightF * 1.8;
    this.materials.lampHead.emissiveIntensity = 0.3 + this.nightF * 1.9;
    this.materials.blinkRed.emissiveIntensity = this.nightF * (Math.sin(S.t*4) > 0 ? 2.2 : 0.15);
  }
};