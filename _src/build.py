#!/usr/bin/env python3
"""Monta as páginas do site: cabeçalho comum + corpo de cada página (pages/*.html).

Uso: python3 _src/build.py   (grava os index.html na raiz, em /pt/ e /es/, e o sitemap.xml)
Pedaços repetidos ficam em parts/ e entram com {{nome}}.
PT e ES saem do js/i18n.js, então precisa de node e de python3-bs4."""
import base64, datetime, hashlib, html as htmllib, json, pathlib, re, subprocess, sys, time
import warnings
from bs4 import BeautifulSoup, MarkupResemblesLocatorWarning
warnings.filterwarnings('ignore', category=MarkupResemblesLocatorWarning)  # traduções curtas parecem nome de arquivo
V = str(int(time.time()))

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parent
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT
SITE = 'https://cattastudios.com.br'
LANGS = {'en': ('en', 'en_US', ''), 'pt': ('pt-BR', 'pt_BR', '/pt'), 'es': ('es', 'es_ES', '/es')}
I18N = json.loads(subprocess.check_output(['node', '-e', "global.window={};require(process.argv[1]);console.log(JSON.stringify(window.CATTA_I18N))", str((ROOT / 'js/i18n.js').resolve())]))

# Sem JavaScript o site continua inteiro; se os scripts de CDN falharem (SRI, rede), a cortina sai.
BOOT = ("(function(d,l){d.classList.add('js');addEventListener('load',function(){if(!window.gsap){d.classList.remove('js');document.body.classList.remove('is-loading')}});"
        "try{var p=l.pathname;if(/^\\/(pt|es)\\//.test(p))return;var s=localStorage.getItem('catta-lang');"
        "if(!s&&!/bot|crawl|spider|slurp/i.test(navigator.userAgent)){var b=(navigator.language||'').slice(0,2);if(b=='pt'||b=='es')s=b}"
        "if(s=='pt'||s=='es')l.replace('/'+s+p+l.search+l.hash)}catch(e){}})(document.documentElement,location)")
BOOT_HASH = base64.b64encode(hashlib.sha256(BOOT.encode()).digest()).decode()
CSP = ("default-src 'self'; script-src 'self' https://cdn.jsdelivr.net 'sha256-" + BOOT_HASH + "'; "
       "style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; "
       "object-src 'none'; base-uri 'self'; form-action 'self' mailto:")

HEAD = '''<!DOCTYPE html>
<html lang="{htmllang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta http-equiv="Content-Security-Policy" content="{csp}" />
  <meta name="referrer" content="strict-origin-when-cross-origin" />
  <title>{title}</title>
  <meta name="description" content="{desc}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  <link rel="canonical" href="{url}" />
{alternates}
  <meta name="theme-color" content="#3f6ca8" />
  <meta name="color-scheme" content="light" />
  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{desc}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="{url}" />
  <meta property="og:site_name" content="Catta Studios" />
  <meta property="og:locale" content="{locale}" />
  <meta property="og:image" content="https://cattastudios.com.br/assets/img/og/{og}.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="{title}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{title}" />
  <meta name="twitter:description" content="{desc}" />
  <meta name="twitter:image" content="https://cattastudios.com.br/assets/img/og/{og}.jpg" />
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="icon" type="image/png" href="/assets/brand/icone-32.png" sizes="32x32" />
  <link rel="apple-touch-icon" href="/assets/brand/icone-180.png" />
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
  <link rel="preload" href="/assets/fonts/inter-Regular.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/assets/fonts/jetbrains-mono-Bold.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="/css/style.css?v={v}" />
  <script>{boot}</script>
  <script type="application/ld+json">{ld}</script>
</head>
<body class="is-loading">
  <noscript><nav class="noscript-nav" aria-label="Main">{nav}</nav></noscript>
  <div data-barba="wrapper">
'''

