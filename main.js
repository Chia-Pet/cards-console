// Configuration
const CONFIG = {
  TYPING_SPEED: 20,
  DOT_DELAY: 1500,
  SYSTEM_CHECK_DELAY: 4000,
  MESSAGE_DELAY: 1000,
  TRANSITION_DELAY: 500,
  THEME_KEY: 'manni-dev-theme',
  FKEY_ENABLED_KEY: 'manni-dev-fkeys-enabled'
};

// Storage utility with fallback
class StorageManager {
  constructor() {
    this.useLocalStorage = this.checkLocalStorageSupport();
    this.memoryStore = {};
  }

  checkLocalStorageSupport() {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch (e) {
      return false;
    }
  }

  setItem(key, value) {
    try {
      if (this.useLocalStorage) {
        localStorage.setItem(key, value);
      } else {
        this.memoryStore[key] = value;
      }
    } catch (e) {
      this.memoryStore[key] = value;
    }
  }

  getItem(key) {
    try {
      return this.useLocalStorage ? localStorage.getItem(key) : (this.memoryStore[key] || null);
    } catch (e) {
      return this.memoryStore[key] || null;
    }
  }
}

// F-key toggle management
class FKeyManager {
  constructor() {
    this.storage = new StorageManager();
    this.fToggleBtn = document.getElementById('FToggle');
    this.fToggleIcon = this.fToggleBtn?.querySelector('i');
    this.isEnabled = this.storage.getItem(CONFIG.FKEY_ENABLED_KEY) !== 'false';
    this.init();
  }

  init() {
    if (!this.fToggleBtn) return;
    this.applyState();
    this.fToggleBtn.addEventListener('click', () => this.toggleFKeys());
  }

  applyState() {
    this.fToggleIcon.style.color = this.isEnabled ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
    this.fToggleBtn.setAttribute('aria-label', `F-keys ${this.isEnabled ? 'enabled - Click to disable' : 'disabled - Click to enable'}`);
    this.storage.setItem(CONFIG.FKEY_ENABLED_KEY, this.isEnabled.toString());
  }

  toggleFKeys() {
    this.isEnabled = !this.isEnabled;
    this.applyState();
  }

  areEnabled() {
    return this.isEnabled;
  }
}

// Theme management
class ThemeManager {
  constructor() {
    this.storage = new StorageManager();
    this.themeToggleBtn = document.getElementById('darkModeToggle');
    this.themeToggleIcon = this.themeToggleBtn?.querySelector('i');
    this.init();
  }

  init() {
    if (!this.themeToggleBtn) return;
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = this.storage.getItem(CONFIG.THEME_KEY);
    const isInitialDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    
    this.applyTheme(isInitialDark);
    this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
  }

  applyTheme(isDark) {
    document.documentElement.classList.toggle('dark', isDark);
    this.themeToggleIcon.classList.toggle('fa-sun', isDark);
    this.themeToggleIcon.classList.toggle('fa-moon', !isDark);
    this.storage.setItem(CONFIG.THEME_KEY, isDark ? 'dark' : 'light');
  }

  toggleTheme() {
    this.applyTheme(!document.documentElement.classList.contains('dark'));
  }
}

// Get card status based on URL and metadata
const getCardStatus = (card) => {
  if (card.metadata?.toLowerCase().includes('caution')) return 'internal';
  if (card.url.includes('manni-dm.dev') || card.metadata?.toLowerCase().includes('written')) return 'online';
  return 'external';
};

// Navigation management
class NavigationManager {
  constructor() {
    this.currentView = 'blog';
    this.articleWrapper = document.getElementById('article-wrapper');
    this.articleContainer = document.getElementById('article-container');
    this.blogGrid = null;
    this.linksGrid = null;
    this.blogCards = [];
    this.linksCards = [];
    this.isArticleVisible = false;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.preloadCardSets();
  }

