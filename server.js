const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(PROJECTS_FILE)) fs.writeFileSync(PROJECTS_FILE, '[]');

const DEFAULT_CONFIG = {
  adminPasswordHash: bcrypt.hashSync('surya2026', 10),
  sessionSecret: crypto.randomBytes(32).toString('hex'),
  profile: {
    name: 'Surya Pundir',
    title: 'S-Rank UI/UX Designer',
    year: '1st Year',
    college: 'DIT University, Dehradun',
    tagline: 'Designing with the precision of a Shadow Monarch.',
    bio: 'A first-year design student exploring the line between system and story. Every interface is a dungeon — every dungeon a chance to level up.',
    personalTouch: 'Off-screen I sketch monsters in the margins of my notebooks, replay Solo Leveling for the third time, and chase good chai across Dehradun.',
    goals: 'Become a designer who builds calm, systemic interfaces; ship a shipped product before the end of first year; mentor a junior by the time I graduate.'
  },
  contact: {
    email: 'suryapundir326@gmail.com',
    instagram: 'thakur_surya_pundir',
    twitter: 'ThakurSurya',
    linkedin: ''
  },
  subjects: [
    { code: 'CSE101', name: 'Programming Fundamentals',         faculty: '' },
    { code: 'MAT101', name: 'Engineering Mathematics I',        faculty: '' },
    { code: 'PHY101', name: 'Engineering Physics',              faculty: '' },
    { code: 'ENG101', name: 'Communication Skills',             faculty: '' },
    { code: 'ELC101', name: 'Basic Electronics',                faculty: '' },
    { code: 'WSP101', name: 'Workshop Practice',                faculty: '' }
  ],
  skills: [
    { name: 'UI Design',         level: 92, rank: 'S' },
    { name: 'UX Research',       level: 80, rank: 'A' },
    { name: 'Prototyping',       level: 88, rank: 'S' },
    { name: 'Design Systems',    level: 78, rank: 'A' },
    { name: 'Visual Identity',   level: 85, rank: 'S' },
    { name: 'Motion Design',     level: 70, rank: 'B' }
  ],
  photos: { hero: null, about: null, brand: null }
};

if (!fs.existsSync(CONFIG_FILE)) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
}

let config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
let configChanged = false;
for (const key of Object.keys(DEFAULT_CONFIG)) {
  if (config[key] === undefined) { config[key] = DEFAULT_CONFIG[key]; configChanged = true; }
}
if (!config.photos) { config.photos = { hero: null, about: null, brand: null }; configChanged = true; }
if (configChanged) fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

const PHOTO_SLOTS = ['hero', 'about', 'brand'];

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(ROOT, { extensions: ['html'] }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, unique + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|webp|gif/.test(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error('Only image files allowed'), ok);
  }
});

const readProjects  = () => JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8'));
const writeProjects = (p) => fs.writeFileSync(PROJECTS_FILE, JSON.stringify(p, null, 2));
const readConfig    = () => JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
const writeConfig   = (c) => fs.writeFileSync(CONFIG_FILE, JSON.stringify(c, null, 2));

function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  if (req.accepts('html') && !req.path.startsWith('/api/')) return res.redirect('/admin-login.html');
  return res.status(401).json({ error: 'Unauthorized' });
}

function deleteFileIfExists(relUrl) {
  if (!relUrl) return;
  const p = path.join(ROOT, relUrl);
  if (fs.existsSync(p)) try { fs.unlinkSync(p); } catch (e) {}
}

// ---------- public ----------
app.get('/api/site', (req, res) => {
  const c = readConfig();
  res.json({
    profile: c.profile,
    contact: c.contact,
    subjects: c.subjects || [],
    skills: c.skills || [],
    photos: c.photos || { hero: null, about: null, brand: null }
  });
});
app.get('/api/projects', (req, res) => {
  res.json(readProjects().sort((a, b) => b.createdAt - a.createdAt));
});
app.get('/api/projects/:id', (req, res) => {
  const p = readProjects().find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

// ---------- auth ----------
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  const c = readConfig();
  if (!password) return res.status(400).json({ error: 'Password required' });
  if (bcrypt.compareSync(password, c.adminPasswordHash)) {
    req.session.isAdmin = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Invalid password' });
});
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});
app.get('/api/me', (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});
app.post('/api/password', requireAuth, (req, res) => {
  const { current, next: newPw } = req.body;
  const c = readConfig();
  if (!bcrypt.compareSync(current || '', c.adminPasswordHash)) {
    return res.status(401).json({ error: 'Current password incorrect' });
  }
  if (!newPw || newPw.length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters' });
  }
  c.adminPasswordHash = bcrypt.hashSync(newPw, 10);
  writeConfig(c);
  res.json({ ok: true });
});

