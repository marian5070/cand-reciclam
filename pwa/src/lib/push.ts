const USER_ID_KEY = 'cr:user-id';
const NOTIFY_HOUR_KEY = 'cr:notify-hour';

export function getUserId(): string | null {
  try {
    return localStorage.getItem(USER_ID_KEY);
  } catch {
    return null;
  }
}

export function setUserId(id: string) {
  try {
    localStorage.setItem(USER_ID_KEY, id);
  } catch {}
}

export function getSavedNotifyHour(): number | null {
  try {
    const v = localStorage.getItem(NOTIFY_HOUR_KEY);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

export function setSavedNotifyHour(h: number) {
  try {
    localStorage.setItem(NOTIFY_HOUR_KEY, String(h));
  } catch {}
}

async function ensureUserId(): Promise<string> {
  let id = getUserId();
  if (id) return id;
  const res = await fetch('/api/users', { method: 'POST' });
  if (!res.ok) throw new Error(`user create failed: ${res.status}`);
  const data = (await res.json()) as { id: string };
  setUserId(data.id);
  return data.id;
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const str = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(str);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export type PushCapabilityReason =
  | 'ok'
  | 'no-sw'
  | 'no-push-manager'
  | 'permission-denied'
  | 'ios-not-standalone';

export function detectPushCapability(): { ok: boolean; reason: PushCapabilityReason } {
  if (!('serviceWorker' in navigator)) return { ok: false, reason: 'no-sw' };
  if (!('PushManager' in window)) return { ok: false, reason: 'no-push-manager' };

  // iOS Safari: only supports push when PWA is added to Home Screen (standalone)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true);
  if (isIOS && !isStandalone) return { ok: false, reason: 'ios-not-standalone' };

  if (Notification.permission === 'denied') return { ok: false, reason: 'permission-denied' };
  return { ok: true, reason: 'ok' };
}

export async function subscribeToPush(params: {
  streetId: number;
  streetNumber: number;
  notifyHour: number;
}): Promise<{ userId: string }> {
  const userId = await ensureUserId();

  // Save preferences first (so we have user context even if subscription fails)
  await fetch(`/api/users/${userId}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      streetId: params.streetId,
      streetNumber: params.streetNumber,
      notifyHour: params.notifyHour,
    }),
  });
  setSavedNotifyHour(params.notifyHour);

  // Request permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(permission === 'denied' ? 'permission-denied' : 'permission-dismissed');
  }

  // Register SW if not yet
  let reg = await navigator.serviceWorker.getRegistration();
  if (!reg) {
    reg = await navigator.serviceWorker.register('/sw.js');
  }
  await navigator.serviceWorker.ready;

  // Get VAPID public key
  const keyRes = await fetch('/api/push/public-key');
  const { key } = (await keyRes.json()) as { key: string };

  // Subscribe
  const keyBytes = urlBase64ToUint8Array(key);
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyBytes.buffer.slice(keyBytes.byteOffset, keyBytes.byteOffset + keyBytes.byteLength) as ArrayBuffer,
  });
  const json = subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };

  // Save on server
  await fetch(`/api/users/${userId}/push-subscription`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
    }),
  });

  return { userId };
}

export async function unsubscribeFromPush(): Promise<void> {
  const userId = getUserId();
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) await sub.unsubscribe();
  if (userId) {
    await fetch(`/api/users/${userId}/push-subscription`, { method: 'DELETE' });
  }
}

export async function sendTestPush(): Promise<{ result: string }> {
  const userId = getUserId();
  if (!userId) throw new Error('no user');
  const res = await fetch(`/api/users/${userId}/push-test`, { method: 'POST' });
  return res.json();
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) ?? null;
}
