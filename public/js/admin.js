/* BIG JEFF SOLAR — Admin app (runs in your phone; publishes to GitHub -> Vercel) */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const slugify = s => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const LS = 'bj_admin_cfg';
let cfg = null; try { cfg = JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) { /* ignore */ }
const A = { data: null, orig: {}, prev: {}, pending: {}, removed: new Set(), tab: 'home', q: '' };
const FILES = { products: 'public/data/products.json', categories: 'public/data/categories.json', catImages: 'public/data/category-images.json', spotlight: 'public/data/spotlight.json', settings: 'public/data/settings.json' };
const DEF = () => ({ products: [], categories: [], catImages: {}, settings: {}, spotlight: { enabled: false, badge: '✨ NEW ARRIVAL', title: '', description: '', price: '', buttonText: '💬 Order on WhatsApp', video: null } });
const MAX_VIDEO_MB = 25;
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; if (A.data) render(); });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

/* ---------- ui helpers ---------- */
function toast(m, bad) { const t = $('#toast'); t.textContent = m; t.classList.toggle('bad', !!bad); t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 3200); }
function busy(msg) { $('#busy').classList.toggle('on', !!msg); if (msg) $('#busyTxt').textContent = msg; }
const src = p => A.prev[p] || p;
const money = v => { const n = parseFloat(String(v || '').replace(/[^\d.]/g, '')); return n ? '₦' + n.toLocaleString('en-NG') : 'Ask for price'; };
window.addEventListener('beforeunload', e => { if (dirtyCount()) { e.preventDefault(); e.returnValue = ''; } });

