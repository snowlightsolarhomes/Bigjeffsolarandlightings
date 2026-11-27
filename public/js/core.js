/* BIG JEFF SOLAR — shared shop core: data, settings, cart, product viewer, PWA */
const BJ = { settings: {}, products: [], categories: [], catImages: {}, cart: [] };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const slugify = s => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const num = v => { const n = parseFloat(String(v ?? '').replace(/[^\d.]/g, '')); return isFinite(n) && n > 0 ? n : null; };
const naira = n => '₦' + Number(n).toLocaleString('en-NG');
function priceText(p) { const n = num(p.price); return n ? naira(n) : ''; }
function waNum() { return String(BJ.settings.whatsapp || '2349025511941').replace(/\D/g, ''); }
function waLink(t) { return `https://wa.me/${waNum()}?text=${encodeURIComponent(t)}`; }
const BRAND = 'BIG JEFF SOLAR & LIGHTINGS';
const CAT_ICONS = { 'solar street lights': '🚥', 'solar floodlights': '🔦', 'solar fans': '🌀', 'solar home systems': '🏠', 'solar panels': '🔆', 'batteries & inverters': '🔋', 'led bulbs & lamps': '💡', 'cctv security': '📹', 'solar accessories': '⚙️' };
const catIcon = c => CAT_ICONS[String(c).toLowerCase().trim()] || '☀️';

/* ---------- media helpers ---------- */
function normVideo(v) {
  if (!v) return null;
  if (typeof v === 'string') return { type: 'file', url: v };
  return v.type ? v : null;
}
const productVideos = p => (p.videos || []).map(normVideo).filter(Boolean);
const productImages = p => (p.images && p.images.length ? p.images : ['/assets/logo.png']);
const firstImage = p => productImages(p)[0];
function videoEmbed(v, autoplay) {
  if (v.type === 'youtube') return `<iframe src="https://www.youtube.com/embed/${esc(v.id)}?${autoplay ? 'autoplay=1&mute=1&' : ''}playsinline=1&rel=0&loop=1&playlist=${esc(v.id)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  if (v.type === 'tiktok') return `<iframe src="https://www.tiktok.com/embed/v2/${esc(v.id)}" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
  if (v.type === 'facebook') return `<iframe src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(v.url)}&show_text=false&autoplay=${autoplay ? 1 : 0}" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>`;
  return `<video src="${esc(v.url)}" controls playsinline ${autoplay ? 'autoplay muted' : ''} loop></video>`;
}

