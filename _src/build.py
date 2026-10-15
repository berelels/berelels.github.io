#!/usr/bin/env python3
"""Monta as páginas do site: cabeçalho comum + corpo de cada página (pages/*.html).

Uso: python3 _src/build.py   (grava os index.html na raiz do repositório)
Pedaços repetidos ficam em parts/ e entram com {{nome}}."""
import pathlib, re, sys, time
V = str(int(time.time()))

HERE = pathlib.Path(__file__).parent
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else HERE.parent
B = '/'

HEAD = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>{title}</title>
  <meta name="description" content="{desc}" />
  <meta name="theme-color" content="#3f6ca8" />
  <meta name="color-scheme" content="light" />
  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{desc}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://cattastudios.com.br{path}" />
  <meta property="og:site_name" content="Catta Studios" />
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
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;700;800&display=swap" />
  <link rel="stylesheet" href="/css/style.css?v={{V}}" />
  <script>document.documentElement.classList.add('js')</script>
</head>
<body class="is-loading">
  <div data-barba="wrapper">
'''

FOOT = '''  </div>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/MorphSVGPlugin.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/CustomEase.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/Flip.min.js"></script>
  <script src="https://unpkg.com/lenis@1.3.4/dist/lenis.min.js"></script>
  <script src="https://unpkg.com/@barba/core@2.10.3/dist/barba.umd.js"></script>
  <script src="/js/i18n.js?v={V}"></script>
  <script src="/js/glyphs.js?v={V}"></script>
  <script src="/js/app.js?v={V}"></script>
</body>
</html>
'''

PARTS = {p.stem: p.read_text() for p in (HERE / 'parts').glob('*.html')}


def expand(s):
    # {{nome}} puxa um pedaço de parts/
    for _ in range(3):
        s = re.sub(r'\{\{(\w[\w-]*)\}\}', lambda m: PARTS[m.group(1)].strip(), s)
    return s


for f in sorted((HERE / 'pages').glob('*.html')):
    raw = f.read_text()
    meta, body = raw.split('\n---\n', 1)
    m = dict(line.split(': ', 1) for line in meta.strip().splitlines())
    path = m['path']
    html = HEAD.format(title=m['title'], desc=m['desc'], path=path, og=m.get('og', 'default')).replace('{V}', V) + expand(body).rstrip() + '\n' + FOOT.replace('{V}', V)
    dest = OUT / path.replace(B, '', 1) / 'index.html'
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(html)
    print('ok', dest.relative_to(OUT))
