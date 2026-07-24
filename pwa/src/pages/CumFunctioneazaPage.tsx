import { ExternalLink, FileSearch } from 'lucide-react';
import { PageShell } from './StaticPages.js';
import { OpenAILogo } from '../components/OpenAILogo.js';
import { usePageMeta, useStructuredData } from '../lib/meta.js';
import { PLUGIN_URL } from './ChatGPTPage.js';

const CASE_STUDY_URL = 'https://mmatinca.eu/blog/studiu-de-caz-cand-reciclam';

export function CumFunctioneazaPage() {
  usePageMeta({
    title: 'Cum funcționează „Când reciclăm?” — de la sursele oficiale la răspunsul tău',
    description:
      'Drumul complet al informației: programele operatorilor oficiali, normalizate automat în reguli per segment de stradă, servite identic pe site, în PWA și în ChatGPT. Cu link către studiul de caz complet.',
    canonical: 'https://cand-reciclam.madeinro.eu/cum-functioneaza',
    image: 'https://cand-reciclam.madeinro.eu/og-chatgpt.png',
  });
  useStructuredData({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Cum funcționează „Când reciclăm?”',
    url: 'https://cand-reciclam.madeinro.eu/cum-functioneaza',
    inLanguage: 'ro',
    datePublished: '2026-07-24',
    author: { '@type': 'Person', name: 'Marian Matinca', url: 'https://mmatinca.eu' },
  });

  return (
    <PageShell title={'Cum funcționează „Când reciclăm?”'}>
      <p>
        Fiecare răspuns din aplicație — pe site sau în ChatGPT — vine din aceleași date,
        colectate automat din sursele oficiale ale operatorilor de salubritate. Iată drumul
        complet al informației, de la publicațiile operatorilor până la răspunsul de pe
        ecranul tău.
      </p>

      <img
        src="/arhitectura.svg"
        alt="Arhitectura Când Reciclăm: utilizatorul întreabă în ChatGPT, serverul MCP expune 5 tool-uri peste API-ul aplicației, datele vin automat din surse oficiale"
        className="w-full rounded-2xl border border-[color:var(--color-border)] not-prose"
        loading="lazy"
      />

      <h2>De unde vin datele</h2>
      <p>
        Programele de colectare sunt preluate automat din publicațiile operatorilor oficiali
        — <strong>Romprest</strong> pentru Sectorul 1, <strong>Supercom</strong> pentru
        Sectorul 2 — și transformate în reguli clare per segment de stradă. Fiecare
        informație păstrează sursa: peste 30 de domenii oficiale sunt citate în conținutul
        aplicației.
      </p>
      <p>
        Pentru sectoarele care nu publică programe per adresă, aplicația nu inventează
        nimic: îți spune onest ce publică și ce nu fiecare operator și cum poți afla concret
        — dispecerate, puncte de colectare, canale oficiale.
      </p>

      <h2>Aceleași date, trei forme</h2>
      <ul>
        <li>
          <strong>Site-ul</strong> — cauți strada, primești programul pe fracții.
        </li>
        <li>
          <strong>PWA instalabilă</strong> — cu notificări push înainte de ziua colectării.
        </li>
        <li>
          <strong>ChatGPT</strong> — întrebi în limbaj natural; aplicația a fost evaluată,
          aprobată și publicată de OpenAI în catalogul de aplicații pe{' '}
          <a href="/chatgpt">21 iulie 2026</a>.
        </li>
      </ul>
      <p>
        Site-ul, PWA-ul și ChatGPT-ul folosesc aceeași sursă de date. Nu există versiuni
        diferite ale adevărului.
      </p>

      <h2>Open source</h2>
      <p>
        Codul aplicației e public pe GitHub (
        <a
          href="https://github.com/marian5070/cand-reciclam"
          target="_blank"
          rel="nofollow noopener noreferrer"
        >
          marian5070/cand-reciclam
        </a>
        ) — oricine îl poate audita sau adapta pentru alt oraș.
      </p>

      <h2>Povestea completă</h2>
      <p>
        Vrei arhitectura, provocările și deciziile din spatele aplicației? Studiul de caz
        complet — cu diagrame și numai fapte verificabile — e publicat pe mmatinca.eu.
      </p>

      <div className="not-prose mt-8 flex flex-wrap gap-3">
        <a
          href={CASE_STUDY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-strong)] px-6 py-3 !text-white font-medium transition-colors !no-underline"
        >
          <FileSearch size={16} />
          Citește studiul de caz
          <ExternalLink size={16} />
        </a>
        <a
          href={PLUGIN_URL}
          target="_blank"
          rel="nofollow noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--color-border)] px-6 py-3 font-medium text-[color:var(--color-fg)] transition hover:border-[color:var(--color-accent)] !no-underline"
        >
          <OpenAILogo className="w-4 h-4 shrink-0" />
          Încearcă în ChatGPT
        </a>
      </div>
    </PageShell>
  );
}
