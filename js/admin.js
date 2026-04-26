// Surya Admin — server-backed
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const toast = (msg, kind = '') => {
  const el = $('toast'); if (!el) return;
  el.className = 'toast show ' + kind;
  el.textContent = msg;
  setTimeout(() => el.classList.remove('show'), 2800);
};
const showMsg = (id, text, ok = false) => {
  const el = $(id); if (!el) return;
  el.className = 'form-message ' + (ok ? 'success' : 'error');
  el.textContent = text;
  if (ok) setTimeout(() => { el.textContent = ''; }, 2400);
};

// Bootstrap auth — bounce to login if not authed
(async () => {
  try {
    const r = await fetch('/api/me');
    const d = await r.json();
    if (!d.isAdmin) window.location.href = '/admin-login.html';
  } catch (e) { window.location.href = '/admin-login.html'; }
})();

// ---------- Sidebar nav ----------
const SECTIONS = ['projects', 'profile', 'contact', 'subjects', 'skills', 'photos', 'password'];
document.querySelectorAll('.sidebar-link[data-section]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    switchSection(link.dataset.section);
  });
});
function switchSection(name) {
  document.querySelectorAll('.sidebar-link[data-section]').forEach(l => l.classList.toggle('active', l.dataset.section === name));
  SECTIONS.forEach(s => {
    const sec = $('section-' + s); if (sec) sec.style.display = (s === name ? '' : 'none');
  });
  if (name === 'projects')  loadProjects();
  if (name === 'profile')   loadProfile();
  if (name === 'contact')   loadContact();
  if (name === 'subjects')  loadSubjects();
  if (name === 'skills')    loadSkills();
  if (name === 'photos')    loadPhotos();
}

$('logout-btn').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/admin-login.html';
});

// ---------- PROJECTS ----------
let pendingFiles = [];
let keptImages = [];

async function loadProjects() {
  const list = $('projects-list');
  const empty = $('empty-projects');
  list.innerHTML = '<p class="muted" style="padding:20px;color:var(--text-muted)">Loading…</p>';
  try {
    const r = await fetch('/api/projects');
    const projects = await r.json();
    if (!projects.length) { list.innerHTML = ''; empty.style.display = ''; return; }
    empty.style.display = 'none';
    list.innerHTML = projects.map(p => {
      const cover = p.images && p.images[0];
      const tags = (p.tags || []).slice(0, 3).map(t => `<span class="project-item-tag">${esc(t)}</span>`).join('');
      return `
        <div class="project-item">
          <div class="project-item-thumb" ${cover ? `style="background:url(${esc(cover)}) center/cover"` : `style="background:${esc(p.color || '#7c3aed')}"`}>
            ${cover ? '' : `<span class="project-item-thumb-letter">${esc((p.title || '?').charAt(0))}</span>`}
          </div>
          <div class="project-item-info">
            <div class="project-item-title">${esc(p.title)}</div>
            <div class="project-item-desc">${esc((p.description || '').slice(0, 100))}</div>
            <div class="project-item-tags">${tags}<span class="project-item-tag">${(p.images || []).length} photo${p.images && p.images.length === 1 ? '' : 's'}</span></div>
          </div>
          <div class="project-item-actions">
            <a href="/project/${p.id}" target="_blank" class="btn-icon" title="View">↗</a>
            <button class="btn-icon" data-edit="${p.id}" title="Edit">✎</button>
            <button class="btn-icon danger" data-delete="${p.id}" data-title="${esc(p.title)}" title="Delete">✕</button>
          </div>
        </div>`;
    }).join('');
    list.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => editProject(b.dataset.edit)));
    list.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', () => deleteProject(b.dataset.delete, b.dataset.title)));
  } catch (e) {
    list.innerHTML = `<p style="color:var(--danger);padding:20px">${esc(e.message)}</p>`;
  }
}

async function deleteProject(id, title) {
  if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
  try {
    const r = await fetch('/api/projects/' + id, { method: 'DELETE' });
    if (!r.ok) throw new Error('Delete failed');
    toast('Project deleted', 'success');
    loadProjects();
  } catch (e) { toast(e.message, 'error'); }
}

