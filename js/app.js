/* ===== GATE ===== */
const gate = document.getElementById('gate');
const keyInput = document.getElementById('keyInput');
const nameWrap = document.getElementById('nameWrap');
const nameInput = document.getElementById('nameInput');
const nameField = document.getElementById('nameField');
const sphereInput = document.getElementById('sphereInput');
const gateErr = document.getElementById('gateErr');
const gateBtn = document.getElementById('gateBtn');

let keyOk = false;
let matchedName = '';   // имя участника по паролю

function showErr(msg) {
  gateErr.textContent = msg;
  gateErr.classList.add('show');
  document.querySelector('.gate-card').classList.add('shake');
  setTimeout(() => document.querySelector('.gate-card').classList.remove('shake'), 420);
}

keyInput.addEventListener('input', () => {
  gateErr.classList.remove('show');
  keyOk = false; matchedName = '';
  nameWrap.classList.remove('show');
  if (nameField) nameField.style.display = 'block';
});

keyInput.addEventListener('keydown', e => { if (e.key === 'Enter') tryKey(); });
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') tryEnter(); });
if (sphereInput) sphereInput.addEventListener('keydown', e => { if (e.key === 'Enter') tryEnter(); });

gateBtn.addEventListener('click', () => {
  if (!keyOk) tryKey(); else tryEnter();
});

function tryKey() {
  const v = keyInput.value.trim().toLowerCase();
  const participant = (SITE.participants && SITE.participants[v]) || null;
  const isMaster = v === SITE.accessKey.toLowerCase();
  if (!participant && !isMaster) { showErr('Неверный пароль'); return; }

  keyOk = true;
  matchedName = participant ? participant.name : '';
  gateErr.classList.remove('show');

  const saved = localStorage.getItem('fokus_name');
  const savedSphere = localStorage.getItem('fokus_sphere');
  if (saved && savedSphere) { enterApp(saved); return; }

  // имя: для участника известно (поле скрываем), для мастер-ключа — спрашиваем
  if (participant) { nameField.style.display = 'none'; nameInput.value = participant.name; }
  else { nameField.style.display = 'block'; }
  if (saved) nameInput.value = saved;
  if (savedSphere) sphereInput.value = savedSphere;

  nameWrap.classList.add('show');
  gateBtn.textContent = 'Войти на маршрут';
  setTimeout(() => (participant ? sphereInput : nameInput).focus(), 50);
}

function tryEnter() {
  const name = (matchedName || nameInput.value.trim());
  const sphere = sphereInput.value.trim();
  if (!name) { showErr('Введи своё имя'); return; }
  if (!sphere) { showErr('Укажи сферу деятельности'); return; }
  localStorage.setItem('fokus_name', name);
  localStorage.setItem('fokus_sphere', sphere);
  sendProfile(name, sphere);
  enterApp(name);
}

// тихо отправляем профиль (имя+сфера) на endpoint, если настроен
function sendProfile(name, sphere) {
  if (!SITE.homeworkEndpoint) return;
  try {
    fetch(SITE.homeworkEndpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'profile', name, sphere })
    });
  } catch (e) {}
}

function enterApp(name) {
  gate.classList.add('hidden');
  startApp(name);
  if (window.GAME && GAME.welcome) GAME.welcome();
}

window.addEventListener('load', () => keyInput.focus());

/* ===== STATUS =====
   Город «пройден», если группа дошла до него (groupProgress) ИЛИ
   участник лично закрыл все его темы (личное прохождение). */
const DONE = Math.max(0, Math.min(SITE.modules.length, SITE.groupProgress));
function cityDone(i) { return i < DONE || (window.GAME && GAME.cityProgress(i).pct === 100); }
function doneCount() { let c = 0; for (let i = 0; i < SITE.modules.length; i++) if (cityDone(i)) c++; return c; }
function status(i) {
  if (cityDone(i)) return 'done';
  let fo = 0; while (fo < SITE.modules.length && cityDone(fo)) fo++;
  if (i === fo) return 'cur';
  return i > DONE ? 'lock' : 'cur';
}

