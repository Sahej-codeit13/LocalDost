/* Shared code for every page: language, header, small helpers, and card builders.
   Plain JavaScript, no libraries. */

// ---------- 1. Saved settings (language, text size, city) ----------
function getSetting(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch (e) { return fallback; }
}
function setSetting(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { /* private mode: ignore */ }
}

// ---------- 2. Words in English and Hindi ----------
const TEXT = {
  en: {
    skip: 'Skip to main content', smallerText: 'Smaller text', biggerText: 'Bigger text',
    lightTheme: 'Light', darkTheme: 'Dark',
    switchToLightTheme: 'Switch to light theme', switchToDarkTheme: 'Switch to dark theme',
    tagline: 'Right market. Right shop.', home: 'Home',
    demo: 'Demo data: shop numbers, prices and ratings are examples for learning, not real information.',
    ask: 'What are you looking for?', searchPlaceholder: 'For example: jersey, shoes, books',
    searchBtn: 'Search', allCities: 'All cities', cityLabel: 'City',
    tryThese: 'Try one of these', pickCity: 'Or pick a city and browse',
    quick_jersey: 'Jersey', quick_shoes: 'Shoes', quick_books: 'Books', quick_watch: 'Watch', quick_wedding: 'Wedding', quick_mobile: 'Mobile',
    marketsCount: '{n} markets',
    loading: 'Loading...', error: 'Something went wrong. Please try again.',
    showingFor: 'Showing results for:', budgetOnly: 'budget shops',
    marketsHeading: 'Markets to visit', shopsHeading: 'Shops',
    topShops: 'Top shops', noResults: 'We could not find "{q}".', tryInstead: 'Try one of these instead:',
    typeSomething: 'Type what you want to buy in the box above.',
    shopsOfTotal: '{n} of {total} shops sell this', shopsListed: '{total} shops listed',
    shop: 'Shop', noRatingYet: 'No ratings yet', noShops: 'No shops found. Try another word.',
    categories: 'What is sold here', markets: 'Markets', browseCategory: 'Search by what you want',
    shopsCount: '{n} shops',
    quickFacts: 'Quick facts', area: 'Area', type: 'Type', shopsListedLabel: 'Shops listed', rating: 'Rating',
    howNumbered: 'How shops are numbered', directions: 'Open market in Google Maps',
    searchInMarket: 'Search in this market', searchInMarketHint: 'Shop number, name, or product',
    allPrices: 'Any price', budget: 'Budget', mid: 'Mid-range', premium: 'Premium',
    priceLabel: 'Price level', ratingLabel: 'Rating', anyRating: 'Any rating', rating4: '4 stars and above', rating3: '3 stars and above',
    verifiedOnly: 'Verified shops only', sortLabel: 'Sort by',
    sortBest: 'Best match', sortRating: 'Top rated', sortRecent: 'Recently updated',
    market_retail: 'Retail', market_wholesale: 'Wholesale', market_mixed: 'Retail and wholesale', market_street: 'Street market',
    today: 'Updated today', daysAgo: 'Updated {n} days ago',
    fresh: 'Fresh', recent: 'Recent', older: 'Older: check with the shop', outdated: 'May be outdated', unknown: 'Date unknown',
    v_unverified: 'Reported by users', v_community_confirmed: 'Confirmed by users',
    v_admin_verified: 'Verified by Local Dost', v_owner_verified: 'Verified owner',
    source: 'Source', lastVerified: 'Last verified',
    src_admin: 'Local Dost team', src_survey: 'Field survey', src_user: 'Users', src_shopkeeper: 'Shopkeeper', src_association: 'Market association',
    status_temporarily_closed: 'This shop is marked as temporarily closed.',
    status_permanently_closed: 'This shop is marked as permanently closed.',
    status_moved: 'This shop has moved.', status_hidden: 'This shop is hidden.',
    whatTheySell: 'What they sell', productsHeading: 'Products', reportedAvailable: 'Reported as available',
    noProducts: 'No products listed yet.',
    locationHeading: 'Where to find it', block: 'Block or lane', landmark: 'Landmark', market: 'Market',
    disclaimer: 'Products shown were reported as available at the time shown. Availability and prices can change. Please confirm with the shop.',
    reviewsHeading: 'Reviews', writeReview: 'Write a review',
    yourName: 'Your name', yourRating: 'Your rating', yourReview: 'Your review (optional)', postReview: 'Post review',
    rate5: '5 - Very good', rate4: '4 - Good', rate3: '3 - OK', rate2: '2 - Poor', rate1: '1 - Very poor',
    noReviews: 'No reviews yet. Be the first to write one!', thanks: 'Thank you! Your review is posted.',
    footer: 'Local Dost shows what was reported and when. It never guarantees that something is in stock.',
  },
  hi: {
    skip: 'मुख्य भाग पर जाएँ', smallerText: 'छोटे अक्षर', biggerText: 'बड़े अक्षर',
    lightTheme: 'हल्की थीम', darkTheme: 'गहरी थीम',
    switchToLightTheme: 'हल्की थीम पर जाएँ', switchToDarkTheme: 'गहरी थीम पर जाएँ',
    tagline: 'सही बाज़ार। सही दुकान।', home: 'होम',
    demo: 'डेमो डेटा: दुकान के नंबर, कीमतें और रेटिंग सिर्फ़ सीखने के उदाहरण हैं, असली जानकारी नहीं।',
    ask: 'आप क्या ढूंढ रहे हैं?', searchPlaceholder: 'जैसे: जर्सी, जूते, किताबें',
    searchBtn: 'खोजें', allCities: 'सभी शहर', cityLabel: 'शहर',
    tryThese: 'इनमें से चुनें', pickCity: 'या कोई शहर चुनकर देखें',
    quick_jersey: 'जर्सी', quick_shoes: 'जूते', quick_books: 'किताबें', quick_watch: 'घड़ी', quick_wedding: 'शादी', quick_mobile: 'मोबाइल',
    marketsCount: '{n} बाज़ार',
    loading: 'लोड हो रहा है...', error: 'कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।',
    showingFor: 'इसके नतीजे:', budgetOnly: 'सस्ती दुकानें',
    marketsHeading: 'जाने के लिए बाज़ार', shopsHeading: 'दुकानें',
    topShops: 'सबसे अच्छी दुकानें', noResults: '"{q}" नहीं मिला।', tryInstead: 'इनमें से कुछ आज़माएँ:',
    typeSomething: 'ऊपर के बॉक्स में लिखें कि आपको क्या खरीदना है।',
    shopsOfTotal: '{total} में से {n} दुकानों में मिलता है', shopsListed: '{total} दुकानें',
    shop: 'दुकान', noRatingYet: 'अभी रेटिंग नहीं', noShops: 'कोई दुकान नहीं मिली। दूसरा शब्द आज़माएँ।',
    categories: 'यहाँ क्या मिलता है', markets: 'बाज़ार', browseCategory: 'जो चाहिए उसे खोजें',
    shopsCount: '{n} दुकानें',
    quickFacts: 'ज़रूरी जानकारी', area: 'इलाका', type: 'प्रकार', shopsListedLabel: 'दुकानें', rating: 'रेटिंग',
    howNumbered: 'दुकानों के नंबर कैसे हैं', directions: 'गूगल मैप्स में बाज़ार खोलें',
    searchInMarket: 'इस बाज़ार में खोजें', searchInMarketHint: 'दुकान नंबर, नाम या सामान',
    allPrices: 'कोई भी कीमत', budget: 'सस्ता', mid: 'मध्यम', premium: 'महंगा',
    priceLabel: 'कीमत का स्तर', ratingLabel: 'रेटिंग', anyRating: 'कोई भी रेटिंग', rating4: '4 स्टार और ऊपर', rating3: '3 स्टार और ऊपर',
    verifiedOnly: 'सिर्फ़ जाँची हुई दुकानें', sortLabel: 'क्रम',
    sortBest: 'सबसे सही', sortRating: 'सबसे ज़्यादा रेटिंग', sortRecent: 'हाल में अपडेट',
    market_retail: 'खुदरा', market_wholesale: 'थोक', market_mixed: 'खुदरा और थोक', market_street: 'सड़क बाज़ार',
    today: 'आज अपडेट हुआ', daysAgo: '{n} दिन पहले अपडेट हुआ',
    fresh: 'ताज़ा', recent: 'हाल का', older: 'पुराना: दुकान से पूछ लें', outdated: 'पुरानी हो सकती है', unknown: 'तारीख पता नहीं',
    v_unverified: 'यूज़र्स ने बताया', v_community_confirmed: 'यूज़र्स ने पुष्टि की',
    v_admin_verified: 'लोकल दोस्त ने जाँचा', v_owner_verified: 'दुकानदार द्वारा सत्यापित',
    source: 'स्रोत', lastVerified: 'आखिरी जाँच',
    src_admin: 'लोकल दोस्त टीम', src_survey: 'मौके पर सर्वे', src_user: 'यूज़र्स', src_shopkeeper: 'दुकानदार', src_association: 'बाज़ार संघ',
    status_temporarily_closed: 'यह दुकान अभी बंद बताई गई है।',
    status_permanently_closed: 'यह दुकान हमेशा के लिए बंद बताई गई है।',
    status_moved: 'यह दुकान कहीं और चली गई है।', status_hidden: 'यह दुकान छिपी हुई है।',
    whatTheySell: 'ये क्या बेचते हैं', productsHeading: 'सामान', reportedAvailable: 'उपलब्ध बताया गया',
    noProducts: 'अभी कोई सामान नहीं जुड़ा।',
    locationHeading: 'कहाँ मिलेगी', block: 'ब्लॉक या गली', landmark: 'पहचान की जगह', market: 'बाज़ार',
    disclaimer: 'दिखाया गया सामान बताई गई तारीख पर उपलब्ध बताया गया था। उपलब्धता और कीमत बदल सकती है। कृपया दुकान से पूछकर पक्का कर लें।',
    reviewsHeading: 'रिव्यू', writeReview: 'रिव्यू लिखें',
    yourName: 'आपका नाम', yourRating: 'आपकी रेटिंग', yourReview: 'आपका रिव्यू (ज़रूरी नहीं)', postReview: 'रिव्यू भेजें',
    rate5: '5 - बहुत अच्छा', rate4: '4 - अच्छा', rate3: '3 - ठीक', rate2: '2 - खराब', rate1: '1 - बहुत खराब',
    noReviews: 'अभी कोई रिव्यू नहीं। पहला रिव्यू आप लिखें!', thanks: 'धन्यवाद! आपका रिव्यू जुड़ गया।',
    footer: 'लोकल दोस्त बताता है कि क्या और कब बताया गया। यह सामान के स्टॉक में होने की गारंटी नहीं देता।',
  },
};