/* ---------- GitHub ---------- */
const GH = 'https://api.github.com';
function hdr(extra) { return { Authorization: 'Bearer ' + cfg.token, Accept: 'application/vnd.github+json', ...extra }; }
async function gh(path, method, body) {
  const r = await fetch(GH + path, { method: method || 'GET', headers: hdr(body ? { 'Content-Type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(r.status === 401 ? 'GitHub rejected the token. Check it and try again.' : r.status === 403 ? 'Token has no permission. Give it Contents: Read and write.' : r.status === 404 ? 'Repository not found. Check the name and token access.' : (e.message || 'GitHub error ' + r.status)); }
  return r.json();
}
async function readFile(path) {
  const r = await fetch(`${GH}/repos/${cfg.repo}/contents/${path}?ref=${encodeURIComponent(cfg.branch)}`, { headers: hdr({ Accept: 'application/vnd.github.raw+json' }), cache: 'no-store' });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(r.status === 401 ? 'GitHub rejected the token.' : 'Could not read ' + path);
  return r.text();
}
async function loadAll() {
  busy('Loading your shop…');
  try {
    const d = {};
    for (const k in FILES) { const t = await readFile(FILES[k]); d[k] = t ? JSON.parse(t) : DEF()[k]; }
    A.data = d; A.orig = Object.fromEntries(Object.entries(d).map(([k, v]) => [k, JSON.stringify(v)]));
    A.pending = {}; A.removed = new Set();
  } finally { busy(false); }
}

/* ---------- change tracking + publish ---------- */
const changedKeys = () => Object.keys(FILES).filter(k => JSON.stringify(A.data[k]) !== A.orig[k]);
const isRef = p => Object.values(A.data).some(v => JSON.stringify(v).includes(p));
const pendingMedia = () => Object.keys(A.pending).filter(isRef);
const dirtyCount = () => A.data ? changedKeys().length + pendingMedia().length : 0;
function dropMedia(p) { if (!p || !p.startsWith('/uploads/')) return; if (A.pending[p]) delete A.pending[p]; else A.removed.add(p); }
async function publish() {
  const keys = changedKeys(), media = pendingMedia();
  const dels = [...A.removed].filter(p => !isRef(p) && !A.pending[p]);
  if (!keys.length && !media.length && !dels.length) return toast('Nothing to publish');
  busy('Publishing… do not close this page');
  try {
    const ref = await gh(`/repos/${cfg.repo}/git/ref/heads/${cfg.branch}`);
    const head = ref.object.sha; const commit = await gh(`/repos/${cfg.repo}/git/commits/${head}`);
    const tree = [];
    let n = 0; const total = keys.length + media.length;
    for (const k of keys) {
      busy(`Uploading ${++n} of ${total}…`);
      const b = await gh(`/repos/${cfg.repo}/git/blobs`, 'POST', { content: JSON.stringify(A.data[k], null, 2) + '\n', encoding: 'utf-8' });
      tree.push({ path: FILES[k], mode: '100644', type: 'blob', sha: b.sha });
    }
    for (const p of media) {
      busy(`Uploading ${++n} of ${total}…`);
      const b = await gh(`/repos/${cfg.repo}/git/blobs`, 'POST', { content: A.pending[p].b64, encoding: 'base64' });
      tree.push({ path: 'public' + p, mode: '100644', type: 'blob', sha: b.sha });
    }
    dels.forEach(p => tree.push({ path: 'public' + p, mode: '100644', type: 'blob', sha: null }));
    busy('Saving to your website…');
    const nt = await gh(`/repos/${cfg.repo}/git/trees`, 'POST', { base_tree: commit.tree.sha, tree });
    const nc = await gh(`/repos/${cfg.repo}/git/commits`, 'POST', { message: 'Admin update ' + new Date().toISOString().slice(0, 16).replace('T', ' '), tree: nt.sha, parents: [head] });
    await gh(`/repos/${cfg.repo}/git/refs/heads/${cfg.branch}`, 'PATCH', { sha: nc.sha });
    keys.forEach(k => { A.orig[k] = JSON.stringify(A.data[k]); });
    media.forEach(p => { delete A.pending[p]; }); A.removed = new Set();
    toast('✅ Published! Live in about 1 minute');
  } catch (e) { toast(e.message, true); } finally { busy(false); render(); }
}

/* ---------- media processing ---------- */
function fileToJPEG(file, max = 1400, q = 0.82) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const r = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
      c.width = Math.round(im.width * r); c.height = Math.round(im.height * r);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
      const data = c.toDataURL('image/jpeg', q); URL.revokeObjectURL(url); res({ b64: data.split(',')[1], dataUrl: data });
    };
    im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Could not read that photo. Try a JPG or PNG.')); };
    im.src = url;
  });
}
function fileToB64(file) { return new Promise((res, rej) => { const f = new FileReader(); f.onload = () => res({ b64: String(f.result).split(',')[1], dataUrl: URL.createObjectURL(file) }); f.onerror = () => rej(new Error('Could not read video')); f.readAsDataURL(file); }); }
async function addImage(file, folder, name) {
  const { b64, dataUrl } = await fileToJPEG(file);
  const path = `/uploads/${folder}/${name || uid()}-${uid()}.jpg`; A.pending[path] = { b64 }; A.prev[path] = dataUrl; return path;
}
async function addVideoFile(file) {
  if (file.size > MAX_VIDEO_MB * 1048576) throw new Error(`Video is ${(file.size / 1048576).toFixed(0)}MB. Max is ${MAX_VIDEO_MB}MB. Paste a YouTube/TikTok link instead.`);
  const ext = (file.name.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
  const { b64, dataUrl } = await fileToB64(file);
  const path = `/uploads/videos/${uid()}.${ext}`; A.pending[path] = { b64 }; A.prev[path] = dataUrl; return path;
}
function parseVideoLink(u) {
  u = String(u || '').trim(); if (!u) return null;
  let m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/);
  if (m) return { type: 'youtube', id: m[1], shorts: /shorts\//.test(u) };
  m = u.match(/tiktok\.com\/.*\/video\/(\d+)/); if (m) return { type: 'tiktok', id: m[1] };
  if (/tiktok\.com/.test(u)) throw new Error('Use the full TikTok link (short vm.tiktok.com links do not work). Open the video in a browser and copy that link.');
  if (/facebook\.com|fb\.watch/.test(u)) return { type: 'facebook', url: u };
  if (/\.(mp4|webm|mov)(\?|$)/i.test(u)) return { type: 'file', url: u };
  throw new Error('Link not recognised. Use YouTube, TikTok, Facebook or a direct .mp4 link.');
}
const vLabel = v => { v = typeof v === 'string' ? { type: 'file', url: v } : v; return { youtube: '▶ YouTube', tiktok: '▶ TikTok', facebook: '▶ Facebook', file: '🎞 Video file' }[v.type] || 'Video'; };
const vPath = v => (!v ? '' : typeof v === 'string' ? v : v.type === 'file' ? v.url : '');

/* ---------- views ---------- */
const TABS = [['home', '🏠', 'Home'], ['products', '📦', 'Products'], ['cats', '🏷️', 'Categories'], ['spot', '🎬', 'Spotlight'], ['set', '⚙️', 'Settings']];
function render() {
  const app = $('#app');
  if (!cfg || !A.data) { app.innerHTML = connectView(); bindConnect(); return; }
  const n = dirtyCount();
  app.innerHTML = `
  <div class="top"><img src="/assets/logo.png" alt=""><div><b>Big Jeff Admin</b><small>Full control panel</small></div><div class="sp"></div><a class="pill" href="/" target="_blank">🌐 View site</a></div>
  <main id="view"></main>
  <div class="pubbar ${n ? 'on' : ''}"><span>📝 ${n} change${n === 1 ? '' : 's'} not published</span><button class="btn gold sm" id="pubBtn">🚀 Publish changes</button></div>
  <nav class="nav">${TABS.map(([k, i, l]) => `<button data-tab="${k}" class="${A.tab === k ? 'on' : ''}"><i>${i}</i>${l}</button>`).join('')}</nav>`;
  $$('[data-tab]').forEach(b => b.onclick = () => { A.tab = b.dataset.tab; A.q = ''; render(); scrollTo(0, 0); });
  $('#pubBtn').onclick = publish;
  ({ home: viewHome, products: viewProducts, cats: viewCats, spot: viewSpot, set: viewSettings })[A.tab]($('#view'));
}

function connectView() {
  return `<div class="connect"><div class="box"><div class="hero"><h1>🔐 Connect your shop</h1><p>One-time setup. Your changes save straight to your website.</p></div>
  <div class="card"><label class="l">GitHub repository (owner/name)</label><input type="text" id="cRepo" placeholder="yourname/bigjeff-solar" value="${esc(cfg?.repo || '')}" autocapitalize="off" autocorrect="off">
  <label class="l">Branch</label><input type="text" id="cBranch" value="${esc(cfg?.branch || 'main')}" autocapitalize="off">
  <label class="l">GitHub token</label><input type="password" id="cToken" placeholder="github_pat_…" value="${esc(cfg?.token || '')}" autocapitalize="off">
  <button class="btn gold full" id="cGo" style="margin-top:1rem">Connect</button></div>
  <div class="card"><h3>How to get a token (2 minutes)</h3><ol class="steps">
  <li>Open <b>github.com</b> → your profile picture → <b>Settings</b></li><li><b>Developer settings</b> → <b>Personal access tokens</b> → <b>Fine-grained tokens</b> → <b>Generate new token</b></li>
  <li>Name it <b>Big Jeff Admin</b>, expiration <b>1 year</b></li><li>Repository access: <b>Only select repositories</b> → pick your shop repo</li>
  <li>Permissions → Repository → <b>Contents: Read and write</b></li><li><b>Generate token</b>, copy it and paste above</li></ol>
  <p class="sm-note">The token stays only on this phone. Anyone without it cannot change your shop.</p></div></div></div>`;
}
function bindConnect() {
  $('#cGo').onclick = async () => {
    const c = { repo: $('#cRepo').value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/$/, ''), branch: $('#cBranch').value.trim() || 'main', token: $('#cToken').value.trim() };
    if (!/^[\w.-]+\/[\w.-]+$/.test(c.repo) || !c.token) return toast('Enter repo as owner/name and your token', true);
    cfg = c; busy('Connecting…');
    try { await gh(`/repos/${c.repo}`); localStorage.setItem(LS, JSON.stringify(c)); await loadAll(); toast('Connected ✅'); }
    catch (e) { cfg = null; toast(e.message, true); } finally { busy(false); render(); }
  };
}

