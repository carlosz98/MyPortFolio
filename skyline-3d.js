/* ═══════════════════════════════════════════════════════
   QUEENS SKYLINE IN 3D (three.js) — upgrades the footer scene
   Soft clay city: Queens blocks, the Unisphere, the elevated 7 train
   and Manhattan behind. Day ↔ night follows the sun & moon switch.
   Falls back to the flat SVG skyline if WebGL or three.js is missing.
   ═══════════════════════════════════════════════════════ */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const footer = document.querySelector('.sk-footer');
const sceneEl = footer && footer.querySelector('.sk-scene');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
  catch (e) { return false; }
}

if (sceneEl && webglOK()) init();

function init() {
  const canvas = document.createElement('canvas');
  canvas.className = 'sk-3d';
  sceneEl.prepend(canvas);
  sceneEl.classList.add('is-3d');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 900);

  /* ── colors from the page ── */
  const css = () => getComputedStyle(document.body);
  const bgColor = () => new THREE.Color(css().getPropertyValue('--bg').trim() || '#ECE7DE');
  scene.fog = new THREE.Fog(bgColor(), 140, 420);

  /* ── seeded random so the city is the same every visit ── */
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  /* ── materials: one soft "clay" for everything, tinted by the light ── */
  const clay = new THREE.MeshStandardMaterial({ color: bgColor(), roughness: 0.92, metalness: 0 });
  const clayFar = new THREE.MeshStandardMaterial({ color: bgColor(), roughness: 1, metalness: 0 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x9a948a, roughness: 0.5, metalness: 0.6 });
  const trainMat = new THREE.MeshStandardMaterial({ color: 0xb9b4ac, roughness: 0.4, metalness: 0.5 });
  const purple = new THREE.MeshStandardMaterial({ color: 0xb933ad, emissive: 0x5a1555, emissiveIntensity: 0.4 });
  const winMat = new THREE.MeshBasicMaterial({ color: 0x8c8172, transparent: true, opacity: 0.35 });
  const trainWinMat = new THREE.MeshBasicMaterial({ color: 0xede7dc, fog: false });

  /* ── ground ── */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1600, 600), clay);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const city = new THREE.Group();
  scene.add(city);
  const windows = [];   // [x, y, z, facing]
  const towers = [];    // Manhattan blocks, for the red roof lights

  function building(x, z, w, d, h, mat, far) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, h / 2, z);
    m.castShadow = !far; m.receiveShadow = true;
    city.add(m);
    // windows on the front face
    const cols = Math.max(1, Math.floor((w - 2) / 2.6)), rows = Math.max(1, Math.floor((h - 3) / 3.2));
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (rnd() < (far ? 0.7 : 0.55))
          windows.push([x - w / 2 + 1.5 + c * ((w - 3) / Math.max(1, cols - 1 || 1)), 2.5 + r * 3.2, z + d / 2 + 0.05, far]);
    return m;
  }

  /* Manhattan, far back */
  for (let x = -40; x < 260; ) {
    const w = 7 + rnd() * 9, h = 34 + rnd() * 70;
    if (x > 104 && x < 136) { x = 136; continue; }
    const b = building(x, -150 - rnd() * 30, w, 8 + rnd() * 6, h, clayFar, true);
    towers.push([b, h]);
    x += w + 1.5 + rnd() * 3;
  }
  // Empire State
  const es = new THREE.Group(); es.position.set(120, 0, -132);
  [[16, 78, 12], [12, 20, 10], [8, 12, 7], [5, 10, 5]].reduce((y, [w, h, d]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), clayFar); m.position.y = y + h / 2; es.add(m); return y + h;
  }, 0);
  const esTop = new THREE.MeshStandardMaterial({ color: bgColor(), roughness: 1, emissive: 0x000000 });
  es.children.slice(1).forEach(m => { m.material = esTop; });
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 1.2, 22, 8), esTop); spire.position.y = 131; es.add(spire);
  for (let r = 0; r < 20; r++) for (let c = 0; c < 5; c++) if (rnd() < 0.8) windows.push([120 - 6 + c * 3, 3 + r * 3.6, -132 + 6.05, true]);
  for (let r = 0; r < 22; r++) for (let c = 0; c < 3; c++) if (rnd() < 0.8) windows.push([185 - 3 + c * 3, 3 + r * 3.3, -155 + 5.05, true]);
  city.add(es);
  // Chrysler
  const ch = new THREE.Group(); ch.position.set(185, 0, -155);
  const chBody = new THREE.Mesh(new THREE.BoxGeometry(11, 78, 10), clayFar); chBody.position.y = 39; ch.add(chBody);
  const chCrown = new THREE.Mesh(new THREE.ConeGeometry(5.5, 24, 8), clayFar); chCrown.position.y = 90; ch.add(chCrown);
  city.add(ch);

  /* Queens, up front */
  for (let x = -220; x < 260; ) {
    if (x > -95 && x < -35) { x = -35; continue; }   // room for the Unisphere
    const w = 10 + rnd() * 14, h = 7 + rnd() * 16;
    building(x, -30 - rnd() * 40, w, 9 + rnd() * 8, h, clay, false);
    x += w + 2 + rnd() * 4;
  }

  /* Unisphere */
  const uni = new THREE.Group(); uni.position.set(-65, 0, -38);
  const globeR = 15;
  const globe = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.SphereGeometry(globeR, 16, 10)),
    new THREE.LineBasicMaterial({ color: 0x8a8378, transparent: true, opacity: 0.85 }));
  globe.position.y = 30; uni.add(globe);
  [-0.35, 0.1, 0.55].forEach((tilt, i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(globeR + 3 + i * 1.5, 0.25, 6, 64), steel);
    ring.position.y = 30; ring.rotation.set(Math.PI / 2 + tilt, 0, tilt * 0.6); uni.add(ring);
  });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 3, 16, 10), clay); stem.position.y = 8; stem.castShadow = true; uni.add(stem);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(22, 23, 1.2, 40), clay); base.position.y = 0.6; base.receiveShadow = true; uni.add(base);
  city.add(uni);

  /* elevated 7 line */
  const TRACK_Y = 13, TRACK_Z = -8;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(700, 1.4, 5), clay);
  deck.position.set(0, TRACK_Y, TRACK_Z); deck.castShadow = true; deck.receiveShadow = true; scene.add(deck);
  for (let x = -330; x <= 330; x += 26) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.2, TRACK_Y, 1.2), clay);
    p.position.set(x, TRACK_Y / 2, TRACK_Z); p.castShadow = true; scene.add(p);
  }
  const train = new THREE.Group();
  for (let c = 0; c < 5; c++) {
    const car = new THREE.Mesh(new THREE.BoxGeometry(15, 4, 4), trainMat);
    car.position.set(c * 16, 0, 0); car.castShadow = true; train.add(car);
    for (let k = 0; k < 4; k++) {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), trainWinMat);
      w.position.set(c * 16 - 5.2 + k * 3.5, 0.5, 2.02); train.add(w);
    }
  }
  const badge = new THREE.Mesh(new THREE.CircleGeometry(1.4, 24), purple);
  badge.position.set(-7.6, 0.4, 2.05); train.add(badge);
  train.position.set(-140, TRACK_Y + 2.8, TRACK_Z);
  scene.add(train);


  /* people strolling along the sidewalk under the 7 — simple silhouettes with soft shadows */
  const personMat = new THREE.MeshStandardMaterial({ color: 0x6f675c, roughness: 1 });
  const bodyGeo = new THREE.CapsuleGeometry(0.62, 1.7, 3, 8), headGeo = new THREE.SphereGeometry(0.5, 10, 8), legGeo = new THREE.CapsuleGeometry(0.22, 1.1, 2, 6);
  legGeo.translate(0, -0.75, 0);
  const people = [];
  for (let i = 0; i < 16; i++) {
    const p = new THREE.Group(), dir = rnd() < 0.5 ? 1 : -1, k = 0.85 + rnd() * 0.3;
    const body = new THREE.Mesh(bodyGeo, personMat); body.position.y = 2.75;
    const headM = new THREE.Mesh(headGeo, personMat); headM.position.y = 4.25;
    const l1 = new THREE.Mesh(legGeo, personMat), l2 = new THREE.Mesh(legGeo, personMat);
    l1.position.set(0, 1.6, 0.25); l2.position.set(0, 1.6, -0.25);
    [body, headM, l1, l2].forEach(m => { m.castShadow = true; p.add(m); });
    p.scale.setScalar(k);
    p.position.set(-300 + rnd() * 600, 0, 14 + rnd() * 14);
    let phoneG = null;
    if (rnd() < 0.4) { phoneG = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 4), new THREE.MeshBasicMaterial({ color: 0x9fd4ff, transparent: true, opacity: 0 })); phoneG.position.set(dir * 0.7, 3.4, 0.4); p.add(phoneG); }
    p.userData = { dir, v: 4 + rnd() * 3.5, ph: rnd() * 6.28, l1, l2, body, phoneG };
    scene.add(p); people.push(p);
  }


  /* windows as one instanced mesh */
  const winGeo = new THREE.PlaneGeometry(1.1, 1.6);
  const winMesh = new THREE.InstancedMesh(winGeo, winMat, windows.length);
  const lit = [];
  const tmp = new THREE.Object3D();
  windows.forEach(([x, y, z, far], i) => { tmp.position.set(x, y, z); tmp.scale.setScalar(far ? 1.25 : 1); tmp.updateMatrix(); winMesh.setMatrixAt(i, tmp.matrix); lit.push(rnd() < (far ? 0.62 : 0.5)); });
  tmp.scale.setScalar(1);
  scene.add(winMesh);
  const litGeo = winGeo;
  const litMat = new THREE.MeshBasicMaterial({ color: 0xf2c46b, transparent: true, opacity: 0, fog: false });
  const litIdx = windows.map((w, i) => i).filter(i => lit[i]);
  const litMesh = new THREE.InstancedMesh(litGeo, litMat, litIdx.length);
  litIdx.forEach((wi, i) => { const [x, y, z, far] = windows[wi]; tmp.position.set(x, y, z + 0.02); tmp.scale.setScalar(far ? 1.25 : 1); tmp.updateMatrix(); litMesh.setMatrixAt(i, tmp.matrix); });
  tmp.scale.setScalar(1);
  scene.add(litMesh);

  /* stars */
  const starGeo = new THREE.BufferGeometry();
  const sp = [];
  for (let i = 0; i < 500; i++) sp.push((rnd() - 0.5) * 900, 60 + rnd() * 220, -260 - rnd() * 60);
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xf3eee4, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0 });
  scene.add(new THREE.Points(starGeo, starMat));

  /* sun & moon */
  const sun = new THREE.Mesh(new THREE.SphereGeometry(11, 32, 16), new THREE.MeshBasicMaterial({ color: 0xffc46b }));
  const sunGlow = new THREE.Mesh(new THREE.SphereGeometry(22, 32, 16), new THREE.MeshBasicMaterial({ color: 0xffb35a, transparent: true, opacity: 0.18 }));
  sun.add(sunGlow);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(9, 32, 16), new THREE.MeshStandardMaterial({ color: 0xf4efe4, emissive: 0xcfc6b4, emissiveIntensity: 0.6, roughness: 1 }));
  scene.add(sun, moon);


  /* ═══════════ ALIVE: glow, sky life, fireworks ═══════════ */
  function glowTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.65)');
    gr.addColorStop(0.6, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const glowTex = glowTexture();
  const glow = (color, size, add = true) => {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, depthWrite: false,
      blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, opacity: 0, fog: false }));
    m.scale.setScalar(size); return m;
  };

  /* street lamps along the sidewalk: the walkers pass through their light at night */
  const lampGlows = [];
  for (let x = -300; x <= 300; x += 52) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 9, 6), steel); pole.position.set(x, 4.5, 30); pole.castShadow = true; scene.add(pole);
    const bulb = glow(0xffd48a, 7); bulb.position.set(x, 9.2, 30); scene.add(bulb);
    const puddle = glow(0xf2b45a, 1); puddle.position.set(x, 0.3, 26); puddle.scale.set(26, 7, 1); scene.add(puddle);
    lampGlows.push(bulb, puddle);
  }

  /* soft halo around the sun */
  const sunHalo = glow(0xffc27a, 150, false); sun.add(sunHalo);

  /* red roof lights on the tallest Manhattan towers + a color-cycling Empire State crown */
  const blinkers = towers.sort((a, b) => b[1] - a[1]).slice(0, 7).map(([b, h], i) => {
    const g = glow(0xff4a3a, 7); g.position.set(b.position.x, h + 1.5, b.position.z + 2); scene.add(g); return g;
  });
  const esCrown = glow(0xffffff, 30); esCrown.position.set(120, 118, -124); scene.add(esCrown);
  const esColor = new THREE.Color();

  /* lights ringing the Unisphere fountains at night */
  const fountain = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2, g = glow(0x9fd4ff, 5);
    g.position.set(-65 + Math.cos(a) * 22, 1.6, -38 + Math.sin(a) * 22); scene.add(g); fountain.push(g);
  }

  /* train: headlight, tail lights and a pool of light under it */
  const head = glow(0xfff1c8, 12); head.position.set(72, 0, 2.3); train.add(head);
  const beam = glow(0xffe6a8, 34); beam.position.set(86, -1, 0); beam.scale.set(40, 10, 1); train.add(beam);
  const tail = glow(0xff3b30, 5); tail.position.set(-7.8, -0.6, 2.3); train.add(tail);
  const pool = glow(0xf2c46b, 90); pool.position.set(32, -3, 2); pool.scale.set(100, 12, 1); train.add(pool);

  /* fireflies over the park */
  const FF = 46, ffBase = [], ffPos = new Float32Array(FF * 3);
  for (let i = 0; i < FF; i++) ffBase.push([-115 + rnd() * 100, 3 + rnd() * 18, -70 + rnd() * 60, rnd() * 6.28]);
  const ffGeo = new THREE.BufferGeometry(); ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
  const ffMat = new THREE.PointsMaterial({ map: glowTex, color: 0xffe08a, size: 3.2, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending });
  scene.add(new THREE.Points(ffGeo, ffMat));

  /* clouds: low-poly puffs drifting by */
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true, transparent: true, opacity: 0.92 });
  const clouds = [];
  for (let i = 0; i < 7; i++) {
    const c = new THREE.Group(), n = 3 + Math.floor(rnd() * 4);
    for (let k = 0; k < n; k++) {
      const r = 4 + rnd() * 5, p = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), cloudMat);
      p.position.set(k * 6 - n * 3 + rnd() * 2, rnd() * 3, rnd() * 3); p.scale.y = 0.7; c.add(p);
    }
    c.position.set(-300 + rnd() * 600, 70 + rnd() * 30, -110 - rnd() * 80);
    c.userData.v = 2 + rnd() * 3; scene.add(c); clouds.push(c);
  }

  /* birds: a small flock flapping across in the day */
  const birdMat = new THREE.MeshBasicMaterial({ color: 0x5a5248, side: THREE.DoubleSide, transparent: true, opacity: 0 });
  const wingGeo = new THREE.PlaneGeometry(3.2, 0.42); wingGeo.translate(1.6, 0, 0);
  const flock = new THREE.Group(); const birds = [];
  for (let i = 0; i < 8; i++) {
    const b = new THREE.Group(), L = new THREE.Mesh(wingGeo, birdMat), R = new THREE.Mesh(wingGeo, birdMat);
    L.rotation.y = Math.PI; b.add(L, R);
    b.position.set(-i * 5 - rnd() * 4, Math.abs(i - 3) * 2.2 + rnd() * 2, rnd() * 8);
    b.userData = { L, R, ph: rnd() * 6.28 }; flock.add(b); birds.push(b);
  }
  flock.position.set(-170, 70, -95); flock.scale.setScalar(1.1); scene.add(flock);

  /* a plane climbing out of LaGuardia, with nav lights */
  const planeMat = new THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: 0.6 });
  const plane = new THREE.Group();
  plane.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.8, 9, 4, 8).rotateZ(Math.PI / 2), planeMat));
  const wingP = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.25, 11), planeMat); plane.add(wingP);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.6, 0.25), planeMat); fin.position.set(-4.3, 1.3, 0); plane.add(fin);
  const navR = glow(0xff3b30, 4); navR.position.set(0, 0, -5.6);
  const navG = glow(0x3bff7a, 4); navG.position.set(0, 0, 5.6);
  const strobe = glow(0xffffff, 7); strobe.position.set(-4.5, 2.6, 0);
  plane.add(navR, navG, strobe);
  plane.rotation.z = 0.12; plane.scale.setScalar(1.3);
  let planeWait = 1; plane.visible = false; scene.add(plane);

  /* shooting stars */
  const streakTex = (() => {
    const c = document.createElement('canvas'); c.width = 128; c.height = 8;
    const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 128, 0);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,1)');
    g.fillStyle = gr; g.fillRect(0, 2, 128, 4); return new THREE.CanvasTexture(c);
  })();
  const streak = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: streakTex, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, fog: false }));
  streak.scale.set(46, 0.9, 1); scene.add(streak);
  let streakLife = 0, streakWait = 2; const streakV = new THREE.Vector3();

  /* particles: fireworks (click the sky) and train sparks share one pool */
  const MAXP = 1600, pPos = new Float32Array(MAXP * 3).fill(-9999), pCol = new Float32Array(MAXP * 3);
  const pVel = new Float32Array(MAXP * 3), pLife = new Float32Array(MAXP), pMax = new Float32Array(MAXP), pBase = new Float32Array(MAXP * 3);
  const pKind = new Uint8Array(MAXP); // 0 spark, 1 rocket
  let pNext = 0;
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  const pMat = new THREE.PointsMaterial({ map: glowTex, size: 9, vertexColors: true, transparent: true, depthWrite: false });
  const pts = new THREE.Points(pGeo, pMat); pts.frustumCulled = false; scene.add(pts);
  const PALETTE = [0xf2c46b, 0xe8643a, 0xb933ad, 0x7fd1ff, 0xffffff, 0x8be38b].map(c => new THREE.Color(c));
  function emit(x, y, z, vx, vy, vz, life, col, kind = 0) {
    const i = pNext; pNext = (pNext + 1) % MAXP;
    pPos.set([x, y, z], i * 3); pVel.set([vx, vy, vz], i * 3); pBase.set([col.r, col.g, col.b], i * 3);
    pLife[i] = pMax[i] = life; pKind[i] = kind;
  }
  function burst(x, y, z) {
    const a = PALETTE[Math.floor(Math.random() * PALETTE.length)], b = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const n = 160, sp = 30 + Math.random() * 14;
    for (let k = 0; k < n; k++) {
      const u = Math.random() * 2 - 1, th = Math.random() * 6.283, r = Math.sqrt(1 - u * u), s = sp * (0.75 + Math.random() * 0.25);
      emit(x, y, z, r * Math.cos(th) * s, u * s, r * Math.sin(th) * s * 0.5, 1.8 + Math.random() * 1.0, k % 3 ? a : b);
    flash.position.set(x, y, z); flashLife = 0.35; flash.material.color.copy(a);
    }
  }
  function launch(x, y, z) {
    const T = 0.9; emit(x, 4, z, 0, (y - 4) / T + 4.5 * T, 0, T, new THREE.Color(0xffe2b0), 1);
  }
  function sparks(x) {
    for (let k = 0; k < 14; k++)
      emit(x, TRACK_Y + 0.6, TRACK_Z + 2.4, (Math.random() - 0.3) * 12, 4 + Math.random() * 8, Math.random() * 6, 0.35 + Math.random() * 0.3,
        new THREE.Color(Math.random() < 0.5 ? 0x9fdcff : 0xfff2b0));
  }
  const tmpC = new THREE.Color();
  const flash = glow(0xffffff, 60); scene.add(flash); let flashLife = 0;
  function stepParticles(dt) {
    const bg = bgColor(), add = night > 0.5;
    pMat.blending = add ? THREE.AdditiveBlending : THREE.NormalBlending;
    for (let i = 0; i < MAXP; i++) {
      if (pLife[i] <= 0) continue;
      pLife[i] -= dt; const j = i * 3;
      if (pKind[i] === 1 && !add) pLife[i] = 0;  // fireworks are a night thing
      if (pLife[i] <= 0) {
        if (pKind[i] === 1 && add) burst(pPos[j], pPos[j + 1], pPos[j + 2]);
        pPos[j + 1] = -9999; continue;
      }
      const g = pKind[i] === 1 ? 9 : 14;
      pVel[j + 1] -= g * dt; const drag = pKind[i] === 1 ? 1 : 1 - dt * 1.3;
      pVel[j] *= drag; pVel[j + 1] *= drag; pVel[j + 2] *= drag;
      pPos[j] += pVel[j] * dt; pPos[j + 1] += pVel[j + 1] * dt; pPos[j + 2] += pVel[j + 2] * dt;
      const f = Math.min(1, (pLife[i] / pMax[i]) * 1.6);
      const twinkle = pKind[i] === 1 ? 1 : (0.75 + Math.random() * 0.25);
      tmpC.setRGB(pBase[j], pBase[j + 1], pBase[j + 2]);
      if (add) tmpC.multiplyScalar(f * twinkle * 1.4); else tmpC.lerp(bg, (1 - f) * 0.8);
      pCol[j] = tmpC.r; pCol[j + 1] = tmpC.g; pCol[j + 2] = tmpC.b;
      if (pKind[i] === 1 && Math.random() < 0.8) // rocket trail
        emit(pPos[j] + (Math.random() - 0.5), pPos[j + 1] - 1, pPos[j + 2], (Math.random() - 0.5) * 2, -2, 0, 0.4, new THREE.Color(0xffc27a));
    }
    pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
  }

  /* clicking: the globe spins, the train throws sparks, the sky gets fireworks */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), hit = new THREE.Vector3();
  const skyPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 120);
  let spin = 0;
  canvas.addEventListener('click', e => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    hint && hint.classList.add('gone');
    if (ray.intersectObject(train, true).length) { for (let k = 0; k < 5; k++) sparks(train.position.x + k * 16); trainBoost = 3; }
    else if (ray.ray.intersectsSphere(new THREE.Sphere(new THREE.Vector3(-65, 30, -38), globeR + 4))) spin = 5;
    else if (night > 0.5 && ray.ray.intersectPlane(skyPlane, hit)) launch(hit.x, THREE.MathUtils.clamp(hit.y, 50, 120), -120);
    tick();
  });
  let trainBoost = 0;
  let fwWait = 2;
  const hint = reduce ? null : Object.assign(document.createElement('span'), {
    className: 'sk-3d-hint', textContent: matchMedia('(hover: none)').matches ? 'tap the sky ✦' : 'click the sky ✦' });
  hint && sceneEl.append(hint);

  /* windows that switch on and off through the night */
  const hidden = new THREE.Object3D(); hidden.scale.setScalar(0); hidden.updateMatrix();
  const winOff = new Set(); let winWait = 0;
  function flickerWindows() {
    const i = Math.floor(Math.random() * litIdx.length);
    const [x, y, z] = windows[litIdx[i]];
    if (winOff.has(i)) { winOff.delete(i); tmp.position.set(x, y, z + 0.02); tmp.scale.setScalar(windows[litIdx[i]][3] ? 1.25 : 1); tmp.updateMatrix(); litMesh.setMatrixAt(i, tmp.matrix); }
    else { winOff.add(i); litMesh.setMatrixAt(i, hidden.matrix); }
    litMesh.instanceMatrix.needsUpdate = true;
  }

  function animateAlive(dt, t) {
    const n = night, day = 1 - n;
    sunHalo.material.opacity = 0.35 * day;
    // roof lights pulse like aircraft beacons
    blinkers.forEach((g, i) => { g.material.opacity = n * (0.25 + 0.75 * Math.max(0, Math.sin(t * 2.2 + i * 1.7)) ** 6); });
    esColor.setHSL((t * 0.04) % 1, 0.9, 0.5); esCrown.material.color.copy(esColor); esCrown.material.opacity = n * 0.9;
    esTop.emissive.copy(esColor).multiplyScalar(n * 2.4);
    flashLife = Math.max(0, flashLife - dt); flash.material.opacity = (flashLife / 0.35) * (0.25 + n * 0.6);
    fountain.forEach((g, i) => { g.material.opacity = n * (0.45 + 0.25 * Math.sin(t * 1.5 + i)); });
    head.material.opacity = 0.25 + n * 0.75; beam.material.opacity = n * 0.35; tail.material.opacity = 0.3 + n * 0.7; pool.material.opacity = n * 0.4;

    // fireflies drift
    ffMat.opacity = n * 0.9;
    for (let i = 0; i < FF; i++) {
      const [x, y, z, p] = ffBase[i];
      ffPos[i * 3] = x + Math.sin(t * 0.5 + p) * 4; ffPos[i * 3 + 1] = y + Math.sin(t * 0.9 + p * 2) * 2; ffPos[i * 3 + 2] = z + Math.cos(t * 0.4 + p) * 3;
    }
    ffGeo.attributes.position.needsUpdate = true;

    // clouds drift and dim at night
    cloudMat.color.set(0xfff6ea).lerp(tmpC.set(0x4a4762), n * 0.85); cloudMat.opacity = 0.92 - n * 0.35;
    clouds.forEach(c => { c.position.x += c.userData.v * dt; if (c.position.x > 340) c.position.x = -340; });

    // birds by day
    birdMat.opacity = Math.max(0, day * 1.2 - 0.2) * 0.85;
    flock.position.x += dt * 16; flock.position.y = 70 + Math.sin(t * 0.4) * 4;
    if (flock.position.x > 300) { flock.position.x = -300; flock.position.y = 60 + Math.random() * 25; }
    birds.forEach(b => { const f = Math.sin(t * 9 + b.userData.ph) * 0.6; b.userData.L.rotation.z = -f - 0.15; b.userData.R.rotation.z = f + 0.15; });

    // plane climbs out every so often
    if (!plane.visible) { planeWait -= dt; if (planeWait < 0) { plane.visible = true; plane.position.set(-230, 30, -80); } }
    else {
      plane.position.x += dt * 30; plane.position.y += dt * 4.2;
      if (plane.position.x > 330) { plane.visible = false; planeWait = 14 + Math.random() * 14; }
    }
    navR.material.opacity = navG.material.opacity = 0.35 + n * 0.65;
    strobe.material.opacity = (t % 1.3 < 0.08 ? 1 : 0) * (0.4 + n * 0.6);

    // night extras: shooting stars, fireworks now and then, flickering windows, train sparks
    if (n > 0.6) {
      streakWait -= dt;
      if (streakWait < 0 && streakLife <= 0) {
        streakLife = 0.9; streakWait = 3 + Math.random() * 6;
        streak.position.set(-150 + Math.random() * 300, 160 + Math.random() * 60, -260);
        const ang = -0.35 - Math.random() * 0.35, dir = Math.random() < 0.5 ? 1 : -1;
        streakV.set(Math.cos(ang) * 260 * dir, Math.sin(ang) * 260, 0);
        streak.rotation.z = Math.atan2(streakV.y, streakV.x);
      }
      fwWait -= dt; if (fwWait < 0) { fwWait = 6 + Math.random() * 7; launch(-120 + Math.random() * 360, 70 + Math.random() * 40, -130); }
      winWait -= dt; if (winWait < 0) { winWait = 0.25 + Math.random() * 0.5; flickerWindows(); }
      if (Math.random() < dt * 0.7) sparks(train.position.x + Math.floor(Math.random() * 5) * 16);
    }
    if (streakLife > 0) {
      streakLife -= dt; streak.position.addScaledVector(streakV, dt);
      streak.material.opacity = Math.sin(Math.max(0, streakLife) / 0.9 * Math.PI) * n;
    } else streak.material.opacity = 0;

    // globe spin boost, train boost
    spin = Math.max(0, spin - dt * 1.6); globe.rotation.y += dt * spin;
    uni.children.forEach((c, i) => { if (c.geometry && c.geometry.type === 'TorusGeometry') c.rotation.z += dt * (0.05 + spin * 0.2) * (i % 2 ? 1 : -1); });
    trainBoost = Math.max(0, trainBoost - dt);
    // walkers: a little bob and leg swing
    people.forEach(p => {
      const u = p.userData; p.position.x += u.dir * u.v * dt;
      if (p.position.x > 320) p.position.x = -320; if (p.position.x < -320) p.position.x = 320;
      const sw = Math.sin(t * u.v * 1.6 + u.ph);
      if (u.phoneG) u.phoneG.material.opacity = n;
      u.l1.rotation.z = sw * 0.5; u.l2.rotation.z = -sw * 0.5; u.body.position.y = 2.75 + Math.abs(sw) * 0.12;
    });
    lampGlows.forEach((g, i) => { g.material.opacity = n * (i % 2 ? 0.45 : 0.95); });
    personMat.color.set(0x6f675c).lerp(tmpC.set(0x8a7f70), n); personMat.emissive.setRGB(0.32, 0.24, 0.14).multiplyScalar(n * 0.55);
    if (hint) hint.style.opacity = hint.classList.contains('gone') ? 0 : n * 0.75;
    stepParticles(dt);
  }

  /* lights */
  const hemi = new THREE.HemisphereLight(0xfff4e0, 0xb8a990, 1.1);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffe2b8, 2.2);
  key.position.set(-160, 120, 140);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 1024);
  Object.assign(key.shadow.camera, { left: -280, right: 280, top: 120, bottom: -60, near: 10, far: 600 });
  key.shadow.bias = -0.0008; key.shadow.radius = 4;
  scene.add(key);
  const nightGlow = new THREE.PointLight(0xf2b45a, 0, 260, 1.6);
  nightGlow.position.set(0, 30, 20);
  scene.add(nightGlow);

  /* ── day ↔ night ── */
  let night = document.body.classList.contains('dark') ? 1 : 0;
  let target = night;
  new MutationObserver(() => { target = document.body.classList.contains('dark') ? 1 : 0; })
    .observe(document.body, { attributes: true, attributeFilter: ['class'] });

  const dayKey = new THREE.Color(0xffe2b8), nightKey = new THREE.Color(0x8fa0d8);
  const daySky = new THREE.Color(0xfff4e0), nightSky = new THREE.Color(0x5b5f8a);
  function applyTheme(t) {
    const bg = bgColor();
    clay.color.copy(bg); clayFar.color.copy(bg).lerp(new THREE.Color(0x2b2933), t * 0.55); esTop.color.copy(clayFar.color);
    scene.fog.color.copy(bg);
    key.color.copy(dayKey).lerp(nightKey, t);
    key.intensity = THREE.MathUtils.lerp(2.8, 0.7, t);
    hemi.color.copy(daySky).lerp(nightSky, t);
    hemi.intensity = THREE.MathUtils.lerp(0.9, 0.3, t);
    sceneEl.style.setProperty('--sk3d-night', t.toFixed(3));
    nightGlow.intensity = t * 900;
    litMat.opacity = t * 0.95;
    winMat.opacity = THREE.MathUtils.lerp(0.35, 0.12, t);
    starMat.opacity = t * 0.9;
    trainWinMat.color.set(t > 0.5 ? 0xf2c46b : 0xede7dc);
    // sun sets behind Manhattan, moon rises on the other side
    const a = t * Math.PI;
    sun.position.set(-150 + Math.sin(a) * 40, 70 - t * 120, -250);
    moon.position.set(120 - (1 - t) * 30, -40 + t * 110, -250);
    sun.visible = t < 0.98; moon.visible = t > 0.02;
  }

  /* ── size, camera, parallax ── */
  function resize() {
    const r = sceneEl.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / Math.max(1, r.height);
    const phone = r.width < 700;
    camera.fov = phone ? 42 : 26;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(sceneEl);

  let mx = 0, my = 0, cx = 0, cy = 0;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });

  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) tick(); }, { rootMargin: '100px' }).observe(sceneEl);

  const clock = new THREE.Clock();
  let raf = 0;
  function frame() {
    raf = 0;
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    night += (target - night) * Math.min(1, dt * 2.2);
    applyTheme(night);

    // scroll: the city rises into view as you reach the bottom
    const r = sceneEl.getBoundingClientRect();
    const reveal = THREE.MathUtils.clamp(1 - (r.top - innerHeight * 0.35) / (innerHeight * 0.65), 0, 1);
    cx += (mx - cx) * 0.05; cy += (my - cy) * 0.05;
    const phone = r.width < 700;
    camera.position.set((phone ? -45 : 10) + cx * 26, 46 + (1 - reveal) * 22 - cy * 8, phone ? 170 : 225);
    camera.lookAt(phone ? -45 : 10, 22 + (1 - reveal) * 10, -70);

    if (!reduce) {
      animateAlive(dt, t);
      train.position.x += dt * (34 + trainBoost * 30);
      if (train.position.x > 380) train.position.x = -460;
      globe.rotation.y += dt * 0.15;
      sunGlow.scale.setScalar(1 + Math.sin(t * 0.8) * 0.05);
      litMat.opacity = night * (0.85 + Math.sin(t * 3.1) * 0.05);
    }
    renderer.render(scene, camera);
    if (visible && !reduce) raf = requestAnimationFrame(frame);
  }
  function tick() { if (!raf) raf = requestAnimationFrame(frame); }
  tick();
  // reduced motion: still redraw when the theme flips
  if (reduce) new MutationObserver(() => { night = target; frame(); })
    .observe(document.body, { attributes: true, attributeFilter: ['class'] });
}