let lang = getSetting('lang', 'en');
let theme = getSetting('theme', 'dark') === 'light' ? 'light' : 'dark';

// t('daysAgo', { n: 3 })  ->  "Updated 3 days ago"
function t(key, values) {
  let text = (TEXT[lang] && TEXT[lang][key]) || TEXT.en[key] || key;
  for (const name in values || {}) text = text.replace('{' + name + '}', values[name]);
  return text;
}

// Show the Hindi name when Hindi is selected
function pick(item) {
  return lang === 'hi' && item.name_hi ? item.name_hi : item.name;
}

// ---------- 3. Small helpers ----------
// Always escape text that came from the database before putting it in HTML.
function esc(value) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => map[c]);
}

// Talk to our own server. Pass data as the 2nd argument to POST it.
async function api(url, data) {
  const options = data
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
    : {};
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((body.error && body.error.message) || t('error'));
  return body.data;
}

function showError(box, err) {
  box.innerHTML = `<p class="notice error" role="alert">${esc(err.message)}</p>`;
}

// ---------- 4. Header, footer, text size, language ----------
const TEXT_SIZES = ['18px', '22px', '26px'];
let sizeIndex = Number(getSetting('size', '0')) || 0;

function applyTextSize() {
  document.documentElement.style.fontSize = TEXT_SIZES[sizeIndex];
}

