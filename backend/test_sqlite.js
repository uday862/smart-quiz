const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

db.all("print table", (err, rows) => {
    console.log("ERR:", err ? err.message : null);
    console.log("ROWS:", rows);
});
