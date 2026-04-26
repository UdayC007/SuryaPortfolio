// Surya — public site
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

document.addEventListener('DOMContentLoaded', () => {

  const notif = $('sys-notif');
  const closeBtn = $('sys-close');
  if (closeBtn) closeBtn.addEventListener('click', () => notif.classList.add('hidden'));
  setTimeout(() => { if (notif) notif.classList.add('hidden'); }, 5000);

  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 50));

  const burger = $('nav-burger');
  const navLinks = $('nav-links');
  burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    navLinks.classList.toggle('mobile-open');
    document.body.style.overflow = navLinks.classList.contains('mobile-open') ? 'hidden' : '';
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    burger.classList.remove('active');
    navLinks.classList.remove('mobile-open');
    document.body.style.overflow = '';
  }));

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = a.getAttribute('href');
      if (target.length < 2) return;
      const t = document.querySelector(target);
      if (t) { e.preventDefault(); window.scrollTo({ top: t.offsetTop - 80, behavior: 'smooth' }); }
    });
  });

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); obs.unobserve(entry.target); } });
  }, { threshold: 0.12 });
  function watchReveals() { document.querySelectorAll('.reveal:not(.visible)').forEach(el => obs.observe(el)); }
  watchReveals();

  const heroContent = document.querySelector('.hero-content');
  window.addEventListener('scroll', () => {
    const s = window.scrollY;
    if (s < window.innerHeight && heroContent) {
      heroContent.style.transform = `translateY(${s * 0.1}px)`;
      heroContent.style.opacity = 1 - s / (window.innerHeight * 0.8);
    }
  });

  loadSite();
  loadProjects();

  async function loadSite() {
    try {
      const r = await fetch('/api/site');
      const s = await r.json();
      const p = s.profile || {};
      const c = s.contact || {};

      const fullName = (p.name || 'Surya Pundir').toUpperCase();
      const initial  = (p.name || 'S').charAt(0).toUpperCase();

      $('hero-name-inline').textContent = fullName;
      $('hero-main-name').textContent = fullName;
      if (p.title)    $('hero-title').textContent = (p.title || '').toUpperCase();
      if (p.college)  $('hero-college').textContent = '// ' + (p.college || '').toUpperCase();
      if (p.tagline)  $('hero-tagline').textContent = p.tagline;
      $('nav-name').textContent = `[${initial}] ${(p.name || 'SURYA').split(' ')[0].toUpperCase()}`;
      $('footer-name').textContent = `[${initial}] ${fullName} © ${new Date().getFullYear()}`;
      document.title = `${p.name || 'Surya Pundir'} — ${p.title || 'Designer'}`;

      const rows = [
        ['Name', p.name || ''],
        ['Class', p.title || ''],
        ['Rank', '<span class="rank-s">S</span>', true],
        ['Level', p.year || ''],
        ['Guild', p.college || ''],
        ['Title', '<span class="hl">Shadow Designer</span>', true]
      ];
      $('player-stats').innerHTML = rows.map(([k, v, raw]) =>
        `<div class="ps-row"><span class="ps-key">${esc(k)}</span><span class="ps-val">${raw ? v : esc(v) || '—'}</span></div>`
      ).join('');

      $('about-bio').textContent = p.bio || '—';
      $('personal-touch').textContent = p.personalTouch || '—';
      $('goals-text').textContent = p.goals || '—';

      const photos = s.photos || {};
      if (photos.hero) {
        const heroPort = $('hero-portrait-photo');
        heroPort.innerHTML = `<img src="${esc(photos.hero)}" alt="">`;
        heroPort.classList.add('has-photo');
      }
      if (photos.about) {
        const aboutPort = $('about-portrait');
        aboutPort.innerHTML = `<img src="${esc(photos.about)}" alt="">`;
        aboutPort.classList.add('has-photo');
      }
      if (photos.brand) {
        document.querySelectorAll('.brand-mark').forEach(el => {
          el.innerHTML = `<img src="${esc(photos.brand)}" class="brand-mark-img" alt="">`;
        });
      }

      const subs = s.subjects || [];
      if (subs.length) {
        $('subject-grid').innerHTML = subs.map(sub => `
          <div class="subject-card reveal">
            ${sub.code ? `<div class="subject-code">${esc(sub.code)}</div>` : ''}
            <div class="subject-name">${esc(sub.name)}</div>
            <div class="subject-faculty ${sub.faculty ? '' : 'empty'}">${esc(sub.faculty) || 'Faculty TBD'}</div>
          </div>`).join('');
      } else {
        $('subject-grid').innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1;text-align:center">No subjects added yet — add them in the admin panel.</p>`;
      }

      const skills = s.skills || [];
      if (skills.length) {
        $('skills-grid').innerHTML = skills.map(sk => `
          <div class="skill-card reveal">
            <div class="sk-rank">${esc(sk.rank || 'B')}</div>
            <h4>${esc(sk.name)}</h4>
            <div class="sk-bar"><div class="sk-fill" style="--w:${Math.max(0, Math.min(100, sk.level || 0))}%"></div></div>
          </div>`).join('');
      }

      const links = [];
      if (c.email)     links.push({ tag: '[E]', label: 'EMAIL',     value: c.email,                                 href: 'mailto:' + c.email });
      if (c.instagram) links.push({ tag: '[I]', label: 'INSTAGRAM', value: '@' + c.instagram,                       href: 'https://instagram.com/' + c.instagram });
      if (c.twitter)   links.push({ tag: '[T]', label: 'TWITTER',   value: '@' + c.twitter,                         href: 'https://twitter.com/' + c.twitter });
      if (c.linkedin)  links.push({ tag: '[L]', label: 'LINKEDIN',  value: c.linkedin.replace(/^https?:\/\//, ''),  href: c.linkedin.startsWith('http') ? c.linkedin : 'https://' + c.linkedin });
      $('msg-links').innerHTML = links.map(l => `
        <a href="${esc(l.href)}" target="_blank" rel="noopener" class="msg-link">
          <span class="msg-key">${esc(l.tag)}</span>
          <span class="msg-label">${esc(l.label)}</span>
          <span class="msg-value">${esc(l.value)}</span>
        </a>`).join('') || '<p style="color:var(--text-muted)">No contacts added yet.</p>';

      watchReveals();
    } catch (e) { console.error('loadSite failed', e); }
  }

  async function loadProjects() {
    try {
      const r = await fetch('/api/projects');
      const projects = await r.json();
      const grid = $('projects-grid');
      const empty = $('no-projects');
      if (!projects.length) { grid.style.display = 'none'; empty.style.display = ''; return; }
      grid.style.display = ''; empty.style.display = 'none';
      grid.innerHTML = projects.map(p => {
        const cover = p.images && p.images[0];
        const thumb = cover
          ? `<img src="${esc(cover)}" alt="${esc(p.title)}">`
          : `<div class="project-thumb-placeholder" style="background:${esc(p.color || '#7c3aed')}">${esc((p.title || '?').charAt(0))}</div>`;
        const tags = (p.tags || []).slice(0, 3).map(t => `<span class="project-tag">${esc(t)}</span>`).join('');
        const photos = (p.images || []).length;
        const photosBadge = photos > 1 ? `<span class="project-tag">${photos} photos</span>` : '';
        return `
          <a class="project-card reveal" href="/project/${p.id}">
            <div class="project-thumb">${thumb}</div>
            <div class="project-body">
              <div class="project-tags">${tags}${photosBadge}</div>
              <h3 class="project-title">${esc(p.title)}</h3>
              <p class="project-desc">${esc((p.description || '').slice(0, 130))}${(p.description || '').length > 130 ? '…' : ''}</p>
              <span class="project-link">VIEW QUEST →</span>
            </div>
          </a>`;
      }).join('');
      watchReveals();
    } catch (e) {
      $('projects-grid').innerHTML = `<p style="color:var(--red)">Couldn't load projects: ${esc(e.message)}</p>`;
    }
  }
});
