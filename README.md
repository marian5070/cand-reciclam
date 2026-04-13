# Când reciclăm?

Agregator transparent pentru programul colectării deșeurilor în București (sectoarele 1–6). Fiecare afirmație are sursa oficială linkată alături.

**Autor:** Marian Matinca ([mmatinca.eu](https://mmatinca.eu))
**Producție:** [cand-reciclam.madeinro.eu](https://cand-reciclam.madeinro.eu)
**Licență cod:** MIT · **Licență conținut:** CC-BY 4.0

---

## Ce face și ce nu face

**Face:**

- Pentru Sectoarele 1 și 2: afișează programul de colectare per stradă și număr, cu 14 zile înainte, cu sursa oficială (Romprest pentru S1, Supercom via impozitelocale2.ro pentru S2) linkată lângă fiecare afirmație.
- Pentru Sectoarele 3–6: afișează starea transparent — ce publică operatorul, ce nu publică, cum poate cetățeanul să afle direct (dispecerat, CAV-uri, aplicații partenere).
- Pentru toate sectoarele: listă obligații legale (UE + RO + PNRR) cu termene și mecanism de penalizare financiară, cu link către surse vii (Monitor PNRR, portal legislativ).
- Trimitere notificare push în seara dinainte de colectare (opt-in, zero PII).
- Ghid de sortare: baterii, ulei, medicamente, DEEE, voluminoase, textile, SGR.

**NU face:**

- Nu inventează și nu aproximează program unde autoritățile nu publică.
- Nu republică static cifre care decad în timp — pentru status operațional real, linkează la sursa vie.
- Nu cere email, parolă sau nume. Identificare prin UUID local în localStorage.
- Nu folosește servicii externe managed (nici analytics, nici tracking terț).

---

## Rulare locală

**Cerințe:** Node.js ≥ 22, Docker (pentru Postgres), npm ≥ 10.

```bash
# 1. Clonează și instalează
git clone <repo> && cd "gunoi bucuresti"
cd api && npm install && cd ../pwa && npm install && cd ..

# 2. Pornește Postgres
cd postgres && docker compose up -d && cd ..

# 3. Migrează și seed
cd api && npm run db:migrate && npm run db:seed

# 4. Populează date pentru S1 + S2
npm run scrape:s1   # sau: npm run load:s1
npm run scrape:s2   # sau: npm run load:s2

# 5. Pornește API (port 3030)
npm run dev &

# 6. Pornește PWA (port 5174)
cd ../pwa && npm run dev
```

Deschide [http://127.0.0.1:5174](http://127.0.0.1:5174).

Pentru setup persistent via `systemd --user`, vezi [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md).

---

## Documentație

| Document | Conținut |
|---|---|
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Decizii tehnice, flow date, stack |
| [docs/DATA-MODEL.md](./docs/DATA-MODEL.md) | Schema Postgres, modelul `street_segments` pentru străzi cross-sector |
| [docs/API.md](./docs/API.md) | Endpoint-uri API cu exemple request/response |
| [docs/METHODOLOGY.md](./docs/METHODOLOGY.md) | Politică de scraping, verificare surse, niveluri de calitate |
| [docs/EDITORIAL.md](./docs/EDITORIAL.md) | Reguli editoriale, licențe surse, strategie linkuri |
| [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) | Setup dev local, systemd services, workflow |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Deploy VPS Hetzner via Cloudflare Tunnels |
| [docs/SECURITY.md](./docs/SECURITY.md) | Raportare vulnerabilități, politică zero PII |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Ghid pentru contribuitori |

---

## Stack

- **API**: Node.js + TypeScript + Fastify + Drizzle ORM
- **Database**: PostgreSQL 16
- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS v4
- **PWA**: Service Worker custom + manifest + prerender SSG (Playwright)
- **Scraping**: `got` + `cheerio` + `tough-cookie`
- **Push**: `web-push` (VAPID)
- **Mape**: Leaflet + OpenStreetMap + Nominatim (proxiat cu cache)
- **Deploy**: VPS Hetzner + Cloudflare Tunnels (fără porturi inbound deschise)

Zero dependențe externe managed: fără Supabase, Firebase, Google Analytics, Vercel KV, etc.

---

## Declarație de responsabilitate

Acuratețea și actualizarea datelor originale sunt responsabilitatea exclusivă a emitenților — primării de sector, operatori licențiați, ministere. Acest site **agregă** informații publicate oficial; **nu garantează** corectitudinea lor. Pentru decizii importante, verifică direct la sursa oficială linkată pe fiecare pagină.

Data ultimei verificări factuale este afișată pe fiecare pagină.

---

## Licențe

- **Cod**: [MIT](./LICENSE)
- **Conținut original** (explicații, metodologie, ghiduri, texte editoriale): [CC-BY 4.0](./LICENSE-CONTENT)
- **Date OSM** (seed stradă): © OpenStreetMap contributors, [ODbL](https://www.openstreetmap.org/copyright)
- **Date operatori și primării**: proprietatea emitenților, citate sub dreptul la informație (Legea 544/2001, Convenția Aarhus, Directiva 2003/4/CE)

---

## Contact

- Email tehnic / contribuții: prin [mmatinca.eu](https://mmatinca.eu)
- Corecții date: folosește butonul de raportare de pe pagina programului (în curând) sau deschide issue
