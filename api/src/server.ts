import 'dotenv/config';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import staticPlugin from '@fastify/static';
import { sql } from 'drizzle-orm';
import { db } from './db/index.js';
import { streetsRoutes } from './routes/streets.js';
import { usersRoutes } from './routes/users.js';
import { geocodeRoutes } from './routes/geocode.js';
import { startScheduler } from './jobs/scheduler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';

const app = Fastify({
  logger: { level: 'info' },
});

await app.register(cors, {
  origin: isProduction
    ? ['https://cand-reciclam.madeinro.eu']
    : ['http://localhost:5174', 'http://127.0.0.1:5174'],
  credentials: true,
});

// CSP Etapa 2 — Report-Only întâi. Singura resursă externă reală: tile-urile
// OpenStreetMap (hărțile din pagini). SPA-ul Vite nu are scripturi inline,
// deci script-src rămâne strict 'self'. Încălcările ajung la /csp-report.
// Enforce din 19 iul 2026 — soak Report-Only 12–19 iul: zero rapoarte.
const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://tile.openstreetmap.org https://*.tile.openstreetmap.org",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'report-uri /csp-report',
].join('; ');

// RFC 8288 agent-discovery link on every response (additive; nothing else sets Link)
// + security baseline (securityheaders.com); CSP separat, per-app.
// HSTS fără includeSubDomains: alte subdomenii madeinro.eu sunt alt origin.
app.addHook('onSend', async (_req, reply, payload) => {
  reply.header('Strict-Transport-Security', 'max-age=31536000');
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'DENY');
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  reply.header('Content-Security-Policy', CSP_POLICY);
  // Fastify overwrites (not appends) on a second header('Link', …) call, so
  // every rel lives in this single comma-separated value.
  reply.header(
    'Link',
    '</sitemap.xml>; rel="sitemap", ' +
      '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json", ' +
      '</openapi.json>; rel="service-desc"; type="application/json"',
  );
  return payload;
});

// Colectorul de rapoarte CSP: browserele trimit application/csp-report —
// Fastify are nevoie de parser dedicat pentru acest content-type.
app.addContentTypeParser(
  'application/csp-report',
  { parseAs: 'string', bodyLimit: 16384 },
  (_req, body, done) => {
    try {
      done(null, JSON.parse(body as string));
    } catch {
      done(null, {});
    }
  },
);
app.post('/csp-report', async (req, reply) => {
  const body = (req.body as Record<string, unknown> | null) ?? {};
  const report = (body['csp-report'] as unknown) ?? body;
  app.log.warn({ cspReport: report }, 'csp-report');
  return reply.status(204).send();
});

app.get('/api/health', async () => {
  const result = await db.execute(sql`SELECT 1 as ok`);
  return {
    status: 'ok',
    brand: 'Când reciclăm?',
    db: result.length > 0 ? 'connected' : 'unknown',
    time: new Date().toISOString(),
  };
});

// RFC 9727 api-catalog: linkset of this origin's machine-readable APIs.
// Explicit route (not a static file): the path has no extension, so the
// linkset+json content type must be set by hand.
app.get('/.well-known/api-catalog', async (_req, reply) => {
  const base = 'https://cand-reciclam.madeinro.eu';
  return reply
    .header('Content-Type', 'application/linkset+json')
    .header('Cache-Control', 'public, max-age=3600')
    .send({
      linkset: [
        {
          anchor: `${base}/api`,
          'service-desc': [{ href: `${base}/openapi.json`, type: 'application/json' }],
          'service-doc': [{ href: `${base}/llms.txt`, type: 'text/plain' }],
          status: [{ href: `${base}/api/health`, type: 'application/json' }],
        },
        {
          anchor: `${base}/mcp`,
          'service-desc': [{ href: `${base}/.well-known/mcp.json`, type: 'application/json' }],
        },
      ],
    });
});

await app.register(streetsRoutes);
await app.register(usersRoutes);
await app.register(geocodeRoutes);

if (isProduction) {
  const pwaDist = path.resolve(__dirname, '../../pwa/dist');
  await app.register(staticPlugin, {
    root: pwaDist,
    prefix: '/',
    wildcard: false,
    // Without this, the boot-time glob skips every dotted path and nothing
    // under dist/.well-known/ ever gets a route (agent-skills index etc.).
    serveDotFiles: true,
  });
  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith('/api/')) {
      return reply.code(404).send({ error: 'not found' });
    }
    // A hashed asset that misses on disk (e.g. mid-deploy, between the old
    // process and a fresh Vite build) must NEVER be cached at the CDN edge:
    // the HTML fallback under an /assets/ URL poisons that URL until TTL.
    if (req.url.startsWith('/assets/')) {
      reply.header('Cache-Control', 'no-store');
      return reply.code(404).send({ error: 'asset not found' });
    }
    // Discovery paths must never 200 with the SPA shell: agents probing
    // /.well-known/* would get text/html where they expect JSON — worse
    // than an honest 404.
    if (req.url.startsWith('/.well-known/')) {
      reply.header('Cache-Control', 'no-store');
      return reply.code(404).send({ error: 'not found' });
    }
    // Serve the prerendered page when one exists for this route (e.g.
    // /despre → dist/despre/index.html) so crawlers get real HTML; anything
    // else falls back to the SPA shell exactly as before.
    const route = (req.url.split('?')[0] ?? '').replace(/\/+$/, '');
    if (/^\/[a-z0-9/-]+$/.test(route)) {
      const candidate = path.join(pwaDist, route.slice(1), 'index.html');
      if (candidate.startsWith(pwaDist) && existsSync(candidate)) {
        return reply.sendFile(`${route.slice(1)}/index.html`);
      }
    }
    return reply.sendFile('index.html');
  });
}

const port = Number(process.env.PORT ?? 3030);
const host = process.env.HOST ?? '127.0.0.1';

await app.listen({ port, host });
app.log.info(`🌿 Când reciclăm? API live pe http://${host}:${port}`);

// Start push scheduler (hourly check)
startScheduler(app.log);