function viewHome(v) {
  const P = A.data.products, vids = P.filter(p => (p.videos || []).length).length, out = P.filter(p => p.stock === 'out').length;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent), standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  v.innerHTML = `<div class="hero"><h1>Welcome back, Jeff 👋</h1><p>Manage everything on your shop from here.</p></div>
  <div class="stats"><div class="stat"><b>${P.length}</b><span>Products</span></div><div class="stat"><b>${A.data.categories.length}</b><span>Categories</span></div>
  <div class="stat"><b>${vids}</b><span>With video</span></div><div class="stat"><b>${out}</b><span>Out of stock</span></div></div>
  <div class="card"><h3>⚡ Quick actions</h3><div class="row"><button class="btn gold" id="qAdd">＋ Add product</button><button class="btn blue" id="qSpot">🎬 Spotlight</button><button class="btn ghost" id="qCat">🏷️ Categories</button></div></div>
  <div class="card"><h3>🎬 Spotlight</h3><p class="sm-note">${A.data.spotlight.enabled && A.data.spotlight.video ? '✅ Live on your home page: ' + esc(A.data.spotlight.title || 'untitled') : 'Not showing. Add a video in the Spotlight tab.'}</p></div>
  ${standalone ? '' : `<div class="card"><h3>📲 Add this admin to your phone</h3>${deferredInstall ? '<button class="btn gold" id="inst">Install app</button>' : ios ? '<p class="sm-note">Tap the <b>Share</b> button in Safari, then <b>Add to Home Screen</b>.</p>' : '<p class="sm-note">Open the browser menu (⋮) and tap <b>Install app</b> or <b>Add to Home screen</b>.</p>'}</div>`}
  <div class="card"><h3>ℹ️ How publishing works</h3><p class="sm-note">Make changes, then tap <b>Publish changes</b>. Your website updates about a minute later.</p></div>`;
  $('#qAdd').onclick = () => { A.tab = 'products'; render(); openProduct(); };
  $('#qSpot').onclick = () => { A.tab = 'spot'; render(); }; $('#qCat').onclick = () => { A.tab = 'cats'; render(); };
  const i = $('#inst'); if (i) i.onclick = async () => { deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; render(); };
}

