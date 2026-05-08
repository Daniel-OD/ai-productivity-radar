/**
 * Related Tools Module for AI Productivity Radar
 * 
 * Features:
 * - Find similar tools based on categories, region, and trend
 * - Display related tools in the tool details modal
 * - Configurable similarity scoring
 * - Mobile-optimized layout
 * - Accessibility support
 */

/**
 * Calculate similarity score between two tools
 * @param {Object} a - First tool
 * @param {Object} b - Second tool
 * @returns {number} - Similarity score (higher = more similar)
 */
function calculateSimilarity(a, b) {
  if (!a || !b) return 0;
  
  let score = 0;
  
  // Common categories (20 points per match)
  const commonCats = (a.cats || []).filter(cat => (b.cats || []).includes(cat));
  score += commonCats.length * 20;
  
  // Same region (15 points)
  if (a.region === b.region) score += 15;
  
  // Similar trend (±10 = 10 points, ±20 = 5 points)
  const trendDiff = Math.abs((a.trend || 80) - (b.trend || 80));
  if (trendDiff <= 10) score += 10;
  else if (trendDiff <= 20) score += 5;
  
  // Same price (5 points)
  if (a.price === b.price) score += 5;
  
  // Same country (3 points)
  if (a.country === b.country) score += 3;
  
  return score;
}

/**
 * Get related tools for a given tool
 * @param {Object} currentTool - The tool to find related ones for
 * @param {number} max - Maximum number of related tools to return
 * @returns {Array} - Array of related tools
 */
