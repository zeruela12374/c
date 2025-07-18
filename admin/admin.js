class AdminDashboard {
    constructor() {
        this.apiUrl = '/api';
        this.courses = [];
        this.filteredCourses = [];
        this.currentCourse = null;
        this.isEditing = false;
        
        this.init();
    }

    init() {
        // Verifica se o usuário está logado
        if (!this.isLoggedIn()) {
            window.location.href = 'index.html';
            return;
        }

        this.setupEventListeners();
        this.loadCourses();
    }

    setupEventListeners() {
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', this.logout.bind(this));

        // Botão de adicionar curso
        document.getElementById('addCourseBtn').addEventListener('click', () => {
            this.openCourseModal();
        });

        // Modal controls
        document.getElementById('closeModal').addEventListener('click', this.closeCourseModal.bind(this));
        document.getElementById('cancelBtn').addEventListener('click', this.closeCourseModal.bind(this));

        // Form submission
        document.getElementById('courseForm').addEventListener('submit', this.handleFormSubmit.bind(this));

        // Delete modal
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            this.hideModal('deleteModal');
        });
        document.getElementById('confirmDeleteBtn').addEventListener('click', this.confirmDelete.bind(this));

        // Filters
        document.getElementById('pageFilter').addEventListener('change', this.applyFilters.bind(this));
        document.getElementById('searchInput').addEventListener('input', this.applyFilters.bind(this));

        // Image preview
        document.getElementById('courseImageUrl').addEventListener('input', this.updateImagePreview.bind(this));

        // Close modals on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                }
            });
        });
    }

    isLoggedIn() {
        const loggedIn = localStorage.getItem('adminLoggedIn');
        const loginTime = localStorage.getItem('adminLoginTime');
        
        if (!loggedIn || !loginTime) return false;
        
        // Checa se o login foi feito há mais de 24 horas
        const now = Date.now();
        const loginTimestamp = parseInt(loginTime);
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        if (now - loginTimestamp > twentyFourHours) {
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminLoginTime');
            return false;
        }
        
        return true;
    }

    logout() {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminLoginTime');
        window.location.href = 'index.html';
    }

    async loadCourses() {
        try {
            this.showLoading(true);
            const response = await fetch(`${this.apiUrl}/courses`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.courses = await response.json();
            this.filteredCourses = [...this.courses];
            this.renderCourses();
            this.updateStats();
        } catch (error) {
            console.error('Error loading courses:', error);
            this.showToast('Erro ao carregar cursos. Verifique se a API está funcionando.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const loadingState = document.getElementById('loadingState');
        const table = document.getElementById('coursesTable');
        
        if (show) {
            loadingState.style.display = 'block';
            table.style.display = 'none';
        } else {
            loadingState.style.display = 'none';
            table.style.display = 'table';
        }
    }

    renderCourses() {
        const tbody = document.getElementById('coursesTableBody');
        const emptyState = document.getElementById('emptyState');
        
        if (this.filteredCourses.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            document.getElementById('coursesTable').style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        document.getElementById('coursesTable').style.display = 'table';

        tbody.innerHTML = this.filteredCourses.map(course => `
            <tr>
                <td>
                    <div style="max-width: 300px;">
                        <strong>${this.escapeHtml(course.title)}</strong>
                    </div>
                </td>
                <td>${this.escapeHtml(course.category)}</td>
                <td>
                    <span class="page-badge ${this.getPageClass(course.page)}">
                        ${this.getPageDisplayName(course.page)}
                    </span>
                </td>
                <td>
                    <span class="status-badge">Ativo</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-secondary btn-icon-only" onclick="adminDashboard.editCourse('${course.id}')" title="Editar">
                            ✏️
                        </button>
                        <button class="btn btn-danger btn-icon-only" onclick="adminDashboard.deleteCourse('${course.id}')" title="Excluir">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    updateStats() {
        const total = this.courses.length;
        const empreend = this.courses.filter(c => c.page === 'empreend.html').length;
        const job = this.courses.filter(c => c.page === 'primeiroemprego.html').length;
        const finance = this.courses.filter(c => c.page === 'financ.html').length;

        document.getElementById('totalCourses').textContent = total;
        document.getElementById('empreendCourses').textContent = empreend;
        document.getElementById('jobCourses').textContent = job;
        document.getElementById('financeCourses').textContent = finance;
    }

    applyFilters() {
        const pageFilter = document.getElementById('pageFilter').value;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();

        this.filteredCourses = this.courses.filter(course => {
            const matchesPage = !pageFilter || course.page === pageFilter;
            const matchesSearch = !searchTerm || 
                course.title.toLowerCase().includes(searchTerm) ||
                course.category.toLowerCase().includes(searchTerm) ||
                course.description.toLowerCase().includes(searchTerm);

            return matchesPage && matchesSearch;
        });

        this.renderCourses();
    }

    openCourseModal(course = null) {
        this.currentCourse = course;
        this.isEditing = !!course;

        const modal = document.getElementById('courseModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('courseForm');

        modalTitle.textContent = this.isEditing ? 'Editar Curso' : 'Adicionar Novo Curso';

        if (this.isEditing) {

            document.getElementById('courseTitle').value = course.title;
            document.getElementById('courseCategory').value = course.category;
            document.getElementById('courseDescription').value = course.description;
            document.getElementById('courseImageUrl').value = course.imageUrl;
            document.getElementById('courseUrl').value = course.courseUrl;
            document.getElementById('coursePage').value = course.page;
            this.updateImagePreview();
        } else {
            form.reset();
            document.getElementById('imagePreview').style.display = 'none';
        }

        this.showModal('courseModal');
    }

    closeCourseModal() {
        this.hideModal('courseModal');
        this.currentCourse = null;
        this.isEditing = false;
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const courseData = {
            title: formData.get('title'),
            category: formData.get('category'),
            description: formData.get('description'),
            imageUrl: formData.get('imageUrl'),
            courseUrl: formData.get('courseUrl'),
            page: formData.get('page')
        };

        // Validação dos dados do curso
        if (!this.validateCourseData(courseData)) {
            return;
        }

        try {
            this.showButtonLoading('saveBtn', true);

            let response;
            if (this.isEditing) {
                response = await fetch(`${this.apiUrl}/courses/${this.currentCourse.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(courseData)
                });
            } else {
                response = await fetch(`${this.apiUrl}/courses`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(courseData)
                });
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const savedCourse = await response.json();
            
            if (this.isEditing) {
                const index = this.courses.findIndex(c => c.id === this.currentCourse.id);
                this.courses[index] = savedCourse;
                this.showToast('Curso atualizado com sucesso!');
            } else {
                this.courses.push(savedCourse);
                this.showToast('Curso adicionado com sucesso!');
            }

            this.filteredCourses = [...this.courses];
            this.renderCourses();
            this.updateStats();
            this.closeCourseModal();

        } catch (error) {
            console.error('Error saving course:', error);
            this.showToast('Erro ao salvar curso. Tente novamente.', 'error');
        } finally {
            this.showButtonLoading('saveBtn', false);
        }
    }

    validateCourseData(data) {
        const requiredFields = ['title', 'category', 'description', 'imageUrl', 'courseUrl', 'page'];
        
        for (const field of requiredFields) {
            if (!data[field] || data[field].trim() === '') {
                this.showToast(`O campo ${this.getFieldDisplayName(field)} é obrigatório.`, 'error');
                return false;
            }
        }

        // Validar URLs
        try {
            new URL(data.imageUrl);
            new URL(data.courseUrl);
        } catch (error) {
            this.showToast('Por favor, insira URLs válidas.', 'error');
            return false;
        }

        return true;
    }

    editCourse(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (course) {
            this.openCourseModal(course);
        }
    }

    deleteCourse(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (course) {
            this.currentCourse = course;
            document.getElementById('deleteCourseTitle').textContent = course.title;
            this.showModal('deleteModal');
        }
    }

    async confirmDelete() {
        if (!this.currentCourse) return;

        try {
            this.showButtonLoading('confirmDeleteBtn', true);

            const response = await fetch(`${this.apiUrl}/courses/${this.currentCourse.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.courses = this.courses.filter(c => c.id !== this.currentCourse.id);
            this.filteredCourses = [...this.courses];
            this.renderCourses();
            this.updateStats();
            this.hideModal('deleteModal');
            this.showToast('Curso excluído com sucesso!');

        } catch (error) {
            console.error('Error deleting course:', error);
            this.showToast('Erro ao excluir curso. Tente novamente.', 'error');
        } finally {
            this.showButtonLoading('confirmDeleteBtn', false);
        }
    }

    updateImagePreview() {
        const imageUrl = document.getElementById('courseImageUrl').value;
        const preview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');

        if (imageUrl && this.isValidUrl(imageUrl)) {
            previewImg.src = imageUrl;
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
        }
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        document.body.style.overflow = '';
    }

    showButtonLoading(buttonId, show) {
        const button = document.getElementById(buttonId);
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');

        if (show) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'flex';
            button.disabled = true;
        } else {
            btnText.style.display = 'block';
            btnLoading.style.display = 'none';
            button.disabled = false;
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('successToast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        
        if (type === 'error') {
            toast.style.background = '#dc3545';
        } else {
            toast.style.background = '#28a745';
        }

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    getPageClass(page) {
        const pageMap = {
            'empreend.html': 'empreend',
            'primeiroemprego.html': 'primeiro',
            'novoemp.html': 'novo',
            'financ.html': 'financ',
            'habitos.html': 'habitos'
        };
        return pageMap[page] || 'default';
    }

    getPageDisplayName(page) {
        const pageMap = {
            'empreend.html': 'Empreendedorismo',
            'primeiroemprego.html': 'Primeiro Emprego',
            'novoemp.html': 'Novo Emprego',
            'financ.html': 'Ed. Financeira',
            'habitos.html': 'Hábitos Saudáveis'
        };
        return pageMap[page] || page;
    }

    getFieldDisplayName(field) {
        const fieldMap = {
            'title': 'Título',
            'category': 'Categoria',
            'description': 'Descrição',
            'imageUrl': 'URL da Imagem',
            'courseUrl': 'URL do Curso',
            'page': 'Página'
        };
        return fieldMap[field] || field;
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Inicializa o dashboard quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});