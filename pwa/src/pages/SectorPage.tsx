import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Mail, Building2, AlertTriangle, CheckCircle2, FileClock, Scale, MapPin, ShieldCheck } from 'lucide-react';
import { getSector, STATUS_META, FACTUAL_AS_OF, STANDARD_OBLIGATIONS } from '../lib/sectors.js';
import { Link } from '../lib/router.js';
import { SourceCitation } from '../components/SourceCitation.js';
import { LegalFooter } from '../components/LegalFooter.js';
import { ObligationItem } from '../components/ObligationItem.js';
import { usePageMeta, useStructuredData } from '../lib/meta.js';

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const months = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];
  return `${d} ${months[m - 1]} ${y}`;
}

export function SectorPage({ id }: { id: number }) {
  const sector = getSector(id);

  usePageMeta({
    title: sector
      ? `Sectorul ${id} (${sector.operator.name}) — situația datelor oficiale`
      : `Sectorul ${id} — informații indisponibile`,
    description: sector
      ? `${sector.statusSummary} Surse oficiale, contacte operator și primărie, metodologie. Factual la ${formatDate(FACTUAL_AS_OF)}.`
      : 'Pagina sectorului nu există.',
    canonical: sector ? `https://cand-reciclam.madeinro.eu/sector/${id}` : undefined,
    noindex: !sector,
  });

  useStructuredData(
    sector
      ? {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: `Programul colectării deșeurilor în Sectorul ${id}, București`,
          datePublished: FACTUAL_AS_OF,
          dateModified: sector.lastVerified,
          inLanguage: 'ro',
          author: { '@type': 'Person', name: 'Marian Matinca', url: 'https://mmatinca.eu' },
          publisher: { '@type': 'Organization', name: 'Când reciclăm?', url: 'https://cand-reciclam.madeinro.eu' },
          mainEntityOfPage: `https://cand-reciclam.madeinro.eu/sector/${id}`,
          about: { '@type': 'Thing', name: sector.operator.name },
        }
      : {},
  );

  if (!sector) {
    return (
      <>
        <main className="min-h-dvh p-8 text-center">
          <h1 className="text-2xl font-semibold">Sectorul {id} nu există.</h1>
          <Link to="/" className="cta-primary mt-6 inline-flex">
            <ArrowLeft size={14} /> Înapoi
          </Link>
        </main>
        <LegalFooter />
      </>
    );
  }

  const meta = STATUS_META[sector.status];
  const hasSchedule = sector.status === 'per-address' || sector.status === 'partial';

  return (
    <>
      <main className="relative min-h-dvh">
        <div className="relative">
          <div className="ambient-mesh opacity-60" aria-hidden style={{
            '--mesh-a': 'oklch(70% 0.08 150)',
            '--mesh-b': 'oklch(55% 0.12 140)',
            '--mesh-c': 'oklch(60% 0.06 170)',
          } as React.CSSProperties} />
          <div className="relative z-10 mx-auto max-w-4xl px-6 pt-10">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] transition"
            >
              <ArrowLeft size={14} /> Toate sectoarele
            </Link>
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 py-10">
          <motion.header
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-sm uppercase tracking-wider text-[color:var(--color-muted)] font-semibold mb-2">
              Sectorul {sector.id} · București
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
              {sector.operator.name}
            </h1>
            {sector.operator.legalName && sector.operator.legalName !== sector.operator.name && (
              <p className="mt-1 text-sm text-[color:var(--color-muted)] italic">
                {sector.operator.legalName}
              </p>
            )}
            <div className="mt-4 flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 text-sm uppercase tracking-wider font-semibold rounded-full border px-3 py-1.5 ${meta.chipClass}`}
              >
                {meta.label}
              </span>
            </div>
            <p className="mt-4 text-lg text-[color:var(--color-muted)] leading-relaxed max-w-3xl">
              {sector.statusSummary}
            </p>
            <SourceCitation source={sector.operator.source} className="mt-3" />

            {hasSchedule && (
              <Link
                to="/"
                className="cta-primary mt-6"
              >
                Caută adresa ta
              </Link>
            )}
          </motion.header>

          <div className="mt-12 space-y-10">
            {hasSchedule && (
              <Section
                icon={<CheckCircle2 size={20} className="text-emerald-600" />}
                title="Ce publică oficial operatorul"
              >
                {sector.published.length > 0 ? (
                  <ul className="space-y-4">
                    {sector.published.map((p, i) => (
                      <li
                        key={i}
                        className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4"
                      >
                        <div className="text-[15px] text-[color:var(--color-fg)] leading-relaxed mb-2">
                          {p.what}
                        </div>
                        <SourceCitation source={p.source} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[color:var(--color-muted)]">
                    Operatorul nu publică resurse online accesibile la data verificării.
                  </p>
                )}
              </Section>
            )}

            {hasSchedule && sector.notPublished.length > 0 && (
              <Section
                icon={<AlertTriangle size={20} className="text-amber-600" />}
                title="Ce NU publică online oficial"
              >
                <ul className="space-y-2 pl-1">
                  {sector.notPublished.map((n, i) => (
                    <li key={i} className="flex gap-2 text-[15px] leading-relaxed text-[color:var(--color-fg)]">
                      <span className="text-amber-600 shrink-0 mt-1">—</span>
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section
              icon={<Phone size={20} className="text-[color:var(--color-accent)]" />}
              title={hasSchedule ? 'Cum afli programul pentru adresa ta' : 'Contact operator'}
            >
              <ul className="space-y-4">
                {sector.howToFindSchedule.map((h, i) => (
                  <li
                    key={i}
                    className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <MethodIcon method={h.method} />
                      <div className="flex-1">
                        <div className="font-medium text-[color:var(--color-fg)]">{h.label}</div>
                        <div className="mt-1 text-[15px] text-[color:var(--color-muted)] leading-relaxed">
                          {h.details}
                        </div>
                        <SourceCitation source={h.source} compact className="mt-2" />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>

            <Section
              icon={<Building2 size={20} className="text-[color:var(--color-accent)]" />}
              title="Contact primărie sector"
            >
              <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
                <div className="font-medium text-[color:var(--color-fg)]">
                  {sector.municipalityContact.name}
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <SourceCitation source={sector.municipalityContact.website} compact />
                  {sector.municipalityContact.phone && (
                    <div className="text-[color:var(--color-muted)]">
                      Telefon: {sector.municipalityContact.phone.number}
                    </div>
                  )}
                  {sector.municipalityContact.email && (
                    <div className="text-[color:var(--color-muted)]">
                      Email: {sector.municipalityContact.email.address}
                    </div>
                  )}
                </div>
              </div>
            </Section>

            {hasSchedule && sector.historicalDocuments && sector.historicalDocuments.length > 0 && (
              <Section
                icon={<FileClock size={20} className="text-orange-600" />}
                title="Documente istorice externe"
              >
                <ul className="space-y-4">
                  {sector.historicalDocuments.map((d, i) => (
                    <li
                      key={i}
                      className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4"
                    >
                      <div className="font-medium text-[color:var(--color-fg)]">{d.title}</div>
                      <div className="mt-1 text-sm text-[color:var(--color-muted)]">
                        Publicat: {formatDate(d.publishedAt)}
                      </div>
                      <p className="mt-2 text-sm text-[color:var(--color-muted)] leading-relaxed">
                        ⚠ {d.disclaimer}
                      </p>
                      <SourceCitation source={d.source} compact className="mt-2" />
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {hasSchedule && sector.legislation && sector.legislation.length > 0 && (
              <Section
                icon={<Scale size={20} className="text-[color:var(--color-accent)]" />}
                title="Legislație de referință"
              >
                <ul className="space-y-3">
                  {sector.legislation.map((l, i) => (
                    <li
                      key={i}
                      className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4"
                    >
                      <p className="text-[15px] text-[color:var(--color-fg)] leading-relaxed">
                        {l.reference}
                      </p>
                      <SourceCitation source={l.source} compact className="mt-2" />
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Transparență și obligații — uniform pe toate sectoarele */}
            <section>
              <div className="mb-5">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <ShieldCheck size={20} className="text-[color:var(--color-accent)]" />
                  Transparență și obligații
                </h2>
                <p className="mt-2 text-sm text-[color:var(--color-muted)] leading-relaxed max-w-3xl">
                  Ce impune legea autorității locale pentru colectarea și gestiunea deșeurilor.
                  Publicăm obligația și termenul fix, cu link către sursele oficiale.
                  Pentru statusul operațional în timp real, deschide sursele vii marcate.
                </p>
              </div>
              <div className="space-y-4">
                {STANDARD_OBLIGATIONS.map((ob) => (
                  <ObligationItem
                    key={ob.id}
                    obligation={ob}
                    evidence={sector.obligationEvidence?.[ob.id]}
                  />
                ))}
              </div>
            </section>
          </div>

          <div className="mt-12 text-sm text-[color:var(--color-muted)]">
            Ultima verificare completă a paginii: <strong>{formatDate(sector.lastVerified)}</strong>.
            Pentru acuratețe maximă, deschide direct sursele oficiale linkate mai sus.
          </div>
        </div>
      </main>
      <LegalFooter />
    </>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="flex items-center gap-2 text-xl font-semibold mb-4">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function MethodIcon({ method }: { method: 'phone' | 'email' | 'app' | 'office' | 'containers' | 'cav' | 'website' }) {
  const common = 'shrink-0 mt-0.5 size-8 rounded-xl inline-flex items-center justify-center bg-[color:var(--color-avatar-bg)] text-[color:var(--color-avatar-fg)]';
  switch (method) {
    case 'phone':
      return <span className={common}><Phone size={16} /></span>;
    case 'email':
      return <span className={common}><Mail size={16} /></span>;
    case 'website':
      return <span className={common}><Building2 size={16} /></span>;
    default:
      return <span className={common}><MapPin size={16} /></span>;
  }
}
