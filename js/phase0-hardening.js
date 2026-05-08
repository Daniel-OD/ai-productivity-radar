// Phase 0 Production Hardening
// Lightweight runtime guards for SIGNAL.

(function () {
  'use strict';

  // Respect reduced motion preferences.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (reduceMotion.matches) {
    document.documentElement.classList.add('reduced-motion');
  }

  // Basic focus trap helper for modal-like UI.
  window.createFocusTrap = function createFocusTrap(container) {
    if (!container) return () => {};

    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];

    const focusable = Array.from(container.querySelectorAll(selectors.join(',')));

    if (!focusable.length) return () => {};

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function onKeyDown(event) {
      if (event.key !== 'Tab') return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    container.addEventListener('keydown', onKeyDown);

    return () => container.removeEventListener('keydown', onKeyDown);
  };

  // Defensive rescue layer for broken post-split interactions.
  // It intentionally does not depend on app.js globals because those may be lexical bindings.
  const rescue = {
    tools: [],
    ready: false,
    activeIndex: 0,
    matches: []
  };

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function flagFor(country) {
    return {
      SUA: '🇺🇸', Canada: '🇨🇦', China: '🇨🇳', Franța: '🇫🇷', Germania: '🇩🇪', UK: '🇬🇧',
      Israel: '🇮🇱', 'Coreea de Sud': '🇰🇷', Japonia: '🇯🇵', India: '🇮🇳', Australia: '🇦🇺'
    }[country] || '🌍';
  }

  function priceLabel(price) {
    return { gratuit: 'Gratuit', freemium: 'Freemium', platit: 'Plătit' }[price] || price || 'N/A';
  }

  function haystack(tool) {
    return normalize([
      tool.name,
      tool.tagline,
      tool.when,
      tool.country,
      tool.region,
      tool.price,
      tool.apiInfo,
      ...(tool.cats || []),
      ...(tool.badges || [])
    ].join(' '));
  }

  function detectReason(tool, query) {
    const q = normalize(query);
    if (!q) return 'Popular acum';
    const h = haystack(tool);
    const cats = tool.cats || [];
    if (/(excel|csv|date|dashboard|bi|sql|tabel)/.test(q) && cats.includes('date')) return 'analiză de date / Excel / CSV';
    if (/(cod|coding|programare|debug|github|script|python|javascript)/.test(q) && cats.includes('programare')) return 'programare / cod / debugging';
    if (/(pdf|research|cercetare|document|surse|studiu|rezumat)/.test(q) && (cats.includes('cercetare') || cats.includes('studiu'))) return 'research / documente / PDF';
    if (/(video|avatar|imagine|design|logo|foto|vizual)/.test(q) && cats.includes('design')) return 'design / video / imagine';
    if (/(gratis|gratuit|free|ieftin)/.test(q) && ['gratuit', 'freemium'].includes(tool.price)) return 'buget gratuit sau freemium';
    if (/(europa|european|gdpr|franta|germania|uk)/.test(q) && tool.region === 'europa') return 'preferință Europa';
    if (h.includes(q)) return 'potrivire directă în nume sau descriere';
    return 'potrivire aproximativă după task';
  }

  function rank(tool, query) {
    const q = normalize(query);
    const h = haystack(tool);
    let score = Number(tool.trend || 0) / 3;
    if (!q) return score;
    q.split(/\s+/).forEach((word) => {
      if (word.length > 1 && h.includes(word)) score += 8;
    });
    const cats = tool.cats || [];
    if (/(excel|csv|date|dashboard|bi|sql|tabel)/.test(q) && cats.includes('date')) score += 45;
    if (/(cod|coding|programare|debug|github|script|python|javascript)/.test(q) && cats.includes('programare')) score += 45;
    if (/(pdf|research|cercetare|document|surse|studiu|rezumat)/.test(q) && (cats.includes('cercetare') || cats.includes('studiu'))) score += 45;
    if (/(video|avatar|imagine|design|logo|foto|vizual)/.test(q) && cats.includes('design')) score += 45;
    if (/(scris|email|copy|text|blog|traducere)/.test(q) && cats.includes('scris')) score += 45;
    if (/(automatizare|task|workflow|productivitate|meeting|calendar)/.test(q) && cats.includes('productivitate')) score += 45;
    if (/(gratis|gratuit|free|ieftin)/.test(q) && ['gratuit', 'freemium'].includes(tool.price)) score += 18;
    if (/(europa|european|gdpr|franta|germania|uk)/.test(q) && tool.region === 'europa') score += 20;
    if (normalize(tool.name).includes(q)) score += 60;
    return score;
  }

  function normalizeTool(tool) {
    return {
      name: String(tool.name || 'Tool AI'),
      cats: Array.isArray(tool.cats) ? tool.cats : [],
      price: tool.price || 'freemium',
      country: tool.country || 'SUA',
      region: tool.region || 'america',
      tagline: tool.tagline || tool.description || 'Descriere în curs de verificare.',
      when: tool.when || tool.whenToUse || 'Folosește după testare.',
      url: tool.url || '#',
      trend: Number(tool.trend || 80),
      badges: Array.isArray(tool.badges) ? tool.badges : [],
      integrations: Array.isArray(tool.integrations) ? tool.integrations : [],
      apiInfo: tool.apiInfo || '',
      bestFor: Array.isArray(tool.bestFor) ? tool.bestFor : [],
      notIdeal: Array.isArray(tool.notIdeal) ? tool.notIdeal : [],
      strengths: Array.isArray(tool.strengths) ? tool.strengths : []
    };
  }

  async function loadTools() {
    if (rescue.ready && rescue.tools.length) return rescue.tools;
    try {
      const response = await fetch('tools-market.json');
      const data = await response.json();
      const list = Array.isArray(data) ? data : data.tools;
      rescue.tools = (Array.isArray(list) ? list : []).map(normalizeTool);
    } catch (error) {
      rescue.tools = Array.from(document.querySelectorAll('.tool-card')).map((card) => normalizeTool({
        name: card.dataset.toolName || card.querySelector('.tool-name')?.textContent || 'Tool AI',
        tagline: card.querySelector('.tool-tagline')?.textContent || '',
        when: card.querySelector('.tool-when')?.textContent || '',
        cats: Array.from(card.querySelectorAll('.cat-tag')).map((x) => x.textContent.trim()),
        url: card.querySelector('a[href]')?.href || '#'
      }));
    }
    rescue.ready = true;
    return rescue.tools;
  }

  function findTool(name) {
    const target = normalize(name);
    return rescue.tools.find((tool) => normalize(tool.name) === target) || rescue.tools.find((tool) => normalize(tool.name).includes(target));
  }

  function renderCommandResults(query) {
    const results = $('commandResults');
    const count = $('commandCount');
    if (!results) return;
    rescue.matches = rescue.tools
      .map((tool) => ({ tool, score: rank(tool, query), reason: detectReason(tool, query) }))
      .filter((item) => !query || item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    rescue.activeIndex = Math.min(rescue.activeIndex, Math.max(0, rescue.matches.length - 1));
    if (count) count.textContent = rescue.matches.length + ' recomandări';
    if (!rescue.matches.length) {
      results.innerHTML = '<div class="loading-state">Nu am găsit o potrivire bună. Încearcă: „analizez excel”, „fac video”, „scriu cod”.</div>';
      return;
    }
    results.innerHTML = rescue.matches.map((item, index) => {
      const tool = item.tool;
      return '<div class="command-item' + (index === rescue.activeIndex ? ' active' : '') + '" role="option" aria-selected="' + (index === rescue.activeIndex) + '" data-rescue-index="' + index + '">' +
        '<div><div class="command-name">' + escapeHtml(flagFor(tool.country) + ' ' + tool.name) + '</div>' +
        '<div class="command-meta">' + escapeHtml(tool.country + ' · ' + priceLabel(tool.price) + ' · ' + (tool.cats || []).join(', ')) + '</div>' +
        '<div class="command-tagline">' + escapeHtml(tool.tagline) + '</div>' +
        '<div class="command-reason">Potrivire: ' + escapeHtml(item.reason) + '</div></div>' +
        '<div class="command-score">↗ ' + escapeHtml(String(tool.trend || '')) + '</div></div>';
    }).join('');
  }

  async function openPalette(seed) {
    await loadTools();
    const modal = $('commandModal');
    const input = $('commandInput');
    if (!modal || !input) return;
    modal.classList.add('show');
    input.value = seed || '';
    renderCommandResults(input.value);
    setTimeout(() => input.focus(), 20);
  }

  function closePalette() {
    $('commandModal')?.classList.remove('show');
  }

  function selectActive(openLink) {
    const item = rescue.matches[rescue.activeIndex];
    if (!item) return;
    closePalette();
    if (openLink && item.tool.url) {
      window.open(item.tool.url, '_blank', 'noopener,noreferrer');
      return;
    }
    openDecisionRescue(item.tool.name);
  }

  function openDecisionRescue(name) {
    loadTools().then(() => {
      const tool = findTool(name);
      const modal = $('decisionModal');
      const card = $('decisionCard');
      if (!tool || !modal || !card) return;
      const pros = (tool.strengths.length ? tool.strengths : [tool.when, 'Potrivit pentru: ' + (tool.cats || []).join(', ')]).slice(0, 4);
      const cons = (tool.notIdeal.length ? tool.notIdeal : ['Verifică prețul și limitele înainte de adopție.', 'Nu este ideal dacă ai nevoie de o integrare neconfirmată.']).slice(0, 4);
      const similar = rescue.tools.filter((candidate) => candidate.name !== tool.name && (candidate.cats || []).some((cat) => (tool.cats || []).includes(cat))).slice(0, 4);
      card.innerHTML = '<div class="decision-head"><div><div class="decision-title">' + escapeHtml(flagFor(tool.country) + ' ' + tool.name) + '</div>' +
        '<p class="decision-sub">' + escapeHtml(tool.tagline) + '</p><div class="tool-cats" style="margin-top:14px">' +
        (tool.cats || []).map((cat) => '<span class="cat-tag">' + escapeHtml(cat) + '</span>').join('') + '</div></div>' +
        '<button class="decision-close" id="decisionClose" aria-label="Închide">×</button></div>' +
        '<div class="decision-body"><div class="decision-main">' +
        '<div class="decision-box"><h3>✅ Când îl alegi</h3><p>' + escapeHtml(tool.when) + '</p></div>' +
        '<div class="decision-box"><h3>⚡ Puncte forte</h3><ul>' + pros.map((x) => '<li>' + escapeHtml(x) + '</li>').join('') + '</ul></div>' +
        '<div class="decision-box"><h3>❌ Nu e ideal dacă</h3><ul>' + cons.map((x) => '<li>' + escapeHtml(x) + '</li>').join('') + '</ul></div>' +
        '</div><div class="decision-side">' +
        '<div class="decision-box"><h3>Date utile</h3><p>Preț: <strong>' + escapeHtml(priceLabel(tool.price)) + '</strong><br>Țară: <strong>' + escapeHtml(tool.country) + '</strong><br>Regiune: <strong>' + escapeHtml(tool.region) + '</strong><br>Trend: <strong>' + escapeHtml(String(tool.trend)) + '</strong></p></div>' +
        '<div class="decision-box"><h3>🔁 Alternative similare</h3><p>' + (similar.map((x) => '<button class="decision-pill" data-rescue-tool="' + escapeHtml(x.name) + '">' + escapeHtml(x.name) + '</button>').join(' ') || 'Nu am găsit alternative.') + '</p></div>' +
        '<div class="decision-actions"><a class="decision-action decision-primary" href="' + escapeHtml(tool.url) + '" target="_blank" rel="noopener noreferrer">Deschide site oficial</a></div>' +
        '</div></div>';
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
      $('decisionClose')?.addEventListener('click', closeDecisionRescue);
    });
  }

  function closeDecisionRescue() {
    $('decisionModal')?.classList.remove('show');
    document.body.style.overflow = '';
  }

  if (typeof window.openCommandPalette !== 'function') window.openCommandPalette = openPalette;
  if (typeof window.closeCommandPalette !== 'function') window.closeCommandPalette = closePalette;
  if (typeof window.openDecision !== 'function') window.openDecision = openDecisionRescue;
  if (typeof window.closeDecision !== 'function') window.closeDecision = closeDecisionRescue;

  document.addEventListener('DOMContentLoaded', function () {
    if (window.__signalCoreUiReady) return;
    loadTools();

    $('commandBtn')?.addEventListener('click', function (event) {
      event.preventDefault();
      openPalette();
    });

    $('commandInput')?.addEventListener('input', function (event) {
      rescue.activeIndex = 0;
      renderCommandResults(event.target.value);
    });

    $('commandResults')?.addEventListener('mousedown', function (event) {
      const item = event.target.closest('[data-rescue-index]');
      if (!item) return;
      event.preventDefault();
      rescue.activeIndex = Number(item.dataset.rescueIndex || 0);
      selectActive(false);
    });

    $('commandModal')?.addEventListener('click', function (event) {
      if (event.target === $('commandModal')) closePalette();
    });

    $('decisionModal')?.addEventListener('click', function (event) {
      if (event.target === $('decisionModal')) closeDecisionRescue();
      const similar = event.target.closest('[data-rescue-tool]');
      if (similar) openDecisionRescue(similar.dataset.rescueTool);
    });

    document.addEventListener('click', function (event) {
      const detail = event.target.closest('[data-detail]');
      if (detail) {
        event.preventDefault();
        openDecisionRescue(detail.dataset.detail);
        return;
      }
      const card = event.target.closest('.tool-card[data-tool-name]');
      if (card && !event.target.closest('a, button')) {
        event.preventDefault();
        openDecisionRescue(card.dataset.toolName);
      }
    });

    document.addEventListener('keydown', function (event) {
      const active = document.activeElement;
      const typing = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
      const paletteOpen = $('commandModal')?.classList.contains('show');
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openPalette();
        return;
      }
      if (event.key === '/' && !typing) {
        event.preventDefault();
        openPalette();
        return;
      }
      if (paletteOpen) {
        if (event.key === 'Escape') { event.preventDefault(); closePalette(); return; }
        if (event.key === 'ArrowDown') { event.preventDefault(); rescue.activeIndex = (rescue.activeIndex + 1) % Math.max(rescue.matches.length, 1); renderCommandResults($('commandInput')?.value || ''); return; }
        if (event.key === 'ArrowUp') { event.preventDefault(); rescue.activeIndex = (rescue.activeIndex - 1 + Math.max(rescue.matches.length, 1)) % Math.max(rescue.matches.length, 1); renderCommandResults($('commandInput')?.value || ''); return; }
        if (event.key === 'Enter') { event.preventDefault(); selectActive(event.ctrlKey || event.metaKey); return; }
      }
      if (event.key === 'Escape') closeDecisionRescue();
    });
  });
})();
