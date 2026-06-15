/* ============================================================
   ФОКУС ИИ — 3D «Экспедиция» (Three.js)
   Режим HUB: карта Казахстана-селектор (север сверху).
   Режим CITY: стилизованный low-poly город + дуга тем модуля.
   Мост из app.js: window.FOKUS = {SITE, STAGES, DONE, status, openOverlay}.
   ============================================================ */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* палитра */
const GOLD = 0xF5C518, BRONZE = 0x7A5C1E, CREAM = 0xF4ECD8;

/* трансформ карты (SVG 0..1000 × 0..567.8) → мир. Север (малый y) → дальше (−Z). */
const S = 0.085, DEPTH = 4.5, cx = 500, cy = 283.9;
const wx = x => (x - cx) * S;
const wz = y => (y - cy) * S;

let scene, camera, renderer, labelRenderer, controls, raycaster, clock, container;
let hubGroup, hubDyn, cityGroup = null, cityCore = null, particles, countryMat = null;
let beaconHits = [], beacons = [], traveler;
let hubLabelEls = [], cityLabelEls = [];
let pointer = new THREE.Vector2(), hovered = null, idleTimer = 0, tween = null;
let mode = 'hub';

/* виды камеры */
const HUB_CAM = new THREE.Vector3(4, 50, 84), HUB_TAR = new THREE.Vector3(0, 0, 4);
const CITY_CAM = new THREE.Vector3(2, 27, 47), CITY_TAR = new THREE.Vector3(2, 2, 0);

window.initScene = function () {
  if (window.__sceneInited || !window.FOKUS) return;
  window.__sceneInited = true;
  boot();
};
if (window.__fokusReady) window.initScene();

function boot() {
  container = document.getElementById('scene3d');
  if (!container) return;
  const W = container.clientWidth, H = container.clientHeight || 500;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0c0b08, 0.0075);

  camera = new THREE.PerspectiveCamera(46, W / H, 0.1, 800);
  camera.position.copy(HUB_CAM);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  container.appendChild(renderer.domElement);

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(W, H);
  labelRenderer.domElement.className = 'c2d-layer';
  container.appendChild(labelRenderer.domElement);

  /* свет */
  scene.add(new THREE.HemisphereLight(0x6b5f3a, 0x06050a, 0.9));
  scene.add(new THREE.AmbientLight(0xfff3d4, 0.35));
  const key = new THREE.DirectionalLight(0xffeec0, 1.5);
  key.position.set(-24, 48, 36);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffd66a, 0.6);
  fill.position.set(30, 24, -28);
  scene.add(fill);
  const top = new THREE.DirectionalLight(0xfff6e0, 0.5);
  top.position.set(0, 60, 0);
  scene.add(top);

  hubGroup = new THREE.Group();
  scene.add(hubGroup);
  buildCountry();
  hubDyn = new THREE.Group();
  hubGroup.add(hubDyn);
  buildRoute();
  buildBeacons();
  buildTraveler();
  buildParticles();

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(HUB_TAR);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 24;
  controls.maxDistance = 130;
  controls.minPolarAngle = 0.25;
  controls.maxPolarAngle = 1.25;
  controls.autoRotate = false;   // карта стоит фиксированно — двигается только мышкой
  controls.autoRotateSpeed = 0.32;

  raycaster = new THREE.Raycaster();
  clock = new THREE.Clock();

  setupPointer();
  setupHud();
  addEventListener('resize', onResize);
  animate();
  applySceneTheme();
}

/* фон/материал 3D-сцены под тему (светлая/тёмная) */
function applySceneTheme() {
  const light = document.body.classList.contains('theme-light');
  if (scene && scene.fog) scene.fog.color.setHex(light ? 0xe6ddc7 : 0x0c0b08);
  if (countryMat) {
    countryMat.color.setHex(light ? 0x9a8d72 : 0xc7c3b6);
    countryMat.emissive.setHex(light ? 0x2a2418 : 0x2a2620);
  }
}
window.setSceneTheme = applySceneTheme;

/* перестроить маршрут/маяки/путника под текущий прогресс (после прохождения города) */
function refreshHubScene() {
  if (!hubDyn) return;
  hubLabelEls.forEach(e => e.remove()); hubLabelEls = [];
  while (hubDyn.children.length) hubDyn.remove(hubDyn.children[0]);
  beaconHits = []; beacons = []; traveler = null; routeFlow = null;
  buildRoute(); buildBeacons(); buildTraveler();
  applySceneTheme();
}
window.refreshHubScene = refreshHubScene;

