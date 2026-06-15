/* ============================================================
   ФОКУС ИИ — игровой слой: личное прохождение, лев-проводник, салют.
   Личный прогресс хранится в localStorage (без бэкенда).
   groupProgress (data.js) по-прежнему решает, какие города открыты.
   ============================================================ */
(function () {
  const LS = 'fokus_topics';
  let store = {};
  try { store = JSON.parse(localStorage.getItem(LS) || '{}'); } catch (e) {}
  const save = () => localStorage.setItem(LS, JSON.stringify(store));
  const key = (mi, ti) => mi + '_' + ti;
  const topicsOf = mi => (SITE.modules[mi].learn || []);

  const PRAISE = [
    'Огонь! Тема в кармане 🔥', 'Вот так, продолжай!', 'Отметил — двигаемся дальше',
    'Ты растёшь на глазах 💪', 'Чисто сработано!', 'Ещё один навык в копилку'
  ];
  let userName = 'участник';

  const GAME = {
    isDone: (mi, ti) => !!store[key(mi, ti)],
    cityProgress(mi) {
      const t = topicsOf(mi).length; let d = 0;
      for (let i = 0; i < t; i++) if (store[key(mi, i)]) d++;
      return { done: d, total: t, pct: t ? Math.round(d / t * 100) : 0 };
    },
    overall() {
      let d = 0, t = 0;
      SITE.modules.forEach((m, mi) => { const n = topicsOf(mi).length; t += n; for (let i = 0; i < n; i++) if (store[key(mi, i)]) d++; });
      return { done: d, total: t, pct: t ? Math.round(d / t * 100) : 0 };
    },
    toggle(mi, ti) { const k = key(mi, ti); store[k] = !store[k]; save(); return store[k]; },

    /* ---- welcome-экран ---- */
    welcome() {
      const w = document.getElementById('welcome');
      const p = document.getElementById('welcomeText');
      const btn = document.getElementById('welcomeBtn');
      const wrap = document.getElementById('welcomeLionWrap');
      if (!w || !p || !btn) return;

      // текст с подсветкой ключевой фразы (печатается по символам через данные)
      const FULL = 'Добро пожаловать на программу «Фокус ИИ». Вы, ребята, крутые! А очень скоро мы станем ещё сильнее и быстрее!';
      const HL = 'Вы, ребята, крутые!';
      const render = (n) => {
        const cut = FULL.slice(0, n);
        const idx = cut.indexOf(HL);
        if (idx === -1) { p.textContent = cut; return; }
        const end = idx + HL.length;
        const shown = Math.min(n, end);
        p.innerHTML = FULL.slice(0, idx) + '<span class="hl">' + FULL.slice(idx, shown) + '</span>' + FULL.slice(shown, n);
      };

      w.classList.add('show');
      w.setAttribute('aria-hidden', 'false');
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const fin = () => { p.classList.add('done'); btn.classList.add('show'); if (wrap) wrap.classList.remove('talking'); };
      if (reduce) { render(FULL.length); fin(); }
      else {
        if (wrap) wrap.classList.add('talking');
        let k = 0;
        const tick = () => {
          render(++k);
          if (k < FULL.length) setTimeout(tick, 28);
          else fin();
        };
        setTimeout(tick, 850);
      }
      const close = () => { w.classList.remove('show'); w.setAttribute('aria-hidden', 'true'); };
      btn.onclick = close;
      w.addEventListener('click', e => { if (e.target === w && btn.classList.contains('show')) close(); });
    },

    /* ---- маскот ---- */
    initMascot(name) {
      userName = name || 'участник';
      const ava = document.getElementById('mascotAva');
      if (ava) ava.onclick = () => GAME.say(tip(), 4200);
      const img = document.getElementById('mascotImg');
      if (img) img.onerror = () => img.classList.add('hide');
    },
    greetCity(mi) {
      const m = SITE.modules[mi];
      const p = GAME.cityProgress(mi);
      const mascot = document.getElementById('mascot');
      if (mascot) mascot.classList.add('show');
      if (p.pct === 100) GAME.say(`${m.city} уже пройден на 100%. Красавчик!`, 4600);
      else if (p.done > 0) GAME.say(`Продолжаем «${m.title}». Осталось ${p.total - p.done} — жми по темам.`, 4800);
      else GAME.say(`Это «${m.title}». Отмечай темы кликом, как освоишь.`, 5200);
    },
    hideMascot() { const mascot = document.getElementById('mascot'); if (mascot) mascot.classList.remove('show'); },

    say(text, ms) {
      const inCity = !!(document.querySelector('.map-card') && document.querySelector('.map-card').classList.contains('city-mode'));
      const b = document.getElementById(inCity ? 'cityBubble' : 'mascotBubble');
      if (!b) return;
      b.textContent = text;
      b.classList.add('show');
      if (inCity) {
        const lion = document.getElementById('cityLion');
        if (lion) { lion.classList.add('talking'); clearTimeout(GAME._talk); GAME._talk = setTimeout(() => lion.classList.remove('talking'), Math.min(ms || 4000, 2600)); }
      } else {
        const ava = document.getElementById('mascotAva');
        if (ava) { ava.classList.remove('pop'); void ava.offsetWidth; ava.classList.add('pop'); }
      }
      clearTimeout(GAME._t);
      GAME._t = setTimeout(() => b.classList.remove('show'), ms || 4000);
    },

    afterToggle(mi, ti, done) {
      const p = GAME.cityProgress(mi);
      if (done) {
        burst(false);
        if (p.pct === 100) {
          setTimeout(() => { burst(true); GAME.say(`🎉 ${SITE.modules[mi].city} пройден на 100%! Ты молодец, ${userName}.`, 6000); }, 220);
        } else {
          GAME.say(PRAISE[(Math.random() * PRAISE.length) | 0] + ` · ${p.pct}%`, 3200);
        }
      } else {
        GAME.say('Снял отметку. Без проблем.', 2600);
      }
    }
  };

  /* прогрессивная подгрузка говорящего видео-льва (fallback — картинка + CSS) */
  function tryLionVideo(wrap, vidId) {
    if (!wrap) return;
    const v = document.getElementById(vidId);
    if (!v || v.dataset.tried) return;
    v.dataset.tried = '1';
    v.addEventListener('canplay', () => { wrap.classList.add('has-video'); v.play().catch(() => {}); });
    v.load();
  }

  function tip() {
    const o = GAME.overall();
    const tips = [
      `Твой личный прогресс по программе: ${o.pct}% (${o.done}/${o.total} тем).`,
      'Каждый город — отдельный навык. Отмечай темы, как освоишь.',
      'Не спеши: глубина важнее скорости. Я рядом 🦁',
      `Уже ${o.done} тем за плечами. Так держать, ${userName}!`
    ];
    return tips[(Math.random() * tips.length) | 0];
  }

  /* ---- САЛЮТ (конфетти на canvas #fx) ---- */
  let fx, ctx, parts = [], raf = null;
  function ensureFx() {
    fx = document.getElementById('fx'); if (!fx) return false;
    const host = fx.parentElement;
    fx.width = host.clientWidth; fx.height = host.clientHeight;
    ctx = fx.getContext('2d'); return true;
  }
  function burst(big) {
    if (!ensureFx()) return;
    const cx = fx.width * 0.5, cy = fx.height * (big ? 0.42 : 0.5);
    const N = big ? 160 : 46;
    const colors = ['#F5C518', '#F4ECD8', '#7A5C1E', '#FFD75A'];
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2, sp = (big ? 5 : 3) + Math.random() * (big ? 9 : 5);
      parts.push({
        x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (big ? 4 : 2),
        g: 0.16 + Math.random() * 0.1, life: 1, col: colors[(Math.random() * colors.length) | 0],
        s: 3 + Math.random() * 4, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4
      });
    }
    if (!raf) loop();
  }
  function loop() {
    raf = requestAnimationFrame(loop);
    if (!ctx) return;
    ctx.clearRect(0, 0, fx.width, fx.height);
    parts.forEach(p => {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.life -= 0.011; p.rot += p.vr;
      ctx.save(); ctx.globalAlpha = Math.max(0, p.life); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.col; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); ctx.restore();
    });
    parts = parts.filter(p => p.life > 0 && p.y < fx.height + 30);
    if (!parts.length) { cancelAnimationFrame(raf); raf = null; ctx.clearRect(0, 0, fx.width, fx.height); }
  }

  window.GAME = GAME;
})();
