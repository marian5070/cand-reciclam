import type { WasteType } from './types.js';

export type CoverageNote = {
  sector: number;
  operator: string;
  /** Tipuri publicate per adresă în datele noastre */
  covered: WasteType[];
  /** Mesaj uman-readable despre ce nu e acoperit și unde se colectează */
  notCoveredExplanation: string[];
  /** URL-uri relevante pentru info suplimentar */
  resources: { label: string; url: string }[];
};

export const COVERAGE: Record<number, CoverageNote> = {
  1: {
    sector: 1,
    operator: 'Romprest',
    covered: ['menajer', 'reciclabil_uscat'],
    notCoveredExplanation: [
      'Romprest publică programul separat pentru:',
      '• Fracția umedă (menajer, pubelă neagră — resturi nereciclabile)',
      '• Fracția uscată (reciclabil — plastic, hârtie, metal, carton)',
      'Datele sunt per stradă + plajă de numere, diferențiate pentru case și blocuri / asociații.',
      'Pentru bio (vegetal, grădină): se ridică separat sâmbăta și duminica, 08:00-13:00.',
      'Pentru DEEE și voluminoase: a doua duminică a lunii, programare la 021/9460 cu 3 zile înainte.',
    ],
    resources: [
      { label: 'Program case · programe.romprest.eu', url: 'https://programe.romprest.eu/sectorul-1/colectare-selectiva/program-colectare-case.html' },
      { label: 'Program asociații · programe.romprest.eu', url: 'https://programe.romprest.eu/sectorul-1/colectare-selectiva/program-colectare-asociatii.html' },
      { label: 'Primăria Sector 1', url: 'https://primariasector1.ro/informatii-de-interes-public/programul-de-colectare-separata-a-deseurilor/' },
    ],
  },
  2: {
    sector: 2,
    operator: 'Supercom',
    covered: ['menajer'],
    notCoveredExplanation: [
      'Supercom publică online doar programul pentru gunoiul menajer (pubela neagră / fracția umedă) — per stradă și număr.',
      'Reciclabilul (plastic, hârtie, metal) și bio-ul NU sunt publicate per adresă. Ele se colectează prin:',
      '• Containere stradale publice (galbene pentru reciclabil, verzi pentru sticlă)',
      '• Contract separat cu Supercom (containere la scară, pentru asociații de proprietari)',
      'Pentru deșeuri voluminoase: programare la tel. 021-9654 cu cel puțin 24h înainte.',
    ],
    resources: [
      { label: 'Program menajer per stradă · impozitelocale2.ro', url: 'https://www.impozitelocale2.ro/gunoi/' },
      { label: 'Informații generale · salubrizare.ps2.ro', url: 'https://salubrizare.ps2.ro/utilizatori-casnici-persoane-fizice/' },
      { label: 'Centre de preluare gratuită (CAV)', url: 'https://www.ps2.ro/index.php/component/content/article/78-informatii-de-interes-public-prima-pagina/1071-colectarea-deseurilor-in-centrele-de-aport-voluntar' },
    ],
  },
  3: {
    sector: 3,
    operator: 'Direcția Generală Salubritate S3',
    covered: [],
    notCoveredExplanation: [
      'Sectorul 3 folosește preponderent containere stradale publice — 1.144 recipiente pentru reciclabil + 719 pentru sticlă + 1.224 subterane.',
      'Nu există program per adresă publicat oficial.',
      'Căutare per stradă pe salubritate3.ro e marcată „în construcție".',
      'Pentru deșeuri voluminoase: programare Rosal cu 72h înainte, ultima sâmbătă din lună.',
    ],
    resources: [
      { label: 'salubritate3.ro', url: 'https://salubritate3.ro/colectare-deseuri/' },
      { label: 'Tel: 021.318.03.23', url: 'tel:+40213180323' },
    ],
  },
  4: {
    sector: 4,
    operator: 'CLEAN ALL 4 CITY SA (tranziție de la UWS)',
    covered: [],
    notCoveredExplanation: [
      'Sectorul 4 e în tranziție: din decembrie 2025 operatorul e compania municipală nouă CLEAN ALL 4 CITY SA (preia de la UWS / fost Rosal).',
      'Site operator nou nu publică încă program granular.',
      'Pentru deșeuri voluminoase: gratuit ultima sâmbătă din lună, programare cu 48h înainte.',
    ],
    resources: [
      { label: 'Primăria Sector 4', url: 'https://ps4.ro/' },
      { label: 'Rosal Sector 4 (legacy)', url: 'https://www.rosal.ro/colectare-selectiva-sector-4/' },
    ],
  },
  5: {
    sector: 5,
    operator: 'Salubrizare Sector 5 SA',
    covered: [],
    notCoveredExplanation: [
      'Program uniform pe sector — nu granular per adresă:',
      '• Menajer (fracția umedă, pubelă neagră): 1x / săptămână',
      '• Reciclabil (fracția uscată, pubelă galbenă): 1x / 2 săptămâni',
      'Pentru deșeuri voluminoase: gratuit ultima sâmbătă, programare până vineri.',
      'Tel: 031.9450 · dispecerat@salubrizare5.ro',
    ],
    resources: [
      { label: 'salubrizare5.ro', url: 'https://salubrizare5.ro/programe-de-colectare/' },
    ],
  },
  6: {
    sector: 6,
    operator: 'URBAN SA',
    covered: [],
    notCoveredExplanation: [
      'URBAN SA e operator unic din 2 februarie 2026 (tranziție recentă).',
      'Infrastructura e organizată pe 4 fracții: plastic/metal, hârtie/carton, biodegradabil, rezidual.',
      'Program per adresă încă nu e publicat public — noi îl vom adăuga când devine disponibil.',
    ],
    resources: [
      { label: 'urbansa.ro', url: 'https://www.urbansa.ro/' },
      { label: 'Primăria Sector 6', url: 'https://primarie6.ro/primarie_sector6/salubritate2' },
      { label: 'Tel: +40 21 413 91 15', url: 'tel:+40214139115' },
    ],
  },
};

export function getCoverage(sector: number): CoverageNote | null {
  return COVERAGE[sector] ?? null;
}
