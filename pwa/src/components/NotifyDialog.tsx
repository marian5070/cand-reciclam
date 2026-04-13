import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X, Loader2, Check, Smartphone, AlertTriangle, Send } from 'lucide-react';
import {
  detectPushCapability,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestPush,
  getSavedNotifyHour,
  getCurrentSubscription,
} from '../lib/push.js';
import type { Address } from '../lib/types.js';

type Phase = 'idle' | 'working' | 'subscribed' | 'error' | 'blocked' | 'ios-install';

export function NotifyDialog({
  open,
  onClose,
  address,
}: {
  open: boolean;
  onClose: () => void;
  address: Address;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [hour, setHour] = useState<number>(() => getSavedNotifyHour() ?? 19);
  const [hasSub, setHasSub] = useState(false);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    setPhase('idle');
    setErr('');
    getCurrentSubscription().then((s) => setHasSub(!!s));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  async function handleSubscribe() {
    const cap = detectPushCapability();
    if (!cap.ok) {
      if (cap.reason === 'ios-not-standalone') return setPhase('ios-install');
      if (cap.reason === 'permission-denied') return setPhase('blocked');
      setErr(`Browser-ul nu suportă notificări (${cap.reason})`);
      return setPhase('error');
    }
    setPhase('working');
    try {
      await subscribeToPush({
        streetId: address.streetId,
        streetNumber: address.number,
        notifyHour: hour,
      });
      setHasSub(true);
      setPhase('subscribed');
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === 'permission-denied') return setPhase('blocked');
      setErr(msg);
      setPhase('error');
    }
  }

  async function handleUnsubscribe() {
    setPhase('working');
    await unsubscribeFromPush();
    setHasSub(false);
    setPhase('idle');
  }

  async function handleTestPush() {
    try {
      await sendTestPush();
    } catch (e) {
      setErr(String(e));
      setPhase('error');
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[oklch(10%_0.015_162/0.6)] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-[0_24px_56px_-12px_oklch(10%_0.05_160/0.55)]"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center size-10 rounded-2xl bg-[color:var(--color-avatar-bg)] text-[color:var(--color-avatar-fg)]">
                  <Bell size={18} />
                </span>
                <div>
                  <h2 className="text-lg font-semibold">Notificări zilnice</h2>
                  <p className="text-sm text-[color:var(--color-muted)]">{address.street} nr. {address.number}</p>
                </div>
              </div>
              <button onClick={onClose} aria-label="Închide" className="rounded-lg p-1.5 text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] hover:bg-[color:var(--color-fg)]/5 transition">
                <X size={16} />
              </button>
            </div>

            {/* iOS install prompt */}
            {phase === 'ios-install' && (
              <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                <div className="flex items-start gap-3">
                  <Smartphone size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm space-y-2">
                    <p className="font-medium">Pentru notificări pe iPhone</p>
                    <ol className="list-decimal pl-4 space-y-1 text-[color:var(--color-muted)]">
                      <li>Apasă butonul <strong>Share</strong> din Safari (iconul cu săgeata sus)</li>
                      <li>Alege <strong>„Add to Home Screen"</strong></li>
                      <li>Deschide aplicația de pe Home Screen și revino aici</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* Permission blocked */}
            {phase === 'blocked' && (
              <div className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm">
                <div className="flex items-start gap-3">
                  <BellOff size={18} className="text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Notificările sunt blocate</p>
                    <p className="mt-1 text-[color:var(--color-muted)]">
                      Activează-le din setările browser-ului (lacăt → permisiuni → Notificări) și revino aici.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Main form */}
            {(phase === 'idle' || phase === 'working' || phase === 'error') && !hasSub && (
              <div className="mt-6 space-y-5">
                <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">
                  Te anunțăm cu o seară înainte ca să nu mai uiți. Notificarea apare la ora aleasă de tine.
                </p>

                <div>
                  <label className="flex items-center justify-between text-sm mb-2">
                    <span className="text-[color:var(--color-muted)]">ora notificării</span>
                    <span className="font-mono text-base font-medium tabular-nums">
                      {String(hour).padStart(2, '0')}:00
                    </span>
                  </label>
                  <input
                    type="range"
                    min={16}
                    max={22}
                    step={1}
                    value={hour}
                    onChange={(e) => setHour(Number(e.target.value))}
                    className="w-full accent-[color:var(--color-sage-500)]"
                  />
                  <div className="mt-1 flex justify-between text-xs text-[color:var(--color-muted)] font-mono">
                    <span>16</span>
                    <span>18</span>
                    <span>20</span>
                    <span>22</span>
                  </div>
                </div>

                {err && phase === 'error' && (
                  <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-600 flex gap-2">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <span>{err}</span>
                  </div>
                )}

                <button
                  onClick={handleSubscribe}
                  disabled={phase === 'working'}
                  className="cta-primary w-full justify-center py-3"
                >
                  {phase === 'working' ? <><Loader2 size={16} className="animate-spin" /> se activează...</> : <><Bell size={16} /> activează notificările</>}
                </button>

                <p className="text-sm text-[color:var(--color-muted)] text-center">
                  Un singur click. Fără email, fără parolă.
                </p>
              </div>
            )}

            {/* Already subscribed */}
            {hasSub && (phase === 'idle' || phase === 'subscribed') && (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-[color:var(--color-surface-tinted)] border border-[color:var(--color-border)] p-4">
                  <div className="flex items-center gap-2 text-[color:var(--color-accent-strong)] text-sm font-medium">
                    <Check size={16} />
                    Notificări active
                  </div>
                  <p className="mt-1.5 text-sm text-[color:var(--color-muted)]">
                    Primești mesaj la ora <span className="font-mono text-[color:var(--color-fg)]">{String(getSavedNotifyHour() ?? 19).padStart(2,'0')}:00</span> cu o seară înainte de colectare.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleTestPush}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2.5 text-sm font-medium hover:bg-[color:var(--color-fg)]/5 transition"
                  >
                    <Send size={14} />
                    trimite notificare de test
                  </button>
                  <button
                    onClick={handleUnsubscribe}
                    className="inline-flex items-center justify-center gap-2 text-sm text-[color:var(--color-muted)] hover:text-rose-500 transition py-2"
                  >
                    <BellOff size={14} />
                    dezactivează
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