async function editProject(id) {
  try {
    const r = await fetch('/api/projects/' + id);
    const p = await r.json();
    $('project-id').value = p.id;
    $('project-title').value = p.title || '';
    $('project-category').value = p.category || '';
    $('project-year').value = p.year || '';
    $('project-teacher').value = p.teacher || '';
    $('project-description').value = p.description || '';
    $('project-tags').value = (p.tags || []).join(', ');
    $('project-link').value = p.link || '';
    $('project-color').value = p.color || '#7c3aed';
    $('color-value').textContent = p.color || '#7c3aed';
    pendingFiles = [];
    keptImages = (p.images || []).slice();
    renderImagePreview();
    $('modal-title').textContent = 'Edit Project';
    openModal();
  } catch (e) { toast(e.message, 'error'); }
}

const modalOverlay = $('modal-overlay');
const openModal = () => modalOverlay.classList.add('active');
const closeModal = () => modalOverlay.classList.remove('active');
$('add-project-btn').addEventListener('click', () => {
  $('project-form').reset();
  $('project-id').value = '';
  $('project-color').value = '#7c3aed';
  $('color-value').textContent = '#7c3aed';
  pendingFiles = []; keptImages = [];
  renderImagePreview();
  $('modal-title').textContent = 'Add Project';
  openModal();
});
$('modal-close').addEventListener('click', closeModal);
$('modal-cancel').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

$('project-color').addEventListener('input', (e) => { $('color-value').textContent = e.target.value; });

// Image picker
const imgInput = $('project-images');
const uploadArea = $('upload-area');
imgInput.addEventListener('change', (e) => {
  for (const f of e.target.files) pendingFiles.push(f);
  imgInput.value = '';
  renderImagePreview();
});
['dragenter', 'dragover'].forEach(ev => uploadArea.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); uploadArea.classList.add('dragover'); }));
['dragleave', 'drop'].forEach(ev => uploadArea.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); uploadArea.classList.remove('dragover'); }));
uploadArea.addEventListener('drop', (e) => {
  for (const f of e.dataTransfer.files) if (f.type.startsWith('image/')) pendingFiles.push(f);
  renderImagePreview();
});

function renderImagePreview() {
  const wrap = $('image-preview');
  const items = [];
  keptImages.forEach((url, i) => {
    items.push(`<div class="img-thumb" data-kept="${i}"><img src="${esc(url)}" alt=""><button type="button" class="img-remove" data-kept-rm="${i}">✕</button></div>`);
  });
  pendingFiles.forEach((f, i) => {
    const url = URL.createObjectURL(f);
    items.push(`<div class="img-thumb" data-pending="${i}"><img src="${url}" alt=""><button type="button" class="img-remove" data-pending-rm="${i}">✕</button></div>`);
  });
  wrap.innerHTML = items.join('');
  wrap.querySelectorAll('[data-kept-rm]').forEach(b => b.addEventListener('click', () => { keptImages.splice(parseInt(b.dataset.keptRm, 10), 1); renderImagePreview(); }));
  wrap.querySelectorAll('[data-pending-rm]').forEach(b => b.addEventListener('click', () => { pendingFiles.splice(parseInt(b.dataset.pendingRm, 10), 1); renderImagePreview(); }));
}

$('project-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = $('project-id').value;
  const fd = new FormData();
  fd.append('title',       $('project-title').value);
  fd.append('category',    $('project-category').value);
  fd.append('year',        $('project-year').value);
  fd.append('teacher',     $('project-teacher').value);
  fd.append('description', $('project-description').value);
  fd.append('tags',        JSON.stringify($('project-tags').value.split(',').map(t => t.trim()).filter(Boolean)));
  fd.append('link',        $('project-link').value);
  fd.append('color',       $('project-color').value);
  if (id) fd.append('keepImages', JSON.stringify(keptImages));
  pendingFiles.forEach(f => fd.append('images', f));

  const url = id ? '/api/projects/' + id : '/api/projects';
  const method = id ? 'PUT' : 'POST';
  try {
    const r = await fetch(url, { method, body: fd });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Save failed');
    closeModal();
    toast(id ? 'Project updated' : 'Project added', 'success');
    loadProjects();
  } catch (e) { showMsg('project-msg', e.message); }
});

