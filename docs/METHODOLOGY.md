# Metodologie

## Principiu editorial

**Agregator, nu sursă de adevăr.** Fiecare afirmație publicată poartă linkul către sursa oficială emitentă. Când autoritatea nu publică, **nu inventăm** — afișăm ce știe operatorul, linkul către canalul oficial, și lăsăm cetățeanul să ajungă la sursa vie.

Riscul pe care îl evităm deliberat: producerea unui **screenshot static** al unei situații care se schimbă. Dacă publicăm „Sectorul X are Y insule ecologice operaționale la data Z" și acel număr se schimbă fără să aflăm, devenim dezinformare. Deci:

- Publicăm obligația legală (stabilă).
- Publicăm termenul fix (data e documentată).
- Linkăm la sursa vie pentru status curent.

## Surse — ierarhia de calitate

Cel mai bun → cel mai slab:

1. **Sursă oficială emitentă, structurată, scrapabilă** (ex. Romprest S1 HTML per stradă, impozitelocale2 S2 formular căutare). ✅ Folosim direct.
2. **Sursă oficială emitentă, PDF sau pagină neparsabilă** (ex. anunțuri primărie cu tabele imagine). Citat inline cu link, dar datele se introduc manual.
3. **Portal legislativ** (`legislatie.just.ro`, `eur-lex.europa.eu`) — pentru acte normative, citate sub obligații.
4. **Companie municipală / operator licențiat** (ex. DGSS3, CLEAN ALL 4 CITY, Salubrizare 5, URBAN SA) — canal oficial secund. Citat inline.
5. **Minister / AM PNRR** (`mmediu.ro`, `pnrr.mmap.ro`, `mfe.gov.ro`) — surse de referință pentru cifre PNRR și termene.
6. **Surse terțe (presă, ONG-uri, agregator)** — evitate ca sursă primară. Acceptate doar ca `rel="nofollow"` pentru context istoric sau confirmare colaterală. **Nu** citate ca sursă unică pentru o afirmație factuală.

## Ce nu republicăm

- **Cifre de status** care decad (ex. „există 1.234 insule ecologice funcționale la dată X"). Preferăm „prin PNRR s-au contractat 265 de insule în S6 — pentru status operațional actual, vezi Monitor PNRR".
- **Informații verificate o singură dată, fără monitorizare ulterioară** — dacă nu știm cum aflăm că s-au schimbat, nu publicăm.
- **Cifre din presă**, dacă nu avem confirmarea sursei primare (minister, primărie, portal legislativ).

## Linkuri — dofollow vs. nofollow

Regula e simplă:

- **Dofollow** (pasează autoritate SEO): doar portofoliul autorului (`mmatinca.eu`, `tv.madeinro.eu`, `travel-trends.mmatinca.eu`). Marcat în `LegalFooter.tsx` cu comentariu explicit.
- **Nofollow** (`rel="nofollow noopener noreferrer"`): orice altceva extern — surse oficiale, operatori, primării, ministere, OSM, ONG-uri partenere, terțe părți, agregatori.

Justificare: proiect open-source civic nu vrea să pășeze SEO către site-uri private. Surse oficiale sunt citate pentru transparență, nu pentru a le promova SEO.

## Politica de scraping

### Reguli absolute

1. **Respect `robots.txt`**. Verificare automată la fiecare run. Dacă sursa blochează `*`, scraperul nu rulează și datele ajung manual în DB.
2. **User-Agent identificabil**: `CandReciclamBot/0.1 (+https://cand-reciclam.madeinro.eu; informational)`. Operatorul trebuie să poată identifica originea request-ului și să ne contacteze dacă e o problemă.
3. **Rate limit**: ≤1 request/secundă per host. Implementat prin serializare în Nominatim; implementat prin delay explicit în scrapers.
4. **Fetch minimal**: un scraper atinge URL-urile strict necesare, o dată pe zi (la 03:00 local). Nu crawl generic, nu probing aleator.
5. **Sursă = sursă oficială**. Nu scrape presă, bloguri, ONG-uri (decât dacă e singurul canal disponibil și doar pentru context, marcat explicit).

### Ce NU facem

- **Nu ocolim CAPTCHA-uri** sau WAF-uri.
- **Nu folosim browser headless** pentru a ocoli JS challenge-uri. Dacă o sursă are nevoie de JS complex, o marcăm ca indisponibilă tehnic și căutăm alt canal.
- **Nu scrapăm servicii care interzic explicit scraping** în Termenii de Utilizare (ex. InfoDeșeuri, conform Sec. 9.3). Pentru aceste cazuri, redirecționăm utilizatorul la canalul lor + documentăm problema public dacă datele sunt de interes public (vezi `sector 6 - de escaldat.md`).

### Diff-based alerting

Fiecare scraper stochează un snapshot raw al răspunsului parsed. La rularea următoare:

- Diff vs. snapshot precedent
- Dacă diff: `schedules.verified_at = NULL` + flag pentru review manual
- Datele NU se propagă automat la useri până la confirmare

Scop: prevenim ca un scraper rupt să publice date eronate. O modificare reală de program (rară) oricum merită verificare umană.

## Verificarea unei afirmații noi (flow editorial)

Când adăugăm o afirmație factuală nouă în `sectors.ts` sau conținut:

1. **Identifică sursa primară** (operator, primărie, minister, portal legislativ).
2. **Obține URL stabil** (nu homepage, nu rezultat de căutare — URL canonic al documentului).
3. **Notează data publicării** (dacă e vizibilă) și **data verificării** (azi).
4. **Redactează cu formulare neutră**. Evită adjective (ex. „scandalos", „incredibil"). Preferă citare directă când e posibil.
5. **Adaugă în structura `OfficialSource`** cu: `url`, `emitent`, `title` (dacă se știe), `type`, `publishedAt?`, `verifiedAt`.
6. **Render-ul UI** va afișa automat sursa cu `rel="nofollow"` inline.

Dacă sursa primară nu poate fi găsită:
- **Nu publica cifra**.
- Publică obligația generală cu bază legală + link la surse vii pentru status.

## Cadență verificare

- **Factual-as-of date** (`FACTUAL_AS_OF` constantă în `sectors.ts`): actualizat la fiecare review complet al datelor per sector.
- **Legal + obligații** (STANDARD_OBLIGATIONS): revizuit trimestrial sau când apare modificare legislativă semnificativă.
- **Scraper-e S1 + S2**: zilnic.
- **Datele S3–S6** (conțin doar contact + obligații): review la fiecare schimbare de operator / taxă / program + update `lastVerified`.

## Corecții și feedback

Pipeline planificat:

1. Utilizatorul apasă „raportează date greșite" pe pagina programului.
2. Raportul intră în `feedback_reports` cu `schedule_id`, `reported_date`, comentariu.
3. Admin revizuiește manual într-un interval rezonabil (target: 48h).
4. Dacă corectare necesară: update schedule + bump `verified_at` + eventual scraper patch.
5. Raportor primește răspuns (dacă a lăsat email).

Momentan raportarea e dezactivată în UI până la lansare (butonul apare disabled).

## Gestiunea erorilor de date publicate

Dacă publicăm o cifră/dată greșită și aflăm:

1. **Corectează imediat** în DB sau `sectors.ts`.
2. **Bump `verifiedAt`** la data corecturii.
3. **Adaugă notă** în commit message cu sursa care a revelat eroarea.
4. Dacă eroarea a fost semnificativă (ex. ziua greșită publicată > 24h): postează corectare publică pe LinkedIn/Twitter cu link spre corect.

Transparența corecturii e mai importantă decât aparența de infaillibilitate.