// ---------- site config ----------
app.put('/api/profile', requireAuth, (req, res) => {
  const c = readConfig();
  c.profile = { ...c.profile, ...req.body };
  writeConfig(c);
  res.json({ ok: true, profile: c.profile });
});
app.put('/api/contact', requireAuth, (req, res) => {
  const c = readConfig();
  c.contact = { ...c.contact, ...req.body };
  writeConfig(c);
  res.json({ ok: true, contact: c.contact });
});
app.put('/api/subjects', requireAuth, (req, res) => {
  const list = Array.isArray(req.body) ? req.body : req.body.subjects;
  if (!Array.isArray(list)) return res.status(400).json({ error: 'Expected array' });
  const c = readConfig();
  c.subjects = list.map(s => ({
    code: (s.code || '').trim(),
    name: (s.name || '').trim(),
    faculty: (s.faculty || '').trim()
  })).filter(s => s.name);
  writeConfig(c);
  res.json({ ok: true, subjects: c.subjects });
});
app.put('/api/skills', requireAuth, (req, res) => {
  const list = Array.isArray(req.body) ? req.body : req.body.skills;
  if (!Array.isArray(list)) return res.status(400).json({ error: 'Expected array' });
  const c = readConfig();
  c.skills = list.map(s => ({
    name: (s.name || '').trim(),
    level: Math.max(0, Math.min(100, parseInt(s.level, 10) || 0)),
    rank: (s.rank || '').trim().slice(0, 2).toUpperCase()
  })).filter(s => s.name);
  writeConfig(c);
  res.json({ ok: true, skills: c.skills });
});

// ---------- photos ----------
app.put('/api/photos/:slot', requireAuth, upload.single('image'), (req, res) => {
  const slot = req.params.slot;
  if (!PHOTO_SLOTS.includes(slot)) return res.status(400).json({ error: 'Unknown slot' });
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  const c = readConfig();
  if (!c.photos) c.photos = {};
  deleteFileIfExists(c.photos[slot]);
  c.photos[slot] = '/uploads/' + req.file.filename;
  writeConfig(c);
  res.json({ ok: true, slot, url: c.photos[slot] });
});
app.delete('/api/photos/:slot', requireAuth, (req, res) => {
  const slot = req.params.slot;
  if (!PHOTO_SLOTS.includes(slot)) return res.status(400).json({ error: 'Unknown slot' });
  const c = readConfig();
  if (!c.photos) c.photos = {};
  deleteFileIfExists(c.photos[slot]);
  c.photos[slot] = null;
  writeConfig(c);
  res.json({ ok: true });
});

// ---------- projects ----------
app.post('/api/projects', requireAuth, upload.array('images', 20), (req, res) => {
  const { title, description, teacher, category, year, link, color } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title required' });
  let tags = [];
  if (req.body.tags) {
    try { tags = JSON.parse(req.body.tags); } catch (e) {
      tags = String(req.body.tags).split(',').map(t => t.trim()).filter(Boolean);
    }
  }
  const project = {
    id: crypto.randomBytes(8).toString('hex'),
    title: title.trim(),
    description: (description || '').trim(),
    teacher: (teacher || '').trim(),
    category: (category || '').trim(),
    year: (year || '').trim(),
    tags,
    link: (link || '').trim(),
    color: (color || '#7c3aed').trim(),
    images: (req.files || []).map(f => '/uploads/' + f.filename),
    createdAt: Date.now()
  };
  const projects = readProjects();
  projects.push(project);
  writeProjects(projects);
  res.json(project);
});

app.put('/api/projects/:id', requireAuth, upload.array('images', 20), (req, res) => {
  const projects = readProjects();
  const idx = projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const project = projects[idx];
  const { title, description, teacher, category, year, link, color, keepImages } = req.body;

  if (title !== undefined)       project.title = title.trim();
  if (description !== undefined) project.description = description.trim();
  if (teacher !== undefined)     project.teacher = teacher.trim();
  if (category !== undefined)    project.category = category.trim();
  if (year !== undefined)        project.year = year.trim();
  if (link !== undefined)        project.link = link.trim();
  if (color !== undefined)       project.color = color.trim();

  if (req.body.tags !== undefined) {
    try { project.tags = JSON.parse(req.body.tags); } catch (e) {
      project.tags = String(req.body.tags).split(',').map(t => t.trim()).filter(Boolean);
    }
  }

  let kept = [];
  if (keepImages) { try { kept = JSON.parse(keepImages); } catch (e) {} }
  (project.images || []).forEach(img => { if (!kept.includes(img)) deleteFileIfExists(img); });
  const newImages = (req.files || []).map(f => '/uploads/' + f.filename);
  project.images = [...kept, ...newImages];

  writeProjects(projects);
  res.json(project);
});

app.delete('/api/projects/:id', requireAuth, (req, res) => {
  const projects = readProjects();
  const idx = projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  (projects[idx].images || []).forEach(deleteFileIfExists);
  projects.splice(idx, 1);
  writeProjects(projects);
  res.json({ ok: true });
});

// ---------- pages ----------
app.get('/admin', requireAuth, (req, res) => res.sendFile(path.join(ROOT, 'admin.html')));
app.get('/admin/login', (req, res) => res.sendFile(path.join(ROOT, 'admin-login.html')));
app.get('/project/:id', (req, res) => res.sendFile(path.join(ROOT, 'project.html')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`\n  Surya Portfolio running at http://localhost:${PORT}`);
  console.log(`  Admin panel:  http://localhost:${PORT}/admin`);
  console.log(`  Default password: surya2026\n`);
});