/* ===== MAP coords & offsets ===== */
const STAGES = SITE.modules.map((m, i) => {
  const coords = [
    {x:132.9,y:436.5}, {x:150.6,y:316.2}, {x:273.1,y:205.3}, {x:423.5,y:103.1},
    {x:605.6,y:175.6}, {x:644.6,y:221.7}, {x:734.8,y:135.5}, {x:810.9,y:200.8},
    {x:562.7,y:482.8}, {x:733.0,y:450.8}
  ];
  return { ...coords[i], module: m };
});
const OFF = [[-6,18,'end'],[-6,16,'end'],[-8,-12,'end'],[0,-13,'middle'],[0,-13,'middle'],[8,20,'start'],[6,-12,'start'],[8,16,'start'],[0,22,'middle'],[8,16,'start']];

/* ===== APP START ===== */
function startApp(name) {
  document.getElementById('who').innerHTML = 'Привет, <span>' + name + '</span>';
  document.getElementById('dates').textContent = SITE.dates + ' · ' + SITE.totalCalls + ' созвонов · ' + (SITE.totalCalls * 2) + ' часов · Zoom';

  buildList(); buildMaterials();
  const sel = DONE < SITE.modules.length ? DONE : SITE.modules.length - 1;
  markSel(sel);

  // игровой слой + 3D-сцена
  if (window.GAME) GAME.initMascot(name);
  window.FOKUS = { SITE, STAGES, DONE, status, openOverlay, markSel, refreshHubUI };
  window.__fokusReady = true;
  if (window.initScene) window.initScene();

  const app = document.getElementById('app');
  setTimeout(() => {
    app.classList.add('show');
    updateStat(true);
  }, 150);
}

function updateStat(anim) {
  const total = SITE.modules.length, dc = doneCount(), pct = Math.round(dc / total * 100);
  document.getElementById('statNum').textContent = dc + '/' + total;
  document.getElementById('barPct').textContent = pct + '%';
  document.getElementById('barLeft').textContent = dc === 0 ? 'старт маршрута' : (dc === total ? 'маршрут пройден' : 'в пути');
  const bar = document.getElementById('barFill');
  if (anim) setTimeout(() => { bar.style.width = pct + '%'; }, 120); else bar.style.width = pct + '%';
}

/* обновить список этапов + счётчик после прохождения города (зовётся из scene.js) */
function refreshHubUI() { buildList(); updateStat(false); }

/* ===== ROUTE ===== */
function buildRoute() {
  const pts = STAGES.map(s => [s.x, s.y]);
  document.getElementById('routeBase').setAttribute('d', 'M' + pts.map(p => p.join(',')).join(' L'));
  if (DONE > 0) {
    const seg = pts.slice(0, Math.min(DONE, pts.length - 1) + 1);
    document.getElementById('routeDone').setAttribute('d', 'M' + seg.map(p => p.join(',')).join(' L'));
  }
}

