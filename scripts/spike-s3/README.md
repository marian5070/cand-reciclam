# Spike Faza 0 — raport granularitate date colectare București

**Data**: 2026-04-12
**Scop**: validăm ipoteza „date street+number cross-sector sunt fezabile" înainte de a construi infra.
**Verdict**: **GO cu modelul `street_segments`** (cu nuanțe — vezi secțiunea decizii).

---

## Ce am testat

1. **S3** (Direcția Generală Salubritate) — sectorul nominalizat ca „cel mai greu" (fără street search public).
2. **S2** (Supercom via impozitelocale2.ro) — presupus street-level; am verificat empiric.
3. **S6** (URBAN SA) — al doilea presupus street-level.
4. **Cross-sector** pe **Calea Moșilor** (traversează S2/S3).

## Date publice per sector — găsirile

### ✅ S2 (Supercom) — STREET+NUMBER, scrape-able
- **Endpoint**: `POST https://www.impozitelocale2.ro/gunoi/`
- **Protocol**: form application/x-www-form-urlencoded, necesită `PHPSESSID` cookie + `csrf_token` preluat din GET-ul paginii.
- **Câmp input**: `valoarecnp` (numele e legacy — HTML reutilizat dintr-un formular CNP, dar primește nume de stradă). `maxlength=13` limitează query-ul.
- **Răspuns**: HTML cu două tabele (menajer + selectiv), rânduri `<tr class="deciziil_tabel">` cu coloane: nr. crt., denumire arteră, nr. poștal, zi colectare.
- **Exemplu de parser** (Python):
  ```python
  re.findall(r'<tr class=deciziil_tabel>\s*<td>[^<]*</td>\s*<td>([^<]+?)&nbsp;</td>\s*<td>(\d+)&nbsp;</td>\s*<td>([^<&]+)', html)
  ```
- **Observație**: aceeași (stradă, număr) poate apărea cu **mai multe zile** — blocuri cu frecvență 2-3 ori/săpt au rânduri multiple. Modelul DB trebuie să accepte asta natural (un rând per (segment, waste_type, zi)).

### ❌ S3 (Direcția Generală Salubritate Sector 3) — ZERO date street-level
- Site-ul WordPress (verificat via `/wp-json/wp/v2/pages?search=…`) NU are pagini cu program per stradă/zonă.
- Pagina `/colectare-deseuri/` conține un câmp de căutare **„în construcție"** (funcționalitate promisă, nelivrată).
- PDF-urile publicate sunt ghiduri conceptuale (umed vs. uscat) — nu calendare.
- **1.144 containere stradale + 719 sticlă + 1.224 underground** → modelul S3 este „containere comune pe stradă", nu „pubela la poartă" → program probabil uniform pe zonă/cartier, nu per stradă.
- **Concluzie S3**: pentru MVP, tratăm S3 ca **un singur segment care acoperă tot sectorul** cu disclaimer „program uniform — containere stradale, verifică sursa oficială".

### ⚠️ S6 (URBAN SA, monopol din 2 feb 2026) — date publice lipsă deocamdată
- urbansa.ro nu publică liste street-level accesibile la data testului (la 2 luni după preluarea monopolului).
- Link-ul ecoteca.ro care apăruse în cercetarea web este un articol SEO, nu sursa primară.
- **Probabil** URBAN SA are lista în PDF-uri distribuite doar prin contractare.
- **Plan**: seed manual din comunicate + scraping când publică URBAN SA o listă.

## Test cross-sector: Calea Moșilor

**Query S2**: `POST valoarecnp=MOSILOR` → 102 numere unice pe `MOSILOR - CALEA`, range **20-314**, 533 de intrări totale (numere cu mai multe zile/săpt).

**Interpretare**:
- Numerele 1-19 Calea Moșilor → **NU** apar la S2 → sunt în alt sector (probabil S3, zona Unirii).
- Numerele 20-314 → **S2 / Supercom**.
- Numerele >314 → probabil S2 încă (spre Obor) dar nu apar în rezultate (poate numerotare discontinuă).

**Concluzie**: **modelul `street_segments(street_id, sector_id, number_from, number_to)` este validat de date reale**. O stradă cu nume unic poate apărea în date de colectare a două sectoare diferite, cu range-uri de numere distincte.

**Paritate**: pe Calea Moșilor, zile de colectare apar identic pe numere pare și impare (nu e criteriu). Simplificare: pentru MVP, `parity='both'` default, păstrăm coloana pentru cazuri viitoare.

## Decizii propuse pentru user

### 1. Merg cu modelul `street_segments` — fezabil și necesar
Justificare: S2 are deja date care cer acest model (range 20-314 pe Moșilor). Fără model, fie ignorăm precizia S2 (pierdere valoare), fie inventăm regula ad-hoc.

### 2. Strategie de import per sector (revizuită post-spike)

| Sector | Strategie | Granularitate reală |
|--------|-----------|---------------------|
| S1 | Scraper Romprest HTML (programe.romprest.eu, structurat) | Per stradă (fără număr) |
| **S2** | **Scraper POST impozitelocale2.ro** — cel mai valoros | **Per stradă + număr + zi** |
| S3 | Seed manual „un segment pe sector", disclaimer „containere stradale" | Uniform pe sector |
| S4 | Seed manual până CLEAN ALL 4 CITY publică (fallback YAML) | Uniform / pe asociație |
| S5 | Seed manual din salubrizare5.ro (menajer 1x/săpt, reciclabil 1x/2 săpt) | Uniform pe sector |
| S6 | Seed manual din comunicate URBAN SA + scraper când publică | Provizoriu uniform |

### 3. Ordinea sprinturilor recomandată
1. **Săpt. 1**: infra + schemă + seed streets OSM + systemd dev.
2. **Săpt. 2**: scraper S2 (impozitelocale2.ro) — cea mai bună sursă, validată de spike. API `/streets` + `/schedule`.
3. **Săpt. 3**: seed manual S3+S5+S4 (YAML) cu programe uniforme pe sector → acoperim TOT Bucureștiul fast, chiar dacă inegal.
4. **Săpt. 4**: scraper S1 (Romprest HTML) + push.
5. **Săpt. 5**: S6 strategy (seed manual + urmărire publicare URBAN SA), polish, V1.

## Fișiere din spike

- `raw/s2_session.html`, `raw/s2_mihaibravu_v2.html`, `raw/s2_mosilor.html` — snapshot S2 raw.
- `raw/s6_ecoteca.html`, `raw/s6_urbansa.html` — snapshot S6 (demonstrează absența datelor publice).
- `raw/s3_ghid_umed_uscat.pdf` — ghid conceptual S3 (NU calendar).

## Limitări ale spike-ului

- Nu am verificat dacă impozitelocale2.ro are rate limiting sau robots.txt relevante pentru scraping automat. **De făcut înainte de scraping producție**: verificat `/robots.txt` + contactat ops pentru fair use.
- Selectivul (reciclabil) nu a apărut în căutarea pe Calea Moșilor — poate S2 are doar menajer în această sursă. De investigat cu alte străzi.
- S3/S4/S5 — am dedus lipsa datelor din searchări; e posibil să existe PDF-uri nelegate pe care nu le-am descoperit. Verificare suplimentară înainte de commit la „seed manual".
