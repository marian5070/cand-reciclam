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

// RFC 8288 agent-discovery link on every response (additive; nothing else sets Link)
app.addHook('onSend', async (_req, reply, payload) => {
  reply.header('Link', '</sitemap.xml>; rel="sitemap"');
  return payload;
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

await app.register(streetsRoutes);
await app.register(usersRoutes);
await app.register(geocodeRoutes);

if (isProduction) {
  const pwaDist = path.resolve(__dirname, '../../pwa/dist');
  await app.register(staticPlugin, {
    root: pwaDist,
    prefix: '/',
    wildcard: false,
  });
  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith('/api/')) {
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
