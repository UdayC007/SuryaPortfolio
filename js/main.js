document.addEventListener('DOMContentLoaded', () => {
    // System notification dismiss
    const notif = document.getElementById('sys-notif');
    const closeBtn = document.getElementById('sys-close');
    if (closeBtn) closeBtn.addEventListener('click', () => notif.classList.add('hidden'));
    // Auto-dismiss after 5s
    setTimeout(() => { if (notif) notif.classList.add('hidden'); }, 5000);

    // Navbar
    const nav = document.querySelector('.nav');
    window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 50));

    // Mobile menu
    const burger = document.getElementById('nav-burger');
    const navLinks = document.getElementById('nav-links');
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

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            const t = document.querySelector(a.getAttribute('href'));
            if (t) window.scrollTo({ top: t.offsetTop - 80, behavior: 'smooth' });
        });
    });

    // Reveal
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

    // Render projects
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
                : `<div class="project-thumb-placeholder">${esc(p.title.charAt(0))}</div>`;
            const tags = (p.tags||[]).map(t => `<span class="project-tag">${esc(t)}</span>`).join('');
            const link = p.link ? `<a href="${esc(p.link)}" target="_blank" class="project-link">CLAIM REWARD →</a>` : '';
            card.innerHTML = `<div class="project-thumb">${thumb}</div><div class="project-body"><div class="project-tags">${tags}</div><h3 class="project-title">${esc(p.title)}</h3><p class="project-desc">${esc(p.description)}</p>${link}</div>`;
            grid.appendChild(card);
            setTimeout(() => obs.observe(card), 50);
        });
    }
    renderProjects();

    // Hero parallax
    const heroContent = document.querySelector('.hero-content');
    window.addEventListener('scroll', () => {
        const s = window.scrollY;
        if (s < window.innerHeight && heroContent) {
            heroContent.style.transform = `translateY(${s * 0.1}px)`;
            heroContent.style.opacity = 1 - s / (window.innerHeight * 0.8);
        }
    });
});
