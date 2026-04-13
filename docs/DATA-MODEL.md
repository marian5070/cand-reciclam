# Modelul de date

Sursa adevărului pentru schema e [`api/src/db/schema.ts`](../api/src/db/schema.ts) (Drizzle ORM). Migrațiile SQL generate sunt în `api/drizzle/`.

## Principiul fundamental: o stradă NU aparține unui sector

Modelul tradițional „strada X e în sectorul Y" nu descrie realitatea Bucureștiului. Străzi precum Calea Moșilor, Splaiul Independenței, Șoseaua Ștefan cel Mare **traversează granițe de sector** — același nume, numere diferite, sectoare diferite, operatori diferiți, programe diferite de colectare.

Soluția: o stradă are **segmente**. Fiecare segment e un interval de numere (cu paritate opțională) care aparține unui singur sector și unei singure zone de colectare.

```
streets (Calea Moșilor)
  └─ street_segments
       ├─ [1..50 par]   → sector 3, zona "Moșilor Nord"
       ├─ [1..50 impar] → sector 3, zona "Moșilor Nord"
       ├─ [52..150 par] → sector 2, zona "Moșilor Centru"
       └─ [51..149 imp] → sector 2, zona "Moșilor Centru"
```

Query-ul central pentru programul unei adrese folosește această structură:

```sql
SELECT sch.*, z.name AS zone, seg.sector_id
FROM street_segments seg
JOIN zones z ON z.id = seg.zone_id
JOIN schedules sch ON sch.zone_id = z.id
WHERE seg.street_id = $1
  AND $2 BETWEEN seg.number_from AND COALESCE(seg.number_to, 2147483647)
  AND (seg.parity = 'both'
    OR ($2 % 2 = 1 AND seg.parity = 'odd')
    OR ($2 % 2 = 0 AND seg.parity = 'even'));
```

