# Arhitectură

## Privire generală

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  PWA (Vite)     │─────▶│  API (Fastify)  │─────▶│  Postgres 16    │
│  React + TS     │ HTTP │  TypeScript     │ SQL  │  Drizzle ORM    │
│  Service Worker │      │  port 3030      │      │  port 55442     │
│  Port 5174 dev  │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        │                        │                        ▲
        │                        │                        │
        │                        ├─▶ Scrapers (cron)      │
        │                        │   S1 Romprest          │
        │                        │   S2 Supercom          │
        │                        │                        │
        │                        ├─▶ Geocoding cache      │
        │                        │   (Nominatim proxiat)  │
        │                        │                        │
        │                        └─▶ Push scheduler       │
        │                            (cron orar, VAPID)   │
        │                                                 │
        └────────────────────── seed OSM streets ─────────┘
```

Producție: PWA static prerendered + API pe același VPS, expuse via **Cloudflare Tunnels** (fără porturi inbound deschise pe server).

## Decizii tehnice și justificare

### De ce Node.js + Fastify, nu un full-stack framework

Proiect solo, cu scraping server-side + API REST simplu + push notifications. Next.js / SvelteKit adaugă complexitate de server-side rendering care nu e necesară (prerender-ul static din Vite acoperă SEO). Fastify are logging bun out-of-the-box și overhead minim.

### De ce prerender static, nu SSR

Conținutul non-dinamic (landing, pagini sector, despre, termeni) e identic pentru toți utilizatorii. Prerender cu Playwright la build time produce HTML indexabil de Google fără overhead runtime. Rutele dinamice (`/adresa/:id/:num`) rămân SPA client-side — nu au nevoie de SEO (sunt personalizate și noindex implicit).

### De ce PostgreSQL, nu SQLite

Volumul de date e mic (~10k străzi, 6 operatori, ~100 zone, ~50 scheduler-e), dar queries folosesc:
- `array_agg` cu `FILTER` pentru agregare sectoare per stradă
- Condiționale cu `COALESCE(number_to, 2147483647)` pentru intervale deschise
- `override_dates text[]` pentru liste de date explicite din sursa oficială

SQLite s-ar fi putut, dar Postgres dă mai bine la query-urile cu agregate și array, plus backup-urile `pg_dump` / replicate standard.

### De ce Drizzle ORM, nu Prisma

Drizzle e SQL-first: schema TypeScript reflectă SQL direct, migrații sunt fișiere .sql citibile, execute raw `sql\`...\`` e first-class. Prisma ar fi forțat o abstracțiune suplimentară pentru query-uri care deja sunt clare în SQL.

### De ce custom router (~80 LOC), nu React Router

Trei rute parametrizate. React Router ar fi adăugat 50KB gzipped pentru features pe care nu le folosim. `lib/router.tsx` are matching pe `:param`, `usePathname`, `navigate`, `<Link>` — exact cât trebuie.

### De ce Tailwind v4, nu CSS modules / styled-components

Tailwind v4 cu `@theme` directive permite tokens semantici (`--color-fg`, `--color-surface-tinted`) care se adaptează la dark mode fără duplicare. Styled-components ar fi legat CSS-ul de runtime React. CSS modules ar fi multiplicat fișiere pentru component-uri mici.

### De ce self-hosted push (`web-push` npm), nu Firebase Cloud Messaging

Zero dependențe externe (principiu de proiect). VAPID keys generate o dată, subscription-urile stocate local, scheduler orar simplu. FCM ar fi adus tracking Google.

### De ce fără servicii externe managed

- **Fără** Supabase, PlanetScale, Firebase → propriul Postgres
- **Fără** Vercel, Netlify → static servit de Fastify
- **Fără** Google Analytics → zero tracking (proiect civic)
- **Fără** Nominatim direct în client → proxiat prin `/api/geocode` cu cache DB (respect 1 req/s)

Consecință: portabilitate completă. Orice VPS cu Docker rulează întreg stack-ul.

## Flow-uri cheie

### 1. Utilizator caută adresă

```
User type "dacia" 
  → PWA: searchStreets(q)
  → API: GET /api/streets?q=dacia
  → Postgres: LIKE '%dacia%' cu agregare sectoare
  → User vede listă rezultate cu segmentCount
  → User click pe "Dacia" cu segmentCount=20 (multi-sector)
  → PWA cere număr
  → User scrie "36"
  → PWA navigate to /adresa/1265/36?sector=1
  → SchedulePage: getStreet(1265) → actualizează numele
  → SchedulePage: getSchedule(1265, 36) 
  → API: SELECT din street_segments JOIN zones JOIN schedules
         WHERE street_id=1265 AND 36 BETWEEN number_from AND number_to
         AND parity matches
  → Returnează schedule-uri cu rrule + override_dates + source_url
  → PWA: Hero + Timeline + MiniMap render
```

### 2. Notificare push în seara dinainte

```
Cron orar ('0 * * * *') → runSchedulerTick()
  → Pentru fiecare user cu push_endpoint:
    → Dacă notify_hour == currentHour:
      → Query schedule pentru streetId + number
      → Pentru fiecare schedule, verifică dacă mâine e zi de colectare
      → Dacă da: sendPush(endpoint, payload)
    → Dacă push returnează 410 (gone): curăță subscription din DB
```

