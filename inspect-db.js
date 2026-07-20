import Database from 'better-sqlite3';
const db = new Database('data.db');
const tables = ['tavlingar','tavlingsresultat'];
for (const table of tables) {
  const row = db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get();
  console.log(table, row.count);
}
const tavlingar = db.prepare('SELECT id, namn, avslutad FROM tavlingar ORDER BY id').all();
console.log('tavlingar', tavlingar);
const resultat = db.prepare('SELECT id, tavling_id, golfare_id, placering FROM tavlingsresultat ORDER BY id LIMIT 10').all();
console.log('resultat sample', resultat);
