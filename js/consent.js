/* Aviso de cookies, só informativo. Independe do app.js: funciona mesmo se as animações não carregarem. */
(() => {
  const KEY = 'catta-cookie-notice';
  const lang = (location.pathname.match(/^\/(pt|es)\//) || [])[1] || 'en';
  const dict = (window.CATTA_I18N || {})[lang] || {};
  const EN = {
    'consent.text': 'This site uses no tracking cookies or analytics. It only keeps your language and that you closed this notice in your browser.',
    'consent.close': 'Close', 'consent.more': 'Learn more', 'consent.label': 'Cookie notice',
  };
  const t = (k) => dict[k] || EN[k];
  try { if (localStorage.getItem(KEY)) return; } catch (e) { /* sem armazenamento: mostra o aviso */ }

  function show() {
    const box = document.createElement('section');
    box.className = 'consent';
    box.setAttribute('aria-label', t('consent.label'));
    const base = lang === 'en' ? '/' : `/${lang}/`;
    box.innerHTML = `<p>${t('consent.text')} <a href="${base}privacy/">${t('consent.more')}</a></p>
      <div class="consent__row"><button type="button">${t('consent.close')}</button></div>`;
    box.querySelector('button').addEventListener('click', () => {
      try { localStorage.setItem(KEY, '1'); } catch (e) { /* sem armazenamento */ }
      box.remove();
    });
    // no início do body: quem navega por teclado chega nele primeiro
    document.body.prepend(box);
  }

  // espera a abertura terminar para não disputar atenção com ela
  const body = document.body;
  if (!body.classList.contains('is-loading')) return show();
  const mo = new MutationObserver(() => {
    if (body.classList.contains('is-loading')) return;
    mo.disconnect();
    clearTimeout(fallback);
    show();
  });
  const fallback = setTimeout(() => { mo.disconnect(); show(); }, 8000);
  mo.observe(body, { attributes: true, attributeFilter: ['class'] });
})();
