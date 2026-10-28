// One shared database connection. Every service imports this file.
// To move to PostgreSQL later, this is the file (and the SQL dialect) to change.
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataFolder = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataFolder, { recursive: true });

const db = new Database(path.join(dataFolder, 'localdost.db'));
db.pragma('foreign_keys = ON');

module.exports = db;
