import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { sql } from 'drizzle-orm';
import { db } from './db/index.js';
import { streetsRoutes } from './routes/streets.js';
import { usersRoutes } from './routes/users.js';
import { geocodeRoutes } from './routes/geocode.js';
import { startScheduler } from './jobs/scheduler.js';

const app = Fastify({
  logger: { level: 'info' },
});

await app.register(cors, {
  origin: ['http://localhost:5174', 'http://127.0.0.1:5174'],
  credentials: true,
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

const port = Number(process.env.PORT ?? 3030);
const host = process.env.HOST ?? '127.0.0.1';

await app.listen({ port, host });
app.log.info(`🌿 Când reciclăm? API live pe http://${host}:${port}`);

// Start push scheduler (hourly check)
startScheduler(app.log);
