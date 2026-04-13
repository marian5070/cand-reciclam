import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Bell, ArrowDown } from 'lucide-react';
import type { Address, Pickup } from '../lib/types.js';
import { WASTE_LABEL, WASTE_DESCRIPTION } from '../lib/types.js';
import { ambientColors, proximityLabel } from '../lib/time.js';
import { wasteTint, WasteIcon } from './WasteIcon.js';
import { SourceBadge } from './SourceBadge.js';
import { Tooltip } from './Tooltip.js';
import { InfoHint } from './InfoHint.js';
import { ShareButton } from './ShareButton.js';
import { BuildingTypeToggle } from './BuildingTypeToggle.js';

export function Hero({
  address,
  next,
  pickups,
  loading = false,
  noData = false,
  sectorSource,
  onSwitchAddress,
  onNotify,
  buildingTypeSelector,
}: {
  address: Address;
  next: Pickup | null;
  pickups: Pickup[];
  loading?: boolean;
  noData?: boolean;
  sectorSource?: { label: string; url: string };
  onSwitchAddress?: () => void;
  onNotify?: () => void;
  buildingTypeSelector?: {
    value: 'case' | 'blocuri' | undefined;
    onChange: (v: 'case' | 'blocuri') => void;
  };
}) {
  const prox = next ? proximityLabel(next.date) : null;
  const label = prox?.label ?? (loading ? 'Un moment' : 'Fără date oficiale');
  const sub = prox?.sub ?? (loading ? 'caut programul…' : 'pentru această adresă');
  const proximity = prox?.proximity ?? 0.2;
  const imminent = prox?.imminent ?? false;
  const { a, b, c } = ambientColors(proximity);
  const meshRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!meshRef.current) return;
    const el = meshRef.current;
    el.style.setProperty('--mesh-a', a);
    el.style.setProperty('--mesh-b', b);
    el.style.setProperty('--mesh-c', c);
  }, [a, b, c]);

  const tint = next ? wasteTint(next.wasteType) : 'oklch(55% 0.08 150)';

  return (
    <section className="relative overflow-hidden isolate pt-8 pb-14 md:pt-14 md:pb-20">
      <div ref={meshRef} className="ambient-mesh" aria-hidden />
      <div className="grain absolute inset-0 pointer-events-none" aria-hidden />

      <div className="relative z-10 mx-auto max-w-2xl px-6">
        {/* address pill */}
        <Tooltip content="Apasă ca să schimbi sau verifici altă adresă" side="bottom">
          <motion.button
            onClick={onSwitchAddress}
            data-tour="address"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="group inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/95 backdrop-blur-xl px-4 py-2 text-base text-[color:var(--color-fg)] shadow-sm transition hover:border-[color:var(--color-accent)]"
          >
            <MapPin size={15} strokeWidth={2} className="text-[color:var(--color-accent)]" />
            <span className="font-medium">{address.street}</span>
            <span className="text-[color:var(--color-accent-strong)] font-mono tabular-nums font-semibold">nr. {address.number}</span>
            <span className="text-sm text-[color:var(--color-muted)]">· Sector {address.sector}</span>
          </motion.button>
        </Tooltip>

        {/* intro context — makes it obvious what this page is */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-5 text-base text-[color:var(--color-muted)]"
        >
          Programul colectării gunoiului pentru adresa ta.
        </motion.p>

        {/* Building type selector — only when street has both case + blocuri schedules */}
        {buildingTypeSelector && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-5"
          >
            {!buildingTypeSelector.value && (
              <div className="mb-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm flex gap-2 items-start">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span className="text-[color:var(--color-fg)]">
                  Pe această stradă, programul e <strong>diferit pentru case și blocuri</strong>. Alege tipul tău ca să vezi programul corect — altfel arătăm tot, fără filtrare.
                </span>
              </div>
            )}
            <BuildingTypeToggle
              value={buildingTypeSelector.value}
              onChange={buildingTypeSelector.onChange}
            />
          </motion.div>
        )}

        {/* main countdown */}
        <div className="mt-8 md:mt-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-1"
          >
            <span className="text-sm uppercase tracking-[0.18em] text-[color:var(--color-muted)] font-semibold">
              {noData ? 'Program colectare' : 'Următoarea colectare programată'}
            </span>
            <h1
              className={`countdown-breathe ${imminent ? 'imminent' : ''} text-[clamp(2.8rem,9vw,5.5rem)] leading-[0.95] tracking-tight text-[color:var(--color-fg)]`}
            >
              {label}
            </h1>
            <span className="mt-1 font-mono text-lg text-[color:var(--color-muted)] tabular-nums">
              {sub}
            </span>
          </motion.div>

          {/* waste card — narrative, not just a pill.
              NOTE: NO overflow-hidden — would clip InfoHint popover. Stripe is inset. */}
          <motion.div
            data-tour="waste"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 relative rounded-3xl border backdrop-blur-xl"
            style={{
              borderColor: `color-mix(in oklch, ${tint} 30%, transparent)`,
              background: `color-mix(in oklch, ${tint} 10%, var(--color-surface))`,
            }}
          >
            {/* colored left stripe — inset from rounded corners so no overflow-hidden needed */}
            <div
              aria-hidden
              className="absolute left-2 top-3 bottom-3 w-1.5 rounded-full"
              style={{ background: tint }}
            />
            <div className="flex items-start gap-4 p-5 pl-8">
              {next ? (
                <>
                  <WasteIcon type={next.wasteType} size={30} />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm uppercase tracking-wider text-[color:var(--color-muted)] font-semibold">
                        scoatem
                      </span>
                      <InfoHint size={14} side="bottom">
                        <p className="font-medium mb-1.5 text-[color:var(--color-fg)]">Tipurile de deșeu</p>
                        <p>Fiecare tip are culoare și descriere proprie. Bara colorată din stânga cardurilor din timeline (mai jos) indică ce se colectează în acea zi.</p>
                      </InfoHint>
                    </div>
                    <span
                      className="text-3xl font-semibold leading-tight mt-0.5"
                      style={{ color: `color-mix(in oklch, ${tint} 35%, var(--color-fg))` }}
                    >
                      {WASTE_LABEL[next.wasteType]}
                    </span>
                    <span className="mt-1 text-sm text-[color:var(--color-muted)] leading-snug">
                      {WASTE_DESCRIPTION[next.wasteType]}
                    </span>
                  </div>
                </>
              ) : loading ? (
                <div className="flex flex-col gap-2 w-full">
                  <div className="h-4 w-24 rounded bg-[color:var(--color-fg)]/10 animate-pulse" />
                  <div className="h-9 w-40 rounded bg-[color:var(--color-fg)]/10 animate-pulse" />
                  <div className="h-4 w-56 rounded bg-[color:var(--color-fg)]/10 animate-pulse" />
                </div>
              ) : (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm uppercase tracking-wider text-[color:var(--color-muted)] font-semibold">
                    nu publicăm date false
                  </span>
                  <span className="text-2xl font-semibold leading-tight mt-1 text-[color:var(--color-fg)]">
                    Verifică direct la operator
                  </span>
                  <span className="mt-1.5 text-sm text-[color:var(--color-muted)] leading-snug">
                    Operatorul tău {sectorSource?.label ? <>({sectorSource.label}) </>: ''}
                    nu publică încă programul per adresă. Vezi detalii mai jos sau mergi la sursă.
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* source + cta */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 flex flex-wrap items-center gap-3"
          >
            {next ? (
              <>
                <div data-tour="source">
                  <SourceBadge
                    quality={next.sourceQuality}
                    url={next.sourceUrl}
                    operator={next.operator}
                  />
                </div>
                <InfoHint size={14} side="bottom">
                  <p className="font-medium mb-1.5 text-[color:var(--color-fg)]">Ce înseamnă bulina?</p>
                  <ul className="space-y-1.5">
                    <li className="flex gap-2"><span className="mt-1 shrink-0 size-1.5 rounded-full bg-emerald-500" /><span><strong>Verde</strong> · date per stradă și număr</span></li>
                    <li className="flex gap-2"><span className="mt-1 shrink-0 size-1.5 rounded-full bg-amber-500" /><span><strong>Galben</strong> · program uniform pe sector</span></li>
                    <li className="flex gap-2"><span className="mt-1 shrink-0 size-1.5 rounded-full bg-orange-500" /><span><strong>Portocaliu</strong> · operatorul nu publică încă</span></li>
                    <li className="flex gap-2"><span className="mt-1 shrink-0 size-1.5 rounded-full bg-rose-500" /><span><strong>Roșu</strong> · introdus manual</span></li>
                  </ul>
                  <p className="mt-2 text-[color:var(--color-muted)]">Apasă pe bulina să mergi la sursa oficială.</p>
                </InfoHint>
                <Tooltip content="Primești o notificare cu o seară înainte de colectare, la ora aleasă de tine." side="bottom">
                  <button data-tour="notify" onClick={onNotify} className="cta-primary">
                    <Bell size={14} />
                    notificare cu o seară înainte
                  </button>
                </Tooltip>
                <ShareButton address={address} pickups={pickups} />
              </>
            ) : noData && sectorSource?.url ? (
              <a
                href={sectorSource.url}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="cta-primary"
              >
                <Bell size={14} />
                vezi la {sectorSource.label}
              </a>
            ) : null}
          </motion.div>
        </div>

        {/* scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-14 flex items-center gap-2 text-sm text-[color:var(--color-muted)]"
        >
          <ArrowDown size={14} className="animate-bounce" />
          <span>vezi toate colectările din următoarele 14 zile</span>
        </motion.div>
      </div>
    </section>
  );
}