/* ---------- data + settings ---------- */
async function getJSON(path, fallback) {
  try { const r = await fetch(path, { cache: 'no-cache' }); if (!r.ok) throw 0; return await r.json(); } catch (e) { return fallback; }
}
async function loadData() {
  const [products, categories, catImages, settings] = await Promise.all([
    getJSON('/data/products.json', []), getJSON('/data/categories.json', []),
    getJSON('/data/category-images.json', {}), getJSON('/data/settings.json', {})
  ]);
  BJ.products = products; BJ.categories = categories; BJ.catImages = catImages; BJ.settings = settings;
  BJ.products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  applySettings();
}
function catPhoto(c) {
  if (BJ.catImages[slugify(c)]) return BJ.catImages[slugify(c)];
  const p = BJ.products.find(x => (x.category || '').toLowerCase() === String(c).toLowerCase() && x.images && x.images[0]);
  return p ? p.images[0] : '';
}
function catCount(c) { return BJ.products.filter(p => (p.category || '').toLowerCase() === String(c).toLowerCase()).length; }
function catTile(c) {
  const ph = catPhoto(c), n = catCount(c);
  return `<a class="cat-tile" href="/category/${slugify(c)}">
    <div class="ct-img">${ph ? `<img src="${esc(ph)}" alt="${esc(c)}" loading="lazy">` : `<span>${catIcon(c)}</span>`}</div>
    <h3>${esc(c)}</h3><small>${n} item${n === 1 ? '' : 's'}</small></a>`;
}
function applySettings() {
  const s = BJ.settings;
  if (s.whatsapp) $$('a[href^="https://wa.me/"]').forEach(a => { a.href = a.href.replace(/wa\.me\/\d+/, 'wa.me/' + waNum()); });
  if (s.phone) $$('a[href^="tel:"]').forEach(a => { a.href = 'tel:' + s.phone; if (/\d{6,}/.test(a.textContent)) a.textContent = a.textContent.replace(/0\d{9,10}/, s.phone); });
  if (s.instagram) $$('a[href*="instagram.com"]').forEach(a => a.href = s.instagram);
  if (s.facebook) $$('a[href*="facebook.com"]').forEach(a => a.href = s.facebook);
  const rail = $('.social-rail');
  if (rail) {
    const add = (cls, href, label, svg) => { if (href && !$('.' + cls, rail)) rail.insertAdjacentHTML('afterbegin', `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener" aria-label="${label}">${svg}</a>`); };
    add('sr-yt', s.youtube, 'YouTube', '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.200 5 12 5 12 5s-6.200 0-7.800.4A2.500 2.500 0 0 0 2.400 7.200C2 8.800 2 12 2 12s0 3.200.4 4.800a2.500 2.500 0 0 0 1.800 1.800C5.800 19 12 19 12 19s6.200 0 7.800-.4a2.500 2.500 0 0 0 1.800-1.800c.4-1.600.4-4.800.4-4.800s0-3.200-.4-4.800zM10 15V9l5.200 3z"/></svg>');
    add('sr-tt', s.tiktok, 'TikTok', '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16.600 2h-3.100v13.200a2.800 2.800 0 1 1-2.800-2.800c.3 0 .5 0 .8.100V9.400a5.900 5.900 0 1 0 5.100 5.800V8.800a7 7 0 0 0 4 1.300V7a4 4 0 0 1-4-5z"/></svg>');
  }
  if (s.email) { const col = $$('.footer-col')[1]; if (col && !$('.f-mail', col)) col.insertAdjacentHTML('beforeend', `<a class="f-mail" href="mailto:${esc(s.email)}">✉️ ${esc(s.email)}</a>`); }
  if (s.banner && !$('.promo-banner')) document.body.insertAdjacentHTML('afterbegin', `<div class="promo-banner">📣 ${esc(s.banner)}</div>`);
  if (s.tawk && !window.__tawk) {
    window.__tawk = 1; const id = String(s.tawk).match(/[a-f0-9]{20,}\/[\w-]+/i);
    if (id) { const sc = document.createElement('script'); sc.async = true; sc.src = 'https://embed.tawk.to/' + id[0]; sc.charset = 'UTF-8'; sc.setAttribute('crossorigin', '*'); document.body.appendChild(sc); }
  }
}

