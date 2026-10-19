// Small text helpers used by search and seed.

// Words that do not help us find anything ("in", "kahan", "milega" ...)
const STOP_WORDS = [
  'in', 'me', 'mein', 'ke', 'liye', 'near', 'best', 'kahan', 'milega', 'milta',
  'hai', 'for', 'the', 'a', 'to', 'buy', 'where', 'shop', 'shops', 'market',
  'bazaar', 'bazar', 'में', 'के', 'लिए', 'कहाँ', 'मिलेगा', 'दुकान',
];

// lowercase, remove punctuation, collapse spaces. Keeps Hindi letters too.
function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(text) {
  return normalize(text).replace(/\s+/g, '-');
}

// "Jersey in Delhi" -> ['jersey', 'delhi']
function keywordsFrom(text) {
  return normalize(text)
    .split(' ')
    .filter((word) => word && !STOP_WORDS.includes(word));
}

module.exports = { STOP_WORDS, normalize, slugify, keywordsFrom };
