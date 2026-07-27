// Generates public/.well-known/agent-skills/index.json (Agent Skills
// Discovery RFC v0.2.0). The sha256 digest is computed from the SKILL.md
// file actually served, so it cannot drift from content. Re-run after any
// SKILL.md edit: node scripts/agent-skills-index.mjs
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = path.join(ROOT, '..', 'public', '.well-known', 'agent-skills');

const DESCRIPTIONS = {
  'query-cand-reciclam':
    'Query Când Reciclăm (cand-reciclam.madeinro.eu) — Bucharest waste-collection schedules from official operator sources — via the public MCP server, the read-only JSON API or in-browser WebMCP tools.',
};

const skills = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => {
    const md = readFileSync(path.join(SKILLS_DIR, d.name, 'SKILL.md'));
    return {
      name: d.name,
      type: 'skill-md',
      description: DESCRIPTIONS[d.name] ?? '',
      url: `/.well-known/agent-skills/${d.name}/SKILL.md`,
      digest: `sha256:${createHash('sha256').update(md).digest('hex')}`,
    };
  });

const index = {
  $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
  skills,
};

writeFileSync(path.join(SKILLS_DIR, 'index.json'), JSON.stringify(index, null, 2) + '\n');
console.log(`agent-skills: index.json written (${skills.length} skills)`);
