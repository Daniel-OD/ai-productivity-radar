/**
 * Decision Modal – full decision-analysis overlay for AI Productivity Radar.
 *
 * Phases covered: 3 (decision modal system), 4 (XSS-safe rendering),
 *                 7 (focus trap / accessibility)
 *
 * Runtime dependencies (resolved lazily, set by app.js):
 *   tools, favorites, compare, flag, priceLabels,
 *   toggleCompare, renderTools, safeStorageSet, toast,
 *   escapeHtml, escapeAttr
 *
 * Also uses window.createFocusTrap from phase0-hardening.js if present.
 */
(function () {
  'use strict';

  var dmPrevFocus  = null;
  var dmTrapCleanup = null;

  /* ── Decision scoring ─────────────────────────────────────────────────────── */

  function decisionMetrics(t) {
    var power    = Math.min(98, 55 + Math.round(t.trend * 0.4) + (t.apiAvailable ? 8 : 0) + (t.cats.length > 2 ? 5 : 0));
    var ease     = t.type === 'platform' ? 62 : t.price === 'platit' ? 68 : 82;
    var value    = t.price === 'gratuit' ? 92 : t.price === 'freemium' ? 82 : 62;
    var business = t.apiAvailable ? 85 : t.integrations.length ? 76 : 62;
    return { power: power, ease: ease, value: value, business: business };
  }

  function decisionPros(t) {
    if (t.strengths && t.strengths.length) return t.strengths.slice(0, 4);
    var p = [];
    if (t.trend >= 85)                                    p.push('Are semnal puternic de adopție și popularitate.');
    if (t.apiAvailable)                                   p.push('Are API sau opțiuni de integrare, deci poate intra în workflow-uri automate.');
    if (t.price === 'gratuit' || t.price === 'freemium') p.push('Poți începe fără risc financiar mare.');
    if (t.region === 'europa')                            p.push('Potrivit dacă preferi furnizori europeni sau criterii GDPR.');
    if (t.cats.includes('date'))                          p.push('Relevant pentru analiză de date și insight-uri rapide.');
    if (t.cats.includes('programare'))                    p.push('Bun pentru cod, debugging sau accelerarea dezvoltării.');
    if (t.cats.includes('design'))                        p.push('Bun pentru conținut vizual, video sau asset-uri creative.');
    return p.slice(0, 4);
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

  /* ── HTML builder (all dynamic content escaped) ───────────────────────────── */

  function buildDecisionHTML(t) {
    var m   = decisionMetrics(t);
    var sim = getSimilarTools(t);
    var pricingInfo = t.pricing || priceLabels[t.price];
    var isFav = favorites && favorites.has(t.name);

    var trendNote = t.trendExplanation
      ? '<p style="margin-top:8px;font-style:italic">' + escapeHtml(t.trendExplanation) + '</p>'
      : '';

    var bestForList = (t.bestFor && t.bestFor.length)
      ? '<ul>' + t.bestFor.map(function (x) { return '<li>' + escapeHtml(x) + '</li>'; }).join('') + '</ul>'
      : '<p>' + escapeHtml(t.when) + '</p>';

    var catsHtml   = t.cats.map(function (c) { return '<span class="cat-tag">' + escapeHtml(c) + '</span>'; }).join('');
    var badgesHtml = t.badges.map(function (b) { return '<span class="cat-tag">' + escapeHtml(b) + '</span>'; }).join('');

    var prosHtml = decisionPros(t).map(function (x) { return '<li>' + escapeHtml(x) + '</li>'; }).join('');
    var consHtml = decisionCons(t).map(function (x) { return '<li>' + escapeHtml(x) + '</li>'; }).join('');

    var simHtml = sim.map(function (x) {
      return '<button class="decision-pill" data-open-sim="' + escapeAttr(x.name) + '">' + escapeHtml(x.name) + '</button>';
    }).join(' ') || 'Nu am găsit alternative.';

    var integrationsHtml = t.integrations.length
      ? '<div class="decision-box"><h3>🧩 Integrări</h3><p>' + escapeHtml(t.integrations.join(' · ')) + '</p></div>'
      : '';

    var audienceHtml = t.audience
      ? '<div class="decision-box"><h3>👥 Audiență</h3><p>' + escapeHtml(t.audience) + '</p></div>'
      : '';

    return (
      '<div class="decision-head">' +
        '<div>' +
          '<div class="decision-title">' + escapeHtml((flag[t.country] || '🌍') + ' ' + t.name) + '</div>' +
          '<p class="decision-sub">' + escapeHtml(t.tagline) + '</p>' +
          '<div class="tool-cats" style="margin-top:14px">' + catsHtml + badgesHtml + '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;align-items:flex-start;flex-shrink:0">' +
          '<button class="decision-action decision-secondary" id="decisionShare" title="Copiază link de partajare" aria-label="Copiază link">🔗</button>' +
          '<button class="decision-close" id="decisionClose" aria-label="Închide">×</button>' +
        '</div>' +
      '</div>' +
      '<div class="decision-body">' +
        '<div class="decision-main">' +
          '<div class="decision-box"><h3>✅ Best for</h3>' + bestForList + '</div>' +
          '<div class="decision-box"><h3>❌ Nu e ideal dacă</h3><ul>' + consHtml + '</ul></div>' +
          '<div class="decision-box"><h3>⚡ Puncte forte</h3><ul>' + prosHtml + '</ul></div>' +
          audienceHtml +
        '</div>' +
        '<div class="decision-side">' +
          '<div class="decision-box">' +
            '<h3>Scoruri decizionale</h3>' +
            '<div class="decision-score">' +
              '<div class="score-card"><strong>' + escapeHtml(String(m.power))    + '</strong><span>putere</span></div>' +
              '<div class="score-card"><strong>' + escapeHtml(String(m.ease))     + '</strong><span>ușurință</span></div>' +
              '<div class="score-card"><strong>' + escapeHtml(String(m.value))    + '</strong><span>valoare</span></div>' +
              '<div class="score-card"><strong>' + escapeHtml(String(m.business)) + '</strong><span>business</span></div>' +
            '</div>' +
          '</div>' +
          '<div class="decision-box"><h3>💰 Preț</h3><p>' + escapeHtml(pricingInfo) + '</p></div>' +
          integrationsHtml +
          '<div class="decision-box"><h3>📈 Trend</h3><p><strong style="color:var(--gold)">' + escapeHtml(String(t.trend)) + '/100</strong>' + trendNote + '</p></div>' +
          '<div class="decision-box"><h3>🔁 Alternative similare</h3><p>' + simHtml + '</p></div>' +
          '<div class="decision-actions">' +
            '<a class="decision-action decision-primary" href="' + escapeAttr(t.url) + '" target="_blank" rel="noopener noreferrer">Deschide site oficial</a>' +
            '<button class="decision-action decision-secondary" data-modal-compare="' + escapeAttr(t.name) + '">Adaugă la comparație</button>' +
            '<button class="decision-action decision-secondary" id="modalFavBtn">' + (isFav ? '★' : '☆') + ' Favorit</button>' +
          '</div>' +
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