/* подсказка-тост на карте (при клике по запертому городу) */
function showHubToast(text) {
  const el = document.getElementById('hubToast');
  if (!el) return;
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(showHubToast._t);
  showHubToast._t = setTimeout(() => el.classList.remove('show'), 3200);
}

/* ============================================================
   HUB — карта Казахстана
   ============================================================ */
function buildCountry() {
  const d = document.getElementById('kzPath').getAttribute('d');
  const nums = d.match(/-?\d+\.?\d*/g).map(Number);

  const shape = new THREE.Shape();
  for (let i = 0; i < nums.length; i += 2) {
    const px = wx(nums[i]), py = -wz(nums[i + 1]);   // флип, чтобы после rotateX совпасть с wz
    i === 0 ? shape.moveTo(px, py) : shape.lineTo(px, py);
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: DEPTH, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.6, bevelSegments: 2, steps: 1
  });
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color: 0xc7c3b6, roughness: 0.85, metalness: 0.08,
    emissive: 0x2a2620, emissiveIntensity: 0.32, flatShading: true
  });
  countryMat = mat;
  hubGroup.add(new THREE.Mesh(geo, mat));

  /* золотой контур по верхней грани */
  const pts = [];
  for (let i = 0; i < nums.length; i += 2) pts.push(new THREE.Vector3(wx(nums[i]), DEPTH + 0.03, wz(nums[i + 1])));
  hubGroup.add(new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.45 })
  ));

  /* тень-плато */
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(70, 48),
    new THREE.MeshBasicMaterial({ color: 0x16110a, transparent: true, opacity: 0.55 })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -0.5;
  hubGroup.add(glow);
}

let routeFlow = null, routeFlowCount = 0;
function buildRoute() {
  const pts = window.FOKUS.STAGES.map(s => new THREE.Vector3(wx(s.x), DEPTH + 0.5, wz(s.y)));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.15);
  hubDyn.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 240, 0.22, 8, false),
    new THREE.MeshBasicMaterial({ color: BRONZE, transparent: true, opacity: 0.5 })));
  const done = Math.min(window.FOKUS.DONE, pts.length - 1);
  if (done > 0) {
    const dcurve = new THREE.CatmullRomCurve3(pts.slice(0, done + 1), false, 'catmullrom', 0.15);
    hubDyn.add(new THREE.Mesh(new THREE.TubeGeometry(dcurve, 160, 0.30, 8, false),
      new THREE.MeshBasicMaterial({ color: GOLD })));
  }
  /* анимированная «бегущая» линия от Актау до Алматы — показывает путь */
  const SEG = 360;
  const fgeo = new THREE.TubeGeometry(curve, SEG, 0.34, 8, false);
  routeFlowCount = fgeo.index.count;
  fgeo.setDrawRange(0, 0);
  routeFlow = new THREE.Mesh(fgeo, new THREE.MeshBasicMaterial({
    color: GOLD, transparent: true, opacity: 0.95
  }));
  hubDyn.add(routeFlow);
}

/* смещения подписей городов [dx, dyExtra, dz] — разводим соседей */
const LAB_OFF = [
  [0, 0, 0],      // 01 Актау
  [-1, 2.4, 0],   // 02 Атырау
  [0, 0, 0],      // 03 Актобе
  [0, 2.4, 0],    // 04 Костанай
  [-4.5, 0, 1],   // 05 Астана
  [2, 0.6, 2.5],  // 06 Караганда (низко, к югу)
  [0.5, 4.6, -1], // 07 Павлодар (высоко)
  [4.5, 1.6, 0],  // 08 Семей
  [0, 0, 1],      // 09 Шымкент
  [2, 2.2, 0]     // 10 Алматы
];

