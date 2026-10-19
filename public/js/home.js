// Home page: search box, quick buttons, city buttons.
(async function () {
  await initSearchBox(getSetting('city', ''));

  // [text key, what to search for]
  const quick = [
    ['quick_jersey', 'jersey'], ['quick_shoes', 'shoes'], ['quick_books', 'books'],
    ['quick_watch', 'watch'], ['quick_wedding', 'wedding'], ['quick_mobile', 'mobile'],
  ];
  document.getElementById('quick').innerHTML = quick
    .map(([key, word]) => `<a class="chip big" href="search.html?q=${word}">${t(key)}</a>`)
    .join(' ');

  const box = document.getElementById('cities');
  try {
    const cities = await api('/api/cities');
    box.innerHTML = cities.map((city) => `
      <a class="card" href="city.html?slug=${esc(city.slug)}">
        <div class="card-body">
          <h3>${esc(city.name)}</h3>
          <p class="muted">${esc(city.state)}, ${t('marketsCount', { n: city.market_count })}</p>
        </div>
      </a>`).join('');
  } catch (err) {
    showError(box, err);
  }
})();
