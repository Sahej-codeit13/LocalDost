// Search results page: markets first, then shops.
(async function () {
  const params = new URLSearchParams(location.search);
  const q = (params.get('q') || '').trim();
  // city in the address wins; otherwise use the remembered city
  const city = params.has('city') ? params.get('city') : getSetting('city', '');
  const results = document.getElementById('results');

  document.getElementById('q').value = q;
  await initSearchBox(city);

  if (!q) {
    results.innerHTML = `<p class="notice">${t('typeSomething')}</p>`;
    return;
  }

  results.innerHTML = `<p>${t('loading')}</p>`;
  try {
    const data = await api(`/api/search?q=${encodeURIComponent(q)}&city=${encodeURIComponent(city)}`);
    showResults(data);
  } catch (err) {
    showError(results, err);
  }

  function showResults(data) {
    const { interpretation, markets, shops, suggestions } = data;

    // Nothing found: offer the categories we do have
    if (markets.length === 0 && shops.length === 0) {
      results.innerHTML = `
        <p class="notice">${t('noResults', { q: esc(q) })}</p>
        <h2>${t('tryInstead')}</h2>
        <div>${suggestions.map((c) =>
          `<a class="chip big" href="search.html?q=${encodeURIComponent(c.name)}">${c.icon} ${esc(pick(c))}</a>`).join(' ')}</div>`;
      return;
    }

    // "Showing results for: Sports Jerseys in Delhi"
    const parts = interpretation.categories.map(pick);
    if (interpretation.budget) parts.push(t('budgetOnly'));
    if (interpretation.city) parts.push(interpretation.city.name);
    const summary = parts.length ? `<p class="notice">${t('showingFor')} <strong>${esc(parts.join(', '))}</strong></p>` : '';

    const firstCategory = interpretation.categories.length ? interpretation.categories[0].name : '';

    results.innerHTML = summary +
      (markets.length ? `<h2>${t('marketsHeading')}</h2>` + markets.map((m) => marketCardHTML(m, firstCategory)).join('') : '') +
      (shops.length ? `<h2>${markets.length ? t('topShops') : t('shopsHeading')}</h2>` + shops.map((s) => shopCardHTML(s, true)).join('') : '');
  }
})();
