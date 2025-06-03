// News module for fetching and displaying news items
export async function loadNews() {
  const newsContainer = document.querySelector('.news-grid');
  if (!newsContainer) return; // Only run on pages with news grid

  try {
    // Example news data - in production this would fetch from an API
    const news = [
      {
        title: 'Novo programa de capacitação profissional',
        date: '2024-01-15',
        description: 'O TG lança novo programa de capacitação profissional para atiradores.',
        image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg'
      },
      {
        title: 'Parceria com empresas locais',
        date: '2024-01-10',
        description: 'Novas parcerias estabelecidas com empresas da região para contratação.',
        image: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg'
      },
      {
        title: 'Workshop de empreendedorismo',
        date: '2024-01-05',
        description: 'Workshop gratuito sobre empreendedorismo para atiradores.',
        image: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg'
      }
    ];

    // Create and append news items
    const newsHTML = news.map(item => `
      <article class="news-item">
        <img src="${item.image}" alt="${item.title}">
        <div class="news-content">
          <span class="news-date">${new Date(item.date).toLocaleDateString()}</span>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <a href="#" class="btn btn-secondary">Leia mais</a>
        </div>
      </article>
    `).join('');

    newsContainer.innerHTML = newsHTML;

  } catch (error) {
    console.error('Erro ao carregar notícias:', error);
    if (newsContainer) {
      newsContainer.innerHTML = `
        <div class="news-error">
          <p>Não foi possível carregar as notícias. Tente novamente mais tarde.</p>
        </div>
      `;
    }
  }
}

// Initialize news module when DOM is ready
document.addEventListener('DOMContentLoaded', loadNews);