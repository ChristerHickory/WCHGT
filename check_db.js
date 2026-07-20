const Database = require('better-sqlite3');
const db = new Database('golf.db');

const count = db.prepare('SELECT COUNT(*) as cnt FROM tavlingsresultat').get();
console.log('Antal tavlingsresultat-rader:', count.cnt);

const golfare = db.prepare('SELECT id, namn FROM golfare LIMIT 15').all();
console.log('Golfare:', JSON.stringify(golfare, null, 2));

const resultat = db.prepare('SELECT * FROM tavlingsresultat LIMIT 5').all();
console.log('Exempel resultat:', JSON.stringify(resultat, null, 2));

const magnus = db.prepare("SELECT * FROM golfare WHERE namn LIKE '%Sv%' OR namn LIKE '%Magnus%'").all();
console.log('Matchande spelare:', JSON.stringify(magnus, null, 2));