  setupEventListeners() {
    // Function key buttons
    document.getElementById('f2')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showBlog();
    });
    document.getElementById('f8')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showLinks();
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (!fKeyManager.areEnabled()) return;
      
      if (e.key === "F2") {
        e.preventDefault();
        this.showBlog();
      } else if (e.key === "F8") {
        e.preventDefault();
        this.showLinks();
      }
    });

    // Close button
    document.getElementById('close-article')?.addEventListener('click', () => {
      this.hideArticle();
      this.showBlog();
    });
  }

  async preloadCardSets() {
    try {
      const [blogResponse, linksResponse] = await Promise.all([
        fetch('blog.json').catch(() => null),
        fetch('links.json').catch(() => null)
      ]);

      if (blogResponse?.ok) this.blogCards = await blogResponse.json();
      if (linksResponse?.ok) this.linksCards = await linksResponse.json();
    } catch (error) {
      console.error('Failed to preload card sets:', error);
    }
  }

  createGrid(gridId) {
    const existingGrid = document.getElementById(gridId);
    if (existingGrid) return existingGrid;

    const grid = document.createElement('div');
    grid.id = gridId;
    grid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 px-8 sm:px-16 md:px-32 py-4 items-stretch hidden';
    grid.setAttribute('role', 'grid');
    
    const mainContent = document.getElementById('main-content');
    const footer = mainContent?.querySelector('footer');
    if (footer) {
      mainContent.insertBefore(grid, footer);
    } else {
      mainContent?.appendChild(grid);
    }
    return grid;
  }

  hideArticle() {
    if (this.articleWrapper && this.isArticleVisible) {
      this.articleWrapper.classList.add('hidden');
      this.isArticleVisible = false;
    }
  }

  hideAllGrids() {
    this.blogGrid?.classList.add('hidden');
    this.linksGrid?.classList.add('hidden');
  }

  showBlog() {
    this.hideArticle();
    this.hideAllGrids();
    
    if (!this.blogGrid) {
      this.blogGrid = this.createGrid('blog-grid');
      this.renderCardsToGrid(this.blogCards, this.blogGrid);
    }
    
    this.blogGrid.classList.remove('hidden');
    this.currentView = 'blog';
  }

  showLinks() {
    this.hideArticle();
    this.hideAllGrids();
    
    if (!this.linksGrid) {
      this.linksGrid = this.createGrid('links-grid');
      this.renderCardsToGrid(this.linksCards, this.linksGrid);
    }
    
    this.linksGrid.classList.remove('hidden');
    this.currentView = 'links';
  }

  renderCardsToGrid(cards, targetGrid) {
    if (!targetGrid || !cardManager) return;
    
    targetGrid.innerHTML = '';
    cards.forEach(card => {
      const cardElement = cardManager.createCard(card);
      if (cardElement) targetGrid.appendChild(cardElement);
    });
  }

  async loadArticle(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load article: ${response.status}`);
      
      const html = await response.text();
      
      if (this.articleContainer && this.articleWrapper) {
        this.articleContainer.innerHTML = html;
        this.hideAllGrids();
        this.articleWrapper.classList.remove('hidden');
        this.isArticleVisible = true;
      }
    } catch (error) {
      console.error('Error loading article:', error);
    }
  }

  isLocalArticle(url) {
    return url && !url.startsWith('http') && !url.startsWith('//') && url.includes('.html');
  }
}

// Animation controller
class TypingAnimation {
  constructor() {
    this.consoleElement = document.getElementById('console');
    this.consoleskip = document.getElementById('skip-hint');
    this.mainContent = document.getElementById('main-content');
    this.animationSkipped = false;
    this.cleanup = [];
    
    this.messages = [`///////////////////////////////////////////
/ ########  ##    ##  ########  ########  /
/ ##        ##    ##     ##     ##    ##  /
/ ##        ########     ##     ########  /
/ ##        ##    ##     ##     ##    ##  /
/ ########  ##    ##  ########  ##    ##  /
/               mainframe©                /
///////////////////////////////////////////`,
      'Welcome to Manni-DM.Dev',
      'Initializing Chia Mainframe....',
      '> SYSTEM CHECK: OK',
      '> Access granted.',
      '> Loading Content....'
    ];
  }

  init() {
    if (!this.consoleElement || !this.mainContent) {
      this.showMainContent();
      return;
    }
    this.consoleElement.textContent = '';
    this.setupSkipHandlers();
    this.runAnimation().catch(() => this.showMainContent());
  }

  setupSkipHandlers() {
    const skipHandler = () => this.skipAnimation();
    window.addEventListener('click', skipHandler);
    window.addEventListener('keydown', skipHandler);
    this.cleanup.push(() => {
      window.removeEventListener('click', skipHandler);
      window.removeEventListener('keydown', skipHandler);
    });
  }

  skipAnimation() {
    if (this.animationSkipped) return;
    this.animationSkipped = true;
    this.consoleElement.innerHTML = this.messages.join('<br>') + '<br>';
    this.showMainContent();
  }

  async runAnimation() {
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (let message of this.messages) {
      if (this.animationSkipped) return;

      for (let char of message) {
        if (this.animationSkipped) return;
        this.consoleElement.innerHTML += char;

        if ((message === 'Initializing Chia Mainframe....' || message === '> Loading Content....') && char === '.') {
          await sleep(CONFIG.DOT_DELAY);
        } else if (message === '> SYSTEM CHECK: OK' && char === ':') {
          await sleep(CONFIG.SYSTEM_CHECK_DELAY);
        } else {
          await sleep(CONFIG.TYPING_SPEED);
        }
      }
      this.consoleElement.innerHTML += '<br>';
      await sleep(CONFIG.MESSAGE_DELAY);
    }
    
    await sleep(1000);
    this.showMainContent();
  }

  showMainContent() {
    this.cleanup.forEach(fn => fn());

    setTimeout(() => {
      this.consoleElement?.classList.add('hidden');
      this.consoleskip?.classList.add('hidden');
      this.mainContent?.classList.remove('hidden');
      this.mainContent?.focus();
      
      // Initialize theme after content is visible
      const storage = new StorageManager();
      if (!storage.getItem(CONFIG.THEME_KEY)) {
        document.documentElement.classList.add('dark');
      }
      
      // Show blog by default
      navigationManager.showBlog();
    }, CONFIG.TRANSITION_DELAY);
  }
}

