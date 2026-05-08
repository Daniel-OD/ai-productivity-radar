/**
 * Decision Modal – full decision-analysis overlay for AI Productivity Radar.
 *
 * Runtime dependencies (resolved lazily, set by app.js):
 *   tools, favorites, compare, flag, priceLabels,
 *   toggleCompare, renderTools, safeStorageSet, toast,
 *   escapeHtml, escapeAttr, toolFaviconUrl (optional)
 *
 * Also uses window.createFocusTrap from phase0-hardening.js if present.
 */
(function () {
  'use strict';

  var dmPrevFocus  = null;
  var dmTrapCleanup = null;

  /* ── Favicon helper (works even before app.js is loaded) ─────────────────── */

  function dmFaviconUrl(name) {
    if (typeof toolFaviconUrl === 'function') return toolFaviconUrl(name);
    var domains = window.TOOL_DOMAINS || {};
    var key = String(name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
    var domain = domains[key];
    if (!domain) {
      var keys = Object.keys(domains);
      for (var i = 0; i < keys.length; i++) {
        if (key.includes(keys[i]) || keys[i].includes(key)) { domain = domains[keys[i]]; break; }
      }
    }
    return domain ? 'https://www.google.com/s2/favicons?domain=' + domain + '&sz=64' : '';
  }

  function dmLogoHtml(t) {
    var src = dmFaviconUrl(t.name);
    var letter = escapeHtml((t.name || '?')[0].toUpperCase());
    if (!src) return '<div class="dm-logo-wrap"><span class="dm-logo-letter">' + letter + '</span></div>';
    return '<div class="dm-logo-wrap">' +
      '<img src="' + escapeAttr(src) + '" alt="" loading="lazy" ' +
      'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'" />' +
      '<span class="dm-logo-letter" style="display:none">' + letter + '</span>' +
      '</div>';
  }

  /* ── Decision scoring ─────────────────────────────────────────────────────── */

  function decisionMetrics(t) {
    var power    = Math.min(98, 55 + Math.round(t.trend * 0.4) + (t.apiAvailable ? 8 : 0) + (t.cats.length > 2 ? 5 : 0));
    var ease     = t.type === 'platform' ? 62 : t.price === 'platit' ? 68 : 82;
    var value    = t.price === 'gratuit' ? 92 : t.price === 'freemium' ? 82 : 62;
    var business = t.apiAvailable ? 85 : t.integrations.length ? 76 : 62;
    return { power: power, ease: ease, value: value, business: business };
  }

  function decisionPros(t) {
    if (t.strengths && t.strengths.length) return t.strengths.slice(0, 5);
    var p = [];
    if (t.trend >= 85)                                    p.push('Are semnal puternic de adopție și popularitate.');
    if (t.apiAvailable)                                   p.push('Are API sau opțiuni de integrare, deci poate intra în workflow-uri automate.');
    if (t.price === 'gratuit' || t.price === 'freemium') p.push('Poți începe fără risc financiar mare.');
    if (t.region === 'europa')                            p.push('Potrivit dacă preferi furnizori europeni sau criterii GDPR.');
    if (t.cats.includes('date'))                          p.push('Relevant pentru analiză de date și insight-uri rapide.');
    if (t.cats.includes('programare'))                    p.push('Bun pentru cod, debugging sau accelerarea dezvoltării.');
    if (t.cats.includes('design'))                        p.push('Bun pentru conținut vizual, video sau asset-uri creative.');
    return p.slice(0, 5);
  }

  function decisionCons(t) {
    if (t.notIdeal && t.notIdeal.length) return t.notIdeal.slice(0, 4);
    var c = [];
    if (t.price === 'platit')   c.push('Necesită buget sau abonament, deci testează valoarea înainte.');
    if (!t.apiAvailable)        c.push('API-ul public nu pare principalul punct forte, deci e mai bun ca produs direct.');
    if (t.trend < 70)           c.push('Trend mai moderat, verifică roadmap-ul și maturitatea produsului.');
    if (t.type === 'platform')  c.push('Poate necesita setup tehnic sau timp de învățare.');
    if (!c.length)              c.push('Nu este ideal dacă ai nevoie de o soluție foarte specializată pe un singur caz îngust.');
    return c.slice(0, 4);
  }

  function getSimilarTools(t) {
    if (t.similar && t.similar.length) {
      return t.similar.slice(0, 4)
        .map(function (n) { return tools.find(function (x) { return x.name === n; }); })
        .filter(Boolean);
    }
    return tools
      .filter(function (x) { return x.name !== t.name && x.cats.some(function (c) { return t.cats.includes(c); }); })
      .sort(function (a, b) { return b.trend - a.trend; })
      .slice(0, 4);
  }

  /* ── Share / deep-link helpers ────────────────────────────────────────────── */

  function getShareUrl(toolName) {
    var u = new URL(location.href);
    u.searchParams.set('tool', toolName);
    return u.toString();
  }

  function promptCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (typeof toast === 'function') toast('Link copiat!');
    } catch (e) {
      if (typeof toast === 'function') toast('Copiază manual: ' + text);
    }
  }

  /* ── Metric bar helper ───────────────────────────────────────────────────── */

  function scoreBar(value, label) {
    var pct = Math.min(100, Math.max(0, value));
    var color = pct >= 80 ? 'var(--gold)' : pct >= 60 ? '#7ec8a0' : '#c8927e';
    return '<div class="dm-score-row">' +
      '<span class="dm-score-label">' + escapeHtml(label) + '</span>' +
      '<div class="dm-score-bar-wrap"><div class="dm-score-bar" style="width:' + pct + '%;background:' + color + '"></div></div>' +
      '<span class="dm-score-val">' + escapeHtml(String(value)) + '</span>' +
      '</div>';
  }

  /* ── Platform icon map ──────────────────────────────────────────────────── */

  var PLATFORM_ICONS = {
    'Web': '🌐', 'iOS': '📱', 'Android': '🤖', 'API': '🔌',
    'Desktop': '💻', 'Mac': '🍎', 'Windows': '🪟', 'Linux': '🐧',
    'Chrome Extension': '🔌', 'VS Code': '💻', 'JetBrains': '💻',
    'Slack': '💬', 'Teams': '💬'
  };

  /* ── HTML builder ─────────────────────────────────────────────────────────── */

  function buildDecisionHTML(t) {
    var m   = decisionMetrics(t);
    var sim = getSimilarTools(t);
    var isFav = favorites && favorites.has(t.name);

    /* Logo */
    var logoHtml = dmLogoHtml(t);

    /* Category & badge chips */
    var catsHtml   = t.cats.map(function (c) { return '<span class="cat-tag">' + escapeHtml(c) + '</span>'; }).join('');
    var badgesHtml = t.badges.map(function (b) { return '<span class="cat-tag badge-tag">' + escapeHtml(b) + '</span>'; }).join('');

    /* Long description */
    var descText = t.longDescription || t.tagline || '';
    var descHtml = descText
      ? '<div class="decision-box">' +
          '<h3>💡 Ce este ' + escapeHtml(t.name) + '?</h3>' +
          '<p>' + escapeHtml(descText) + '</p>' +
        '</div>'
      : '';

    /* Key features */
    var featuresHtml = '';
    if (t.features && t.features.length) {
      featuresHtml = '<div class="decision-box">' +
        '<h3>⚡ Funcționalități cheie</h3>' +
        '<ul class="dm-feature-list">' +
        t.features.map(function (f) { return '<li>' + escapeHtml(f) + '</li>'; }).join('') +
        '</ul></div>';
    } else {
      var pros = decisionPros(t);
      if (pros.length) {
        featuresHtml = '<div class="decision-box">' +
          '<h3>⚡ Puncte forte</h3>' +
          '<ul class="dm-feature-list">' +
          pros.map(function (x) { return '<li>' + escapeHtml(x) + '</li>'; }).join('') +
          '</ul></div>';
      }
    }

    /* Use cases / best for */
    var bestList = (t.useCases && t.useCases.length) ? t.useCases : t.bestFor;
    var bestForHtml = (bestList && bestList.length)
      ? '<div class="decision-box"><h3>✅ Ideal pentru</h3><ul>' +
        bestList.map(function (x) { return '<li>' + escapeHtml(x) + '</li>'; }).join('') +
        '</ul></div>'
      : (t.when ? '<div class="decision-box"><h3>✅ Când îl folosești</h3><p>' + escapeHtml(t.when) + '</p></div>' : '');

    /* Not ideal */
    var cons = decisionCons(t);
    var notIdealHtml = cons.length
      ? '<div class="decision-box"><h3>❌ Nu e ideal dacă</h3><ul>' +
        cons.map(function (x) { return '<li>' + escapeHtml(x) + '</li>'; }).join('') +
        '</ul></div>'
      : '';

    /* Audience */
    var audienceHtml = t.audience
      ? '<div class="decision-box"><h3>👥 Audiență</h3><p>' + escapeHtml(t.audience) + '</p></div>'
      : '';

    /* Platforms */
    var platformsHtml = '';
    if (t.platforms && t.platforms.length) {
      platformsHtml = '<div class="decision-box">' +
        '<h3>📱 Disponibil pe</h3>' +
        '<div class="dm-platforms">' +
        t.platforms.map(function (p) {
          return '<span class="dm-platform-badge">' + (PLATFORM_ICONS[p] || '•') + ' ' + escapeHtml(p) + '</span>';
        }).join('') +
        '</div></div>';
    }

    /* Pricing tiers */
    var tiersHtml = '';
    if (t.pricingTiers && t.pricingTiers.length) {
      tiersHtml = '<div class="decision-box">' +
        '<h3>💰 Planuri de preț</h3>' +
        '<div class="dm-pricing-tiers">' +
        t.pricingTiers.map(function (tier) {
          return '<div class="dm-pricing-tier' + (tier.highlight ? ' dm-tier-highlight' : '') + '">' +
            '<div class="dm-tier-name">' + escapeHtml(tier.name) + '</div>' +
            '<div class="dm-tier-price">' + escapeHtml(tier.price) + '</div>' +
            (tier.desc ? '<div class="dm-tier-desc">' + escapeHtml(tier.desc) + '</div>' : '') +
            '</div>';
        }).join('') +
        '</div></div>';
    } else {
      var pricingInfo = t.pricing || priceLabels[t.price];
      if (pricingInfo) {
        tiersHtml = '<div class="decision-box"><h3>💰 Preț</h3><p>' + escapeHtml(pricingInfo) + '</p></div>';
      }
    }

    /* Decision scores (bar style) */
    var scoresHtml = '<div class="decision-box">' +
      '<h3>Scoruri decizionale</h3>' +
      '<div class="dm-scores">' +
      scoreBar(m.power,    'Putere') +
      scoreBar(m.ease,     'Ușurință') +
      scoreBar(m.value,    'Valoare') +
      scoreBar(m.business, 'Business') +
      '</div></div>';

    /* Integrations */
    var integrationsHtml = (t.integrations && t.integrations.length)
      ? '<div class="decision-box"><h3>🧩 Integrări</h3><p class="dm-integrations">' +
        t.integrations.map(function (i) { return '<span>' + escapeHtml(i) + '</span>'; }).join('') +
        '</p></div>'
      : '';

    /* Trend */
    var trendNote = t.trendExplanation
      ? '<p class="dm-trend-note">' + escapeHtml(t.trendExplanation) + '</p>'
      : '';
    var trendHtml = '<div class="decision-box"><h3>📈 Trend</h3>' +
      '<div class="dm-trend-score">' +
      '<strong>' + escapeHtml(String(t.trend)) + '</strong><span>/100</span>' +
      '</div>' + trendNote + '</div>';

    /* Similar tools */
    var simHtml = sim.map(function (x) {
      return '<button class="decision-pill" data-open-sim="' + escapeAttr(x.name) + '">' +
        escapeHtml(x.name) + '</button>';
    }).join(' ') || 'Nu am găsit alternative.';
    var similarHtml = '<div class="decision-box"><h3>🔁 Alternative similare</h3><p>' + simHtml + '</p></div>';

    /* Actions */
    var actionsHtml = '<div class="decision-actions">' +
      '<a class="decision-action decision-primary" href="' + escapeAttr(t.url) + '" target="_blank" rel="noopener noreferrer">Deschide site oficial ↗</a>' +
      '<button class="decision-action decision-secondary" data-modal-compare="' + escapeAttr(t.name) + '">+ Compară</button>' +
      '<button class="decision-action decision-secondary" id="modalFavBtn">' + (isFav ? '★' : '☆') + ' Favorit</button>' +
      '</div>';

    return (
      /* Header */
      '<div class="decision-head">' +
        '<div class="decision-head-info">' +
          logoHtml +
          '<div class="decision-head-text">' +
            '<div class="decision-title">' + escapeHtml((flag[t.country] || '🌍') + ' ' + t.name) + '</div>' +
            '<p class="decision-sub">' + escapeHtml(t.tagline) + '</p>' +
            '<div class="tool-cats dm-head-cats">' + catsHtml + badgesHtml + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="decision-head-controls">' +
          '<button class="decision-action decision-secondary dm-share-btn" id="decisionShare" title="Copiază link de partajare" aria-label="Copiază link">🔗</button>' +
          '<button class="decision-close" id="decisionClose" aria-label="Închide">×</button>' +
        '</div>' +
      '</div>' +
      /* Body */
      '<div class="decision-body">' +
        '<div class="decision-main">' +
          descHtml +
          featuresHtml +
          bestForHtml +
          notIdealHtml +
          audienceHtml +
        '</div>' +
        '<div class="decision-side">' +
          platformsHtml +
          tiersHtml +
          scoresHtml +
          trendHtml +
          integrationsHtml +
          similarHtml +
          actionsHtml +
        '</div>' +
      '</div>'
    );
  }

  /* ── Open / Close ─────────────────────────────────────────────────────────── */

  window.openDecision = function (name) {
    var t = tools.find(function (x) { return x.name === name; });
    if (!t) return;

    dmPrevFocus = document.activeElement;

    var card  = document.getElementById('decisionCard');
    var modal = document.getElementById('decisionModal');
    if (!card || !modal) return;

    card.innerHTML = buildDecisionHTML(t);
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    /* Update URL for shareability / deep-link */
    try {
      var u = new URL(location.href);
      u.searchParams.set('tool', t.name);
      history.replaceState(null, '', u.toString());
    } catch (e) {}

    /* Wire: close */
    var closeBtn = document.getElementById('decisionClose');
    if (closeBtn) closeBtn.addEventListener('click', closeDecision);

    /* Wire: share */
    var shareBtn = document.getElementById('decisionShare');
    if (shareBtn) {
      shareBtn.addEventListener('click', function () {
        var link = getShareUrl(t.name);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(link)
            .then(function () { if (typeof toast === 'function') toast('Link copiat în clipboard!'); })
            .catch(function () { promptCopy(link); });
        } else {
          promptCopy(link);
        }
      });
    }

    /* Wire: alternative tools */
    card.querySelectorAll('[data-open-sim]').forEach(function (b) {
      b.addEventListener('click', function () { openDecision(b.dataset.openSim); });
    });

    /* Wire: compare */
    var cmpBtn = card.querySelector('[data-modal-compare]');
    if (cmpBtn) {
      cmpBtn.addEventListener('click', function () {
        if (typeof toggleCompare === 'function') toggleCompare(t.name);
        if (typeof toast === 'function') toast('Adăugat la comparație');
      });
    }

    /* Wire: favourite */
    var favBtn = document.getElementById('modalFavBtn');
    if (favBtn) {
      favBtn.addEventListener('click', function () {
        if (favorites.has(t.name)) favorites.delete(t.name);
        else favorites.add(t.name);
        if (typeof safeStorageSet === 'function') safeStorageSet('aiRadarFavorites', JSON.stringify(Array.from(favorites)));
        if (typeof toast === 'function') toast(favorites.has(t.name) ? 'Adăugat la favorite' : 'Scos din favorite');
        favBtn.textContent = (favorites.has(t.name) ? '★' : '☆') + ' Favorit';
        if (typeof renderTools === 'function') renderTools();
      });
    }

    /* Focus first interactive element */
    setTimeout(function () {
      var first = modal.querySelector('button, [href], input');
      if (first) first.focus();
    }, 50);

    /* Focus trap */
    if (typeof window.createFocusTrap === 'function') {
      if (dmTrapCleanup) dmTrapCleanup();
      dmTrapCleanup = window.createFocusTrap(card);
    }
  };

  window.closeDecision = function () {
    var modal = document.getElementById('decisionModal');
    if (modal) modal.classList.remove('show');
    document.body.style.overflow = '';

    /* Remove ?tool= from URL */
    try {
      var u = new URL(location.href);
      if (u.searchParams.has('tool')) {
        u.searchParams.delete('tool');
        var newUrl = u.pathname + (u.search && u.search !== '?' ? u.search : '') + u.hash;
        history.replaceState(null, '', newUrl || u.pathname);
      }
    } catch (e) {}

    /* Restore focus */
    if (dmPrevFocus) { try { dmPrevFocus.focus(); } catch (e) {} }
    dmPrevFocus = null;

    /* Remove focus trap */
    if (dmTrapCleanup) { dmTrapCleanup(); dmTrapCleanup = null; }
  };

  /* Delay before opening the deep-linked tool modal (ms) */
  var DEEPLINK_DELAY = 400;

  /* ── Deep-link: ?tool=name ────────────────────────────────────────────────── */

  window.handleToolDeepLink = function () {
    var toolParam = new URLSearchParams(location.search).get('tool');
    if (!toolParam) return;
    var t = tools.find(function (x) { return x.name.toLowerCase() === toolParam.toLowerCase(); });
    if (t) setTimeout(function () { openDecision(t.name); }, DEEPLINK_DELAY);
  };

  /* ── Init (called from app.js after DOM ready) ────────────────────────────── */

  window.initDecisionModal = function () {
    var modal = document.getElementById('decisionModal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeDecision();
      });
    }
  };

})();