function buildBeacons() {
  window.FOKUS.STAGES.forEach((s, i) => {
    const st = window.FOKUS.status(i);
    const isLock = st === 'lock';
    const col = isLock ? BRONZE : GOLD;
    const emi = isLock ? 0.25 : 1.0;
    const g = new THREE.Group();
    g.position.set(wx(s.x), DEPTH, wz(s.y));

    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.12, 10, 36),
      new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: emi * 0.6, roughness: 0.4, metalness: 0.6 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.06; g.add(ring);

    const orbY = isLock ? 1.4 : 2.0;
    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(isLock ? 0.7 : 0.95, 0),
      new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: emi, roughness: 0.25, metalness: 0.4, flatShading: true, transparent: isLock, opacity: isLock ? 0.55 : 1 }));
    orb.position.y = orbY; g.add(orb);

    const pillarH = isLock ? 5 : (st === 'cur' ? 14 : 9);
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.55, pillarH, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: isLock ? 0.10 : 0.22, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    pillar.position.y = pillarH / 2; g.add(pillar);

    let pulseRing = null;
    if (st === 'cur') {
      pulseRing = new THREE.Mesh(new THREE.RingGeometry(1.7, 1.95, 40),
        new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }));
      pulseRing.rotation.x = -Math.PI / 2; pulseRing.position.y = 0.12; g.add(pulseRing);
    }

    const hit = new THREE.Mesh(new THREE.SphereGeometry(2.4, 8, 8), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = orbY; hit.userData.index = i; g.add(hit); beaconHits.push(hit);

    const el = document.createElement('div');
    el.className = 'c2d ' + st;
    const mark = st === 'done' ? '✓' : String(i + 1).padStart(2, '0');
    el.innerHTML = `<span class="c2d-n">${mark}</span><span class="c2d-city">${s.module.city}</span><span class="c2d-title">${s.module.title}</span>`;
    el.style.pointerEvents = 'auto';
    el.style.cursor = 'pointer';
    el.onclick = (ev) => { ev.stopPropagation(); if (mode === 'hub') enterCity(i); };
    const [ldx, ldy, ldz] = LAB_OFF[i] || [0, 0, 0];
    const label = new CSS2DObject(el);
    label.position.set(ldx, orbY + 2.2 + ldy, ldz);
    g.add(label); hubLabelEls.push(el);

    hubDyn.add(g);
    beacons.push({ orb, pulseRing, st, base: orbY, index: i });
  });
}

function buildTraveler() {
  const i = Math.min(window.FOKUS.DONE, window.FOKUS.STAGES.length - 1);
  const s = window.FOKUS.STAGES[i];
  const g = new THREE.Group();
  g.position.set(wx(s.x), DEPTH + 1.0, wz(s.y));
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 20),
    new THREE.MeshStandardMaterial({ color: CREAM, emissive: GOLD, emissiveIntensity: 1.4, roughness: 0.2 })));
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 16),
    new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })));
  g.add(new THREE.PointLight(0xffe6a0, 1.6, 22, 2));
  hubDyn.add(g); traveler = g;
}

