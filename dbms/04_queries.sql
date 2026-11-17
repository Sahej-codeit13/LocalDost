-- =========================================================
-- LOCAL DOST - APPLICATION DATABASE QUERIES
-- PostgreSQL version matching dbms/03_schema.sql
-- READ = SELECT operations
-- WRITE = INSERT / UPDATE / DELETE operations
-- =========================================================


-- =========================================================
-- 1. CITY QUERIES
-- =========================================================

-- READ: List all cities with their market counts
SELECT
    c.id,
    c.name,
    c.slug,
    c.state,
    COUNT(m.id) AS market_count
FROM cities c
LEFT JOIN markets m ON m.city_id = c.id
GROUP BY c.id, c.name, c.slug, c.state
ORDER BY c.name;


-- READ: Find a city using its slug
SELECT id, name, slug, state
FROM cities
WHERE slug = $1;


-- READ: Get markets belonging to a city, with shop counts and ratings
SELECT
    m.id,
    m.name,
    m.area,
    m.description,
    COUNT(DISTINCT s.id) AS shop_count,
    ROUND(AVG(r.rating)::numeric, 1) AS avg_rating
FROM markets m
LEFT JOIN shops s
    ON s.market_id = m.id
    AND s.status = 'active'
LEFT JOIN reviews r
    ON r.shop_id = s.id
    AND r.status = 'published'
WHERE m.city_id = $1
GROUP BY m.id, m.name, m.area, m.description
ORDER BY shop_count DESC, m.name;


-- READ: Get categories available in a city
SELECT
    cat.id,
    cat.name,
    cat.name_hi,
    cat.icon,
    COUNT(DISTINCT s.id) AS shop_count,
    COUNT(DISTINCT m.id) AS market_count
FROM categories cat
JOIN shop_categories sc ON sc.category_id = cat.id
JOIN shops s
    ON s.id = sc.shop_id
    AND s.status = 'active'
JOIN markets m ON m.id = s.market_id
WHERE m.city_id = $1
GROUP BY cat.id, cat.name, cat.name_hi, cat.icon
ORDER BY shop_count DESC;


-- =========================================================
-- 2. MARKET QUERIES
-- =========================================================

-- READ: Get market details, city, active shop count and average rating
SELECT
    m.id,
    m.name,
    m.area,
    m.description,
    m.market_type,
    m.numbering_notes,
    m.latitude,
    m.longitude,
    c.name AS city_name,
    c.slug AS city_slug,
    COUNT(DISTINCT s.id) AS shop_count,
    ROUND(AVG(r.rating)::numeric, 1) AS avg_rating
FROM markets m
JOIN cities c ON c.id = m.city_id
LEFT JOIN shops s
    ON s.market_id = m.id
    AND s.status = 'active'
LEFT JOIN reviews r
    ON r.shop_id = s.id
    AND r.status = 'published'
WHERE m.id = $1
GROUP BY m.id, c.name, c.slug;


-- READ: Find markets selling selected categories
-- Parameters: category IDs, optional city ID, optional budget filter
SELECT
    m.id,
    m.name,
    m.area,
    c.name AS city_name,
    COUNT(DISTINCT s.id) AS matching_shops,
    COUNT(DISTINCT active_s.id) AS total_shops,
    MAX(s.last_updated_at) AS last_updated_at,
    ROUND(AVG(DISTINCT r.rating)::numeric, 1) AS avg_rating
FROM markets m
JOIN cities c ON c.id = m.city_id
JOIN shops s
    ON s.market_id = m.id
    AND s.status = 'active'
JOIN shop_categories sc ON sc.shop_id = s.id
LEFT JOIN shops active_s
    ON active_s.market_id = m.id
    AND active_s.status = 'active'
LEFT JOIN reviews r
    ON r.shop_id = s.id
    AND r.status = 'published'
WHERE sc.category_id = ANY($1)
  AND ($2::INTEGER IS NULL OR m.city_id = $2)
  AND ($3::BOOLEAN IS NOT TRUE OR s.price_tier = 'budget')
