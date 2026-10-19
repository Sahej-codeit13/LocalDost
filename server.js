const http = require('http');
const db = require('./src/db');
const app = require('./src/app');

// Friendly message if the database has not been created yet
try {
  db.prepare('SELECT COUNT(*) FROM cities').get();
} catch (err) {
  console.log('The database is empty. Run this first:  npm run seed');
  process.exit(1);
}

// Port: node server.js 4000   or   PORT=4000 npm start   (default 3000)
const port = process.argv[2] || process.env.PORT || 3000;

http.createServer(app).listen(port, () => {
  console.log(`Local Dost is running at http://localhost:${port}`);
});