// Card management
class CardManager {
  constructor() {
    this.template = document.getElementById('card-template');
  }

  createCard(card) {
    if (!this.template) return null;
    
    const cardElement = this.template.content.cloneNode(true).firstElementChild;
    if (!cardElement) return null;

    cardElement.href = card.url;
    cardElement.setAttribute('aria-label', `Visit ${card.title}: ${card.description}`);
    
    // Add click handler for local articles
    if (navigationManager.isLocalArticle(card.url)) {
      cardElement.addEventListener('click', (e) => {
        e.preventDefault();
        navigationManager.loadArticle(card.url);
      });
    }
    
    // Set elements
    const statusIndicator = cardElement.querySelector('.status-indicator');
    const titleElement = cardElement.querySelector('.card-title');
    const descElement = cardElement.querySelector('.card-description');
    const metadataElement = cardElement.querySelector('.card-metadata');
    
    statusIndicator?.classList.add(`status-${getCardStatus(card)}`);
    if (titleElement) titleElement.textContent = card.title;
    if (descElement) descElement.textContent = card.description;
    
    // Handle metadata
    if (metadataElement) {
      if (card.metadata?.trim()) {
        metadataElement.textContent = card.metadata;
        metadataElement.classList.remove('hidden');
      } else {
        metadataElement.classList.add('hidden');
      }
    }

    return cardElement;
  }
}

// Initialize application
let themeManager, typingAnimation, cardManager, navigationManager, fKeyManager;

document.addEventListener('DOMContentLoaded', function() {
  try {
    themeManager = new ThemeManager();
    fKeyManager = new FKeyManager();
    cardManager = new CardManager();
    navigationManager = new NavigationManager();
    typingAnimation = new TypingAnimation();
    
    typingAnimation.init();
  } catch (error) {
    console.error('Application initialization failed:', error);
    // Fallback
    const mainContent = document.getElementById('main-content');
    const consoleskip = document.getElementById('skip-hint');
    const consoleElement = document.getElementById('console');
    
    consoleElement?.classList.add('hidden');
    consoleskip?.classList.add('hidden');
    if (mainContent) {
      mainContent.classList.remove('hidden');
    }
  }
});