function getRelatedTools(currentTool, max = 4) {
  if (!window.tools || !window.tools.length) return [];
  
  return window.tools
    .filter(tool => tool.name !== currentTool.name)
    .map(tool => ({
      tool,
      score: calculateSimilarity(currentTool, tool)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(item => item.tool);
}

/**
 * Render related tools section in tool details modal
 * @param {Object} tool - The current tool being viewed
 * @returns {string} - HTML for related tools section
 */
function renderRelatedTools(tool) {
  const relatedTools = getRelatedTools(tool);
  
  if (relatedTools.length === 0) return '';
  
  const toolLogos = window.toolLogos || {};
  const flag = window.flag || {};
  const priceLabels = window.priceLabels || {};
  
  return `
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border);">
      <h3 style="font-family: var(--serif); font-size: 18px; margin-bottom: 12px; color: var(--text);">Tool-uri similare</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
        ${relatedTools.map(relatedTool => {
          const logo = toolLogos[relatedTool.name] || '🛠️';
          const countryFlag = flag[relatedTool.country] || '🌍';
          const stars = '⭐'.repeat(Math.floor((relatedTool.trend || 80) / 20));
          const emptyStars = '☆'.repeat(5 - Math.floor((relatedTool.trend || 80) / 20));
          const priceLabel = priceLabels[relatedTool.price] || relatedTool.price;
          
          // Escape tool name for use in onclick
          const escapedName = relatedTool.name.replace(/'/g, "\\'\"");
          
          return `
            <div class="tool-card" 
                 style="padding: 12px; cursor: pointer; background: var(--bg-soft); border: 1px solid var(--border); border-radius: 8px;"
                 onclick="if (typeof window.openToolDetails === 'function') window.openToolDetails('${escapedName}')"
                 onkeydown="if (event.key === 'Enter' || event.key === ' ') { if (typeof window.openToolDetails === 'function') window.openToolDetails('${escapedName}'); event.preventDefault(); }"
                 tabindex="0"
                 role="button"
                 aria-label="Deschide detalii pentru ${relatedTool.name}">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span class="tool-logo" style="font-size: 18px;" aria-label="${relatedTool.name} logo">${logo}</span>
                <span style="font-family: var(--serif); font-size: 14px; font-weight: 500;">${relatedTool.name}</span>
              </div>
              <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
                ${(relatedTool.tagline || '').slice(0, 50)}${relatedTool.tagline && relatedTool.tagline.length > 50 ? '...' : ''}
              </p>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-size: 12px; color: var(--text-dim);">${countryFlag} ${relatedTool.country}</span>
                <span class="tool-rating" style="font-size: 12px;">${stars}${emptyStars}</span>
              </div>
              <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                ${(relatedTool.cats || []).slice(0, 2).map(cat => 
                  `<span class="tool-tag" style="font-size: 10px; padding: 2px 6px;">${cat}</span>`
                ).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Enhanced openToolDetails function that includes Related Tools
 */
function enhancedOpenToolDetails(toolName) {
  const tool = (window.tools || []).find(t => t.name === toolName);
  if (!tool) return;
  
  const modal = document.getElementById('toolDetailsModal');
  const nameEl = document.getElementById('toolDetailsName');
  const contentEl = document.getElementById('toolDetailsContent');
  
  if (!modal || !nameEl || !contentEl) return;
  
  nameEl.textContent = tool.name;
  
  // Generate star rating
  const stars = '⭐'.repeat(Math.floor((tool.trend || 80) / 20));
  const emptyStars = '☆'.repeat(5 - Math.floor((tool.trend || 80) / 20));
  const toolLogos = window.toolLogos || {};
  const flag = window.flag || {};
  const priceLabels = window.priceLabels || {};
  
  // Main tool info
  let html = `
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
      <div class="tool-logo" style="width: 48px; height: 48px; font-size: 24px;" aria-label="${tool.name} logo">${toolLogos[tool.name] || '🛠️'}</div>
      <div>
        <p><strong>Categorie:</strong> ${(tool.cats || []).join(', ')}</p>
        <p><strong>Preț:</strong> ${priceLabels[tool.price] || tool.price}</p>
      </div>
    </div>
    <p><strong>Țară:</strong> ${flag[tool.country] || '🌍'} ${tool.country} · <strong>Regiune:</strong> ${tool.region}</p>
    <p><strong>Rating:</strong> <span class="tool-rating">${stars}${emptyStars} ${tool.trend || 80}</span></p>
    <p><strong>Când să-l folosești:</strong> ${tool.when || ''}</p>
    <p><strong>Descriere:</strong> ${tool.tagline || ''}</p>
    ${tool.audience ? `<p><strong>Audience:</strong> ${tool.audience}</p>` : ''}
    ${(tool.badges || []).length > 0 ? `<p><strong>Badges:</strong> ${tool.badges.map(b => `<span class="tool-tag">${b}</span>`).join('')}</p>` : ''}
    ${tool.apiInfo ? `<p><strong>API Info:</strong> ${tool.apiInfo}</p>` : ''}
    ${tool.standaloneNote ? `<p><strong>Standalone Note:</strong> ${tool.standaloneNote}</p>` : ''}
  `;
  
  // Add related tools
  html += renderRelatedTools(tool);
  
  // Add actions
  html += `
    <div class="tool-actions" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">
      <a href="${tool.url}" class="primary" target="_blank" rel="noopener noreferrer">Deschide Link</a>
      <button class="secondary" onclick="if (typeof window.closeToolDetails === 'function') window.closeToolDetails(); else document.getElementById('toolDetailsModal').classList.remove('show')">Închide</button>
    </div>
  `;
  
  contentEl.innerHTML = html;
  modal.classList.add('show');
}

// ==================== SETUP ====================

/**
 * Initialize Related Tools
 * - Override openToolDetails to include Related Tools
 */
function initRelatedTools() {
  // Only override if we haven't already
  if (typeof window.openToolDetailsOriginal === 'undefined' && typeof window.openToolDetails === 'function') {
    window.openToolDetailsOriginal = window.openToolDetails;
  }
  
  // Override with enhanced function
  window.openToolDetails = enhancedOpenToolDetails;
}

// ==================== EXPORT ====================
// Expose functions to global scope
window.getRelatedTools = getRelatedTools;
window.calculateSimilarity = calculateSimilarity;
window.renderRelatedTools = renderRelatedTools;
window.initRelatedTools = initRelatedTools;

// Initialize when DOM is ready and tools are loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const checkTools = setInterval(() => {
      if (window.tools && window.tools.length > 0) {
        clearInterval(checkTools);
        initRelatedTools();
      }
    }, 100);
  });
} else {
  if (window.tools && window.tools.length > 0) {
    initRelatedTools();
  }
}
