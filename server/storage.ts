import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc, asc } from "drizzle-orm";
import {
  golfare, banor, rundor, tavlingar, tavlingsresultat, reportage,
  type Golfare, type InsertGolfare,
  type Bana, type InsertBana,
  type Runda, type InsertRunda,
  type Tavling, type InsertTavling,
  type Tavlingsresultat, type InsertTavlingsresultat,
  type Reportage, type InsertReportage,
} from "@shared/schema";

const sqlite = new Database("data.db");
export const db = drizzle(sqlite);

// Skapa tabeller
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS golfare (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    namn TEXT NOT NULL,
    klubb TEXT,
    standard_handicap REAL NOT NULL DEFAULT 36,
    hickory_handicap REAL NOT NULL DEFAULT 50,
    aktiv INTEGER NOT NULL DEFAULT 1,
    stamspelare INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS banor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    namn TEXT NOT NULL,
    ort TEXT,
    par INTEGER NOT NULL DEFAULT 72,
    slope INTEGER NOT NULL DEFAULT 113,
    kursrating REAL NOT NULL DEFAULT 72.0,
    langd INTEGER,
    par_per_hal TEXT
  );
  CREATE TABLE IF NOT EXISTS rundor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    golfare_id INTEGER NOT NULL,
    bana_id INTEGER NOT NULL,
    datum TEXT NOT NULL,
    bruttoscore INTEGER NOT NULL,
    nettoscore REAL,
    hickory_handicap_vid REAL NOT NULL,
    hal_for_hal TEXT,
    ar_tavling INTEGER NOT NULL DEFAULT 0,
    tavling_id INTEGER,
    noteringar TEXT,
    FOREIGN KEY (golfare_id) REFERENCES golfare(id),
    FOREIGN KEY (bana_id) REFERENCES banor(id)
  );
  CREATE TABLE IF NOT EXISTS tavlingar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    namn TEXT NOT NULL,
    bana_id INTEGER,
    datum TEXT NOT NULL,
    beskrivning TEXT,
    ar_order_of_merit INTEGER NOT NULL DEFAULT 0,
    avslutad INTEGER NOT NULL DEFAULT 0,
    par_override TEXT,
    FOREIGN KEY (bana_id) REFERENCES banor(id)
  );
  CREATE TABLE IF NOT EXISTS tavlingsresultat (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tavling_id INTEGER NOT NULL,
    golfare_id INTEGER NOT NULL,
    bruttoscore INTEGER NOT NULL,
    nettoscore REAL,
    hickory_handicap_vid REAL NOT NULL,
    placering INTEGER,
    order_of_merit_poang INTEGER,
    brutto_placering INTEGER,
    brutto_om_poang INTEGER,
    FOREIGN KEY (tavling_id) REFERENCES tavlingar(id),
    FOREIGN KEY (golfare_id) REFERENCES golfare(id)
  );
  CREATE TABLE IF NOT EXISTS reportage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rubrik TEXT NOT NULL,
    datum TEXT NOT NULL,
    ingress TEXT,
    innehall TEXT NOT NULL,
    bild_url TEXT,
    tavling_id INTEGER,
    publicerad INTEGER NOT NULL DEFAULT 1
  );
