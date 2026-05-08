/**
 * Command Palette for AI Productivity Radar
 * 
 * Features:
 * - Open with Cmd+K / Ctrl+K
 * - Real-time search with debounce
 * - Arrow key navigation
 * - Enter to select
 * - Escape to close
 * - Highlights matching text
 * - Mobile support
 * - Accessibility support
 */

// Global state for command palette
let commandIndex = 0;
let commandMatches = [];

/**
 * Open the command palette modal
 */
function openCommandPalette() {
  const modal = document.getElementById('commandModal');
  const input = document.getElementById('commandInput');
  
  if (!modal || !input) return;
  
  modal.classList.add('show');
  input.focus();
  input.value = '';
  commandIndex = 0;
  renderCommandResults([]);
}

/**
 * Close the command palette modal
 */
function closeCommandPalette() {
  const modal = document.getElementById('commandModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

/**
 * Filter tools based on search query
 * @param {string} query - Search term
 * @returns {Array} - Filtered tools
 */
function filterTools(query) {
  if (!query.trim() || !window.tools) return [];
  
  const q = query.toLowerCase();
  return window.tools.filter(tool => {
    const haystack = [
      tool.name,
      ...(tool.cats || []),
      tool.country,
      tool.region,
      tool.tagline,
      tool.when,
      tool.audience
    ].join(' ').toLowerCase();
    return haystack.includes(q);
  }).slice(0, 8); // Limit to 8 results for performance
}

/**
 * Highlight matching text in search results
 * @param {string} text - Text to highlight
 * @param {string} query - Search query
 * @returns {string} - Text with matching parts wrapped in <mark>
 */
function highlightMatch(text, query) {
  if (!query) return text;
  try {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  } catch (e) {
    return text; // Fallback if regex is invalid
  }
}

/**
 * Render command palette results
 * @param {Array} results - Tools to display
 */
function renderCommandResults(results) {
  commandMatches = results;
  const container = document.getElementById('commandResults');
  const countEl = document.getElementById('commandCount');
  
  if (!container || !countEl) return;
  
  if (results.length === 0) {
    container.innerHTML = '<div class="command-item"><span class="command-tagline">Niciun rezultat găsit</span></div>';
    countEl.textContent = '0 rezultate';
    return;
  }
  
  const query = document.getElementById('commandInput')?.value.toLowerCase() || '';
  const toolLogos = window.toolLogos || {};
  
  container.innerHTML = results.map((tool, index) => {
    const name = highlightMatch(tool.name, query);
    const tagline = highlightMatch(tool.tagline || '', query);
    const when = highlightMatch(tool.when || '', query);
    const logo = toolLogos[tool.name] || '🛠️';
    
    // Escape tool name for use in onclick
    const escapedName = tool.name.replace(/'/g, "\\'\"");
    
    return `
      <div class="command-item ${index === commandIndex ? 'active' : ''}"
           data-index="${index}"
           role="option"
           aria-selected="${index === commandIndex}"
           tabindex="0"
           onclick="if (typeof window.openToolDetails === 'function') window.openToolDetails('${escapedName}'); window.closeCommandPalette();"
           onkeydown="if (event.key === 'Enter' || event.key === ' ') { if (typeof window.openToolDetails === 'function') window.openToolDetails('${escapedName}'); window.closeCommandPalette(); event.preventDefault(); }">
        <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
          <span class="tool-logo" style="font-size: 18px;" aria-label="${tool.name} logo">${logo}</span>
          <div style="flex: 1;">
            <div class="command-name" style="font-family: var(--serif); font-size: 16px; margin-bottom: 4px;">${name}</div>
            <div class="command-meta" style="font-family: var(--mono); font-size: 11px; color: var(--text-dim); margin-bottom: 4px;">
              ${(tool.cats || []).slice(0, 2).map(cat => `<span class="tool-tag" style="font-size: 10px; padding: 2px 6px; margin-right: 4px;">${cat}</span>`).join('')}
            </div>
            <div class="command-tagline" style="font-size: 13px; color: var(--text-muted);">${tagline || when || tool.tagline}</div>
          </div>
        </div>
        <div class="command-score" style="color: var(--gold); font-family: var(--mono);">↗ ${tool.trend || 80}</div>
      </div>
    `;
  }).join('');
  
  countEl.textContent = `${results.length} rezultate`;
  updateActiveCommandItem();
}

/**
 * Update active command item
 */
function updateActiveCommandItem() {
  const items = document.querySelectorAll('#commandResults .command-item');
  items.forEach((item, index) => {
    item.classList.toggle('active', index === commandIndex);
    item.setAttribute('aria-selected', index === commandIndex);
  });
}

/**
 * Handle keyboard navigation in command palette
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleCommandKeydown(e) {
  const results = document.querySelectorAll('#commandResults .command-item');
  if (results.length === 0) return;
  
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      commandIndex = (commandIndex + 1) % results.length;
      updateActiveCommandItem();
      results[commandIndex]?.scrollIntoView({ block: 'nearest' });
      break;
    case 'ArrowUp':
      e.preventDefault();
      commandIndex = (commandIndex - 1 + results.length) % results.length;
      updateActiveCommandItem();
      results[commandIndex]?.scrollIntoView({ block: 'nearest' });
      break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      if (commandMatches[commandIndex] && typeof window.openToolDetails === 'function') {
        window.openToolDetails(commandMatches[commandIndex].name);
        closeCommandPalette();
      }
      break;
    case 'Escape':
      closeCommandPalette();
      break;
    case 'Tab':
      e.preventDefault();
      break;
  }
}

/**
 * Initialize Command Palette
 */
function setupCommandPalette() {
  const input = document.getElementById('commandInput');
  const modal = document.getElementById('commandModal');
  
  if (!input || !modal) return;
  
  // Open with Cmd+K / Ctrl+K
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openCommandPalette();
    }
  });
  
  // Close with Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      closeCommandPalette();
    }
  });
  
  // Real-time search with debounce
  let searchTimeout;
  input.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const results = filterTools(e.target.value);
      renderCommandResults(results);
      commandIndex = 0;
      updateActiveCommandItem();
    }, 100);
  });
  
  // Keyboard navigation
  input.addEventListener('keydown', handleCommandKeydown);
  
  // Click on item
  modal.querySelector('.command-results')?.addEventListener('click', (e) => {
    const item = e.target.closest('.command-item');
    if (item) {
      const index = parseInt(item.dataset.index);
      if (commandMatches[index] && typeof window.openToolDetails === 'function') {
        window.openToolDetails(commandMatches[index].name);
      }
      closeCommandPalette();
    }
  });
  
  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeCommandPalette();
    }
  });
  
  // Close on blur (for mobile)
  input.addEventListener('blur', () => {
    setTimeout(() => {
      if (document.activeElement !== input && !modal.contains(document.activeElement)) {
        closeCommandPalette();
      }
    }, 200);
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupCommandPalette);
} else {
  setupCommandPalette();
}

// Export functions to global scope
window.openCommandPalette = openCommandPalette;
window.closeCommandPalette = closeCommandPalette;
window.filterTools = filterTools;
window.renderCommandResults = renderCommandResults;
window.setupCommandPalette = setupCommandPalette;
