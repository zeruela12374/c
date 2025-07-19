class SearchManager {
    constructor() {
        this.searchInput = null;
        this.searchResults = null;
        this.searchOverlay = null;
        this.courses = [];
        this.searchTimeout = null;
        this.isSearchActive = false;
        this.minSearchLength = 3;
        this.maxResults = 5;
        
        this.init();
    }

    init() {
        this.createSearchElements();
        this.setupEventListeners();
        this.loadCourses();
    }

    createSearchElements() {
        // Encontrar o input de pesquisa existente
        this.searchInput = document.querySelector('.search-container input');
        if (!this.searchInput) return;

        // Criar container de resultados
        this.createSearchResultsContainer();
        
        // Criar overlay para fechar pesquisa
        this.createSearchOverlay();
    }

    createSearchResultsContainer() {
        const searchContainer = document.querySelector('.search-container');
        
        this.searchResults = document.createElement('div');
        this.searchResults.className = 'search-results';
        this.searchResults.innerHTML = `
            <div class="search-results-content">
                <div class="search-loading" style="display: none;">
                    <div class="search-spinner"></div>
                    <span>Buscando cursos...</span>
                </div>
                <div class="search-items"></div>
                <div class="search-no-results" style="display: none;">
                    <div class="no-results-icon">🔍</div>
                    <p>Nenhum curso encontrado para sua busca.</p>
                    <small>Tente usar palavras-chave diferentes.</small>
                </div>
                <div class="search-footer" style="display: none;">
                    <button class="search-view-all btn btn-primary">
                        Ver todos os resultados
                    </button>
                </div>
            </div>
        `;
        
        searchContainer.appendChild(this.searchResults);
    }

    createSearchOverlay() {
        this.searchOverlay = document.createElement('div');
        this.searchOverlay.className = 'search-overlay';
        document.body.appendChild(this.searchOverlay);
    }

    setupEventListeners() {
        if (!this.searchInput) return;

        // Input de pesquisa
        this.searchInput.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });

        // Focus e blur
        this.searchInput.addEventListener('focus', () => {
            if (this.searchInput.value.length >= this.minSearchLength) {
                this.showSearchResults();
            }
        });

        // Teclas especiais
        this.searchInput.addEventListener('keydown', (e) => {
            this.handleKeyNavigation(e);
        });

        // Clique no overlay para fechar
        this.searchOverlay.addEventListener('click', () => {
            this.hideSearchResults();
        });

        // Clique fora para fechar
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideSearchResults();
            }
        });

        // Botão "Ver todos"
        this.searchResults.addEventListener('click', (e) => {
            if (e.target.classList.contains('search-view-all')) {
                this.viewAllResults();
            }
        });

        // Escape para fechar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isSearchActive) {
                this.hideSearchResults();
                this.searchInput.blur();
            }
        });
    }

    async loadCourses() {
        try {
            const response = await fetch('/api/courses');
            if (response.ok) {
                this.courses = await response.json();
            }
        } catch (error) {
            console.error('Erro ao carregar cursos para pesquisa:', error);
        }
    }

    handleSearchInput(query) {
        // Limpar timeout anterior
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Se a query for muito curta, esconder resultados
        if (query.length < this.minSearchLength) {
            this.hideSearchResults();
            return;
        }

        // Mostrar loading
        this.showLoading();

        // Debounce da pesquisa
        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    }

    performSearch(query) {
        const results = this.searchCourses(query);
        this.displayResults(results, query);
    }

    searchCourses(query) {
        const searchTerm = query.toLowerCase().trim();
        
        return this.courses.filter(course => {
            const titleMatch = course.title.toLowerCase().includes(searchTerm);
            const categoryMatch = course.category.toLowerCase().includes(searchTerm);
            const descriptionMatch = course.description.toLowerCase().includes(searchTerm);
            
            return titleMatch || categoryMatch || descriptionMatch;
        }).slice(0, this.maxResults);
    }

    displayResults(results, query) {
        const searchItems = this.searchResults.querySelector('.search-items');
        const noResults = this.searchResults.querySelector('.search-no-results');
        const footer = this.searchResults.querySelector('.search-footer');
        
        // Limpar resultados anteriores
        searchItems.innerHTML = '';
        
        if (results.length === 0) {
            // Mostrar estado de "nenhum resultado"
            searchItems.style.display = 'none';
            noResults.style.display = 'block';
            footer.style.display = 'none';
        } else {
            // Mostrar resultados
            searchItems.style.display = 'block';
            noResults.style.display = 'none';
            footer.style.display = 'block';
            
            results.forEach((course, index) => {
                const item = this.createSearchItem(course, query, index);
                searchItems.appendChild(item);
            });
            
            // Atualizar botão "Ver todos"
            const viewAllBtn = footer.querySelector('.search-view-all');
            const totalResults = this.searchCourses(query).length;
            if (totalResults > this.maxResults) {
                viewAllBtn.textContent = `Ver todos os ${totalResults} resultados`;
            } else {
                viewAllBtn.textContent = 'Ver todos os resultados';
            }
        }
        
        this.hideLoading();
        this.showSearchResults();
    }

    createSearchItem(course, query, index) {
        const item = document.createElement('div');
        item.className = 'search-item';
        item.setAttribute('data-index', index);
        
        // Destacar termo pesquisado no título
        const highlightedTitle = this.highlightSearchTerm(course.title, query);
        
        // Determinar URL do curso
        const courseUrl = course.downloadUrl && course.downloadUrl.trim() !== '' 
            ? course.downloadUrl 
            : course.courseUrl;
        
        // Determinar se é download
        const isDownload = course.downloadUrl && course.downloadUrl.trim() !== '';
        
        item.innerHTML = `
            <div class="search-item-image">
                <img src="${this.escapeHtml(course.imageUrl)}" 
                     alt="${this.escapeHtml(course.title)}"
                     onerror="this.src='https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg'">
            </div>
            <div class="search-item-content">
                <h4 class="search-item-title">${highlightedTitle}</h4>
                <p class="search-item-category">${this.escapeHtml(course.category)}</p>
                <span class="search-item-page">${this.getPageDisplayName(course.page)}</span>
            </div>
            <div class="search-item-action">
                <span class="search-item-icon">${isDownload ? '📥' : '🔗'}</span>
            </div>
        `;
        
        // Adicionar evento de clique
        item.addEventListener('click', () => {
            this.selectSearchItem(course, courseUrl, isDownload);
        });
        
        return item;
    }

    highlightSearchTerm(text, query) {
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    selectSearchItem(course, url, isDownload) {
        // Esconder resultados
        this.hideSearchResults();
        
        // Limpar input
        this.searchInput.value = '';
        
        // Abrir curso
        if (isDownload) {
            // Para downloads, criar link temporário
            const link = document.createElement('a');
            link.href = url;
            link.download = '';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            // Para cursos normais, abrir em nova aba
            window.open(url, '_blank', 'noopener,noreferrer');
        }
        
        // Analytics (opcional)
        this.trackSearchClick(course);
    }

    viewAllResults() {
        const query = this.searchInput.value;
        this.hideSearchResults();
        
        // Criar página de resultados ou redirecionar
        this.showAllResultsPage(query);
    }

    showAllResultsPage(query) {
        // Criar modal com todos os resultados
        const allResults = this.courses.filter(course => {
            const searchTerm = query.toLowerCase().trim();
            return course.title.toLowerCase().includes(searchTerm) ||
                   course.category.toLowerCase().includes(searchTerm) ||
                   course.description.toLowerCase().includes(searchTerm);
        });
        
        this.createResultsModal(allResults, query);
    }

    createResultsModal(results, query) {
        // Remover modal existente
        const existingModal = document.querySelector('.search-results-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'search-results-modal modal-overlay active';
        modal.innerHTML = `
            <div class="modal modal-large">
                <div class="modal-header">
                    <h3>Resultados da pesquisa: "${this.escapeHtml(query)}"</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-content">
                    <div class="search-results-grid">
                        ${results.map(course => this.createResultCard(course)).join('')}
                    </div>
                    ${results.length === 0 ? `
                        <div class="no-results-full">
                            <div class="no-results-icon">🔍</div>
                            <h3>Nenhum curso encontrado</h3>
                            <p>Não encontramos cursos que correspondam à sua pesquisa.</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    createResultCard(course) {
        const courseUrl = course.downloadUrl && course.downloadUrl.trim() !== '' 
            ? course.downloadUrl 
            : course.courseUrl;
        const isDownload = course.downloadUrl && course.downloadUrl.trim() !== '';
        const buttonText = isDownload ? 'Baixar' : 'Inscreva-se';
        
        return `
            <div class="search-result-card">
                <div class="result-card-image">
                    <img src="${this.escapeHtml(course.imageUrl)}" 
                         alt="${this.escapeHtml(course.title)}"
                         onerror="this.src='https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg'">
                </div>
                <div class="result-card-content">
                    <h4>${this.escapeHtml(course.title)}</h4>
                    <p class="result-card-category">${this.escapeHtml(course.category)}</p>
                    <p class="result-card-description">${this.escapeHtml(course.description)}</p>
                    <div class="result-card-footer">
                        <span class="result-card-page">${this.getPageDisplayName(course.page)}</span>
                        <a href="${this.escapeHtml(courseUrl)}" 
                           target="_blank" 
                           class="btn btn-secondary btn-sm"
                           ${isDownload ? 'download' : ''}
                           rel="noopener noreferrer">
                            ${buttonText}
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    showSearchResults() {
        this.isSearchActive = true;
        this.searchResults.classList.add('active');
        this.searchOverlay.classList.add('active');
        document.body.classList.add('search-active');
    }

    hideSearchResults() {
        this.isSearchActive = false;
        this.searchResults.classList.remove('active');
        this.searchOverlay.classList.remove('active');
        document.body.classList.remove('search-active');
    }

    showLoading() {
        const loading = this.searchResults.querySelector('.search-loading');
        const items = this.searchResults.querySelector('.search-items');
        const noResults = this.searchResults.querySelector('.search-no-results');
        
        loading.style.display = 'flex';
        items.style.display = 'none';
        noResults.style.display = 'none';
        
        this.showSearchResults();
    }

    hideLoading() {
        const loading = this.searchResults.querySelector('.search-loading');
        loading.style.display = 'none';
    }

    handleKeyNavigation(e) {
        if (!this.isSearchActive) return;
        
        const items = this.searchResults.querySelectorAll('.search-item');
        const currentActive = this.searchResults.querySelector('.search-item.active');
        let currentIndex = currentActive ? parseInt(currentActive.dataset.index) : -1;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                currentIndex = Math.min(currentIndex + 1, items.length - 1);
                this.setActiveItem(currentIndex);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                currentIndex = Math.max(currentIndex - 1, 0);
                this.setActiveItem(currentIndex);
                break;
                
            case 'Enter':
                e.preventDefault();
                if (currentActive) {
                    currentActive.click();
                }
                break;
        }
    }

    setActiveItem(index) {
        const items = this.searchResults.querySelectorAll('.search-item');
        
        // Remover classe ativa de todos os itens
        items.forEach(item => item.classList.remove('active'));
        
        // Adicionar classe ativa ao item atual
        if (items[index]) {
            items[index].classList.add('active');
            items[index].scrollIntoView({ block: 'nearest' });
        }
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

    trackSearchClick(course) {
        // Implementar analytics se necessário
        console.log('Curso selecionado via pesquisa:', course.title);
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

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.searchManager = new SearchManager();
});