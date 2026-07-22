import Database from "better-sqlite3";
import XLSX from "xlsx";

const TOURNAMENT_ID = 9;
const COURSE_ID = 9;
const FILE_PATH = "Data/Mark 2026.xlsx";

const AMBIGUOUS_PREFERENCES = {
  "christer bergstrom": 1,
  "klas johansson": 3,
};

function normalizeName(input) {
  return String(input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/,/g, " ")
    .replace(/[^a-zA-Z\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function displayName(input) {
  return String(input || "").replace(/\s+/g, " ").trim();
}

function variants(name) {
  const n = normalizeName(name);
  const out = new Set([n]);
  const parts = n.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0];
    const last = parts[parts.length - 1];
    out.add(`${first} ${last}`);
    out.add(`${last} ${first}`);
  }
  return [...out];
}

function pointsForPlace(place) {
  if (!Number.isFinite(place) || place <= 0) return 0;
  if (place === 1) return 33;
  if (place === 2) return 31;
  if (place === 3) return 29;
  if (place === 4) return 28;
  if (place === 5) return 27;
  if (place === 6) return 26;
  if (place === 7) return 25;
  if (place === 8) return 24;
  if (place === 9) return 23;
  if (place === 10) return 22;
  if (place === 11) return 21;
  if (place === 12) return 20;
  if (place === 13) return 19;
  if (place === 14) return 18;
  if (place === 15) return 17;
  if (place === 16) return 16;
  if (place === 17) return 15;
  if (place === 18) return 14;
  if (place === 19) return 13;
  if (place === 20) return 12;
  if (place === 21) return 11;
  if (place === 22) return 10;
  if (place === 23) return 9;
  if (place === 24) return 8;
  if (place === 25) return 7;
  if (place === 26) return 6;
  if (place === 27) return 5;
  if (place === 28) return 4;
  if (place === 29) return 3;
  if (place === 30) return 2;
  return 1;
}

const wb = XLSX.readFile(FILE_PATH);
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { defval: null });

const bruttoRows = [];
const nettoRows = [];
for (const r of rows) {
  if (r.Namn && r.Resultat) {
    bruttoRows.push({
      place: Number(r.Plats),
      name: displayName(r.Namn),
      club: r.Klubbnamn ? String(r.Klubbnamn).trim() : "",
      brutto: Number(r.Resultat),
    });
  }
  if (r.Namn_1 && r.Resultat_1 && r["Netto "] != null) {
    nettoRows.push({
      place: nettoRows.length + 1,
      name: displayName(r.Namn_1),
      club: r.Klubbnamn_1 ? String(r.Klubbnamn_1).trim() : "",
      brutto: Number(r.Resultat_1),
      netto: Number(r["Netto "]),
      hhcp: r.HHCP_1 == null ? null : Number(r.HHCP_1),
    });
  }
}

if (bruttoRows.length === 0 || nettoRows.length === 0) {
  throw new Error("Kunde inte läsa brutto/netto-rader från Excel.");
}

const bruttoByName = new Map(bruttoRows.map((r) => [normalizeName(r.name), r]));
const nettoByName = new Map(nettoRows.map((r) => [normalizeName(r.name), r]));

const allNames = new Set([...bruttoByName.keys(), ...nettoByName.keys()]);
if (allNames.size !== bruttoRows.length || allNames.size !== nettoRows.length) {
  throw new Error("Antalet unika namn i brutto/netto matchar inte. Kontrollera filen.");
}

const db = new Database("data.db");

const tournament = db
  .prepare("SELECT id, namn, datum, bana_id FROM tavlingar WHERE id = ?")
  .get(TOURNAMENT_ID);
if (!tournament) {
  throw new Error(`Tävling ${TOURNAMENT_ID} hittades inte.`);
}

const course = db.prepare("SELECT id, namn FROM banor WHERE id = ?").get(COURSE_ID);
if (!course) {
  throw new Error(`Bana ${COURSE_ID} hittades inte.`);
}

const players = db.prepare("SELECT id, namn, klubb FROM golfare").all();
const byVariant = new Map();
for (const p of players) {
  for (const v of variants(p.namn)) {
    if (!byVariant.has(v)) byVariant.set(v, []);
    byVariant.get(v).push(p);
  }
}

function resolvePlayerId(name) {
  const key = normalizeName(name);
  const hits = [];
  for (const v of variants(name)) {
    const arr = byVariant.get(v);
    if (arr) hits.push(...arr);
  }
  const unique = Array.from(new Map(hits.map((p) => [p.id, p])).values());

  if (unique.length === 1) return unique[0].id;
  if (unique.length > 1) {
    const preferred = AMBIGUOUS_PREFERENCES[key];
    if (preferred && unique.some((p) => p.id === preferred)) return preferred;
    throw new Error(
      `Tvetydig namnmatch för '${name}': ${unique
        .map((p) => `${p.id}:${p.namn}`)
        .join(", ")}`
    );
  }
  return null;
}

