# LocalDost Database Normalization

## 1. Introduction

LocalDost is a platform that helps users discover local markets, shops,
categories and products.

The database is designed to reduce data duplication, maintain consistency
and support efficient queries.

The database contains the following 9 tables:

1. cities
2. markets
3. categories
4. products
5. synonyms
6. shops
7. shop_categories
8. shop_products
9. reviews

## 2. First Normal Form (1NF)

A relation satisfies 1NF when:
- Every column contains atomic values.
- Each row can be uniquely identified.
- There are no repeating groups or multi-valued columns.

### Implementation

- Each table has a primary key or composite primary key.
- Shop categories and products are stored in separate junction tables.
- Product information is stored separately from shop information.
- Individual reviews are stored as separate rows.

### Important observation

The `cities.aliases` column stores comma-separated aliases.
This is a denormalized field and is not strictly 1NF.

A fully normalized alternative would be a separate `city_aliases` table
with one alias per row.

## 3. Second Normal Form (2NF)

A relation satisfies 2NF when:
- It is already in 1NF.
- Every non-key attribute depends on the entire candidate key.
- There are no partial dependencies on part of a composite key.

### Implementation

The junction tables use composite primary keys:

**shop_categories**
- Primary key: (shop_id, category_id)
- is_primary depends on the complete shop-category relationship.

**shop_products**
- Primary key: (shop_id, product_id)
- price_min, price_max and last_confirmed_at depend on the
  complete shop-product relationship.

**synonyms**
- Primary key: (term, category_id)
- Both columns identify a synonym-category association.

These designs avoid storing relationship-specific information
in unrelated tables.

## 4. Third Normal Form (3NF)

A relation satisfies 3NF when:
- It is already in 2NF.
- Non-key attributes do not depend transitively on other
  non-key attributes.

### Implementation

- City details are stored in the cities table.
- Market details are stored in the markets table.
- Category details are stored in the categories table.
- Product details are stored in the products table.
- Shop details are stored in the shops table.
- Review details are stored in the reviews table.

For example, markets stores city_id as a foreign key rather than
repeating city name and state in every market record.

Similarly, shops stores market_id instead of duplicating market
information.

This reduces redundant data and improves consistency.

## 5. Functional Dependencies

The main functional dependencies are:

| Table | Functional Dependency |
|---|---|
| cities | id -> name, slug, state, aliases |
| markets | id -> city_id, name, area, description, market_type, numbering_notes, latitude, longitude |
| categories | id -> name, name_hi, icon |
| products | id -> category_id, name |
| synonyms | (term, category_id) -> no additional attributes |
| shops | id -> market_id, shop_number, block_area, location_hint, name, price_tier, status, verification_level, source, last_updated_at, last_verified_at |
| shop_categories | (shop_id, category_id) -> is_primary |
| shop_products | (shop_id, product_id) -> price_min, price_max, last_confirmed_at |
| reviews | id -> shop_id, reviewer_name, rating, body, status, created_at |

Additional unique constraints:
- cities.slug is unique.
- categories.name is unique.
- products.name is unique.
- The shop number is unique within a market and block when provided.

## 6. Relationships and Referential Integrity

Foreign keys maintain relationships between tables:

- markets.city_id references cities.id
- products.category_id references categories.id
- synonyms.category_id references categories.id
- shops.market_id references markets.id
- shop_categories.shop_id references shops.id
- shop_categories.category_id references categories.id
- shop_products.shop_id references shops.id
- shop_products.product_id references products.id
- reviews.shop_id references shops.id

## 7. Conclusion

The LocalDost database separates entities and relationships into
independent tables to reduce redundancy and improve data consistency.

Its structure follows the principles of 2NF and 3NF for the
relational structures described above.

One exception is the comma-separated aliases field in cities,
which can be normalized further using a separate city_aliases table.
