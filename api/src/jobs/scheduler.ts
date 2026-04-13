import cron from 'node-cron';
import { sql, isNotNull } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { sendPush } from '../push.js';

const WASTE_EMOJI: Record<string, string> = {
  menajer: '🗑️',
  reciclabil_uscat: '♻️',
  bio: '🌿',
  voluminoase: '🛋️',
  deee: '🔌',
  textile: '👕',
  sticla: '🍾',
};

const WASTE_LABEL: Record<string, string> = {
  menajer: 'menajer',
  reciclabil_uscat: 'reciclabil',
  bio: 'bio',
  voluminoase: 'voluminoase',
  deee: 'electrice',
  textile: 'textile',
  sticla: 'sticlă',
};

/** RRULE BYDAY → ISO day 0..6 (Sun..Sat) */
const DAY_MAP: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

function hasPickupOn(rrule: string, date: Date): boolean {
  const m = /BYDAY=([A-Z,]+)/.exec(rrule);
  if (!m) return false;
  const days = m[1]!.split(',').map((d) => DAY_MAP[d]);
  return days.includes(date.getDay());
}

/**
 * Check each subscribed user. If their notify_hour matches current hour and
 * there's a pickup tomorrow for their address, send a push.
 */
export async function runSchedulerTick(log: { info: (m: string) => void; error: (e: unknown) => void }) {
  const now = new Date();
  const currentHour = now.getHours();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const users = await db
    .select()
    .from(schema.users)
    .where(isNotNull(schema.users.pushEndpoint));

  let sent = 0;
  let skipped = 0;
  let gone = 0;
  for (const u of users) {
    if (u.notifyHour !== currentHour) {
      skipped++;
      continue;
    }
    if (!u.streetId || !u.streetNumber || !u.pushEndpoint || !u.pushP256dh || !u.pushAuth) {
      skipped++;
      continue;
    }

    // Find schedules for this address
    const schedules = await db.execute<{
      waste_type: string;
      rrule: string;
    }>(sql`
      SELECT sch.waste_type, sch.rrule
      FROM street_segments seg
      JOIN zones z ON z.id = seg.zone_id
      JOIN schedules sch ON sch.zone_id = z.id
      WHERE seg.street_id = ${u.streetId}
        AND ${u.streetNumber} BETWEEN seg.number_from AND COALESCE(seg.number_to, 2147483647)
        AND (seg.parity = 'both'
          OR (${u.streetNumber % 2} = 1 AND seg.parity = 'odd')
          OR (${u.streetNumber % 2} = 0 AND seg.parity = 'even'))
    `);

    const tomorrowPickups = schedules.filter((s) => hasPickupOn(s.rrule, tomorrow));
    if (tomorrowPickups.length === 0) {
      skipped++;
      continue;
    }

    const first = tomorrowPickups[0]!;
    const emoji = WASTE_EMOJI[first.waste_type] ?? '♻️';
    const label = WASTE_LABEL[first.waste_type] ?? first.waste_type;
    const plural = tomorrowPickups.length > 1 ? ` + ${tomorrowPickups.length - 1}` : '';

    const result = await sendPush(
      {
        endpoint: u.pushEndpoint,
        keys: { p256dh: u.pushP256dh, auth: u.pushAuth },
      },
      {
        title: `Mâine: ${emoji} ${label}${plural}`,
        body: 'Scoate sacul corect până la ora 07:00.',
        url: '/',
      },
    );

    if (result === 'ok') sent++;
    else if (result === 'gone') {
      gone++;
      await db
        .update(schema.users)
        .set({ pushEndpoint: null, pushP256dh: null, pushAuth: null })
        .where(sql`id = ${u.id}`);
    }
  }
  log.info(`[scheduler] hour=${currentHour} sent=${sent} skipped=${skipped} gone=${gone} users=${users.length}`);
}

export function startScheduler(log: { info: (m: string) => void; error: (e: unknown) => void }) {
  // Every hour at :00
  cron.schedule('0 * * * *', () => {
    runSchedulerTick(log).catch((e) => log.error(e));
  });
  log.info('[scheduler] started — hourly tick');
}
