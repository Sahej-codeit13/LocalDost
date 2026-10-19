# Local Dost  (Sahi bazaar. Sahi dukaan.)

Search a product, see which **markets** sell it, see which **shops** inside the market, open a shop page with products, freshness labels and reviews.

Plain HTML, CSS and JavaScript on the front. Node.js and Express on the back. SQL in the database. No frameworks, no Prisma.

## Run it

```bash
npm install
npm run seed      # creates the database with sample data (run again any time to reset)
npm start         # open http://localhost:3000
```

Other commands:

```bash
npm run add-shop          # add a shop by answering questions in the terminal
node server.js 4000       # run on another port
node src/seed.js my.json  # load your own data file instead of data/seed.json
```

## What is where

```
server.js               starts the server (http module)
src/app.js              Express app: middleware + routes
src/db.js               the database connection (the only file that knows about SQLite)
src/schema.sql          all tables
src/seed.js             loads data/seed.json into the tables
src/events.js           EventEmitter: writes logs/activity.log and logs/zero-results.log
src/routes/             URL -> controller            (Express Router)
src/controllers/        read the request, call a service, send JSON   (no SQL)
src/services/           the real work and all SQL
src/middleware/         logger, review validation, error handler
src/utils/              small helpers
scripts/add-shop.js     terminal tool (readline)
data/seed.json          sample cities, markets, shops
public/                 the website: 5 pages, css/style.css, js/*.js
```

A request travels: **route -> (middleware) -> controller -> service -> database**.

## Where each syllabus topic is used

| Topic | Where |
| --- | --- |
| JS, Intro to Node.js, Module system | `require` / `module.exports` in every file |
| Process module, `process.argv` | `server.js` (port), `src/seed.js` (data file) |
| Path module, `path.join` | `src/db.js`, `src/app.js`, `src/seed.js`, `src/events.js` |
| Event module, `emit` / `on` | `src/events.js`, `src/services/review.service.js`, `src/services/search.service.js` |
| Readline module | `scripts/add-shop.js` |
| FS module (read / write / append) | read: `src/seed.js` - append: `src/events.js` |
| HTTP module | `server.js` (`http.createServer(app)`) |
| Express routing, REST | `src/routes/*.js` (GET and POST, `:id` params, query strings) |
| Express middleware | `src/middleware/*.js`, `express.json()` |
| Express Router | every file in `src/routes/` |
| Express static file serve | `src/app.js` (`express.static`) |
| MVC: services / controllers / middleware / routes | the four folders under `src/` |
| DBMS design | `src/schema.sql`: keys, CHECK rules, junction tables, unique index |
| SQL joins, grouping, subqueries, conditional logic | `city.service.js`, `search.service.js`, `shop.service.js` (`CASE`) |
| SQL set operations | `search.service.js`, `suggest()` uses `UNION` |

## From the PRD, what is built and what is next

Built: city, market and shop pages with breadcrumbs. Search that is markets first, with Hinglish and Hindi words (the `synonyms` table), city and "saste" (budget) detection, and shop-number search inside a market. Filters and sort. Freshness, source and verification labels. Reviews and ratings. English and Hindi toggle. Text size buttons. Large text and 48px+ tap targets. Google Maps link.

Not built yet, in the PRD's own build order:

1. Login and roles (a review only needs a name for now), then moderation of reviews.
2. Admin panel (use `npm run add-shop` and edit `data/seed.json` for now).
3. Photo upload, Report button, saved shops, profile.
4. Availability YES / NO / NOT SURE, add-a-shop by users, shop claims.
5. Typo tolerance. PostgreSQL has `pg_trgm`; here, add the misspelling to the `synonyms` list. `logs/zero-results.log` shows what people searched and did not find.

## Important notes

- **The data is demo data.** Shop numbers, prices, ratings and map coordinates are examples. The PRD says never to show unverified shop numbers as facts, so the site shows a banner. Replace `data/seed.json` with real field-survey data.
- **SQLite instead of PostgreSQL** keeps setup to zero. The SQL is standard. To move to PostgreSQL, swap the driver in `src/db.js` and change `?` to `$1, $2...`, `INTEGER PRIMARY KEY` to `SERIAL`, and `ROUND(AVG(...), 1)` to `ROUND(AVG(...)::numeric, 1)`.
- Text from the database is always passed through `esc()` before it goes into the page, so a review cannot inject HTML.
