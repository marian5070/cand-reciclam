import { ArrowLeft } from 'lucide-react';
import { Link } from '../lib/router.js';
import { LegalFooter } from '../components/LegalFooter.js';
import { usePageMeta, useStructuredData } from '../lib/meta.js';
import { FACTUAL_AS_OF } from '../lib/sectors.js';

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const months = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];
  return `${d} ${months[m - 1]} ${y}`;
}

function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <main className="min-h-dvh">
        <div className="mx-auto max-w-3xl px-6 pt-10 pb-14">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] transition"
          >
            <ArrowLeft size={14} /> Acasă
          </Link>
          <h1 className="mt-6 text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
            {title}
          </h1>
          <div className="mt-8 prose-ro">{children}</div>
        </div>
      </main>
      <LegalFooter />
    </>
  );
}

export function AboutPage() {
  usePageMeta({
    title: 'Despre proiect · metodologie și sursă cod',
    description:
      'Despre „Când reciclăm?": ce face, ce nu face, cum colectăm datele, ce e public și ce nu. Cod open-source.',
    canonical: 'https://cand-reciclam.madeinro.eu/despre',
  });
  useStructuredData({
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'Despre proiect — Când reciclăm?',
    url: 'https://cand-reciclam.madeinro.eu/despre',
    inLanguage: 'ro',
    description:
      'Ce face și ce nu face „Când reciclăm?", cum colectăm datele oficiale despre colectarea deșeurilor în București și cum poți contribui.',
    dateModified: FACTUAL_AS_OF,
    author: { '@type': 'Person', name: 'Marian Matinca', url: 'https://mmatinca.eu' },
    about: {
      '@type': 'WebSite',
      name: 'Când reciclăm?',
      url: 'https://cand-reciclam.madeinro.eu/',
    },
  });
  return (
    <PageShell title="Despre proiect">
      <p>
        <strong>Când reciclăm?</strong> este un agregator de informație publică despre
        colectarea deșeurilor în București. Prezintă programul oficial per adresă
        acolo unde operatorii îl publică online, și situația factuală (cu surse
        oficiale) acolo unde nu îl publică.
      </p>

      <h2>Ce face</h2>
      <ul>
        <li>
          Pentru <strong>Sectorul 1</strong> (Romprest): scrapăm automat tabelele
          oficiale HTML cu programul per stradă și număr pentru case și asociații.
        </li>
        <li>
          Pentru <strong>Sectorul 2</strong> (Supercom): scrapăm automat formularul
          oficial de căutare per stradă, pentru colectarea menajer.
        </li>
        <li>
          Pentru <strong>Sectoarele 3, 4, 5, 6</strong>: agregăm manual informațiile
          oficiale disponibile (operatori, primării, legislație) — fiecare afirmație
          are o sursă oficială linkată.
        </li>
      </ul>

      <h2>Ce nu face</h2>
      <ul>
        <li>Nu inventăm și nu aproximăm programe unde nu avem date oficiale.</li>
        <li>Nu folosim date publicate prin canale neoficiale (Facebook, bloguri).</li>
        <li>Nu colectăm date personale identificabile despre utilizatori.</li>
        <li>Nu vindem date către terți.</li>
      </ul>

      <h2>Cum colectăm datele</h2>
      <p>
        Scraperele S1 și S2 rulează automat pe snapshot-uri ale site-urilor oficiale.
        Codul lor este <a href="https://github.com/marianhp" target="_blank" rel="nofollow noopener noreferrer">public</a> (când repo-ul
        e publicat). Pentru S3-S6, informațiile sunt curate manual din surse
        oficiale și re-verificate periodic; data ultimei verificări e afișată pe
        fiecare pagină de sector.
      </p>
      <p>
        Fiecare fapt din aplicație are o sursă oficială linkată alături (click → se
        deschide pagina originală într-un tab nou). Dacă nu există sursă, nu
        publicăm.
      </p>

      <h2>Cum poți ajuta</h2>
      <ul>
        <li>
          Dacă observi o eroare, sursă lipsă sau informație depășită, semnalează
          prin butonul de raportare (în curând).
        </li>
        <li>
          Dacă cunoști o sursă oficială pe care am ratat-o, trimite-o prin email.
        </li>
        <li>
          Dacă ești cineva de la o primărie sau operator care vrea să își publice
          datele într-un format deschis, e bine venit.
        </li>
      </ul>

      <h2>Autor</h2>
      <p>
        Proiect realizat de <a href="https://mmatinca.eu" target="_blank" rel="noopener noreferrer">Marian Matinca</a>.
        Parte dintr-un portofoliu de proiecte digitale cu scop civic/informativ.
      </p>

      <p className="text-sm text-[color:var(--color-muted)]">
        Pagină verificată la {formatDate(FACTUAL_AS_OF)}.
      </p>
    </PageShell>
  );
}