function createPlayer(name, club, hhcp) {
  const stdHcp = Number.isFinite(hhcp) ? Math.round((hhcp / 1.4) * 10) / 10 : 36;
  const row = db
    .prepare(
      `INSERT INTO golfare (namn, klubb, standard_handicap, hickory_handicap, aktiv, stamspelare)
       VALUES (?, ?, ?, ?, 0, 0)
       RETURNING id, namn`
    )
    .get(name, club || "", stdHcp, Number.isFinite(hhcp) ? hhcp : stdHcp * 1.4);
  for (const v of variants(name)) {
    if (!byVariant.has(v)) byVariant.set(v, []);
    byVariant.get(v).push({ id: row.id, namn: row.namn, klubb: club || "" });
  }
  return row.id;
}

const assembled = [];
for (const key of allNames) {
  const b = bruttoByName.get(key);
  const n = nettoByName.get(key);
  if (!b || !n) {
    throw new Error(`Spelare saknas i en av listorna: ${key}`);
  }

  let golfareId = resolvePlayerId(n.name);
  if (!golfareId) {
    golfareId = createPlayer(n.name, n.club || b.club, n.hhcp);
    console.log(`Skapade ny spelare: ${n.name} -> id ${golfareId}`);
  }

  assembled.push({
    golfareId,
    name: n.name,
    bruttoscore: b.brutto,
    nettoscore: n.netto,
    hickoryHandicapVid: Number.isFinite(n.hhcp) ? n.hhcp : 36,
    placering: n.place,
    orderOfMeritPoang: pointsForPlace(n.place),
    bruttoPlacering: b.place,
    bruttoOmPoang: pointsForPlace(b.place),
  });
}

assembled.sort((a, b) => a.placering - b.placering);

const tx = db.transaction(() => {
  db.prepare("UPDATE tavlingar SET bana_id = ? WHERE id = ?").run(COURSE_ID, TOURNAMENT_ID);
  db.prepare("DELETE FROM tavlingsresultat WHERE tavling_id = ?").run(TOURNAMENT_ID);
  db.prepare("DELETE FROM rundor WHERE tavling_id = ?").run(TOURNAMENT_ID);

  const insRes = db.prepare(
    `INSERT INTO tavlingsresultat (
      tavling_id, golfare_id, bruttoscore, nettoscore, hickory_handicap_vid,
      placering, order_of_merit_poang, brutto_placering, brutto_om_poang
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const insRunda = db.prepare(
    `INSERT INTO rundor (
      golfare_id, bana_id, datum, bruttoscore, nettoscore, hickory_handicap_vid,
      ar_tavling, tavling_id
    ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)`
  );

  for (const r of assembled) {
    insRes.run(
      TOURNAMENT_ID,
      r.golfareId,
      r.bruttoscore,
      r.nettoscore,
      r.hickoryHandicapVid,
      r.placering,
      r.orderOfMeritPoang,
      r.bruttoPlacering,
      r.bruttoOmPoang
    );

    insRunda.run(
      r.golfareId,
      COURSE_ID,
      tournament.datum,
      r.bruttoscore,
      r.nettoscore,
      r.hickoryHandicapVid,
      TOURNAMENT_ID
    );
  }
});

tx();

const countRes = db
  .prepare("SELECT COUNT(*) AS c FROM tavlingsresultat WHERE tavling_id = ?")
  .get(TOURNAMENT_ID).c;
const countRnd = db
  .prepare("SELECT COUNT(*) AS c FROM rundor WHERE tavling_id = ?")
  .get(TOURNAMENT_ID).c;

console.log(`Import klar för tävling ${TOURNAMENT_ID} (${tournament.namn})`);
console.log(`Införda resultat: ${countRes}`);
console.log(`Införda rundor: ${countRnd}`);

const top3Netto = db.prepare(
  `SELECT tr.placering, g.namn, tr.nettoscore, tr.bruttoscore
   FROM tavlingsresultat tr
   JOIN golfare g ON g.id = tr.golfare_id
   WHERE tr.tavling_id = ?
   ORDER BY tr.placering ASC
   LIMIT 3`
).all(TOURNAMENT_ID);

const top3Brutto = db.prepare(
  `SELECT tr.brutto_placering AS placering, g.namn, tr.bruttoscore
   FROM tavlingsresultat tr
   JOIN golfare g ON g.id = tr.golfare_id
   WHERE tr.tavling_id = ?
   ORDER BY tr.brutto_placering ASC
   LIMIT 3`
).all(TOURNAMENT_ID);

console.log("Top 3 netto:", top3Netto);
console.log("Top 3 brutto:", top3Brutto);