/* ===== NODES ===== */
function buildNodes() {
  const g = document.getElementById('nodes');
  g.innerHTML = '';
  const NS = 'http://www.w3.org/2000/svg';
  STAGES.forEach((s, i) => {
    const st = status(i);
    const node = document.createElementNS(NS, 'g');
    node.setAttribute('class', 'node'); node.dataset.i = i;
    node.setAttribute('role', 'button');
    node.setAttribute('aria-label', 'Этап ' + (i+1) + ': ' + s.module.title);
    node.setAttribute('tabindex', '0');
    node.addEventListener('click', () => openOverlay(i));
    node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openOverlay(i); } });

    if (st === 'cur') {
      const ping = document.createElementNS(NS, 'circle');
      ping.setAttribute('class', 'ping'); ping.setAttribute('cx', s.x); ping.setAttribute('cy', s.y); ping.setAttribute('r', 9);
      node.appendChild(ping);
    }
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', s.x); c.setAttribute('cy', s.y);
    c.setAttribute('r', st === 'lock' ? 6.5 : 8.5);
    c.setAttribute('class', st === 'done' ? 'dot-done' : (st === 'cur' ? 'dot-cur' : 'dot-lock'));
    node.appendChild(c);

    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', s.x); t.setAttribute('y', s.y);
    t.setAttribute('class', st === 'lock' ? 'numlock' : (st === 'cur' ? 'numcur' : 'num'));
    t.textContent = st === 'done' ? '✓' : String(i + 1);
    node.appendChild(t);

    const [dx, dy, anc] = OFF[i];
    const lab = document.createElementNS(NS, 'text');
    lab.setAttribute('x', s.x + dx); lab.setAttribute('y', s.y + dy);
    lab.setAttribute('class', 'lab'); lab.setAttribute('text-anchor', anc);
    lab.textContent = String(i + 1).padStart(2, '0') + ' ' + s.module.title;
    node.appendChild(lab);

    const hit = document.createElementNS(NS, 'circle');
    hit.setAttribute('cx', s.x); hit.setAttribute('cy', s.y); hit.setAttribute('r', 16); hit.setAttribute('class', 'hit');
    node.appendChild(hit);
    g.appendChild(node);
  });
}

/* ===== LIST ===== */
let currentSel = 0;
function buildList() {
  const b = document.getElementById('listBody');
  b.innerHTML = '';
  SITE.modules.forEach((m, i) => {
    const st = status(i);
    const el = document.createElement('div');
    el.className = 'item'; el.dataset.i = i;
    el.setAttribute('role', 'button'); el.setAttribute('tabindex', '0');
    el.onclick = () => openOverlay(i);
    el.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openOverlay(i); } };
    el.innerHTML = '<div class="it-ic ' + st + '">' + (st === 'done' ? '✓' : (i + 1)) + '</div>' +
      '<div class="it-name">' + m.title + '</div><div class="it-city">' + m.city + '</div>';
    b.appendChild(el);
  });
}

function renderDetail(i) {
  // kept for initial selection highlight only — detail now shows in overlay
  markSel(i);
}

function markSel(i) {
  currentSel = i;
  document.querySelectorAll('.node').forEach(n => n.classList.toggle('sel', +n.dataset.i === i));
  document.querySelectorAll('.item').forEach(n => n.classList.toggle('sel', +n.dataset.i === i));
}

/* ===== OVERLAY ===== */
const backdrop = document.getElementById('overlayBackdrop');
const overlay = document.getElementById('overlay');

function openOverlay(i) {
  markSel(i);
  renderOverlay(i);
  backdrop.classList.add('open');
  overlay.classList.add('open');
  overlay.scrollTop = 0;
  document.getElementById('overlayClose').focus();
}
function closeOverlay() {
  backdrop.classList.remove('open');
  overlay.classList.remove('open');
}
backdrop.addEventListener('click', closeOverlay);
document.getElementById('overlayClose').addEventListener('click', closeOverlay);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeOverlay(); });

