/**
 * Prerender static routes after `vite build`.
 * For each public-facing route, launches headless Chromium against the built
 * dist/, captures the rendered HTML (including meta tags injected by hooks),
 * and writes it as a per-route index.html.
 *
 * This makes crawlers (Google, Bing, social previews) see fully-rendered
 * content WITHOUT executing JavaScript — critical for SEO.
 *
 * Run: node scripts/prerender.mjs (after vite build)
 */
import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { stat } from 'node:fs/promises';
import { dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '../dist');
const PORT = 4173;

const ROUTES = [
  '/',
  '/sector/1',
  '/sector/2',
  '/sector/3',
  '/sector/4',
  '/sector/5',
  '/sector/6',
  '/despre',
  '/termeni',
  '/confidentialitate',
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function startServer() {
  const server = createServer(async (req, res) => {
    if (!req.url) return res.writeHead(400).end();
    const url = new URL(req.url, `http://localhost`);
    let filePath = resolve(DIST, '.' + url.pathname);

    try {
      const s = await stat(filePath);
      if (s.isDirectory()) filePath = resolve(filePath, 'index.html');
    } catch {
      // SPA fallback for client-side routes
      filePath = resolve(DIST, 'index.html');
    }

    try {
      const data = await readFile(filePath);
      const ext = extname(filePath);
      res.writeHead(200, { 'content-type': MIME[ext] ?? 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404).end('Not Found');
    }
  });

  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

async function prerender(browser, route) {
  const page = await browser.newPage();
  try {
    await page.goto(`http://127.0.0.1:${PORT}${route}`, {
      waitUntil: 'networkidle',
      timeout: 20_000,
    });
    // Allow useEffect-based meta injection to settle
    await page.waitForTimeout(800);

    // Capture full rendered HTML including <head> mutations
    const html = '<!DOCTYPE html>\n' + (await page.evaluate(() => document.documentElement.outerHTML));

    let outPath;
    if (route === '/') {
      outPath = resolve(DIST, 'index.html');
    } else {
      outPath = resolve(DIST, route.slice(1), 'index.html');
    }

    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, html);
    console.log(`  ✓ ${route.padEnd(28)} → ${outPath.replace(DIST, 'dist')}`);
  } catch (e) {
    console.log(`  ✗ ${route}: ${(e instanceof Error ? e.message : String(e)).slice(0, 120)}`);
  } finally {
    await page.close();
  }
}

console.log('🌿 Prerender static routes for SEO');
const server = await startServer();
console.log(`   static server: http://127.0.0.1:${PORT} (serving ${DIST})`);

const browser = await chromium.launch({ headless: true });
console.log(`   prerendering ${ROUTES.length} routes...`);

for (const route of ROUTES) {
  await prerender(browser, route);
}

await browser.close();
server.close();
console.log('✅ done');
