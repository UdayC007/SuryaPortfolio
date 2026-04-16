/* ========================================
   Admin Portal Logic
   Login, CRUD, settings
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

    // --- Elements ---
    const loginScreen = document.getElementById('login-screen');
    const dashboard = document.getElementById('admin-dashboard');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const loginPassword = document.getElementById('login-password');

    const projectsList = document.getElementById('projects-list');
    const emptyProjects = document.getElementById('empty-projects');
    const addProjectBtn = document.getElementById('add-project-btn');

    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalClose = document.getElementById('modal-close');
    const modalCancel = document.getElementById('modal-cancel');
    const projectForm = document.getElementById('project-form');

    const toast = document.getElementById('toast');
    const logoutBtn = document.getElementById('logout-btn');

    // Sidebar navigation
    const sidebarLinks = document.querySelectorAll('.sidebar-link[data-section]');
    const sections = {
        projects: document.getElementById('section-projects'),
        settings: document.getElementById('section-settings')
    };

    // Settings
    const passwordForm = document.getElementById('password-form');
    const resetBtn = document.getElementById('reset-btn');

    // Color picker
    const colorInput = document.getElementById('project-color');
    const colorValue = document.getElementById('color-value');
    colorInput.addEventListener('input', () => {
        colorValue.textContent = colorInput.value;
    });

    // --- Image Upload ---
    const uploadArea = document.getElementById('upload-area');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const uploadPreview = document.getElementById('upload-preview');
    const uploadRemove = document.getElementById('upload-remove');
    const imageFileInput = document.getElementById('project-image-file');
    const imageHidden = document.getElementById('project-image');
    const imageUrlInput = document.getElementById('project-image-url');

    // Click to upload
    uploadArea.addEventListener('click', (e) => {
        if (e.target.closest('.upload-remove')) return;
        imageFileInput.click();
    });

    // File selected
    imageFileInput.addEventListener('change', () => {
        if (imageFileInput.files && imageFileInput.files[0]) {
            handleImageFile(imageFileInput.files[0]);
        }
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageFile(e.dataTransfer.files[0]);
        }
    });

    // Remove image
    uploadRemove.addEventListener('click', (e) => {
        e.stopPropagation();
        clearImageUpload();
    });

    // URL input fallback — show preview when URL is pasted
    imageUrlInput.addEventListener('input', () => {
        const url = imageUrlInput.value.trim();
        if (url) {
            showImagePreview(url);
            imageHidden.value = url;
        } else {
            clearImageUpload();
        }
    });

    function handleImageFile(file) {
        // Validate type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showToast('Only JPG, PNG, and WebP images are allowed.', 'error');
            return;
        }
        // Validate size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            showToast('Image must be under 2MB.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            showImagePreview(dataUrl);
            imageHidden.value = dataUrl;
            imageUrlInput.value = '';
        };
        reader.readAsDataURL(file);
    }

    function showImagePreview(src) {
        uploadPreview.src = src;
        uploadPreview.style.display = 'block';
        uploadPlaceholder.style.display = 'none';
        uploadRemove.style.display = 'flex';
    }

    function clearImageUpload() {
        uploadPreview.src = '';
        uploadPreview.style.display = 'none';
        uploadPlaceholder.style.display = 'flex';
        uploadRemove.style.display = 'none';
        imageHidden.value = '';
        imageUrlInput.value = '';
        imageFileInput.value = '';
    }

    // --- Login ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = loginPassword.value;
        if (PortfolioData.verifyAdmin(password)) {
            loginScreen.style.display = 'none';
            dashboard.style.display = 'flex';
            renderProjectsList();
        } else {
            loginError.classList.add('show');
            loginPassword.value = '';
            loginPassword.focus();
            setTimeout(() => loginError.classList.remove('show'), 3000);
        }
    });

    // --- Logout ---
    logoutBtn.addEventListener('click', () => {
        dashboard.style.display = 'none';
        loginScreen.style.display = '';
        loginPassword.value = '';
    });

    // --- Sidebar Navigation ---
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            Object.keys(sections).forEach(key => {
                sections[key].style.display = key === section ? '' : 'none';
            });
        });
    });

    // --- Render Projects List ---
    function renderProjectsList() {
        const projects = PortfolioData.getProjects();

        if (!projects || projects.length === 0) {
            projectsList.style.display = 'none';
            emptyProjects.style.display = '';
            return;
        }

        projectsList.style.display = '';
        emptyProjects.style.display = 'none';
        projectsList.innerHTML = '';

        projects.forEach(project => {
            const item = document.createElement('div');
            item.className = 'project-item';

            const tagsHtml = (project.tags || [])
                .map(t => `<span class="project-item-tag">${escapeHtml(t)}</span>`)
                .join('');

            const thumbHtml = project.image
                ? `<img class="project-item-thumb" src="${escapeHtml(project.image)}" alt="">`
                : `<div class="project-item-thumb project-item-thumb-letter" style="background: ${escapeHtml(project.color || '#ff6b35')}">${escapeHtml(project.title.charAt(0))}</div>`;

            item.innerHTML = `
                ${thumbHtml}
                <div class="project-item-info">
                    <div class="project-item-title">${escapeHtml(project.title)}</div>
                    <div class="project-item-desc">${escapeHtml(project.description)}</div>
                    <div class="project-item-tags">${tagsHtml}</div>
                </div>
                <div class="project-item-actions">
                    <button class="btn-icon edit-btn" data-id="${escapeHtml(project.id)}" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn-icon danger delete-btn" data-id="${escapeHtml(project.id)}" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                </div>
            `;

            projectsList.appendChild(item);
        });

        // Bind edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset.id));
        });

        // Bind delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteProject(btn.dataset.id));
        });
    }

    // --- Modal ---
    function openModal() {
        modalOverlay.classList.add('active');
    }

    function closeModal() {
        modalOverlay.classList.remove('active');
        projectForm.reset();
        document.getElementById('project-id').value = '';
        colorInput.value = '#ff6b35';
        colorValue.textContent = '#ff6b35';
        clearImageUpload();
    }

    addProjectBtn.addEventListener('click', () => {
        modalTitle.textContent = 'Add Project';
        document.getElementById('modal-submit').textContent = 'Add Project';
        closeModal(); // reset first
        openModal();
    });

    modalClose.addEventListener('click', closeModal);
    modalCancel.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    function openEditModal(id) {
        const project = PortfolioData.getProject(id);
        if (!project) return;

        modalTitle.textContent = 'Edit Project';
        document.getElementById('modal-submit').textContent = 'Save Changes';

        document.getElementById('project-id').value = project.id;
        document.getElementById('project-title').value = project.title;
        document.getElementById('project-description').value = project.description;
        document.getElementById('project-tags').value = (project.tags || []).join(', ');
        document.getElementById('project-link').value = project.link || '';
        colorInput.value = project.color || '#ff6b35';
        colorValue.textContent = project.color || '#ff6b35';

        // Show existing image in preview
        if (project.image) {
            imageHidden.value = project.image;
            if (project.image.startsWith('data:')) {
                showImagePreview(project.image);
                imageUrlInput.value = '';
            } else {
                showImagePreview(project.image);
                imageUrlInput.value = project.image;
            }
        } else {
            clearImageUpload();
        }

        openModal();
    }

    // --- Save Project ---
    projectForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const id = document.getElementById('project-id').value;
        const projectData = {
            title: document.getElementById('project-title').value.trim(),
            description: document.getElementById('project-description').value.trim(),
            tags: document.getElementById('project-tags').value
                .split(',')
                .map(t => t.trim())
                .filter(t => t),
            image: imageHidden.value.trim() || imageUrlInput.value.trim(),
            link: document.getElementById('project-link').value.trim(),
            color: colorInput.value
        };

        if (id) {
            PortfolioData.updateProject(id, projectData);
            showToast('Project updated!', 'success');
        } else {
            PortfolioData.addProject(projectData);
            showToast('Project added!', 'success');
        }

        closeModal();
        renderProjectsList();
    });

    // --- Delete Project ---
    function deleteProject(id) {
        const project = PortfolioData.getProject(id);
        if (!project) return;

        if (confirm(`Delete "${project.title}"? This cannot be undone.`)) {
            PortfolioData.deleteProject(id);
            showToast('Project deleted.', 'error');
            renderProjectsList();
        }
    }

    // --- Settings: Change Password ---
    passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = document.getElementById('password-message');
        const oldPass = document.getElementById('old-password').value;
        const newPass = document.getElementById('new-password').value;
        const confirmPass = document.getElementById('confirm-password').value;

        if (newPass !== confirmPass) {
            msg.textContent = 'New passwords do not match.';
            msg.className = 'form-message error';
            return;
        }

        if (PortfolioData.changePassword(oldPass, newPass)) {
            msg.textContent = 'Password updated successfully!';
            msg.className = 'form-message success';
            passwordForm.reset();
        } else {
            msg.textContent = 'Current password is incorrect.';
            msg.className = 'form-message error';
        }
    });

    // --- Settings: Reset ---
    resetBtn.addEventListener('click', () => {
        if (confirm('Reset all projects to sample data? This will remove all your current projects.')) {
            localStorage.removeItem('uday_portfolio_projects');
            PortfolioData.getProjects(); // re-initializes defaults
            renderProjectsList();
            showToast('Projects reset to defaults.', 'success');
        }
    });

    // --- Toast ---
    function showToast(message, type = '') {
        toast.textContent = message;
        toast.className = 'toast show ' + type;
        setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    }

    // --- Utility ---
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});