function renderOverlay(i) {
  const m = SITE.modules[i];
  const st = status(i);
  const statusLabel = { done: '✓ Пройдено', cur: '◉ Сейчас здесь', lock: '○ Откроется позже' }[st];
  const hours = m.calls * 2;

  const materialsHtml = buildMatList(m.materials);

  document.getElementById('overlayContent').innerHTML = `
    <div class="ov-header">
      <div class="ov-meta">
        <span class="ov-num">Этап ${String(i+1).padStart(2,'0')}</span>
        <span class="ov-city mono">${m.city}</span>
      </div>
      <div class="ov-title">${m.title}</div>
      <div class="ov-tagline">${m.tagline}</div>
      <div class="ov-status ${st}">${statusLabel}</div>
    </div>

    <hr class="ov-divider">

    <div class="ov-section">
      <div class="ov-label">Созвонов и часов</div>
      <div class="ov-calls">${m.calls} созвон${calls_suffix(m.calls)} · ${hours} час${hours_suffix(hours)}</div>
    </div>

    <div class="ov-section">
      <div class="ov-label">Что проходим</div>
      <div class="ov-text">${m.overview}</div>
    </div>

    <div class="ov-section">
      <div class="ov-label">Как проходим</div>
      <div class="ov-text">${m.howWeLearn}</div>
    </div>

    <div class="ov-section">
      <div class="ov-label">Инструменты</div>
      <div class="ov-platforms">${m.platforms.map(p => `<span class="ov-tag">${p}</span>`).join('')}</div>
    </div>

    <div class="ov-section">
      <div class="ov-label">Чему научишься</div>
      <ul class="ov-learn">${m.learn.map(l => `<li>${l}</li>`).join('')}</ul>
    </div>

    ${m.outcome ? `<div class="ov-section ov-outcome">
      <div class="ov-label">На выходе</div>
      <div class="ov-text">${m.outcome}</div>
    </div>` : ''}

    <hr class="ov-divider">

    <div class="ov-section">
      <div class="ov-label">Материалы модуля</div>
      ${st === 'lock'
        ? `<div class="ov-locked-note"><div class="lock-icon">🔒</div><p>Материалы откроются, когда<br>группа дойдёт до этого этапа</p></div>`
        : (m.materials.length ? `<div class="ov-materials">${materialsHtml}</div>` : `<p class="mat-empty">Материалы появятся здесь после созвона</p>`)
      }
    </div>
  `;
}

function calls_suffix(n) {
  if (n === 1) return '';
  if (n >= 2 && n <= 4) return 'а';
  return 'ов';
}
function hours_suffix(n) {
  if (n === 1) return '';
  if (n >= 2 && n <= 4) return 'а';
  return 'ов';
}

function buildMatList(materials) {
  return materials.map(mat => {
    const icon = mat.type === 'pdf' ? '📄' : '🔗';
    const href = mat.file || mat.url;
    const target = mat.url ? 'target="_blank" rel="noopener"' : '';
    return `<a class="mat-item" href="${href}" ${target}><span class="mat-icon">${icon}</span><span class="mat-title">${mat.title}</span><span class="mat-arrow">↗</span></a>`;
  }).join('');
}

/* ===== MATERIALS TAB ===== */
function buildMaterials() {
  const container = document.getElementById('materialsContainer');
  container.innerHTML = '';

  // Module materials (only done/cur modules)
  SITE.modules.forEach((m, i) => {
    const st = status(i);
    if (st === 'lock') return;
    if (!m.materials.length) return;
    const group = document.createElement('div');
    group.className = 'mat-group';
    group.innerHTML = `<div class="mat-group-title">Этап ${i+1} · ${m.title} · ${m.city}</div><div class="mat-grid">${buildMatList(m.materials)}</div>`;
    container.appendChild(group);
  });

  // Library
  if (SITE.library.length) {
    const group = document.createElement('div');
    group.className = 'mat-group';
    group.innerHTML = `<div class="mat-group-title">Общая библиотека</div><div class="mat-grid">${buildMatList(SITE.library)}</div>`;
    container.appendChild(group);
  }

  if (!container.children.length) {
    container.innerHTML = '<p style="font-family:var(--mono);font-size:12px;color:var(--cream-faint);letter-spacing:.04em;margin-top:16px">Материалы появятся здесь после первых созвонов</p>';
  }
}

/* ===== TABS ===== */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

