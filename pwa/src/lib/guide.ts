import type { WasteType } from './types.js';

export type GuideEntry = {
  id: string;
  title: string;
  shortTag: string;
  binColor?: string;
  wasteType?: WasteType;
  /** Ce se pune — cu exemple concrete */
  accepts: string[];
  /** Ce NU se pune — greșeli frecvente */
  rejects: string[];
  /** Sfaturi de pregătire: clătire, presare, etc */
  prep?: string[];
  /** Dacă merge la puncte de predare separate, nu la pubelă */
  disposal?: {
    headline: string;
    points: DisposalPoint[];
  };
};

export type DisposalPoint = {
  name: string;
  kind: 'retail' | 'farmacie' | 'bricolaj' | 'primarie' | 'statie' | 'ong';
  description: string;
  url?: string;
};

export const GUIDE: GuideEntry[] = [
  {
    id: 'reciclabil',
    title: 'Reciclabil uscat',
    shortTag: 'plastic · hârtie · metal',
    binColor: 'galben',
    wasteType: 'reciclabil_uscat',
    accepts: [
      'Sticle PET (apă, băuturi răcoritoare, lapte) — goale',
      'Flacoane de plastic (șampon, detergent, ulei de mașină) — clătite',
      'Pungi de plastic curate, folii alimentare',
      'Cutii de aluminiu (băuturi, conserve) — goale',
      'Cutii de metal (conserve alimentare) — clătite',
      'Hârtie, ziare, reviste, caiete',
      'Cutii de carton — aplatizate',
      'Cutii Tetra Pak (lapte, sucuri)',
    ],
    rejects: [
      'Hârtie murdară cu grăsime (șervețele folosite, cutii de pizza unse)',
      'Ambalaje cu resturi de mâncare',
      'Pungi de chipsuri / metalizate (sunt multistrat)',
      'Ustensile de plastic fragmentate',
      'Scutece, vată demachiantă',
      'Sticle de geam (merg separat)',
      'Ceramica, porțelanul',
    ],
    prep: [
      'Clătește recipientele de resturi de mâncare sau băutură',
      'Aplatizează cutiile de carton și PET-urile ca să ocupe mai puțin spațiu',
      'Nu pune materialele în pungi închise — le lași libere',
    ],
  },
  {
    id: 'menajer',
    title: 'Gunoi menajer',
    shortTag: 'ce nu se poate recicla',
    binColor: 'negru',
    wasteType: 'menajer',
    accepts: [
      'Șervețele folosite, batiste, hârtie murdară',
      'Scutece, tampoane, produse sanitare',
      'Fibră de vată, bumbac demachiant',
      'Cioburi mici de ceramică / porțelan',
      'Resturi alimentare dacă nu ai pubelă bio separată',
    ],
    rejects: [
      'Baterii (merg la puncte de predare)',
      'Medicamente expirate (merg la farmacii)',
      'Aparate electrice (DEEE — merg separat)',
      'Sticlă (merge la containere verzi / voluminoase)',
      'Uleiuri alimentare sau de motor',
    ],
    prep: [
      'Pune sacul bine legat, fără scurgeri',
      'Nu arunca lichide — curg și strică reciclabilele din alte pubele',
    ],
  },
  {
    id: 'bio',
    title: 'Bio / organic',
    shortTag: 'resturi vegetale, grădină',
    binColor: 'maro sau verde',
    wasteType: 'bio',
    accepts: [
      'Coji și resturi de legume și fructe',
      'Ouă și coji de ouă',
      'Zațuri de cafea, pliculețe de ceai',
      'Pâine și paste uscate',
      'Flori, frunze, iarbă tunsă',
      'Crengi mici (tocate)',
    ],
    rejects: [
      'Carne, pește, oase (miros, atrag animale)',
      'Produse lactate (brânzeturi, iaurt)',
      'Uleiuri și grăsimi',
      'Pungi de plastic — chiar și cele bio-degradabile',
      'Scrum de țigară',
    ],
    prep: [
      'Nu pune bio-ul în pungi de plastic — lasă-l liber sau folosește pungi din hârtie',
      'Stoarce umiditatea excesivă',
    ],
  },
  {
    id: 'sticla',
    title: 'Sticlă',
    shortTag: 'borcane · butelii',
    binColor: 'verde',
    wasteType: 'sticla',
    accepts: [
      'Borcane de conserve, dulcețuri',
      'Sticle de băuturi (vin, bere, sucuri)',
      'Sticluțe de cosmetice și parfumuri (fără pompă)',
    ],
    rejects: [
      'Sticlă spartă de geam, oglinzi (vitrinele comerciale merg separat)',
      'Becuri, neoane, tuburi fluorescente (DEEE)',
      'Ceramica, porțelanul, ghivece',
      'Pahare din cristal (compoziție diferită)',
    ],
    prep: [
      'Scoate capacele de metal (merg la reciclabil) și cele de plastic',
      'Clătește de resturi',
      'Nu e nevoie să scoți etichetele',
    ],
  },
  {
    id: 'baterii',
    title: 'Baterii și acumulatori',
    shortTag: 'niciodată la gunoi',
    wasteType: 'deee',
    accepts: [
      'Baterii uzate AA, AAA, 9V, buton (ceas, auz)',
      'Acumulatori de telefon, laptop, aparate foto',
      'Baterii auto (la centre specializate auto)',
    ],
    rejects: [
      'Baterii la pubela menajeră — poluează grav solul și apa',
    ],
    disposal: {
      headline: 'Puncte fixe de predare',
      points: [
        { name: 'Carrefour', kind: 'retail', description: 'Container de baterii la intrare în toate magazinele' },
        { name: 'Kaufland', kind: 'retail', description: 'Container Battery Box la intrare' },
        { name: 'Auchan', kind: 'retail', description: 'Punct de colectare baterii și mici DEEE' },
        { name: 'Mega Image', kind: 'retail', description: 'Container de baterii în multe magazine mari' },
        { name: 'Dedeman / Leroy Merlin / Brico Depot', kind: 'bricolaj', description: 'Punct baterii + DEEE + becuri' },
        { name: 'Stația ta de service auto', kind: 'statie', description: 'Pentru baterii auto uzate' },
      ],
    },
  },
  {
    id: 'ulei',
    title: 'Ulei alimentar uzat',
    shortTag: 'nu în chiuvetă',
    accepts: [
      'Ulei de gătit folosit (prăjire, marinate)',
      'Grăsimi animale solidificate',
    ],
    rejects: [
      'NU turna în chiuvetă — înfundă canalizarea și poluează apa',
      'NU arunca la pubela menajeră — contaminează reciclabile',
    ],
    prep: [
      'Strecoară în sticle PET goale — închide bine capacul',
      'Etichetează „ulei uzat"',
    ],
    disposal: {
      headline: 'Puncte de colectare ulei alimentar',
      points: [
        { name: 'Rețeaua MOL Romania', kind: 'statie', description: 'Containere dedicate în unele benzinării — verifică lista locațiilor', url: 'https://molromania.ro/' },
        { name: 'Rețeaua Rompetrol', kind: 'statie', description: 'Predare ulei uzat la anumite locații', url: 'https://www.rompetrol.ro/' },
        { name: 'Evenimente de colectare primărie', kind: 'primarie', description: 'Urmărește anunțurile primăriei tale de sector' },
      ],
    },
  },
  {
    id: 'medicamente',
    title: 'Medicamente expirate',
    shortTag: 'la farmacie',
    accepts: [
      'Pastile, capsule, siropuri expirate sau neutilizate',
      'Creme, unguente, soluții medicamentoase',
    ],
    rejects: [
      'NU la gunoi, NU în toaletă — ajung în apă și afectează flora/fauna',
      'Seringile și acele NU se dau la farmacie, merg la cabinet medical',
    ],
    prep: [
      'Scoate blisterul din cutie (cartonul merge separat la reciclabil)',
      'Păstrează doar medicamentul în ambalajul original',
    ],
    disposal: {
      headline: 'Farmacii cu program de colectare',
      points: [
        { name: 'Farmacii Catena', kind: 'farmacie', description: 'Containere Valoris pentru medicamente expirate în farmacii partenere', url: 'https://www.catena.ro/' },
        { name: 'Sistem Valoris (operator autorizat)', kind: 'farmacie', description: 'Lista farmaciilor partenere și informații despre programul de colectare', url: 'https://valoris.ro/' },
        { name: 'Alte farmacii independente', kind: 'farmacie', description: 'Întreabă direct la ghișeu — multe acceptă medicamente expirate' },
      ],
    },
  },
  {
    id: 'deee',
    title: 'Electrice și electronice (DEEE)',
    shortTag: 'aparate vechi, cabluri, becuri',
    wasteType: 'deee',
    accepts: [
      'Aparate mari (frigider, mașină de spălat, aragaz, cuptor)',
      'Aparate mici (prăjitor, blender, radio, aspirator)',
      'Telefoane, laptopuri, tablete, monitoare',
      'Cabluri, încărcătoare, prize',
      'Becuri cu LED, neoane, tuburi fluorescente',
    ],
    rejects: [
      'NU la pubela menajeră — conțin metale grele',
      'NU dezmembra acasă — poate elibera substanțe toxice',
    ],
    disposal: {
      headline: 'Cum scapi de ele gratuit',
      points: [
        { name: 'Primăria sectorului', kind: 'primarie', description: 'A doua duminică a lunii (S1, Romprest) sau ultima sâmbătă (S3-S5) — cu programare prealabilă' },
        { name: 'La cumpărarea unui aparat nou', kind: 'retail', description: 'Magazinele sunt obligate să îți preia aparatul vechi de același tip, gratuit' },
        { name: 'Ecotic (DEEE)', kind: 'ong', description: 'Organizație autorizată cu puncte fixe în Carrefour, Auchan, Kaufland', url: 'https://www.ecotic.ro/' },
        { name: 'Recolamp (becuri, neoane, surse de iluminat)', kind: 'ong', description: 'Sistem național de colectare iluminat uzat', url: 'https://www.recolamp.ro/' },
        { name: 'Harta Reciclării', kind: 'ong', description: 'Caută punctul de colectare cel mai apropiat de tine', url: 'https://hartareciclarii.ro/' },
      ],
    },
  },
  {
    id: 'voluminoase',
    title: 'Voluminoase',
    shortTag: 'mobilier · saltele · obiecte mari',
    wasteType: 'voluminoase',
    accepts: [
      'Canapele, fotolii, mese, scaune, dulapuri',
      'Saltele, covoare',
      'Biciclete vechi, cărucioare',
      'Cutii mari de carton (descompuse)',
    ],
    rejects: [
      'Deșeuri din construcții (moloz, gresie, faianță) — alt program',
      'Aparate electrice (merg la DEEE)',
    ],
    disposal: {
      headline: 'Cum le predai gratuit',
      points: [
        { name: 'Sector 1 (Romprest)', kind: 'primarie', description: 'A doua duminică din lună, programare cu 3 zile înainte la 021/9460' },
        { name: 'Sector 2 (Supercom)', kind: 'primarie', description: 'La cerere, cu 24h înainte la 021-9654' },
        { name: 'Sector 3 (Rosal)', kind: 'primarie', description: 'Ultima sâmbătă, programare 72h înainte' },
        { name: 'Sector 4', kind: 'primarie', description: 'Ultima sâmbătă, programare 48h înainte' },
        { name: 'Sector 5', kind: 'primarie', description: 'Ultima sâmbătă, programare până vineri' },
      ],
    },
  },
  {
    id: 'textile',
    title: 'Textile uzate',
    shortTag: 'haine vechi, pantofi',
    wasteType: 'textile',
    accepts: [
      'Haine uzate, pantaloni, rochii',
      'Pantofi, genți, curele',
      'Prosoape, lenjerii, perdele',
    ],
    rejects: [
      'Textile umede sau contaminate (cu grăsime, solvenți)',
      'Salteluțe (merg la voluminoase)',
    ],
    prep: [
      'Spală înainte dacă e posibil',
      'Leagă pantofii pereche',
      'Pune într-un sac / cutie',
    ],
    disposal: {
      headline: 'Unde predai textile uzate',
      points: [
        { name: 'H&M', kind: 'retail', description: 'Recipient de colectare la casă — primești voucher de reducere' },
        { name: 'Zara', kind: 'retail', description: 'Containere textile la unele magazine' },
        { name: 'Containere stradale dedicate', kind: 'ong', description: 'Identifică ONG-ul prin stickerul de pe container' },
        { name: 'Diakonia, Caritas, organizații caritabile', kind: 'ong', description: 'Dacă sunt în stare bună, merg mai departe' },
      ],
    },
  },
  {
    id: 'constructii',
    title: 'Moloz și construcții',
    shortTag: 'amenajări interioare',
    accepts: [
      'Moloz, gresie, faianță spartă',
      'Resturi de tencuială, beton',
      'Lemn vopsit, ferestre, uși',
    ],
    rejects: [
      'Azbest și materiale periculoase (program separat specializat)',
    ],
    disposal: {
      headline: 'Serviciu separat, NU colectare normală',
      points: [
        { name: 'Sectoarele 1, 2, 3', kind: 'primarie', description: 'Program gratuit limitat (ex. S3: max 30 saci/an/adresă)' },
        { name: 'Urban SA, Rosal, Supercom', kind: 'primarie', description: 'Contract separat plătit pentru volume mari' },
      ],
    },
  },
];

export function findGuide(id: string): GuideEntry | undefined {
  return GUIDE.find((g) => g.id === id);
}
