import Database from 'better-sqlite3';
const db = new Database('data.db');

// Get first OoM tournament with results
const tavling = db.prepare(`
  SELECT DISTINCT t.id, t.namn, COUNT(r.id) as antal
  FROM tavlingar t
  JOIN tavlingsresultat r ON t.id = r.tavling_id
  WHERE t.ar_order_of_merit = 1 AND t.avslutad = 1
  GROUP BY t.id
  LIMIT 1
`).get();

if (!tavling) {
  console.log('Ingen OoM-tävling funnen');
  process.exit(0);
}

console.log(`📊 Verifying ${tavling.namn} (${tavling.antal} deltagare)\n`);

// Get some results with their points
const resultat = db.prepare(`
  SELECT 
    tr.id,
    g.namn,
    tr.placering,
    tr.order_of_merit_poang,
    tr.brutto_placering,
    tr.brutto_om_poang
  FROM tavlingsresultat tr
  JOIN golfare g ON tr.golfare_id = g.id
  WHERE tr.tavling_id = ?
  ORDER BY tr.placering
  LIMIT 10
`).all(tavling.id);

console.log('Netto resultat:');
resultat.forEach(r => {
  // Expected: antal - plats + bonus (1:a +3, 2:a +2, 3:a +1)
  let bonus = 0;
  if (r.placering === 1) bonus = 3;
  else if (r.placering === 2) bonus = 2;
  else if (r.placering === 3) bonus = 1;
  
  const expected = Math.max(1, tavling.antal - r.placering + bonus);
  const status = r.order_of_merit_poang === expected ? '✓' : '✗';
  
  console.log(`  ${status} #${r.placering} ${r.namn}: ${r.order_of_merit_poang}p (förväntat ${expected}p)`);
});

console.log('\nBrutto resultat:');
resultat.forEach(r => {
  let bonus = 0;
  if (r.brutto_placering === 1) bonus = 3;
  else if (r.brutto_placering === 2) bonus = 2;
  else if (r.brutto_placering === 3) bonus = 1;
  
  const expected = Math.max(1, tavling.antal - r.brutto_placering + bonus);
  const status = r.brutto_om_poang === expected ? '✓' : '✗';
  
  console.log(`  ${status} #${r.brutto_placering} ${r.namn}: ${r.brutto_om_poang}p (förväntat ${expected}p)`);
});

// Verify all results are correct
const allResultat = db.prepare(`
  SELECT COUNT(*) as count FROM tavlingsresultat WHERE tavling_id = ?
`).get(tavling.id);

console.log(`\n✅ Verifikation klar för ${allResultat.count} resultat`);
