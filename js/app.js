/* =============================================
   CATTA STUDIOS · v2 · app.js
   Moldura fixa (menu, cursor, pílula, faixa de chamada, rodapé),
   abertura, transição entre páginas e módulos de cada página.
   Depende de: gsap (+ ScrollTrigger, SplitText, MorphSVGPlugin, CustomEase, Flip),
   Lenis, Barba, i18n.js, glyphs.js.
   ============================================= */
(() => {
  'use strict';

  const BASE = '/';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const touch = matchMedia('(hover: none)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } },
  };

  gsap.registerPlugin(ScrollTrigger, SplitText, MorphSVGPlugin, CustomEase, Flip);
  // curva própria: recua um pouco e estala no lugar
  CustomEase.create('snap', 'M0,0 C0.26,-0.38 0.14,1.24 1,1');
  CustomEase.create('glide', 'M0,0 C0.12,0.72 0.24,1 1,1');

  /* ---------- idioma ---------- */
  const I18N = window.CATTA_I18N || {};
  const Lang = {
    value: 'en',
    detect() {
      const saved = store.get('catta-lang');
      if (saved && (saved === 'en' || I18N[saved])) return saved;
      for (const l of navigator.languages || [navigator.language || 'en']) {
        const k = String(l).slice(0, 2).toLowerCase();
        if (k === 'en') return 'en';
        if (I18N[k]) return k;
      }
      return 'en';
    },
    t(key, fallback) {
      if (this.value !== 'en' && I18N[this.value] && I18N[this.value][key] != null) return I18N[this.value][key];
      return fallback;
    },
    apply(root = document) {
      const dict = I18N[this.value] || {};
      $$('[data-i18n]', root).forEach((el) => {
        if (el.dataset.en == null) el.dataset.en = el.innerHTML;
        const v = this.value === 'en' ? el.dataset.en : dict[el.dataset.i18n];
        if (v != null && el.innerHTML !== v) el.innerHTML = v;
      });
      // atributos: data-i18n-attr="placeholder:form.name;aria-label:x"
      $$('[data-i18n-attr]', root).forEach((el) => {
        el.dataset.i18nAttr.split(';').forEach((pair) => {
          const [attr, key] = pair.split(':');
          const store_ = 'en' + attr.replace(/[^a-z]/gi, '');
          if (el.dataset[store_] == null) el.dataset[store_] = el.getAttribute(attr) || '';
          const v = this.value === 'en' ? el.dataset[store_] : dict[key];
          if (v != null) el.setAttribute(attr, v);
        });
      });
    },
    set(l, rebuild = true) {
      this.value = l;
      store.set('catta-lang', l);
      document.documentElement.lang = l === 'pt' ? 'pt-BR' : l;
      $$('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
      this.apply();
      const title = document.querySelector('[data-barba="container"]')?.dataset.title;
      if (title) setTitle(title);
      if (rebuild) Page.rebuild();
    },
  };
  function setTitle(key) {
    const c = $('[data-barba="container"]');
    const en = c?.dataset.titleEn || document.title;
    if (c && !c.dataset.titleEn) c.dataset.titleEn = en;
    document.title = Lang.t('title.' + key, en);
  }

  /* ---------- ícones ---------- */
  const GLYPH_PATHS =
    '<path d="M170 110V-1140L475 -830V-690H320V-30H475V110Z"/><path d="M670 110V-30H825V-690H670V-830L975 -1140V110Z"/>';
  const ICON = {
    glyph: `<svg viewBox="170 -1140 805 1250" aria-hidden="true" fill="currentColor">${GLYPH_PATHS}</svg>`,
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>',
  };

  const LINKS = [
    ['work/', 'Work', 'nav.work'],
    ['services/', 'Services', 'nav.services'],
    ['studio/', 'Studio', 'nav.studio'],
    ['contact/', 'Contact', 'nav.contact'],
  ];

  const chars = (s) =>
    [...s].map((c) => (c === ' ' ? '<span class="sp"></span>' : `<span class="ch${c === '\\' ? ' bs' : ''}">${c}</span>`)).join('');

  /* ---------- moldura ---------- */
  function buildChrome() {
    const nav = document.createElement('header');
    nav.className = 'nav';
    nav.innerHTML = `
      <a class="logo" href="${BASE}" aria-label="Catta Studios, home">${chars('\\catta studios')}</a>
      <a class="nav__glyph" href="${BASE}" aria-label="Catta Studios, home">${ICON.glyph}</a>
      <nav class="nav__links" aria-label="Main">
        ${LINKS.map(([h, l, k]) => `<a href="${BASE}${h}" data-i18n="${k}">${l}</a>`).join('')}
      </nav>
      <div class="nav__tools">
        <div class="lang" role="group" aria-label="Language">
          <button data-lang="en" lang="en" aria-pressed="false">EN</button><button data-lang="pt" lang="pt" aria-pressed="false">PT</button><button data-lang="es" lang="es" aria-pressed="false">ES</button>
        </div>
        <button class="burger" aria-expanded="false" aria-controls="drawer" aria-label="Menu"><span></span><span></span></button>
      </div>`;

    const drawer = document.createElement('div');
    drawer.className = 'drawer';
    drawer.id = 'drawer';
    drawer.innerHTML = `
      <nav aria-label="Mobile">
        <a href="${BASE}"><span>00</span><span data-i18n="nav.home">Home</span></a>
        ${LINKS.map(([h, l, k], i) => `<a href="${BASE}${h}"><span>0${i + 1}</span><span data-i18n="${k}">${l}</span></a>`).join('')}
      </nav>
      <div class="drawer__foot">
        <div class="lang" role="group" aria-label="Language">
          <button data-lang="en" lang="en" aria-pressed="false">EN</button><button data-lang="pt" lang="pt" aria-pressed="false">PT</button><button data-lang="es" lang="es" aria-pressed="false">ES</button>
        </div>
        <span>Brasil · <span class="clock">--:--</span></span>
      </div>`;

    const cta = document.createElement('section');
    cta.className = 'cta-band';
    cta.setAttribute('aria-label', 'Contact');
    cta.innerHTML = `
      <div class="cta-band__inner">
        <p class="eyebrow" data-i18n="cta.eyebrow">Book a free call</p>
        <h2 data-i18n="cta.title">Let’s build the <em>next thing</em> your business runs on</h2>
        <a class="btn" href="${BASE}contact/"><span data-i18n="cta.btn">Start a project</span><span class="arr">↘</span></a>
        <p class="cta-band__meta"><span data-i18n="cta.m1">30 min, free</span><span data-i18n="cta.m2">Fixed price in writing</span><span data-i18n="cta.m3">EN · PT · ES</span></p>
      </div>`;

    const footer = document.createElement('footer');
    footer.className = 'footer';
    footer.innerHTML = `
      <div class="footer__grid">
        <ul>${LINKS.slice(0, 3).map(([h, l, k]) => `<li><a class="link-u" href="${BASE}${h}" data-i18n="${k}">${l}</a></li>`).join('')}</ul>
        <ul>${LINKS.slice(3).map(([h, l, k]) => `<li><a class="link-u" href="${BASE}${h}" data-i18n="${k}">${l}</a></li>`).join('')}</ul>
        <ul>
          <li><a class="link-u" href="https://www.instagram.com/catta.studios/" target="_blank" rel="noopener">Instagram</a></li>
          <li><a class="link-u" href="https://github.com/berelels" target="_blank" rel="noopener">GitHub</a></li>
          <li><a class="link-u" href="https://www.linkedin.com/in/berelels/" target="_blank" rel="noopener">LinkedIn</a></li>
        </ul>
        <div class="footer__copy">
          <p>© ${new Date().getFullYear()} Catta Studios</p>
          <p data-i18n="footer.where">Made in Brasil, for clients anywhere.</p>
          <p><a class="link-u" href="mailto:gabrieldiasdev@proton.me">gabrieldiasdev@proton.me</a></p>
        </div>
      </div>
      <div class="footer__mark"><span class="footer__hint" aria-hidden="true" data-i18n="${touch ? 'footer.tap' : 'footer.hint'}">${touch ? 'tap the letters' : 'hover the letters'}</span></div>`;

    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<span class="cursor__label"><span class="cursor__text"></span></span>';

    const veil = document.createElement('div');
    veil.className = 'veil is-on';
    veil.setAttribute('aria-hidden', 'true');
    veil.innerHTML = '<div class="veil__stage"></div><span class="veil__where">Brasil · <span class="clock">--:--</span></span><span class="veil__count">000</span>';

    const wrapper = $('[data-barba="wrapper"]');
    document.body.prepend(veil, nav, drawer);
    wrapper.after(cta, footer);
    document.body.append(cursor);
  }

  /* ---------- relógio ---------- */
  function startClock() {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
    const tick = () => $$('.clock').forEach((c) => (c.textContent = fmt.format(new Date())));
    tick();
    setInterval(tick, 15000);
    Clock.tick = tick;
  }
  const Clock = { tick: () => {} };

  /* ---------- rolagem suave ---------- */
  let lenis = null;
  function startLenis() {
    if (reduce) return;
    lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true, anchors: { offset: -40 } });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollY_ = () => (lenis ? lenis.scroll : window.scrollY);

  /* ---------- menu: some ao descer, volta ao subir ---------- */
  function navBehaviour() {
    const nav = $('.nav');
    let last = 0;
    const onScroll = () => {
      const y = scrollY_();
      const dir = lenis ? lenis.direction : (y > last ? 1 : -1);
      if (!document.body.classList.contains('drawer-open')) {
        nav.classList.toggle('is-hidden', y > 140 && dir === 1);
        nav.classList.toggle('is-solid', y > 40);
      }
      last = y;
    };
    if (lenis) lenis.on('scroll', onScroll);
    else addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    Nav.onScroll = onScroll;
  }
  const Nav = { onScroll: () => {} };

  /* logo do menu: cada passada toca uma animação diferente */
  function logoHover() {
    const logo = $('.nav .logo');
    const cs = $$('.ch', logo);
    const letters = cs.filter((c) => !c.classList.contains('bs'));
    const bs = $('.bs', logo);
    const pool = '[]{}<>/\\_#*=;:~';
    let i = 0;
    let busy = false;
    const variants = [
      // onda
      () => gsap.timeline().to(cs, { yPercent: -38, duration: 0.22, ease: 'power2.out', stagger: 0.035 })
        .to(cs, { yPercent: 0, duration: 0.5, ease: 'bounce.out', stagger: 0.035 }, 0.2),
      // embaralha em símbolos de código
      () => {
        const tl = gsap.timeline();
        letters.forEach((c, n) => {
          const orig = c.textContent;
          const o = { p: 0 };
          tl.to(o, {
            p: 1, duration: 0.5, ease: 'none',
            onUpdate: () => { c.textContent = o.p < 0.92 ? pool[(Math.random() * pool.length) | 0] : orig; },
            onComplete: () => { c.textContent = orig; },
          }, n * 0.03);
        });
        return tl;
      },
      // a barra gira e as letras encolhem
      () => gsap.timeline()
        .to(bs, { rotate: 360, duration: 0.7, ease: 'snap' })
        .fromTo(letters, { scaleY: 1 }, { scaleY: 0.35, duration: 0.18, ease: 'power2.in', stagger: { each: 0.02, from: 'start' }, yoyo: true, repeat: 1 }, 0)
        .set(bs, { rotate: 0 }),
      // vira de cabeça para baixo, do centro para fora
      () => gsap.timeline().to(letters, { rotateX: 360, duration: 0.7, ease: 'power3.inOut', stagger: { each: 0.03, from: 'center' } })
        .set(letters, { rotateX: 0 }),
      // vira colchete: as letras somem e voltam de lado
      () => gsap.timeline()
        .to(letters, { xPercent: (n) => (n < 5 ? -60 : 60), opacity: 0, duration: 0.22, ease: 'power2.in', stagger: 0.015 })
        .to(bs, { scale: 1.35, duration: 0.22, ease: 'power2.out' }, 0)
        .to(letters, { xPercent: 0, opacity: 1, duration: 0.5, ease: 'snap', stagger: 0.02 })
        .to(bs, { scale: 1, duration: 0.4, ease: 'snap' }, '<'),
    ];
    logo.addEventListener('mouseenter', () => {
      if (busy || reduce) return;
      busy = true;
      variants[i % variants.length]().eventCallback('onComplete', () => (busy = false));
      i++;
    });
  }

  /* ---------- gaveta (celular) ---------- */
  function drawer() {
    const btn = $('.burger');
    const d = $('.drawer');
    const links = $$('nav a', d);
    let open = false;
    const set = (v) => {
      open = v;
      btn.setAttribute('aria-expanded', String(v));
      document.body.classList.toggle('drawer-open', v);
      if (v) {
        $('.nav').classList.remove('is-hidden');
        lenis && lenis.stop();
        gsap.set(d, { visibility: 'visible' });
        gsap.timeline()
          .to(d, { clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'power4.inOut' })
          .from(links, { yPercent: 60, opacity: 0, duration: 0.6, ease: 'expo.out', stagger: 0.05 }, 0.35);
      } else {
        lenis && lenis.start();
        gsap.to(d, { clipPath: 'inset(0 0 100% 0)', duration: 0.6, ease: 'power4.inOut', onComplete: () => gsap.set(d, { visibility: 'hidden' }) });
      }
    };
    btn.addEventListener('click', () => set(!open));
    Drawer.close = () => open && set(false);
    addEventListener('keydown', (e) => { if (e.key === 'Escape') Drawer.close(); });
  }
  const Drawer = { close: () => {} };

  /* ---------- cursor com rótulo ---------- */
  const Cursor = {
    init() {
      if (touch) return;
      this.el = $('.cursor');
      this.label = $('.cursor__label', this.el);
      this.text = $('.cursor__text', this.el);
      const xTo = gsap.quickTo(this.el, 'x', { duration: 0.6, ease: 'power3' });
      const yTo = gsap.quickTo(this.el, 'y', { duration: 0.6, ease: 'power3' });
      addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); });
      document.addEventListener('pointerover', (e) => {
        const t = e.target.closest('[data-cursor]');
        if (t === this.active) return;
        this.active = t;
        if (t) {
          this.text.textContent = Lang.t('cursor.' + t.dataset.cursor, t.dataset.cursorEn || t.dataset.cursor);
          gsap.to(this.label, { scale: 1, duration: 0.45, ease: 'back.out(2)' });
        } else {
          gsap.to(this.label, { scale: 0, duration: 0.3, ease: 'power2.in' });
        }
      });
    },
    hide() { if (this.label) { this.active = null; gsap.set(this.label, { scale: 0 }); } },
  };

  /* ---------- rodapé: cada letra vira outra coisa ---------- */
  // formas em caixa 0..100 (y para baixo), todas da linguagem da marca
  const SHAPES = (() => {
    const star = (() => {
      const pts = [];
      for (let k = 0; k < 16; k++) {
        const r = k % 2 ? 22 : 50;
        const a = (Math.PI * 2 * k) / 16 - Math.PI / 2;
        pts.push(`${(50 + r * Math.cos(a)).toFixed(1)} ${(50 + r * Math.sin(a)).toFixed(1)}`);
      }
      return 'M' + pts.join(' L') + ' Z';
    })();
    const circle = (cx, cy, r) =>
      `M${cx} ${cy - r} C${cx + r * 0.55} ${cy - r} ${cx + r} ${cy - r * 0.55} ${cx + r} ${cy} C${cx + r} ${cy + r * 0.55} ${cx + r * 0.55} ${cy + r} ${cx} ${cy + r} C${cx - r * 0.55} ${cy + r} ${cx - r} ${cy + r * 0.55} ${cx - r} ${cy} C${cx - r} ${cy - r * 0.55} ${cx - r * 0.55} ${cy - r} ${cx} ${cy - r} Z`;
    return [
      'M10 16 L90 16 L90 100 L10 100 Z', // cursor de terminal
      'M8 0 L44 0 L94 50 L44 100 L8 100 L58 50 Z', // >
      'M6 0 L42 0 L94 100 L58 100 Z', // a barra
      'M14 100 L14 0 L86 18 L86 32 L44 32 L44 84 L86 84 L86 100 Z', // [ com orelha
      'M8 34 L24 0 L40 24 Q50 21 60 24 L76 0 L92 34 C100 54 98 80 84 93 C72 102 28 102 16 93 C2 80 0 54 8 34 Z', // gato
      star, // asterisco
      'M74 0 L86 0 L86 12 L74 12 C62 12 58 16 58 26 L58 40 C58 46 54 50 46 50 C54 50 58 54 58 60 L58 74 C58 84 62 88 74 88 L86 88 L86 100 L74 100 C50 100 42 92 42 76 L42 62 C42 56 36 54 20 54 L20 46 C36 46 42 44 42 38 L42 24 C42 8 50 0 74 0 Z', // {
      'M50 0 L96 50 L50 100 L4 50 Z', // losango
      circle(50, 50, 48), // ponto
      `${circle(50, 70, 28)} ${circle(18, 34, 12)} ${circle(50, 18, 13)} ${circle(82, 34, 12)}`, // pata
      'M0 78 L100 78 L100 100 L0 100 Z', // _
    ];
  })();
  function fitShape(d, b) {
    const t = d.match(/[A-Za-z]|-?\d*\.?\d+/g);
    let out = '';
    let cmd = '';
    let xy = 0;
    for (const tok of t) {
      if (/[A-Za-z]/.test(tok)) { cmd = tok; out += tok; xy = 0; continue; }
      const v = parseFloat(tok);
      const isX = cmd !== 'V' && (cmd === 'H' || xy % 2 === 0);
      out += ' ' + (isX ? b.x + (v / 100) * b.width : b.y + (v / 100) * b.height).toFixed(1);
      xy++;
    }
    return out;
  }
  // desenha \catta studios letra por letra num SVG; cada item sabe a caixa onde as formas cabem
  const SVGNS = 'http://www.w3.org/2000/svg';
  function glyphSvg(host, data = window.CATTA_GLYPHS) {
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', data.viewBox);
    svg.setAttribute('aria-hidden', 'true');
    host.append(svg);
    const glyphs = document.createElementNS(SVGNS, 'g');
    svg.append(glyphs);
    const items = data.letters.map((l, n) => {
      const p = document.createElementNS(SVGNS, 'path');
      p.setAttribute('d', l.d);
      p.setAttribute('class', 'glyph' + (l.ch === '\\' ? ' is-bar' : ''));
      glyphs.append(p);
      return { p, d: l.d, n, k: (n * 4) % SHAPES.length };
    });
    items.forEach((it) => {
      const b = it.p.getBBox();
      // a forma ocupa a caixa da letra, com um mínimo de altura para as baixinhas
      const h = Math.max(b.height, 560);
      it.bbox = b;
      it.box = { x: b.x, y: b.y + b.height - h, width: b.width, height: h };
    });
    return { svg, items, vb: data.viewBox.split(' ').map(Number) };
  }

  // desloca um caminho SVG (absoluto) em x
  function offsetPath(d, dx) {
    let cmd = '';
    let xy = 0;
    return d.replace(/[A-Za-z]|-?\d*\.?\d+/g, (tok) => {
      if (/[A-Za-z]/.test(tok)) { cmd = tok; xy = 0; return tok; }
      const isX = cmd !== 'V' && (cmd === 'H' || xy % 2 === 0);
      xy++;
      return ' ' + (isX ? (parseFloat(tok) + dx).toFixed(1) : tok);
    });
  }
  // palavra em JetBrains Mono 800 com o tracking da assinatura; "\\" usa a barra do logo
  function wordData(word) {
    const F = window.CATTA_FONT;
    let x = 0;
    const letters = [];
    for (const ch of word.toLowerCase()) {
      if (ch === '\\') { letters.push({ ch, d: offsetPath(F.bar, x - 49) }); x += 545; continue; }
      const g = F.chars[ch];
      if (!g) { x += 545; continue; }
      letters.push({ ch, d: offsetPath(g.d, x) });
      x += g.w - F.track;
    }
    return { viewBox: `0 -830 ${x + 30} 1100`, letters, ratio: (x + 30) / 1100 };
  }
  // cada letra começa numa forma da marca, passa por outras e assenta na escrita
  function morphIn(items, { seed = 0, turns = 2, step = 0.22, stagger = 0.05 } = {}) {
    const pool = SHAPES.length;
    items.forEach((it, n) => it.p.setAttribute('d', fitShape(SHAPES[(n * 3 + seed) % pool], it.box)));
    const tl = gsap.timeline();
    items.forEach((it, n) => {
      const t0 = n * stagger;
      for (let k = 1; k <= turns; k++) {
        tl.to(it.p, { morphSVG: fitShape(SHAPES[(n * 3 + seed + k * 5) % pool], it.box), duration: step, ease: 'snap' }, t0 + k * step);
      }
      tl.to(it.p, { morphSVG: it.d, duration: 0.4, ease: 'snap' }, t0 + (turns + 1) * step);
    });
    return tl;
  }

  function footerMark() {
    const host = $('.footer__mark');
    if (!window.CATTA_GLYPHS || !host) return;
    const { svg, items, vb } = glyphSvg(host);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Catta Studios');
    svg.removeAttribute('aria-hidden');
    const hits = document.createElementNS(SVGNS, 'g');
    svg.append(hits);
    const [vx, vy, vw, vh] = vb;
    const ns = SVGNS;
    // faixas de toque: do meio de uma letra ao meio da próxima
    const boxes = items.map((it) => it.bbox);
    items.forEach((it, n) => {
      const b = boxes[n];
      const left = n === 0 ? vx : (boxes[n - 1].x + boxes[n - 1].width + b.x) / 2;
      const right = n === items.length - 1 ? vx + vw : (b.x + b.width + boxes[n + 1].x) / 2;
      const r = document.createElementNS(ns, 'rect');
      r.setAttribute('x', left);
      r.setAttribute('y', vy);
      r.setAttribute('width', right - left);
      r.setAttribute('height', vh);
      r.setAttribute('class', 'hit');
      hits.append(r);
      const box = it.box;
      const enter = () => gsap.to(it.p, { morphSVG: fitShape(SHAPES[it.k], box), duration: 0.32, ease: 'snap', overwrite: true });
      const leave = () => {
        gsap.to(it.p, { morphSVG: it.d, duration: 0.32, ease: 'snap', overwrite: true });
        it.k = (it.k + 1) % SHAPES.length;
      };
      if (touch) {
        r.addEventListener('pointerdown', () => { enter(); setTimeout(leave, 650); });
      } else {
        r.addEventListener('mouseenter', enter);
        r.addEventListener('mouseleave', leave);
      }
    });
    // entrada: as letras sobem uma a uma quando o rodapé aparece
    gsap.from(items.map((i) => i.p), {
      yPercent: 60, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.035,
      scrollTrigger: { trigger: host, start: 'top 95%' },
    });
  }

  /* ---------- véu: abertura e transição ---------- */
  const Veil = {
    el: null,
    stage: null,
    // borda de baixo do véu sobe como um líquido (p: 1 cobre tudo, 0 sumiu)
    clipFromBottom(p) {
      const W = innerWidth, H = innerHeight;
      const yl = H * p;
      const yr = H * Math.max(0, Math.min(1, p * 1.12 - 0.12));
      const b = H * 0.24 * Math.sin(Math.PI * p);
      return `path('M0 0 H${W} V${yr} C${W * 0.7} ${yr + b} ${W * 0.3} ${yl + b * 0.55} 0 ${yl} Z')`;
    },
    // borda de cima sobe a partir do chão (p: 0 vazio, 1 cobre tudo)
    clipFromFloor(p) {
      const W = innerWidth, H = innerHeight;
      const q = 1 - p;
      const yl = H * q;
      const yr = H * Math.max(0, Math.min(1, q * 1.12 - 0.12));
      const b = H * 0.2 * Math.sin(Math.PI * q);
      return `path('M0 ${yl} C${W * 0.3} ${yl - b * 0.55} ${W * 0.7} ${yr - b} ${W} ${yr} V${H} H0 Z')`;
    },
    init() {
      this.el = $('.veil');
      this.stage = $('.veil__stage', this.el);
      this.count = $('.veil__count', this.el);
    },
    seed: 0,
    // monta "\\palavra" no palco e devolve a animação das letras se formando
    word(label) {
      this.stage.innerHTML = '<div class="veil__word"></div>';
      const host = $('.veil__word', this.stage);
      const data = wordData('\\' + label);
      const { svg, items } = glyphSvg(host, data);
      const h = Math.min(innerWidth * 0.11, 150, (innerWidth * 0.86) / data.ratio);
      svg.style.height = `${h}px`;
      svg.style.width = `${h * data.ratio}px`;
      this.seed = (this.seed + 7) % SHAPES.length;
      return morphIn(items, { seed: this.seed });
    },
    async intro(label) {
      this.seed = Math.floor(Math.random() * SHAPES.length);
      const tl = this.word(label);
      const c = { v: 0 };
      tl.to(c, { v: 100, duration: tl.duration(), ease: 'power1.inOut', onUpdate: () => (this.count.textContent = String(Math.round(c.v)).padStart(3, '0')) }, 0);
      document.documentElement.classList.add('ready');
      await tl.then();
    },
    lift(delay = 0) {
      const p = { v: 1 };
      return gsap.timeline({ delay })
        .to(this.stage, { yPercent: -40, opacity: 0, duration: 0.9, ease: 'power3.in' }, 0)
        .to(p, {
          v: 0, duration: 1.05, ease: 'power3.inOut',
          onUpdate: () => (this.el.style.clipPath = this.clipFromBottom(p.v)),
          onComplete: () => {
            this.el.classList.remove('is-on');
            this.el.style.clipPath = '';
            gsap.set(this.stage, { yPercent: 0, opacity: 1 });
          },
        }, 0.1)
        .then();
    },
    cover(label) {
      const p = { v: 0 };
      this.el.style.clipPath = this.clipFromFloor(0);
      this.el.classList.add('is-on');
      if (!label) this.stage.innerHTML = '';
      const tl = gsap.timeline()
        .to(p, { v: 1, duration: label ? 0.8 : 0.7, ease: 'power3.inOut', onUpdate: () => (this.el.style.clipPath = this.clipFromFloor(p.v)) });
      if (label) tl.add(this.word(label), 0.3);
      return tl.then();
    },
  };

  /* =============================================
     MÓDULOS DE PÁGINA
     ============================================= */
  const Modules = {
    // linhas sobem por trás de uma máscara
    split(el) {
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'line',
        autoSplit: true,
        onSplit(self) {
          el.classList.add('is-split');
          const inHero = el.closest('.hero, .contact-hero');
          return gsap.from(self.lines, {
            yPercent: 115,
            duration: 1.15,
            ease: 'expo.out',
            stagger: 0.08,
            delay: inHero ? Page.heroDelay : 0,
            scrollTrigger: inHero ? undefined : { trigger: el, start: 'top 90%', once: true },
          });
        },
      });
    },
    fade(el) {
      const inHero = el.closest('.hero');
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', delay: inHero ? Page.heroDelay + 0.2 : 0,
        scrollTrigger: inHero ? undefined : { trigger: el, start: 'top 92%', once: true },
      });
    },
    speed(el) {
      const s = parseFloat(el.dataset.speed) || 0.1;
      gsap.fromTo(el, { yPercent: s * 100 }, { yPercent: -s * 100, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    },

    // frase presa com cards atravessando a tela
    cross(el) {
      const cards = $$('.cross__card', el);
      const a = $('.cross__a', el);
      const b = $('.cross__b', el);
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
      cards.forEach((c, n) => {
        const yOff = [-30, 18, -8, 26, -22, 10][n % 6];
        const rot = [-7, 5, -3, 8, -5, 4][n % 6];
        gsap.set(c, { yPercent: -50 + yOff, rotate: rot });
        tl.fromTo(c, { x: 0 }, { x: () => -(innerWidth + c.offsetWidth * 1.4), ease: 'none', duration: 1 }, n * 0.28);
      });
      const mid = tl.duration() * 0.5;
      tl.to(a, { yPercent: -100, opacity: 0, duration: 0.25, ease: 'power2.in' }, mid)
        .fromTo(b, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.25, ease: 'power2.out' }, mid + 0.1);
    },

    // lista editorial: nomes grandes; a capa do projeto segue o cursor
    plist(el) {
      const rows = $$('.plist__row', el);
      const prev = $('.plist__preview', el);
      const pvs = $$('.plist__pv', prev);
      if (touch || !prev) return;
      const xTo = gsap.quickTo(prev, 'x', { duration: 0.65, ease: 'power3' });
      const yTo = gsap.quickTo(prev, 'y', { duration: 0.65, ease: 'power3' });
      const rTo = gsap.quickTo(prev, 'rotation', { duration: 0.8, ease: 'power3' });
      let lx = 0;
      let ly = 0;
      // a prévia só existe com o cursor em cima de um projeto, mesmo se a página rolar
      const check = () => {
        const row = document.elementFromPoint(lx, ly)?.closest('.plist__row');
        show(row && el.contains(row) ? row.dataset.key : null);
      };
      const move = (e) => { xTo(e.clientX); yTo(e.clientY); rTo(gsap.utils.clamp(-10, 10, (e.clientX - lx) * 0.4)); lx = e.clientX; ly = e.clientY; check(); };
      gsap.set(prev, { xPercent: -50, yPercent: -50, scale: 0 });
      let cur = null;
      const show = (key) => {
        if (cur === key) return;
        cur = key;
        pvs.forEach((pv) => {
          const on = pv.dataset.key === key;
          gsap.to(pv, { opacity: on ? 1 : 0, scale: on ? 1 : 0.7, rotate: on ? 0 : -12, duration: on ? 0.5 : 0.25, ease: on ? 'snap' : 'power2.in', overwrite: true });
        });
        el.classList.toggle('is-hovering', !!key);
        rows.forEach((r) => r.classList.toggle('is-on', r.dataset.key === key));
        gsap.to(prev, { scale: key ? 1 : 0, duration: key ? 0.55 : 0.35, ease: key ? 'back.out(1.6)' : 'power2.in', overwrite: 'auto' });
      };
      addEventListener('pointermove', move);
      addEventListener('scroll', check, { passive: true });
      if (lenis) lenis.on('scroll', check);
      document.addEventListener('mouseleave', () => show(null));
      Page.cleanups.push(() => { removeEventListener('pointermove', move); removeEventListener('scroll', check); if (lenis) lenis.off('scroll', check); show(null); });
    },

    // serviços: a mídia da esquerda acompanha o item ativo
    services(el) {
      const media = $$('.svc__media .m', el);
      $$('.svc__item', el).forEach((it, n) => {
        ScrollTrigger.create({
          trigger: it, start: 'top 55%', end: 'bottom 55%',
          onToggle: (s) => s.isActive && media.forEach((m, k) => m.classList.toggle('is-on', k === n)),
        });
      });
    },

    // números flutuando sobre o título
    floaters(el) {
      $$('.floater', el).forEach((f, n) => {
        gsap.from(f, { opacity: 0, y: 60, rotate: n % 2 ? 6 : -6, duration: 1.2, ease: 'expo.out', delay: n * 0.12, scrollTrigger: { trigger: el, start: 'top 70%', once: true } });
        gsap.to(f, { yPercent: -(60 + n * 45), ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true } });
      });
      if (!touch) {
        const move = (e) => {
          const x = e.clientX / innerWidth - 0.5;
          const y = e.clientY / innerHeight - 0.5;
          $$('.floater', el).forEach((f, n) => gsap.to(f, { x: x * (16 + n * 10), y: y * (12 + n * 8), duration: 1, ease: 'power3.out' }));
        };
        addEventListener('pointermove', move);
        Page.cleanups.push(() => removeEventListener('pointermove', move));
      }
    },

    // processo: palavras ligadas por uma linha que se preenche
    timeline(el) {
      $$('.tl-line i', el).forEach((i) => gsap.to(i, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: i.parentElement, start: 'top 70%', end: 'bottom 45%', scrub: true } }));
      $$('.tl-step', el).forEach((s) => ScrollTrigger.create({ trigger: s, start: 'top 62%', onEnter: () => s.classList.add('is-on'), onLeaveBack: () => s.classList.remove('is-on') }));
    },

    tabs(el) {
      const tabs = $$('[role="tab"]', el);
      const panels = $$('[role="tabpanel"]', el);
      const select = (n, focus) => {
        tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === n)); t.tabIndex = k === n ? 0 : -1; });
        panels.forEach((p, k) => (p.hidden = k !== n));
        gsap.from(panels[n].children, { opacity: 0, y: 24, duration: 0.7, ease: 'expo.out', stagger: 0.06 });
        if (focus) tabs[n].focus();
        ScrollTrigger.refresh();
      };
      tabs.forEach((t, n) => {
        t.addEventListener('click', () => select(n));
        t.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); select((n + 1) % tabs.length, true); }
          if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); select((n - 1 + tabs.length) % tabs.length, true); }
        });
      });
    },

    // estúdio: imagens se espalham a partir do título
    showcase(el) {
      const imgs = $$('.showcase__img', el);
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: 0.8 } });
      imgs.forEach((im) => {
        const [x, y, w, r] = im.dataset.to.split(',').map(Number);
        gsap.set(im, { left: '50%', top: '50%', xPercent: -50, yPercent: -50, width: `${w}vw`, aspectRatio: im.dataset.ratio || '4/3', scale: 0.2, rotate: 0, opacity: 0 });
        tl.to(im, { x: `${x}vw`, y: `${y}vh`, scale: 1, rotate: r, opacity: 1, ease: 'power2.out', duration: 1 }, 0);
      });
      tl.to($('.showcase__title', el), { scale: 0.9, opacity: 0.25, duration: 0.6 }, 0.4);
    },

    // faixa de tecnologias: corre sozinha e acelera com o scroll
    ticker(el) {
      const track = $('.ticker__track', el);
      track.innerHTML += track.innerHTML;
      const tw = gsap.to(track, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
      if (lenis) {
        const onS = ({ velocity }) => gsap.to(tw, { timeScale: 1 + Math.min(Math.abs(velocity) / 6, 5), duration: 0.3, overwrite: true });
        lenis.on('scroll', onS);
        Page.cleanups.push(() => lenis.off('scroll', onS));
      }
    },

    acc(el) {
      $$('.acc__q', el).forEach((q) => {
        const a = q.nextElementSibling;
        q.addEventListener('click', () => {
          const open = q.getAttribute('aria-expanded') !== 'true';
          q.setAttribute('aria-expanded', String(open));
          gsap.to(a, { height: open ? 'auto' : 0, duration: 0.6, ease: 'power3.inOut', onComplete: () => ScrollTrigger.refresh() });
        });
      });
    },

    // formulário sem servidor: monta o e-mail
    form(el) {
      el.addEventListener('submit', (e) => {
        e.preventDefault();
        const f = new FormData(el);
        const kind = f.get('kind') || '';
        const subject = `[${kind}] ${f.get('company') || f.get('name') || ''}`.trim();
        const body = [
          `${Lang.t('form.name', 'Name')}: ${f.get('name') || ''}`,
          `Email: ${f.get('email') || ''}`,
          `${Lang.t('form.company', 'Company')}: ${f.get('company') || ''}`,
          `${Lang.t('form.budget', 'Budget')}: ${f.get('budget') || ''}`,
          '',
          f.get('message') || '',
        ].join('\n');
        location.href = `mailto:gabrieldiasdev@proton.me?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        const note = $('.note', el);
        if (note) note.textContent = Lang.t('form.sent', 'Your email app should open now. If it doesn’t, write to gabrieldiasdev@proton.me.');
      });
    },

    // topo da home: as letras passam por formas da marca até virar a escrita,
    // depois a câmera se afasta e o painel encaixa no lugar
    hhero(el) {
      const panel = $('.hhero__panel', el);
      const center = $('.hhero__center', el);
      const mark = $('.hhero__mark', el);
      $$('svg', mark).forEach((n) => n.remove());
      const { items } = glyphSvg(mark);
      const rest = [$('.nav'), $('.hhero__tag', el), $('.hhero__foot', el)];
      if (reduce || location.hash || Page.rebuilding) { Page.introDone = true; return; }
      lenis && lenis.stop();
      const fit = (innerWidth * 0.9) / center.offsetWidth;
      gsap.set(panel, { scale: 1.08, transformOrigin: '50% 0%' });
      gsap.set(center, { scale: Math.max(1, Math.min(1.18, fit)) });
      gsap.set(rest, { opacity: 0, y: 14 });
      const tl = gsap.timeline({ delay: Page.heroDelay });
      tl.add(morphIn(items, { turns: 3, step: 0.26, stagger: 0.06 }));
      tl.to(panel, { scale: 1, duration: 1.25, ease: 'expo.inOut' }, '+=0.25')
        .to(center, { scale: 1, duration: 1.25, ease: 'expo.inOut' }, '<')
        .to(rest, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 }, '-=0.45')
        .call(() => { lenis && lenis.start(); Page.introDone = true; Nav.onScroll(); });
      // quem tem pressa pula a animação
      const skip = () => tl.progress() < 1 && tl.progress(1);
      const evs = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
      evs.forEach((e) => addEventListener(e, skip, { passive: true, once: true }));
      Page.cleanups.push(() => { evs.forEach((e) => removeEventListener(e, skip)); lenis && lenis.start(); gsap.set($('.nav'), { clearProps: 'opacity,transform' }); });
    },

    // capas dos projetos: cada uma tem um loop próprio, que roda só na tela e acelera no hover
    cover(el) {
      if (reduce || el.closest('.plist__preview')) return;
      const make = COVERS[el.dataset.cover];
      if (!make) return;
      const tl = make(el).pause();
      ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onToggle: (st) => (st.isActive ? tl.play() : tl.pause()) });
      const host = el.closest('.card, .svc, .tabs__panel, .case-hero') || el;
      if (!touch) {
        const fast = () => gsap.to(tl, { timeScale: 2.2, duration: 0.4 });
        const slow = () => gsap.to(tl, { timeScale: 1, duration: 0.6 });
        host.addEventListener('mouseenter', fast);
        host.addEventListener('mouseleave', slow);
        Page.cleanups.push(() => { host.removeEventListener('mouseenter', fast); host.removeEventListener('mouseleave', slow); });
      }
      Page.cleanups.push(() => tl.kill());
    },

    // banner do case: produto × Catta Studios
    banner(el) {
      const a = $('.cb__a', el), b = $('.cb__b', el), x = $('.cb__x', el);
      const title = $('.cb__title', el), kind = $('.cb__kind', el);
      if (reduce) return;
      gsap.timeline({ delay: Page.heroDelay })
        .from(a, { xPercent: -160, rotate: -24, opacity: 0, duration: 1.1, ease: 'expo.out' })
        .from(b, { xPercent: 160, rotate: 24, opacity: 0, duration: 1.1, ease: 'expo.out' }, '<')
        .from(x, { scale: 0, rotate: -90, duration: 0.6, ease: 'back.out(2.4)' }, '-=0.6')
        .from([title, kind], { y: 26, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 }, '-=0.35');
      // ao passar o mouse, os ícones balançam
      const wig = () => gsap.fromTo([a, b], { rotate: 0 }, { rotate: (i) => (i ? 8 : -8), duration: 0.18, yoyo: true, repeat: 3, ease: 'sine.inOut' });
      $('.cb__lock', el).addEventListener('mouseenter', wig);
    },

    // capa do case: a mídia afasta e escurece enquanto o painel sobe
    casehero(el) {
      gsap.to(el.firstElementChild, { scale: 1.08, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top top', end: '+=100%', scrub: true } });
      gsap.from(el.firstElementChild, { scale: 1.2, duration: 1.6, ease: 'expo.out', delay: Page.heroDelay - 0.2 });
    },
  };

  /* ---------- animações das capas ---------- */
  const rnd = (a, b) => a + Math.random() * (b - a);
  const COVERS = {
    // barras do faturamento sobem e descem
    hermes(el) {
      const bars = $$('.pc-bars rect', el);
      gsap.set(bars, { transformOrigin: '50% 100%', scaleY: () => rnd(0.25, 0.9) });
      return gsap.timeline({ repeat: -1, repeatRefresh: true })
        .to(bars, { scaleY: () => rnd(0.2, 1), duration: 0.9, ease: 'power3.inOut', stagger: 0.05 })
        .to({}, { duration: 0.5 });
    },
    // um site se monta bloco a bloco
    web(el) {
      const blocks = $$('.pc-blocks > *', el);
      return gsap.timeline({ repeat: -1, repeatDelay: 1 })
        .fromTo(blocks, { opacity: 0, y: 24 }, { opacity: (i, b) => b.getAttribute('opacity') || 1, y: 0, duration: 0.5, ease: 'snap', stagger: 0.09 })
        .to(blocks, { opacity: 0, duration: 0.35, stagger: 0.03 }, '+=1.6');
    },
    // pulso contínuo e a fila de verificações ficando verde
    care(el) {
      const up = $('.pc-up', el);
      for (let i = 0; i < 24; i++) {
        const r = document.createElementNS(SVGNS, 'rect');
        r.setAttribute('x', 80 + i * 27); r.setAttribute('y', 380); r.setAttribute('width', 18); r.setAttribute('height', 56); r.setAttribute('rx', 3);
        up.append(r);
      }
      const pulse = $('.pc-pulse', el);
      const len = pulse.getTotalLength();
      gsap.set(pulse, { strokeDasharray: len, strokeDashoffset: len });
      return gsap.timeline({ repeat: -1 })
        .to(pulse, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' })
        .fromTo(up.children, { opacity: 0.15 }, { opacity: 1, duration: 0.2, stagger: 0.04 }, 0.2)
        .to(pulse, { strokeDashoffset: -len, duration: 1.2, ease: 'power2.in' }, '+=0.6')
        .to(up.children, { opacity: 0.15, duration: 0.3 }, '<');
    },
    // símbolos dos princípios abrem e fecham
    sym(el) {
      const l = $('.sl', el), r = $('.sr', el), m = $('.sm', el);
      const tl = gsap.timeline({ repeat: -1, yoyo: true, repeatDelay: 0.6 });
      if (r) tl.to([l, r], { x: (i) => (i ? 26 : -26), duration: 0.8, ease: 'snap' });
      else tl.to(l, { rotate: 14, duration: 0.8, ease: 'snap' });
      return tl.to(m, { opacity: 0.4, duration: 0.8 }, 0);
    },
  };

  /* =============================================
     CICLO DE PÁGINA
     ============================================= */
  const Page = {
    ctx: null,
    cleanups: [],
    heroDelay: 0,
    container: null,
    init(container) {
      this.container = container;
      const ns = container.dataset.barbaNamespace;
      document.body.className = document.body.className.replace(/\bns-\S+/g, '').trim();
      document.body.classList.add('ns-' + ns);
      if (container.dataset.dark != null) document.body.classList.add('ns-dark', 'is-dark');
      else document.body.classList.remove('is-dark');
      if (container.dataset.case != null) document.body.classList.add('ns-case');
      $$('.nav__links a').forEach((a) => {
        const u = new URL(a.href);
        const here = !u.hash && u.pathname !== BASE && location.pathname.startsWith(u.pathname);
        a.toggleAttribute('aria-current', here);
        if (here) a.setAttribute('aria-current', 'page');
      });
      Lang.apply(container);
      Clock.tick();
      if (container.dataset.title) setTitle(container.dataset.title);
      this.ctx = gsap.context(() => {
        $$('[data-split]', container).forEach(Modules.split);
        $$('[data-fade]', container).forEach(Modules.fade);
        $$('[data-speed]', container).forEach(Modules.speed);
        $$('[data-module]', container).forEach((el) => el.dataset.module.split(' ').forEach((m) => Modules[m] && Modules[m](el)));
        $$('[data-cover]', container).forEach(Modules.cover);
        // a faixa de chamada sobe por baixo da página
        gsap.fromTo($('.cta-band__inner'), { yPercent: 35 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: $('.cta-band'), start: 'top bottom', end: 'top 30%', scrub: true } });
      }, container);
      requestAnimationFrame(() => { ScrollTrigger.refresh(); Nav.onScroll(); });
    },
    destroy() {
      this.cleanups.forEach((f) => f());
      this.cleanups = [];
      this.ctx && this.ctx.revert();
      this.ctx = null;
    },
    rebuild() {
      if (!this.container) return;
      this.heroDelay = 0;
      this.rebuilding = true;
      this.destroy();
      this.init(this.container);
      this.rebuilding = false;
    },
  };

  /* =============================================
     PARTIDA
     ============================================= */
  async function boot() {
    buildChrome();
    Lang.value = Lang.detect();
    Lang.set(Lang.value, false);
    $$('.lang button').forEach((b) => b.addEventListener('click', () => Lang.set(b.dataset.lang)));
    startClock();
    Veil.init();
    startLenis();
    lenis && lenis.stop();
    navBehaviour();
    logoHover();
    drawer();
    Cursor.init();
    await document.fonts.ready;
    footerMark();

    const container = $('[data-barba="container"]');
    if (reduce) {
      Veil.el.classList.remove('is-on');
      document.documentElement.classList.add('ready');
      Page.heroDelay = 0;
      Page.init(container);
    } else if (container.dataset.barbaNamespace === 'home') {
      // o painel firmamento já é a abertura: o véu sai de cena sem onda
      Veil.el.classList.remove('is-on');
      document.documentElement.classList.add('ready');
      Page.heroDelay = 0.15;
      Page.init(container);
      goHash();
    } else {
      await Veil.intro(pageLabel(location.pathname));
      // a página se monta por baixo do véu e entra enquanto ele sobe
      Page.heroDelay = 0.5;
      Page.init(container);
      await Veil.lift(0.15);
    }
    document.body.classList.remove('is-loading');
    lenis && lenis.start();

    barba.init({
      preventRunning: true,
      prevent: ({ el, href }) => {
        const u = new URL(href, location.href);
        // âncora na mesma página: o Lenis rola até ela
        if (u.pathname === location.pathname && u.hash) return true;
        return el.target === '_blank' || el.hasAttribute('data-no-barba') || u.origin !== location.origin || /^(mailto|tel):/.test(href);
      },
      transitions: [{
        name: 'veil',
        async leave({ next }) {
          Drawer.close();
          Cursor.hide();
          const dest = new URL(next.url.href).pathname;
          const label = dest === BASE ? '' : pageLabel(dest);
          lenis && lenis.stop();
          await Veil.cover(label);
        },
        enter({ current, next }) {
          Page.destroy();
          if (current && current.container) current.container.remove();
          window.scrollTo(0, 0);
          lenis && lenis.scrollTo(0, { immediate: true, force: true });
          Page.heroDelay = 0.55;
          lenis && lenis.start();
          if (next.namespace === 'home') {
            // véu e painel têm a mesma cor: troca seca e a animação da home assume
            Page.heroDelay = 0.1;
            Page.init(next.container);
            Veil.el.classList.remove('is-on');
            Veil.el.style.clipPath = '';
            goHash();
            return;
          }
          Page.init(next.container);
          goHash();
          return Veil.lift(0.1);
        },
      }],
    });
  }

  // nome curto da página para a transição, no idioma atual
  const SHORT = { 'hermes-erp': 'hermes', 'linux-wallpaper-engine': 'wallpaper' };
  function pageLabel(pathname) {
    const slug = pathname.replace(BASE, '').replace(/\/$/, '').split('/').pop() || 'catta';
    return SHORT[slug] || Lang.t('slug.' + slug, slug);
  }

  function goHash() {
    const t = location.hash && document.querySelector(location.hash);
    if (!t) return;
    requestAnimationFrame(() => (lenis ? lenis.scrollTo(t, { immediate: true, force: true, offset: -40 }) : t.scrollIntoView()));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
