// Events: parts of the app announce things, and listeners react.
// Here we use them to keep simple activity logs (for the admin to read later).
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

const events = new EventEmitter();

const logFolder = path.join(__dirname, '..', 'logs');
fs.mkdirSync(logFolder, { recursive: true });

function writeLog(fileName, line) {
  const file = path.join(logFolder, fileName);
  fs.appendFile(file, `${new Date().toISOString()} ${line}\n`, (err) => {
    if (err) console.error('Could not write log:', err.message);
  });
}

// A review was posted
events.on('review:added', (review) => {
  writeLog('activity.log', `review shop=${review.shop_id} rating=${review.rating}`);
});

// A search found nothing. The admin can use this to add new synonyms.
events.on('search:empty', (query) => {
  writeLog('zero-results.log', `query="${query}"`);
});

module.exports = events;
