// Generates public/data/agents/{sectors,guide}.json from the same TS modules
// the UI renders (src/lib/sectors.ts, src/lib/guide.ts) — single source of
// truth, no drift. Consumed by /webmcp.js (in-browser agent tools). Runs as
// the first step of `npm run build` (Node 24 type-stripping imports the .ts
// files directly; guide.ts only has a type-only import, which is erased).
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(ROOT, '..', 'public', 'data', 'agents');

const { ALL_SECTORS, FACTUAL_AS_OF } = await import('../src/lib/sectors.ts');
const { GUIDE } = await import('../src/lib/guide.ts');

mkdirSync(OUT_DIR, { recursive: true });

writeFileSync(
  path.join(OUT_DIR, 'sectors.json'),
  JSON.stringify({ factual_as_of: FACTUAL_AS_OF, sectors: ALL_SECTORS }, null, 2) + '\n',
);
writeFileSync(
  path.join(OUT_DIR, 'guide.json'),
  JSON.stringify({ factual_as_of: FACTUAL_AS_OF, entries: GUIDE }, null, 2) + '\n',
);
console.log(`agent-data: ${ALL_SECTORS.length} sectors, ${GUIDE.length} guide entries written`);