// ---------- PROFILE ----------
async function loadProfile() {
  const r = await fetch('/api/site');
  const s = await r.json();
  const p = s.profile || {};
  $('p-name').value = p.name || '';
  $('p-title').value = p.title || '';
  $('p-year').value = p.year || '';
  $('p-college').value = p.college || '';
  $('p-tagline').value = p.tagline || '';
  $('p-bio').value = p.bio || '';
  $('p-personalTouch').value = p.personalTouch || '';
  $('p-goals').value = p.goals || '';
}
$('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const r = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: $('p-name').value,
        title: $('p-title').value,
        year: $('p-year').value,
        college: $('p-college').value,
        tagline: $('p-tagline').value,
        bio: $('p-bio').value,
        personalTouch: $('p-personalTouch').value,
        goals: $('p-goals').value
      })
    });
    if (!r.ok) throw new Error((await r.json()).error || 'Save failed');
    showMsg('profile-msg', 'Saved.', true);
    toast('Profile saved', 'success');
  } catch (e) { showMsg('profile-msg', e.message); }
});

// ---------- CONTACT ----------
async function loadContact() {
  const r = await fetch('/api/site');
  const s = await r.json();
  const c = s.contact || {};
  $('c-email').value = c.email || '';
  $('c-instagram').value = c.instagram || '';
  $('c-twitter').value = c.twitter || '';
  $('c-linkedin').value = c.linkedin || '';
}
$('contact-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const r = await fetch('/api/contact', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: $('c-email').value,
        instagram: $('c-instagram').value.replace(/^@/, ''),
        twitter: $('c-twitter').value.replace(/^@/, ''),
        linkedin: $('c-linkedin').value
      })
    });
    if (!r.ok) throw new Error((await r.json()).error || 'Save failed');
    showMsg('contact-msg', 'Saved.', true);
    toast('Socials saved', 'success');
  } catch (e) { showMsg('contact-msg', e.message); }
});

// ---------- SUBJECTS (repeater) ----------
let subjectsState = [];
async function loadSubjects() {
  const r = await fetch('/api/site');
  const s = await r.json();
  subjectsState = (s.subjects || []).slice();
  if (!subjectsState.length) subjectsState = [{ code: '', name: '', faculty: '' }];
  renderSubjects();
}
function renderSubjects() {
  const wrap = $('subjects-repeater');
  wrap.innerHTML = subjectsState.map((s, i) => `
    <div class="repeater-row">
      <input type="text" class="rep-input" data-field="code" data-i="${i}" value="${esc(s.code)}" placeholder="Code (e.g. CSE101)" />
      <input type="text" class="rep-input flex" data-field="name" data-i="${i}" value="${esc(s.name)}" placeholder="Subject name" />
      <input type="text" class="rep-input flex" data-field="faculty" data-i="${i}" value="${esc(s.faculty)}" placeholder="Faculty name" />
      <button type="button" class="btn-icon danger" data-rm="${i}" title="Remove">✕</button>
    </div>`).join('');
  wrap.querySelectorAll('.rep-input').forEach(inp => inp.addEventListener('input', (e) => {
    const i = parseInt(e.target.dataset.i, 10); const f = e.target.dataset.field;
    subjectsState[i][f] = e.target.value;
  }));
  wrap.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', () => {
    subjectsState.splice(parseInt(b.dataset.rm, 10), 1);
    if (!subjectsState.length) subjectsState = [{ code: '', name: '', faculty: '' }];
    renderSubjects();
  }));
}
$('add-subject-btn').addEventListener('click', () => { subjectsState.push({ code: '', name: '', faculty: '' }); renderSubjects(); });
$('save-subjects-btn').addEventListener('click', async () => {
  try {
    const cleaned = subjectsState.filter(s => (s.name || '').trim());
    const r = await fetch('/api/subjects', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleaned)
    });
    if (!r.ok) throw new Error((await r.json()).error || 'Save failed');
    showMsg('subjects-msg', 'Saved.', true);
    toast('Curriculum saved', 'success');
  } catch (e) { showMsg('subjects-msg', e.message); }
});

