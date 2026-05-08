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
 */

let commandIndex = 0;
let commandMatches = [];

// Open Command Palette
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

// Close Command Palette
function closeCommandPalette() {
  const modal = document.getElementById('commandModal');
  if (modal) modal.classList.remove('show');
}

// Filter tools based on query
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
  }).slice(0, 8); // Limit to 8 results
}

// Highlight matching text
function highlightMatch(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// Render command results
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
  
  container.innerHTML = results.map((tool, index) => {
    const query = document.getElementById('commandInput')?.value.toLowerCase() || '';
    const name = highlightMatch(tool.name, query);
    const tagline = highlightMatch(tool.tagline || '', query);
    const when = highlightMatch(tool.when || '', query);
    
    // Get tool logos from window scope
    const toolLogos = window.toolLogos || {};
    const logo = toolLogos[tool.name] || '🛠️';
    
    return `
      <div class="command-item ${index === commandIndex ? 'active' : ''}"
           data-index="${index}"
           role="option"
           aria-selected="${index === commandIndex}"
           tabindex="0">
        <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
          <span class="tool-logo" style="font-size: 18px;" aria-label="${tool.name} logo">${logo}</span>
          <div style="flex: 1;">
            <div class="command-name">${name}</div>
            <div class="command-meta" style="margin-top: 4px;">
              ${(tool.cats || []).slice(0, 2).map(cat => `<span class="tool-tag" style="font-size: 11px; padding: 2px 6px;">${cat}</span>`).join('')}
            </div>
            <div class="command-tagline" style="margin-top: 6px; font-size: 13px;">${tagline || when || tool.tagline}</div>
          </div>
        </div>
        <div class="command-score" style="color: var(--gold); font-family: var(--mono);">↗ ${tool.trend || 80}</div>
      </div>
    `;
  }).join('');
  
  countEl.textContent = `${results.length} rezultate`;
}

// Update active command item
function updateActiveCommandItem() {
  const items = document.querySelectorAll('.command-item');
  items.forEach((item, index) => {
    item.classList.toggle('active', index === commandIndex);
    item.setAttribute('aria-selected', index === commandIndex);
  });
}

// Handle keyboard navigation
function handleCommandKeydown(e) {
  const results = document.querySelectorAll('.command-item');
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
      e.preventDefault();
      if (commandMatches[commandIndex]) {
        if (typeof window.openToolDetails === 'function') {
          window.openToolDetails(commandMatches[commandIndex].name);
        }
        closeCommandPalette();
      }
      break;
    case 'Escape':
      closeCommandPalette();
      break;
    case 'Tab':
      e.preventDefault(); // Prevent tab from leaving modal
      break;
  }
}

// Initialize Command Palette
function initCommandPalette() {
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
    // Don't close immediately on mobile to allow clicking results
    setTimeout(() => {
      if (document.activeElement !== input && !modal.contains(document.activeElement)) {
        closeCommandPalette();
      }
    }, 200);
  });
}

// Export for global scope
window.initCommandPalette = initCommandPalette;
window.openCommandPalette = openCommandPalette;
window.closeCommandPalette = closeCommandPalette;
