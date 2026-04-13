# Sector 6 — de escaladat

## Context

Sectorul 6 al Bucureștiului are ca operator unic licențiat (monopol din 2 februarie 2026) **URBAN SA**. URBAN SA nu publică pe site propriu programul de colectare per adresă, ci direcționează cetățenii către **aplicația InfoDeșeuri**, dezvoltată de **Asociația SAPIENS ADN** cu sprijinul **Ministerului Mediului, Apelor și Pădurilor**.

**Problema identificată:**

1. InfoDeșeuri primește sprijin de la un minister (bani publici, direct sau indirect).
2. InfoDeșeuri are Termeni de utilizare care interzic explicit:
   - scraping / extragere automată a datelor (Secțiunea 9.3)
   - reproducere sau republish (10.1)
   - uz comercial (10)
3. Astfel, **date despre un serviciu public (colectare deșeuri), executat de un operator licențiat, rezumând obligații legale ale autorităților locale, finanțat indirect din bani publici**, sunt accesibile doar prin intermediul unei aplicații private cu restricții de uz.

**Temeiuri legale care pun sub semnul întrebării această situație:**

- **Directiva (UE) 2019/1024 (Open Data / PSI)** + **Legea 179/2022** (transpunere RO): instituțiile publice trebuie să facă accesibile seturile de date rezultate din activitatea lor. **Datele de mediu** sunt clasificate explicit ca „set de date de mare valoare" (high-value dataset) în **Regulamentul de punere în aplicare (UE) 2023/138**.
- **Directiva 2003/4/CE** + **Convenția Aarhus** (transpuse prin **Legea 86/2000** și **HG 878/2005**): dreptul cetățeanului de acces la informații de mediu deținute de / pentru autorități publice.
- **Legea 544/2001** privind liberul acces la informațiile de interes public.

---

## Demers pe paliere

### Tier 1 — stabilește faptele (gratuit, obligația de răspuns e legală)

1. **Cerere Legea 544/2001** la **Ministerul Mediului, Apelor și Pădurilor**
   - Contact: `cabinet.ministru@mmediu.ro`, formular pe mmediu.ro
   - Întrebări concrete:
     - Ce contract / parteneriat există cu Asociația SAPIENS ADN pentru aplicația InfoDeșeuri?
     - Ce sumă publică a fost alocată? Pe ce bază legală?
     - Sub ce licență sunt datele agregate acolo?
     - Datele figurează în Lista seturi de date deschise (conform Legii 179/2022)? Dacă nu, de ce?
   - Termen de răspuns: 10 zile lucrătoare (prelungibil la 30).

2. **În paralel, cerere similară Legea 544/2001 la URBAN SA** (operator licențiat executant serviciu public)
   - De ce direcționează cetățenii exclusiv către o aplicație privată în loc să publice datele pe site-ul propriu / în format deschis?
   - Sub ce bază legală nu publică programul de colectare per adresă direct?

### Tier 2 — dacă răspunsul e absent sau evaziv

3. **Sesizare la Autoritatea pentru Digitalizarea României (ADR)**
   - Contact: `contact@adr.gov.ro`
   - Subiect: neaplicarea **Legii 179/2022** — datele de mediu sunt „set de date de mare valoare" conform Regulament UE 2023/138 și trebuie publicate în format deschis pe **data.gov.ro**.

4. **Plângere la Avocatul Poporului**
   - Domeniul mediului + dreptul la informație.
   - Formular online: `avp.ro`.
   - Gratuit, fără avocat.

5. **Petiție la Comisia Europeană**
   - `ec.europa.eu/info/departments/environment`
   - Subiect: posibila încălcare a **Directivei 2019/1024 (PSI)** și **Directivei 2003/4/CE** (acces la informații de mediu).
   - Monitorizate activ la nivel UE.

### Tier 3 — dacă vrei escaladare

6. **Curtea de Conturi a României**
   - Sesizare privind utilizarea fondurilor publice în beneficiul unei entități private cu restricții contrare principiului transparenței.

7. **Parteneriat vizibilitate**
   - Expert Forum, Funky Citizens, Declic — ONG-uri cu experiență pe transparență + fonduri publice.

---

## Recomandare concretă

**Începe cu Tier 1 (pașii 1 + 2)** — o după-amiază de lucru. Răspunsul lor e piesa cheie:

- Fie primești date oficiale pe care le poți integra în proiect.
- Fie primești dovada că situația e exact cum bănuiești, ceea ce justifică Tier 2–3.

**Documentează totul**: cererea (text + dată), confirmarea de primire, răspunsul primit, termenele ratate.

Corespondența oficială poate deveni conținut editorial relevant pentru pagina Sectorului 6 (cu sursele oficiale linkate) — transformă problema într-un ghid public de transparență.

