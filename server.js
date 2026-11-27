/* BIG JEFF SOLAR & LIGHTINGS — Shop Server */
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'bigjeff2026';
const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const ON_VERCEL = !!process.env.VERCEL;
const IMAGES_DIR = path.join(UPLOADS_DIR, 'images');
const VIDEOS_DIR = path.join(UPLOADS_DIR, 'videos');

if (!ON_VERCEL) [DATA_DIR, IMAGES_DIR, VIDEOS_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

const DEFAULT_CATEGORIES = [
  'Solar Street Lights',
  'Solar Floodlights',
  'Solar Fans',
  'Solar Home Systems',
  'Solar Panels',
  'Batteries & Inverters',
  'LED Bulbs & Lamps',
  'CCTV Security',
  'Solar Accessories'
];

/* ---------- tiny JSON store ---------- */
function readJSON(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, 'utf8');
    return raw.trim() ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error('readJSON error', file, e.message);
    return fallback;
  }
}
function writeJSON(file, data) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}
const getProducts = () => readJSON(PRODUCTS_FILE, []);
const saveProducts = p => writeJSON(PRODUCTS_FILE, p);
const getCategories = () => readJSON(CATEGORIES_FILE, DEFAULT_CATEGORIES);
const saveCategories = c => writeJSON(CATEGORIES_FILE, c);

/* ---------- uploads ---------- */
const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v', 'video/avi', 'video/3gpp'];
const extByMime = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
  'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov',
  'video/x-m4v': '.m4v', 'video/avi': '.avi', 'video/3gpp': '.3gp'
};

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, file.fieldname === 'videos' ? VIDEOS_DIR : IMAGES_DIR);
  },
  filename(req, file, cb) {
    const ext = extByMime[file.mimetype] || path.extname(file.originalname).toLowerCase() || '.bin';
    cb(null, Date.now() + '-' + crypto.randomBytes(5).toString('hex') + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 300 * 1024 * 1024, files: 20 },
  fileFilter(req, file, cb) {
    if (file.fieldname === 'images') {
      if (imageTypes.includes(file.mimetype)) return cb(null, true);
      return cb(new Error('Only JPG, PNG, WEBP or GIF images are allowed'));
    }
    if (file.fieldname === 'videos') {
      if (videoTypes.includes(file.mimetype)) return cb(null, true);
      return cb(new Error('Only MP4, WEBM, MOV, M4V or AVI videos are allowed'));
    }
    cb(new Error('Unexpected field'));
  }
});

/* ---------- admin auth (simple token) ---------- */
const tokens = new Map(); // token -> expiry
function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const exp = tokens.get(token);
  if (!exp || exp < Date.now()) {
    if (exp) tokens.delete(token);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.use(express.json({ limit: '1mb' }));

/* Live (Vercel) site is read-only. Add/edit products in Codespaces, then push to GitHub. */
app.use('/api/admin', (req, res, next) => {
  if (ON_VERCEL) return res.status(403).json({ error: 'Admin is disabled on the live site. Add products in GitHub Codespaces, then commit & push.' });
  next();
});
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR, {
  setHeaders(res, filePath) {
    if (/\.(mp4|webm|mov|m4v|avi)$/i.test(filePath)) res.setHeader('Accept-Ranges', 'bytes');
  }
}));

/* ---------- public API ---------- */
app.get('/api/products', (req, res) => {
  let list = getProducts();
  const { category, q } = req.query;
  if (category && category !== 'All') {
    list = list.filter(p => (p.category || '').toLowerCase() === String(category).toLowerCase());
  }
  if (q) {
    const s = String(q).toLowerCase();
    list = list.filter(p =>
      (p.name || '').toLowerCase().includes(s) ||
      (p.description || '').toLowerCase().includes(s) ||
      (p.category || '').toLowerCase().includes(s)
    );
  }
  list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  res.json(list);
});

app.get('/api/categories', (req, res) => {
  res.json(getCategories());
});

app.get('/api/health', (req, res) => res.json({ ok: true, name: 'BIG JEFF SOLAR & LIGHTINGS' }));

/* ---------- admin API ---------- */
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Wrong password' });
  }
  const token = crypto.randomBytes(24).toString('hex');
  tokens.set(token, Date.now() + 24 * 60 * 60 * 1000); // 24h
  res.json({ token });
});

function extractFields(req) {
  const b = req.body || {};
  return {
    name: String(b.name || '').trim(),
    category: String(b.category || '').trim(),
    price: String(b.price || '').trim(),
    description: String(b.description || '').trim(),
    featured: b.featured === 'true' || b.featured === true,
    youtubeUrl: String(b.youtubeUrl || '').trim(),
    tags: String(b.tags || '').trim()
  };
}
function normalizeYoutube(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (m) return m[1];
  if (/^[\w-]{6,}$/.test(url)) return url; // bare id
  return null;
}
function fileUrls(files, field) {
  return (files && files[field] ? files[field] : []).map(f => '/uploads/' + (field === 'videos' ? 'videos/' : 'images/') + f.filename);
}
function cleanupFile(url) {
  if (!url || !url.startsWith('/uploads/')) return;
  const fp = path.join(__dirname, url);
  if (fp.startsWith(UPLOADS_DIR) && fs.existsSync(fp)) {
    try { fs.unlinkSync(fp); } catch (e) { /* ignore */ }
  }
}

