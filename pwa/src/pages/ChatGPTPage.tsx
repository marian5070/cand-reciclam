import { ExternalLink } from 'lucide-react';
import { PageShell } from './StaticPages.js';
import { OpenAILogo } from '../components/OpenAILogo.js';
import { usePageMeta, useStructuredData } from '../lib/meta.js';

export const PLUGIN_URL =
  'https://chatgpt.com/plugins/plugin_asdk_app_6a5a1e1c646881919ea3a47685739b06';

export function ChatGPTPage() {
  usePageMeta({
    title: '„Când reciclăm?" e acum în ChatGPT — plugin evaluat și aprobat de OpenAI',
    description:
      'Din 21 iulie 2026, „Când reciclăm?" este plugin în directorul oficial ChatGPT — evaluat și aprobat de OpenAI. Întreabă direct în conversație când se colectează deșeurile la adresa ta din București.',
    canonical: 'https://cand-reciclam.madeinro.eu/chatgpt',
    image: 'https://cand-reciclam.madeinro.eu/og-chatgpt.png',
  });
  useStructuredData({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: '„Când reciclăm?" e acum în ChatGPT',
    url: 'https://cand-reciclam.madeinro.eu/chatgpt',
    inLanguage: 'ro',
    datePublished: '2026-07-22',
    image: 'https://cand-reciclam.madeinro.eu/og-chatgpt.png',
    author: { '@type': 'Person', name: 'Marian Matinca', url: 'https://mmatinca.eu' },
    about: {
      '@type': 'SoftwareApplication',
      name: 'Când Reciclăm — plugin ChatGPT',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'ChatGPT',
      softwareVersion: '1.0.0',
      url: PLUGIN_URL,
    },
  });

  return (
    <PageShell title={'„Când reciclăm?" e acum în ChatGPT'}>
      <p className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-tinted)] px-4 py-2 text-sm font-semibold text-[color:var(--color-fg)] not-prose">
        <OpenAILogo className="w-5 h-5 shrink-0 text-[color:var(--color-accent)]" />
        Evaluat și aprobat de OpenAI
      </p>

      <p>
        Din <strong>21 iulie 2026</strong>, „Când reciclăm?" este disponibil ca{' '}
        <strong>plugin în directorul oficial ChatGPT</strong> — trimis, evaluat, aprobat și
        publicat prin procesul oficial OpenAI (versiunea 1.0.0). Aceleași date oficiale pe
        care le găsești pe acest site, acum direct în conversațiile tale din ChatGPT.
      </p>

      <h2>Ce poți întreba</h2>
      <ul>
        <li>„@Când Reciclăm Când se ridică gunoiul pe Strada Aviatorilor 20?"</li>
        <li>„@Când Reciclăm Unde arunc bateriile uzate în București?"</li>
        <li>„@Când Reciclăm Unde arunc uleiul alimentar?"</li>
      </ul>

      <h2>Ce primești</h2>
      <p>
        Calendarul real de colectare pe adresă pentru <strong>Sectorul 1</strong> (și deșeuri
        menajere pentru <strong>Sectorul 2</strong>), extras din publicațiile oficiale ale
        operatorilor, cu sursa la fiecare rând. Pentru sectoarele 3–6, transparent: ce
        publică și ce nu fiecare operator și cum poți afla concret (dispecerate, puncte de
        colectare, aplicații partenere). Plus ghidul practic de sortare pentru cazurile
        grele: baterii, ulei alimentar, medicamente, deșeuri electrice, voluminoase, textile
        și garanția-depozit SGR. Gratuit, fără cont, fără reclame.
      </p>

      <h2>Cum îl folosești</h2>
      <ol>
        <li>
          Deschide{' '}
          <a href={PLUGIN_URL} target="_blank" rel="nofollow noopener noreferrer">
            pagina pluginului în ChatGPT
          </a>{' '}
          și apasă „Install plugin" (în aplicația de telefon: „Încearcă în discuție").
        </li>
        <li>
          Într-o conversație, scrie <strong>@Când Reciclăm</strong> urmat de întrebarea ta.
        </li>
      </ol>

      <p>
        Pluginul este <strong>read-only</strong>: caută și prezintă informații publice, nu
        modifică nimic și nu cere cont. Codul întregului proiect rămâne{' '}
        <a
          href="https://github.com/marian5070/cand-reciclam"
          target="_blank"
          rel="nofollow noopener noreferrer"
        >
          open source
        </a>
        .
      </p>

      <h2>Demo</h2>
      <video
        controls
        preload="none"
        poster="/og-chatgpt.png"
        className="w-full rounded-2xl border border-[color:var(--color-border)] not-prose"
      >
        <source src="/demo-chatgpt.mp4" type="video/mp4" />
        Browserul tău nu poate reda acest video.
      </video>

      <p className="not-prose mt-8">
        <a
          href={PLUGIN_URL}
          target="_blank"
          rel="nofollow noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-strong)] px-6 py-3 !text-white font-medium transition-colors !no-underline"
        >
          <OpenAILogo className="w-4 h-4 shrink-0" />
          Încearcă în ChatGPT acum
          <ExternalLink size={16} />
        </a>
      </p>
    </PageShell>
  );
}
