// Shop page: who, where, can I trust it, what do they sell, reviews.
(async function () {
  const shopId = new URLSearchParams(location.search).get('id');
  const page = document.getElementById('page');

  async function loadShop() {
    try {
      const shop = await api('/api/shops/' + encodeURIComponent(shopId));
      document.title = shopTitle(shop) + ' - Local Dost';
      drawShop(shop);
    } catch (err) {
      showError(page, err);
    }
  }

  function drawShop(s) {
    const statusNotice = s.status !== 'active' ? `<p class="notice error">${t('status_' + s.status)}</p>` : '';

    page.innerHTML = `
      <p class="crumbs">
        <a href="index.html">${t('home')}</a> &rsaquo;
        <a href="city.html?slug=${esc(s.city_slug)}">${esc(s.city_name)}</a> &rsaquo;
        <a href="market.html?id=${s.market_id}">${esc(s.market_name)}</a>
      </p>

      <div class="shop-head">
        ${plateHTML(s.shop_number, 'huge')}
        <div>
          <h1 style="margin:0">${esc(shopTitle(s))}</h1>
          <p class="muted" style="margin:0">${esc(s.market_name)}, ${esc(s.city_name)}</p>
        </div>
      </div>
      ${statusNotice}

      <div class="panel trust">
        <div>${verifiedHTML(s.verification_level)} ${tierHTML(s.price_tier)}</div>
        <div>${freshnessHTML(s.freshness)}</div>
        <div class="muted">${t('source')}: ${t('src_' + s.source)}</div>
        <div>${starsHTML(s.avg_rating, s.review_count)}</div>
      </div>

      <h2>${t('whatTheySell')}</h2>
      <p>${s.categories.map((c) => `<span class="chip">${esc(pick(c))}</span>`).join('')}</p>

      <h2>${t('locationHeading')}</h2>
      <div class="panel">
        <dl class="facts">
          <dt>${t('market')}</dt><dd><a href="market.html?id=${s.market_id}">${esc(s.market_name)}</a></dd>
          ${s.block_area ? `<dt>${t('block')}</dt><dd>${esc(s.block_area)}</dd>` : ''}
          ${s.location_hint ? `<dt>${t('landmark')}</dt><dd>${esc(s.location_hint)}</dd>` : ''}
        </dl>
        ${s.maps_link ? `<p style="margin-top:.75rem"><a class="btn secondary" href="${esc(s.maps_link)}" target="_blank" rel="noopener">${t('directions')}</a></p>` : ''}
      </div>

      <h2>${t('productsHeading')}</h2>
      <div class="panel">
        ${s.products.length ? s.products.map(productHTML).join('') : `<p>${t('noProducts')}</p>`}
      </div>
      <p class="notice">${t('disclaimer')}</p>

      <h2>${t('reviewsHeading')}</h2>
      <div class="panel">
        ${s.reviews.length ? s.reviews.map(reviewHTML).join('') : `<p>${t('noReviews')}</p>`}
      </div>

      <h2>${t('writeReview')}</h2>
      <form class="panel" id="review-form">
        <div class="form-row">
          <label for="name">${t('yourName')}</label>
          <input id="name" required maxlength="40" autocomplete="name">
        </div>
        <div class="form-row">
          <label for="rating">${t('yourRating')}</label>
          <select id="rating">
            <option value="5">${t('rate5')}</option>
            <option value="4">${t('rate4')}</option>
            <option value="3">${t('rate3')}</option>
            <option value="2">${t('rate2')}</option>
            <option value="1">${t('rate1')}</option>
          </select>
        </div>
        <div class="form-row">
          <label for="body">${t('yourReview')}</label>
          <textarea id="body" maxlength="1000"></textarea>
        </div>
        <button class="btn" type="submit">${t('postReview')}</button>
        <div id="review-message" aria-live="polite"></div>
      </form>`;

    document.getElementById('review-form').addEventListener('submit', sendReview);
  }

  function productHTML(p) {
    const price = p.price_min != null ? `₹${p.price_min} to ₹${p.price_max}` : '';
    return `
      <div class="product">
        <div>
          <strong>${esc(p.name)}</strong><br>
          <span class="badge available">${t('reportedAvailable')}</span><br>
          ${freshnessHTML(p.freshness)}
        </div>
        <div class="price">${price}</div>
      </div>`;
  }

  function reviewHTML(r) {
    const date = new Date(r.created_at).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return `
      <div class="review">
        <p><strong>${esc(r.reviewer_name)}</strong> <span class="muted">${esc(date)}</span></p>
        <p>${starsHTML(r.rating, '')}</p>
        ${r.body ? `<p>${esc(r.body)}</p>` : ''}
      </div>`;
  }

  async function sendReview(event) {
    event.preventDefault();
    const message = document.getElementById('review-message');
    try {
      await api(`/api/shops/${encodeURIComponent(shopId)}/reviews`, {
        name: document.getElementById('name').value,
        rating: Number(document.getElementById('rating').value),
        body: document.getElementById('body').value,
      });
      await loadShop();                                   // redraw with the new review
      document.getElementById('review-message').innerHTML = `<p class="notice ok" role="status">${t('thanks')}</p>`;
    } catch (err) {
      showError(message, err);
    }
  }

  loadShop();
})();
