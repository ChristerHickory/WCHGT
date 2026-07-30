# Perplexity uppdatering - körguide

Den här guiden är en praktisk checklista för att uppdatera WCHGT i Perplexity-miljö.

## 1. Förutsättningar

- Projektrot: c:\Users\Oldti\Desktop\wchgt
- Node och npm installerat
- Git remote origin pekar på repo
- Backend körs i port 5000 i värdmiljön

Notering: frontend-koden har redan stöd för Perplexity-hosting via /port/5000 när host slutar på pplx.app.

## 2. Preflight (lokalt före push)

Kör i projektroten:

npm install
npm run check
npm run build

Om något steg fallerar: åtgärda först och kör om hela kedjan.

## 3. Databas och schema

Kör endast vid schemaändring:

npm run db:push

Backup rekommenderas före db:push om data.db används i driftlik miljö.

## 4. Publicering till GitHub

Vanligt flöde:

git status --short
git add .
git commit -m "Release: Perplexity update"
git push origin main

## 5. Runtime-verifiering i Perplexity

Kontrollera efter deploy:

1. Sidan laddar utan blank skärm.
2. GET-anrop går via /port/5000 (nätverkspanel).
3. Tävlingssidan laddar data.
4. Spridningsgraf längst ner visas med vald standardtävling.
5. Multi-val av tävlingar fungerar.
6. Tooltip visar korrekt tävling/spelare.
7. Trendlinjer och intervall visas per vald tävling.

## 6. Snabb felsökning

1. Ingen data i UI:
- Kontrollera att backend faktiskt lyssnar på 5000.
- Kontrollera att host är pplx.app eller att VITE_API_BASE är satt.

2. API-fel vid skrivning:
- Kontrollera x-admin-pin-flöde och serverns ADMIN_PIN.

3. Gammal frontend verkar ligga kvar:
- Gör ny build och verifiera att senaste commit är deployad.

## 7. Rekommenderad release-text (kort)

- Ny tävlingsspridning med multi-val och färgkodning
- Separata trendlinjer med statistiska intervall per tävling
- Förbättrad resultat-/HCP-hantering i admin
