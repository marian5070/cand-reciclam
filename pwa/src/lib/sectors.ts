/**
 * Date structurate per sector cu atribuire sursă oficială + dată verificare.
 *
 * Regulă: fiecare afirmație are o sursă oficială verificabilă. Fără speculații,
 * fără „aproximativ". Dacă nu avem sursă, nu afirmăm.
 */

export type OfficialSource = {
  /** URL-ul sursei oficiale (web, document, număr telefon ca tel: etc.) */
  url: string;
  /** Emitentul oficial al informației (operator, primărie, minister) */
  emitent: string;
  /** Titlul paginii/documentului, dacă e cunoscut */
  title?: string;
  /** Tipul sursei */
  type: 'webpage' | 'pdf' | 'docx' | 'api-scrape' | 'phone' | 'email' | 'hcl' | 'app';
  /** Când a publicat emitentul, dacă e declarat în sursă (ISO YYYY-MM-DD) */
  publishedAt?: string;
  /** Când am verificat noi ultima dată această sursă (ISO YYYY-MM-DD) */
  verifiedAt: string;
};

export type SectorStatus =
  | 'per-address'       // S1: schedule complet per adresă, scrapat automat
  | 'partial'           // S2: scrapat, dar doar o fracție (menajer)
  | 'frequency-only'    // S5: știm pattern general, nu ziua exactă
  | 'transition'        // S4: operator în schimbare, site nou nepublicat
  | 'via-partner'       // S6: operatorul direcționează spre aplicație parteneră
  | 'no-public-data';   // S3: nu există date publice per adresă

export type SectorInfo = {
  id: 1 | 2 | 3 | 4 | 5 | 6;
  slug: string; // 'sectorul-1' ... pentru URL
  /** Titlul scurt folosit în UI */
  title: string;
  /** Operatorul principal */
  operator: {
    name: string;
    legalName?: string;
    source: OfficialSource;
  };
  status: SectorStatus;
  /** Sumar de o propoziție al situației */
  statusSummary: string;
  /** Ce publică oficial operatorul (liste de resurse cu sursă) */
  published: Array<{
    what: string;
    source: OfficialSource;
  }>;
  /** Ce NU publică online (enumerare factuală, fără speculații) */
  notPublished: string[];
  /** Cum poate afla cetățeanul programul pentru adresa sa */
  howToFindSchedule: Array<{
    method: 'phone' | 'email' | 'app' | 'office' | 'containers' | 'cav' | 'website';
    label: string;
    details: string;
    source: OfficialSource;
  }>;
  /** Contact cu primăria sectorului (titular contract salubritate) */
  municipalityContact: {
    name: string;
    website: OfficialSource;
    phone?: { number: string; source: OfficialSource };
    email?: { address: string; source: OfficialSource };
  };
  /** Documente istorice sau externe găsite, cu disclaimer când e cazul */
  historicalDocuments?: Array<{
    title: string;
    source: OfficialSource;
    publishedAt: string;
    disclaimer: string;
  }>;
  /** Legislație de referință (HCL, acte normative) */
  legislation?: Array<{
    reference: string;
    source: OfficialSource;
  }>;
  /** Ultima dată când am revizuit complet această pagină */
  lastVerified: string;
  /** Obligații legale + risc financiar PNRR specifice sectorului (pe lângă cele standard) */
  extraObligations?: Obligation[];
  /** Dovezi punctuale sector-specifice pentru obligațiile standard (ex. contract PNRR S6) */
  obligationEvidence?: Record<string, Array<{ what: string; source: OfficialSource }>>;
};

/** Mecanism / bază legală / termene pentru o obligație a autorității locale. */
export type Obligation = {
  /** id stabil pentru referențiere din evidență per-sector */
  id: string;
  title: string;
  /** Ce impune legea, pe scurt */
  summary: string;
  /** Baza legală (unul sau mai multe acte) */
  legalBase: Array<{ law: string; source: OfficialSource }>;
  /** Termene absolute (data fixă + descriere + status dacă e verificabil public) */
  deadlines: Array<{
    date: string;
    description: string;
    status?: 'met' | 'missed' | 'in-progress' | 'unknown';
  }>;
  /** Dacă obligația e finanțată PNRR: mecanismul de penalizare + surse vii pentru status */
  financialRisk?: {
    description: string;
    liveStatusSources: OfficialSource[];
  };
};

const TODAY = '2026-04-13';

/**
 * Obligații legale standard, aplicabile TUTUROR sectoarelor Bucureștiului.
 * Fiecare afirmație e ancorată într-un act normativ cu link.
 *
 * Filozofie: noi publicăm obligația (stabilă în timp) + termenul fix +
 * mecanismul de penalizare PNRR. NU republicăm cifre de status care decad —
 * acelea rămân la sursa vie (Monitor PNRR, anunțuri primărie).
 */