CDN = [
    ('https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js', 'HOvlOYPIs/zjoIkWUGXkVmXsjr8GuZLV+Q+rcPwmJOVZVpvTSXQChiN4t9Euv9Vc'),
    ('https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js', 'P8VzCVnT9NBUkMrpcIZrJbA7EBjJvh/fJS6PmP+4nLIM284DtsImIv8D0fFjIkeh'),
    ('https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js', 'xb96EMJeax+NLXMC88ZBa1xAeAW+kn+horHh/zFlbMLG2UPWhMJJSlv7fi57hS+Q'),
    ('https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/MorphSVGPlugin.min.js', '8oj95/2bNit2rlOOsJCaGBxSngfBWjoyQ8MtNbxmuk0v0B2nAK3Bwb1OJ5fWMWlk'),
    ('https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/CustomEase.min.js', 'JCMGAgtMgo/19ttIm8BSnUFxOA5KAxaKT7jZdTDtaL0df8+CHKRo9XFCmhsvUlXG'),
    ('https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/Flip.min.js', 'lg3+EgIwmxYq9YD4ix279pdUEasqmOS17fF+2mI/NEg6JHkawYaWYpJ6nKZenPOy'),
    ('https://cdn.jsdelivr.net/npm/lenis@1.3.4/dist/lenis.min.js', 'FKTX0CNJ8ngN1oGMBReVu7mvjTJyjFiD5etb1NKnYxc+8eFI2O0KWnksTN+oTFcu'),
    ('https://cdn.jsdelivr.net/npm/@barba/core@2.10.3/dist/barba.umd.js', 'T3/AkZI+fU7l5Ip18n7KLEi8r0LPLwiyIp0+anP6LuGlXmAwDS6l6YhmhJjiki/x'),
]
FOOT = '  </div>\n  <noscript><footer class="noscript-nav">{nav}<a href="mailto:gabrieldiasdev@proton.me">gabrieldiasdev@proton.me</a></footer></noscript>\n' + ''.join(
    f'  <script defer src="{u}" integrity="sha384-{h}" crossorigin="anonymous"></script>\n' for u, h in CDN) + '''  <script defer src="/js/i18n.js?v={v}"></script>
  <script defer src="/js/consent.js?v={v}"></script>
  <script defer src="/js/glyphs.js?v={v}"></script>
  <script defer src="/js/app.js?v={v}"></script>
</body>
</html>
'''

PARTS = {p.stem: p.read_text() for p in (HERE / 'parts').glob('*.html')}
ORG = {
    '@type': 'ProfessionalService', '@id': SITE + '/#org', 'name': 'Catta Studios', 'url': SITE + '/',
    'logo': SITE + '/assets/brand/icone-180.png', 'image': SITE + '/assets/img/og/default.jpg',
    'email': 'gabrieldiasdev@proton.me', 'areaServed': {'@type': 'Place', 'name': 'Worldwide'}, 'knowsLanguage': ['en', 'pt', 'es'],
    'address': {'@type': 'PostalAddress', 'addressLocality': 'Divinópolis', 'addressRegion': 'MG', 'addressCountry': 'BR'},
    'founder': {'@type': 'Person', '@id': SITE + '/studio/#gabriel', 'name': 'Gabriel Dias', 'jobTitle': 'Founder and developer', 'sameAs': ['https://github.com/berelels', 'https://www.linkedin.com/in/berelels/']},
    'sameAs': ['https://www.instagram.com/catta.studios/', 'https://github.com/berelels', 'https://www.linkedin.com/in/berelels/'],
}
APPS = {
    'hermes': {'@type': 'SoftwareApplication', 'name': 'Hermes ERP', 'applicationCategory': 'BusinessApplication', 'operatingSystem': 'Web', 'softwareVersion': 'beta', 'url': 'https://grupohermes.com.br/'},
    'openalt': {'@type': 'SoftwareApplication', 'name': 'OpenAlt', 'applicationCategory': 'UtilitiesApplication', 'operatingSystem': 'Linux, Android', 'url': SITE + '/openalt-releases/', 'codeRepository': 'https://github.com/berelels/openalt-releases', 'license': 'GPL'},
    'pauca': {'@type': 'MobileApplication', 'name': 'Pauca', 'applicationCategory': 'LifestyleApplication', 'operatingSystem': 'Android', 'url': SITE + '/pauca/', 'installUrl': 'https://play.google.com/store/apps/details?id=app.pauca', 'codeRepository': 'https://github.com/berelels/pauca', 'license': 'GPL'},
    'lwe': {'@type': 'SoftwareApplication', 'name': 'Linux Wallpaper Engine', 'applicationCategory': 'UtilitiesApplication', 'operatingSystem': 'Linux (GNOME on X11)', 'url': 'https://github.com/berelels/linux-wallpaper-engine-gnome-xorg', 'codeRepository': 'https://github.com/berelels/linux-wallpaper-engine-gnome-xorg', 'license': 'MIT'},
}
PRICES = {'USD': (1000, 5000, 90), 'BRL': (3200, 15000, 290)}


