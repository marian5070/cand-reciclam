# Deployment

Producție: VPS Hetzner (Helsinki), expus public prin **Cloudflare Tunnels**. Fără porturi inbound deschise pe server.

## Arhitectură producție

```
Internet
    │
    ▼
Cloudflare Edge (TLS termination + WAF + DNS)
    │
    ▼  cloudflared tunnel (outbound-only)
    │
┌───┴──────────────────────────────────────┐
│  VPS Hetzner Helsinki                    │
│                                          │
│  127.0.0.1:3030  ← Fastify API           │
│                    serves /api/*         │
│                    + static dist/ (SPA)  │
│                                          │
│  127.0.0.1:5432  ← Postgres (local only) │
└──────────────────────────────────────────┘
```

API + PWA servite pe **același host, același port** (Fastify servește `pwa/dist/` via `@fastify/static`). Asta înseamnă:
- O singură origine → fără CORS
- Service Worker are scope corect
- Un singur ingress rule în Cloudflare Tunnel

## Cerințe pe VPS

- Ubuntu 24.04 LTS (sau similar)
- Docker + Docker Compose
- Node.js ≥ 22 (via `nvm` sau pachetul oficial)
- `cloudflared` instalat și configurat cu tunnel-ul deja existent
- Utilizator non-root pentru execuție (ex. `deploy`)

## Structură pe VPS

```
/srv/cand-reciclam/
├── api/                     # cod API (clonat din repo)
├── pwa/
│   └── dist/                # build production (copiat la deploy)
├── postgres/
│   └── docker-compose.yml   # DB în container
├── .env                     # VAPID keys + DATABASE_URL
└── logs/                    # dacă nu folosești systemd journal
```

## Pași deploy inițial

### 1. Pregătire VPS

```bash
# SSH ca deploy user
ssh deploy@vps-hetzner

# Clonează repo-ul (privat)
sudo mkdir -p /srv/cand-reciclam
sudo chown deploy:deploy /srv/cand-reciclam
cd /srv/cand-reciclam
git clone git@github.com:marianhp/cand-reciclam.git .

# Instalează dependențe
(cd api && npm ci --omit=dev)
(cd pwa && npm ci)
```

### 2. Configurare `.env`

```bash
# /srv/cand-reciclam/api/.env
DATABASE_URL=postgres://cand_reciclam:<PAROLĂ_PUTERNICĂ>@127.0.0.1:5432/cand_reciclam
PORT=3030
HOST=127.0.0.1
NODE_ENV=production

VAPID_PUBLIC_KEY=<public_key_generat>
VAPID_PRIVATE_KEY=<private_key_generat>
VAPID_CONTACT=mailto:contact@cand-reciclam.madeinro.eu
```

**Securitate**: `chmod 600 api/.env`.

### 3. Postgres în container

Editează `postgres/docker-compose.yml` pentru producție:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: cand-reciclam-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: cand_reciclam
      POSTGRES_USER: cand_reciclam
      POSTGRES_PASSWORD: <PAROLĂ_PUTERNICĂ>  # match cu .env
    ports:
      - "127.0.0.1:5432:5432"   # NUMAI loopback
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cand_reciclam"]
      interval: 5s

volumes:
  pgdata:
    name: cand-reciclam-pgdata
```

```bash
cd /srv/cand-reciclam/postgres
docker compose up -d
```

### 4. Inițializează DB

```bash
cd /srv/cand-reciclam/api
npm run db:migrate
npm run db:seed
npm run load:s1       # sau scrape:s1 pentru fresh data
npm run load:s2
```

### 5. Build PWA

```bash
cd /srv/cand-reciclam/pwa
npm run build         # tsc + vite + prerender
```

Rezultat în `/srv/cand-reciclam/pwa/dist/`. Fastify îl va servi static.

### 6. Servire statică PWA prin Fastify

În `api/src/server.ts`, adaugă (doar în producție):

```ts
import staticPlugin from '@fastify/static';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV === 'production') {
  await app.register(staticPlugin, {
    root: path.join(__dirname, '../../pwa/dist'),
    prefix: '/',
    wildcard: false,
  });

  // SPA fallback: rute nemapate → index.html
  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith('/api/')) {
      return reply.code(404).send({ error: 'not found' });
    }
    return reply.sendFile('index.html');
  });
}
```

### 7. systemd service pentru API

```ini
# /etc/systemd/system/cand-reciclam-api.service
[Unit]
Description=Când reciclăm? — API (Fastify production)
After=network.target docker.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/srv/cand-reciclam/api
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
# Build production
cd /srv/cand-reciclam/api && npm run build

sudo systemctl daemon-reload
sudo systemctl enable --now cand-reciclam-api
sudo journalctl -u cand-reciclam-api -f   # verificare
```

### 8. Cloudflare Tunnel ingress rule

Editează config-ul `cloudflared` existent:

```yaml
# ~/.cloudflared/config.yml
tunnel: <tunnel-uuid>
credentials-file: /home/deploy/.cloudflared/<tunnel-uuid>.json

ingress:
  # ... reguli existente pentru alte aplicații ...

  - hostname: cand-reciclam.madeinro.eu
    service: http://127.0.0.1:3030

  - service: http_status:404
