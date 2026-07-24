import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import {
  tavlingar,
  tavlingsresultat,
} from "@shared/schema";

const sqlite = new Database("data.db");
export const db = drizzle(sqlite);

function oomPoang(plats: number, antalDeltagare: number): number {
  // Bonus baserat på placering: 1:a +3, 2:a +2, 3:a +1, 4+ +0
  let bonus = 0;
  if (plats === 1) bonus = 3;
  else if (plats === 2) bonus = 2;
  else if (plats === 3) bonus = 1;

  const poang = antalDeltagare - plats + bonus;
  return Math.max(1, poang); // Minimum 1 poäng
}

async function fixOomScoring() {
  console.log("🔧 Fixar OoM-poängsystemet för alla tävlingar...\n");

  // Hämta alla slutförda OoM-tävlingar
  const oomTavlingar = db
    .select()
    .from(tavlingar)
    .where(eq(tavlingar.arOrderOfMerit, true))
    .all()
    .filter((t) => t.avslutad);

  console.log(`📋 Hittade ${oomTavlingar.length} slutförda OoM-tävlingar\n`);

  for (const tav of oomTavlingar) {
    // Hämta alla resultat för denna tävling
    const resultat = db
      .select()
      .from(tavlingsresultat)
      .where(eq(tavlingsresultat.tavlingId, tav.id))
      .all();

    if (resultat.length === 0) {
      console.log(`⏭️  ${tav.namn} (${tav.datum}): Inga resultat`);
      continue;
    }

    console.log(`🎯 ${tav.namn} (${tav.datum}): ${resultat.length} deltagare`);

    // Beräkna om alla poäng baserat på ny formel
    const updates: { id: number; netto: number; brutto: number }[] = [];

    for (const res of resultat) {
      const nettoPoang = oomPoang(res.placering ?? 99, resultat.length);
      const bruttoPoang = oomPoang(res.bruttoPlacering ?? 99, resultat.length);

      if (
        res.orderOfMeritPoang !== nettoPoang ||
        res.bruttoOmPoang !== bruttoPoang
      ) {
        updates.push({ id: res.id, netto: nettoPoang, brutto: bruttoPoang });
      }
    }

    if (updates.length === 0) {
      console.log(`   ✓ Redan korrekt\n`);
      continue;
    }

    console.log(
      `   Uppdaterar ${updates.length} resultat: `,
      updates
        .slice(0, 3)
        .map(
          (u) => `ID${u.id} (${u.netto}/${u.brutto})`
        )
        .join(", ") + (updates.length > 3 ? `, ... +${updates.length - 3} till` : "")
    );

    // Uppdatera varje resultat
    for (const update of updates) {
      db.update(tavlingsresultat)
        .set({
          orderOfMeritPoang: update.netto,
          bruttoOmPoang: update.brutto,
        })
        .where(eq(tavlingsresultat.id, update.id))
        .run();
    }

    console.log(`   ✓ Uppdaterat\n`);
  }

  console.log(
    "✅ Klart! OoM-poängsystemet har fixats för alla tävlingar.\n"
  );
  console.log("🔍 Kontrollera Order of Merit på startsidan för att verifiera.");
}

fixOomScoring().catch(console.error);
