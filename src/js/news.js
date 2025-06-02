import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

class NewsManager {
    constructor() {
        this.newsContainer = document.querySelector('.news-grid');
        this.newsCache = new Map();
        this.currentPage = 1;
        this.newsPerPage = 4;
    }

    async init() {
        try {
            await this.updateNews();
            this.setupInfiniteScroll();
        } catch (error) {
            console.error('Error initializing news:', error);
            this.handleError(error);
        }
    }

    async updateNews() {
        try {
            const response = await axios.get('https://api.eb.mil.br/noticias', {
                params: {
                    page: this.currentPage,
                    per_page: this.newsPerPage
                }
            });

            const news = response.data;
            this.displayNews(news);
        } catch (error) {
            console.error('Error fetching news:', error);
            this.handleError(error);
            // Use fallback news if API fails
            this.displayFallbackNews();
        }
    }

    displayNews(newsItems) {
        if (!this.newsContainer) return;
        
        newsItems.forEach(news => {
            if (this.newsCache.has(news.id)) return;
            
            const article = document.createElement('article');
            article.className = 'news-item';
            
            article.innerHTML = `
                <img src="${news.image || 'https://via.placeholder.com/300x150?text=Notícia+Militar'}" 
                     alt="${news.title}">
                <h3>${news.title}</h3>
                <p>${news.summary}</p>
                <div class="news-meta">
                    <span class="news-date">
                        ${format(parseISO(news.publishedAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                </div>
                <a href="${news.url}" target="_blank" rel="noopener noreferrer">Leia Mais</a>
            `;
            
            this.newsContainer.appendChild(article);
            this.newsCache.set(news.id, true);
        });
    }

    displayFallbackNews() {
        const fallbackNews = [
            {
                title: "Exército Brasileiro realiza exercício de adestramento",
                summary: "Militares participam de treinamento conjunto para aprimorar técnicas de combate e estratégia.",
                image: "https://images.pexels.com/photos/1236701/pexels-photo-1236701.jpeg",
                url: "https://www.eb.mil.br"
            },
            {
                title: "Programa de Modernização do Exército avança",
                summary: "Novos equipamentos e tecnologias são incorporados às forças terrestres brasileiras.",
                image: "https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg",
                url: "https://www.eb.mil.br"
            }
        ];

        this.displayNews(fallbackNews.map((news, index) => ({
            ...news,
            id: `fallback-${index}`,
            publishedAt: new Date().toISOString()
        })));
    }

    handleError(error) {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'news-error';
        errorMessage.innerHTML = `
            <p>Não foi possível carregar as notícias no momento. 
               Por favor, tente novamente mais tarde.</p>
        `;
        
        if (this.newsContainer.children.length === 0) {
            this.newsContainer.appendChild(errorMessage);
        }
    }

    setupInfiniteScroll() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.currentPage++;
                    this.updateNews();
                }
            });
        }, options);

        const sentinel = document.createElement('div');
        sentinel.className = 'scroll-sentinel';
        this.newsContainer.appendChild(sentinel);
        observer.observe(sentinel);
    }
}

// Initialize news manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const newsManager = new NewsManager();
    newsManager.init();
});