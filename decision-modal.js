/* ─────────────────────────────────────────────────────────────────────────────
   Tool Decision Modal  –  AI Productivity Radar
   Opens when the user clicks the body of a .tool-card (not the action buttons).
   Depends on globals set by index.html: tools, favorites, compare, priceLabels,
   flag, toast, updateCompare, renderTools.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  /* ── Closure state ────────────────────────────────────────────────────────── */
  var lastFocus = null;

  /* ── CSS ──────────────────────────────────────────────────────────────────── */
  var STYLES = [
    '.dm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);display:none;',
    'align-items:center;justify-content:center;z-index:450;padding:20px;}',
    '.dm-overlay.show{display:flex;}',
    '.dm-card{background:var(--surface);border:1px solid var(--border-strong);',
    'border-radius:14px;width:100%;max-width:680px;max-height:88vh;overflow:hidden;',
    'display:flex;flex-direction:column;box-shadow:0 32px 100px rgba(0,0,0,.6);}',
    '.dm-header{display:flex;align-items:flex-start;justify-content:space-between;',
    'gap:14px;padding:22px 24px 16px;border-bottom:1px solid var(--border);}',
    '.dm-title{font-family:var(--serif);font-size:clamp(22px,4vw,30px);',
    'font-weight:500;line-height:1.1;}',
    '.dm-meta{font-family:var(--mono);font-size:11px;color:var(--text-muted);',
    'margin-top:6px;display:flex;gap:10px;flex-wrap:wrap;}',
    '.dm-close{background:transparent;border:1px solid var(--border-strong);',
    'color:var(--text-muted);border-radius:50%;width:32px;height:32px;',
    'font-size:16px;cursor:pointer;display:flex;align-items:center;',
    'justify-content:center;flex-shrink:0;line-height:1;}',
    '.dm-close:hover{border-color:var(--gold);color:var(--gold);}',
    '.dm-body{overflow-y:auto;flex:1;padding:20px 24px;',
    'display:flex;flex-direction:column;gap:18px;}',
    '.dm-tagline{font-family:var(--serif);font-style:italic;font-size:16px;',
    'color:var(--text-muted);line-height:1.6;}',
    '.dm-sections{display:grid;grid-template-columns:1fr 1fr;gap:12px;}',
    '@media(max-width:560px){.dm-sections{grid-template-columns:1fr;}}',
    '.dm-section{background:var(--bg-soft);border:1px solid var(--border);',
    'border-radius:8px;padding:14px;}',
    '.dm-section.dm-wide{grid-column:1 / -1;}',
    '.dm-section-head{font-family:var(--mono);font-size:10px;letter-spacing:.15em;',
    'text-transform:uppercase;color:var(--text-dim);margin-bottom:8px;}',
    '.dm-tags{display:flex;flex-wrap:wrap;gap:6px;}',
    '.dm-tag{font-size:12px;color:var(--text-muted);background:var(--surface);',
    'border:1px solid var(--border-strong);border-radius:999px;padding:3px 10px;}',
    '.dm-text{font-size:13px;color:var(--text-muted);line-height:1.6;}',
    '.dm-placeholder{font-size:12px;color:var(--text-dim);font-style:italic;}',
    '.dm-footer{display:flex;gap:10px;padding:16px 24px;',
    'border-top:1px solid var(--border);flex-wrap:wrap;}',
    '.dm-btn-primary{background:var(--gold);color:var(--bg);',
    'border:1px solid var(--gold);border-radius:999px;padding:10px 16px;',
    'font-family:var(--mono);font-size:11px;cursor:pointer;text-decoration:none;',
    'display:inline-flex;align-items:center;gap:6px;}',
    '.dm-btn{background:transparent;color:var(--text-muted);',
    'border:1px solid var(--border-strong);border-radius:999px;padding:10px 16px;',
    'font-family:var(--mono);font-size:11px;cursor:pointer;',
    'display:inline-flex;align-items:center;gap:6px;}',
    '.dm-btn:hover{border-color:var(--gold);color:var(--gold);}',
    '.dm-btn-primary:hover{background:transparent;color:var(--gold);}',
    '.dm-trend{display:flex;align-items:center;gap:10px;margin-bottom:4px;}',
    '.dm-trend-bar{flex:1;height:4px;background:var(--border);border-radius:2px;overflow:hidden;}',
    '.dm-trend-fill{height:100%;background:var(--gold);border-radius:2px;',
    'transition:width .4s ease;}',
    '.dm-trend-val{font-family:var(--mono);font-size:11px;color:var(--gold);min-width:44px;}',
    '.tool-card{cursor:pointer;}'
  ].join('');

  /* ── Inject styles ────────────────────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('dm-styles')) return;
    var s = document.createElement('style');
    s.id = 'dm-styles';
    s.textContent = STYLES;
    document.head.appendChild(s);
  }

  /* ── Inject modal HTML ────────────────────────────────────────────────────── */
  function injectModal() {
    if (document.getElementById('decisionModal')) return;
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div id="decisionModal" class="dm-overlay" role="dialog" aria-modal="true"' +
      ' aria-labelledby="dmTitle">' +
      '<div class="dm-card">' +
      '<div class="dm-header">' +
      '<div><div class="dm-title" id="dmTitle">\u2014</div>' +
      '<div class="dm-meta" id="dmMeta"></div></div>' +
      '<button class="dm-close" id="dmClose" aria-label="\xCEnchide">\u2715</button>' +
      '</div>' +
      '<div class="dm-body" id="dmBody"></div>' +
      '<div class="dm-footer" id="dmFooter"></div>' +
      '</div></div>';
    document.body.appendChild(wrap.firstElementChild);

    document.getElementById('dmClose').addEventListener('click', closeDecisionModal);
    document.getElementById('decisionModal').addEventListener('click', function (e) {
      if (e.target === this) closeDecisionModal();
    });
  }

  /* ── Close ────────────────────────────────────────────────────────────────── */
  function closeDecisionModal() {
    var modal = document.getElementById('decisionModal');
    if (!modal) return;
    modal.classList.remove('show');
    document.body.style.overflow = '';
    if (lastFocus) {
      try { lastFocus.focus(); } catch (e) {}
      lastFocus = null;
    }
  }

  /* ── Helpers ──────────────────────────────────────────────────────────────── */
  function section(icon, label, content, wide) {
    return '<div class="dm-section' + (wide ? ' dm-wide' : '') + '">' +
      '<div class="dm-section-head">' + icon + ' ' + label + '</div>' +
      content + '</div>';
  }

  function tagList(arr, placeholder) {
    if (!arr || !arr.length) {
      return '<span class="dm-placeholder">' + placeholder + '</span>';
    }
    return '<div class="dm-tags">' +
      arr.map(function (x) { return '<span class="dm-tag">' + x + '</span>'; }).join('') +
      '</div>';
  }

  /* ── Render modal content ─────────────────────────────────────────────────── */
  function renderDecisionModal(t) {
    var pl = window.priceLabels || {};
    var fl = window.flag || {};

    /* Header */
    document.getElementById('dmTitle').textContent = t.name;
    var priceCls = { gratuit: 'sage', freemium: 'blue', platit: 'coral' }[t.price] || 'text-muted';
    document.getElementById('dmMeta').innerHTML =
      '<span>' + (fl[t.country] || '\uD83C\uDF0D') + ' ' + t.country + '</span>' +
      '<span style="color:var(--' + priceCls + ')">' + (pl[t.price] || t.price) + '</span>' +
      '<span style="color:var(--gold)">\u2197 trend ' + t.trend + '</span>' +
      (t.source ? '<span>' + t.source + '</span>' : '') +
      (t.audience ? '<span style="color:var(--text-dim)">' + t.audience + '</span>' : '');

    /* Body */
    var trendBar =
      '<div class="dm-trend">' +
      '<div class="dm-trend-bar"><div class="dm-trend-fill" style="width:' + t.trend + '%"></div></div>' +
      '<span class="dm-trend-val">' + t.trend + '/100</span>' +
      '</div>' +
      (t.trendExplanation ? '<p class="dm-text" style="margin-top:6px">' + t.trendExplanation + '</p>' : '');

    var pricingContent = t.pricing
      ? '<p class="dm-text">' + t.pricing + '</p>'
      : '<span class="dm-tag">' + (pl[t.price] || t.price) + '</span>';

    var bodyHtml = '<p class="dm-tagline">' + t.tagline + '</p>' +
      '<div class="dm-sections">' +
      section('\u2705', 'Best for', tagList(t.bestFor, 'Adaug\u0103 c\u00E2mpul <em>bestFor</em> \u00EEn JSON'), false) +
      section('\u274C', 'Not ideal for', tagList(t.notIdeal, 'Adaug\u0103 c\u00E2mpul <em>notIdeal</em> \u00EEn JSON'), false) +
      section('\u26A1', 'Strengths', tagList(t.strengths, 'Adaug\u0103 c\u00E2mpul <em>strengths</em> \u00EEn JSON'), false) +
      section('\uD83E\uDDE9', 'Integrations', tagList(t.integrations, 'Integr\u0103ri nedocumentate'), false) +
      section('\uD83D\uDCB0', 'Pricing', pricingContent, false) +
      section('\uD83D\uDCC8', 'Trend', trendBar, false) +
      section('\uD83D\uDD01', 'Similar tools', tagList(t.similar, 'Adaug\u0103 c\u00E2mpul <em>similar</em> \u00EEn JSON'), false) +
      (t.apiInfo
        ? section('\uD83D\uDD0C', 'API', '<p class="dm-text">' + t.apiInfo + '</p>', false)
        : '') +
      '</div>';

    document.getElementById('dmBody').innerHTML = bodyHtml;

    /* Footer actions */
    var isFav = window.favorites && window.favorites.has(t.name);
    var inCmp = window.compare && window.compare.has(t.name);

    var footerHtml =
      '<a class="dm-btn-primary" id="dmOpenSite" href="' + t.url +
      '" target="_blank" rel="noopener noreferrer">\uD83D\uDD17 Open official site</a>' +
      '<button class="dm-btn" id="dmCompareBtn">' + (inCmp ? '\u2713 In compare' : '+ Compare') + '</button>' +
      '<button class="dm-btn" id="dmFavBtn">' + (isFav ? '\u2605 Favorit' : '\u2606 Favorit') + '</button>';

    document.getElementById('dmFooter').innerHTML = footerHtml;

    /* Wire Compare */
    document.getElementById('dmCompareBtn').addEventListener('click', function () {
      if (!window.compare) return;
      if (window.compare.has(t.name)) {
        window.compare.delete(t.name);
      } else if (window.compare.size < 4) {
        window.compare.add(t.name);
      } else {
        window.toast && window.toast('Po\u021Bi compara maximum 4 tooluri.');
        return;
      }
      window.updateCompare && window.updateCompare();
      window.renderTools && window.renderTools();
      this.textContent = window.compare.has(t.name) ? '\u2713 In compare' : '+ Compare';
    });

    /* Wire Favorite */
    document.getElementById('dmFavBtn').addEventListener('click', function () {
      if (!window.favorites) return;
      if (window.favorites.has(t.name)) {
        window.favorites.delete(t.name);
      } else {
        window.favorites.add(t.name);
      }
      try { localStorage.setItem('aiRadarFavorites', JSON.stringify([...window.favorites])); } catch (e) {}
      window.toast && window.toast(window.favorites.has(t.name) ? 'Ad\u0103ugat la favorite' : 'Scos din favorite');
      window.renderTools && window.renderTools();
      this.textContent = window.favorites.has(t.name) ? '\u2605 Favorit' : '\u2606 Favorit';
    });
  }

  /* ── Public: open modal ───────────────────────────────────────────────────── */
  window.openDecisionModal = function (toolName) {
    var t = (window.tools || []).find(function (x) { return x.name === toolName; });
    if (!t) return;
    renderDecisionModal(t);
    var modal = document.getElementById('decisionModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    var closeBtn = document.getElementById('dmClose');
    if (closeBtn) setTimeout(function () { closeBtn.focus(); }, 20);
  };

  /* ── Event delegation: card body click opens modal ───────────────────────── */
  document.addEventListener('click', function (e) {
    var card = e.target.closest && e.target.closest('.tool-card');
    if (!card) return;
    /* Ignore clicks on action buttons, links, or interactive elements */
    if (e.target.closest('.tool-actions')) return;
    if (e.target.closest('a, button')) return;
    var name = card.dataset && card.dataset.toolName;
    if (!name) return;
    lastFocus = card;
    window.openDecisionModal(name);
  });

  /* ── ESC closes decision modal ───────────────────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var modal = document.getElementById('decisionModal');
    if (modal && modal.classList.contains('show')) {
      closeDecisionModal();
    }
  });

  /* ── Bootstrap ───────────────────────────────────────────────────────────── */
  function init() {
    injectStyles();
    injectModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();