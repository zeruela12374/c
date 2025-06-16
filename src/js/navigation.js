// Navigation state
let currentPage = '';
let navigationInProgress = false;

// Cache for loaded pages with expiration
const pageCache = new Map();
const CACHE_EXPIRATION = 30 * 60 * 1000; // 30 minutes

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
  'primeiroemprego.html': '/primeiro-emprego',
  'habitos.html': '/habitos-saudaveis'
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
  
  // Clean expired cache periodically
  setInterval(cleanExpiredCache, CACHE_EXPIRATION);
}

// Clean expired cache entries
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, value] of pageCache.entries()) {
    if (now - value.timestamp > CACHE_EXPIRATION) {
      pageCache.delete(key);
    }
  }
}

// Handle navigation click events
async function handleNavigation(e) {
  if (navigationInProgress) return;
  
  const link = e.currentTarget;
  const href = link.getAttribute('href');

  // Skip if it's an anchor link
  if (href.startsWith('#')) return;

  e.preventDefault();
  navigationInProgress = true;

  try {
    await navigateToPage(href);
  } catch (error) {
    console.error('Navigation error:', error);
    showErrorMessage('Não foi possível carregar a página. Por favor, tente novamente.');
  } finally {
    navigationInProgress = false;
  }
}

// Navigate to a new page
async function navigateToPage(path) {
  // Show loading state
  document.body.classList.add('navigation-loading');
  
  try {
    // Get page content
    const content = await loadPage(path);
    
    // Update URL and history
    const newUrl = getRouteUrl(path);
    window.history.pushState({ path, timestamp: Date.now() }, '', newUrl);

    // Update page content
    await updatePageContent(content);
    
    // Update active link
    updateActiveLink(path);

    // Scroll to top with smooth behavior
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Dispatch custom event for page change
    window.dispatchEvent(new CustomEvent('pageChanged', {
      detail: { path }
    }));
  } finally {
    // Remove loading state
    document.body.classList.remove('navigation-loading');
  }
}

// Load page content with cache
async function loadPage(path) {
  const now = Date.now();
  
  // Check cache first
  if (pageCache.has(path)) {
    const cached = pageCache.get(path);
    if (now - cached.timestamp < CACHE_EXPIRATION) {
      return cached.content;
    }
  }

  // Load page with timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const response = await fetch(path, {
      signal: controller.signal,
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`Failed to load page: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    // Cache the result with timestamp
    pageCache.set(path, {
      content: html,
      timestamp: now
    });
    
    return html;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

// Update page content safely
async function updatePageContent(html) {
  // Create temporary element to parse HTML
  const doc = new DOMParser().parseFromString(html, 'text/html');
  
  // Update main content with transition
  const newMain = doc.querySelector('main');
  const currentMain = document.querySelector('main');
  
  if (newMain && currentMain) {
    // Add fade-out transition
    currentMain.style.opacity = '0';
    currentMain.style.transition = 'opacity 0.3s ease';
    
    // Wait for transition to complete
    await new Promise(resolve => {
      currentMain.addEventListener('transitionend', resolve, { once: true });
      setTimeout(resolve, 300); // Fallback
    });
    
    // Replace content
    currentMain.innerHTML = newMain.innerHTML;
    
    // Fade in new content
    currentMain.style.opacity = '1';
  }

  // Update title
  if (doc.title) {
    document.title = doc.title;
  }

  // Handle scripts safely
  await handleScripts(doc);
}

// Handle scripts in a safe way
async function handleScripts(doc) {
  const scripts = Array.from(doc.querySelectorAll('script'));
  
  for (const script of scripts) {
    if (script.src) {
      // Load external script (avoid duplicates)
      if (!document.querySelector(`script[src="${script.src}"]`)) {
        await loadExternalScript(script.src);
      }
    } else {
      // Execute inline script safely
      executeInlineScript(script.textContent);
    }
  }
}

// Load external script
function loadExternalScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

// Execute inline script safely
function executeInlineScript(code) {
  try {
    // Safer alternatives to eval
    const script = document.createElement('script');
    script.textContent = code;
    document.body.appendChild(script);
    document.body.removeChild(script);
  } catch (error) {
    console.error('Error executing inline script:', error);
  }
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
    link.setAttribute('aria-current', 'page');
  });
  
  // Remove aria-current from other links
  document.querySelectorAll(`a:not([href="${path}"])`).forEach(link => {
    link.removeAttribute('aria-current');
  });
}

// Handle browser back/forward
async function handlePopState(e) {
  if (e.state?.path && e.state.path !== currentPage) {
    try {
      await navigateToPage(e.state.path);
    } catch (error) {
      console.error('Popstate navigation error:', error);
      window.location.reload(); // Fallback to full reload
    }
  }
}

// Handle initial page load
function handleCurrentPage() {
  const path = window.location.pathname;
  currentPage = getPagePath(path);
  updateActiveLink(currentPage);
}

// Helper to check if link is internal
function isInternalLink(href) {
  if (!href) return false;
  if (href.startsWith('#')) return false;
  if (href.startsWith('http')) {
    return href.includes(window.location.host);
  }
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

// Show error message with UI feedback
function showErrorMessage(message) {
  const errorElement = document.createElement('div');
  errorElement.className = 'navigation-error';
  errorElement.innerHTML = `
    <div class="error-content">
      <p>${message}</p>
      <button class="error-close">OK</button>
    </div>
  `;
  
  errorElement.querySelector('.error-close').addEventListener('click', () => {
    document.body.removeChild(errorElement);
  });
  
  document.body.appendChild(errorElement);
}