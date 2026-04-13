# Reguli editoriale și bază legală

## Formularea conținutului

### Framing pozitiv

CTA-urile și titlurile evită „gunoi", „deșeuri", „aruncă". Preferă:

- „Mâine reciclăm plastic" nu „Mâine se ridică gunoiul plastic"
- „Scoatem la 07:00" nu „Aruncă până la 07:00"
- „Ce reciclăm?" nu „Unde arunci gunoiul?"

Motivul: cetățeanul e un participant la un sistem de reciclare, nu un producător de gunoi.

### Limbaj neutru pentru operatori și autorități

Evităm adjective negative sau acuzatoare. Publicăm fapte + surse:

- ✅ „Operatorul nu publică programul per adresă."
- ❌ „Operatorul refuză transparența."

Fapta e verificabilă. Intenția („refuză") nu.

Observațiile critice sau escaladările merg în documente separate (ex. `sector 6 - de escaldat.md`), nu în copy-ul din UI.

### Cifre și termene

- Orice cifră factuală (taxe, termene, dimensiuni contract) → citare inline cu link sursă primară.
- Data verificării noastre → afișată explicit pe fiecare pagină.
- Cifre care decad (status operațional, număr insule funcționale) → **nu le publicăm**; linkăm la sursa vie.

### Disclaimers

`LegalFooter` apare pe fiecare pagină cu:

1. „Situația prezentată e factuală la data de [Z]. Informațiile provin exclusiv din surse oficiale. Fiecare afirmație are sursa oficială linkată alături."
2. „Acuratețea și actualizarea datelor originale sunt responsabilitatea exclusivă a emitenților. Noi agregăm și prezentăm; nu garantăm corectitudinea."
3. „Pentru decizii importante, verifică direct la sursa oficială marcată pe fiecare pagină."

Acest triplet e non-negociabil — protecție legală + transparență simetrică față de user.

## Bază legală pentru citările surse oficiale

Citarea și republicarea linkată a informațiilor emise de autorități publice sunt acoperite de:

| Act normativ | Ce permite |
|---|---|
| **Legea 544/2001** (RO) | Dreptul cetățeanului la informații de interes public. |
| **Directiva 2003/4/CE** + **Legea 86/2000** (Convenția Aarhus) | Dreptul la informații de mediu. |
| **Directiva (UE) 2019/1024** (PSI / Open Data) + **Legea 179/2022** | Instituțiile publice trebuie să facă accesibile seturile de date rezultate din activitatea lor; datele de mediu sunt „set de date de mare valoare". |
| **Regulamentul UE 2023/138** | Specifică seturile high-value — include date de mediu. |

Sursele citate sunt proprietatea emitenților lor. Citarea cu link direct și atribuire e practică standard în jurnalism, cercetare, agregare civică.

## Licențe proiect

### Cod

[MIT License](../LICENSE) — copyright Marian Matinca, 2026.

### Conținut original

Textele originale ale site-ului (explicații, metodologie, ghiduri de sortare, descrieri sector) sunt licențiate [CC-BY 4.0](../LICENSE-CONTENT). Reutilizare permisă cu atribuire.

### Date OSM

Seed-ul de străzi folosește © OpenStreetMap contributors sub [ODbL](https://www.openstreetmap.org/copyright). Attribution în footer + `manifest.webmanifest`.

### Date oficiale citate

Programele de colectare publicate de Romprest (S1), Supercom via impozitelocale2 (S2), și alți operatori — sunt date publice emise de operatori licențiați care execută un serviciu public. Citarea cu link direct respectă:

- Natura publică a informației (serviciu public, obligație de transparență a operatorului)
- Atribuire explicită (emitent + URL + data verificării)
- Absența modificării datelor (afișăm exact ce a publicat operatorul)
- Absența exploatării comerciale (proiect non-comercial, MIT + CC-BY)

### Date pe care nu le republicăm

InfoDeșeuri (Asociația SAPIENS ADN, aplicație suportată de Ministerul Mediului) are Termeni de Utilizare care interzic explicit scraping, reproducere și agregare (Sec. 9.3, 10.1). **Nu scrapăm această sursă.** Redirecționăm utilizatorii la canalul lor + documentăm problema public (`sector 6 - de escaldat.md`).

## Atribuire autor

Autorul exclusiv al proiectului e **Marian Matinca**. Aceasta se reflectă în:

- `package.json` (api + pwa): câmp `author`
- `README.md` + pagina `/despre`
- `LICENSE` și `LICENSE-CONTENT`: copyright Marian Matinca
- JSON-LD (`SectorPage`, `SchedulePage`): `author.name = "Marian Matinca"`
- Commit-uri: doar numele autorului în `user.name` / `user.email`
- Footer: „© [an] Marian Matinca · când reciclăm?"

**Nu apar:** mențiuni „generated with", „assisted by", „co-authored by <AI>". Proiectul e open-source sub autor singular.

## Politica pentru greșeli publicate

Transparența corecturii > aparența de infaillibilitate. Dacă publicăm o eroare factuală și aflăm:

1. Corectare imediată în DB / `sectors.ts`.
2. `verifiedAt` bumped la data corecturii.
3. Commit cu sursa care a dezvăluit eroarea.
4. Dacă eroarea a fost semnificativă și publică > 24h (ex. ziua greșită de colectare): postare corectare publică (LinkedIn / Twitter), cu link la data corectă.

## Linkuri externe

Regula e clară și implementată uniform:

- **`rel="noopener noreferrer"`** (dofollow): doar portofoliul autorului.
- **`rel="nofollow noopener noreferrer"`** (nofollow): orice altceva extern.

Implementare:

- `SourceCitation.tsx` aplică `nofollow` automat pentru URL-uri `http(s)://`.
- `LegalFooter.tsx` conține comentariu explicit care marchează intenția de dofollow pentru portofoliu.
- Componente de citare (`SourceBadge`, `EmptyState`, `Hero`, `MiniMap`, `GuideSheet`) aplică `nofollow` uniform.

Verificare: `grep -r 'target="_blank"' src/` trebuie să arate toate `rel` corespunzătoare.

## Conflicte cu alte reguli

Dacă o cerere de la un operator sau primărie intră în conflict cu aceste reguli (ex. „Scoate linkul spre site-ul nostru"):

1. Documentăm cererea.
2. Răspundem politicos, explicând baza legală (544/2001, Aarhus).
3. Dacă cererea e fundamentată, ajustăm — dar nu sub amenințare informală. Cererile formale (notificare juridică) merg la consiliere juridică înainte de acțiune.

Niciun operator sau primărie nu are drept de veto editorial asupra unui citării pe care legea o permite.