GROUP BY m.id, m.name, m.area, c.name
ORDER BY matching_shops DESC, avg_rating DESC NULLS LAST, m.name
LIMIT 20;


-- READ: Search markets by name
SELECT
    m.id,
    m.name,
    m.area,
    c.name AS city_name,
    COUNT(DISTINCT s.id) AS total_shops,
    MAX(s.last_updated_at) AS last_updated_at,
    ROUND(AVG(r.rating)::numeric, 1) AS avg_rating
FROM markets m
JOIN cities c ON c.id = m.city_id
LEFT JOIN shops s
    ON s.market_id = m.id
    AND s.status = 'active'
LEFT JOIN reviews r
    ON r.shop_id = s.id
    AND r.status = 'published'
WHERE LOWER(m.name) LIKE LOWER($1)
  AND ($2::INTEGER IS NULL OR m.city_id = $2)
GROUP BY m.id, m.name, m.area, c.name
ORDER BY m.name
LIMIT 20;


-- =========================================================
-- 3. CATEGORY AND PRODUCT QUERIES
-- =========================================================

-- READ: List all categories
SELECT id, name, name_hi, icon
FROM categories
ORDER BY name;


-- READ: Get categories by their IDs
SELECT id, name, name_hi, icon
FROM categories
WHERE id = ANY($1);


-- READ: Find category IDs using an exact synonym
SELECT category_id
FROM synonyms
WHERE term = $1;


-- READ: Find categories using English or Hindi names
SELECT id
FROM categories
WHERE LOWER(name) LIKE LOWER($1)
   OR name_hi LIKE $1;


-- READ: Find categories associated with matching product names
SELECT DISTINCT category_id
FROM products
WHERE LOWER(name) LIKE LOWER($1);


-- =========================================================
-- 4. SHOP QUERIES
-- =========================================================

-- READ: List shops with market, city and review information
-- Optional filters: market, city, price tier, verification,
-- minimum rating, category IDs and search text.
WITH review_stats AS (
    SELECT
        shop_id,
        ROUND(AVG(rating)::numeric, 1) AS avg_rating,
        COUNT(*) AS review_count
    FROM reviews
    WHERE status = 'published'
    GROUP BY shop_id
)
SELECT
    s.*,
    m.name AS market_name,
    m.city_id,
    m.latitude AS market_lat,
    m.longitude AS market_lng,
    c.name AS city_name,
    c.slug AS city_slug,
    rs.avg_rating,
    COALESCE(rs.review_count, 0) AS review_count,
    CASE s.verification_level
        WHEN 'owner_verified' THEN 3
        WHEN 'admin_verified' THEN 3
        WHEN 'community_confirmed' THEN 2
        ELSE 1
    END AS verified_rank
FROM shops s
JOIN markets m ON m.id = s.market_id
JOIN cities c ON c.id = m.city_id
LEFT JOIN review_stats rs ON rs.shop_id = s.id
WHERE s.status = 'active'
  AND ($1::INTEGER IS NULL OR s.market_id = $1)
  AND ($2::INTEGER IS NULL OR m.city_id = $2)
  AND ($3::TEXT IS NULL OR s.price_tier = $3)
  AND (
      $4::BOOLEAN IS NOT TRUE
      OR s.verification_level IN ('admin_verified', 'owner_verified')
  )
  AND ($5::NUMERIC IS NULL OR rs.avg_rating >= $5)
  AND (
      $6::INTEGER[] IS NULL
      OR EXISTS (
          SELECT 1
          FROM shop_categories sc
          WHERE sc.shop_id = s.id
            AND sc.category_id = ANY($6)
      )
  )
  AND (
      $7::TEXT IS NULL
      OR LOWER(COALESCE(s.name, '')) LIKE LOWER($7)
      OR LOWER(COALESCE(s.shop_number, '')) LIKE LOWER($7)
      OR LOWER(COALESCE(s.location_hint, '')) LIKE LOWER($7)
  )
