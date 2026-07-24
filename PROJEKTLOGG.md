# WCHGT Project Log

## Current Status
- Production redeploy verified on 2026-07-22.
- Live app at https://wchgt.pplx.app/#/ loads data correctly.
- Latest deployed commit: 0388c3e.

## Recent Completed
- Fixed production API base for pplx host routing.
- Pushed fix to GitHub main.
- Verified Order of Merit data renders after deploy.

## Next Up
- Keep this file updated after each meaningful change.
- Add one short dated entry per task session.
- Record deploy outcomes and follow-up actions.

## Rules
- If new tournament results are added (manual entry, import script, or API), the homepage must be updated accordingly.
- Verify that the first page reflects the latest competition outcome before commit/deploy.

## Entry Template
- Date:
- Goal:
- Changes:
- Verification:
- Result:
- Next step:

## Entries
- Date: 2026-07-22
- Goal: Importera saknade resultat för Mark Hickory (Marks GK) från Excel till databasen.
- Changes:
	- Installerade `xlsx` som dev dependency.
	- Skapade och körde `script/import-marks-2026.mjs` för att läsa `Data/Mark 2026.xlsx` och skriva resultat till Mark Hickory (WCS-tävling 5, internt tävlings-id 9).
	- Matchade spelare mot befintliga poster, valde primär-ID för dubbletter (Christer, Klas), och skapade två nya spelare:
		- Daniel Knutsson (`id=71`)
		- Patrick Sheerin (`id=72`)
	- Satt `tavlingar.bana_id=9` för Mark Hickory och synkade både `tavlingsresultat` och `rundor`.
- Verification:
	- Importskript rapporterade `22` införda resultat och `22` införda rundor för Mark Hickory.
	- Kontroll av toppresultat visade korrekt Top 3 netto och brutto från filen.
- Result: Marks GK-resultaten finns nu i appens databas och visas via befintliga vyer/API.
- Next step: Pusha ändringarna till GitHub och redeploya produktion så live-miljön uppdateras.
