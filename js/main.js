// =============================================
// CATTA STUDIOS
// menu, tema, idiomas, marca cinética, saudação, rolagem com inércia,
// entrada no scroll, galeria horizontal e cursor
// =============================================

const root = document.documentElement;
root.classList.add('js');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const darkMq = matchMedia('(prefers-color-scheme: dark)');

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* sem armazenamento: segue sem lembrar */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* idem */ } },
};
const press = (seg, on) => seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === on)));
let dict = {};

// ── MENU: o hover é do CSS; clique, toque e teclado abrem pelo botão ──
const menu = document.getElementById('menu');
const mBtn = document.getElementById('menu-btn');
function setMenu(open) {
  menu.classList.toggle('open', open);
  mBtn.setAttribute('aria-expanded', String(open));
  mBtn.setAttribute('aria-label', open ? (dict['aria.menuClose'] || 'Fechar menu') : (dict['aria.menu'] || 'Abrir menu'));
}
mBtn.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
document.addEventListener('click', e => { if (!menu.contains(e.target)) setMenu(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
// escolher um capítulo fecha o painel, mesmo com o mouse ainda em cima dele
menu.querySelectorAll('.menu-nav a').forEach(a => a.addEventListener('click', () => {
  setMenu(false);
  menu.classList.add('suppress');
  menu.addEventListener('mouseleave', () => menu.classList.remove('suppress'), { once: true });
}));

// ── TEMA: Sistema segue o aparelho; Claro e Escuro sobrepõem e ficam lembrados ──
const THEME_KEY = 'gd-theme';
const segTheme = document.getElementById('seg-theme');
const savedTheme = store.get(THEME_KEY);
if (savedTheme === 'dark' || savedTheme === 'light') root.dataset.theme = savedTheme;
press(segTheme, segTheme.querySelector(`[data-set="${root.dataset.theme || 'system'}"]`));
segTheme.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.set === 'system') {
    delete root.dataset.theme;
    store.del(THEME_KEY);
  } else {
    root.dataset.theme = b.dataset.set;
    store.set(THEME_KEY, b.dataset.set);
  }
  press(segTheme, b);
});

// ── RELÓGIO: hora de Divinópolis ──
const clock = document.getElementById('clock');
const fmtHora = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
const tick = () => { clock.textContent = fmtHora.format(new Date()); };
tick();
setInterval(tick, 15000);

// ── MARCA: letras entrando por baixo de uma máscara ──
function splitChars(el, base) {
  const text = el.textContent.trim();
  el.textContent = '';
  let i = 0;
  let word = null;
  [...text].forEach(ch => {
    const s = document.createElement('span');
    s.className = ch === '\\' ? 'char slash' : 'char';
    s.textContent = ch;
    s.style.setProperty('--d', `${base + i++ * 0.04}s`);
    if (!word) {
      word = document.createElement('span');
      word.className = 'word';
      el.appendChild(word);
    }
    word.appendChild(s);
  });
}
if (!reduceMotion) document.querySelectorAll('[data-kinetic]').forEach((l, n) => splitChars(l, 0.1 + n * 0.18));

// ── SAUDAÇÃO: máquina de escrever passeando pelas línguas, sem seguir o idioma escolhido ──
const HELLOS = ['Olá', 'Hi', 'Hola', 'Ciao', 'Salut', 'Hallo', 'Привет', '你好', 'こんにちは', 'Γεια'];
const greet = document.getElementById('greeting');
if (!reduceMotion) {
  let gi = 0;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  (async function cycle() {
    for (;;) {
      await wait(1100);
      for (let n = [...greet.textContent].length; n > 0; n--) {
        greet.textContent = [...greet.textContent].slice(0, n - 1).join('');
        await wait(35);
      }
      gi = (gi + 1) % HELLOS.length;
      const chars = [...HELLOS[gi]];
      for (let n = 1; n <= chars.length; n++) {
        greet.textContent = chars.slice(0, n).join('');
        await wait(70);
      }
    }
  })();
}