/* ---------- cart ---------- */
function loadCart() { try { BJ.cart = JSON.parse(localStorage.getItem('bj_cart') || '[]'); } catch (e) { BJ.cart = []; } }
function saveCart() { try { localStorage.setItem('bj_cart', JSON.stringify(BJ.cart)); } catch (e) { /* ignore */ } cartChanged(); }
const cartQty = id => (BJ.cart.find(i => i.id === id) || {}).qty || 0;
function setQty(id, q) {
  q = Math.max(0, Math.min(99, q));
  const i = BJ.cart.findIndex(x => x.id === id);
  if (q === 0) { if (i >= 0) BJ.cart.splice(i, 1); } else if (i >= 0) BJ.cart[i].qty = q; else BJ.cart.push({ id, qty: q });
  saveCart();
}
function cartLines() { return BJ.cart.map(i => ({ p: BJ.products.find(x => x.id === i.id), qty: i.qty })).filter(l => l.p); }
function cartTotals() {
  let items = 0, total = 0, unpriced = 0;
  cartLines().forEach(l => { items += l.qty; const n = num(l.p.price); if (n) total += n * l.qty; else unpriced++; });
  return { items, total, unpriced };
}
function toast(msg) {
  let t = $('#bjToast'); if (!t) { t = document.createElement('div'); t.id = 'bjToast'; t.className = 'bj-toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2200);
}
function stepperHTML(id, qty, cls = '') {
  return `<div class="stepper ${cls}" data-step="${id}"><button type="button" data-d="-1" aria-label="Less">−</button><span>${qty}</span><button type="button" data-d="1" aria-label="More">+</button></div>`;
}
function cardActions(p) {
  const out = p.stock === 'out', q = cartQty(p.id);
  const add = out ? `<button class="btn btn-gray" disabled>Out of stock</button>` :
    q ? stepperHTML(p.id, q, 'on-card') : `<button class="btn btn-gold add-cart" data-add="${p.id}">＋ Add to cart</button>`;
  return `${add}<button class="btn btn-blue" data-open="${p.id}">View</button>`;
}
function cardHTML(p) {
  const vids = productVideos(p), price = priceText(p);
  const badge = p.stock === 'out' ? `<span class="p-badge out">Sold out</span>` : p.featured ? `<span class="p-badge">⭐ Featured</span>` : '';
  return `<article class="p-card" data-id="${p.id}">
    <div class="p-media" data-open="${p.id}"><img src="${esc(firstImage(p))}" alt="${esc(p.name)}" loading="lazy">${badge}
      ${vids.length ? `<button class="p-vid-btn" data-video="${p.id}">▶ Video</button>` : ''}</div>
    <div class="p-body"><span class="p-cat">${esc(p.category || '')}</span>
      <h3 class="p-name" data-open="${p.id}">${esc(p.name)}</h3>
      ${price ? `<div class="p-price">${price}</div>` : `<div class="p-price call">📞 Call for price</div>`}
      <p class="p-desc">${esc(p.description || '')}</p>
      <div class="p-actions">${cardActions(p)}</div></div></article>`;
}
function cartChanged() {
  const t = cartTotals();
  $$('.cart-count').forEach(e => { e.textContent = t.items; e.hidden = !t.items; });
  const pill = $('#cartPill');
  if (pill) { pill.hidden = !t.items; pill.innerHTML = `🛒 View cart (${t.items})${t.total ? ' · ' + naira(t.total) : ''}`; }
  $$('.p-card').forEach(c => { const p = BJ.products.find(x => x.id === c.dataset.id); if (p) $('.p-actions', c).innerHTML = cardActions(p); });
  if (document.body.classList.contains('cart-open')) renderCart();
  if (pmCurrent) updateModalQty();
}

/* delegated clicks: cards, steppers, add buttons */
document.addEventListener('click', e => {
  const st = e.target.closest('.stepper button');
  if (st) { const id = st.closest('.stepper').dataset.step; const d = Number(st.dataset.d);
    if (id === '__modal') { pmQty = Math.max(1, Math.min(99, pmQty + d)); updateModalQty(true); } else setQty(id, cartQty(id) + d); return; }
  const add = e.target.closest('[data-add]'); if (add) { setQty(add.dataset.add, 1); toast('Added to cart 🛒'); return; }
  const vb = e.target.closest('[data-video]'); if (vb) { e.stopPropagation(); const p = BJ.products.find(x => x.id === vb.dataset.video); if (p) openProduct(p.id, 'video'); return; }
  const op = e.target.closest('[data-open]'); if (op) openProduct(op.dataset.open);
});

/* ---------- injected UI: cart drawer, product viewer, lightbox ---------- */
function injectUI() {
  document.body.insertAdjacentHTML('beforeend', `
  <button class="cart-pill" id="cartPill" hidden></button>
  <div class="drawer" id="cartDrawer" aria-hidden="true"><div class="drawer-bg" data-dclose></div>
    <aside class="drawer-card"><div class="drawer-head"><h3>🛒 Your Cart</h3><button class="modal-close static" data-dclose aria-label="Close">✕</button></div>
      <div class="drawer-body" id="cartBody"></div>
      <div class="drawer-foot" id="cartFoot"></div></aside></div>
  <div class="modal" id="pModal" aria-hidden="true"><div class="modal-backdrop" data-close></div>
    <div class="modal-card pm2" role="dialog" aria-modal="true"><button class="modal-close" data-close aria-label="Close">✕</button>
      <div class="pm2-grid"><div class="pm2-gallery"><div class="pm2-stage" id="pmStage"></div><div class="pm2-thumbs" id="pmThumbs"></div></div>
        <div class="pm2-info"><span class="pm-cat" id="pmCat"></span><h3 id="pmName"></h3><div class="pm-price" id="pmPrice"></div>
          <div class="pm2-stock" id="pmStock"></div><p class="pm-desc" id="pmDesc"></p>
          <div class="pm2-qty"><span>Quantity</span>${stepperHTML('__modal', 1)}</div>
          <div class="pm2-total" id="pmTotal"></div>
          <div class="pm2-actions"><button class="btn btn-gold" id="pmAdd">🛒 Add to cart</button><a class="btn btn-wa" id="pmOrder" target="_blank" rel="noopener">💬 Order on WhatsApp</a></div>
          <div class="pm-note">✅ Direct importer prices · 🚚 Nationwide delivery · 📍 Alaba International Market, Lagos</div></div></div></div></div>
  <div class="modal" id="videoModal" aria-hidden="true"><div class="modal-backdrop" data-close></div>
    <div class="modal-card video-card"><button class="modal-close" data-close aria-label="Close">✕</button><h3 id="vmTitle" class="vm-title"></h3><div class="vm-stage" id="vmStage"></div></div></div>
  <div class="lightbox" id="lb" hidden><button class="lb-x" aria-label="Close">✕</button><button class="lb-nav lb-prev">‹</button><img id="lbImg" alt=""><button class="lb-nav lb-next">›</button></div>`);
  $('#cartPill').addEventListener('click', openCart);
  $$('[data-dclose]').forEach(e => e.addEventListener('click', closeCart));
  $$('#pModal [data-close], #videoModal [data-close]').forEach(e => e.addEventListener('click', closeModals));
  $('#pmAdd').addEventListener('click', () => { if (!pmCurrent) return; setQty(pmCurrent.id, cartQty(pmCurrent.id) + pmQty); toast(`${pmQty} added to cart 🛒`); closeModals(); });
  $('.lb-x').addEventListener('click', closeLB);
  $('.lb-prev').addEventListener('click', () => lbStep(-1)); $('.lb-next').addEventListener('click', () => lbStep(1));
  $('#lbImg').addEventListener('click', e => e.target.classList.toggle('zoom'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeLB(); closeModals(); closeCart(); } });
  // header cart button + hamburger
  const hi = $('.header-inner');
  if (hi) {
    hi.insertAdjacentHTML('beforeend', `<a class="head-call" href="tel:08149439431" aria-label="Call us">📞</a><button class="cart-btn" id="cartBtn" aria-label="Cart">🛒<span class="cart-count" hidden>0</span></button>`);
    $('#cartBtn').addEventListener('click', openCart);
    const hb = $('#hamburger'), nav = $('#nav');
    if (hb && nav) { hb.addEventListener('click', () => { nav.classList.toggle('open'); hb.classList.toggle('open'); }); $$('a', nav).forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); hb.classList.remove('open'); })); }
  }
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
}