function buildParticles() {
  const N = RM ? 120 : 420;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 150;
    pos[i * 3 + 1] = Math.random() * 42 + 2;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 100;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  particles = new THREE.Points(geo, new THREE.PointsMaterial({ color: GOLD, size: 0.28, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
  hubGroup.add(particles);
}

/* ============================================================
   CITY — стилизованный «золотой макет» города + дуга тем
   ============================================================ */
function rng(seed) { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

/* у каждого города — свой акцент-свечение и силуэт зданий */
const CITY_THEMES = [
  { accent: 0xF5C518, style: 'mixed'    }, // 01 База — золото
  { accent: 0xF0B24A, style: 'towers'   }, // 02 LLM — янтарь
  { accent: 0xCFA255, style: 'ziggurat' }, // 03 Промпты — бронза
  { accent: 0xE8896B, style: 'domes'    }, // 04 Изображения — розовое золото
  { accent: 0x5FB6CE, style: 'towers'   }, // 05 Видео — экранный циан
  { accent: 0xB089E0, style: 'spires'   }, // 06 Голос — фиолет
  { accent: 0x5FC9B2, style: 'domes'    }, // 07 Аватары — мятный
  { accent: 0xE8843C, style: 'ziggurat' }, // 08 Claude — оранж
  { accent: 0x86C25E, style: 'towers'   }, // 09 Агенты — зелёный
  { accent: 0xFFD75A, style: 'spires'   }  // 10 Hermes — лучистое золото
];
const NEUT = [0x6a6152, 0x7c7060, 0x564e42, 0x837767, 0x4c443a];

function buildCity(i) {
  const m = window.FOKUS.STAGES[i].module;
  const st = window.FOKUS.status(i);
  const R = rng(i + 7);
  const theme = CITY_THEMES[i] || CITY_THEMES[0];
  const A = theme.accent;
  const g = new THREE.Group();         // статичный (дуга тем)
  const core = new THREE.Group();      // вращается (сам город)
  g.add(core);

  const bDim = st === 'lock' ? 0.45 : 1;

  /* ---- основание с акцентным ободком и лучами-улицами ---- */
  const baseR = 11;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(baseR, baseR, 1.4, 56),
    new THREE.MeshStandardMaterial({ color: 0x14110a, roughness: 0.85, metalness: 0.25 }));
  base.position.y = -0.7; core.add(base);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(baseR - 0.4, baseR - 0.4, 0.3, 56),
    new THREE.MeshStandardMaterial({ color: 0x221c12, roughness: 0.7 }));
  plate.position.y = 0.15; core.add(plate);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(baseR - 0.3, 0.14, 12, 72),
    new THREE.MeshStandardMaterial({ color: A, emissive: A, emissiveIntensity: 0.6 * bDim, metalness: 0.7, roughness: 0.3 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.32; core.add(rim);
  /* свечение-диск под городом в цвет акцента */
  const disc = new THREE.Mesh(new THREE.CircleGeometry(baseR + 6, 48),
    new THREE.MeshBasicMaterial({ color: A, transparent: true, opacity: 0.05 * bDim, blending: THREE.AdditiveBlending, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.02; core.add(disc);

  /* ---- кварталы ---- */
  const grid = 5, step = 3.4, half = (grid - 1) / 2;
  for (let gx = 0; gx < grid; gx++) {
    for (let gz = 0; gz < grid; gz++) {
      const px = (gx - half) * step, pz = (gz - half) * step;
      if (Math.hypot(px, pz) > baseR - 1.8) continue;
      const isCenter = gx === 2 && gz === 2;
      if (!isCenter && R() < 0.16) { addTree(core, px, pz, R, bDim); continue; }
      const b = makeBuilding(theme.style, isCenter, R, A, bDim);
      b.position.set(px + (R() - 0.5) * 0.5, 0, pz + (R() - 0.5) * 0.5);
      b.rotation.y = (R() - 0.5) * 0.5;
      core.add(b);
    }
  }

  const cityLight = new THREE.PointLight(A, 1.5 * bDim, 44, 2);
  cityLight.position.set(0, 17, 7); core.add(cityLight);
  const ambientAccent = new THREE.PointLight(A, 0.5 * bDim, 30, 2);
  ambientAccent.position.set(-8, 6, -8); core.add(ambientAccent);

  cityGroup = g;
  cityCore = core;
  scene.add(g);
}

/* темы модуля — чистая HTML-строка над городом (без перекрытий) */
function buildTopicRow(i) {
  const host = document.getElementById('cityTopics');
  if (!host || !window.FOKUS) return;
  const m = window.FOKUS.STAGES[i].module;
  const topics = (m.learn || []);
  host.innerHTML = '<div class="ct-head mono">Чему научишься в этом городе</div><div class="ct-row">' +
    topics.map((t, k) => {
      const done = window.GAME && GAME.isDone(i, k);
      return `<button class="ct-chip${done ? ' done' : ''}" data-k="${k}"><span class="ct-n">${done ? '✓' : (k + 1)}</span><span class="ct-t">${t}</span></button>`;
    }).join('') + '</div>';
  host.querySelectorAll('.ct-chip').forEach(ch => {
    ch.onclick = () => {
      const k = +ch.dataset.k;
      const done = GAME.toggle(i, k);
      ch.classList.toggle('done', done);
      ch.querySelector('.ct-n').textContent = done ? '✓' : (k + 1);
      updateCityRing(i);
      GAME.afterToggle(i, k, done);
    };
  });
  host.classList.add('show');
}
function clearTopicRow() {
  const host = document.getElementById('cityTopics');
  if (host) { host.classList.remove('show'); host.innerHTML = ''; }
}

/* одно здание выбранного силуэта + окна-огоньки в цвет акцента */
function makeBuilding(style, isCenter, R, A, bDim) {
  const grp = new THREE.Group();
  const w = (isCenter ? 2.0 : 1.5) + R() * 0.7, dp = (isCenter ? 2.0 : 1.5) + R() * 0.7;
  const h = isCenter ? 9 + R() * 4 : 1.8 + R() * 5.5;
  const neutral = NEUT[(R() * NEUT.length) | 0];
  const bodyMat = new THREE.MeshStandardMaterial({
    color: isCenter ? A : neutral, roughness: 0.5, metalness: isCenter ? 0.55 : 0.65,
    flatShading: true, emissive: isCenter ? A : 0x0c0a06, emissiveIntensity: (isCenter ? 0.35 : 0.12) * bDim
  });

  let bodyH = h, topY;
  const round = style === 'domes';
  const body = new THREE.Mesh(
    round ? new THREE.CylinderGeometry(w * 0.5, w * 0.55, h, 8) : new THREE.BoxGeometry(w, h, dp),
    bodyMat);
  body.position.y = 0.3 + h / 2; grp.add(body);
  topY = 0.3 + h;

  /* верх по стилю */
  const capMat = new THREE.MeshStandardMaterial({ color: A, emissive: A, emissiveIntensity: 0.55 * bDim, metalness: 0.6, roughness: 0.3 });
  if (style === 'spires') {
    const sp = new THREE.Mesh(new THREE.ConeGeometry(w * 0.45, 2.2 + R() * 1.5, 6), capMat);
    sp.position.y = topY + 1.1; grp.add(sp);
  } else if (style === 'domes') {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(w * 0.55, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
    dome.position.y = topY; grp.add(dome);
  } else if (style === 'ziggurat') {
    const z = new THREE.Mesh(new THREE.BoxGeometry(w * 0.62, h * 0.4, dp * 0.62), bodyMat.clone());
    z.position.y = topY + h * 0.2; grp.add(z);
    const z2 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.3, 0.5, dp * 0.3), capMat);
    z2.position.y = topY + h * 0.4 + 0.25; grp.add(z2);
  } else if (style === 'towers' && !round) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.18, w * 0.18, 1.6 + R(), 6), capMat);
    cap.position.y = topY + 0.8; grp.add(cap);
  } else if (R() < 0.5) {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.55, 0.5, dp * 0.55), capMat);
    cap.position.y = topY + 0.25; grp.add(cap);
  }

  /* окна-огоньки */
  if (!round) addWindows(grp, w, dp, bodyH, A, R, bDim);
  return grp;
}

function addWindows(grp, w, dp, h, A, R, bDim) {
  const winMat = new THREE.MeshBasicMaterial({ color: A, transparent: true, opacity: (0.55 + R() * 0.35) });
  const rows = Math.max(1, Math.floor(h / 1.4));
  const faces = [[0, dp / 2 + 0.01, 0], [0, -dp / 2 - 0.01, Math.PI], [w / 2 + 0.01, 0, Math.PI / 2, 1], [-w / 2 - 0.01, 0, -Math.PI / 2, 1]];
  faces.forEach(f => {
    if (R() < 0.35) return;
    for (let r = 0; r < rows; r++) {
      if (R() < 0.4) continue;
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.3), winMat);
      const along = (R() - 0.5) * (f[3] ? dp : w) * 0.7;
      const y = 0.3 + 0.6 + r * 1.4;
      if (f[3]) { win.position.set(f[0], y, along); win.rotation.y = f[2]; }
      else { win.position.set(along, y, f[1]); win.rotation.y = f[2]; }
      grp.add(win);
    }
  });
}