/* ----- products ----- */
function viewProducts(v) {
  const q = A.q.toLowerCase();
  const list = A.data.products.filter(p => !q || (p.name + ' ' + p.category).toLowerCase().includes(q)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  v.innerHTML = `<h2 class="t">My <span>Products</span></h2>
  <div class="row" style="margin-bottom:1rem"><input type="search" id="pq" placeholder="Search products…" value="${esc(A.q)}" style="flex:1"><button class="btn gold" id="pAdd">＋ Add</button></div>
  <p class="sm-note" style="margin-bottom:.8rem">${list.length} product${list.length === 1 ? '' : 's'}</p>
  ${list.map(p => `<div class="list-item"><img class="th" src="${esc(src((p.images || [])[0] || '/assets/logo.png'))}" alt="">
  <div class="inf"><b>${esc(p.name)}</b><small>${esc(p.category)} · ${money(p.price)}</small><div>${p.stock === 'out' ? '<span class="chip out">Sold out</span>' : ''}${p.featured ? '<span class="chip ft">★ Featured</span>' : ''}${(p.videos || []).length ? '<span class="chip vd">▶ Video</span>' : ''}</div></div>
  <button class="btn ghost sm" data-edit="${p.id}">Edit</button></div>`).join('') || '<div class="card">No products found.</div>'}`;
  $('#pq').oninput = e => { A.q = e.target.value; const pos = e.target.selectionStart; viewProducts(v); const n = $('#pq'); n.focus(); n.setSelectionRange(pos, pos); };
  $('#pAdd').onclick = () => openProduct();
  $$('[data-edit]').forEach(b => b.onclick = () => openProduct(b.dataset.edit));
}
let ed = null, edIsNew = false;
function openProduct(id) {
  const cur = A.data.products.find(p => p.id === id);
  edIsNew = !cur;
  ed = cur ? JSON.parse(JSON.stringify(cur)) : { id: 'p-' + uid(), name: '', category: A.data.categories[0] || '', price: '', description: '', featured: false, stock: 'in', tags: '', images: [], videos: [], createdAt: Date.now() };
  ed.videos = (ed.videos || []).map(x => typeof x === 'string' ? { type: 'file', url: x } : x);
  drawEditor();
}
function sheet() { let s = $('#sheet'); if (!s) { document.body.insertAdjacentHTML('beforeend', '<div class="sheet" id="sheet"></div>'); s = $('#sheet'); } return s; }
function closeSheet() { const s = $('#sheet'); if (s) { s.classList.remove('on'); s.innerHTML = ''; } document.body.style.overflow = ''; }
function drawEditor() {
  const s = sheet(); s.classList.add('on'); document.body.style.overflow = 'hidden';
  const keep = { name: $('#eName')?.value, price: $('#ePrice')?.value, desc: $('#eDesc')?.value };
  s.innerHTML = `<div class="bar"><button class="btn ghost sm" id="eBack">← Back</button><b>${edIsNew ? 'Add product' : 'Edit product'}</b><button class="btn gold sm" id="eSave">Save</button></div>
  <div class="in"><label class="l">Product name *</label><input type="text" id="eName" value="${esc(keep.name ?? ed.name)}" placeholder="e.g. 600W Solar Street Light">
  <label class="l">Category *</label><select id="eCat">${A.data.categories.map(c => `<option ${c === ed.category ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
  <label class="l">Price (₦) — leave empty for “Call for price”</label><input type="text" id="ePrice" inputmode="numeric" value="${esc(keep.price ?? ed.price)}" placeholder="e.g. 185000">
  <label class="l">Description</label><textarea id="eDesc" rows="4" placeholder="Describe the product…">${esc(keep.desc ?? ed.description)}</textarea>
  <label class="l">Availability</label><select id="eStock"><option value="in" ${ed.stock !== 'out' ? 'selected' : ''}>In stock</option><option value="out" ${ed.stock === 'out' ? 'selected' : ''}>Out of stock</option></select>
  <div class="switch" style="margin-top:1rem"><input type="checkbox" id="eFeat" ${ed.featured ? 'checked' : ''}><label for="eFeat">⭐ Featured product</label></div>
  <label class="l">Photos (first one is the cover)</label>
  <div class="pgrid">${ed.images.map((p, i) => `<div class="pcell ${i === 0 ? 'cover' : ''}"><img src="${esc(src(p))}" alt="">${i === 0 ? '<span class="cv">COVER</span>' : ''}<div class="tools"><button data-im="l${i}">◀</button><button data-im="d${i}">🗑</button><button data-im="r${i}">▶</button></div></div>`).join('')}</div>
  <label class="drop"><span style="font-size:1.8rem">📷</span><b>Add photos</b><span>Choose several at once</span><input type="file" id="eImgs" accept="image/*" multiple></label>
  <label class="l">Videos (customers watch these on the product)</label>
  ${ed.videos.map((x, i) => `<div class="vrow"><span>${vLabel(x)} ${esc(x.type === 'file' ? x.url.split('/').pop() : x.id || x.url || '')}</span><button class="btn red sm" data-vd="${i}">Remove</button></div>`).join('')}
  <div class="row" style="margin-top:.6rem;flex-wrap:nowrap"><input type="url" id="eVLink" placeholder="Paste YouTube / TikTok / Facebook link" style="flex:1"><button class="btn blue sm" id="eVAdd">Add</button></div>
  <label class="drop"><span style="font-size:1.8rem">🎬</span><b>Upload video from phone</b><span>Up to ${MAX_VIDEO_MB}MB (MP4 works best)</span><input type="file" id="eVFile" accept="video/*"></label>
  ${edIsNew ? '' : '<button class="btn red full" id="eDel" style="margin-top:1.5rem">🗑 Delete this product</button>'}</div>`;
  $('#eBack').onclick = () => { if (confirm('Discard unsaved edits on this product?')) closeSheet(); };
  $('#eSave').onclick = saveProduct;
  $$('[data-im]').forEach(b => b.onclick = () => { const k = b.dataset.im[0], i = Number(b.dataset.im.slice(1)); syncEd();
    if (k === 'd') { dropMedia(ed.images[i]); ed.images.splice(i, 1); } else { const j = k === 'l' ? i - 1 : i + 1; if (j >= 0 && j < ed.images.length) [ed.images[i], ed.images[j]] = [ed.images[j], ed.images[i]]; } drawEditor(); });
  $('#eImgs').onchange = async e => { syncEd(); busy('Preparing photos…'); try { for (const f of e.target.files) ed.images.push(await addImage(f, 'images', slugify(ed.name || 'product').slice(0, 30))); } catch (er) { toast(er.message, true); } busy(false); drawEditor(); };
  $$('[data-vd]').forEach(b => b.onclick = () => { syncEd(); const x = ed.videos[Number(b.dataset.vd)]; dropMedia(vPath(x)); ed.videos.splice(Number(b.dataset.vd), 1); drawEditor(); });
  $('#eVAdd').onclick = () => { try { const v = parseVideoLink($('#eVLink').value); if (!v) return toast('Paste a video link first', true); syncEd(); ed.videos.push(v); drawEditor(); } catch (er) { toast(er.message, true); } };
  $('#eVFile').onchange = async e => { const f = e.target.files[0]; if (!f) return; syncEd(); busy('Reading video…'); try { ed.videos.push({ type: 'file', url: await addVideoFile(f) }); } catch (er) { toast(er.message, true); } busy(false); drawEditor(); };
  const del = $('#eDel'); if (del) del.onclick = () => { if (!confirm('Delete this product permanently?')) return; ed.images.forEach(dropMedia); ed.videos.forEach(x => dropMedia(vPath(x))); A.data.products = A.data.products.filter(p => p.id !== ed.id); closeSheet(); render(); toast('Product deleted. Publish to apply.'); };
}
function syncEd() { ed.name = $('#eName').value; ed.category = $('#eCat').value; ed.price = $('#ePrice').value; ed.description = $('#eDesc').value; ed.stock = $('#eStock').value; ed.featured = $('#eFeat').checked; }
function saveProduct() {
  syncEd(); ed.name = ed.name.trim();
  if (!ed.name) return toast('Product name is required', true);
  if (!ed.category) return toast('Pick a category (add one in Categories first)', true);
  ed.price = String(ed.price).trim();
  const i = A.data.products.findIndex(p => p.id === ed.id);
  if (i >= 0) A.data.products[i] = ed; else A.data.products.push(ed);
  closeSheet(); render(); toast('Saved. Tap Publish to go live 🚀');
}

/* ----- categories ----- */
function viewCats(v) {
  const C = A.data.categories, cnt = c => A.data.products.filter(p => p.category === c).length;
  v.innerHTML = `<h2 class="t">My <span>Categories</span></h2>
  <div class="card"><div class="row" style="flex-wrap:nowrap"><input type="text" id="nc" placeholder="New category name…" style="flex:1"><button class="btn gold sm" id="ncAdd">Add</button></div></div>
  ${C.map((c, i) => { const ph = A.data.catImages[slugify(c)]; return `<div class="list-item catrow"><label style="cursor:pointer;position:relative"><img class="th" src="${esc(ph ? src(ph) : '/assets/logo.png')}" alt="" style="${ph ? '' : 'opacity:.35'}"><input type="file" accept="image/*" data-cphoto="${i}" style="display:none"></label>
  <div class="inf"><b>${esc(c)}</b><small>${cnt(c)} products · tap picture to change photo</small></div>
  <div class="row" style="flex-wrap:nowrap;gap:.3rem"><button class="btn ghost sm" data-cup="${i}">↑</button><button class="btn ghost sm" data-cdn="${i}">↓</button><button class="btn ghost sm" data-cren="${i}">✏️</button><button class="btn red sm" data-cdel="${i}">🗑</button></div></div>`; }).join('')}`;
  $('#ncAdd').onclick = () => { const n = $('#nc').value.trim(); if (!n) return; if (C.some(c => c.toLowerCase() === n.toLowerCase())) return toast('Category already exists', true); C.push(n); render(); toast('Category added'); };
  $$('[data-cup]').forEach(b => b.onclick = () => { const i = +b.dataset.cup; if (i > 0) { [C[i], C[i - 1]] = [C[i - 1], C[i]]; render(); } });
  $$('[data-cdn]').forEach(b => b.onclick = () => { const i = +b.dataset.cdn; if (i < C.length - 1) { [C[i], C[i + 1]] = [C[i + 1], C[i]]; render(); } });
  $$('[data-cren]').forEach(b => b.onclick = () => { const i = +b.dataset.cren, old = C[i], nn = (prompt('Rename category', old) || '').trim(); if (!nn || nn === old) return;
    A.data.products.forEach(p => { if (p.category === old) p.category = nn; });
    const o = slugify(old), n2 = slugify(nn); if (A.data.catImages[o] && o !== n2) { A.data.catImages[n2] = A.data.catImages[o]; delete A.data.catImages[o]; }
    C[i] = nn; render(); toast('Renamed'); });
  $$('[data-cdel]').forEach(b => b.onclick = () => { const i = +b.dataset.cdel, c = C[i]; if (cnt(c)) return toast(`Move or delete the ${cnt(c)} product(s) in "${c}" first`, true);
    if (!confirm(`Delete category "${c}"?`)) return; const ph = A.data.catImages[slugify(c)]; if (ph) { dropMedia(ph); delete A.data.catImages[slugify(c)]; } C.splice(i, 1); render(); });
  $$('[data-cphoto]').forEach(inp => inp.onchange = async e => { const f = e.target.files[0]; if (!f) return; const c = C[+inp.dataset.cphoto]; busy('Preparing photo…');
    try { const old = A.data.catImages[slugify(c)]; const p = await addImage(f, 'categories', slugify(c)); if (old) dropMedia(old); A.data.catImages[slugify(c)] = p; } catch (er) { toast(er.message, true); } busy(false); render(); });
}

/* ----- spotlight ----- */
function viewSpot(v) {
  const s = A.data.spotlight, vid = s.video;
  v.innerHTML = `<h2 class="t">Home <span>Spotlight</span></h2>
  <div class="card"><p class="sm-note" style="margin:0 0 .8rem">A big video at the top of your home page. It plays by itself (muted) and visitors tap for sound.</p>
  <div class="switch"><input type="checkbox" id="sOn" ${s.enabled ? 'checked' : ''}><label for="sOn">Show Spotlight on website</label></div>
  <label class="l">Badge</label><input type="text" id="sBadge" value="${esc(s.badge)}" placeholder="✨ NEW ARRIVAL">
  <label class="l">Title</label><input type="text" id="sTitle" value="${esc(s.title)}" placeholder="e.g. Android TV Box">
  <label class="l">Description</label><textarea id="sDesc" rows="2">${esc(s.description)}</textarea>
  <label class="l">Price (optional)</label><input type="text" id="sPrice" value="${esc(s.price)}" placeholder="e.g. 85,000">
  <label class="l">Button text</label><input type="text" id="sBtn" value="${esc(s.buttonText)}">
  <label class="l">Video</label>
  ${vid ? `<div class="vrow"><span>${vLabel(vid)} ${esc(vid.type === 'file' ? vid.url.split('/').pop() : vid.id || '')}</span><button class="btn red sm" id="sRm">Remove</button></div>` : '<p class="sm-note">No video yet.</p>'}
  <div class="row" style="margin-top:.6rem;flex-wrap:nowrap"><input type="url" id="sLink" placeholder="Paste YouTube / TikTok / Facebook link" style="flex:1"><button class="btn blue sm" id="sLinkAdd">Use</button></div>
  <label class="drop"><span style="font-size:1.8rem">📱</span><b>Upload video from phone</b><span>Up to ${MAX_VIDEO_MB}MB (MP4 works best)</span><input type="file" id="sFile" accept="video/*"></label>
  <button class="btn gold full" id="sSave" style="margin-top:1.2rem">💾 Save Spotlight</button></div>`;
  const grab = () => { Object.assign(s, { enabled: $('#sOn').checked, badge: $('#sBadge').value.trim(), title: $('#sTitle').value.trim(), description: $('#sDesc').value.trim(), price: $('#sPrice').value.trim(), buttonText: $('#sBtn').value.trim() || '💬 Order on WhatsApp' }); };
  const rm = $('#sRm'); if (rm) rm.onclick = () => { grab(); dropMedia(vPath(s.video)); s.video = null; render(); };
  $('#sLinkAdd').onclick = () => { try { const x = parseVideoLink($('#sLink').value); if (!x) return toast('Paste a link first', true); grab(); dropMedia(vPath(s.video)); s.video = x; render(); toast('Video set. Tap Publish.'); } catch (e) { toast(e.message, true); } };
  $('#sFile').onchange = async e => { const f = e.target.files[0]; if (!f) return; grab(); busy('Reading video…'); try { const p = await addVideoFile(f); dropMedia(vPath(s.video)); s.video = { type: 'file', url: p }; } catch (er) { toast(er.message, true); } busy(false); render(); };
  $('#sSave').onclick = () => { grab(); render(); toast('Spotlight saved. Tap Publish 🚀'); };
}

/* ----- settings ----- */
function viewSettings(v) {
  const S = A.data.settings;
  const f = (k, label, ph, type) => `<label class="l">${label}</label><input type="${type || 'text'}" data-s="${k}" value="${esc(S[k] || '')}" placeholder="${ph}" autocapitalize="off">`;
  v.innerHTML = `<h2 class="t">Shop <span>Settings</span></h2>
  <div class="card"><h3>📞 Contact</h3>${f('whatsapp', 'WhatsApp number (with country code)', '2349025511941')}${f('phone', 'Phone number', '08149439431')}${f('email', 'Business email', 'you@email.com')}</div>
  <div class="card"><h3>🔗 Social links</h3>${f('instagram', 'Instagram link', 'https://instagram.com/…')}${f('facebook', 'Facebook link', 'https://facebook.com/…')}${f('tiktok', 'TikTok link', 'https://tiktok.com/@…')}${f('youtube', 'YouTube link', 'https://youtube.com/@…')}</div>
  <div class="card"><h3>🏦 Bank transfer details (shown at checkout)</h3>${f('bankName', 'Bank name', 'e.g. Sterling Bank')}${f('bankAccount', 'Account number', '0123456789')}${f('bankAccountName', 'Account name', 'Big Jeff Solar and Lightings')}</div>
  <div class="card"><h3>📣 Promo banner</h3>${f('banner', 'Message shown at the top of your site (empty = hidden)', 'e.g. Free installation this week!')}</div>
  <div class="card"><h3>💬 Live chat (Tawk.to)</h3>${f('tawk', 'Paste your Tawk.to widget code or ID', '6ad1a357…/default')}</div>
  <button class="btn gold full" id="setSave">💾 Save settings</button>
  <div class="card" style="margin-top:1rem"><h3>🔐 Connection</h3><p class="sm-note">Repository: <b>${esc(cfg.repo)}</b> (${esc(cfg.branch)})</p>
  <div class="row" style="margin-top:.7rem"><button class="btn ghost sm" id="reload">↻ Reload from website</button><button class="btn red sm" id="disc">Disconnect</button></div></div>`;
  $('#setSave').onclick = () => { $$('[data-s]').forEach(i => { S[i.dataset.s] = i.value.trim(); }); if (S.tawk) { const m = S.tawk.match(/[a-f0-9]{20,}\/[\w-]+/i); if (m) S.tawk = m[0]; } render(); toast('Settings saved. Tap Publish 🚀'); };
  $('#reload').onclick = async () => { if (dirtyCount() && !confirm('You have unpublished changes. Reload and lose them?')) return; try { await loadAll(); } catch (e) { toast(e.message, true); } render(); };
  $('#disc').onclick = () => { if (!confirm('Disconnect this phone from the shop?')) return; localStorage.removeItem(LS); cfg = null; A.data = null; render(); };
}

/* ---------- boot ---------- */
(async function () {
  if (cfg) { try { await loadAll(); } catch (e) { toast(e.message, true); A.data = null; } }
  render();
})();
