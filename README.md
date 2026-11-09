# Catta Studios

Site do estúdio, no ar em <https://cattastudios.com.br>.

Estático, publicado pelo GitHub Pages direto da branch `main`. HTML, CSS e
JavaScript à mão, com GSAP, Lenis e Barba carregados por CDN.

- `index.html`, `work/`, `services/`, `studio/`, `contact/`: páginas prontas, geradas por `_src/`
- `css/style.css`: tokens da marca, layout e componentes
- `js/app.js`: abertura, transições, menu, rodapé e módulos de cada página
- `js/i18n.js`: textos em português e espanhol (o inglês fica no próprio HTML)
- `js/glyphs.js`: contornos das letras da JetBrains Mono para as animações
- `assets/`: ícones, prints dos produtos e imagens de compartilhamento (`assets/img/og/`)
- `robots.txt`, `sitemap.xml`: para os buscadores; valem para o domínio inteiro, inclusive `/pauca/`. Ao criar uma página, inclua no sitemap
- `.well-known/security.txt`: contato de segurança. O campo `Expires` vence em 01/11/2027: renove antes dessa data

## Editar uma página

O corpo de cada página fica em `_src/pages/`, e os pedaços repetidos em
`_src/parts/` (entram com `{{nome}}`). Depois de editar, gere de novo:

```bash
python3 _src/build.py
```

O GitHub Pages ignora pastas que começam com `_`, então `_src/` não vai para o site.

## Rodar local

```bash
python3 -m http.server 8000
```