def expand(s):
    # {{nome}} puxa um pedaço de parts/
    for _ in range(3):
        s = re.sub(r'\{\{(\w[\w-]*)\}\}', lambda m: PARTS[m.group(1)].strip(), s)
    return s


def translate(body, lang):
    """Aplica o dicionário do idioma ao HTML, o mesmo que o Lang.apply faz no navegador."""
    d = I18N[lang]
    soup = BeautifulSoup(body, 'html.parser')
    for el in soup.select('[data-i18n]'):
        v = d.get(el['data-i18n'])
        if v is not None:
            el.clear()
            el.append(BeautifulSoup(v, 'html.parser'))
    for el in soup.select('[data-i18n-attr]'):
        for pair in el['data-i18n-attr'].split(';'):
            attr, key = pair.split(':')
            if key in d:
                el[attr] = d[key]
    for a in soup.select('a[href^="/"]'):
        if not a['href'].startswith(('/assets', '/.well-known')):
            a['href'] = f'/{lang}' + a['href']
    return str(soup)


def schema(key, path, url, title, desc, lang, body, nav):
    graph = [ORG, {'@type': 'WebSite', '@id': SITE + '/#site', 'url': SITE + '/', 'name': 'Catta Studios', 'publisher': {'@id': SITE + '/#org'}, 'inLanguage': ['en', 'pt-BR', 'es']},
             {'@type': 'WebPage', '@id': url, 'url': url, 'name': title, 'description': desc, 'inLanguage': LANGS[lang][0], 'isPartOf': {'@id': SITE + '/#site'}, 'about': {'@id': SITE + '/#org'}}]
    pfx = LANGS[lang][2]
    if key in APPS:
        graph.append({**APPS[key], 'description': desc, 'author': {'@id': SITE + '/#org'}})
        crumbs = [(nav['nav.home'], '/'), (nav['nav.work'], '/work/'), (title.split(' · ')[0], path)]
        graph.append({'@type': 'BreadcrumbList', 'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': SITE + pfx + p} for i, (n, p) in enumerate(crumbs)]})
    if key == 'services':
        cur = 'BRL' if lang == 'pt' else 'USD'
        soup = BeautifulSoup(body, 'html.parser')
        names = {i: soup.select_one(f'#{i} .svc__title').get_text('', strip=True).strip('[]') for i in ('websites', 'systems', 'care')}
        for i, price in zip(('websites', 'systems', 'care'), PRICES[cur]):
            spec = {'@type': 'UnitPriceSpecification', 'minPrice': price, 'priceCurrency': cur}
            if i == 'care':
                spec['unitText'] = 'MONTH'
            graph.append({'@type': 'Service', 'name': names[i], 'serviceType': names[i], 'description': soup.select_one(f'#{i} .svc__desc').get_text(), 'provider': {'@id': SITE + '/#org'}, 'areaServed': {'@type': 'Place', 'name': 'Worldwide'},
                          'offers': {'@type': 'Offer', 'url': url + '#' + i, 'priceCurrency': cur, 'priceSpecification': spec}})
    if key == 'contact':
        soup = BeautifulSoup(body, 'html.parser')
        graph.append({'@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': it.select_one('.acc__q').get_text(strip=True), 'acceptedAnswer': {'@type': 'Answer', 'text': it.select_one('.acc__a').get_text(strip=True)}} for it in soup.select('.faq .acc__item')]})
    # "<" escapado: o JSON fica dentro de uma tag <script>
    return json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False).replace('<', '\\u003c')


