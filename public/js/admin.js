/* BIG JEFF SOLAR — Admin panel */
let TOKEN = localStorage.getItem('bj_token') || '';
let products = [];
let categories = [];
let editingId = null;
let removeImages = [];
let removeVideos = [];

const $ = id => document.getElementById(id);

function toast(msg, bad) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.toggle('bad', !!bad);
  t.classList.add('on');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('on'), 3200);
}
async function api(path, opts = {}) {
  const headers = {};
  if (TOKEN) headers.Authorization = 'Bearer ' + TOKEN;
  if (opts.body && !(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(opts.body);
  }
  const res = await fetch(path, { ...opts, headers });
  let data = null;
  try { data = await res.json(); } catch (e) { /* noop */ }
  if (!res.ok) {
    if (res.status === 401) { logout(false); }
    throw new Error((data && data.error) || 'Request failed');
  }
  return data;
}

/* ---------- auth ---------- */
function showApp() {
  $('loginView').style.display = 'none';
  $('appView').classList.add('on');
  refresh();
}
function logout(callApi) {
  TOKEN = '';
  localStorage.removeItem('bj_token');
  $('appView').classList.remove('on');
  $('loginView').style.display = 'grid';
  if (callApi !== false) toast('Logged out');
}
$('loginBtn').addEventListener('click', doLogin);
$('pw').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
async function doLogin() {
  const pw = $('pw').value;
  $('loginErr').textContent = '';
  try {
    const r = await api('/api/admin/login', { method: 'POST', body: { password: pw } });
    TOKEN = r.token;
    localStorage.setItem('bj_token', TOKEN);
    showApp();
    toast('Welcome back! 👋');
  } catch (e) {
    $('loginErr').textContent = e.message || 'Login failed';
  }
}
$('logoutBtn').addEventListener('click', () => logout(true));

/* ---------- refresh all ---------- */
async function refresh() {
  try {
    [products, categories] = await Promise.all([
      api('/api/products'),
      api('/api/categories')
    ]);
    renderStats();
    renderCatSelects();
    renderCatList();
    renderList();
  } catch (e) {
    toast(e.message, true);
  }
}

/* ---------- stats ---------- */
function renderStats() {
  const vids = products.filter(p => (p.videos || []).length).length;
  const photos = products.reduce((n, p) => n + ((p.images || []).length), 0);
  $('stats').innerHTML = `
    <div class="stat"><b>${products.length}</b><span>Products</span></div>
    <div class="stat g"><b>${categories.length}</b><span>Categories</span></div>
    <div class="stat"><b>${photos}</b><span>Photos</span></div>
    <div class="stat g"><b>${vids}</b><span>With video</span></div>`;
}

/* ---------- category selects/lists ---------- */
function renderCatSelects() {
  const f = $('fCategory');
  const prev = f.value;
  const newOpt = '__new__';
  f.innerHTML = categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('') +
    `<option value="${newOpt}">➕ Add new category…</option>`;
  if (prev && categories.includes(prev)) f.value = prev;

  const af = $('adminCatFilter');
  const prevA = af.value;
  af.innerHTML = `<option value="All">All categories</option>` +
    categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  if (prevA) af.value = prevA;
}
$('fCategory').addEventListener('change', e => {
  $('fNewCat').style.display = e.target.value === '__new__' ? 'block' : 'none';
});
function renderCatList() {
  $('catList').innerHTML = categories.map(c =>
    `<span class="badge vid" style="font-size:.75rem;padding:.3rem .6rem;display:inline-flex;gap:.4rem;align-items:center">
      ${escapeHtml(c)}
      <button data-delcat="${escapeHtml(c)}" style="border:0;background:none;color:#e5484d;font-weight:900;cursor:pointer">×</button>
    </span>`).join('');
  $('catList').querySelectorAll('[data-delcat]').forEach(b =>
    b.addEventListener('click', async () => {
      try {
        categories = await api('/api/admin/categories/' + encodeURIComponent(b.dataset.delcat), { method: 'DELETE' });
        renderCatSelects(); renderCatList(); toast('Category removed');
      } catch (e) { toast(e.message, true); }
    }));
}
$('addCatBtn').addEventListener('click', async () => {
  const name = $('newCatInput').value.trim();
  if (!name) return;
  try {
    categories = await api('/api/admin/categories', { method: 'POST', body: { name } });
    $('newCatInput').value = '';
    renderCatSelects(); renderCatList();
    toast('Category added');
  } catch (e) { toast(e.message, true); }
});

/* ---------- product list ---------- */
function renderList() {
  const q = ($('adminSearch').value || '').toLowerCase();
  const cat = $('adminCatFilter').value;
  let list = products.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  if (cat && cat !== 'All') list = list.filter(p => p.category === cat);
  if (q) list = list.filter(p => (p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));

  if (!list.length) {
    $('productList').innerHTML = `<div class="empty">No products yet. Use the form on the left to add your first product 🚀</div>`;
    return;
  }
  $('productList').innerHTML = list.map(p => {
    const img = (p.images || [])[0] || '/assets/logo.png';
    const nV = (p.videos || []).length;
    const nI = (p.images || []).length;
    return `
    <div class="p-item">
      <img src="${img}" alt="">
      <div>
        <h3>${escapeHtml(p.name)} ${p.featured ? '<span class="badge">⭐ featured</span>' : ''}</h3>
        <div class="meta">
          <b>${escapeHtml(p.category || '')}</b>
          ${p.price ? ' · ₦' + escapeHtml(p.price) : ' · Call for price'}
          · 📷 ${nI} · 🎬 ${nV}
        </div>
        <div class="media-box" style="margin-top:.45rem">
          ${(p.images || []).map((src, i) => `
            <div class="media-thumb"><img src="${src}" alt="">
              <button class="x" data-rm-img="${p.id}" data-i="${i}" title="Remove photo">×</button>
            </div>`).join('')}
          ${(p.videos || []).map((v, i) => {
            const isYt = typeof v !== 'string';
            return `<div class="media-thumb" style="display:grid;place-items:center;background:#04183c;color:#ffc220;font-size:1.3rem">
              ${isYt ? '▶' : '🎞️'}
              <button class="x" data-rm-vid="${p.id}" data-i="${i}" title="Remove video">×</button>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="p-actions">
        <button class="btn btn-ghost btn-sm" data-edit="${p.id}">✏️ Edit</button>
        <button class="btn btn-del btn-sm" data-del="${p.id}">🗑 Delete</button>
      </div>
    </div>`;
  }).join('');

  $('productList').querySelectorAll('[data-edit]').forEach(b =>
    b.addEventListener('click', () => startEdit(b.dataset.edit)));
  $('productList').querySelectorAll('[data-del]').forEach(b =>
    b.addEventListener('click', async () => {
      if (!confirm('Delete this product and all its photos/videos?')) return;
      try {
        await api('/api/admin/products/' + b.dataset.del, { method: 'DELETE' });
        toast('Product deleted');
        refresh();
      } catch (e) { toast(e.message, true); }
    }));
  $('productList').querySelectorAll('[data-rm-img]').forEach(b =>
    b.addEventListener('click', async () => {
      try {
        await api(`/api/admin/products/${b.dataset.rmImg}/remove-media`, {
          method: 'POST', body: { kind: 'image', index: Number(b.dataset.i) }
        });
        toast('Photo removed');
        refresh();
      } catch (e) { toast(e.message, true); }
    }));
  $('productList').querySelectorAll('[data-rm-vid]').forEach(b =>
    b.addEventListener('click', async () => {
      try {
        await api(`/api/admin/products/${b.dataset.rmVid}/remove-media`, {
          method: 'POST', body: { kind: 'video', index: Number(b.dataset.i) }
        });
        toast('Video removed');
        refresh();
      } catch (e) { toast(e.message, true); }
    }));
}
$('adminSearch').addEventListener('input', renderList);
$('adminCatFilter').addEventListener('change', renderList);

/* ---------- create / edit ---------- */
function resetForm() {
  editingId = null;
  $('productForm').reset();
  $('fNewCat').style.display = 'none';
  $('formTitle').textContent = '➕ Add Product';
  $('submitBtn').textContent = '🚀 Publish Product';
  $('cancelEdit').style.display = 'none';
  $('formErr').textContent = '';
  updateFileLabels();
}
function startEdit(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  $('fName').value = p.name || '';
  if (p.category && !categories.includes(p.category)) categories.push(p.category);
  renderCatSelects();
  $('fCategory').value = p.category || '';
  $('fPrice').value = p.price || '';
  $('fDesc').value = p.description || '';
  $('fFeatured').checked = !!p.featured;
  $('fYoutube').value = '';
  $('formTitle').textContent = '✏️ Edit Product';
  $('submitBtn').textContent = '💾 Save Changes';
  $('cancelEdit').style.display = 'inline-flex';
  $('cancelEdit').style.width = '100%';
  $('formCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  updateFileLabels();
  toast('Editing: ' + p.name);
}
$('cancelEdit').addEventListener('click', resetForm);

$('fImages').addEventListener('change', updateFileLabels);
$('fVideos').addEventListener('change', updateFileLabels);
function updateFileLabels() {
  const ni = $('fImages').files.length, nv = $('fVideos').files.length;
  $('imgLabel').textContent = ni ? `✅ ${ni} photo(s) selected` : 'Tap to select photos — JPG, PNG, WEBP';
  $('vidLabel').textContent = nv ? `✅ ${nv} video(s) selected` : 'Tap to select videos — MP4, WEBM, MOV (max 300MB each)';
}

$('productForm').addEventListener('submit', async e => {
  e.preventDefault();
  const err = $('formErr');
  err.textContent = '';
  const name = $('fName').value.trim();
  let category = $('fCategory').value;
  if (category === '__new__') category = $('fNewCat').value.trim();
  if (!name) { err.textContent = 'Product name is required'; return; }
  if (!category) { err.textContent = 'Pick or type a category'; return; }

  const fd = new FormData();
  fd.append('name', name);
  fd.append('category', category);
  fd.append('price', $('fPrice').value.trim());
  fd.append('description', $('fDesc').value.trim());
  fd.append('featured', $('fFeatured').checked ? 'true' : 'false');
  const yt = $('fYoutube').value.trim();
  if (yt) fd.append('youtubeUrl', yt);
  for (const f of $('fImages').files) fd.append('images', f);
  for (const f of $('fVideos').files) fd.append('videos', f);

  const btn = $('submitBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Uploading…';
  try {
    if (editingId) {
      await api('/api/admin/products/' + editingId, { method: 'PUT', body: fd });
      toast('Product updated ✅');
    } else {
      await api('/api/admin/products', { method: 'POST', body: fd });
      toast('Product published 🎉');
    }
    resetForm();
    refresh();
  } catch (e2) {
    err.textContent = e2.message || 'Upload failed';
    toast(e2.message || 'Upload failed', true);
  } finally {
    btn.disabled = false;
    btn.textContent = editingId ? '💾 Save Changes' : '🚀 Publish Product';
    if (!editingId) btn.textContent = '🚀 Publish Product';
  }
});

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

/* boot */
if (TOKEN) {
  api('/api/categories').then(() => showApp()).catch(() => logout(false));
} else {
  $('loginView').style.display = 'grid';
}