`);

// Migration: lägg till kolumner som kan saknas i äldre sandbox-instanser
try { sqlite.exec("ALTER TABLE golfare ADD COLUMN stamspelare INTEGER NOT NULL DEFAULT 0"); } catch(e) {}
try { sqlite.exec("ALTER TABLE banor ADD COLUMN par_per_hal TEXT"); } catch(e) {}
try { sqlite.exec("ALTER TABLE tavlingar ADD COLUMN par_override TEXT"); } catch(e) {}
try { sqlite.exec("ALTER TABLE tavlingsresultat ADD COLUMN brutto_placering INTEGER"); } catch(e) {}
try { sqlite.exec("ALTER TABLE tavlingsresultat ADD COLUMN brutto_om_poang INTEGER"); } catch(e) {}

// Seed-data hanteras av server/seed.ts så att den fulla databasen kan fyllas på
// utan att en liten testseed blockerar större dataset i startläget.

export interface IStorage {
  // Golfare
  getAllGolfare(): Golfare[];
  getAllGolfareInklusiveInaktiva(): Golfare[];
  getGolfareById(id: number): Golfare | undefined;
  createGolfare(data: InsertGolfare): Golfare;
  updateBanaPar(id: number, parPerHal: number[]): Bana | undefined;
  updateTavlingPar(id: number, parOverride: number[] | null): Tavling | undefined;
  setStamspelare(id: number, stamspelare: boolean): Golfare | undefined;
  updateGolfareHandicap(id: number, hickoryHandicap: number): Golfare | undefined;

  // Banor
  getAllBanor(): Bana[];
  getBanaById(id: number): Bana | undefined;
  createBana(data: InsertBana): Bana;

  // Rundor
  getRundorByGolfare(golfareId: number): Runda[];
  getAllRundor(): Runda[];
  createRunda(data: InsertRunda): Runda;

  // Tävlingar
  getAllTavlingar(): Tavling[];
  getTavlingById(id: number): Tavling | undefined;
  createTavling(data: InsertTavling): Tavling;
  updateTavling(id: number, data: Partial<InsertTavling>): Tavling | undefined;

  // Tävlingsresultat
  getResultatByTavling(tavlingId: number): Tavlingsresultat[];
  getResultatByGolfare(golfareId: number): { tavling: Tavling; resultat: Tavlingsresultat }[];
  getOomHistorik(golfareId: number): { tavling: Tavling; nettoRang: number; bruttoRang: number; nettoPoangAck: number; bruttoPoangAck: number }[];
  createResultat(data: InsertTavlingsresultat): Tavlingsresultat;
  bulkSaveResultat(tavlingId: number, resultat: any[]): Tavlingsresultat[];

  // Reportage
  getAllReportage(): Reportage[];
  getReportageById(id: number): Reportage | undefined;
  createReportage(data: InsertReportage): Reportage;

  // Order of Merit
  getOrderOfMerit(): { golfare: Golfare; nettoPoang: number; bruttoPoang: number; antalTavlingar: number }[];
}

export const storage: IStorage = {
  getAllGolfare: () => db.select().from(golfare).where(eq(golfare.aktiv, true)).all(),
  getAllGolfareInklusiveInaktiva: () => db.select().from(golfare).all(),
  getGolfareById: (id) => db.select().from(golfare).where(eq(golfare.id, id)).get(),
  createGolfare: (data) => db.insert(golfare).values(data).returning().get(),
  updateBanaPar: (id, parPerHal) =>
    db.update(banor).set({ parPerHal: JSON.stringify(parPerHal) }).where(eq(banor.id, id)).returning().get(),

  updateTavlingPar: (id, parOverride) =>
    db.update(tavlingar).set({ parOverride: parOverride ? JSON.stringify(parOverride) : null }).where(eq(tavlingar.id, id)).returning().get(),

  setStamspelare: (id, stamspelare) =>
    db.update(golfare).set({ stamspelare }).where(eq(golfare.id, id)).returning().get(),

  updateGolfareHandicap: (id, hickoryHandicap) =>
    db.update(golfare).set({ hickoryHandicap }).where(eq(golfare.id, id)).returning().get(),

  getAllBanor: () => db.select().from(banor).all(),
  getBanaById: (id) => db.select().from(banor).where(eq(banor.id, id)).get(),
  createBana: (data) => db.insert(banor).values(data).returning().get(),

  getRundorByGolfare: (golfareId) =>
    db.select().from(rundor).where(eq(rundor.golfareId, golfareId)).orderBy(desc(rundor.datum)).all(),
  getAllRundor: () => db.select().from(rundor).orderBy(desc(rundor.datum)).all(),
  createRunda: (data) => {
    const bana = db.select().from(banor).where(eq(banor.id, data.banaId)).get();
    const nettoscore = bana ? data.bruttoscore - Math.round(data.hickoryHandicapVid * (bana.slope / 113)) : null;
    return db.insert(rundor).values({ ...data, nettoscore }).returning().get();
  },

  getAllTavlingar: () => db.select().from(tavlingar).orderBy(desc(tavlingar.datum)).all(),
  getTavlingById: (id) => db.select().from(tavlingar).where(eq(tavlingar.id, id)).get(),
  createTavling: (data) => db.insert(tavlingar).values(data).returning().get(),
  updateTavling: (id, data) => db.update(tavlingar).set(data).where(eq(tavlingar.id, id)).returning().get(),

  getResultatByTavling: (tavlingId) =>
    db.select().from(tavlingsresultat).where(eq(tavlingsresultat.tavlingId, tavlingId)).all(),

  getResultatByGolfare: (golfareId) => {
    const res = db.select().from(tavlingsresultat).where(eq(tavlingsresultat.golfareId, golfareId)).all();
    return res
      .map(r => {
        const tav = db.select().from(tavlingar).where(eq(tavlingar.id, r.tavlingId)).get();
        return tav ? { tavling: tav, resultat: r } : null;
      })
      .filter((r): r is { tavling: Tavling; resultat: Tavlingsresultat } => r !== null)
      .sort((a, b) => b.tavling.datum.localeCompare(a.tavling.datum));
  },
  getOomHistorik: (golfareId) => {
    // Hämta alla OoM-tävlingar i kronologisk ordning
    const oomTav = db.select().from(tavlingar)
      .where(eq(tavlingar.arOrderOfMerit, true)).all()
      .filter(t => t.avslutad)
      .sort((a, b) => a.datum.localeCompare(b.datum));

    // Hämta spelarens OoM-resultat
    const spelarRes = db.select().from(tavlingsresultat)
      .where(eq(tavlingsresultat.golfareId, golfareId)).all();
    const spelarTavIds = new Set(spelarRes.map(r => r.tavlingId));

    const resultat: { tavling: Tavling; nettoRang: number; bruttoRang: number; nettoPoangAck: number; bruttoPoangAck: number }[] = [];

    // Ackumulerade poäng per spelare upp till och med varje tävling
    const alleSpelareIds = [...new Set(
      db.select().from(tavlingsresultat).all().map(r => r.golfareId)
    )];

    for (let i = 0; i < oomTav.length; i++) {
      const tav = oomTav[i];
      if (!spelarTavIds.has(tav.id)) continue; // spelaren deltog ej

      const tavTomOch = oomTav.slice(0, i + 1).map(t => t.id);

      // Beräkna ackumulerade OoM-poäng för alla spelare
      const poangPerSpelare = new Map<number, { netto: number; brutto: number }>();
      for (const sid of alleSpelareIds) {
        const res = db.select().from(tavlingsresultat)
          .where(eq(tavlingsresultat.golfareId, sid)).all()
          .filter(r => tavTomOch.includes(r.tavlingId));
        const netto = res.reduce((s, r) => s + (r.orderOfMeritPoang ?? 0), 0);
        const brutto = res.reduce((s, r) => s + (r.bruttoOmPoang ?? 0), 0);
        if (netto > 0 || brutto > 0) poangPerSpelare.set(sid, { netto, brutto });
      }

      // Räkna ut rang
      const nettoSorterad = [...poangPerSpelare.entries()].sort((a, b) => b[1].netto - a[1].netto);
      const bruttoSorterad = [...poangPerSpelare.entries()].sort((a, b) => b[1].brutto - a[1].brutto);
      const nettoRang = nettoSorterad.findIndex(([id]) => id === golfareId) + 1;
      const bruttoRang = bruttoSorterad.findIndex(([id]) => id === golfareId) + 1;
      const spelarPoang = poangPerSpelare.get(golfareId) ?? { netto: 0, brutto: 0 };

      resultat.push({
        tavling: tav,
        nettoRang,
        bruttoRang,
        nettoPoangAck: spelarPoang.netto,
        bruttoPoangAck: spelarPoang.brutto,
      });
    }
    return resultat;
  },

  createResultat: (data) => {
    const bana = data.nettoscore ? null : db.select().from(banor)
      .where(eq(banor.id, db.select().from(tavlingar).where(eq(tavlingar.id, data.tavlingId)).get()?.banaId ?? 0)).get();
    const nettoscore = data.nettoscore ?? (bana ? data.bruttoscore - Math.round(data.hickoryHandicapVid * (bana.slope / 113)) : null);
    return db.insert(tavlingsresultat).values({ ...data, nettoscore }).returning().get();
  },

  bulkSaveResultat: (tavlingId, resultat) => {
    // Delete existing results for this tävling
    db.delete(tavlingsresultat).where(eq(tavlingsresultat.tavlingId, tavlingId)).run();
    // Delete existing rundor for this tävling
    db.delete(rundor).where(eq(rundor.tavlingId, tavlingId)).run();
    // Insert new results
    const saved: Tavlingsresultat[] = [];
    const tav = db.select().from(tavlingar).where(eq(tavlingar.id, tavlingId)).get();
    for (const r of resultat) {
      const row = db.insert(tavlingsresultat).values({
        tavlingId,
        golfareId: r.golfareId,
        bruttoscore: r.bruttoscore,
        nettoscore: r.nettoscore,
        hickoryHandicapVid: r.hickoryHandicapVid,
        placering: r.placering,
        orderOfMeritPoang: r.orderOfMeritPoang,
        bruttoPlacering: r.bruttoPlacering,
        bruttoOmPoang: r.bruttoOmPoang,
      }).returning().get();
      saved.push(row);
      // Insert as runda
      if (tav) {
        db.insert(rundor).values({
          golfareId: r.golfareId,
          banaId: tav.banaId ?? null,
          datum: tav.datum,
          bruttoscore: r.bruttoscore,
          nettoscore: r.nettoscore,
          hickoryHandicapVid: r.hickoryHandicapVid,
          arTavling: true,
          tavlingId,
        }).run();
      }
    }
    return saved;
  },

  getAllReportage: () => db.select().from(reportage).where(eq(reportage.publicerad, true)).orderBy(desc(reportage.datum)).all(),
  getReportageById: (id) => db.select().from(reportage).where(eq(reportage.id, id)).get(),
  createReportage: (data) => db.insert(reportage).values(data).returning().get(),

  getOrderOfMerit: () => {
    // Alla golfare som har minst ett tävlingsresultat
    const allGolfare = db.select().from(golfare).all();
    const oomTavlingar = db.select().from(tavlingar).where(eq(tavlingar.arOrderOfMerit, true)).all();
    const tavlingIds = oomTavlingar.map(t => t.id);

    return allGolfare
      .map(g => {
        const resultat = db.select().from(tavlingsresultat)
          .where(eq(tavlingsresultat.golfareId, g.id)).all()
          .filter(r => tavlingIds.includes(r.tavlingId));
        const nettoPoang = resultat.reduce((sum, r) => sum + (r.orderOfMeritPoang ?? 0), 0);
        const bruttoPoang = resultat.reduce((sum, r) => sum + (r.bruttoOmPoang ?? 0), 0);
        return { golfare: g, nettoPoang, bruttoPoang, antalTavlingar: resultat.length };
      })
      .filter(r => r.antalTavlingar > 0) // visa bara de som spelat
      .sort((a, b) => b.nettoPoang - a.nettoPoang);
  },
};