### 3. Scraping zilnic S1/S2

```
Cron la 03:00 (nu e automat încă, rulat manual):
  npm run scrape:s1
  → got fetch programe.romprest.eu
  → cheerio parser → street + numberRange → waste type + days
  → Comparare cu snapshot precedent (diff-based)
  → Dacă diff: verified_at = NULL (necesită review)
  → Update DB + source_fetched_at
```

## Structură directoare

```
gunoi bucuresti/
├── api/                         # Fastify + Drizzle + scrapers
│   ├── src/
│   │   ├── server.ts            # entry point
│   │   ├── db/
│   │   │   ├── schema.ts        # Drizzle schema (sursa adevărului)
│   │   │   ├── migrate.ts       # aplică migrații din drizzle/
│   │   │   ├── seed.ts          # sectoare + operatori statici
│   │   │   └── index.ts         # export db + schema
│   │   ├── routes/
│   │   │   ├── streets.ts       # /api/streets, /api/streets/:id, /api/schedule
│   │   │   ├── users.ts         # /api/users + push subscription
│   │   │   └── geocode.ts       # /api/geocode (proxied Nominatim cu cache)
│   │   ├── scrapers/
│   │   │   ├── sector1.ts       # Romprest parser
│   │   │   └── sector2.ts       # Supercom/impozitelocale2 parser
│   │   ├── scripts/
│   │   │   ├── scrape-s1.ts     # rulează scraper S1
│   │   │   ├── scrape-s2.ts     # rulează scraper S2
│   │   │   ├── load-s1.ts       # încarcă fixture local (fără fetch)
│   │   │   └── load-s2.ts       # idem S2
│   │   ├── jobs/
│   │   │   └── scheduler.ts     # cron push notifications
│   │   └── push.ts              # web-push helper
│   ├── drizzle/                 # migrații SQL generate
│   └── package.json
│
├── pwa/                         # Vite + React + TS
│   ├── src/
│   │   ├── main.tsx             # entry, SW register în prod
│   │   ├── App.tsx              # router setup
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── SectorPage.tsx   # 6 sectoare uniform + obligații
│   │   │   ├── SchedulePage.tsx # /adresa/:id/:num
│   │   │   └── StaticPages.tsx  # despre, termeni, confidențialitate
│   │   ├── components/
│   │   │   ├── Hero.tsx         # program următor
│   │   │   ├── Timeline.tsx     # 14 zile înainte
│   │   │   ├── MiniMap.tsx      # Leaflet
│   │   │   ├── GuideSheet.tsx   # ghid sortare
│   │   │   ├── ObligationItem.tsx # obligație legală + risc financiar
│   │   │   ├── SourceCitation.tsx # citare inline cu rel=nofollow
│   │   │   ├── LegalFooter.tsx  # footer global
│   │   │   └── ...              # AddressSwitcher, NotifyDialog, etc.
│   │   ├── lib/
│   │   │   ├── api.ts           # fetch wrappers
│   │   │   ├── sectors.ts       # SectorInfo + STANDARD_OBLIGATIONS
│   │   │   ├── router.tsx       # custom history API router
│   │   │   ├── meta.ts          # usePageMeta + JSON-LD hooks
│   │   │   ├── types.ts         # Address, Pickup, WasteType, ...
│   │   │   ├── time.ts          # date helpers
│   │   │   └── coverage.ts      # waste type coverage heuristics
│   │   └── sw.ts                # service worker (prod)
│   ├── scripts/
│   │   └── prerender.mjs        # Playwright SSG
│   ├── public/
│   │   ├── manifest.webmanifest
│   │   ├── robots.txt
│   │   ├── sitemap.xml
│   │   └── icons/
│   └── package.json
│
├── postgres/                    # doar docker-compose.yml pentru dev
│
├── scripts/                     # spike-uri și one-off-uri
│   └── spike-s3/                # faza 0: verificare granularitate S3
│
├── docs/                        # documentație proiect
└── README.md
```

## Observabilitate și debugging

### Local

- `systemctl --user status cand-reciclam-{db,api,pwa}` — starea serviciilor
- `journalctl --user -u cand-reciclam-api -f` — log-uri live API
- `npm run db:studio` în `api/` — UI Drizzle pentru inspectare DB
- Chrome DevTools → Application → Service Workers — dezactivează SW în dev dacă face probleme

### Producție

- Log-uri Fastify (level `info`) emise pe stdout — captate de systemd / docker
- Backup zilnic `pg_dump` → `/srv/backups/` (setup descris în DEPLOYMENT.md)
- Cloudflare Analytics pentru trafic și error rates la edge (nu trackează useri)
- Endpoint `/api/health` pentru monitoring extern

## Limitări cunoscute

- Bundle JS ~617 KB (189 KB gzipped) — Leaflet e principalul contributor. Lazy-load-ul hărții ar reduce, dar e acceptabil pentru MVP.
- Scraping-ul rulează manual sau la cerere — nu există cron automat setup. De adăugat după validare.
- Fără admin UI pentru review diff-uri scraper — reset `verified_at=NULL` necesită SQL direct.
- iOS push notifications necesită Add-to-Home-Screen + iOS 16.4+.