```

```bash
sudo systemctl reload cloudflared
```

### 9. DNS pe Cloudflare

În Cloudflare dashboard:
- Tip: CNAME
- Name: `cand-reciclam`
- Target: `<tunnel-uuid>.cfargotunnel.com`
- Proxy: **activat (orange cloud)**

Propagare: instant (în general < 1 min).

### 10. Verificare end-to-end

```bash
# Pe VPS
curl http://127.0.0.1:3030/api/health
# {"status":"ok","brand":"Când reciclăm?","db":"connected",...}

# De pe laptop
curl https://cand-reciclam.madeinro.eu/api/health
# Același răspuns, dar prin Cloudflare

# Browser
# Deschide https://cand-reciclam.madeinro.eu → Landing + funcționalitate completă
# Lighthouse → verifică PWA installable, manifest OK, SW registered
```

## Update după deploy inițial

```bash
ssh deploy@vps-hetzner
cd /srv/cand-reciclam

git pull origin main

# API
(cd api && npm ci --omit=dev && npm run build)
(cd api && npm run db:migrate)   # dacă sunt migrații noi

# PWA
(cd pwa && npm ci && npm run build)

# Restart API (servește și PWA static)
sudo systemctl restart cand-reciclam-api
```

Zero downtime nu e necesar pentru MVP civic — restart de 2 secunde e acceptabil.

## Backup

### Postgres

```bash
# /etc/cron.daily/cand-reciclam-backup
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR=/srv/backups/cand-reciclam
mkdir -p "$BACKUP_DIR"

docker exec cand-reciclam-db pg_dump -U cand_reciclam cand_reciclam \
  | gzip > "$BACKUP_DIR/db-$TIMESTAMP.sql.gz"

# Retenție 7 zile
find "$BACKUP_DIR" -name "db-*.sql.gz" -mtime +7 -delete
```

`chmod +x` și lasă cron.daily să ruleze. Backup în `/srv/backups/cand-reciclam/`.

**Restore:**

```bash
gunzip < /srv/backups/cand-reciclam/db-20260413-030000.sql.gz \
  | docker exec -i cand-reciclam-db psql -U cand_reciclam cand_reciclam
```

### Cod

Git e sursa. VPS poate fi recreat în < 30 min din zero.

## Monitorizare

### Log-uri

```bash
sudo journalctl -u cand-reciclam-api -f
sudo journalctl -u cand-reciclam-api --since "1 hour ago"
docker logs cand-reciclam-db --tail 100
```

### Cloudflare Analytics

- Dashboard Cloudflare → Analytics → Traffic
- Rate de erori, latență, trafic agregat per regiune
- **Nu** trackează utilizatori individuali

### Uptime monitoring (opțional)

Uptime Kuma self-hosted sau Uptime Robot cu check la:
- `https://cand-reciclam.madeinro.eu/api/health` — rata 5 min

## Securitate

- `ufw` activ cu doar SSH (port 22) deschis inbound; toate celelalte blocate.
- `cloudflared` rulează ca user non-root, outbound-only.
- Postgres ascultă doar pe `127.0.0.1` — inaccesibil din internet.
- `.env` cu `chmod 600`.
- VAPID private key în `.env`, nu în repo.
- Update-uri de securitate: `sudo unattended-upgrades` configurat pentru kernel/OpenSSL/etc.

## IP real client (nu Cloudflare IP)

Pentru log-uri sau rate limiting la nivel aplicație, folosește header-ul `CF-Connecting-IP`, nu `X-Forwarded-For`:

```ts
const realIp = request.headers['cf-connecting-ip'] ?? request.ip;
```

Relevant momentan: niciun log pe IP. Dar e bun de știut pentru viitor.

## Cost estimat

- VPS Hetzner CX22 (Helsinki): ~4 €/lună
- Cloudflare Tunnels: gratis
- Domeniul `madeinro.eu`: deja deținut
- Cost total proiect în producție: **~4 €/lună**

## Rollback

Dacă un deploy rupe producția:

```bash
cd /srv/cand-reciclam
git log --oneline -10            # vezi ultimul commit stabil
git checkout <sha-stabil>
(cd api && npm ci --omit=dev && npm run build)
(cd pwa && npm ci && npm run build)
sudo systemctl restart cand-reciclam-api
```

Dacă migrațiile au fost problematice, restore din backup:

```bash
gunzip < /srv/backups/cand-reciclam/db-<timestamp>.sql.gz \
  | docker exec -i cand-reciclam-db psql -U cand_reciclam cand_reciclam
```

## Pre-publish checklist (iOS + general)

Înainte de a anunța public:

- [ ] `curl https://cand-reciclam.madeinro.eu/api/health` returnează 200 cu `db:"connected"`
- [ ] Landing page se deschide, autocomplete strada funcționează
- [ ] Flow complet: caut „Dacia", aleg număr, văd programul pentru S1
- [ ] Flow complet pentru S2: caut stradă din S2, văd programul
- [ ] Pagină sector pentru toate 6 se încarcă
- [ ] Pe iPhone Safari 16.4+: „Add to Home Screen" → deschide ca standalone app
- [ ] În app standalone: permite notificări → primește push de test (`POST /api/users/:id/push-test`)
- [ ] Pe Android Chrome: install prompt PWA apare după interacțiune
- [ ] Lighthouse PWA score > 90
- [ ] `robots.txt` permite crawlere, `sitemap.xml` listează toate rutele SSG
- [ ] Google Search Console: sitemap submis (opțional pre-lansare)
- [ ] Spot check: 5 adrese reale cunoscute din S1 + S2 au programul corect vs. sursa oficială