`COALESCE(number_to, 2147483647)` tratează capătul deschis (ex. „Calea Moșilor 220+").

## Tabele

### `sectors` (seed static, 6 rânduri)
| Coloană | Tip | Notă |
|---|---|---|
| id | int PK | 1..6 |
| name | text | „Sectorul 1", etc. |

### `operators` (seed static per sector)
| Coloană | Tip | Notă |
|---|---|---|
| id | serial PK | |
| sector_id | int FK | |
| name | text | „Romprest", „Supercom", etc. |
| url | text? | site oficial |
| phone, email | text? | contact |

### `zones` (sub-sector pentru programe diferențiate)
| Coloană | Tip | Notă |
|---|---|---|
| id | serial PK | |
| sector_id | int FK | |
| name | text | ex. „Sector 1 — case", „Sector 2 — menajer urban" |
| operator_id | int FK | opțional |

O zonă are unul sau mai multe `schedules`. O adresă ajunge la o zonă prin `street_segments.zone_id`.

### `streets` (unic pe nume)
| Coloană | Tip | Notă |
|---|---|---|
| id | serial PK | |
| name | text | ex. „Dacia" |
| slug | text unic | ex. „dacia" — pentru URL-uri viitoare |

Index trigram pe `name` pentru căutare LIKE performantă.

### `street_segments` (cheia modelului)
| Coloană | Tip | Notă |
|---|---|---|
| id | serial PK | |
| street_id | int FK (cascade) | |
| sector_id | int FK | |
| number_from | int? | NULL = început deschis |
| number_to | int? | NULL = capăt deschis (infinit) |
| parity | enum('odd','even','both') | implicit 'both' |
| zone_id | int FK | |
| source_url | text? | de unde am luat intervalul |
| source_fetched_at | timestamp? | data ultimei preluări |
| verified_at | timestamp? | NULL = nevalidat după ultimul diff |

### `schedules` (programul pe zonă + tip deșeu)
| Coloană | Tip | Notă |
|---|---|---|
| id | serial PK | |
| zone_id | int FK (cascade) | |
| waste_type | enum | menajer / reciclabil_uscat / bio / voluminoase / deee / textile / sticla |
| rrule | text | RFC 5545, ex. `FREQ=WEEKLY;BYDAY=TU,FR` |
| building_type | enum? | 'case' / 'blocuri' / NULL (aplicabil amblor) |
| source_quality | enum | **calitatea sursei** (vezi mai jos) |
| source_url | text? | dacă diferă de segment |
| source_note | text? | |
| override_dates | text[] | **date explicite YYYY-MM-DD** — suprascriu RRULE dacă sunt prezente |
| source_fetched_at | timestamp? | |
| verified_at | timestamp? | |

**De ce `override_dates`:** unele operator publică liste explicite de date (ex. Romprest pentru „miercuri din săptămâna pară"). RRULE standard aplicat naiv poate interpreta greșit „săptămâna pară" (ISO week vs. relativă). Când sursa publică lista, o stocăm literal și ignorăm RRULE pentru acele zile.

### `source_quality` enum

Patru nivele de calitate, afișate vizual în UI cu badge:

| Valoare | Etichetă UI | Semnificație |
|---|---|---|
| `street_number` | 🟢 program per adresă | Operatorul publică datele per stradă + număr. Ex: Romprest S1, impozitelocale2 S2. |
| `sector_uniform` | 🟡 program uniform pe sector | Operatorul publică un singur program pentru tot sectorul. Ex: S3 containere stradale, S5. |
| `provisional` | 🟠 provizoriu — operatorul nu publică | Tranziție operator, date incomplete. Ex: S4 post-UWS, S6 pre-rodaj. |
| `manual` | 🔴 introdus manual | Fallback YAML commitat în repo, fără sursă oficială scrapabilă. |

### `schedule_exceptions` (pentru zile moveable sau anulate)
| Coloană | Tip | Notă |
|---|---|---|
| schedule_id | int FK | |
| date | date | data originală |
| action | enum | `canceled` sau `moved_to` |
| moved_to | date? | dacă action=moved_to |
| note | text? | explicație user-visible |

### `disposal_points` (hartă centre de preluare)
| Coloană | Tip | Notă |
|---|---|---|
| waste_type | enum | pentru filtrare |
| name, address | text | |
| lat, lng | text? | stocat ca text pentru compatibilitate cu Postgres numeric |
| notes | text? | program, condiții |

### `users` (zero PII)
| Coloană | Tip | Notă |
|---|---|---|
| id | uuid | generat client-side, trimis via header `X-User-Id` |
| created_at | timestamp | |
| street_id, street_number | | adresa de notificare |
| push_endpoint, push_p256dh, push_auth | text? | Web Push subscription |
| notify_hour | int? | 0..23, ora la care trimitem push în ziua dinainte de colectare |

**Nu stocăm**: email, parolă, nume, IP (în afara log-urilor Fastify rotite), device fingerprint.

### `feedback_reports`
| Coloană | Tip | Notă |
|---|---|---|
| user_id | uuid? | opțional |
| schedule_id | int? | |
| reported_date | date? | |
| comment | text? | |
| resolved | bool | default false |

### `geocode_cache` (proxy Nominatim)
| Coloană | Tip | Notă |
|---|---|---|
| query | text PK | formă normalizată |
| lat, lng | text? | NULL dacă not found |
| found | bool | cache negativ |
| display_name | text? | |

Scop: respectăm politica Nominatim de 1 req/s. Fiecare căutare unică se face o singură dată; rezultatele negative sunt și ele stocate (altfel am cere de o mie de ori aceeași adresă inexistentă).

## Decizii de modelare

### De ce `override_dates` ca `text[]`, nu tabel separat

Fiecare schedule are maxim ~60 de date explicite (un an). Array-ul Postgres e citit întreg oricum la render. Un tabel separat ar fi necesitat JOIN pentru fiecare schedule afișat.

### De ce `lat/lng` ca `text`, nu `numeric`

Drizzle + `postgres` npm driver au o relație mai predictibilă cu `text` decât cu `numeric`. Conversia la `Number()` în frontend e banală și nu afectează precizia (adrese, nu satelit).

### De ce `source_fetched_at` și `verified_at` separate

- `source_fetched_at` — când am citit ultima dată sursa
- `verified_at` — când un operator uman a confirmat că datele sunt încă corecte

Un scraping nou care nu ridică diff față de snapshot-ul precedent setează ambele. Un diff setează doar `source_fetched_at` și resetează `verified_at = NULL`. UI afișează `verified_at`, nu `source_fetched_at`.

## Migrații

Generare migrație după modificarea schemei:

```bash
cd api && npm run db:generate
```

Aplicare pe dev local:

```bash
npm run db:migrate
```

Fișierele SQL generate sunt în `api/drizzle/` și trebuie commitate în repo.

## Reseed

```bash
cd api
npm run db:seed    # șterge și repopulează sectors + operators (date statice)
npm run load:s1    # populează street_segments + schedules pentru S1
npm run load:s2    # idem S2
```

`db:seed` e idempotent (ON CONFLICT DO NOTHING). `load:*` folosesc fixture-uri din `api/fixtures/` sau scrap live în funcție de flag.