export function TermsPage() {
  usePageMeta({
    title: 'Termeni de utilizare',
    description: 'Termeni de utilizare pentru „Când reciclăm?". Responsabilitatea datelor, limitări, licență.',
    canonical: 'https://cand-reciclam.madeinro.eu/termeni',
  });
  return (
    <PageShell title="Termeni de utilizare">
      <p className="text-sm text-[color:var(--color-muted)]">
        Ultima actualizare: {formatDate(FACTUAL_AS_OF)}
      </p>

      <h2>1. Natura informațiilor prezentate</h2>
      <p>
        Acest site este un <strong>agregator</strong> de informații publicate oficial
        de autorități locale (primării de sector, Consiliul General al Municipiului
        București) și de operatorii de salubritate licențiați (Romprest, Supercom,
        Direcția Generală de Salubritate Sector 3, CLEAN ALL 4 CITY SA, Salubrizare
        Sector 5 SA, URBAN SA). Fiecare afirmație publicată are linkul către sursa
        oficială alături.
      </p>

      <h2>2. Responsabilitatea acurateței</h2>
      <p>
        <strong>Acuratețea și actualizarea datelor originale sunt responsabilitatea
        exclusivă a emitenților</strong> (autorități și operatori). Noi prezentăm
        starea publicată la data verificării, nu garantăm corectitudinea acestei
        stări. Orice program de colectare se poate modifica fără notificare; pentru
        decizii importante, verifică direct la sursa oficială linkată pe pagină.
      </p>

      <h2>3. Factualitate la data publicării</h2>
      <p>
        Situația prezentată este factuală la data de{' '}
        <strong>{formatDate(FACTUAL_AS_OF)}</strong>. Revizuim periodic datele, dar
        nu oferim garanții de actualitate în timp real. Data ultimei verificări
        este afișată pe fiecare pagină.
      </p>

      <h2>4. Limitarea răspunderii</h2>
      <p>
        Utilizarea site-ului este pe propria răspundere. Nu ne asumăm răspundere
        pentru eventuale pagube, costuri sau alte consecințe rezultate din:
      </p>
      <ul>
        <li>informații depășite publicate de emitenții originali;</li>
        <li>modificări neanunțate ale programelor de colectare;</li>
        <li>întreruperi de serviciu ale acestui site sau ale surselor sale;</li>
        <li>erori de traducere, interpretare sau agregare.</li>
      </ul>

      <h2>5. Licență de conținut</h2>
      <p>
        Textele originale ale site-ului (explicații, metodologie) sunt publicate
        sub licență <a href="https://creativecommons.org/licenses/by/4.0/deed.ro" target="_blank" rel="nofollow noopener noreferrer">CC-BY 4.0</a>.
        Datele provin din surse oficiale publice (fiecare cu licența sa, citată pe
        pagini). Codul aplicației este open-source (detalii în pagina „Despre").
      </p>

      <h2>6. Date utilizator</h2>
      <p>
        Pentru detalii despre ce stocăm (UUID local, opțiuni notificări), vezi
        pagina <Link to="/confidentialitate">Confidențialitate</Link>.
      </p>

      <h2>7. Semnalări și corecții</h2>
      <p>
        Orice eroare observată poate fi semnalată prin formularul de feedback (în
        curând). Verificăm semnalările în 48 de ore lucrătoare și actualizăm sau
        marcăm explicit „în investigație".
      </p>

      <h2>8. Jurisdicție</h2>
      <p>
        Orice litigiu este guvernat de legea română. Instanța competentă este cea
        de la sediul titularului proiectului.
      </p>
    </PageShell>
  );
}

export function PrivacyPage() {
  usePageMeta({
    title: 'Confidențialitate · ce date stocăm',
    description: 'Politica de confidențialitate. Ce stocăm (minim), unde, pentru cât timp.',
    canonical: 'https://cand-reciclam.madeinro.eu/confidentialitate',
  });
  return (
    <PageShell title="Confidențialitate">
      <p className="text-sm text-[color:var(--color-muted)]">
        Ultima actualizare: {formatDate(FACTUAL_AS_OF)}
      </p>

      <h2>Principiul de bază</h2>
      <p>
        Nu colectăm date personale identificabile. Nu cerem cont, email, nume sau
        număr de telefon pentru a folosi aplicația.
      </p>

      <h2>Ce stocăm în dispozitivul tău (localStorage)</h2>
      <ul>
        <li>
          <strong>Adresa aleasă</strong> (nume stradă, număr, sector) — doar în
          browser-ul tău, ca să nu o reintroduci la fiecare vizită.
        </li>
        <li>
          <strong>Preferință temă</strong> (auto / light / dark).
        </li>
        <li>
          <strong>Flag „tur văzut"</strong> (ca să nu îți arătăm turul de mai multe
          ori).
        </li>
        <li>
          <strong>UUID user anonim</strong> — generat local, folosit doar pentru a
          asocia subscripția de notificări push cu dispozitivul tău. Nu identifică
          persoana.
        </li>
      </ul>
      <p>
        Aceste date sunt stocate exclusiv în browser-ul tău și pot fi șterse oricând
        din setările browser-ului (șterge cookies/site data).
      </p>

      <h2>Ce stocăm pe serverul nostru</h2>
      <p>
        <strong>Doar pentru utilizatorii care activează notificările push:</strong>
      </p>
      <ul>
        <li>UUID anonim (random, nu identifică persoana)</li>
        <li>Identificatorul subscripției push (endpoint+cheie emisă de browser)</li>
        <li>Adresa pentru care vrei notificări (street ID, număr, sector)</li>
        <li>Ora la care vrei notificarea (16-22)</li>
      </ul>
      <p>
        Nu stocăm IP-uri, user-agent-uri, sau alte date despre dispozitiv. Nu
        folosim cookies de tracking.
      </p>

      <h2>Analytics</h2>
      <p>
        Nu folosim Google Analytics, Facebook Pixel sau alte servicii terțe de
        tracking. Serverul nostru ține loguri tehnice minime (codul de stare al
        request-urilor) rotite la 7 zile.
      </p>

      <h2>Dezabonare și ștergere</h2>
      <p>
        Poți dezactiva notificările direct din aplicație (în dialogul de notificări).
        Dezactivarea șterge subscripția de pe server. Pentru ștergere totală
        (inclusiv UUID), șterge datele browser-ului pentru acest site.
      </p>

      <h2>Date externe</h2>
      <ul>
        <li>
          <strong>Leaflet + OpenStreetMap</strong>: harta descarcă tile-uri de la
          tile.openstreetmap.org. OpenStreetMap poate loga IP-ul tău conform
          politicii proprii.
        </li>
        <li>
          <strong>Nominatim (geocodare)</strong>: când afișăm harta adresei tale,
          facem o cerere către Nominatim prin serverul nostru (proxy), astfel IP-ul
          tău nu ajunge la Nominatim. Răspunsul e cache-at.
        </li>
      </ul>

      <h2>Minori</h2>
      <p>
        Aplicația nu e destinată expres copiilor sub 13 ani, dar nu colectăm date
        care să permită identificarea vreunui minor.
      </p>

      <h2>Modificări</h2>
      <p>
        Orice modificare a acestei politici va fi reflectată aici cu noua dată de
        actualizare.
      </p>
    </PageShell>
  );
}
