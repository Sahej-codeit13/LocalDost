-- Local Dost database. Run by "npm run seed" (it recreates everything).

DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS shop_products;
DROP TABLE IF EXISTS shop_categories;
DROP TABLE IF EXISTS shops;
DROP TABLE IF EXISTS synonyms;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS markets;
DROP TABLE IF EXISTS cities;

CREATE TABLE cities (
  id      INTEGER PRIMARY KEY,
  name    TEXT NOT NULL,
  slug    TEXT NOT NULL UNIQUE,
  state   TEXT NOT NULL,
  aliases TEXT                      -- comma separated: "dilli,new delhi"
);

CREATE TABLE markets (
  id              INTEGER PRIMARY KEY,
  city_id         INTEGER NOT NULL REFERENCES cities(id),
  name            TEXT NOT NULL,
  area            TEXT,
  description     TEXT,
  market_type     TEXT,
  numbering_notes TEXT,             -- how shop numbers work in this market
  latitude        REAL,
  longitude       REAL
);

CREATE TABLE categories (
  id      INTEGER PRIMARY KEY,
  name    TEXT NOT NULL UNIQUE,
  name_hi TEXT,
  icon    TEXT
);

-- Product TYPES (not individual items): "Football jersey"
CREATE TABLE products (
  id          INTEGER PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  name        TEXT NOT NULL UNIQUE
);

-- Other words people type: jarsi, kapde, joote ...
CREATE TABLE synonyms (
  term        TEXT NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  PRIMARY KEY (term, category_id)
);

CREATE TABLE shops (
  id                 INTEGER PRIMARY KEY,
  market_id          INTEGER NOT NULL REFERENCES markets(id),
  shop_number        TEXT,          -- text, because real numbers look like 27A or G-14
  block_area         TEXT,
  location_hint      TEXT,
  name               TEXT,
  price_tier         TEXT CHECK (price_tier IN ('budget', 'mid', 'premium')),
  status             TEXT NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'temporarily_closed', 'permanently_closed', 'moved', 'hidden')),
  verification_level TEXT NOT NULL DEFAULT 'unverified'
                     CHECK (verification_level IN ('unverified', 'community_confirmed', 'admin_verified', 'owner_verified')),
  source             TEXT NOT NULL DEFAULT 'admin',
  last_updated_at    TEXT NOT NULL,
  last_verified_at   TEXT,
  -- a shop needs at least one way to be identified
  CHECK (shop_number IS NOT NULL OR name IS NOT NULL OR location_hint IS NOT NULL)
);

-- Same number is allowed in different blocks, but not twice in the same block
CREATE UNIQUE INDEX uq_shop_number
  ON shops (market_id, COALESCE(block_area, ''), shop_number)
  WHERE shop_number IS NOT NULL;

CREATE INDEX idx_shops_market ON shops (market_id, status);

CREATE TABLE shop_categories (
  shop_id     INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  is_primary  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (shop_id, category_id)
);

-- Which product types a shop reports selling, with price range and freshness
CREATE TABLE shop_products (
  shop_id           INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_id        INTEGER NOT NULL REFERENCES products(id),
  price_min         INTEGER,
  price_max         INTEGER,
  last_confirmed_at TEXT NOT NULL,
  PRIMARY KEY (shop_id, product_id),
  CHECK (price_min <= price_max)
);

CREATE TABLE reviews (
  id            INTEGER PRIMARY KEY,
  shop_id       INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body          TEXT,
  status        TEXT NOT NULL DEFAULT 'published'
                CHECK (status IN ('pending', 'published', 'rejected', 'removed')),
  created_at    TEXT NOT NULL
);

CREATE INDEX idx_reviews_shop ON reviews (shop_id, status);
