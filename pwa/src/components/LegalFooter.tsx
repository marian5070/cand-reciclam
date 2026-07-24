import { AlertCircle } from 'lucide-react';
import { FACTUAL_AS_OF } from '../lib/sectors.js';

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const months = [
    'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
    'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
  ];
  return `${d} ${months[m - 1]} ${y}`;
}

/**
 * Global legal footer — appears at the bottom of every page.
 * Includes:
 *  1. Factual-as-of disclaimer (legal protection + transparency about data age)
 *  2. Navigation to /termeni, /confidentialitate, /despre
 *  3. Author credit + related portfolio projects
 */
export function LegalFooter() {
  return (
    <footer className="relative mt-20 border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-tinted)]">
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        {/* Zone 1 — Legal + factual */}
        <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-[color:var(--color-accent)] shrink-0 mt-0.5" aria-hidden />
            <div className="text-sm leading-relaxed text-[color:var(--color-fg)]">
              <p>
                Situația prezentată pe acest site este <strong>factuală la data de {formatDate(FACTUAL_AS_OF)}</strong>.
                Informațiile provin exclusiv din surse oficiale publicate de autorități locale
                și operatori de salubritate. Fiecare afirmație are sursa oficială linkată alături.
              </p>
              <p className="mt-2 text-[color:var(--color-muted)]">
                Acuratețea și actualizarea datelor originale sunt responsabilitatea exclusivă
                a emitenților (primării, operatori). Noi agregăm și prezentăm; nu garantăm
                corectitudinea datelor. Pentru decizii importante, verifică direct la sursa
                oficială marcată pe fiecare pagină.
              </p>
            </div>
          </div>

          <nav className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <a href="/despre" className="text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] transition">
              Despre proiect
            </a>
            <a href="/termeni" className="text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] transition">
              Termeni de utilizare
            </a>
            <a href="/confidentialitate" className="text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] transition">
              Confidențialitate
            </a>
            <a href="/contact" className="text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] transition">
              Contact
            </a>
            <a href="/chatgpt" className="text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] transition">
              Plugin ChatGPT
            </a>
            <a href="/cum-functioneaza" className="text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] transition">
              Cum funcționează
            </a>
          </nav>
        </section>

        {/*
          Zone 2 — Author + portfolio.
          IMPORTANT: linkurile portofoliu (mmatinca.eu, tv.madeinro.eu,
          travel-trends.mmatinca.eu) trebuie să rămână DOFOLLOW —
          rel doar "noopener noreferrer", FĂRĂ "nofollow". Astea sunt
          singurele linkuri externe care pasează autoritate SEO din acest site.
          Toate celelalte linkuri externe (surse oficiale, OSM, terțe părți)
          poartă rel="nofollow noopener noreferrer".
        */}
        <section className="grid gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm text-[color:var(--color-muted)]">
              © {new Date().getFullYear()}{' '}
              <a
                href="https://mmatinca.eu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[color:var(--color-fg)] font-medium hover:text-[color:var(--color-accent)] underline underline-offset-2 decoration-[color:var(--color-muted)]/40"
              >
                Marian Matinca
              </a>
              {' '}· când reciclăm?
            </p>
            <p className="mt-1 text-xs text-[color:var(--color-subtle)]">
              Open-source. Date OSM © OpenStreetMap contributors.
            </p>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-[color:var(--color-muted)] font-semibold mb-2">
              Alte proiecte
            </div>
            <ul className="space-y-1.5 text-sm">
              <li>
                <a href="https://avizo.ro" target="_blank" rel="noopener noreferrer" className="text-[color:var(--color-fg)] hover:text-[color:var(--color-accent)] transition">
                  Avizo — alerte de conformitate pentru firme
                  <span className="block text-xs text-[color:var(--color-subtle)]">avizo.ro</span>
                </a>
              </li>
              <li>
                <a href="https://tv.madeinro.eu" target="_blank" rel="noopener noreferrer" className="text-[color:var(--color-fg)] hover:text-[color:var(--color-accent)] transition">
                  Ghid TV, cinema streaming și teatru
                  <span className="block text-xs text-[color:var(--color-subtle)]">tv.madeinro.eu</span>
                </a>
              </li>
              <li>
                <a href="https://travel-trends.mmatinca.eu" target="_blank" rel="noopener noreferrer" className="text-[color:var(--color-fg)] hover:text-[color:var(--color-accent)] transition">
                  EU travel trends 2015–2026
                  <span className="block text-xs text-[color:var(--color-subtle)]">travel-trends.mmatinca.eu</span>
                </a>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </footer>
  );
}
