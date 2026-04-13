import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { vapidPublicKey } from '../push.js';

export async function usersRoutes(app: FastifyInstance) {
  app.get('/api/push/public-key', async () => ({ key: vapidPublicKey }));

  app.post('/api/users', async () => {
    const [user] = await db
      .insert(schema.users)
      .values({})
      .returning({ id: schema.users.id });
    return user;
  });

  app.put<{ Params: { id: string }; Body: Partial<{ streetId: number; streetNumber: number; notifyHour: number }> }>(
    '/api/users/:id',
    async (req, reply) => {
      const id = req.params.id;
      const { streetId, streetNumber, notifyHour } = req.body;

      const updates: Record<string, number | null> = {};
      if (streetId !== undefined) updates.street_id = streetId;
      if (streetNumber !== undefined) updates.street_number = streetNumber;
      if (notifyHour !== undefined) updates.notify_hour = notifyHour;
      if (Object.keys(updates).length === 0) {
        return reply.code(400).send({ error: 'no fields to update' });
      }

      const [updated] = await db
        .update(schema.users)
        .set({
          ...(streetId !== undefined ? { streetId } : {}),
          ...(streetNumber !== undefined ? { streetNumber } : {}),
          ...(notifyHour !== undefined ? { notifyHour } : {}),
        })
        .where(eq(schema.users.id, id))
        .returning();
      if (!updated) return reply.code(404).send({ error: 'user not found' });
      return { ok: true };
    },
  );

  app.post<{
    Params: { id: string };
    Body: { endpoint: string; keys: { p256dh: string; auth: string } };
  }>('/api/users/:id/push-subscription', async (req, reply) => {
    const id = req.params.id;
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return reply.code(400).send({ error: 'invalid subscription' });
    }

    const [updated] = await db
      .update(schema.users)
      .set({
        pushEndpoint: endpoint,
        pushP256dh: keys.p256dh,
        pushAuth: keys.auth,
      })
      .where(eq(schema.users.id, id))
      .returning();
    if (!updated) return reply.code(404).send({ error: 'user not found' });
    return { ok: true };
  });

  app.delete<{ Params: { id: string } }>('/api/users/:id/push-subscription', async (req) => {
    await db
      .update(schema.users)
      .set({ pushEndpoint: null, pushP256dh: null, pushAuth: null })
      .where(eq(schema.users.id, req.params.id));
    return { ok: true };
  });

  /** Test endpoint — send a test push to this user right now */
  app.post<{ Params: { id: string } }>('/api/users/:id/push-test', async (req, reply) => {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, req.params.id));
    if (!user?.pushEndpoint || !user.pushP256dh || !user.pushAuth) {
      return reply.code(400).send({ error: 'no subscription' });
    }
    const { sendPush } = await import('../push.js');
    const result = await sendPush(
      {
        endpoint: user.pushEndpoint,
        keys: { p256dh: user.pushP256dh, auth: user.pushAuth },
      },
      {
        title: 'Test · Când reciclăm?',
        body: 'Notificările funcționează! Acesta e un mesaj de test.',
        url: '/',
      },
    );
    return { result };
  });
}
