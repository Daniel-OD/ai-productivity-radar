/**
 * AI Productivity Radar - Main Application
 * 
 * Initializes all modules:
 * - Command Palette (Cmd+K)
 * - Related Tools
 * - Filters Drawer (Mobile)
 * - Theme Toggle
 * - Service Worker
 */

// ==================== INITIALIZATION ====================

/**
 * Initialize the entire application
 */
async function initApp() {
  // Load state and theme
  if (typeof loadState === 'function') loadState();
  if (typeof loadTheme === 'function') loadTheme();
  
  // Initialize all modules
  if (typeof setupCommandPalette === 'function') setupCommandPalette();
  if (typeof initRelatedTools === 'function') initRelatedTools();
  if (typeof setupFiltersDrawer === 'function') setupFiltersDrawer();
  
  // Set up global event listeners
  setupGlobalEventListeners();
  
  // Load data
  await loadData();
  
  // Render initial UI
  if (typeof renderAll === 'function') renderAll();
  if (typeof setupScrollHide === 'function') setupScrollHide();
  if (typeof setupCompare === 'function') setupCompare();
  if (typeof setupFavorites === 'function') setupFavorites();
  if (typeof setupStacks === 'function') setupStacks();
  if (typeof setupSearch === 'function') setupSearch();
  if (typeof setupReset === 'function') setupReset();
  
  // Set up Service Worker
  setupServiceWorker();
  
  // Initialize command palette if not already done
  if (typeof initCommandPalette === 'function') initCommandPalette();
}

/**
 * Load application data
 */
async function loadData() {
  if (!window.tools) window.tools = [];
  
  // 1. Try inline data first
  const inlineData = document.getElementById('embedded-tools-data');
  if (inlineData) {
    try {
      const data = JSON.parse(inlineData.textContent);
      window.tools = data.tools.map(normalize);
      setDataStatus('ok', `Date încărcate (${data.updatedAt})`);
      if (typeof updateMeta === 'function') updateMeta(data);
      return;
    } catch (e) {
      console.error('Inline JSON invalid:', e);
    }
  }
  
  // 2. Try fetch
  try {
    const r = await fetch('tools-market.json', { cache: 'force-cache' });
    if (r.ok) {
      const data = await r.json();
      const arr = Array.isArray(data) ? data : data.tools;
      if (Array.isArray(arr) && arr.length > 0) {
        window.tools = arr.map(normalize);
        setDataStatus('ok', 'Date live sincronizate');
        if (typeof updateMeta === 'function') updateMeta(data);
        return;
      }
    }
  } catch (e) {
    console.warn('Fetch failed:', e);
  }
  
  // 3. Fallback to FALLBACK_TOOLS
  if (typeof FALLBACK_TOOLS !== 'undefined') {
    window.tools = FALLBACK_TOOLS.map(normalize);
    setDataStatus('warn', 'Fallback local');
    if (typeof toast === 'function') toast('Eroare la încărcare, folosesc fallback local');
  }
}

/**
 * Update meta information (tools count, last updated)
 */
function updateMeta(data) {
  if (typeof $('metaTools') === 'object') {
    $('metaTools').textContent = window.tools.length;
  }
  if (typeof $('metaUpdated') === 'object') {
    $('metaUpdated').textContent = data.updatedAt ? new Date(data.updatedAt).toLocaleDateString('ro-RO') : 'mai 2026';
  }
}

/**
 * Set up Service Worker
 */
function setupServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('[Service Worker] Registered with scope:', registration.scope);
          registration.update();
        })
        .catch(error => {
          console.error('[Service Worker] Registration failed:', error);
        });
    });
  }
}

/**
 * Set up global event listeners
 */
function setupGlobalEventListeners() {
  // Close all modals on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (typeof closeCommandPalette === 'function') closeCommandPalette();
      if (typeof closeToolDetails === 'function') closeToolDetails();
      const compareModal = document.getElementById('compareModal');
      if (compareModal) compareModal.classList.remove('show');
    }
  });
  
  // Close modals on overlay click
  document.addEventListener('click', (e) => {
    if (e.target.classList?.contains('modal')) {
      if (typeof closeToolDetails === 'function') closeToolDetails();
      const compareModal = document.getElementById('compareModal');
      if (compareModal) compareModal.classList.remove('show');
    }
  });
}

/**
 * Render all components
 */
function renderAll() {
  if (typeof renderWizard === 'function') renderWizard();
  if (typeof renderPills === 'function') renderPills();
  if (typeof renderTrending === 'function') renderTrending();
  if (typeof renderRadar === 'function') renderRadar();
  if (typeof renderTools === 'function') renderTools();
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Safe localStorage get
 */
function safeStorageGet(k, f) {
  try { return localStorage.getItem(k) || f; } catch (e) { return f; }
}

/**
 * Safe localStorage set
 */
function safeStorageSet(k, v) {
  try { localStorage.setItem(k, v); } catch (e) {}
}

/**
 * Show toast notification
 */
function toast(t) {
  const el = document.getElementById('toast');
  if (el) {
    el.textContent = t;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2200);
  }
}

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Helper function to escape attributes
function escapeAttr(text) {
  return escapeHtml(text).replace(/"/g, '&quot;');
}

// ==================== EXPORTS ====================

// Export all functions to global scope
window.initApp = initApp;
window.loadData = loadData;
window.updateMeta = updateMeta;
window.setupServiceWorker = setupServiceWorker;
window.setupGlobalEventListeners = setupGlobalEventListeners;
window.renderAll = renderAll;
window.safeStorageGet = safeStorageGet;
window.safeStorageSet = safeStorageSet;
window.toast = toast;
window.escapeHtml = escapeHtml;
window.escapeAttr = escapeAttr;

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