/* cart drawer */
function openCart() { renderCart(); $('#cartDrawer').classList.add('open'); document.body.classList.add('cart-open'); document.body.style.overflow = 'hidden'; }
function closeCart() { $('#cartDrawer').classList.remove('open'); document.body.classList.remove('cart-open'); if (!$('#pModal.open')) document.body.style.overflow = ''; }
function renderCart() {
  const lines = cartLines(), body = $('#cartBody'), foot = $('#cartFoot');
  if (!lines.length) { body.innerHTML = `<div class="cart-empty"><div>🛒</div><p>Your cart is empty</p><button class="btn btn-gold" data-dclose2>Continue shopping</button></div>`; foot.innerHTML = ''; const b = $('[data-dclose2]', body); if (b) b.onclick = closeCart; return; }
  body.innerHTML = lines.map(({ p, qty }) => { const n = num(p.price); return `<div class="cart-line">
    <img src="${esc(firstImage(p))}" alt=""><div class="cl-info"><b>${esc(p.name)}</b><small>${n ? naira(n) + ' each' : 'Price on request'}</small>
    ${stepperHTML(p.id, qty)}</div><div class="cl-right"><b>${n ? naira(n * qty) : ''}</b><button class="cl-del" data-step-del="${p.id}" aria-label="Remove">🗑</button></div></div>`; }).join('');
  $$('[data-step-del]', body).forEach(b => b.onclick = () => setQty(b.dataset.stepDel, 0));
  const t = cartTotals();
  foot.innerHTML = `<div class="cart-total"><span>Total${t.unpriced ? ' (priced items)' : ''}</span><b>${naira(t.total)}</b></div>
    ${t.unpriced ? '<small class="cart-note">Items without a price will be quoted on WhatsApp.</small>' : ''}
    ${BJ.settings.bankAccount ? `<div class="bank-box"><b>🏦 Pay by bank transfer</b><div>${esc(BJ.settings.bankName || '')}</div><div class="bank-no"><span>${esc(BJ.settings.bankAccount)}</span><button type="button" id="coCopy">Copy</button></div><small>${esc(BJ.settings.bankAccountName || '')}</small><small>After paying, send your receipt screenshot on WhatsApp.</small></div>` : ''}
    <input id="coName" placeholder="Your name"><input id="coLoc" placeholder="Delivery location / state">
    <button class="btn btn-wa wide" id="coSend">💬 Send Order on WhatsApp</button>
    <button class="btn-link" id="coClear">Clear cart</button>`;
  $('#coName').value = localStorage.getItem('bj_name') || ''; $('#coLoc').value = localStorage.getItem('bj_loc') || '';
  const cp = $('#coCopy'); if (cp) cp.onclick = () => { (navigator.clipboard ? navigator.clipboard.writeText(BJ.settings.bankAccount) : Promise.reject()).then(() => toast('Account number copied ✅')).catch(() => toast(BJ.settings.bankAccount)); };
  $('#coClear').onclick = () => { BJ.cart = []; saveCart(); };
  $('#coSend').onclick = () => {
    const name = $('#coName').value.trim(), loc = $('#coLoc').value.trim();
    try { localStorage.setItem('bj_name', name); localStorage.setItem('bj_loc', loc); } catch (e) { /* ignore */ }
    const rows = cartLines().map(({ p, qty }, i) => { const n = num(p.price); return `${i + 1}. ${p.name} × ${qty}${n ? ' — ' + naira(n * qty) : ' — price on request'}`; });
    const msg = `Hello ${BRAND}, I want to order:\n\n${rows.join('\n')}\n\nTotal: ${naira(t.total)}${t.unpriced ? ' + items to be quoted' : ''}${name ? '\nName: ' + name : ''}${loc ? '\nLocation: ' + loc : ''}${BJ.settings.bankAccount ? '\nPayment: bank transfer' : ''}\n\nPlease confirm availability. Thank you!`;
    window.open(waLink(msg), '_blank');
  };
}