function changeTextSize(step) {
  sizeIndex = Math.min(TEXT_SIZES.length - 1, Math.max(0, sizeIndex + step));
  setSetting('size', sizeIndex);
  applyTextSize();
}

function toggleLanguage() {
  setSetting('lang', lang === 'en' ? 'hi' : 'en');
  location.reload();                     // simplest way to redraw the whole page
}

function applyTheme() {
  document.documentElement.dataset.theme = theme;
}

function toggleTheme() {
  theme = theme === 'dark' ? 'light' : 'dark';
  setSetting('theme', theme);
  applyTheme();

  const button = document.getElementById('theme-toggle');
  const targetIsLight = theme === 'dark';
  button.textContent = t(targetIsLight ? 'lightTheme' : 'darkTheme');
  button.setAttribute('aria-label', t(targetIsLight ? 'switchToLightTheme' : 'switchToDarkTheme'));
}

function renderLayout() {
  document.documentElement.lang = lang;
  applyTheme();
  applyTextSize();

  document.getElementById('site-header').innerHTML = `
    <a class="skip" href="#main">${t('skip')}</a>
    <div class="bar">
      <a class="brand" href="index.html">
        <img class="brand-logo brand-logo-dark" src="assets/local-dost-logo.png" alt="Local Dost">
        <img class="brand-logo brand-logo-light" src="assets/local-dost-logo-light.png" alt="Local Dost">
      </a>
      <div class="tools">
        <button type="button" id="smaller" aria-label="${t('smallerText')}">A−</button>
        <button type="button" id="bigger" aria-label="${t('biggerText')}">A+</button>
        <button type="button" id="theme-toggle" aria-label="${t(theme === 'dark' ? 'switchToLightTheme' : 'switchToDarkTheme')}">${t(theme === 'dark' ? 'lightTheme' : 'darkTheme')}</button>
        <button type="button" id="lang">${lang === 'en' ? 'हिंदी' : 'English'}</button>
      </div>
    </div>
    <div class="demo-banner">${t('demo')}</div>`;

  document.getElementById('smaller').addEventListener('click', () => changeTextSize(-1));
  document.getElementById('bigger').addEventListener('click', () => changeTextSize(1));
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('lang').addEventListener('click', toggleLanguage);

  document.getElementById('site-footer').innerHTML = `<p>${t('footer')}</p>`;

  // Fill any element marked with data-i18n="key"
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
}