ORDER BY
    verified_rank DESC,
    avg_rating DESC NULLS LAST,
    s.last_updated_at DESC
LIMIT $8;


-- READ: Get shop categories
SELECT
    sc.shop_id,
    c.name,
    c.name_hi
FROM shop_categories sc
JOIN categories c ON c.id = sc.category_id
WHERE sc.shop_id = ANY($1)
ORDER BY sc.is_primary DESC, c.name;


-- READ: Get one shop with market, city and rating information
SELECT
    s.*,
    m.name AS market_name,
    m.city_id,
    m.latitude AS market_lat,
    m.longitude AS market_lng,
    c.name AS city_name,
    c.slug AS city_slug,
    ROUND(AVG(r.rating)::numeric, 1) AS avg_rating,
    COUNT(r.id) AS review_count
FROM shops s
JOIN markets m ON m.id = s.market_id
JOIN cities c ON c.id = m.city_id
LEFT JOIN reviews r
    ON r.shop_id = s.id
    AND r.status = 'published'
WHERE s.id = $1
GROUP BY s.id, m.id, c.id;


-- READ: Get products sold by a shop with their categories and prices
SELECT
    p.name,
    cat.name AS category,
    sp.price_min,
    sp.price_max,
    sp.last_confirmed_at
FROM shop_products sp
JOIN products p ON p.id = sp.product_id
JOIN categories cat ON cat.id = p.category_id
WHERE sp.shop_id = $1
ORDER BY cat.name, p.name;


-- READ: Get published reviews for a shop
SELECT
    id,
    reviewer_name,
    rating,
    body,
    created_at
FROM reviews
WHERE shop_id = $1
  AND status = 'published'
ORDER BY created_at DESC;


-- READ: Check whether a market exists before creating a shop
SELECT id
FROM markets
WHERE id = $1;


-- =========================================================
-- 5. SEARCH AND AUTOCOMPLETE QUERIES
-- =========================================================

-- READ: Get all cities for matching city names and aliases
SELECT *
FROM cities;


-- READ: Find a selected city using its slug
SELECT *
FROM cities
WHERE slug = $1;


-- READ: Autocomplete suggestions across cities, markets,
-- categories and products
SELECT name AS label
FROM cities
WHERE LOWER(name) LIKE LOWER($1)

UNION

SELECT name AS label
FROM markets
WHERE LOWER(name) LIKE LOWER($1)

UNION

SELECT name AS label
FROM categories
WHERE LOWER(name) LIKE LOWER($1)

UNION

SELECT name AS label
FROM products
WHERE LOWER(name) LIKE LOWER($1)

ORDER BY label
LIMIT 8;


-- =========================================================
-- 6. WRITE QUERIES
-- =========================================================

-- WRITE: Create a new shop
INSERT INTO shops (
    market_id,
    shop_number,
    block_area,
    location_hint,
    name,
    price_tier,
    verification_level,
    source,
    last_updated_at,
    last_verified_at
)
VALUES (
    $1, $2, $3, $4, $5, $6,
    'admin_verified',
    'admin',
    $7,
    $8
)
RETURNING id;


-- WRITE: Associate a category with a newly created shop
INSERT INTO shop_categories (
    shop_id,
    category_id,
    is_primary
)
VALUES ($1, $2, $3);


-- WRITE: Add a review for a shop
INSERT INTO reviews (
    shop_id,
    reviewer_name,
    rating,
    body,
    created_at
)
VALUES ($1, $2, $3, $4, $5)
RETURNING id;


-- =========================================================
-- END OF LOCAL DOST APPLICATION QUERIES
-- =========================================================

-- =========================================================
-- 7. TERMINAL ADMIN SCRIPT QUERIES (scripts/add-shop.js)
-- =========================================================

-- READ: List markets with their city names for the add-shop menu
SELECT
    m.id,
    m.name,
    c.name AS city
FROM markets m
JOIN cities c ON c.id = m.city_id
ORDER BY c.name, m.name;


-- READ: List categories for the add-shop menu
SELECT id, name
FROM categories
ORDER BY name;