/* product viewer */
let pmCurrent = null, pmQty = 1, pmItems = [], pmIdx = 0;
function openProduct(id, startOn) {
  const p = BJ.products.find(x => x.id === id); if (!p) return;
  pmCurrent = p; pmQty = 1;
  pmItems = productImages(p).map(src => ({ k: 'img', src })).concat(productVideos(p).map(v => ({ k: 'vid', v })));
  pmIdx = startOn === 'video' ? Math.max(0, pmItems.findIndex(i => i.k === 'vid')) : 0;
  $('#pmCat').textContent = p.category || 'Product'; $('#pmName').textContent = p.name;
  const price = priceText(p); const pe = $('#pmPrice'); pe.textContent = price || '📞 Call for price'; pe.className = 'pm-price' + (price ? '' : ' call');
  $('#pmDesc').textContent = p.description || 'Contact us for details, wholesale prices and available units.';
  const out = p.stock === 'out';
  $('#pmStock').innerHTML = out ? '<span class="stock out">● Out of stock</span>' : '<span class="stock in">● In stock</span>';
  $('#pmAdd').disabled = out;
  const hasVid = productVideos(p).length > 0;
  $('#pmOrder').href = waLink(`Hello ${BRAND}, I want to order:\n• ${p.name} × ${pmQty}${price ? '\n• Price: ' + price : ''}\nPlease confirm availability.`);
  $('#pmThumbs').innerHTML = pmItems.map((it, i) => it.k === 'img' ? `<button data-ti="${i}"><img src="${esc(it.src)}" alt=""></button>` : `<button data-ti="${i}" class="vthumb"><span>▶</span></button>`).join('')
    + (hasVid ? '' : `<a class="vthumb ask" target="_blank" rel="noopener" href="${waLink(`Hello ${BRAND}, please send me a video of: ${p.name}`)}"><span>🎬</span><small>Ask video</small></a>`);
  $$('#pmThumbs [data-ti]').forEach(b => b.onclick = () => showItem(Number(b.dataset.ti)));
  showItem(pmIdx); updateModalQty();
  $('#pModal').classList.add('open'); $('#pModal').setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
}
function showItem(i) {
  pmIdx = i; const it = pmItems[i], st = $('#pmStage');
  if (it.k === 'img') { st.innerHTML = `<img src="${esc(it.src)}" alt="${esc(pmCurrent.name)}"><button class="zoom-hint" aria-label="Zoom">⤢ Tap to zoom</button>`; st.onclick = () => openLB(i); }
  else { st.onclick = null; st.innerHTML = videoEmbed(it.v, true); }
  $$('#pmThumbs [data-ti]').forEach(b => b.classList.toggle('active', Number(b.dataset.ti) === i));
}
function updateModalQty(fromStep) {
  if (!pmCurrent) return;
  const sp = $('#pModal .stepper span'); if (sp) sp.textContent = pmQty;
  const n = num(pmCurrent.price); $('#pmTotal').textContent = n ? `Total: ${naira(n * pmQty)}` : '';
  const q = cartQty(pmCurrent.id); $('#pmAdd').textContent = q ? `🛒 Add more (${q} in cart)` : '🛒 Add to cart';
  $('#pmOrder').href = waLink(`Hello ${BRAND}, I want to order:\n• ${pmCurrent.name} × ${pmQty}${n ? '\n• Total: ' + naira(n * pmQty) : ''}\nPlease confirm availability.`);
}
function openVideo(p, v) {
  $('#vmTitle').textContent = p.name + ' — video'; $('#vmStage').innerHTML = videoEmbed(v, true);
  $('#videoModal').classList.add('open'); document.body.style.overflow = 'hidden';
}
function closeModals() {
  $$('.modal').forEach(m => { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); });
  $('#vmStage').innerHTML = ''; $('#pmStage').innerHTML = ''; pmCurrent = null;
  if (!document.body.classList.contains('cart-open')) document.body.style.overflow = '';
}
/* lightbox (full picture, tap to zoom) */
let lbList = [], lbI = 0;
function openLB(i) { lbList = pmItems.filter(x => x.k === 'img').map(x => x.src); lbI = Math.min(i, lbList.length - 1); lbShow(); $('#lb').hidden = false; }
function lbShow() { const im = $('#lbImg'); im.classList.remove('zoom'); im.src = lbList[lbI]; $('.lb-prev').hidden = $('.lb-next').hidden = lbList.length < 2; }
function lbStep(d) { lbI = (lbI + d + lbList.length) % lbList.length; lbShow(); }
function closeLB() { const l = $('#lb'); if (l) l.hidden = true; }

/* ---------- PWA: service worker + install prompt ---------- */
let deferredInstall = null;
function initPWA() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (standalone || localStorage.getItem('bj_install_dismissed')) return;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const bar = (html) => { document.body.insertAdjacentHTML('beforeend', `<div class="install-bar" id="installBar">${html}<button class="ib-x" aria-label="Dismiss">✕</button></div>`);
    $('.ib-x').onclick = () => { localStorage.setItem('bj_install_dismissed', '1'); $('#installBar').remove(); }; };
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; if ($('#installBar')) return;
    bar(`<span>📲 Install the Big Jeff Solar app</span><button class="btn btn-gold" id="ibGo">Install</button>`);
    $('#ibGo').onclick = async () => { deferredInstall.prompt(); await deferredInstall.userChoice; $('#installBar') && $('#installBar').remove(); }; });
  if (ios) setTimeout(() => bar(`<span>📲 Install app: tap <b>Share</b> then <b>Add to Home Screen</b></span>`), 4000);
}

async function coreInit() {
  loadCart(); injectUI(); initPWA();
  await loadData(); cartChanged();
}
