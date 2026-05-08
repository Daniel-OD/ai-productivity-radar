/**
 * Related Tools for AI Productivity Radar
 * 
 * Features:
 * - Finds similar tools based on categories, region, and trend
 * - Displays in tool details modal
 * - Configurable similarity scoring
 */

// Calculate similarity score between two tools
function calculateSimilarity(a, b) {
  let score = 0;
  
  // Common categories (20 points per match)
  const commonCats = a.cats.filter(cat => b.cats.includes(cat));
  score += commonCats.length * 20;
  
  // Same region (15 points)
  if (a.region === b.region) score += 15;
  
  // Similar trend (±10 points)
  if (Math.abs((a.trend || 80) - (b.trend || 80)) <= 10) score += 10;
  
  // Same price (5 points)
  if (a.price === b.price) score += 5;
  
  // Same audience (5 points)
  if (a.audience && b.audience && a.audience === b.audience) score += 5;
  
  return score;
}

// Get related tools for a given tool
function getRelatedTools(currentTool, max = 4) {
  if (!window.tools || !currentTool) return [];
  
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

// Render related tools section for modal
function renderRelatedTools(currentTool) {
  const relatedTools = getRelatedTools(currentTool);
  if (relatedTools.length === 0) return '';
  
  const toolLogos = window.toolLogos || {};
  const flag = window.flag || {};
  const priceLabels = window.priceLabels || {};
  
  return `
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border);">
      <h3 style="font-family: var(--serif); font-size: 18px; margin-bottom: 12px;">Tool-uri similare</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
        ${relatedTools.map(relatedTool => {
          const logo = toolLogos[relatedTool.name] || '🛠️';
          const stars = '⭐'.repeat(Math.floor((relatedTool.trend || 80) / 20));
          const emptyStars = '☆'.repeat(5 - Math.floor((relatedTool.trend || 80) / 20));
          
          return `
            <div class="tool-card" 
                 style="padding: 12px; cursor: pointer; background: var(--bg-soft); border: 1px solid var(--border);"
                 onclick="window.openToolDetails && window.openToolDetails('${relatedTool.name.replace(/'/g, "\\'\\'")}')"
                 onkeydown="if (event.key === 'Enter') { window.openToolDetails && window.openToolDetails('${relatedTool.name.replace(/'/g, "\\'\\'")}'); }"
                 tabindex="0">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span class="tool-logo" style="width: 24px; height: 24px; font-size: 14px;" aria-label="${relatedTool.name} logo">${logo}</span>
                <span style="font-family: var(--serif); font-size: 14px;">${relatedTool.name}</span>
              </div>
              <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
                ${(relatedTool.tagline || '').slice(0, 50)}${relatedTool.tagline && relatedTool.tagline.length > 50 ? '...' : ''}
              </p>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 12px; color: var(--text-dim);">${flag[relatedTool.country] || '🌍'} ${relatedTool.country}</span>
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

// Enhanced openToolDetails with related tools
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

// Override openToolDetails if it exists
if (typeof window.openToolDetails === 'function') {
  window.openToolDetails = enhancedOpenToolDetails;
} else {
  window.openToolDetails = enhancedOpenToolDetails;
}

// Make functions globally available
window.getRelatedTools = getRelatedTools;
window.calculateSimilarity = calculateSimilarity;
window.renderRelatedTools = renderRelatedTools;
