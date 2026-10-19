// Market page: facts, and the list of shops with search + filters.
(async function () {
  const params = new URLSearchParams(location.search);
  const marketId = params.get('id');
  const page = document.getElementById('page');

  try {
    const market = await api('/api/markets/' + encodeURIComponent(marketId));
    document.title = market.name + ' - Local Dost';
    drawPage(market);
    await loadShops();
  } catch (err) {
    showError(page, err);
  }

  function drawPage(m) {
    page.innerHTML = `
      <p class="crumbs">
        <a href="index.html">${t('home')}</a> &rsaquo;
        <a href="city.html?slug=${esc(m.city_slug)}">${esc(m.city_name)}</a> &rsaquo; ${esc(m.name)}
      </p>
      <h1>${esc(m.name)}</h1>
      <p>${esc(m.description || '')}</p>

      <div class="panel">
        <h2 style="margin-top:0">${t('quickFacts')}</h2>
        <dl class="facts">
          ${m.area ? `<dt>${t('area')}</dt><dd>${esc(m.area)}</dd>` : ''}
          ${m.market_type ? `<dt>${t('type')}</dt><dd>${t('market_' + m.market_type)}</dd>` : ''}
          <dt>${t('shopsListedLabel')}</dt><dd>${m.shop_count}</dd>
          <dt>${t('rating')}</dt><dd>${starsHTML(m.avg_rating, '')}</dd>
        </dl>
        ${m.numbering_notes ? `<p style="margin-top:.75rem"><strong>${t('howNumbered')}:</strong> ${esc(m.numbering_notes)}</p>` : ''}
        ${m.maps_link ? `<p><a class="btn secondary" href="${esc(m.maps_link)}" target="_blank" rel="noopener">${t('directions')}</a></p>` : ''}
      </div>

      <h2>${t('searchInMarket')}</h2>
      <form id="filters">
        <div class="form-row">
          <label for="mq" class="sr-only">${t('searchInMarket')}</label>
          <input id="mq" type="search" placeholder="${esc(t('searchInMarketHint'))}" value="${esc(params.get('q') || '')}">
        </div>
        <div class="filters">
          <div>
            <label for="tier">${t('priceLabel')}</label>
            <select id="tier">
              <option value="">${t('allPrices')}</option>
              <option value="budget">${t('budget')}</option>
              <option value="mid">${t('mid')}</option>
              <option value="premium">${t('premium')}</option>
            </select>
          </div>
          <div>
            <label for="minRating">${t('ratingLabel')}</label>
            <select id="minRating">
              <option value="">${t('anyRating')}</option>
              <option value="4">${t('rating4')}</option>
              <option value="3">${t('rating3')}</option>
            </select>
          </div>
          <div>
            <label for="sort">${t('sortLabel')}</label>
            <select id="sort">
              <option value="best">${t('sortBest')}</option>
              <option value="rating">${t('sortRating')}</option>
              <option value="recent">${t('sortRecent')}</option>
            </select>
          </div>
        </div>
        <label class="check" for="verified"><input id="verified" type="checkbox"> ${t('verifiedOnly')}</label>
        <p style="margin-top:1rem"><button class="btn" type="submit">${t('searchBtn')}</button></p>
      </form>

      <div id="shop-list" aria-live="polite"></div>`;

    const form = document.getElementById('filters');
    form.addEventListener('submit', (event) => { event.preventDefault(); loadShops(); });
    form.querySelectorAll('select, input[type=checkbox]').forEach((el) => el.addEventListener('change', loadShops));
  }

  async function loadShops() {
    const list = document.getElementById('shop-list');
    const query = new URLSearchParams({
      q: document.getElementById('mq').value,
      tier: document.getElementById('tier').value,
      minRating: document.getElementById('minRating').value,
      sort: document.getElementById('sort').value,
      verified: document.getElementById('verified').checked ? '1' : '',
    });

    try {
      const shops = await api(`/api/markets/${encodeURIComponent(marketId)}/shops?${query}`);
      list.innerHTML = shops.length
        ? shops.map((s) => shopCardHTML(s, false)).join('')
        : `<p class="notice">${t('noShops')}</p>`;
    } catch (err) {
      showError(list, err);
    }
  }
})();
