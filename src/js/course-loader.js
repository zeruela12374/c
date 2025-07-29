class CourseLoader {
    constructor() {
        this.apiUrl = '/api';
        this.currentPage = this.getCurrentPage();
        this.allCourses = []; // Armazena todos os cursos da página
        this.init();
    }

    init() {
        if (this.currentPage) {
            this.loadCourses();
        }
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        
        const validPages = [
            'empreend.html',
            'primeiroemprego.html', 
            'novoemp.html',
            'financ.html',
            'habitos.html'
        ];

        return validPages.includes(filename) ? filename : null;
    }

    async loadCourses() {
        const courseGrid = document.querySelector('.course-grid');
        if (!courseGrid) return;

        this.showLoadingState(courseGrid);

        try {
            // Usamos o novo parâmetro `pageName` da API
            const response = await fetch(`${this.apiUrl}/courses?pageName=${this.currentPage}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.allCourses = await response.json();
            this.renderCourses(this.allCourses, courseGrid);
            this.populateFilters(); // Popula os filtros com base nos cursos carregados
            this.setupFilterListeners(); // Configura os eventos dos filtros

        } catch (error) {
            console.error('Error loading courses:', error);
            this.showErrorState(courseGrid);
        }
    }

    populateFilters() {
        const institutions = new Set();
        const durations = new Set();
        const durationRegex = /(\d+\s*horas?)/i;

        this.allCourses.forEach(course => {
            // Extrai a instituição
            const institution = course.category.split('-')[0].trim();
            if (institution) institutions.add(institution);

            // Extrai a duração
            const durationMatch = course.category.match(durationRegex);
            if (durationMatch) durations.add(durationMatch[0]);
        });

        const institutionFilter = document.getElementById('institution-filter');
        const durationFilter = document.getElementById('duration-filter');

        if (institutionFilter) {
            [...institutions].sort().forEach(inst => {
                const option = document.createElement('option');
                option.value = inst;
                option.textContent = inst;
                institutionFilter.appendChild(option);
            });
        }

        if (durationFilter) {
            [...durations].sort((a, b) => parseInt(a) - parseInt(b)).forEach(dur => {
                const option = document.createElement('option');
                option.value = dur;
                option.textContent = dur;
                durationFilter.appendChild(option);
            });
        }
    }

    setupFilterListeners() {
        document.getElementById('keyword-search')?.addEventListener('input', () => this.applyFilters());
        document.getElementById('institution-filter')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('duration-filter')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('clear-filters-btn')?.addEventListener('click', () => this.clearFilters());
    }

    applyFilters() {
        const keyword = document.getElementById('keyword-search').value.toLowerCase();
        const institution = document.getElementById('institution-filter').value;
        const duration = document.getElementById('duration-filter').value;

        const filteredCourses = this.allCourses.filter(course => {
            const matchesKeyword = course.title.toLowerCase().includes(keyword) || course.description.toLowerCase().includes(keyword);
            const matchesInstitution = !institution || course.category.includes(institution);
            const matchesDuration = !duration || course.category.includes(duration);

            return matchesKeyword && matchesInstitution && matchesDuration;
        });

        this.renderCourses(filteredCourses, document.querySelector('.course-grid'));
    }

    clearFilters() {
        document.getElementById('keyword-search').value = '';
        document.getElementById('institution-filter').value = '';
        document.getElementById('duration-filter').value = '';
        this.applyFilters();
    }

    showLoadingState(container) {
        container.innerHTML = `<div class="loading-courses"><div class="loading-spinner"></div><p>Carregando cursos...</p></div>`;
    }

    showErrorState(container) {
        container.innerHTML = `<div class="error-courses"><div class="error-icon">⚠️</div><h3>Erro ao carregar cursos</h3><p>Tente novamente mais tarde.</p></div>`;
    }

    renderCourses(courses, container) {
        if (!container) return;
        if (courses.length === 0) {
            container.innerHTML = `<div class="no-courses"><div class="no-courses-icon">📚</div><h3>Nenhum curso encontrado</h3><p>Tente ajustar seus filtros ou verifique novamente mais tarde.</p></div>`;
            return;
        }

        container.innerHTML = '';
        courses.forEach(course => {
            const courseCard = this.createCourseCard(course);
            container.appendChild(courseCard);
        });
        this.animateCourseCards();
    }

    createCourseCard(course) {
        const card = document.createElement('div');
        card.className = 'course-card';
        
        const isDownload = course.downloadUrl && course.downloadUrl.trim() !== '';
        const buttonText = isDownload ? 'Baixar Material' : 'Inscreva-se';
        const buttonUrl = isDownload ? course.downloadUrl : course.courseUrl;
        const downloadAttribute = isDownload ? 'download' : '';

        card.innerHTML = `
            <div class="image-container">
                <img src="${this.escapeHtml(course.imageUrl)}" alt="${this.escapeHtml(course.title)}" onerror="this.src='https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg'">
            </div>
            <div class="course-info">
                <h3>${this.escapeHtml(course.title)}</h3>
                <p class="course-category">${this.escapeHtml(course.category)}</p>
                <p>${this.escapeHtml(course.description)}</p>
                <a href="${this.escapeHtml(buttonUrl)}" target="_blank" class="btn btn-secondary" rel="noopener noreferrer" ${downloadAttribute}>
                    ${this.escapeHtml(buttonText)}
                </a>
            </div>`;
        return card;
    }

    animateCourseCards() {
        const cards = document.querySelectorAll('.course-card');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => entry.target.classList.add('animate-card'), index * 100);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        cards.forEach(card => observer.observe(card));
    }

    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Adiciona os estilos para os estados de carregamento/erro/vazio
const courseLoaderStyles = `
    .loading-courses, .error-courses, .no-courses {
        grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #666;
    }
    .loading-spinner {
        width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #4b5320;
        border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .error-icon, .no-courses-icon { font-size: 3rem; margin-bottom: 1rem; }
    .error-courses h3, .no-courses h3 { color: #2e3d28; margin-bottom: 0.5rem; font-family: 'PT Serif', serif; }
    .course-card { opacity: 0; transform: translateY(20px); transition: all 0.6s ease; }
    .course-card.animate-card { opacity: 1; transform: translateY(0); }
`;
const styleSheet = document.createElement('style');
styleSheet.textContent = courseLoaderStyles;
document.head.appendChild(styleSheet);

document.addEventListener('DOMContentLoaded', () => {
    new CourseLoader();
});