// ── ROLAGEM COM INÉRCIA (Lenis); se o CDN falhar, a rolagem nativa segue funcionando ──
let lenis = null;
if (!reduceMotion && window.Lenis) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}
document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const t = document.querySelector(a.getAttribute('href'));
  if (!t) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(t);
  else t.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
}));

// ── ENTRADA NO SCROLL: só esconde o que começou fora da tela ──
if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.remove('pre');
      io.unobserve(e.target);
    }
  }), { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => {
    if (el.getBoundingClientRect().top > innerHeight) {
      el.classList.add('pre');
      io.observe(el);
    }
  });
}

// ── ABERTURA: a descrição só fica ao lado de \catta se couber sem encostar ──
const hero = document.querySelector('.hero');
const side = document.getElementById('hero-side');
const firstLine = document.querySelector('.mark-line');
function fitHero() {
  hero.classList.remove('stacked');
  if (innerWidth < 820) return;
  const r = document.createRange();
  r.selectNodeContents(firstLine);
  if (r.getBoundingClientRect().right + 24 > side.getBoundingClientRect().left) hero.classList.add('stacked');
}
addEventListener('resize', fitHero);
document.fonts?.ready.then(fitHero);

// ── GALERIA: no desktop a seção trava e o trilho corre na horizontal ──
const gallery = document.getElementById('projetos');
const track = document.getElementById('g-track');
const vp = document.getElementById('g-viewport');
const bar = document.getElementById('g-bar');
const count = document.getElementById('g-count');
const hint = document.getElementById('g-hint');
const cards = track.children.length;
const pinMq = matchMedia('(min-width: 900px)');
let dist = 0;

