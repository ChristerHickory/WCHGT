const fs = require('fs');
const Database = require('better-sqlite3');
const { PDFParse } = require('pdf-parse');

const BRUTTO_PDF = 'Data/Öjiared/Öijared 20260729 brutto.pdf';
const NETTO_PDF = 'Data/Öjiared/Öijared 20260729 netto.pdf';

const AMBIGUOUS_PREFERENCES = {
  'christer bergstrom': 1,
  'klas johansson': 3,
};

function normalizeName(input) {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/,/g, ' ')
    .replace(/[^a-zA-Z\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function variants(name) {
  const n = normalizeName(name);
  const out = new Set([n]);
  const parts = n.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0];
    const last = parts[parts.length - 1];
    out.add(`${first} ${last}`);
    out.add(`${last} ${first}`);
  }
  return [...out];
}

function parseDecimal(token) {
  return Number(String(token).replace('−', '-').replace(',', '.'));
}

function oomPoang(plats, antalDeltagare) {
  let bonus = 0;
  if (plats === 1) bonus = 3;
  else if (plats === 2) bonus = 2;
  else if (plats === 3) bonus = 1;
  return Math.max(1, antalDeltagare - plats + bonus);
}

async function readPdfText(filePath) {
  const parser = new PDFParse({ data: fs.readFileSync(filePath) });
  const parsed = await parser.getText();
  await parser.destroy();
  return parsed.text || '';
}

function extractRows(text, sourceLabel) {
  const rows = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const rowRegex = /^(.*\D)\s+([−-]?\d+(?:,\d+)?)\s+([−-]?\d+(?:,\d+)?)\s+([−-]?\d+(?:,\d+)?)\s+([−-]?\d+(?:,\d+)?)\s+(\d+)\s+(\d+)$/;

  for (const line of lines) {
    if (line.includes('Hickory Öijared')) continue;
    if (line.startsWith('--')) continue;

    const m = line.match(rowRegex);
    if (!m) continue;

    const name = m[1].replace(/\s+/g, ' ').trim();
    const hhcp = parseDecimal(m[5]);
    const brutto = Number(m[6]);
    const netto = Number(m[7]);

    rows.push({
      source: sourceLabel,
      name,
      key: normalizeName(name),
      hhcp,
      brutto,
      netto,
    });
  }

  return rows;
}

