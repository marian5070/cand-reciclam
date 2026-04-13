import { Flag, Info, Book, ArrowRight } from 'lucide-react';

export function Footer({ onOpenGuide }: { onOpenGuide?: () => void }) {
  return (
    <footer className="relative mt-16 mb-10">
      <div className="mx-auto max-w-2xl px-6 space-y-4">
        {/* Guide CTA — big, inviting */}
        <button
          onClick={onOpenGuide}
          className="group w-full rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 text-left transition hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-fg)]/5"
        >
          <div className="flex items-center gap-4">
            <span className="shrink-0 inline-flex items-center justify-center size-11 rounded-2xl bg-[color:var(--color-avatar-bg)] text-[color:var(--color-avatar-fg)]">
              <Book size={18} />
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold">Ghid complet de sortare</h3>
              <p className="mt-0.5 text-sm text-[color:var(--color-muted)]">
                Ce se pune și ce nu · unde predai bateriile, uleiul, medicamentele
              </p>
            </div>
            <ArrowRight size={16} className="shrink-0 text-[color:var(--color-muted)] group-hover:text-[color:var(--color-accent)] transition" />
          </div>
        </button>

        <div className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/50 p-6 backdrop-blur-sm">
          <h3 className="flex items-center gap-2 text-sm font-medium text-[color:var(--color-fg)]">
            <Info size={16} />
            Despre datele noastre
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-muted)]">
            Noi colectăm și centralizăm informații din surse oficiale (primării, operatori). <strong className="text-[color:var(--color-fg)]">Nu suntem sursă de adevăr.</strong> Fiecare program are linkul către sursa inițială — dacă vezi ceva greșit, spune-ne.
          </p>
          <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--color-accent)] hover:text-[color:var(--color-accent-strong)] transition">
            <Flag size={14} />
            raportează o zi greșită
          </button>
        </div>
        <p className="mt-6 text-center text-sm text-[color:var(--color-subtle)]">
          © când reciclăm? · date OSM © OpenStreetMap
        </p>
      </div>
    </footer>
  );
}