def lastmod(f):
    """Data do último commit da fonte; hoje, se ela tem mudança ainda não publicada."""
    rel = f.relative_to(ROOT)
    run = lambda *a: subprocess.run(['git', '-C', str(ROOT), *a, '--', str(rel)], capture_output=True, text=True).stdout.strip()
    return (not run('status', '--porcelain') and run('log', '-1', '--format=%cs')) or datetime.date.today().isoformat()


urls = []
for f in sorted((HERE / 'pages').glob('*.html')):
    raw = f.read_text()
    meta, body = raw.split('\n---\n', 1)
    m = dict(line.split(': ', 1) for line in meta.strip().splitlines())
    path = m['path']
    key = re.search(r'data-title="(\w+)"', body).group(1)
    body = expand(body)
    alts = [(LANGS[l][0], SITE + LANGS[l][2] + path) for l in LANGS] + [('x-default', SITE + path)]
    alternates = '\n'.join(f'  <link rel="alternate" hreflang="{h}" href="{u}" />' for h, u in alts)
    urls.append((SITE + path, alts, lastmod(f)))
    urls += [(SITE + LANGS[l][2] + path, alts, lastmod(f)) for l in ('pt', 'es')]
    for lang, (htmllang, locale, pfx) in LANGS.items():
        d = I18N.get(lang, {})
        if lang == 'en':
            title, desc, page = m['title'], m['desc'], body
            nav = {'nav.home': 'Home', 'nav.work': 'Work', 'nav.services': 'Services', 'nav.studio': 'Studio', 'nav.contact': 'Contact', 'nav.privacy': 'Privacy'}
        else:
            title, desc, page = d['title.' + key], d['desc.' + key], translate(body, lang)
            nav = {k: d[k] for k in ('nav.home', 'nav.work', 'nav.services', 'nav.studio', 'nav.contact', 'nav.privacy')}
        navhtml = ''.join(f'<a href="{pfx}{h}">{nav[k]}</a>' for k, h in (('nav.home', '/'), ('nav.work', '/work/'), ('nav.services', '/services/'), ('nav.studio', '/studio/'), ('nav.contact', '/contact/'), ('nav.privacy', '/privacy/')))
        url = SITE + pfx + path
        out = HEAD.format(htmllang=htmllang, csp=CSP, title=htmllib.escape(title), desc=htmllib.escape(desc), url=url, alternates=alternates, locale=locale, og=m.get('og', 'default'), v=V, boot=BOOT,
                          ld=schema(key, path, url, title, desc, lang, page, nav), nav=navhtml) + page.rstrip() + '\n' + FOOT.format(nav=navhtml, v=V)
        dest = OUT / (pfx + path).lstrip('/') / 'index.html'
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(out)
        print('ok', dest.relative_to(OUT))

xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
for u, alts, mod in urls:
    xml.append(f'<url><loc>{u}</loc><lastmod>{mod}</lastmod>' + ''.join(f'<xhtml:link rel="alternate" hreflang="{h}" href="{a}"/>' for h, a in alts) + '</url>')
(OUT / 'sitemap.xml').write_text('\n'.join(xml + ['</urlset>']) + '\n')