// a barra persegue o progresso com suavidade; o número rola quando o card muda
let target = 0;
let shown = 0;
let current = 1;
document.getElementById('g-total').textContent = String(cards).padStart(2, '0');
function setProgress(p) {
  target = p;
  const idx = Math.min(cards, Math.round(p * (cards - 1)) + 1);
  if (idx === current) return;
  const down = idx > current;
  current = idx;
  count.textContent = String(idx).padStart(2, '0');
  if (!reduceMotion) count.animate(
    [{ transform: `translateY(${down ? 70 : -70}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }],
    { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)' });
}
(function smoothBar() {
  shown += (target - shown) * (reduceMotion ? 1 : 0.14);
  if (Math.abs(target - shown) < 0.0005) shown = target;
  bar.style.transform = `scaleX(${shown})`;
  requestAnimationFrame(smoothBar);
})();

function layout() {
  const pin = pinMq.matches && !reduceMotion;
  root.classList.toggle('pin', pin);
  hint.textContent = pin ? (dict['gallery.scroll'] || 'Role para navegar →') : (dict['gallery.drag'] || 'Arraste para o lado →');
  track.style.transform = '';
  if (pin) {
    dist = Math.max(0, track.scrollWidth - innerWidth);
    gallery.style.height = (dist + innerHeight) + 'px';
  } else {
    gallery.style.height = '';
  }
  onScroll();
}
function onScroll() {
  if (root.classList.contains('pin')) {
    const p = dist ? Math.min(1, Math.max(0, (scrollY - gallery.offsetTop) / dist)) : 0;
    track.style.transform = `translate3d(${-p * dist}px,0,0)`;
    setProgress(p);
  } else {
    const max = vp.scrollWidth - vp.clientWidth;
    setProgress(max > 0 ? vp.scrollLeft / max : 0);
  }
}
addEventListener('scroll', onScroll, { passive: true });
vp.addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', layout);
pinMq.addEventListener('change', layout);
document.fonts?.ready.then(layout);

// clicar no card (fora dos botões) abre o link principal dele
document.querySelectorAll('.project:not(.others)').forEach(card => card.addEventListener('click', e => {
  if (e.target.closest('a, button')) return;
  card.querySelector('.btn')?.click();
}));

// ── CURSOR: ponto segue na hora, anel vai atrás com inércia; só com mouse ──
if (matchMedia('(pointer: fine)').matches) {
  root.classList.add('cursor-on');
  const dot = document.getElementById('c-dot');
  const ring = document.getElementById('c-ring');
  let mx = innerWidth / 2;
  let my = innerHeight / 2;
  let rx = mx;
  let ry = my;
  const k = reduceMotion ? 1 : 0.18;
  addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
    root.classList.remove('cur-out');
  });
  document.addEventListener('mouseleave', () => root.classList.add('cur-out'));
  // o estado do anel vem do que está sob o ponteiro, recalculado também ao rolar,
  // porque na galeria os cards passam por baixo do mouse parado
  let lastEl = null;
  const hoverAt = (x, y) => {
    const el = document.elementFromPoint(x, y);
    if (el === lastEl) return;
    lastEl = el;
    const link = el && el.closest('a, button');
    const card = el && !link && el.closest('.project:not(.others)');
    root.classList.toggle('cur-link', !!link);
    root.classList.toggle('cur-card', !!card);
  };
  document.addEventListener('mouseover', e => hoverAt(e.clientX, e.clientY));
  addEventListener('scroll', () => hoverAt(mx, my), { passive: true });
  (function follow() {
    rx += (mx - rx) * k;
    ry += (my - ry) * k;
    ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
    requestAnimationFrame(follow);
  })();
}

// ── IDIOMAS ──
const I18N = {
  pt: {
    "nav.home": "Início", "nav.studio": "Estúdio", "nav.projects": "Projetos", "nav.stack": "Stack", "nav.contact": "Contato",
    "menu.lang": "Idioma", "menu.theme": "Tema",
    "theme.system": "Sistema", "theme.light": "Claro", "theme.dark": "Escuro",

    "hero.weare": ", nós somos",
    "hero.desc": "Estúdio independente de software. Apps, sistemas de gestão e ferramentas sob medida, feitos por quem responde por cada linha.",
    "hero.scroll": "Role para baixo",
    "hero.cta": "Vamos conversar?",

    "about.title": "Estúdio pequeno, software que aguenta o dia a dia.",
    "about.lead": "A Catta Studios é um estúdio independente tocado por Gabriel Dias, em Divinópolis, MG. Começou em automação e administração de Linux e virou um lugar de construir app e sistema que gente de verdade usa no trabalho.",
    "about.p2": "Trabalhamos com arquitetura MVC, banco de dados local e em nuvem, relatórios em PDF, APIs RESTful e interfaces em Python, React e TypeScript. Também entregamos sistemas web completos com JavaScript, PHP e PostgreSQL.",
    "about.p3": "Por trás do estúdio tem um técnico em informática formado pelo Senac Minas, com a mania de só entregar o que ele mesmo usaria.",
    "about.fact1": "anos construindo software",
    "about.fact3": "idiomas",

    "projects.title": "O que saiu daqui.",
    "gallery.scroll": "Role para navegar →",
    "gallery.drag": "Arraste para o lado →",
    "project.site": "Ver o site",
    "openalt.kind": "PC + Android",
    "openalt.desc": "Transforma o celular ou tablet num segundo monitor do PC, ou num espelho dele. Em casa pelo Wi-Fi e fora de casa pelo seu próprio Tailscale. Um QR code e está pronto.",
    "openalt.credit": "Em prévia. Código aberto, GPL. Usa o Sunshine e um fork do Moonlight.",
    "pauca.kind": "Launcher Android",
    "pauca.desc": "Uma tela inicial que não disputa a sua atenção. Só texto, em cartões, com os nomes que você escolher, e um modo foco que silencia o celular de verdade. Na Play Store.",
    "pauca.credit": "Fork do Olauncher, GPL.",
    "lwe.kind": "Script para Linux",
    "lwe.desc": "Wallpapers animados da Steam Workshop rodando nativos no GNOME com X11, sem passar pelo Windows. Funciona no Zorin OS, no Ubuntu e nas derivadas.",
    "lwe.credit": "Código aberto, MIT.",
    "others.title": "Outros projetos",
    "others.all": "Tudo no GitHub",

    "stack.title": "Com o que a gente trabalha.",
    "stack.g1": "Linguagens", "stack.g2": "Interfaces", "stack.g3": "Dados e back-end", "stack.g4": "Ambiente",

    "contact.title": "Vamos conversar?",
    "contact.sub": "Aberto a parcerias, projetos sob medida e colaborações.",

    "footer.made": "Feito com carinho por",
    "footer.source": "Código fonte",
    "cursor.view": "VER",

    "aria.nav": "Capítulos", "aria.menu": "Abrir menu", "aria.menuClose": "Fechar menu", "aria.tags": "Tecnologias",
  },

  en: {
    "nav.home": "Home", "nav.studio": "Studio", "nav.projects": "Projects", "nav.stack": "Stack", "nav.contact": "Contact",
    "menu.lang": "Language", "menu.theme": "Theme",
    "theme.system": "System", "theme.light": "Light", "theme.dark": "Dark",

    "hero.weare": ", we are",
    "hero.desc": "An independent software studio. Apps, management systems and custom tools, made by someone who answers for every line.",
    "hero.scroll": "Scroll down",
    "hero.cta": "Shall we talk?",

    "about.title": "A small studio, software that holds up every day.",
    "about.lead": "Catta Studios is an independent studio run by Gabriel Dias, in Divinópolis, MG. It started in automation and Linux administration and grew into a place for building apps and systems that real people use at work.",
    "about.p2": "We work with MVC architecture, local and cloud databases, PDF reports, RESTful APIs and interfaces in Python, React and TypeScript. We also deliver complete web systems with JavaScript, PHP and PostgreSQL.",
    "about.p3": "Behind the studio is an IT technician trained at Senac Minas, with a habit of only shipping what he would use himself.",
    "about.fact1": "years building software",
    "about.fact3": "languages",

    "projects.title": "What came out of here.",
    "gallery.scroll": "Scroll to browse →",
    "gallery.drag": "Swipe sideways →",
    "project.site": "Visit the site",
    "openalt.kind": "PC + Android",
    "openalt.desc": "Turns your phone or tablet into a second monitor for your PC, or a mirror of it. At home over Wi-Fi, away from home over your own Tailscale. One QR code and you're set.",
    "openalt.credit": "Early preview. Open source, GPL. Built on Sunshine and a Moonlight fork.",
    "pauca.kind": "Android launcher",
    "pauca.desc": "A home screen that doesn't compete for your attention. Text only, in cards, with the names you choose, and a focus mode that actually quiets your phone. On the Play Store.",
    "pauca.credit": "An Olauncher fork, GPL.",
    "lwe.kind": "Linux script",
    "lwe.desc": "Animated Steam Workshop wallpapers running natively on GNOME with X11, no Windows needed. Works on Zorin OS, Ubuntu and their derivatives.",
    "lwe.credit": "Open source, MIT.",
    "others.title": "Other projects",
    "others.all": "Everything on GitHub",

    "stack.title": "What we work with.",
    "stack.g1": "Languages", "stack.g2": "Interfaces", "stack.g3": "Data and back-end", "stack.g4": "Environment",

    "contact.title": "Shall we talk?",
    "contact.sub": "Open to partnerships, custom projects and collaborations.",

    "footer.made": "Made with care by",
    "footer.source": "Source code",
    "cursor.view": "VIEW",

    "aria.nav": "Chapters", "aria.menu": "Open menu", "aria.menuClose": "Close menu", "aria.tags": "Technologies",
  },

  es: {
    "nav.home": "Inicio", "nav.studio": "Estudio", "nav.projects": "Proyectos", "nav.stack": "Stack", "nav.contact": "Contacto",
    "menu.lang": "Idioma", "menu.theme": "Tema",
    "theme.system": "Sistema", "theme.light": "Claro", "theme.dark": "Oscuro",

    "hero.weare": ", somos",
    "hero.desc": "Estudio independiente de software. Apps, sistemas de gestión y herramientas a medida, hechos por alguien que responde por cada línea.",
    "hero.scroll": "Desliza hacia abajo",
    "hero.cta": "¿Hablamos?",

    "about.title": "Estudio pequeño, software que aguanta el día a día.",
    "about.lead": "Catta Studios es un estudio independiente llevado por Gabriel Dias, en Divinópolis, MG. Empezó en automatización y administración de Linux y se volvió un lugar para construir apps y sistemas que gente de verdad usa en el trabajo.",
    "about.p2": "Trabajamos con arquitectura MVC, bases de datos locales y en la nube, informes en PDF, APIs RESTful e interfaces en Python, React y TypeScript. También entregamos sistemas web completos con JavaScript, PHP y PostgreSQL.",
    "about.p3": "Detrás del estudio hay un técnico en informática formado en Senac Minas, con la manía de entregar solo lo que él mismo usaría.",
    "about.fact1": "años construyendo software",
    "about.fact3": "idiomas",

    "projects.title": "Lo que salió de aquí.",
    "gallery.scroll": "Desliza para navegar →",
    "gallery.drag": "Arrastra hacia el lado →",
    "project.site": "Ver el sitio",
    "openalt.kind": "PC + Android",
    "openalt.desc": "Convierte tu celular o tablet en un segundo monitor del PC, o en un espejo de él. En casa por Wi-Fi y fuera de casa por tu propio Tailscale. Un código QR y listo.",
    "openalt.credit": "En vista previa. Código abierto, GPL. Usa Sunshine y un fork de Moonlight.",
    "pauca.kind": "Launcher Android",
    "pauca.desc": "Una pantalla de inicio que no compite por tu atención. Solo texto, en tarjetas, con los nombres que elijas, y un modo foco que silencia el celular de verdad. En Play Store.",
    "pauca.credit": "Fork de Olauncher, GPL.",
    "lwe.kind": "Script para Linux",
    "lwe.desc": "Wallpapers animados de Steam Workshop corriendo de forma nativa en GNOME con X11, sin pasar por Windows. Funciona en Zorin OS, Ubuntu y derivadas.",
    "lwe.credit": "Código abierto, MIT.",
    "others.title": "Otros proyectos",
    "others.all": "Todo en GitHub",

    "stack.title": "Con qué trabajamos.",
    "stack.g1": "Lenguajes", "stack.g2": "Interfaces", "stack.g3": "Datos y back-end", "stack.g4": "Entorno",

    "contact.title": "¿Hablamos?",
    "contact.sub": "Abiertos a alianzas, proyectos a medida y colaboraciones.",

    "footer.made": "Hecho con cariño por",
    "footer.source": "Código fuente",
    "cursor.view": "VER",

    "aria.nav": "Capítulos", "aria.menu": "Abrir menú", "aria.menuClose": "Cerrar menú", "aria.tags": "Tecnologías",
  },
};

const HTML_LANG = { pt: 'pt-BR', en: 'en', es: 'es' };
const segLang = document.getElementById('seg-lang');

// título do contato: cada palavra vira um bloco, com vão fixo entre elas
function wordsToSpans(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  words.forEach((w, i) => {
    if (i) el.append(' ');
    const s = document.createElement('span');
    s.textContent = w;
    el.appendChild(s);
  });
}

function applyLang(lang) {
  dict = I18N[lang] || I18N.pt;
  root.lang = HTML_LANG[lang] || 'pt-BR';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = dict[el.dataset.i18n];
    if (v != null) el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const v = dict[el.dataset.i18nAria];
    if (v != null) el.setAttribute('aria-label', v);
  });
  document.querySelectorAll('[data-words]').forEach(wordsToSpans);
  press(segLang, segLang.querySelector(`[data-lang="${lang}"]`));
  setMenu(menu.classList.contains('open'));
  layout();
  fitHero();
}

segLang.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  store.set('gd-lang', b.dataset.lang);
  applyLang(b.dataset.lang);
});

const savedLang = store.get('gd-lang');
const browserLang = (navigator.language || 'pt').slice(0, 2);
applyLang(savedLang || (I18N[browserLang] ? browserLang : 'pt'));