function addTree(g, px, pz, R, bDim) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.8, 6),
    new THREE.MeshStandardMaterial({ color: 0x5a4326, roughness: 0.9 }));
  trunk.position.set(px, 0.7, pz); g.add(trunk);
  const top = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7 + R() * 0.3, 0),
    new THREE.MeshStandardMaterial({ color: 0x6f7a3a, roughness: 0.8, flatShading: true, emissive: 0x161405, emissiveIntensity: 0.2 * bDim }));
  top.position.set(px, 1.5, pz); g.add(top);
}

function buildTopicArc(g, m, i, bDim, A) {
  A = A || GOLD;
  const topics = (m.learn || []).slice(0, 4);
  const n = topics.length;
  const y = 14, spanX = 13.5, arcLift = 3.2;
  const pts = topics.map((t, k) => {
    const tx = n > 1 ? -spanX + (2 * spanX) * (k / (n - 1)) : 0;
    const ty = y + Math.sin(Math.PI * (n > 1 ? k / (n - 1) : 0.5)) * arcLift;
    return new THREE.Vector3(tx, ty, 0);
  });

  /* линия-дуга */
  if (n > 1) {
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.2);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.06, 6, false),
      new THREE.MeshBasicMaterial({ color: A, transparent: true, opacity: 0.6 })));
  }

  /* точки-темы (интерактивные) */
  topics.forEach((t, k) => {
    const p = pts[k];
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 18),
      new THREE.MeshStandardMaterial({ color: GOLD, emissive: GOLD, emissiveIntensity: 0.5, roughness: 0.25, transparent: true, opacity: 0.85 }));
    dot.position.copy(p); g.add(dot);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.62, 14, 14),
      new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }));
    halo.position.copy(p); g.add(halo);
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, p.y - 9, 4),
      new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.25 }));
    stalk.position.set(p.x, 9 + (p.y - 9) / 2, 0); g.add(stalk);

    const el = document.createElement('div');
    el.className = 'topic-dot ' + (k % 2 ? 'below' : 'above');
    el.innerHTML = `<span class="topic-n">${k + 1}</span><span class="topic-text">${t}</span>`;
    el.style.pointerEvents = 'auto';
    el.dataset.k = k; el.dataset.mi = i;

    const apply = (done) => {
      el.classList.toggle('done', done);
      el.querySelector('.topic-n').textContent = done ? '✓' : (k + 1);
      dot.material.emissiveIntensity = done ? 1.4 : 0.5;
      dot.material.opacity = done ? 1 : 0.85;
      dot.scale.setScalar(done ? 1.25 : 1);
    };
    apply(window.GAME ? GAME.isDone(i, k) : false);
    el.onclick = (e) => {
      e.stopPropagation();
      const done = GAME.toggle(i, k);
      apply(done);
      updateCityRing(i);
      GAME.afterToggle(i, k, done);
    };

    el.classList.add(k % 2 ? 'below' : 'above');
    const lab = new CSS2DObject(el);
    lab.position.set(p.x, p.y + (k % 2 ? -1.7 : 1.4), 0);
    g.add(lab); cityLabelEls.push(el);
  });

  /* заголовок «маршрут модуля» */
  const head = document.createElement('div');
  head.className = 'city-arc-head';
  head.textContent = 'Чему научишься в этом городе';
  const hl = new CSS2DObject(head);
  hl.position.set(0, y + arcLift + 2.2, 0);
  g.add(hl); cityLabelEls.push(head);
}

