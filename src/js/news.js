import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const NEWS_REFRESH_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

class NewsManager {
    constructor() {
        this.newsContainer = document.querySelector('.news-grid');
        this.lastUpdate = null;
    }

    async init() {
        await this.updateNews();
        setInterval(() => this.updateNews(), NEWS_REFRESH_INTERVAL);
    }

    async updateNews() {
        try {
            this.showLoading();
            const [armyNews, cityNews] = await Promise.all([
                this.fetchArmyNews(),
                this.fetchCityNews()
            ]);
            
            const combinedNews = [...armyNews, ...cityNews]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 3);

            this.renderNews(combinedNews);
            this.lastUpdate = new Date();
        } catch (error) {
            console.error('Error updating news:', error);
            this.showError();
        }
    }

    async fetchArmyNews() {
        const response = await axios.get('https://www.eb.mil.br/web/noticias/rss');
        // Process RSS feed data
        return this.processRSSFeed(response.data);
    }

    async fetchCityNews() {
        const response = await axios.get('https://web.arapiraca.al.gov.br/feed/');
        // Process RSS feed data
        return this.processRSSFeed(response.data);
    }

    processRSSFeed(feedData) {
        // Implementation of RSS feed processing
        // Returns array of news items with title, description, date, link, and image
    }

    renderNews(newsItems) {
        this.newsContainer.innerHTML = newsItems.map(item => `
            <article class="news-item">
                <img src="${item.image || 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg'}" 
                     alt="${item.title}">
                <div class="news-content">
                    <span class="news-date">${format(parseISO(item.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                    <a href="${item.link}" target="_blank" class="btn btn-secondary">Leia Mais</a>
                </div>
            </article>
        `).join('');
    }

    showLoading() {
        this.newsContainer.innerHTML = `
            <div class="loading-news">
                <p>Carregando notícias...</p>
            </div>`;
    }

    showError() {
        this.newsContainer.innerHTML = `
            <div class="news-error">
                <p>Não foi possível carregar as notícias. Tente novamente mais tarde.</p>
            </div>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const newsManager = new NewsManager();
    newsManager.init();
});