export const STANDARD_OBLIGATIONS: Obligation[] = [
  {
    id: 'separate-collection-5-fractions',
    title: 'Colectare separată pe 5 fracții',
    summary:
      'Hârtie/carton (albastru), plastic/metal (galben), sticlă (verde), bio (maro), rezidual (negru) — colectate separat. LPA (autoritățile locale) au obligația să asigure infrastructura și programul.',
    legalBase: [
      {
        law: 'Directiva 2008/98/CE revizuită prin Directiva 2018/851 (UE)',
        source: {
          url: 'https://eur-lex.europa.eu/eli/dir/2018/851/oj',
          emitent: 'Uniunea Europeană',
          title: 'Directiva 2018/851 privind deșeurile',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
      {
        law: 'OUG 92/2021 privind regimul deșeurilor (RO)',
        source: {
          url: 'https://legislatie.just.ro/Public/DetaliiDocument/245846',
          emitent: 'Portal legislativ',
          title: 'OUG 92/2021',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
    ],
    deadlines: [
      {
        date: '2019-07-01',
        description: 'Colectare separată hârtie/metal/plastic/sticlă (UE)',
        status: 'in-progress',
      },
      {
        date: '2023-12-31',
        description: 'Colectare separată bio sau tratare la sursă (UE)',
        status: 'missed',
      },
      {
        date: '2025-01-01',
        description: 'Colectare separată textile uzate + deșeuri menajere periculoase (UE)',
        status: 'in-progress',
      },
    ],
  },
  {
    id: 'digital-eco-islands',
    title: 'Insule ecologice digitalizate',
    summary:
      'Puncte de colectare cu acces pe card, containere îngropate sau supraterane dotate cu cântar pentru cuantificarea individuală. Obligație legală + proiect finanțat prin PNRR (Investiția I1b).',
    legalBase: [
      {
        law: 'OUG 133/2022 (modifică Legea 101/2006 + OUG 92/2021)',
        source: {
          url: 'https://legislatie.just.ro/public/DetaliiDocument/259800',
          emitent: 'Portal legislativ',
          title: 'OUG 133/2022',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
      {
        law: 'PNRR Componenta C3, Investiția I1b — Construirea de insule ecologice digitalizate',
        source: {
          url: 'https://pnrr.mmap.ro/wp-content/uploads/2022/09/Ghid_C3_I1_b_Eco-insule_FINAL.pdf',
          emitent: 'Ministerul Mediului, Apelor și Pădurilor',
          title: 'Ghid solicitant C3 I1b — Insule ecologice',
          type: 'pdf',
          verifiedAt: TODAY,
        },
      },
    ],
    deadlines: [
      {
        date: '2023-12-31',
        description: 'Termen implementare OUG 133/2022 (4 fracții + insule + CAV + door-to-door)',
        status: 'missed',
      },
      {
        date: '2024-09-30',
        description: 'Milestone 1 PNRR — minim 7.000 insule operaționale național',
        status: 'missed',
      },
      {
        date: '2026-06-30',
        description: 'Milestone 2 PNRR — minim 13.752 insule operaționale național',
        status: 'in-progress',
      },
      {
        date: '2026-08-31',
        description: 'Termen absolut PNRR — toate jaloanele îndeplinite',
        status: 'in-progress',
      },
    ],
    financialRisk: {
      description:
        'Dacă jalonul PNRR nu e îndeplinit la termen, Comisia Europeană poate suspenda plata cererii respective. România are 6 luni perioadă de grație. Dacă nici atunci nu îndeplinește, suma se pierde definitiv. Ultima cerere de plată se transmite până la 30 septembrie 2026. Consecință pentru cetățean: dacă autoritatea locală ratează termenul, costul implementării (sau al absenței ei) revine la bugetul local — taxe locale plătite de rezidenți.',
      liveStatusSources: [
        {
          url: 'https://mfe.gov.ro/pnrr/',
          emitent: 'Ministerul Investițiilor și Proiectelor Europene',
          title: 'Monitor PNRR oficial',
          type: 'webpage',
          verifiedAt: TODAY,
        },
        {
          url: 'https://pnrr.mmap.ro/wp-content/uploads/2023/02/Lista-finala_insule_ecologice_digitalizate_pentru_site.pdf',
          emitent: 'Ministerul Mediului',
          title: 'Listă beneficiari Apel I (PDF)',
          type: 'pdf',
          verifiedAt: TODAY,
        },
      ],
    },
  },
  {
    id: 'payt',
    title: 'Pay As You Throw (PAYT) — tarifare după cantitate',
    summary:
      'Instrument economic obligatoriu: taxă/tarif diferențiat după volum, frecvență, greutate sau saci personalizați. Scop: stimulent financiar pentru reducerea și separarea deșeurilor. Insulele digitalizate cu cântar sunt mecanismul tehnic uzual.',
    legalBase: [
      {
        law: 'OUG 92/2021 privind regimul deșeurilor — instrument PAYT',
        source: {
          url: 'https://legislatie.just.ro/Public/DetaliiDocument/245846',
          emitent: 'Portal legislativ',
          title: 'OUG 92/2021',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
    ],
    deadlines: [
      {
        date: '2023-12-31',
        description: 'Termen implementare PAYT la nivel local (odată cu OUG 133/2022)',
        status: 'unknown',
      },
    ],
  },
  {
    id: 'sgr-deposit-return',
    title: 'Sistem Garanție-Returnare (SGR) pentru ambalaje',
    summary:
      'Bring system operat național de RetuRO pentru ambalaje primare nereutilizabile 0,1–3L (sticlă, plastic, metal, băuturi). Garanție 0,50 RON/ambalaj. Comercianții trebuie să asigure punct de retur.',
    legalBase: [
      {
        law: 'HG 1074/2021 — Schema de garanție-returnare',
        source: {
          url: 'https://legislatie.just.ro/Public/DetaliiDocument/247070',
          emitent: 'Portal legislativ',
          title: 'HG 1074/2021',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
      {
        law: 'RetuRO SGR — administrator autorizat al schemei (cuantum garanție, lista comercianților, cum funcționează)',
        source: {
          url: 'https://returosgr.ro/',
          emitent: 'RetuRO Sistem Garanție Returnare',
          title: 'RetuRO — Sistem Garanție Returnare',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
    ],
    deadlines: [
      {
        date: '2023-11-30',
        description: 'Lansare operațională SGR la nivel național',
        status: 'met',
      },
    ],
  },
];

export const SECTORS: Record<number, SectorInfo> = {
  1: {
    id: 1,
    slug: 'sectorul-1',
    title: 'Sectorul 1',
    operator: {
      name: 'Romprest',
      legalName: 'COMPANIA ROMPREST SERVICE S.A.',
      source: {
        url: 'https://programe.romprest.eu/sectorul-1/colectare-selectiva/index-colectare-selectiva-s1.html',
        emitent: 'Romprest',
        title: 'Program de colectare separată a deșeurilor municipale din sectorul 1',
        type: 'webpage',
        verifiedAt: TODAY,
      },
    },
    status: 'per-address',
    statusSummary: 'Operatorul publică programul per stradă + plajă de numere. Scrapat automat de noi.',
    published: [
      {
        what: 'Program colectare pentru case (per stradă cu plajă de numere)',
        source: {
          url: 'https://programe.romprest.eu/sectorul-1/colectare-selectiva/program-colectare-case.html',
          emitent: 'Romprest',
          title: 'Program colectare case — Sectorul 1',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
      {
        what: 'Program colectare pentru asociații de proprietari (blocuri)',
        source: {
          url: 'https://programe.romprest.eu/sectorul-1/colectare-selectiva/program-colectare-asociatii.html',
          emitent: 'Romprest',
          title: 'Program colectare asociații — Sectorul 1',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
    ],
    notPublished: [],
    howToFindSchedule: [
      {
        method: 'website',
        label: 'Caută strada ta pe acest site',
        details: 'Folosește căutarea din pagina principală.',
        source: {
          url: 'https://programe.romprest.eu/sectorul-1/colectare-selectiva/index-colectare-selectiva-s1.html',
          emitent: 'Romprest',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
      {
        method: 'phone',
        label: 'Dispecerat Romprest',
        details: '021/9460 — pentru programare DEEE și voluminoase cu 3 zile înainte',
        source: {
          url: 'tel:+40219460',
          emitent: 'Romprest',
          type: 'phone',
          verifiedAt: TODAY,
        },
      },
      {
        method: 'email',
        label: 'Secretariat salubritate',
        details: 'secretariatsalubritate@romprest.eu',
        source: {
          url: 'mailto:secretariatsalubritate@romprest.eu',
          emitent: 'Romprest',
          type: 'email',
          verifiedAt: TODAY,
        },
      },
    ],
    municipalityContact: {
      name: 'Primăria Sector 1',
      website: {
        url: 'https://primariasector1.ro/informatii-de-interes-public/programul-de-colectare-separata-a-deseurilor/',
        emitent: 'Primăria Sector 1',
        title: 'Programul de colectare separată a deșeurilor',
        type: 'webpage',
        verifiedAt: TODAY,
      },
    },
    legislation: [
      {
        reference: 'HCL Sector 1 din 19 februarie 2026 — aprobare modalitate mixtă de gestiune a serviciilor de salubrizare: curățenia stradală trecută la o societate proprie a Primăriei, colectarea deșeurilor atribuită prin licitație publică separată',
        source: {
          url: 'https://primariasector1.ro/sectorul-1-pregateste-noul-sistem-de-curatenie-strazile-vor-fi-gestionate-direct-de-primarie-colectarea-de-la-blocuri-si-case-va-fi-atribuita-prin-licitatie/',
          emitent: 'Primăria Sector 1',
          title: 'Sectorul 1 pregătește noul sistem de curățenie — comunicat oficial',
          type: 'webpage',
          publishedAt: '2026-03-25',
          verifiedAt: TODAY,
        },
      },
      {
        reference: 'Index hotărâri Consiliul Local Sector 1 — anul 2026 (pentru textul integral al HCL adoptate)',
        source: {
          url: 'https://primariasector1.ro/consiliul-local/hotararile-consiliului-local/hotararile-consiliului-local-in-anul-2026/',
          emitent: 'Primăria Sector 1',
          title: 'Hotărârile Consiliului Local — 2026',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
    ],
    lastVerified: TODAY,
  },

  2: {
    id: 2,
    slug: 'sectorul-2',
    title: 'Sectorul 2',
    operator: {
      name: 'Supercom',
      legalName: 'SUPERCOM S.A.',
      source: {
        url: 'https://salubrizare.ps2.ro/utilizatori-casnici-persoane-fizice/',
        emitent: 'Primăria Sector 2',
        title: 'Salubrizare Sector 2 — utilizatori casnici',
        type: 'webpage',
        verifiedAt: TODAY,
      },
    },
    status: 'partial',
    statusSummary: 'Operatorul publică programul de colectare menajer per stradă și număr. Pentru reciclabil, bio, sticlă folosește containere stradale publice sau contract separat, fără program per adresă online.',
    published: [
      {
        what: 'Program colectare deșeu menajer per stradă și număr (căutare interactivă)',
        source: {
          url: 'https://www.impozitelocale2.ro/gunoi/',
          emitent: 'Direcția Generală Impozite și Taxe Locale Sector 2',
          title: 'Program colectare deșeu menajer și selectiv',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
      {
        what: 'Centre de aport voluntar (CAV) pentru preluare gratuită deșeuri',
        source: {
          url: 'https://www.ps2.ro/index.php/component/content/article/78-informatii-de-interes-public-prima-pagina/1071-colectarea-deseurilor-in-centrele-de-aport-voluntar',
          emitent: 'Primăria Sector 2',
          title: 'Colectarea deșeurilor în centrele de aport voluntar',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
    ],
    notPublished: [
      'Program colectare reciclabil uscat per stradă și număr (colectarea se face prin containere stradale sau contract separat)',
      'Program colectare bio per stradă',
      'Program colectare sticlă per stradă (există containere verzi pe stradă)',
    ],
    howToFindSchedule: [
      {
        method: 'website',
        label: 'Caută programul menajer pentru strada ta',
        details: 'Completează strada în formularul de pe impozitelocale2.ro/gunoi',
        source: {
          url: 'https://www.impozitelocale2.ro/gunoi/',
          emitent: 'DGITL Sector 2',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
      {
        method: 'phone',
        label: 'Dispecerat Supercom',
        details: '021-9654 — pentru programare deșeuri voluminoase (cu 24h înainte)',
        source: {
          url: 'tel:+402109654',
          emitent: 'Supercom',
          type: 'phone',
          verifiedAt: TODAY,
        },
      },
      {
        method: 'email',
        label: 'Contact Supercom',
        details: 'contact@supercom.ro',
        source: {
          url: 'mailto:contact@supercom.ro',
          emitent: 'Supercom',
          type: 'email',
          verifiedAt: TODAY,
        },
      },
      {
        method: 'cav',
        label: 'Centre de Aport Voluntar (depunere gratuită)',
        details: 'Centrul Obor (Str. Heliade Rădulescu nr. 33) și Centrul Baicului (Str. Pl. Ion Niță nr. 32). Program: Luni–Sâmbătă 08:00–16:00',
        source: {
          url: 'https://www.ps2.ro/index.php/component/content/article/78-informatii-de-interes-public-prima-pagina/1071-colectarea-deseurilor-in-centrele-de-aport-voluntar',
          emitent: 'Primăria Sector 2',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
    ],
    municipalityContact: {
      name: 'Primăria Sector 2',
      website: {
        url: 'https://www.ps2.ro/',
        emitent: 'Primăria Sector 2',
        type: 'webpage',
        verifiedAt: TODAY,
      },
    },
    legislation: [
      {
        reference: 'HCL Sector 2 nr. 435 din 16 decembrie 2025 — modifică HCL 74/2021; taxă specială salubrizare pentru utilizatori casnici fără contract: 76 lei/persoană/lună de la 1 ianuarie 2026; pentru non-casnici fără contract: 1.427 lei/m³/lună',
        source: {
          url: 'https://cl.ps2.ro/index.php/consiliul-local/hotarari/2025-hcl/hotararea-nr-435-din-2025',
          emitent: 'Consiliul Local Sector 2',
          title: 'HCL nr. 435 din 2025',
          type: 'hcl',
          publishedAt: '2025-12-16',
          verifiedAt: TODAY,
        },
      },
    ],
    lastVerified: TODAY,
  },

  3: {
    id: 3,
    slug: 'sectorul-3',
    title: 'Sectorul 3',
    operator: {
      name: 'Direcția Generală de Salubritate Sector 3',
      legalName: 'Direcția Generală de Salubritate Sector 3 (companie municipală)',
      source: {
        url: 'https://salubritate3.ro/',
        emitent: 'DGSS3',
        title: 'Direcția Generală de Salubritate Sector 3',
        type: 'webpage',
        verifiedAt: TODAY,
      },
    },
    status: 'no-public-data',
    statusSummary: 'Operatorul nu publică online un program de colectare per adresă. Modelul folosit este cu containere stradale publice (peste 3.000 în tot sectorul).',
    published: [
      {
        what: 'Informații generale despre servicii de colectare',
        source: {
          url: 'https://salubritate3.ro/colectare-deseuri/',
          emitent: 'DGSS3',
          title: 'Colectare deșeuri — Sectorul 3',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
      {
        what: 'Rețea de 1.144 containere reciclabile stradale + 719 containere sticlă + 1.224 containere subterane',
        source: {
          url: 'https://salubritate3.ro/colectare-deseuri/',
          emitent: 'DGSS3',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
      {
        what: 'Colectare DEEE și voluminoase (ultima sâmbătă a lunii, programare 72h înainte)',
        source: {
          url: 'https://www.colectaredeseuri.ro/colectare/colectare-deee-bucuresti-sc-rosal-grup-sa/',
          emitent: 'Rosal Grup SA',
          title: 'Colectare DEEE Sector 3',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
    ],
    notPublished: [
      'Program colectare per stradă și număr (căutarea promisă pe site e marcată „în construcție")',
      'Zile de colectare menajer per zonă',
      'Zile de colectare reciclabil per zonă',
      'Zile de colectare bio per zonă',
    ],
    howToFindSchedule: [
      {
        method: 'phone',
        label: 'Dispecerat DGSS3',
        details: '021.318.03.23 — întreabă programul pentru strada ta',
        source: {
          url: 'tel:+40213180323',
          emitent: 'DGSS3',
          type: 'phone',
          verifiedAt: TODAY,
        },
      },
      {
        method: 'containers',
        label: 'Folosește containerele stradale',
        details: 'Pentru reciclabil (galbene) și sticlă (verzi), caută cel mai apropiat container. Pentru sticlă și reciclabil, depunerea e permanentă (24/7).',
        source: {
          url: 'https://salubritate3.ro/colectare-deseuri/',
          emitent: 'DGSS3',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
    ],
    municipalityContact: {
      name: 'Primăria Sector 3',
      website: {
        url: 'https://www.primarie3.ro/index.php/programe/detaliu/serviciul-de-salubritate/27',
        emitent: 'Primăria Sector 3',
        title: 'Serviciul de salubritate — Primăria Sector 3',
        type: 'webpage',
        verifiedAt: TODAY,
      },
      phone: {
        number: '021.318.03.23',
        source: {
          url: 'https://salubritate3.ro/',
          emitent: 'DGSS3',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
    },
    lastVerified: TODAY,
  },

  4: {
    id: 4,
    slug: 'sectorul-4',
    title: 'Sectorul 4',
    operator: {
      name: 'CLEAN ALL 4 CITY SA',
      legalName: 'CLEAN ALL 4 CITY SA (companie municipală, post-UWS/Rosal)',
      source: {
        url: 'https://ps4.ro/',
        emitent: 'Primăria Sector 4',
        title: 'Primăria Sector 4',
        type: 'webpage',
        verifiedAt: TODAY,
      },
    },
    status: 'transition',
    statusSummary: 'Sectorul e în tranziție: din decembrie 2025 operatorul oficial aprobat este compania municipală CLEAN ALL 4 CITY SA, preluând de la UWS (fost Rosal Sector 4). Site-ul nou pentru program per adresă nu e încă publicat.',
    published: [
      {
        what: 'Informații operator precedent (UWS — moștenire Rosal Sector 4)',
        source: {
          url: 'https://www.rosal.ro/colectare-selectiva-sector-4/',
          emitent: 'Rosal Grup SA',
          title: 'Colectare selectivă Sector 4',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
      {
        what: 'Program deșeuri voluminoase — gratuit ultima sâmbătă a lunii, programare cu 48h înainte',
        source: {
          url: 'https://sectorul4live.ro/cum-puteti-scapa-gratuit-de-mobilierul-si-obiectele-de-uz-casnic-uzate/',
          emitent: 'Sectorul 4 Live',
          title: 'Cum puteți scăpa gratuit de mobilierul și obiectele de uz casnic uzate',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
    ],
    notPublished: [
      'Program colectare menajer per adresă de la CLEAN ALL 4 CITY SA',
      'Program colectare reciclabil per adresă',
      'Site web nou al CLEAN ALL 4 CITY SA (neapărut până la 12 aprilie 2026)',
    ],
    howToFindSchedule: [
      {
        method: 'website',
        label: 'Contact Primăria Sector 4',
        details: 'Verifică anunțurile primăriei pentru actualizări despre operatorul nou',
        source: {
          url: 'https://ps4.ro/',
          emitent: 'Primăria Sector 4',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
    ],
    municipalityContact: {
      name: 'Primăria Sector 4',
      website: {
        url: 'https://ps4.ro/',
        emitent: 'Primăria Sector 4',
        type: 'webpage',
        verifiedAt: TODAY,
      },
    },
    legislation: [
      {
        reference: 'Hotărâre Consiliul Local Sector 4 — decembrie 2025 — înființare CLEAN ALL 4 CITY SA',
        source: {
          url: 'https://ps4.ro/comunicate-de-presa/sectorul-4-al-municipiului-bucuresti-cauta-operator-specializat-pentru-sortarea-deseurilor-reciclabile/',
          emitent: 'Primăria Sector 4',
          title: 'Sectorul 4 caută operator specializat pentru sortarea deșeurilor reciclabile',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
    ],
    lastVerified: TODAY,
  },

  5: {
    id: 5,
    slug: 'sectorul-5',
    title: 'Sectorul 5',
    operator: {
      name: 'Salubrizare Sector 5 SA',
      legalName: 'SC SALUBRIZARE SECTOR 5 SA (companie municipală, operator unic licențiat)',
      source: {
        url: 'https://salubrizare5.ro/',
        emitent: 'Salubrizare Sector 5 SA',
        title: 'SC Salubrizare Sector 5 SA',
        type: 'webpage',
        verifiedAt: TODAY,
      },
    },
    status: 'frequency-only',
    statusSummary: 'Operatorul publică frecvența generală (menajer săptămânal, reciclabil la două săptămâni) dar nu ziua concretă pe care are loc colectarea la adresa ta. Pentru ziua exactă, contactează dispeceratul.',
    published: [
      {
        what: 'Colectare menajer (fracția umedă, pubelă neagră): 1 dată pe săptămână',
        source: {
          url: 'https://salubrizare5.ro/programe-de-colectare/',
          emitent: 'Salubrizare Sector 5 SA',
          title: 'Programe de colectare',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
      {
        what: 'Colectare reciclabil (fracția uscată, pubelă galbenă): 1 dată la 2 săptămâni',
        source: {
          url: 'https://salubrizare5.ro/programe-de-colectare/',
          emitent: 'Salubrizare Sector 5 SA',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
      {
        what: 'Colectare deșeuri voluminoase: gratuit ultima sâmbătă a lunii, programare până vineri',
        source: {
          url: 'https://salubrizare5.ro/colectam-deseuri-voluminoase-in-mod-gratuit-salubrizare-sector-5-s-a/',
          emitent: 'Salubrizare Sector 5 SA',
          title: 'Colectăm deșeuri voluminoase în mod gratuit',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
    ],
    notPublished: [
      'Ziua concretă de colectare menajer per stradă sau zonă',
      'Ziua concretă de colectare reciclabil per stradă',
      'Program colectare bio per stradă',
    ],
    howToFindSchedule: [
      {
        method: 'phone',
        label: 'Dispecerat Salubrizare Sector 5',
        details: '031.9450 — întreabă ziua exactă pentru adresa ta',
        source: {
          url: 'tel:+40319450',
          emitent: 'Salubrizare Sector 5 SA',
          type: 'phone',
          verifiedAt: TODAY,
        },
      },
      {
        method: 'email',
        label: 'Dispecerat email',
        details: 'dispecerat@salubrizare5.ro',
        source: {
          url: 'mailto:dispecerat@salubrizare5.ro',
          emitent: 'Salubrizare Sector 5 SA',
          type: 'email',
          verifiedAt: TODAY,
        },
      },
    ],
    municipalityContact: {
      name: 'Primăria Sector 5',
      website: {
        url: 'https://sector5.ro/%E2%9D%97salubrizare-sector-5-s-a-singurul-operator-de-salubrizare-licentiat-pe-raza-sectorului/',
        emitent: 'Primăria Sector 5',
        title: 'Salubrizare Sector 5 SA — singurul operator licențiat',
        type: 'webpage',
        verifiedAt: TODAY,
      },
    },
    legislation: [
      {
        reference: 'HCL Sector 5 nr. 67/23.03.2020 — aprobare gestiune directă a serviciului de salubrizare. Contract delegare nr. 1307/01.04.2020, durată 5 ani.',
        source: {
          url: 'https://sector5.ro/%E2%9D%97salubrizare-sector-5-s-a-singurul-operator-de-salubrizare-licentiat-pe-raza-sectorului/',
          emitent: 'Primăria Sector 5',
          type: 'hcl',
          publishedAt: '2020-03-23',
          verifiedAt: TODAY,
        },
      },
    ],
    lastVerified: TODAY,
  },

  6: {
    id: 6,
    slug: 'sectorul-6',
    title: 'Sectorul 6',
    operator: {
      name: 'URBAN SA',
      legalName: 'URBAN SA (operator unic licențiat din 2 februarie 2026)',
      source: {
        url: 'https://www.urbansa.ro/',
        emitent: 'URBAN SA',
        title: 'URBAN SA — operator salubritate Sector 6',
        type: 'webpage',
        verifiedAt: TODAY,
      },
    },
    status: 'via-partner',
    statusSummary: 'Operatorul URBAN SA (monopol din 2 februarie 2026) direcționează utilizatorii către aplicația InfoDeșeuri pentru programul per adresă. Aplicația este dezvoltată de SAPIENS ADN cu sprijinul Ministerului Mediului.',
    published: [
      {
        what: 'Infrastructura de colectare pe 4 fracții (plastic/metal, hârtie/carton, biodegradabil, rezidual)',
        source: {
          url: 'https://www.urbansa.ro/',
          emitent: 'URBAN SA',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
      {
        what: 'Program deșeuri voluminoase',
        source: {
          url: 'https://www.urbansa.ro/servicii/deseurile-voluminoase/',
          emitent: 'URBAN SA',
          title: 'Deșeurile voluminoase',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
      {
        what: 'Informații primărie despre salubritate',
        source: {
          url: 'https://primarie6.ro/primarie_sector6/salubritate2',
          emitent: 'Primăria Sector 6',
          title: 'Salubritate — Primăria Sectorului 6',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
    ],
    notPublished: [
      'Program colectare per stradă și număr pe site-ul URBAN SA',
      'Program colectare per stradă pe site-ul Primăriei Sector 6',
    ],
    howToFindSchedule: [
      {
        method: 'app',
        label: 'Aplicația InfoDeșeuri',
        details: 'URBAN SA direcționează utilizatorii către aplicația InfoDeșeuri (SAPIENS ADN, Ministerul Mediului) pentru program per adresă',
        source: {
          url: 'https://infodeseuri.ro/',
          emitent: 'SAPIENS ADN',
          title: 'InfoDeșeuri — aplicație susținută de Ministerul Mediului',
          type: 'app',
          verifiedAt: TODAY,
        },
      },
      {
        method: 'phone',
        label: 'Dispecerat URBAN SA',
        details: '+40 21 413 91 15',
        source: {
          url: 'tel:+40214139115',
          emitent: 'URBAN SA',
          type: 'phone',
          verifiedAt: TODAY,
        },
      },
      {
        method: 'email',
        label: 'Contact URBAN SA',
        details: 'office@urbansa.ro',
        source: {
          url: 'mailto:office@urbansa.ro',
          emitent: 'URBAN SA',
          type: 'email',
          verifiedAt: TODAY,
        },
      },
    ],
    municipalityContact: {
      name: 'Primăria Sector 6',
      website: {
        url: 'https://www.primarie6.ro/primarie_sector6/salubrizare',
        emitent: 'Primăria Sector 6',
        title: 'Salubrizare — Primăria Sectorului 6',
        type: 'webpage',
        verifiedAt: TODAY,
      },
    },
    historicalDocuments: [
      {
        title: 'Program colectare URBAN SA — Sectorul 6 — deșeuri reciclabile (sticlă + voluminoase/DEEE) · listă completă străzi',
        publishedAt: '2022-06-01',
        source: {
          url: 'https://ecoteca.ro/wp-content/uploads/2022/06/Program-colectare-Urban-SA-Sectorul-6-deseuri-reciclabile_LISTA-COMPLETA-STRAZI.docx',
          emitent: 'URBAN SA (găzduit pe ecoteca.ro)',
          title: 'Program colectare sticlă + voluminoase + DEEE pentru Sector 6 — 2022',
          type: 'docx',
          publishedAt: '2022-06-01',
          verifiedAt: TODAY,
        },
        disclaimer: 'Document din iunie 2022 (pre-monopol URBAN SA), acoperă doar sticlă + voluminoase/DEEE. Situația actuală poate să difere. Verifică sursa actuală prin InfoDeșeuri sau dispecerat.',
      },
    ],
    legislation: [
      {
        reference: 'URBAN SA — operator unic licențiat din 2 februarie 2026; contractele noi devin obligatorii pentru toți rezidenții',
        source: {
          url: 'https://www.urbansa.ro/',
          emitent: 'URBAN SA',
          type: 'webpage',
          verifiedAt: TODAY,
        },
      },
    ],
    obligationEvidence: {
      'digital-eco-islands': [
        {
          what: 'Contract de finanțare PNRR C3I1B0122000046 încheiat la 14 martie 2023 între Ministerul Mediului, Apelor și Pădurilor și Sectorul 6 al Municipiului București pentru construirea a 265 de insule ecologice digitalizate (proiect de hotărâre Primăria Sector 6 referitor la modificarea Anexei 3 din HCL 199/2022 — lista locațiilor). Pentru status operațional efectiv (câte sunt instalate/funcționează la zi), verifică surse vii: anunțuri Primărie Sector 6 + Monitor PNRR.',
          source: {
            url: 'https://primarie6.ro/primarie_sector6/sites/default/files/2025-07/1.%20PROIECT%20DE%20HOTARARE%20privind%20modif%20Anexa%203%20HCL%20199_2022%20lista%20locatii%20insule%20ecologice%20PNRR_oa.pdf',
            emitent: 'Primăria Sector 6',
            title: 'Proiect de hotărâre — modificare Anexa 3 HCL 199/2022 (lista locații insule ecologice PNRR)',
            type: 'pdf',
            verifiedAt: TODAY,
          },
        },
        {
          what: 'Lista finală beneficiari Apel I PNRR — Investiția I1b „Construirea de insule ecologice digitalizate" (cuprinde inclusiv beneficiari din Sectorul 6 al Municipiului București).',
          source: {
            url: 'https://pnrr.mmap.ro/wp-content/uploads/2023/02/Lista-finala_insule_ecologice_digitalizate_pentru_site.pdf',
            emitent: 'Ministerul Mediului, Apelor și Pădurilor',
            title: 'Listă finală beneficiari I1b — Apel I',
            type: 'pdf',
            verifiedAt: TODAY,
          },
        },
      ],
    },
    lastVerified: TODAY,
  },
};

export function getSector(id: number): SectorInfo | undefined {
  return SECTORS[id];
}

export const ALL_SECTORS = Object.values(SECTORS).sort((a, b) => a.id - b.id);

/** Status chip label + Tailwind color class for each status type */
export const STATUS_META: Record<SectorStatus, { label: string; chipClass: string }> = {
  'per-address': {
    label: 'program per adresă',
    chipClass: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/40',
  },
  partial: {
    label: 'parțial per adresă',
    chipClass: 'bg-emerald-500/12 text-emerald-700 border-emerald-500/35',
  },
  'frequency-only': {
    label: 'doar frecvența generală',
    chipClass: 'bg-amber-500/15 text-amber-700 border-amber-500/40',
  },
  transition: {
    label: 'operator în tranziție',
    chipClass: 'bg-orange-500/15 text-orange-700 border-orange-500/40',
  },
  'via-partner': {
    label: 'via aplicație parteneră',
    chipClass: 'bg-amber-500/15 text-amber-700 border-amber-500/40',
  },
  'no-public-data': {
    label: 'fără date publice per adresă',
    chipClass: 'bg-rose-500/12 text-rose-700 border-rose-500/35',
  },
};

/** Data of this page's factual statements, for legal disclaimer */
export const FACTUAL_AS_OF = '2026-04-13';