---

## Drafts postare LinkedIn (după escaladare normală și firească în primul contact)

### Varianta A — faptică, tehnică (mai sigură, cea mai ușor de susținut)

> În 2026, dacă locuiești în Sectorul 6 al Bucureștiului și vrei să afli când se ridică gunoiul la adresa ta, răspunsul oficial e: descarcă o aplicație privată.
>
> URBAN SA, operator unic licențiat din februarie 2026 (monopol), nu publică programul de colectare pe site-ul propriu. Direcționează cetățenii către InfoDeșeuri, o aplicație dezvoltată de Asociația SAPIENS ADN cu sprijinul Ministerului Mediului.
>
> Aplicația are Termeni de utilizare care interzic explicit: extragerea automată a datelor, reproducerea, utilizarea comercială, agregarea în alte servicii — fără consimțământ scris prealabil.
>
> Deci: serviciu public, executat de operator licențiat, plătit din taxe locale + 2,65 milioane EUR prin PNRR pentru insule ecologice → datele despre el circulă printr-un gateway privat cu restricții de uz.
>
> Am trimis cereri Legea 544/2001 la Ministerul Mediului și către URBAN SA întrebând: ce contract există, ce sumă publică s-a alocat, sub ce licență sunt datele, de ce nu apar pe data.gov.ro conform Legii 179/2022 (care transpune Directiva UE 2019/1024 — datele de mediu sunt „set de date de mare valoare").
>
> [Răspunsul oficial / absența răspunsului] e în comentarii.
>
> Directiva UE 2019/1024, Convenția Aarhus, Legea 544/2001 — toate există tocmai pentru ca un cetățean să nu trebuiască să accepte ToS-ul unei asociații private ca să afle când scoate pubela.
>
> Proiect open-source pe care lucrez: cand-reciclam.madeinro.eu — router transparent către surse oficiale, pentru toate 6 sectoarele.

### Varianta B — mai personală, cu unghi civic

> Pare o chestie banală: când se ridică gunoiul.
>
> Dar dacă locuiești în Sectorul 6 și vrei răspunsul, trebuie să descarci o aplicație privată. Nu există alternativă publicată pe site-ul operatorului (URBAN SA, monopol licențiat din feb 2026) sau al primăriei.
>
> Aplicația — InfoDeșeuri, făcută de un ONG cu sprijin de la Ministerul Mediului — are ToS care interzic scraping, agregare, reutilizare. Nu glumesc: Secțiunea 9.3, citit cu ochii mei.
>
> Plătești taxa de salubritate. Plătești, prin PNRR, 2,65 mil EUR pentru 265 de insule ecologice digitalizate în S6. Și ca să afli programul, ai nevoie de permisiune scrisă sau de un conto în app-ul unei asociații.
>
> Nu e teoretic. E un caz concret în care Directiva UE 2019/1024 (Open Data), Legea 179/2022 și Convenția Aarhus ar trebui să se aplice, dar nu se aplică.
>
> Am trimis două cereri Legea 544/2001 — Ministerului Mediului și URBAN SA. Întrebări banale: ce contract, ce bani, ce licență, de ce nu pe data.gov.ro?
>
> Urmează răspunsul oficial (sau tăcerea). Mă bucur să fac public ce primesc.
>
> Proiectul care m-a împins să mă uit serios la asta: cand-reciclam.madeinro.eu — un router transparent către surse oficiale, pentru toate sectoarele Bucureștiului. Open-source, rel=nofollow pe toate linkurile externe. Fac partea pe care autoritatea locală nu o face: pun în evidență lipsa transparenței, nu o înlocuiesc.

### Ghid de alegere

- **Varianta A** — pentru audiență mixtă (colegi, autorități, juriști care pot tag-ui util).
- **Varianta B** — pentru engagement civic (Funky Citizens, Expert Forum, jurnaliști).

**Note pentru momentul publicării:**
- Publică DUPĂ ce ai răspunsul oficial (sau după expirarea termenului de 30 zile fără răspuns). Înlocuiește placeholder-ul `[Răspunsul oficial / absența răspunsului]` cu rezumat concret + link/screenshot la răspuns.
- Pregătește o versiune „update" (30 zile mai târziu, dacă tăcerea continuă) — același mesaj, cu adăugarea: „Termenul legal a expirat pe [dată]. Urmează Tier 2: sesizare ADR + Avocatul Poporului."
- Tag-uri utile de considerat: Ministerul Mediului, URBAN SA (dacă au cont), Autoritatea pentru Digitalizarea României, Expert Forum, Funky Citizens, Declic.
- Comentariul 1 (pin) = linkul către cererile 544/2001 publicate integral (transparență simetrică).