app.post('/api/admin/products', requireAdmin, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'videos', maxCount: 10 }]), (req, res) => {
  const f = extractFields(req);
  if (!f.name) return res.status(400).json({ error: 'Product name is required' });
  if (!f.category) return res.status(400).json({ error: 'Category is required' });

  const images = fileUrls(req.files, 'images');
  const videos = fileUrls(req.files, 'videos');
  const yid = normalizeYoutube(f.youtubeUrl);
  if (f.youtubeUrl && !yid) return res.status(400).json({ error: 'Invalid YouTube link' });
  if (yid) videos.push({ type: 'youtube', id: yid });

  const cats = getCategories();
  if (!cats.some(c => c.toLowerCase() === f.category.toLowerCase())) {
    cats.push(f.category);
    saveCategories(cats);
  }

  const product = {
    id: crypto.randomBytes(6).toString('hex'),
    name: f.name,
    category: f.category,
    price: f.price,
    description: f.description,
    featured: f.featured,
    tags: f.tags,
    images,
    videos, // strings for files, {type:'youtube',id} for youtube
    createdAt: Date.now()
  };
  const list = getProducts();
  list.push(product);
  saveProducts(list);
  res.json(product);
});

app.put('/api/admin/products/:id', requireAdmin, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'videos', maxCount: 10 }]), (req, res) => {
  const list = getProducts();
  const idx = list.findIndex(p => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Product not found' });

  const f = extractFields(req);
  if (!f.name) return res.status(400).json({ error: 'Product name is required' });

  const p = list[idx];
  p.name = f.name;
  p.category = f.category || p.category;
  p.price = f.price;
  p.description = f.description;
  p.featured = f.featured;
  p.tags = f.tags;

  // add newly uploaded media
  p.images = (p.images || []).concat(fileUrls(req.files, 'images'));
  const newVideos = fileUrls(req.files, 'videos');
  const yid = normalizeYoutube(f.youtubeUrl);
  if (f.youtubeUrl && !yid) return res.status(400).json({ error: 'Invalid YouTube link' });
  if (yid) newVideos.push({ type: 'youtube', id: yid });
  p.videos = (p.videos || []).concat(newVideos);

  // remove media marked for deletion (comma separated indexes, from JSON body alternative via fields)
  const rmImages = String(req.body.removeImages || '').split(',').filter(x => x !== '').map(Number).filter(n => !isNaN(n));
  const rmVideos = String(req.body.removeVideos || '').split(',').filter(x => x !== '').map(Number).filter(n => !isNaN(n));
  if (rmVideos.length) {
    rmVideos.sort((a, b) => b - a).forEach(i => {
      const v = p.videos[i];
      if (typeof v === 'string') cleanupFile(v);
      p.videos.splice(i, 1);
    });
  }
  if (rmImages.length) {
    rmImages.sort((a, b) => b - a).forEach(i => {
      cleanupFile(p.images[i]);
      p.images.splice(i, 1);
    });
  }

  const cats = getCategories();
  if (p.category && !cats.some(c => c.toLowerCase() === p.category.toLowerCase())) {
    cats.push(p.category);
    saveCategories(cats);
  }

  list[idx] = p;
  saveProducts(list);
  res.json(p);
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const list = getProducts();
  const idx = list.findIndex(p => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Product not found' });
  const p = list[idx];
  (p.images || []).forEach(cleanupFile);
  (p.videos || []).forEach(v => { if (typeof v === 'string') cleanupFile(v); });
  list.splice(idx, 1);
  saveProducts(list);
  res.json({ ok: true });
});

app.post('/api/admin/products/:id/remove-media', requireAdmin, (req, res) => {
  const { kind, index } = req.body || {};
  const list = getProducts();
  const p = list.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  const i = Number(index);
  if (isNaN(i)) return res.status(400).json({ error: 'Bad index' });
  if (kind === 'image') {
    if (i < 0 || i >= (p.images || []).length) return res.status(400).json({ error: 'Bad index' });
    cleanupFile(p.images[i]);
    p.images.splice(i, 1);
  } else if (kind === 'video') {
    if (i < 0 || i >= (p.videos || []).length) return res.status(400).json({ error: 'Bad index' });
    const v = p.videos[i];
    if (typeof v === 'string') cleanupFile(v);
    p.videos.splice(i, 1);
  } else {
    return res.status(400).json({ error: 'kind must be image or video' });
  }
  saveProducts(list);
  res.json(p);
});

app.post('/api/admin/categories', requireAdmin, (req, res) => {
  const name = String((req.body || {}).name || '').trim();
  if (!name) return res.status(400).json({ error: 'Name required' });
  const cats = getCategories();
  if (!cats.some(c => c.toLowerCase() === name.toLowerCase())) {
    cats.push(name);
    saveCategories(cats);
  }
  res.json(cats);
});

app.delete('/api/admin/categories/:name', requireAdmin, (req, res) => {
  const name = decodeURIComponent(req.params.name);
  const used = getProducts().some(p => (p.category || '').toLowerCase() === name.toLowerCase());
  if (used) return res.status(400).json({ error: 'Category is used by products' });
  const cats = getCategories().filter(c => c.toLowerCase() !== name.toLowerCase());
  saveCategories(cats);
  res.json(cats);
});

/* admin page */
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

/* error handler */
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(400).json({ error: err.message || 'Server error' });
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BIG JEFF SOLAR shop running on http://0.0.0.0:${PORT}`);
    console.log(`Admin panel: /admin  |  password: ${ADMIN_PASSWORD}`);
  });
}
module.exports = app;