/* ============================================================
   ПЕРЕХОДЫ HUB ↔ CITY
   ============================================================ */
function enterCity(i) {
  if (mode !== 'hub') return;
  /* город заблокирован, пока не пройдены предыдущие */
  if (window.FOKUS.status(i) === 'lock') {
    let cur = 0; while (cur < window.FOKUS.STAGES.length && window.FOKUS.status(cur) !== 'cur') cur++;
    const curCity = window.FOKUS.STAGES[cur] ? window.FOKUS.STAGES[cur].module.city : '';
    showHubToast('🔒 Откроется позже. Сейчас твой этап — ' + curCity + '. Закрой его темы, и следующий город откроется.');
    return;
  }
  mode = 'transit';
  const veil = document.getElementById('sceneVeil');
  veil.classList.add('on');
  setTimeout(() => {
    scene.remove(hubGroup);
    hubLabelEls.forEach(e => e.style.display = 'none');
    if (cityGroup) { scene.remove(cityGroup); cityLabelEls.forEach(e => e.remove()); cityLabelEls = []; }
    buildCity(i);
    camera.position.copy(CITY_CAM);
    controls.target.copy(CITY_TAR);
    controls.minDistance = 14; controls.maxDistance = 60;
    controls.minPolarAngle = 0.15; controls.maxPolarAngle = 1.35;
    controls.autoRotate = false;
    container.classList.add('city-mode');
    if (container.closest('.map-card')) container.closest('.map-card').classList.add('city-mode');
    buildTopicRow(i);
    setHud(i, true);
    updateCityRing(i);
    if (window.GAME) GAME.greetCity(i);
    mode = 'city';
    veil.classList.remove('on');
  }, 240);
}

const RING_C = 2 * Math.PI * 19;
function updateCityRing(i) {
  if (!window.GAME) return;
  const p = GAME.cityProgress(i);
  const fill = document.getElementById('cpFill');
  const pct = document.getElementById('cpPct');
  if (fill) { fill.style.strokeDasharray = RING_C; fill.style.strokeDashoffset = RING_C * (1 - p.pct / 100); }
  if (pct) pct.textContent = p.pct + '%';
}

