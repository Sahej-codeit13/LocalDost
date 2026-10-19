// City page: what is sold here, and the markets.
(async function () {
  const slug = new URLSearchParams(location.search).get('slug') || '';
  const page = document.getElementById('page');

  try {
    const city = await api('/api/cities/' + encodeURIComponent(slug));
    setSetting('city', city.slug);               // remember this city for next search
    document.title = city.name + ' - Local Dost';

    page.innerHTML = `
      <p class="crumbs"><a href="index.html">${t('home')}</a> &rsaquo; ${esc(city.name)}</p>
      <h1>${esc(city.name)}</h1>
      <p class="muted">${esc(city.state)}</p>

      <h2>${t('browseCategory')}</h2>
      <div class="tile-grid">
        ${city.categories.map((c) => `
          <a class="card tile" href="search.html?q=${encodeURIComponent(c.name)}&city=${esc(city.slug)}">
            <span class="icon" aria-hidden="true">${esc(c.icon)}</span>
            <h3>${esc(pick(c))}</h3>
            <span class="muted">${t('shopsCount', { n: c.shop_count })}</span>
          </a>`).join('')}
      </div>

      <h2>${t('markets')}</h2>
      ${city.markets.map((m) => `
        <a class="card" href="market.html?id=${m.id}">
          <div class="card-body">
            <h3>${esc(m.name)}</h3>
            <p class="muted">${esc(m.area || '')}</p>
            <p>${esc(m.description || '')}</p>
            <p><strong>${t('shopsListed', { total: m.shop_count })}</strong></p>
            <p>${starsHTML(m.avg_rating, '')}</p>
          </div>
        </a>`).join('')}`;
  } catch (err) {
    showError(page, err);
  }
})();
