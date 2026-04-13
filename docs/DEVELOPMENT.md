# Development

## Cerințe

- Node.js ≥ 22 (recomand `nvm`)
- Docker + Docker Compose
- npm ≥ 10
- `systemctl --user` (opțional, pentru servicii persistente)

## Prima rulare

```bash
# Clonează repo-ul
git clone <repo-url> && cd "gunoi bucuresti"

# Instalează dependențe
(cd api && npm install)
(cd pwa && npm install)

# Pornește Postgres
(cd postgres && docker compose up -d)

# Inițializează schema și seed-ul static
(cd api && npm run db:migrate && npm run db:seed)

# Populează date pentru Sectoarele 1 și 2
(cd api && npm run load:s1)      # fixture local (rapid)
(cd api && npm run load:s2)
# SAU scrap live (durează mai mult, atinge sursele oficiale):
# (cd api && npm run scrape:s1)
# (cd api && npm run scrape:s2)

# Pornește API și PWA în terminale separate
(cd api && npm run dev)           # port 3030
(cd pwa && npm run dev)           # port 5174
```

Deschide [http://127.0.0.1:5174](http://127.0.0.1:5174).

## Porturi

| Serviciu | Port |
|---|---|
| Postgres | `127.0.0.1:55442` |
| API (Fastify) | `127.0.0.1:3030` |
| PWA (Vite dev) | `127.0.0.1:5174` |
| Static server prerender | `127.0.0.1:4173` (temporar, doar la build) |

Toate legate de `127.0.0.1` — niciun port expus pe LAN în dev.

## Servicii persistente (systemd --user)

Opțional: rulează toate serviciile ca user-services systemd, astfel încât:
- Pornesc automat la login
- Se restart la eșec
- Log-uri via `journalctl --user`

**Fișierele de service:**

```ini
# ~/.config/systemd/user/cand-reciclam-db.service
[Unit]
Description=Când reciclăm? — Postgres (docker compose)
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/<user>/Desktop/proiecte/gunoi bucuresti/postgres
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down

[Install]
WantedBy=default.target
```

```ini
# ~/.config/systemd/user/cand-reciclam-api.service
[Unit]
Description=Când reciclăm? — API (Fastify tsx watch)
After=cand-reciclam-db.service
Requires=cand-reciclam-db.service

[Service]
Type=simple
WorkingDirectory=/home/<user>/Desktop/proiecte/gunoi bucuresti/api
Environment=PATH=/home/<user>/.nvm/versions/node/v22.22.0/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/home/<user>/.nvm/versions/node/v22.22.0/bin/npm run dev
Restart=on-failure
RestartSec=3

[Install]
WantedBy=default.target
```

```ini
# ~/.config/systemd/user/cand-reciclam-pwa.service
[Unit]
Description=Când reciclăm? — PWA (Vite dev)

[Service]
Type=simple
WorkingDirectory=/home/<user>/Desktop/proiecte/gunoi bucuresti/pwa
Environment=PATH=/home/<user>/.nvm/versions/node/v22.22.0/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/home/<user>/.nvm/versions/node/v22.22.0/bin/npm run dev
Restart=on-failure
RestartSec=3

[Install]
WantedBy=default.target
```

**Activare:**

```bash
systemctl --user daemon-reload
systemctl --user enable --now cand-reciclam-db cand-reciclam-api cand-reciclam-pwa
loginctl enable-linger <user>   # pornesc și când nu ești logged in
```

**Operațiuni uzuale:**

```bash
systemctl --user status cand-reciclam-{db,api,pwa}
systemctl --user restart cand-reciclam-api
journalctl --user -u cand-reciclam-api -f
journalctl --user -u cand-reciclam-api --since "1 hour ago"
```

## Variabile de mediu

### API (`api/.env`)

```bash
DATABASE_URL=postgres://cand_reciclam:dev_local_only@127.0.0.1:55442/cand_reciclam
PORT=3030
HOST=127.0.0.1

# VAPID keys pentru push (generate o dată: `npx web-push generate-vapid-keys`)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_CONTACT=mailto:contact@cand-reciclam.madeinro.eu
```

**Generare VAPID inițială:**

```bash
cd api
npx web-push generate-vapid-keys
# copiază Public Key și Private Key în .env
```

### PWA

Vite folosește `import.meta.env.PROD` pentru detectare build production. Nu sunt variabile custom momentan.

## Comenzi utile

### API

```bash
cd api

# Dezvoltare
npm run dev                  # tsx watch, port 3030

# Database
npm run db:generate          # după modificări la schema.ts
npm run db:migrate           # aplică migrații
npm run db:seed              # repopulează sectoare + operatori
npm run db:studio            # UI Drizzle pentru inspectare DB

# Populare date
npm run load:s1              # fixture local S1 (Romprest)
npm run load:s2              # fixture local S2 (Supercom)
npm run scrape:s1            # fetch live + parse + insert
npm run scrape:s2            # idem S2

# Build
npm run build                # tsc → dist/
npm start                    # node dist/server.js (producție)
```

### PWA

```bash
cd pwa

# Dezvoltare
npm run dev                  # Vite, port 5174

# Build
npm run build                # tsc (typecheck) + vite build + prerender
npm run build:nohydrate      # fără prerender (pentru debugging)
npm run prerender            # doar prerender (presupune dist/ există)
npm run preview              # servește dist/ local (port 4173)
```

## Testing pe mobil (LAN sau ngrok)

### Opțiunea A: IP LAN (necesită HTTPS pentru service worker)

Service worker e activ doar în production build pentru `import.meta.env.PROD`. În dev pe LAN IP (ex. 192.168.x.x), browsere refuză SW pe HTTP pentru alte hosturi decât `localhost`.

Workaround: build production + serve static + tunnel HTTPS temporar.

### Opțiunea B: ngrok (recomandat pentru test iOS rapid)

```bash
# Pornește tunnel pentru PWA dev
ngrok http 5174

# Pe telefon, deschide URL-ul HTTPS generat
# PWA funcționează, dar API-ul e pe localhost al tău — nu va răspunde
# Pentru flow complet, tunnelezi și API-ul sau faci build prod local
```

### Opțiunea C: deploy producție pe VPS

Cel mai curat pentru testare iOS push + PWA install. Vezi [DEPLOYMENT.md](./DEPLOYMENT.md).

## Debugging

### Service Worker interferă cu HMR

```js
// Chrome DevTools → Application → Service Workers → Unregister
// Sau deschide site-ul în private/incognito
```

### TypeScript shadow files

Dacă vezi erori stranii de import (ex. „module does not provide export X") și fișierul source are exportul:

```bash
# Șterge fișierele .js generate accidental în src/ de un `tsc -b`
find pwa/src -name "*.js" -o -name "*.d.ts" -delete
find api/src -name "*.js" -o -name "*.d.ts" -delete
```

`tsconfig.json` din `pwa/` are `noEmit: true` pentru a preveni asta; verifică și la modificări.

### Vite cache corupt

```bash
rm -rf pwa/node_modules/.vite
systemctl --user restart cand-reciclam-pwa
```

### Postgres locked / nu pornește

```bash
docker compose -f postgres/docker-compose.yml down
docker volume ls | grep cand-reciclam  # vezi dacă volumul e intact
docker compose -f postgres/docker-compose.yml up -d
```

Datele persistă în volumul `cand-reciclam-pgdata`. Pentru reset complet:

```bash
docker compose -f postgres/docker-compose.yml down -v  # ȘTERGE TOATE DATELE
docker compose -f postgres/docker-compose.yml up -d
cd api && npm run db:migrate && npm run db:seed && npm run load:s1 && npm run load:s2
```

## Commit-uri

- **Autor**: doar Marian Matinca (email configurat în `~/.gitconfig`).
- **Fără** `Co-Authored-By` pentru asistente AI.
- **Fără** referințe la AI / LLM / „generated with" în commit messages sau cod.
- Commit-uri atomice, mesaje în română sau engleză, consecvent pe repo.
- Format: scurt (sub 70 char) la subject, detalii în body dacă e nevoie.

## Lint & typecheck

```bash
# TypeScript
cd pwa && npx tsc --noEmit
cd api && npx tsc --noEmit

# Build rapid pentru validare
cd pwa && npm run build
```

## Workflow tipic de adăugat feature

1. Pornește servicii persistente (`systemctl --user status ...`).
2. Editează cod, verifică în browser pe `127.0.0.1:5174`.
3. Înainte de commit: `tsc --noEmit` în ambele + `npm run build` în PWA.
4. Snapshot manual de verificare vizuală (vezi [DEPLOYMENT.md](./DEPLOYMENT.md) pentru pre-publish checklist).
5. Commit + push (privat momentan).
