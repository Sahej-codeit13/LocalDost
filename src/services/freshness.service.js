// How old is a piece of information? We never say "in stock",
// we only say WHEN it was last confirmed.
function freshness(dateText) {
  if (!dateText) return { level: 'unknown', days: null };

  const days = Math.floor((Date.now() - new Date(dateText).getTime()) / (24 * 60 * 60 * 1000));

  let level = 'outdated';           // more than 90 days
  if (days <= 7) level = 'fresh';
  else if (days <= 30) level = 'recent';
  else if (days <= 90) level = 'older';

  return { level, days };
}

module.exports = { freshness };
