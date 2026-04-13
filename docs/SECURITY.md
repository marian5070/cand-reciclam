# Security

## Raportare vulnerabilități

Pentru vulnerabilități descoperite în cod, contactează **via [mmatinca.eu](https://mmatinca.eu)** (formular de contact) sau direct autorul pe email (adresa e listată pe site-ul autorului).

**Nu deschide issue public** pentru probleme de securitate înainte de o perioadă rezonabilă de răspuns (target: 7 zile pentru confirmare, 30 zile pentru patch).

Autor responsabil: **Marian Matinca**.

## Principii de securitate

### Zero PII (Personally Identifiable Information)

Proiectul e conceput să **nu stocheze** informații identificabile despre utilizatori:

- Fără email, fără parolă, fără nume
- Fără număr de telefon
- Fără adresă (alta decât cea de colectare deșeuri, pe care user-ul o introduce voluntar)
- Fără tracking (analytics, pixels, cookies terțe)

Singura informație per-user stocată:
- UUID generat client-side (nu derivă din nimic identificabil)
- `street_id` + `street_number` (adresa pentru notificări — opțional)
- Web Push subscription (`endpoint` + keys) — opțional, șters la dezabonare
- `notify_hour` (ora preferată pentru notificări)

### Minimizarea datelor externe

- **Fără** analytics terț (Google Analytics, Plausible, Fathom)
- **Fără** tracking pixels
- **Fără** cookies terțe
- **Fără** SDK-uri externe (Sentry, LogRocket)
- Fonts self-hosted (`@fontsource-variable/geist`)
- Hartă: Leaflet client-side, tiles de la OpenStreetMap (public)
- Geocoding: proxiat prin API-ul nostru cu cache → ceretățeanul nu atinge direct Nominatim

### Nivel-aplicație

- Header `X-User-Id` ca identificator — generat și gestionat client-side
- Nu există cont de admin în app; administrarea se face via SSH + SQL direct sau Drizzle Studio
- Endpoint `/api/users/:id/push-test` ar trebui restricționat la dev; în prod poate fi protejat cu token sau eliminat

### Dependențe

Dependințe npm sunt auditate periodic:

```bash
cd api && npm audit
cd pwa && npm audit
```

Vulnerabilități critice → patch imediat. Low/moderate → review și patch la next release.

Dependințele principale (producție):
- API: `fastify`, `drizzle-orm`, `postgres`, `got`, `cheerio`, `tough-cookie`, `web-push`, `node-cron`
- PWA: `react`, `react-dom`, `framer-motion`, `leaflet`, `qrcode`

## Nivel-infrastructură (producție)

### VPS

- Utilizator `deploy` non-root pentru execuție aplicație
- SSH doar cu chei publice, parola dezactivată
- `ufw` cu doar port 22 deschis inbound
- `unattended-upgrades` pentru patch-uri de securitate OS

### Cloudflare Tunnels

- `cloudflared` rulează outbound-only (nu deschide porturi pe VPS)
- TLS terminat la edge (Cloudflare certificat gestionat)
- TLS între Cloudflare și VPS nu e necesar (tunnel e mTLS)
- WAF Cloudflare activat — rules default + orice rule custom relevant

### Postgres

- Ascultă doar pe `127.0.0.1:5432` — inaccesibil din internet
- Parola în `.env` cu `chmod 600`
- Backup-uri zilnice `pg_dump` cu retenție 7 zile
- Nu expune conexiuni directe la DB — doar prin API

### Secrete

- `.env` cu `chmod 600`, owner `deploy`
- VAPID private key în `.env` (NU în repo)
- Niciun secret nu ajunge în git; `.gitignore` exclude `.env` și variante

## Content Security

### Input validation

- Căutări stradă: sanitizate prin `encodeURIComponent` client-side, folosite în LIKE parameterizat server-side
- Nume stradă pot conține diacritice, apostrof, spații — acceptate în query
- `street_id` și `number` validate ca numere finite server-side, cu 400 pentru invalid

### SQL injection

- Toate query-urile folosesc Drizzle ORM sau `sql\`\`` template tag din `drizzle-orm` cu parametri bind — niciun string concatenat în SQL
- Excepția: pattern LIKE folosește template literal, dar input-ul e între `%...%` și escape-uit de driver

### XSS

- React escapes HTML implicit în tot JSX-ul
- Nu folosim `dangerouslySetInnerHTML` niciunde
- Conținut editorial (Markdown pentru ghid) e static, commitat în repo — fără user-generated content pe UI

### CSRF

- API-ul nu folosește sesiuni bazate pe cookies → atac CSRF clasic nu se aplică
- Identificare prin UUID în header (nu cookie) → request-urile trebuie să trimită explicit UUID-ul
- Pentru endpoint-urile sensibile (push subscription), UUID-ul e owned de client — user-ul altcuiva nu poate modifica subscription-ul tău

## Service Worker

- Înregistrat doar în production (`import.meta.env.PROD`)
- Scope: root `/`
- Strategie cache: stale-while-revalidate pentru shell; network-first pentru API
- Actualizare: la deploy, SW nou preia controlul la următorul load (prompt user dacă UX necesită)

## Push notifications

- VAPID keys generate o dată, private key păstrat local
- Subscription-urile stocate în DB cu `p256dh` + `auth` + `endpoint`
- Scheduler cron orar verifică și trimite
- Eroare 410 (subscription gone) → endpoint curățat din DB

Payload push:
- `title`, `body`, `url`
- Nu conține informații sensibile; doar waste type + ora 07:00

## Ce NU am implementat (conștient)

- **Fără autentificare cu parolă** — nu stocăm credențiale
- **Fără 2FA** — nu există cont de utilizator
- **Fără rate limiting aplicație-nivel** — Cloudflare la edge acoperă
- **Fără auditing trail** — nu trackăm acțiunile user-ului

Aceste omisiuni sunt deliberate pentru un proiect civic zero-PII. Dacă extindem cu funcționalități care necesită auth (ex. admin UI), adaugăm separat, nu retroactiv în ce există.

## Incident response

Dacă descoperim compromitere:

1. **Izolare**: oprește `cloudflared` (tunnel-ul închide accesul public imediat).
2. **Analiza**: `journalctl --since` pentru log-urile relevante; `docker logs cand-reciclam-db` pentru DB.
3. **Curățare**: revocă VAPID keys (regenerează), rotește parola DB, rebuild containers.
4. **Restore**: deploy fresh de la ultimul commit verificat.
5. **Disclosure**: dacă user-data a fost afectat (push subscriptions): notificare publică + invalidare tokens.
