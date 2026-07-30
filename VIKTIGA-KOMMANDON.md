# Viktiga kommandon för WCHGT

Den här filen är en snabbguide för de vanligaste kommandona.

## 1) Starta appen lokalt (utvecklingsläge)
Kör i projektmappen:

npm run dev

Om PowerShell bråkar med npm, kör:

npm.cmd run dev

När servern startat, öppna:
http://localhost:3000

## 2) Bygga appen
Bygger frontend + backend till dist-mappen:

npm run build

## 3) Starta byggd version (produktion lokalt)
Kör först build, sedan:

npm run start

## 4) TypeScript-kontroll
Kontrollerar typer utan att bygga:

npm run check

## 5) Databasschema (Drizzle)
Pushar schemaändringar:

npm run db:push

## 6) Öijared PDF-import (senaste tävling)
Importerar resultat från PDF-filer till Öijared-tävlingen med lägst ID:

node script/import-oijared-20260729-from-pdf.cjs

## 7) Snabb kontroll att importen gick in
Visar tävling, antal resultat och antal rundor för tävling 14:

node -e "const Database=require('better-sqlite3'); const db=new Database('data.db'); const t=db.prepare('SELECT id,namn,avslutad,bana_id FROM tavlingar WHERE id=14').get(); const rc=db.prepare('SELECT COUNT(*) c FROM tavlingsresultat WHERE tavling_id=14').get().c; const rnd=db.prepare('SELECT COUNT(*) c FROM rundor WHERE tavling_id=14').get().c; console.log({t,rc,rnd});"

## 8) Vanliga felsökningssteg
1. Om appen inte svarar: stoppa gamla node-processer och kör npm run dev igen.
2. Om API ser gammalt ut: starta om dev-servern.
3. Om import ger namnkonflikter: kontrollera spelarnamn i tabellen golfare först.

## 9) Tips
- Kör alltid kommandon från projektroten.
- Ta backup på data.db innan större importer om du är osäker.

## 10) Perplexity-uppdatering (snabbflöde)
Kör i ordning:

npm install
npm run check
npm run build

Vid schemaändring:

npm run db:push

Publicera:

git add .
git commit -m "Release: Perplexity update"
git push origin main

Detaljerad guide finns i filen:
PERPLEXITY-UPPDATERING.md
