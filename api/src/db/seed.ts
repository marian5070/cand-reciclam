import { db, schema } from './index.js';

const SECTORS = [
  { id: 1, name: 'Sector 1' },
  { id: 2, name: 'Sector 2' },
  { id: 3, name: 'Sector 3' },
  { id: 4, name: 'Sector 4' },
  { id: 5, name: 'Sector 5' },
  { id: 6, name: 'Sector 6' },
];

const OPERATORS = [
  {
    sectorId: 1,
    name: 'Romprest',
    url: 'https://programe.romprest.eu/sectorul-1/colectare-selectiva/index-colectare-selectiva-s1.html',
    phone: '021/9460',
    email: 'secretariatsalubritate@romprest.eu',
  },
  {
    sectorId: 2,
    name: 'Supercom',
    url: 'https://www.impozitelocale2.ro/gunoi/',
    phone: '021-9654',
    email: 'contact@supercom.ro',
  },
  {
    sectorId: 3,
    name: 'Direcția Generală de Salubritate Sector 3',
    url: 'https://salubritate3.ro/colectare-deseuri/',
    phone: '021.318.03.23',
    email: null,
  },
  {
    sectorId: 4,
    name: 'CLEAN ALL 4 CITY SA',
    url: 'https://ps4.ro/',
    phone: null,
    email: null,
  },
  {
    sectorId: 5,
    name: 'SALUBRIZARE SECTOR 5 SA',
    url: 'https://salubrizare5.ro/programe-de-colectare/',
    phone: '031.9450',
    email: 'dispecerat@salubrizare5.ro',
  },
  {
    sectorId: 6,
    name: 'URBAN SA',
    url: 'https://www.urbansa.ro/',
    phone: '+40214139115',
    email: 'office@urbansa.ro',
  },
];

await db.insert(schema.sectors).values(SECTORS).onConflictDoNothing();
console.log(`✓ seeded ${SECTORS.length} sectors`);

for (const op of OPERATORS) {
  await db.insert(schema.operators).values(op);
}
console.log(`✓ seeded ${OPERATORS.length} operators`);

process.exit(0);
