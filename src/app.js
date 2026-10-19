const express = require('express');
const path = require('path');
const logger = require('./middleware/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(express.json());                                              // read JSON bodies
app.use(express.static(path.join(__dirname, '..', 'public')));        // serve the website files
app.use(logger);

app.use('/api/cities', require('./routes/cities.routes'));
app.use('/api/markets', require('./routes/markets.routes'));
app.use('/api/shops', require('./routes/shops.routes'));
app.use('/api/search', require('./routes/search.routes'));
app.get('/api/health', (req, res) => res.json({ data: 'ok' }));

app.use('/api', notFound);
app.use(errorHandler);

module.exports = app;