function exitCity() {
  if (mode !== 'city') return;
  mode = 'transit';
  const veil = document.getElementById('sceneVeil');
  veil.classList.add('on');
  setTimeout(() => {
    if (cityGroup) { scene.remove(cityGroup); cityGroup = null; cityCore = null; }
    cityLabelEls.forEach(e => e.remove()); cityLabelEls = [];
    scene.add(hubGroup);
    refreshHubScene();                       // обновить статусы городов на карте
    if (window.FOKUS && window.FOKUS.refreshHubUI) window.FOKUS.refreshHubUI();
    hubLabelEls.forEach(e => e.style.display = '');
    camera.position.copy(HUB_CAM);
    controls.target.copy(HUB_TAR);
    controls.minDistance = 24; controls.maxDistance = 130;
    controls.minPolarAngle = 0.25; controls.maxPolarAngle = 1.25;
    controls.autoRotate = false;
    container.classList.remove('city-mode');
    if (container.closest('.map-card')) container.closest('.map-card').classList.remove('city-mode');
    clearTopicRow();
    setHud(0, false);
    if (window.GAME) GAME.hideMascot();
    mode = 'hub';
    veil.classList.remove('on');
  }, 240);
}
window.exitCity = exitCity;
window.enterCity = enterCity;

function setHud(i, show) {
  const hud = document.getElementById('cityHud');
  if (!hud) return;
  if (show) {
    const m = window.FOKUS.STAGES[i].module;
    const st = window.FOKUS.status(i);
    document.getElementById('cityEtap').textContent = 'Этап ' + String(i + 1).padStart(2, '0') + ' · ' + m.city;
    document.getElementById('cityName').textContent = m.title;
    document.getElementById('cityTag').textContent = m.tagline;
    const more = document.getElementById('cityMore');
    more.onclick = () => window.FOKUS.openOverlay(i);
    hud.classList.add('show');
  } else {
    hud.classList.remove('show');
  }
}

function setupHud() {
  const back = document.getElementById('cityBack');
  if (back) back.onclick = exitCity;
}

/* ============================================================
   ВЗАИМОДЕЙСТВИЕ
   ============================================================ */
function setupPointer() {
  const dom = renderer.domElement;
  let downX = 0, downY = 0, moved = false;
  dom.addEventListener('pointerdown', e => { downX = e.clientX; downY = e.clientY; moved = false; });
  dom.addEventListener('pointermove', e => {
    if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 6) moved = true;
    const r = dom.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  });
  dom.addEventListener('pointerup', e => {
    if (moved || mode !== 'hub') return;
    const r = dom.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(beaconHits, false);
    if (hits.length) enterCity(hits[0].object.userData.index);
  });
}

function onResize() {
  if (!container) return;
  const W = container.clientWidth, H = container.clientHeight || 500;
  camera.aspect = W / H; camera.updateProjectionMatrix();
  renderer.setSize(W, H); labelRenderer.setSize(W, H);
}

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta(), t = clock.elapsedTime;

  if (mode === 'hub' && !RM) {
    beacons.forEach(b => {
      b.orb.rotation.y += dt * 0.5;
      b.orb.position.y = b.base + Math.sin(t * 1.3 + b.index) * 0.12;
      if (b.st === 'cur' && b.pulseRing) {
        const p = (t % 2) / 2;
        b.pulseRing.scale.setScalar(1 + p * 1.4);
        b.pulseRing.material.opacity = 0.7 * (1 - p);
      }
    });
    if (traveler) traveler.position.y = DEPTH + 1.0 + Math.sin(t * 2) * 0.18;
    if (particles) particles.rotation.y += dt * 0.01;
    /* «наполнение» маршрута Актау→Алматы и обратно */
    if (routeFlow) {
      const cyc = (t * 0.32) % 2;                 // 0..2 период
      const f = cyc < 1 ? cyc : (2 - cyc);        // 0→1→0 треугольник
      const e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
      routeFlow.geometry.setDrawRange(0, Math.floor(routeFlowCount * e));
      routeFlow.material.opacity = 0.55 + 0.4 * Math.sin(t * 3);
    }
  }
  if (mode === 'city' && cityCore && !RM) cityCore.rotation.y += dt * 0.12;

  if (mode === 'hub' && !RM) {
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(beaconHits, false);
    const h = hits.length ? hits[0].object.userData.index : null;
    if (h !== hovered) { hovered = h; container.style.cursor = h !== null ? 'pointer' : 'grab'; }
  }

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}
