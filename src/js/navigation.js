// Navigation state
let currentPage = '';

// Cache for loaded pages
const pageCache = new Map();

// Active link class
const ACTIVE_CLASS = 'nav-link-active';

// Map of valid routes
const routes = {
  'index.html': '/',
  'entrar.html': '/entrar',
  'empreend.html': '/empreend',
  'financ.html': '/financ',
  'novoemp.html': '/novoemp',
  'parceiros.html': '/parceiros',
  'primeiroemprego.html': '/primeiro-emprego'
};

// Initialize navigation system
export function initNavigation() {
  // Handle initial page load
  handleCurrentPage();
  
  // Add click handlers to all navigation links
  document.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && isInternalLink(href)) {
      link.addEventListener('click', handleNavigation);
    }
  });

  // Handle browser back/forward buttons
  window.addEventListener('popstate', handlePopState);
}

// Handle navigation click events
async function handleNavigation(e) {
  const link = e.currentTarget;
  const href = link.getAttribute('href');

  // Skip if it's an anchor link
  if (href.startsWith('#')) return;

  e.preventDefault();

  try {
    await navigateToPage(href);
  } catch (error) {
    console.error('Navigation error:', error);
    // Show error message to user
    showErrorMessage('Não foi possível carregar a página. Por favor, tente novamente.');
  }
}

// Navigate to a new page
async function navigateToPage(path) {
  // Show loading state
  document.body.style.cursor = 'wait';

  try {
    // Get page content
    const content = await loadPage(path);
    
    // Update URL and history
    const newUrl = getRouteUrl(path);
    window.history.pushState({ path }, '', newUrl);

    // Update page content
    updatePageContent(content);
    
    // Update active link
    updateActiveLink(path);

    // Scroll to top
    window.scrollTo(0, 0);
  } finally {
    // Reset cursor
    document.body.style.cursor = '';
  }
}

// Load page content
async function loadPage(path) {
  // Check cache first
  if (pageCache.has(path)) {
    return pageCache.get(path);
  }

  // Load page
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load page: ${path}`);
  }

  const html = await response.text();
  
  // Cache the result
  pageCache.set(path, html);
  
  return html;
}

// Update page content
function updatePageContent(html) {
  // Create temporary element to parse HTML
  const doc = new DOMParser().parseFromString(html, 'text/html');
  
  // Update main content
  const newMain = doc.querySelector('main');
  const currentMain = document.querySelector('main');
  if (newMain && currentMain) {
    currentMain.innerHTML = newMain.innerHTML;
  }

  // Update title
  document.title = doc.title;

  // Re-run scripts
  const scripts = doc.querySelectorAll('script');
  scripts.forEach(script => {
    if (script.src) {
      // Load external script
      const newScript = document.createElement('script');
      newScript.src = script.src;
      document.body.appendChild(newScript);
    } else {
      // Execute inline script
      eval(script.textContent);
    }
  });
}

// Update active link in navigation
function updateActiveLink(path) {
  // Remove active class from all links
  document.querySelectorAll(`.${ACTIVE_CLASS}`).forEach(link => {
    link.classList.remove(ACTIVE_CLASS);
  });

  // Add active class to current page links
  const currentLinks = document.querySelectorAll(`a[href="${path}"]`);
  currentLinks.forEach(link => {
    link.classList.add(ACTIVE_CLASS);
  });
}

// Handle browser back/forward
function handlePopState(e) {
  if (e.state?.path) {
    navigateToPage(e.state.path);
  }
}

// Handle initial page load
function handleCurrentPage() {
  const path = window.location.pathname;
  currentPage = path;
  updateActiveLink(getPagePath(path));
}

// Helper to check if link is internal
function isInternalLink(href) {
  if (href.startsWith('#')) return false;
  if (href.startsWith('http')) return false;
  return true;
}

// Get route URL from page path
function getRouteUrl(path) {
  return routes[path] || path;
}

// Get page path from route URL
function getPagePath(route) {
  const entry = Object.entries(routes).find(([_, value]) => value === route);
  return entry ? entry[0] : route;
}

// Show error message
function showErrorMessage(message) {
  // You can implement your own error UI here
  alert(message);
}