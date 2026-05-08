/**
 * SIGNAL - Related Tools
 * 
 * Implementare:
 * - Afișează tool-uri similare în modalul de detalii
 * - Bazat pe: categorii comune, regiune, trend similar
 * - Integrare automată cu modalul existent
 */

/**
 * Calculează similaritatea între 2 tool-uri
 * @param {Object} a - Primul tool
 * @param {Object} b - Al doilea tool
 * @returns {number} Scorul de similaritate
 */
function calculateSimilarity(a, b) {
  let score = 0;
  
  // Categorii comune (20 puncte per categorie comună)
  const commonCats = (a.cats || []).filter(cat => (b.cats || []).includes(cat));
  score += commonCats.length * 20;
  
  // Regiune comună (15 puncte)
  if (a.region === b.region) score += 15;
  
  // Trend similar (±10 puncte)
  if (Math.abs((a.trend || 80) - (b.trend || 80)) <= 10) score += 10;
  
  // Preț comun (5 puncte)
  if (a.price === b.price) score += 5;
  
  // Audience comună (5 puncte)
  if (a.audience && b.audience && a.audience === b.audience) score += 5;
  
  return score;
}

/**
 * Găsește tool-uri similare pentru un tool dat
 * @param {Object} currentTool - Tool-ul curent
 * @param {number} max - Numărul maxim de tool-uri (default: 4)
 * @returns {Array} Lista de tool-uri similare
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
 * Randează secțiunea "Related Tools" în modal
 * @param {Object} tool - Tool-ul curent
 * @returns {string} HTML pentru secțiunea Related Tools
 */
function renderRelatedTools(tool) {
  const relatedTools = getRelatedTools(tool);
  
  if (relatedTools.length === 0) return '';
  
  const toolLogos = window.toolLogos || {};
  const flag = window.flag || {};
  
  return `
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border);">
      <h3 style="font-family: var(--serif); font-size: 18px; margin-bottom: 12px;">Tool-uri similare</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
        ${relatedTools.map(relatedTool => {
          const logo = toolLogos[relatedTool.name] || '🛠️';
          const countryFlag = flag[relatedTool.country] || '🌍';
          const stars = '⭐'.repeat(Math.floor((relatedTool.trend || 80) / 20));
          const emptyStars = '☆'.repeat(5 - Math.floor((relatedTool.trend || 80) / 20));
          
          return `
            <div class="tool-card" 
                 style="padding: 12px; cursor: pointer; background: var(--bg-soft); border: 1px solid var(--border);"
                 onclick="window.openToolDetails && window.openToolDetails('${relatedTool.name.replace(/'/g, "\\'\\'")}')"
                 onkeydown="if (event.key === 'Enter' || event.key === ' ') { window.openToolDetails && window.openToolDetails('${relatedTool.name.replace(/'/g, "\\'\\'")}'); event.preventDefault(); }"
                 tabindex="0"
                 role="button"
                 aria-label="Deschide detalii pentru ${relatedTool.name}">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span class="tool-logo" style="width: 24px; height: 24px; font-size: 14px;" aria-label="${relatedTool.name} logo">${logo}</span>
                <span style="font-family: var(--serif); font-size: 14px;">${relatedTool.name}</span>
              </div>
              <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
                ${(relatedTool.tagline || '').slice(0, 50)}${relatedTool.tagline && relatedTool.tagline.length > 50 ? '...' : ''}
              </p>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 12px; color: var(--text-dim);">${countryFlag} ${relatedTool.country}</span>
                <span class="tool-rating" style="font-size: 12px;">${stars}${emptyStars} ${relatedTool.trend || 80}</span>
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
 * Funcție îmbunătățită openToolDetails care include Related Tools
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
      <button class="secondary" onclick="window.closeToolDetails && window.closeToolDetails()">Închide</button>
    </div>
  `;
  
  contentEl.innerHTML = html;
  modal.classList.add('show');
}

// ==================== SETUP ====================

/**
 * Initializează Related Tools
 * - Suprascriere funcția openToolDetails pentru a include Related Tools
 */
function initRelatedTools() {
  // Salvează referința la funcția originală dacă există
  if (typeof window.openToolDetails === 'function' && !window.openToolDetailsOriginal) {
    window.openToolDetailsOriginal = window.openToolDetails;
  }
  
  // Suprascriere cu funcția îmbunătățită
  window.openToolDetails = enhancedOpenToolDetails;
}

// ==================== EXPORT ====================
// Expune funcțiile în scope-ul global
window.getRelatedTools = getRelatedTools;
window.calculateSimilarity = calculateSimilarity;
window.renderRelatedTools = renderRelatedTools;
window.initRelatedTools = initRelatedTools;