/* ===== THEME (тёмная / светлая) ===== */
(function () {
  const KEY = 'fokus_theme';
  const btn = document.getElementById('themeToggle');
  const apply = (t) => {
    document.body.classList.toggle('theme-light', t === 'light');
    if (btn) btn.textContent = t === 'light' ? '☀️' : '🌙';
    if (window.setSceneTheme) window.setSceneTheme();
  };
  apply(localStorage.getItem(KEY) || 'dark');
  if (btn) btn.addEventListener('click', () => {
    const next = document.body.classList.contains('theme-light') ? 'dark' : 'light';
    localStorage.setItem(KEY, next); apply(next);
  });
})();

/* ===== ДОМАШНИЕ ЗАДАНИЯ ===== */
(function () {
  const form = document.getElementById('hwForm');
  if (!form) return;
  const sel = document.getElementById('hwModule');
  SITE.modules.forEach((m, i) => {
    const o = document.createElement('option');
    o.value = i; o.textContent = 'Модуль ' + String(m.id).padStart(2, '0') + ' · ' + m.title;
    sel.appendChild(o);
  });
  let type = 'text';
  const text = document.getElementById('hwText');
  const fileWrap = document.getElementById('hwFileWrap');
  const link = document.getElementById('hwLink');
  const fileInput = document.getElementById('hwFile');
  const fileLabel = document.getElementById('hwFileLabel');
  const status = document.getElementById('hwStatus');
  const submit = document.getElementById('hwSubmit');
  const setStatus = (msg, cls) => { status.textContent = msg; status.className = 'hw-status ' + (cls || ''); };

  document.querySelectorAll('.hw-type').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.hw-type').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    type = b.dataset.hwtype;
    text.style.display = type === 'text' ? 'block' : 'none';
    fileWrap.style.display = type === 'file' ? 'block' : 'none';
    link.style.display = type === 'link' ? 'block' : 'none';
    setStatus('', '');
  }));
  fileInput.addEventListener('change', () => {
    fileLabel.textContent = fileInput.files[0] ? fileInput.files[0].name : 'Выбрать файл (фото, видео, PDF, документ…)';
  });

  const toBase64 = (file) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1]);
    r.onerror = rej; r.readAsDataURL(file);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!SITE.homeworkEndpoint) { setStatus('Приём домашних заданий ещё настраивается — загрузка откроется совсем скоро 🦁', 'err'); return; }
    const name = localStorage.getItem('fokus_name') || 'участник';
    const m = SITE.modules[+sel.value];
    const payload = { name, module: 'Модуль ' + m.id + ' · ' + m.title, type };
    if (type === 'text') { if (!text.value.trim()) { setStatus('Напиши текст задания', 'err'); return; } payload.content = text.value.trim(); }
    else if (type === 'link') { if (!link.value.trim()) { setStatus('Вставь ссылку', 'err'); return; } payload.content = link.value.trim(); }
    else {
      const f = fileInput.files[0];
      if (!f) { setStatus('Выбери файл', 'err'); return; }
      if (f.size > 20 * 1024 * 1024) { setStatus('Файл больше 20 МБ — лучше загрузи ссылкой на облако', 'err'); return; }
      payload.fileName = f.name; payload.fileMime = f.type || 'application/octet-stream';
      payload.fileData = await toBase64(f);
    }
    submit.disabled = true; setStatus('Отправляем…', '');
    try {
      const r = await fetch(SITE.homeworkEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error('bad');
      setStatus('Готово! Работа отправлена ✅ Спасибо!', 'ok');
      form.reset(); type = 'text';
      document.querySelectorAll('.hw-type').forEach((x, idx) => x.classList.toggle('active', idx === 0));
      text.style.display = 'block'; fileWrap.style.display = 'none'; link.style.display = 'none';
      fileLabel.textContent = 'Выбрать файл (фото, видео, PDF, документ…)';
    } catch (err) { setStatus('Не удалось отправить. Попробуй ещё раз.', 'err'); }
    submit.disabled = false;
  });
})();
