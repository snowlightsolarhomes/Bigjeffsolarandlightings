/* BIG JEFF SOLAR & LIGHTINGS — front-end */
const WA_NUMBER = '2349025511941';
const CALL_NUMBER = '08149439431';
const money = v => (v ? String(v).trim() : '');

const state = {
  products: [],
  categories: [],
  filter: 'All',
  query: ''
};

/* ---------- helpers ---------- */
function waLink(text) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}
function productVideos(p) {
  return (p.videos || []).map(v => {
    if (typeof v === 'string') return { type: 'file', url: v };
    if (v && v.type === 'youtube') return { type: 'youtube', id: v.id };
    return null;
  }).filter(Boolean);
}
function firstImage(p) {
  return (p.images && p.images[0]) || '/assets/logo.png';
}
function videoSrcTag(v) {
  if (v.type === 'youtube') {
    return `<iframe src="https://www.youtube.com/embed/${v.id}?autoplay=1" title="Product video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  }
  return `<video src="${v.url}" controls autoplay playsinline></video>`;
}
const CAT_ICONS = {
  'solar street lights': '🚥',
  'solar floodlights': '🔦',
  'solar fans': '🌀',
  'solar home systems': '🏠',
  'solar panels': '🔆',
  'batteries & inverters': '🔋',
  'led bulbs & lamps': '💡',
  'cctv security': '📹',
  'solar accessories': '⚙️'
};
function catIcon(c) {
  return CAT_ICONS[String(c).toLowerCase().trim()] || '☀️';
}

/* ---------- render: categories ---------- */
function renderCategories() {
  const grid = document.getElementById('catGrid');
  const counts = {};
  state.products.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
  grid.innerHTML = state.categories.map(c => `
    <div class="cat-card" data-cat="${escapeHtml(c)}">
      <div class="cat-ic">${catIcon(c)}</div>
      <h3>${escapeHtml(c)}</h3>
      <small>${counts[c] || 0} product${counts[c] === 1 ? '' : 's'}</small>
    </div>`).join('');
  grid.querySelectorAll('.cat-card').forEach(el => {
    el.addEventListener('click', () => {
      setFilter(el.dataset.cat);
      document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
    });
  });
}
function renderChips() {
  const chips = document.getElementById('filterChips');
  const cats = ['All', ...state.categories];
  chips.innerHTML = cats.map(c =>
    `<button class="chip${state.filter === c ? ' active' : ''}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`
  ).join('');
  chips.querySelectorAll('.chip').forEach(el =>
    el.addEventListener('click', () => setFilter(el.dataset.cat))
  );
}
function setFilter(cat) {
  state.filter = cat;
  renderChips();
  renderProducts();
}
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

/* ---------- render: products ---------- */
function renderProducts() {
  const grid = document.getElementById('productGrid');
  const empty = document.getElementById('emptyState');
  let list = state.products.slice();
  if (state.filter !== 'All') {
    list = list.filter(p => (p.category || '').toLowerCase() === state.filter.toLowerCase());
  }
  if (state.query) {
    const q = state.query.toLowerCase();
    list = list.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q));
  }
  empty.hidden = list.length > 0;
  grid.innerHTML = list.map(p => {
    const vids = productVideos(p);
    const price = money(p.price);
    const priceHtml = price
      ? `<div class="p-price">${escapeHtml(price)}</div>`
      : `<div class="p-price call">📞 Call for price</div>`;
    const badge = p.featured ? `<span class="p-badge">⭐ Featured</span>` :
      (vids.length ? `<span class="p-badge">▶ Video</span>` : '');
    return `
    <article class="p-card" data-id="${p.id}">
      <div class="p-media" data-open="${p.id}">
        <img src="${firstImage(p)}" alt="${escapeHtml(p.name)}" loading="lazy">
        ${badge}
        ${vids.length ? `<button class="p-vid-btn" data-video="${p.id}">▶ Watch Video</button>` : ''}
      </div>
      <div class="p-body">
        <span class="p-cat">${escapeHtml(p.category || '')}</span>
        <h3 class="p-name" data-open="${p.id}">${escapeHtml(p.name)}</h3>
        ${priceHtml}
        <p class="p-desc">${escapeHtml(p.description || '')}</p>
        <div class="p-actions">
          <button class="btn btn-blue" data-open="${p.id}">View Details</button>
          <a class="btn btn-wa" target="_blank" rel="noopener"
             href="${waLink(`Hello BIG JEFF SOLAR & LIGHTINGS, I am interested in: ${p.name}${price ? ' (' + price + ')' : ''}. Is it available?`)}">💬 Order</a>
        </div>
      </div>
    </article>`;
  }).join('');

  grid.querySelectorAll('[data-open]').forEach(el =>
    el.addEventListener('click', () => openProduct(el.dataset.open)));
  grid.querySelectorAll('[data-video]').forEach(el =>
    el.addEventListener('click', e => {
      e.stopPropagation();
      const p = state.products.find(x => x.id === el.dataset.video);
      const vids = productVideos(p);
      if (vids.length) openVideo(p, vids[0]);
    }));
}

