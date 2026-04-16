document.addEventListener('DOMContentLoaded', () => {
    // Navbar scroll
    const nav = document.querySelector('.nav');
    window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 50));

    // Mobile menu
    const toggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');
    toggle.addEventListener('click', () => {
        navLinks.classList.toggle('mobile-open');
        document.body.style.overflow = navLinks.classList.contains('mobile-open') ? 'hidden' : '';
    });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        navLinks.classList.remove('mobile-open');
        document.body.style.overflow = '';
    }));

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            const t = document.querySelector(a.getAttribute('href'));
            if (t) window.scrollTo({ top: t.offsetTop - 80, behavior: 'smooth' });
        });
    });

    // Reveal on scroll
    const reveals = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('visible'), i * 80);
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    reveals.forEach(el => obs.observe(el));

    // Projects
    function esc(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    function renderProjects() {
        const projects = PortfolioData.getProjects();
        const grid = document.getElementById('projects-grid');
        const empty = document.getElementById('no-projects');
        if (!projects || !projects.length) { grid.style.display = 'none'; empty.style.display = ''; return; }
        grid.style.display = ''; empty.style.display = 'none';
        grid.innerHTML = '';
        projects.forEach(p => {
            const card = document.createElement('div');
            card.className = 'project-card reveal';
            const thumb = p.image
                ? `<img src="${esc(p.image)}" alt="${esc(p.title)}">`
                : `<div class="project-thumb-placeholder" style="color:${esc(p.color||'#c9a96e')}">${esc(p.title.charAt(0))}</div>`;
            const tags = (p.tags||[]).map(t => `<span class="project-tag">${esc(t)}</span>`).join('');
            const link = p.link ? `<a href="${esc(p.link)}" target="_blank" class="project-link">View Project &rarr;</a>` : '';
            card.innerHTML = `<div class="project-thumb">${thumb}</div><div class="project-body"><div class="project-tags">${tags}</div><h3 class="project-title">${esc(p.title)}</h3><p class="project-desc">${esc(p.description)}</p>${link}</div>`;
            grid.appendChild(card);
            setTimeout(() => obs.observe(card), 50);
        });
    }
    renderProjects();
});
