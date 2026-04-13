# Contribuții

Mulțumesc pentru interes. Acest proiect e construit cu principii editoriale stricte — înainte de a contribui, citește [docs/EDITORIAL.md](./docs/EDITORIAL.md) și [docs/METHODOLOGY.md](./docs/METHODOLOGY.md).

## Tipuri de contribuții bine-venite

### 1. Corecții de date

Dacă observi un program de colectare afișat greșit:

- Deschide un issue cu: sectorul, strada, numărul, tipul de deșeu, ziua afișată vs. ziua corectă, și **linkul oficial** care confirmă ziua corectă.
- Fără sursă oficială, corectarea nu poate fi acceptată — principiul „informăm, nu ne asumăm" se aplică inclusiv contribuțiilor.

### 2. Surse noi pentru obligații legale

Dacă cunoști o bază legală sau un contract public relevant pentru sectoarele Bucureștiului pe care nu am citat-o, deschide issue cu linkul direct la sursa primară (portal legislativ, monitor oficial, primărie, minister — nu presă).

### 3. Bug-uri tehnice

- Include pașii de reproducere
- Versiunea browserului / OS
- Screenshot sau log dacă e vizual
- Ce te-ai fi așteptat să se întâmple

### 4. Feature-uri noi

Înainte de a trimite PR cu feature nou:
- **Deschide un issue de discuție** pentru a alinia scope + abordare
- Verifică dacă se potrivește cu filosofia proiectului (informăm, nu ne asumăm; zero PII; zero externe managed)
- PR-uri care adaugă tracking, analytics, SDK-uri externe, sau servicii managed vor fi respinse automat

### 5. Extensii spre alte orașe

Dacă vrei să extinzi modelul (`street_segments` + `source_quality`) la alt oraș din România:
- Respectă metodologia editorială (doar surse oficiale, `rel=nofollow`, disclaimer factual-as-of)
- Deschide issue pentru a discuta integrarea în repo principal sau fork separat
- Autoria rămâne cu contribuitorul; menținerea e responsabilitatea celui care propune

## Ce NU e bine-venit

- **Tracking, analytics, pixels**: nu se acceptă sub nicio formă.
- **SDK-uri externe pentru features** care pot fi implementate local: fără Firebase, Supabase, Vercel-specific, etc.
- **Mentări AI în cod sau commit**: `Co-Authored-By: Claude`, „generated with X", „assisted by Y". Autor: doar contribuitorul uman.
- **Adăugarea backlink-urilor dofollow** către site-uri externe altele decât portofoliul autorului principal.
- **Linkuri afiliate** sau monetizare.
- **Cifre fără sursă primară**. Ex: „există 1.234 insule ecologice" fără link minister/primărie — respins.

## Workflow PR

1. **Fork** repository-ul (când va fi public).
2. **Branch** descriptiv: `fix/s2-dacia-wednesday`, `docs/deployment-caddy-alternative`, `feat/admin-diff-review`.
3. **Commit-uri** atomice, mesaje clare (subject ≤ 70 chars):
   ```
   fix(s2): correct wednesday pickup for Dacia 52-169
   
   Source: https://impozitelocale2.ro/gunoi/... verified 2026-04-13
   Previous schedule mapped Wednesday to odd weeks (wrong);
   impozitelocale2 shows explicit dates.
   ```
4. **Typecheck + build** înainte de push:
   ```bash
   (cd pwa && npx tsc --noEmit && npm run build)
   (cd api && npx tsc --noEmit)
   ```
5. **PR description**: ce modifică, de ce, cum ai testat. Include link surse oficiale dacă e data-related.
6. **Fără** commit-uri auto-generate de AI fără revizuire atentă.

## Cod style

- **TypeScript strict mode** — niciun `any` implicit, fără `@ts-ignore` fără motivare în comment
- **Comment-uri scurte**, doar când rațiunea non-evidentă (constraint ascuns, bug workaround, invariant subtil)
- **Fără multi-paragraph docstrings** — funcțiile bine numite sunt suficiente
- **Fără re-exporturi** inutile, fără abstracțiuni pentru „consistență"
- Preferă editarea fișierelor existente în loc să creezi fișiere noi cu variații

## Autoria și licența contribuțiilor

Contribuind la acest repo:

- Codul contribuit e licențiat automat sub **MIT** (licența proiectului).
- Conținutul text (dacă e cazul) e licențiat sub **CC-BY 4.0**.
- **Copyright-ul rămâne cu contribuitorul**, dar licența permisivă permite proiectului să folosească codul/textul.
- Numele tău va apărea în `git log` și (dacă vrei) într-un fișier `AUTHORS.md` viitor.
- **Autor principal al proiectului** rămâne Marian Matinca (pentru licențe, package.json, footer).

## Contact

Pentru întrebări care nu se potrivesc cu issue-urile publice: via formular [mmatinca.eu](https://mmatinca.eu).

## Cod de conduită

Scurt:

- Respect reciproc, inclusiv în dezacord tehnic.
- Fără atacuri personale, fără comentarii despre autori/colaboratori (site vs. sistem).
- Discuții politice / activism fără legătură cu proiectul: off-topic.
- Focus pe cod, date, corectitudine editorială.

Încălcări semnificative → ban pe repo. Decizia finală aparține autorului principal.