// ---------- SKILLS (repeater) ----------
let skillsState = [];
async function loadSkills() {
  const r = await fetch('/api/site');
  const s = await r.json();
  skillsState = (s.skills || []).slice();
  if (!skillsState.length) skillsState = [{ name: '', level: 70, rank: 'B' }];
  renderSkills();
}
function renderSkills() {
  const wrap = $('skills-repeater');
  wrap.innerHTML = skillsState.map((s, i) => `
    <div class="repeater-row">
      <input type="text" class="rep-input flex" data-field="name" data-i="${i}" value="${esc(s.name)}" placeholder="Skill name" />
      <input type="number" class="rep-input small" data-field="level" data-i="${i}" value="${s.level || 0}" min="0" max="100" placeholder="Level %" />
      <input type="text" class="rep-input small" data-field="rank" data-i="${i}" value="${esc(s.rank)}" placeholder="Rank (S/A/B)" />
      <button type="button" class="btn-icon danger" data-rm="${i}" title="Remove">✕</button>
    </div>`).join('');
  wrap.querySelectorAll('.rep-input').forEach(inp => inp.addEventListener('input', (e) => {
    const i = parseInt(e.target.dataset.i, 10); const f = e.target.dataset.field;
    skillsState[i][f] = (f === 'level') ? parseInt(e.target.value, 10) : e.target.value;
  }));
  wrap.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', () => {
    skillsState.splice(parseInt(b.dataset.rm, 10), 1);
    if (!skillsState.length) skillsState = [{ name: '', level: 70, rank: 'B' }];
    renderSkills();
  }));
}
$('add-skill-btn').addEventListener('click', () => { skillsState.push({ name: '', level: 70, rank: 'B' }); renderSkills(); });
$('save-skills-btn').addEventListener('click', async () => {
  try {
    const cleaned = skillsState.filter(s => (s.name || '').trim());
    const r = await fetch('/api/skills', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleaned)
    });
    if (!r.ok) throw new Error((await r.json()).error || 'Save failed');
    showMsg('skills-msg', 'Saved.', true);
    toast('Skills saved', 'success');
  } catch (e) { showMsg('skills-msg', e.message); }
});

// ---------- PHOTOS ----------
const PHOTO_SLOTS = ['hero', 'about', 'brand'];
async function loadPhotos() {
  const r = await fetch('/api/site');
  const s = await r.json();
  const ph = s.photos || {};
  PHOTO_SLOTS.forEach(slot => paintSlot(slot, ph[slot]));
}
function paintSlot(slot, url) {
  const frame = document.querySelector(`.photo-slot[data-slot="${slot}"] .slot-frame`);
  if (!frame) return;
  if (url) frame.innerHTML = `<img src="${esc(url)}?t=${Date.now()}" alt="" />`;
  else frame.innerHTML = '<span class="slot-empty">Click to upload</span>';
}
PHOTO_SLOTS.forEach(slot => {
  const input = $('photo-' + slot);
  if (!input) return;
  input.addEventListener('change', async () => {
    const f = input.files && input.files[0];
    if (!f) return;
    const fd = new FormData(); fd.append('image', f);
    try {
      const r = await fetch('/api/photos/' + slot, { method: 'PUT', body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Upload failed');
      paintSlot(slot, d.url);
      toast('Photo updated', 'success');
    } catch (e) { showMsg('photos-msg', e.message); }
    input.value = '';
  });
});
document.querySelectorAll('[data-remove]').forEach(btn => {
  btn.addEventListener('click', async () => {
    const slot = btn.dataset.remove;
    if (!confirm(`Remove the ${slot} photo?`)) return;
    try {
      const r = await fetch('/api/photos/' + slot, { method: 'DELETE' });
      if (!r.ok) throw new Error((await r.json()).error || 'Delete failed');
      paintSlot(slot, null);
      toast('Photo removed', 'success');
    } catch (e) { showMsg('photos-msg', e.message); }
  });
});

// ---------- PASSWORD ----------
$('password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const oldP = $('old-password').value;
  const newP = $('new-password').value;
  const confP = $('confirm-password').value;
  if (newP !== confP) return showMsg('password-message', 'New passwords do not match');
  try {
    const r = await fetch('/api/password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current: oldP, next: newP })
    });
    if (!r.ok) throw new Error((await r.json()).error || 'Update failed');
    showMsg('password-message', 'Password updated.', true);
    $('password-form').reset();
    toast('Password changed', 'success');
  } catch (e) { showMsg('password-message', e.message); }
});

// init — load default section
loadProjects();
