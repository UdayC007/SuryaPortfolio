// Surya — project detail page
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => nav && nav.classList.toggle('scrolled', window.scrollY > 50));

function projectId() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('id')) return params.get('id');
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1];
}

function gallerySize(i, total) {
  if (total === 1) return 'span-6';
  if (total === 2) return 'span-3';
  const pat = ['span-4', 'span-2', 'span-2', 'span-4', 'span-3', 'span-3'];
  return pat[i % pat.length];
}

async function loadSite() {
  try {
    const r = await fetch('data/site.json');
    const s = await r.json();
    const p = s.profile || {};
    const initial = (p.name || 'S').charAt(0).toUpperCase();
    $('nav-name').textContent = `[${initial}] ${(p.name || 'SURYA').split(' ')[0].toUpperCase()}`;
    if (s.photos && s.photos.brand) {
      document.querySelectorAll('.brand-mark').forEach(el => {
        el.innerHTML = `<img src="${esc(s.photos.brand)}" class="brand-mark-img" alt="">`;
      });
    }
  } catch (e) {}
}

async function loadProject() {
  const root = $('project-root');
  try {
    const r = await fetch('data/projects.json');
    if (!r.ok) throw new Error('Could not load projects');
    const list = await r.json();
    const p = list.find(x => x.id === projectId());
    if (!p) throw new Error('Quest not found');
    document.title = p.title + ' — Surya Portfolio';

    const all = p.images || [];
    const cover = all[0];
    const rest = all.slice(1);
    const tags = (p.tags || []).map(t => `<span class="project-tag">${esc(t)}</span>`).join('');

    const meta = [];
    if (p.category) meta.push({ k: 'Category', v: p.category });
    if (p.year)     meta.push({ k: 'Year', v: p.year });
    if (p.teacher)  meta.push({ k: 'Mentor', v: p.teacher });
    meta.push({ k: 'Photos', v: String(all.length) });

    root.innerHTML = `
      <div class="project-head">
        <div>
          <div class="project-tag-row">${tags || '<span class="project-tag">QUEST</span>'}</div>
          <h1>${esc(p.title)}</h1>
          ${p.description ? `<p class="project-blurb">${esc(p.description.split(/\n\n|\.\s/)[0]).slice(0, 240)}${p.description.length > 240 ? '…' : ''}</p>` : ''}
        </div>
        <div class="project-meta-card">
          ${meta.map(m => `<div class="project-meta-row"><span class="key">${esc(m.k)}</span><span class="val">${esc(m.v)}</span></div>`).join('')}
          ${p.link ? `<div class="project-meta-row"><span class="key">Link</span><span class="val"><a href="${esc(p.link)}" target="_blank" rel="noopener" style="color:var(--purple-bright)">Open ↗</a></span></div>` : ''}
        </div>
      </div>

      ${cover ? `
        <div class="project-hero-img" onclick="openLightbox('${esc(cover)}')">
          <img src="${esc(cover)}" alt="${esc(p.title)}" />
        </div>` : ''}

      ${p.description ? `<div class="project-story">${esc(p.description)}</div>` : ''}

      ${rest.length ? `
        <div class="project-gallery">
          ${rest.map((img, i) => `
            <div class="pg-item ${gallerySize(i, rest.length)}" onclick="openLightbox('${esc(img)}')">
              <img src="${esc(img)}" alt="" loading="lazy" />
            </div>`).join('')}
        </div>` : ''}

      <div style="text-align:center;margin-top:30px">
        <a href="index.html#projects" class="btn-ghost-s">← MORE QUESTS</a>
      </div>
    `;
  } catch (e) {
    root.innerHTML = `<div class="sys-window"><div class="sys-bar"><span class="sys-bar-dot"></span><span class="sys-bar-title">SYSTEM</span><span class="sys-bar-x">—</span></div><div class="sys-body" style="text-align:center;padding:50px"><p class="sys-msg">${esc(e.message)}</p><p class="sys-msg-sub">This quest may have been removed. <a href="index.html" style="color:var(--purple-bright)">Return home →</a></p></div></div>`;
  }
}

window.openLightbox = (src) => {
  $('lightbox-img').src = src;
  $('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
};
window.closeLightbox = () => {
  $('lightbox').classList.remove('open');
  document.body.style.overflow = '';
};
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

loadSite();
loadProject();
