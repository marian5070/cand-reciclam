import { useEffect, useState } from 'react';
import { Router, type Route, usePathname } from './lib/router.js';
import { LandingPage } from './pages/LandingPage.js';
import { SectorPage } from './pages/SectorPage.js';
import { SchedulePage } from './pages/SchedulePage.js';
import { AboutPage, TermsPage, PrivacyPage } from './pages/StaticPages.js';
import { ThemeToggle } from './components/ThemeToggle.js';
import { HelpToggle } from './components/HelpToggle.js';
import { Tour, type TourStep } from './components/Tour.js';
import { LegalFooter } from './components/LegalFooter.js';
import { MapPin } from 'lucide-react';
import { Link } from './lib/router.js';

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="address"]',
    title: 'Adresa ta',
    body: 'Aceasta e adresa. Apasă oricând pe pill ca să o schimbi.',
    side: 'bottom',
  },
  {
    target: '[data-tour="waste"]',
    title: 'Tipul următor',
    body: 'Aici vezi ce tip de deșeu se scoate la următoarea colectare.',
    side: 'bottom',
  },
  {
    target: '[data-tour="source"]',
    title: 'Sursa oficială',
    body: 'Fiecare program are sursa oficială linkată. Apasă ca să ajungi direct la operator.',
    side: 'bottom',
  },
  {
    target: '[data-tour="timeline"]',
    title: '14 zile înainte',
    body: 'Trage orizontal ca să vezi zilele următoare.',
    side: 'top',
  },
];

export function App() {
  const [tourOpen, setTourOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '?') { e.preventDefault(); setTourOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const routes: Route[] = [
    { path: '/', render: () => <LandingPage /> },
    { path: '/sector/:id', render: (p) => <SectorPage id={Number(p.id)} /> },
    {
      path: '/adresa/:streetId/:number',
      render: (p) => {
        const sector = new URLSearchParams(window.location.search).get('sector');
        return (
          <SchedulePage
            streetId={Number(p.streetId)}
            number={Number(p.number)}
            sector={sector ? Number(sector) : undefined}
          />
        );
      },
    },
    { path: '/despre', render: () => <AboutPage /> },
    { path: '/termeni', render: () => <TermsPage /> },
    { path: '/confidentialitate', render: () => <PrivacyPage /> },
  ];

  const showTourButton = pathname.startsWith('/adresa/');

  return (
    <>
      <Router routes={routes} notFound={<NotFound />} />

      {showTourButton && (
        <Tour
          steps={TOUR_STEPS}
          forceOpen={tourOpen}
          onClose={() => setTourOpen(false)}
        />
      )}
      <ThemeToggle />
      {showTourButton && <HelpToggle onReplayTour={() => setTourOpen(true)} />}
    </>
  );
}

function NotFound() {
  return (
    <>
      <main className="min-h-dvh flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🌿</div>
          <h1 className="text-3xl font-semibold">Pagina nu există</h1>
          <p className="mt-3 text-[color:var(--color-muted)]">
            Link-ul pe care l-ai urmat nu duce nicăieri pe acest site.
          </p>
          <Link to="/" className="cta-primary mt-6 inline-flex">
            <MapPin size={14} /> Acasă
          </Link>
        </div>
      </main>
      <LegalFooter />
    </>
  );
}