/* ---------- render: video gallery ---------- */
function renderVideos() {
  const grid = document.getElementById('videoGrid');
  const empty = document.getElementById('videoEmpty');
  const withVids = state.products.filter(p => productVideos(p).length > 0);
  empty.hidden = withVids.length > 0;
  grid.innerHTML = withVids.map(p => {
    const vids = productVideos(p);
    const label = vids[0].type === 'youtube' ? 'YouTube video' : 'Product video';
    return `
    <div class="v-card" data-vid="${p.id}">
      <img src="${firstImage(p)}" alt="${escapeHtml(p.name)}" loading="lazy">
      <div class="v-overlay">
        <div class="v-play">▶</div>
        <div class="v-title">${escapeHtml(p.name)}</div>
        <div class="v-meta">🎬 ${label}${vids.length > 1 ? ` · +${vids.length - 1} more` : ''}</div>
      </div>
    </div>`;
  }).join('');
  grid.querySelectorAll('[data-vid]').forEach(el =>
    el.addEventListener('click', () => {
      const p = state.products.find(x => x.id === el.dataset.vid);
      openVideo(p, productVideos(p)[0]);
    }));
}

/* ---------- product modal ---------- */
const productModal = document.getElementById('productModal');
function openProduct(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;
  const imgs = (p.images && p.images.length) ? p.images : ['/assets/logo.png'];
  document.getElementById('pmMainImg').src = imgs[0];
  document.getElementById('pmCat').textContent = p.category || 'Product';
  document.getElementById('pmName').textContent = p.name;
  const price = money(p.price);
  const priceEl = document.getElementById('pmPrice');
  priceEl.textContent = price || '📞 Call for price';
  priceEl.className = 'pm-price' + (price ? '' : ' call');
  document.getElementById('pmDesc').textContent = p.description || 'Contact us for details, wholesale prices and available units.';

  const thumbs = document.getElementById('pmThumbs');
  thumbs.innerHTML = imgs.map((src, i) =>
    `<img src="${src}" class="${i === 0 ? 'active' : ''}" alt="photo ${i + 1}">`).join('');
  thumbs.querySelectorAll('img').forEach(t => t.addEventListener('click', () => {
    document.getElementById('pmMainImg').src = t.src;
    thumbs.querySelectorAll('img').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    hidePlayer();
  }));

  const vids = productVideos(p);
  const vWrap = document.getElementById('pmVideos');
  vWrap.innerHTML = vids.map((v, i) =>
    `<button class="pm-vid-chip" data-i="${i}">▶ ${v.type === 'youtube' ? 'Watch on YouTube' : 'Watch product video'}</button>`
  ).join('') || `<small style="color:#5b6b8c">🎬 Video coming soon — ask us on WhatsApp for a live clip.</small>`;
  vWrap.querySelectorAll('.pm-vid-chip').forEach(btn => btn.addEventListener('click', () => {
    vWrap.querySelectorAll('.pm-vid-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    playInModal(vids[Number(btn.dataset.i)]);
  }));

  const playBtn = document.getElementById('pmPlayBtn');
  playBtn.hidden = vids.length === 0;
  playBtn.onclick = () => playInModal(vids[0]);

  document.getElementById('pmOrder').href = waLink(
    `Hello BIG JEFF SOLAR & LIGHTINGS, I want to order:\n• Product: ${p.name}${price ? `\n• Price: ${price}` : ''}\nPlease confirm availability. Thank you!`);
  document.getElementById('pmCall').href = 'tel:' + CALL_NUMBER;
  hidePlayer();
  productModal.classList.add('open');
  productModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function playInModal(v) {
  const player = document.getElementById('pmPlayer');
  player.hidden = false;
  player.innerHTML = videoSrcTag(v);
}
function hidePlayer() {
  const player = document.getElementById('pmPlayer');
  player.hidden = true;
  player.innerHTML = '';
}

/* ---------- video lightbox ---------- */
const videoModal = document.getElementById('videoModal');
function openVideo(p, v) {
  if (!p || !v) return;
  document.getElementById('vmTitle').textContent = p.name + ' — product video';
  document.getElementById('vmStage').innerHTML = videoSrcTag(v);
  videoModal.classList.add('open');
  videoModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeModals() {
  [productModal, videoModal].forEach(m => {
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
  });
  document.getElementById('vmStage').innerHTML = '';
  hidePlayer();
  document.body.style.overflow = '';
}
document.querySelectorAll('.modal').forEach(m => {
  m.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModals));
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModals(); });

/* ---------- header / nav ---------- */
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('nav');
hamburger.addEventListener('click', () => {
  nav.classList.toggle('open');
  hamburger.classList.toggle('open');
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  hamburger.classList.remove('open');
}));
// active link on scroll
const sections = ['home', 'categories', 'shop', 'videos', 'about', 'contact'];
window.addEventListener('scroll', () => {
  const y = window.scrollY + 120;
  let current = 'home';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.offsetTop <= y) current = id;
  });
  document.querySelectorAll('.nav-link').forEach(l =>
    l.classList.toggle('active', l.getAttribute('href') === '#' + current));
}, { passive: true });

/* ---------- search ---------- */
document.getElementById('searchInput').addEventListener('input', e => {
  state.query = e.target.value.trim();
  renderProducts();
});

/* ---------- boot ---------- */
async function boot() {
  document.getElementById('year').textContent = new Date().getFullYear();
  try {
    const [cats, prods] = await Promise.all([
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/products').then(r => r.json())
    ]);
    state.categories = cats;
    state.products = prods;
  } catch (e) {
    console.error('Failed to load shop data', e);
  }
  renderCategories();
  renderChips();
  renderProducts();
  renderVideos();
}
boot();
