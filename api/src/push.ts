import webpush from 'web-push';

const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
  throw new Error('VAPID_* environment variables are required');
}

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export const vapidPublicKey = VAPID_PUBLIC_KEY;

export type PushSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function sendPush(
  sub: PushSubscription,
  payload: { title: string; body: string; url?: string },
): Promise<'ok' | 'gone' | 'error'> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: sub.keys },
      JSON.stringify(payload),
    );
    return 'ok';
  } catch (err) {
    const code = (err as { statusCode?: number }).statusCode;
    if (code === 404 || code === 410) return 'gone';
    console.error('sendPush failed:', err);
    return 'error';
  }
}