// ---------- 5. The search box (home page and search page) ----------
async function initSearchBox(selectedCity) {
  const select = document.getElementById('city');
  const input = document.getElementById('q');
  const list = document.getElementById('suggestions');

  const cities = await api('/api/cities');
  select.innerHTML = `<option value="">${t('allCities')}</option>` +
    cities.map((c) => `<option value="${esc(c.slug)}">${esc(c.name)}</option>`).join('');
  select.value = selectedCity || '';
  select.addEventListener('change', () => setSetting('city', select.value));

  // Suggestions while typing (waits 250 ms after the last key)
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (input.value.trim().length < 2) return;
      try {
        const words = await api('/api/search/suggest?q=' + encodeURIComponent(input.value));
        list.innerHTML = words.map((w) => `<option value="${esc(w)}"></option>`).join('');
      } catch (err) { /* suggestions are optional: ignore errors */ }
    }, 250);
  });
}

// ---------- 6. Little building blocks for cards ----------
function plateHTML(number, size) {
  if (!number) return `<span class="plate none ${size || ''}" title="No number">📍</span>`;
  return `<span class="plate ${size || 'big'}">${esc(number)}</span>`;
}

function starsHTML(rating, count) {
  if (!rating) return `<span class="muted">${t('noRatingYet')}</span>`;
  const full = Math.round(rating);
  return `<span class="stars" role="img" aria-label="${rating} / 5">${'★'.repeat(full)}${'☆'.repeat(5 - full)}</span> ` +
    `<strong>${rating}</strong>` + (count === '' ? '' : ` <span class="muted">(${count})</span>`);
}

const FRESH_ICONS = { fresh: '✔', recent: '◐', older: '⚠', outdated: '⚠', unknown: '' };

// Icon + word + date, so colour is never the only clue
function freshnessHTML(f) {
  let when = '';
  if (f.days === 0) when = t('today');
  else if (f.days !== null) when = t('daysAgo', { n: f.days });
  return `<span class="badge ${f.level}">${FRESH_ICONS[f.level]} ${t(f.level)}</span> <span class="muted">${when}</span>`;
}

function verifiedHTML(level) {
  const tick = level === 'admin_verified' || level === 'owner_verified' ? '✔ ' : '';
  return `<span class="badge v-${esc(level)}">${tick}${t('v_' + level)}</span>`;
}

function tierHTML(tier) {
  return tier ? `<span class="chip">${t(tier)}</span>` : '';
}

// "Jersey Point"  or  "Shop 4, Lane 2"  or the landmark when there is no number
function shopTitle(shop) {
  if (shop.name) return shop.name;
  if (shop.shop_number) return `${t('shop')} ${shop.shop_number}` + (shop.block_area ? `, ${shop.block_area}` : '');
  return shop.location_hint;
}

function shopCardHTML(shop, showMarket) {
  const place = [shop.block_area, shop.location_hint].filter(Boolean).join(', ');
  return `
    <a class="card" href="shop.html?id=${shop.id}">
      ${plateHTML(shop.shop_number)}
      <div class="card-body">
        <h3>${esc(shopTitle(shop))}</h3>
        ${showMarket ? `<p>${esc(shop.market_name)}, ${esc(shop.city_name)}</p>` : ''}
        ${place ? `<p class="muted">${esc(place)}</p>` : ''}
        <p>${shop.categories.map((c) => `<span class="chip">${esc(pick(c))}</span>`).join('')}</p>
        <p>${tierHTML(shop.price_tier)} ${starsHTML(shop.avg_rating, shop.review_count)}</p>
        <p>${verifiedHTML(shop.verification_level)}</p>
        <p>${freshnessHTML(shop.freshness)}</p>
      </div>
    </a>`;
}

function marketCardHTML(market, categoryName) {
  const link = `market.html?id=${market.id}` + (categoryName ? `&q=${encodeURIComponent(categoryName)}` : '');
  const count = market.matching_shops != null
    ? t('shopsOfTotal', { n: market.matching_shops, total: market.total_shops })
    : t('shopsListed', { total: market.total_shops });
  return `
    <a class="card" href="${link}">
      <div class="card-body">
        <h3>${esc(market.name)}</h3>
        <p class="muted">${esc([market.area, market.city_name].filter(Boolean).join(', '))}</p>
        <p><strong>${count}</strong></p>
        <p>${starsHTML(market.avg_rating, '')}</p>
        ${market.freshness ? `<p>${freshnessHTML(market.freshness)}</p>` : ''}
      </div>
    </a>`;
}

// Draw the header and footer as soon as this file loads
renderLayout();