function resolvePlayerId(name, byVariant) {
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
        .join(', ')}`
    );
  }
  return null;
}

function createPlayer(db, byVariant, name, hhcp) {
  const safeHhcp = Number.isFinite(hhcp) ? hhcp : 36;
  const standardHcp = Math.round((safeHhcp / 1.4) * 10) / 10;

  const row = db
    .prepare(
      `INSERT INTO golfare (namn, klubb, standard_handicap, hickory_handicap, aktiv, stamspelare)
       VALUES (?, ?, ?, ?, 0, 0)
       RETURNING id, namn`
    )
    .get(name, '', standardHcp, safeHhcp);

  for (const v of variants(name)) {
    if (!byVariant.has(v)) byVariant.set(v, []);
    byVariant.get(v).push({ id: row.id, namn: row.namn, klubb: '' });
  }

  return row.id;
}

function pickTargetTournament(db) {
  const candidates = db
    .prepare(
      `SELECT id, namn, datum, bana_id, avslutad
       FROM tavlingar
       WHERE namn LIKE '%ijared%' OR namn LIKE '%Öijared%' OR namn LIKE '%Oijared%'
       ORDER BY id ASC`
    )
    .all();

  if (candidates.length === 0) {
    throw new Error('Ingen Öijared-tävling hittades i databasen.');
  }

  return candidates[0];
}

function pickOijaredCourseId(db, fallbackCourseId) {
  if (fallbackCourseId) return fallbackCourseId;

  const course = db
    .prepare(
      `SELECT id, namn, klubb, delbana
       FROM banor
       WHERE namn LIKE '%Öijared%' OR klubb LIKE '%Öijared%' OR namn LIKE '%Oijared%' OR klubb LIKE '%Oijared%'
       ORDER BY id ASC
       LIMIT 1`
    )
    .get();

  if (!course) {
    throw new Error('Kunde inte hitta någon Öijared-bana att koppla tävlingen till.');
  }

  return course.id;
}

async function main() {
  const db = new Database('data.db');

  const target = pickTargetTournament(db);
  const courseId = pickOijaredCourseId(db, target.bana_id);

  const bruttoText = await readPdfText(BRUTTO_PDF);
  const nettoText = await readPdfText(NETTO_PDF);

  const bruttoRows = extractRows(bruttoText, 'brutto');
  const nettoRows = extractRows(nettoText, 'netto');

  if (bruttoRows.length === 0 || nettoRows.length === 0) {
    throw new Error('Kunde inte extrahera brutto/netto-rader från PDF-filerna.');
  }

  const bruttoByKey = new Map();
  const nettoByKey = new Map();

  bruttoRows.forEach((row, i) => {
    bruttoByKey.set(row.key, { ...row, bruttoPlacering: i + 1 });
  });
  nettoRows.forEach((row, i) => {
    nettoByKey.set(row.key, { ...row, nettoPlacering: i + 1 });
  });

  const allKeys = new Set([...bruttoByKey.keys(), ...nettoByKey.keys()]);

  const players = db.prepare('SELECT id, namn, klubb FROM golfare').all();
  const byVariant = new Map();
  for (const p of players) {
    for (const v of variants(p.namn)) {
      if (!byVariant.has(v)) byVariant.set(v, []);
      byVariant.get(v).push(p);
    }
  }

  const assembled = [];
  const skipped = [];

  for (const key of allKeys) {
    const b = bruttoByKey.get(key);
    const n = nettoByKey.get(key);

    if (!b || !n) {
      throw new Error(`Saknas i en av listorna: ${key}`);
    }

    if (b.brutto <= 0 || n.netto <= 0) {
      skipped.push({ name: n.name || b.name, brutto: b.brutto, netto: n.netto });
      continue;
    }

    let golfareId = resolvePlayerId(n.name, byVariant);
    if (!golfareId) {
      golfareId = createPlayer(db, byVariant, n.name, n.hhcp);
      console.log(`Skapade ny spelare: ${n.name} -> id ${golfareId}`);
    }

    assembled.push({
      golfareId,
      namn: n.name,
      bruttoscore: b.brutto,
      nettoscore: n.netto,
      hickoryHandicapVid: Number.isFinite(n.hhcp) ? n.hhcp : 36,
      placering: n.nettoPlacering,
      bruttoPlacering: b.bruttoPlacering,
    });
  }

  assembled.sort((a, b) => a.placering - b.placering);

  const antal = assembled.length;
  const finalRows = assembled.map((r) => ({
    ...r,
    orderOfMeritPoang: oomPoang(r.placering, antal),
    bruttoOmPoang: oomPoang(r.bruttoPlacering, antal),
  }));

  console.log('Import target:', {
    id: target.id,
    namn: target.namn,
    datum: target.datum,
    currentAvslutad: target.avslutad,
    courseId,
  });
  console.log('Extracted:', { brutto: bruttoRows.length, netto: nettoRows.length, usable: finalRows.length, skipped });

  const tx = db.transaction(() => {
    db.prepare('UPDATE tavlingar SET bana_id = ?, avslutad = 1 WHERE id = ?').run(courseId, target.id);
    db.prepare('DELETE FROM tavlingsresultat WHERE tavling_id = ?').run(target.id);
    db.prepare('DELETE FROM rundor WHERE tavling_id = ?').run(target.id);

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

    for (const r of finalRows) {
      insRes.run(
        target.id,
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
        courseId,
        target.datum,
        r.bruttoscore,
        r.nettoscore,
        r.hickoryHandicapVid,
        target.id
      );
    }
  });

  tx();

  const countRes = db
    .prepare('SELECT COUNT(*) AS c FROM tavlingsresultat WHERE tavling_id = ?')
    .get(target.id).c;
  const countRnd = db
    .prepare('SELECT COUNT(*) AS c FROM rundor WHERE tavling_id = ?')
    .get(target.id).c;

  console.log(`Import klar för tävling ${target.id} (${target.namn})`);
  console.log(`Införda resultat: ${countRes}`);
  console.log(`Införda rundor: ${countRnd}`);

  const top3Netto = db.prepare(
    `SELECT tr.placering, g.namn, tr.nettoscore, tr.bruttoscore
     FROM tavlingsresultat tr
     JOIN golfare g ON g.id = tr.golfare_id
     WHERE tr.tavling_id = ?
     ORDER BY tr.placering ASC
     LIMIT 3`
  ).all(target.id);

  const top3Brutto = db.prepare(
    `SELECT tr.brutto_placering AS placering, g.namn, tr.bruttoscore
     FROM tavlingsresultat tr
     JOIN golfare g ON g.id = tr.golfare_id
     WHERE tr.tavling_id = ?
     ORDER BY tr.brutto_placering ASC
     LIMIT 3`
  ).all(target.id);

  console.log('Top 3 netto:', top3Netto);
  console.log('Top 3 brutto:', top3Brutto);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
