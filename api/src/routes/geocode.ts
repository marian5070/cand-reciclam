import type { FastifyInstance } from 'fastify';
import got from 'got';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const UA = 'CandReciclamBot/0.1 (+https://cand-reciclam.madeinro.eu; informational)';

// Simple serial queue to respect Nominatim's 1 req/s policy
let nominatimQueue: Promise<void> = Promise.resolve();
async function callNominatim(q: string): Promise<{ lat: string; lon: string; display_name: string } | null> {
  // Chain requests so they're serialized with a 1.1s gap
  const wait = nominatimQueue;
  let release: () => void = () => {};
  nominatimQueue = new Promise<void>((r) => (release = r));
  await wait;
  try {
    const res = await got
      .get(NOMINATIM, {
        searchParams: {
          q,
          format: 'json',
          limit: '1',
          countrycodes: 'ro',
          addressdetails: '0',
        },
        headers: { 'user-agent': UA, 'accept-language': 'ro,en' },
        timeout: { request: 10_000 },
      })
      .json<Array<{ lat: string; lon: string; display_name: string }>>();
    return res[0] ?? null;
  } finally {
    // release after at least 1.1s to respect rate limit
    setTimeout(release, 1100);
  }
}

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function geocodeRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { q?: string } }>('/api/geocode', async (req, reply) => {
    const raw = req.query.q?.trim();
    if (!raw || raw.length < 3) return reply.code(400).send({ error: 'q required' });
    const query = normalizeQuery(raw);

    // Check cache
    const cached = await db.select().from(schema.geocodeCache).where(eq(schema.geocodeCache.query, query)).limit(1);
    if (cached[0]) {
      if (!cached[0].found) return { found: false };
      return {
        found: true,
        lat: Number(cached[0].lat),
        lng: Number(cached[0].lng),
        displayName: cached[0].displayName,
        cached: true,
      };
    }

    // Call Nominatim
    try {
      const result = await callNominatim(raw);
      if (!result) {
        await db.insert(schema.geocodeCache).values({ query, found: false, lat: null, lng: null, displayName: null }).onConflictDoNothing();
        return { found: false };
      }
      await db
        .insert(schema.geocodeCache)
        .values({
          query,
          lat: result.lat,
          lng: result.lon,
          displayName: result.display_name,
          found: true,
        })
        .onConflictDoNothing();
      return {
        found: true,
        lat: Number(result.lat),
        lng: Number(result.lon),
        displayName: result.display_name,
      };
    } catch (e) {
      app.log.error({ err: e }, 'nominatim failed');
      return reply.code(502).send({ error: 'geocoding failed' });
    }
  });
}
