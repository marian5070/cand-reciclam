export type WasteType =
  | 'menajer'
  | 'reciclabil_uscat'
  | 'bio'
  | 'voluminoase'
  | 'deee'
  | 'textile'
  | 'sticla';

export type SourceQuality =
  | 'street_number'
  | 'sector_uniform'
  | 'provisional'
  | 'manual';

export type Pickup = {
  date: string; // ISO
  wasteType: WasteType;
  sourceQuality: SourceQuality;
  sourceUrl: string;
  operator: string;
  buildingType?: 'case' | 'blocuri' | null;
};

export type Address = {
  streetId: number;
  street: string;
  number: number;
  sector: number;
  /** User's building type — populated when a street has both case + blocuri schedules */
  buildingType?: 'case' | 'blocuri';
};

export const WASTE_LABEL: Record<WasteType, string> = {
  menajer: 'menajer',
  reciclabil_uscat: 'reciclabil',
  bio: 'bio',
  voluminoase: 'voluminoase',
  deee: 'electrice',
  textile: 'textile',
  sticla: 'sticlă',
};

/** Descrieri scurte per tip — pentru claritate când userul vede „bio" pentru prima dată */
export const WASTE_DESCRIPTION: Record<WasteType, string> = {
  menajer: 'fracția umedă · pubela neagră',
  reciclabil_uscat: 'plastic, hârtie, metal · pubela galbenă',
  bio: 'resturi vegetale de bucătărie și grădină',
  voluminoase: 'mobilier, saltele, obiecte mari',
  deee: 'aparate electrice și electronice',
  textile: 'haine și țesături uzate',
  sticla: 'sticlă · borcane, butelii',
};

export const SOURCE_QUALITY_META: Record<
  SourceQuality,
  { label: string; dot: string; short: string }
> = {
  street_number: {
    label: 'Sursă oficială · date per stradă și număr',
    dot: 'bg-emerald-500',
    short: 'per adresă',
  },
  sector_uniform: {
    label: 'Sursă oficială · program uniform pe sector',
    dot: 'bg-amber-500',
    short: 'pe sector',
  },
  provisional: {
    label: 'Provizoriu · operatorul nu publică încă',
    dot: 'bg-orange-500',
    short: 'provizoriu',
  },
  manual: {
    label: 'Introdus manual · verifică la sursa oficială',
    dot: 'bg-rose-500',
    short: 'manual',
  },
};
