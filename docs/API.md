# API Reference

Base URL local: `http://127.0.0.1:3030`
Base URL producție: `https://cand-reciclam.madeinro.eu` (același host, proxiat prin Cloudflare Tunnels)

Toate răspunsurile sunt JSON. Erori returnează `{ "error": "<mesaj>" }` cu status HTTP adecvat.

## Autentificare

Identificare prin header `X-User-Id: <uuid>`. UUID-ul e generat client-side și persistat în `localStorage`. Endpoint-urile de utilizator își extrag user-ul din header sau din `params`.

**Fără:** email, parolă, token JWT, sesiuni server-side.

---

## Health

### `GET /api/health`

Status liveness + conectivitate DB.

**Response 200:**
```json
{
  "status": "ok",
  "brand": "Când reciclăm?",
  "db": "connected",
  "time": "2026-04-13T17:40:42.510Z"
}
```

---

## Străzi

### `GET /api/streets?q=<query>`

Căutare fuzzy după nume stradă. Returnează până la 20 rezultate, sortate după prefix match apoi lungime nume.

**Query params:**
- `q` — minim 2 caractere, case-insensitive

**Response 200:**
```json
[
  {
    "id": 1265,
    "name": "Dacia",
    "slug": "dacia",
    "sectors": [1, 2],
    "numberRange": { "from": 1, "to": 169 },
    "segmentCount": 95
  }
]
```

Câmpuri:
- `sectors` — lista sectoarelor prin care trece strada (pentru UI warning „multi-sector")
- `numberRange` — plaja de numere acoperite (min–max), `null` dacă strada n-are segmente încă
- `segmentCount` — numărul de segmente; dacă > 1, UI-ul cere numărul explicit înainte de a afișa programul

### `GET /api/streets/:id`

Detalii despre o stradă după ID (folosit pentru resolve nume la reload pagină `/adresa/:id/:num`).

**Response 200:**
```json
{
  "id": 1265,
  "name": "Dacia",
  "slug": "dacia",
  "sectors": [1],
  "numberRange": { "from": 10, "to": 65 }
}
```

**Response 404:**
```json
{ "error": "not found" }
```

---

## Program colectare

### `GET /api/schedule?street_id=<id>&number=<n>`

Returnează toate schedule-urile aplicabile pentru adresa dată. Filtrează pe paritate (număr par/impar) și pe intervalul segmentului.

**Query params:**
- `street_id` — obligatoriu
- `number` — opțional. Dacă lipsește și strada are un singur segment, se folosește segmentul unic. Dacă strada are mai multe segmente și `number` lipsește, returnează toate segmentele (UI-ul decide ce face).

**Response 200:**
```json
[
  {
    "scheduleId": 127,
    "wasteType": "menajer",
    "rrule": "FREQ=WEEKLY;BYDAY=TU,FR",
    "buildingType": "case",
    "sourceQuality": "street_number",
    "sourceUrl": "https://programe.romprest.eu/sectorul-1/colectare-selectiva/program-colectare-case.html",
    "overrideDates": null,
    "operator": "Romprest",
    "sectorId": 1,
    "zone": "Sector 1 — case",
    "numberRange": { "from": 10, "to": 65 }
  },
  {
    "scheduleId": 128,
    "wasteType": "reciclabil_uscat",
    "rrule": "FREQ=WEEKLY;BYDAY=WE",
    "buildingType": "case",
    "sourceQuality": "street_number",
    "sourceUrl": "https://programe.romprest.eu/...",
    "overrideDates": ["2026-04-08", "2026-04-22", "2026-05-06"],
    "operator": "Romprest",
    "sectorId": 1,
    "zone": "Sector 1 — case",
    "numberRange": { "from": 10, "to": 65 }
  }
]
```

Array gol înseamnă „adresa nu apare în datele publicate oficial". UI-ul afișează `EmptyState` cu trimitere la sursa oficială.

**`overrideDates`:** dacă e prezent și nenul, substituie interpretarea RRULE pentru acele date. Folosit când operatorul publică o listă explicită („miercuri din săptămâna pară: 8 apr, 22 apr, 6 mai...").

**Calitatea sursei** (`sourceQuality`) e afișată vizual cu chip colorat în UI. Vezi [DATA-MODEL.md#source_quality-enum](./DATA-MODEL.md#source_quality-enum).

---

## Utilizatori + push

### `POST /api/users`

Creează utilizator anonim. UUID-ul generat e returnat — clientul îl stochează în localStorage.

**Response 200:**
```json
{ "id": "a3f6c3b8-..." }
```

### `PUT /api/users/:id`

Actualizează preferințele utilizatorului.

**Body (câmpuri opționale):**
```json
{
  "streetId": 1265,
  "streetNumber": 36,
  "notifyHour": 20
}
```

**Response 200:**
```json
{ "ok": true }
```

### `GET /api/push/public-key`

Returnează VAPID public key pentru subscription.

**Response 200:**
```json
{ "key": "BKa...publicKeyB64..." }
```

### `POST /api/users/:id/push-subscription`

Salvează subscription-ul obținut de client via `navigator.serviceWorker.pushManager.subscribe(...)`.

**Body:**
```json
{
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

**Response 200:**
```json
{ "ok": true }
```

### `DELETE /api/users/:id/push-subscription`

Șterge subscription-ul (user dezactivează notificările).

### `POST /api/users/:id/push-test`

Trimite un push de test către utilizator (pentru verificare setup). Util în dev.

**Response 200:**
```json
{ "result": "ok" }
```

Rezultate posibile: `"ok"`, `"gone"` (endpoint invalid — curățăm), `"error"`.

---

## Geocoding

### `GET /api/geocode?q=<query>`

Proxy pentru Nominatim OSM cu cache Postgres. Respect rate limit 1 req/s.

**Query params:**
- `q` — minim 3 caractere

**Response 200 (găsit):**
```json
{
  "found": true,
  "lat": 44.445,
  "lng": 26.103,
  "displayName": "Strada Dacia 36, Sector 1, București",
  "cached": true
}
```

**Response 200 (nu s-a găsit):**
```json
{ "found": false }
```

**Politica Nominatim:**
- User-Agent: `CandReciclamBot/0.1 (+https://cand-reciclam.madeinro.eu; informational)`
- `countrycodes=ro` (limitare la România)
- `limit=1` (primul rezultat)
- Rezultat negativ cacheuit pentru a evita query-uri repetate

---

## CORS

În dev: permis doar de la `http://localhost:5174` și `http://127.0.0.1:5174`.
În producție: același host (PWA + API pe `cand-reciclam.madeinro.eu`), deci CORS nu e necesar de configurat diferit.

## Rate limiting

Nu există rate limiting la nivel aplicație. În producție, Cloudflare la edge poate aplica WAF + rate limit gratuit dacă apare trafic anormal.

## Versionare

Niciun `/v1/` în path. API-ul e pentru propriul frontend; schimbări non-compatibile sunt coordonate prin commit atomic (API + PWA modificate împreună).
