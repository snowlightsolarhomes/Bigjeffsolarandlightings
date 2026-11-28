/* BIG JEFF SOLAR — home page */
const HS = { filter: 'All', query: '', sort: 'featured' };
function renderCategories() { $('#catGrid').innerHTML = BJ.categories.map(catTile).join(''); }
function renderChips() {
  const chips = $('#filterChips');
  chips.innerHTML = ['All', ...BJ.categories].map(c => `<button class="chip${HS.filter === c ? ' active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
  $$('.chip', chips).forEach(el => el.addEventListener('click', () => { HS.filter = el.dataset.cat; renderChips(); renderProducts(); }));
}
function renderProducts() {
  let list = BJ.products.slice();
  if (HS.filter !== 'All') list = list.filter(p => (p.category || '').toLowerCase() === HS.filter.toLowerCase());
  if (HS.query) { const q = HS.query.toLowerCase(); list = list.filter(p => [p.name, p.description, p.category].some(x => (x || '').toLowerCase().includes(q))); }
  const pr = p => num(p.price);
  list.sort((a, b) => HS.sort === 'az' ? (a.name || '').localeCompare(b.name || '')
    : HS.sort === 'low' ? (pr(a) ?? 1e12) - (pr(b) ?? 1e12)
    : HS.sort === 'high' ? (pr(b) ?? -1) - (pr(a) ?? -1)
    : HS.sort === 'new' ? (b.createdAt || 0) - (a.createdAt || 0)
    : (Number(!!b.featured) - Number(!!a.featured)) || ((b.createdAt || 0) - (a.createdAt || 0)));
  $('#emptyState').hidden = list.length > 0;
  $('#productGrid').innerHTML = list.map(cardHTML).join('');
  if (!$('#priceNote')) $('#productGrid').insertAdjacentHTML('afterend', '<p class="price-note" id="priceNote">Prices are in Nigerian Naira and may change with the market. Message or call us to confirm availability and today’s price.</p>');
}
function renderVideos() {
  const withV = BJ.products.filter(p => productVideos(p).length);
  $('#videoEmpty').hidden = withV.length > 0;
  $('#videoGrid').innerHTML = withV.map(p => `<div class="v-card" data-vid="${p.id}"><img src="${esc(firstImage(p))}" alt="${esc(p.name)}" loading="lazy">
    <div class="v-overlay"><div class="v-play">▶</div><div class="v-title">${esc(p.name)}</div><div class="v-meta">🎬 Product video</div></div></div>`).join('');
  $$('[data-vid]').forEach(el => el.addEventListener('click', () => openProduct(el.dataset.vid, 'video')));
}
const secIds = ['home', 'categories', 'shop', 'videos', 'why', 'how', 'faq', 'contact'];
window.addEventListener('scroll', () => {
  const y = window.scrollY + 120; let cur = 'home';
  secIds.forEach(id => { const el = document.getElementById(id); if (el && el.offsetTop <= y) cur = id; });
  $$('.nav-link').forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + cur));
}, { passive: true });
$('#sortSel').addEventListener('change', e => { HS.sort = e.target.value; renderProducts(); revealAll(); });
function renderHot() {
  let hot = BJ.products.filter(p => p.featured && p.stock !== 'out');
  if (hot.length < 4) hot = hot.concat(BJ.products.filter(p => !p.featured && p.stock !== 'out')).slice(0, 8);
  $('#hot').hidden = hot.length < 2;
  $('#hotRow').innerHTML = hot.slice(0, 10).map(cardHTML).join('');
}
/* scroll-reveal animations */
const rvIO = 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches
  ? new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); rvIO.unobserve(en.target); } }), { threshold: .12 }) : null;
function revealAll() {
  if (!rvIO) return;
  $$('.sec-head, .why-card, .step, .serve-tile, .faq, .cat-tile, .p-card, .visit-info, .visit-map, .trust-item, .cta-gold-in').forEach((el, i) => {
    if (el.classList.contains('rv')) return;
    el.classList.add('rv'); el.style.transitionDelay = (i % 6) * 70 + 'ms'; rvIO.observe(el);
  });
}
$('#searchInput').addEventListener('input', e => { HS.query = e.target.value.trim(); renderProducts(); });
window.bjReady = coreInit().then(() => { renderCategories(); renderChips(); renderProducts(); renderHot(); renderVideos(); revealAll(); });
