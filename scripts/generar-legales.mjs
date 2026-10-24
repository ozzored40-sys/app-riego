// Publica los documentos legales de src/legal/documentos.ts como páginas HTML estáticas en
// server/public/, que Vercel sirve junto al backend. Así existe una URL pública del Aviso
// de Privacidad y de los Términos (requisito de Google Play y App Store).
//
// Uso: npm run legal:generar   (vuelve a correrlo cada vez que cambies los documentos)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { DOCUMENTOS_LEGALES, DATOS_RESPONSABLE, VERSION_LEGAL } = await import(
  path.join(raiz, 'src/legal/documentos.ts')
);
const destino = path.join(raiz, 'server/public');

const escapar = (texto) =>
  texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const estilos = `
  :root { color-scheme: light dark; --fondo:#f8fafc; --texto:#0f172a; --suave:#475569; --acento:#059669; --borde:#e2e8f0; }
  @media (prefers-color-scheme: dark) { :root { --fondo:#070b14; --texto:#f8fafc; --suave:#94a3b8; --acento:#10b981; --borde:#1e293b; } }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--fondo); color:var(--texto); font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
  main { max-width: 760px; margin: 0 auto; padding: 32px 16px 64px; }
  header { display:flex; align-items:center; gap:12px; margin-bottom: 24px; }
  .logo { width:40px; height:40px; border-radius:12px; background:var(--acento); color:#fff; display:grid; place-items:center; font-weight:800; }
  h1 { font-size: 1.7rem; line-height:1.25; margin: 0 0 4px; }
  h2 { font-size: 1.05rem; margin: 28px 0 8px; }
  p { margin: 0 0 10px; }
  .meta, .resumen { color: var(--suave); }
  .resumen { font-style: italic; }
  nav a, a { color: var(--acento); }
  nav { display:flex; flex-wrap:wrap; gap:16px; margin: 0 0 24px; }
  footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid var(--borde); color: var(--suave); font-size: .9rem; }
`;

function pagina(titulo, cuerpo) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapar(titulo)} · ${escapar(DATOS_RESPONSABLE.nombreApp)}</title>
<style>${estilos}</style>
</head>
<body>
<main>
<header><div class="logo">O₃</div><div><strong>${escapar(DATOS_RESPONSABLE.nombreComercial)}</strong><br><span class="meta">${escapar(DATOS_RESPONSABLE.nombreApp)}</span></div></header>
<nav>${Object.values(DOCUMENTOS_LEGALES)
    .map((d) => `<a href="/${d.id}">${escapar(d.titulo)}</a>`)
    .join('')}</nav>
${cuerpo}
<footer>${escapar(DATOS_RESPONSABLE.razonSocial)} · ${escapar(DATOS_RESPONSABLE.correoPrivacidad)} · WhatsApp ${escapar(DATOS_RESPONSABLE.whatsapp)} · Versión ${escapar(VERSION_LEGAL)}</footer>
</main>
</body>
</html>
`;
}

fs.mkdirSync(destino, { recursive: true });

for (const doc of Object.values(DOCUMENTOS_LEGALES)) {
  const cuerpo = [
    `<h1>${escapar(doc.titulo)}</h1>`,
    `<p class="meta">Versión ${escapar(VERSION_LEGAL)}</p>`,
    `<p class="resumen">${escapar(doc.resumen)}</p>`,
    ...doc.secciones.map(
      (s) =>
        `<h2>${escapar(s.titulo)}</h2>\n${s.parrafos.map((p) => `<p>${escapar(p)}</p>`).join('\n')}`,
    ),
  ].join('\n');
  fs.writeFileSync(path.join(destino, `${doc.id}.html`), pagina(doc.titulo, cuerpo));
}

const indice = [
  `<h1>Documentos legales</h1>`,
  `<p class="meta">Información legal de la aplicación ${escapar(DATOS_RESPONSABLE.nombreApp)}.</p>`,
  ...Object.values(DOCUMENTOS_LEGALES).map(
    (d) => `<h2><a href="/${d.id}">${escapar(d.titulo)}</a></h2><p>${escapar(d.resumen)}</p>`,
  ),
].join('\n');
fs.writeFileSync(path.join(destino, 'index.html'), pagina('Documentos legales', indice));

console.log(
  `Documentos legales generados en ${path.relative(raiz, destino)}/ (versión ${VERSION_LEGAL})`,
);
