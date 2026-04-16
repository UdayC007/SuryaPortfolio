const PortfolioData = (() => {
    const STORAGE_KEY = 'surya_portfolio_projects';
    const ADMIN_KEY = 'surya_admin_password';

    const defaultProjects = [
        { id: '1', title: 'Meditation App Design', description: 'A calming, minimal mobile app for daily meditation with ambient soundscapes and progress tracking.', tags: ['Mobile', 'Wellness', 'UI Design'], image: '', link: '', color: '#c9a96e', createdAt: Date.now() },
        { id: '2', title: 'Portfolio Website Concept', description: 'A clean, typography-focused portfolio template designed for creative professionals.', tags: ['Web Design', 'Typography', 'Figma'], image: '', link: '', color: '#1a1a1a', createdAt: Date.now() - 1000 },
        { id: '3', title: 'Restaurant Booking System', description: 'End-to-end UX design for a restaurant table booking app with review integration.', tags: ['UX Research', 'Case Study', 'Prototype'], image: '', link: '', color: '#8b5e3c', createdAt: Date.now() - 2000 },
        { id: '4', title: 'Smart Home Dashboard', description: 'Minimalist IoT dashboard for controlling home devices with an emphasis on accessibility.', tags: ['Dashboard', 'IoT', 'Accessibility'], image: '', link: '', color: '#4a7c6f', createdAt: Date.now() - 3000 }
    ];

    function getProjects() {
        const s = localStorage.getItem(STORAGE_KEY);
        if (s) return JSON.parse(s);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProjects));
        return defaultProjects;
    }
    function saveProjects(p) { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }
    function addProject(p) { const all = getProjects(); p.id = Date.now().toString(); p.createdAt = Date.now(); all.unshift(p); saveProjects(all); return p; }
    function updateProject(id, d) { const all = getProjects(); const i = all.findIndex(p => p.id === id); if (i !== -1) { all[i] = { ...all[i], ...d }; saveProjects(all); return all[i]; } return null; }
    function deleteProject(id) { const all = getProjects().filter(p => p.id !== id); saveProjects(all); return all; }
    function getProject(id) { return getProjects().find(p => p.id === id) || null; }
    function setupAdmin(pw) { localStorage.setItem(ADMIN_KEY, btoa(pw)); }
    function verifyAdmin(pw) { const s = localStorage.getItem(ADMIN_KEY); if (!s) { setupAdmin('surya2026'); return pw === 'surya2026'; } return btoa(pw) === s; }
    function changePassword(o, n) { if (verifyAdmin(o)) { setupAdmin(n); return true; } return false; }
    function isFirstSetup() { return !localStorage.getItem(ADMIN_KEY); }
    return { getProjects, addProject, updateProject, deleteProject, getProject, verifyAdmin, changePassword, isFirstSetup };
})();
