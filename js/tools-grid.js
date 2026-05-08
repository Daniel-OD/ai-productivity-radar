/**
 * SignalGrid — pure card HTML builder.
 * IIFE, exposes window.SignalGrid.
 * No DOM access, no side-effects. Returns an HTML string.
 */
(function () {
  'use strict';

  /**
   * Build HTML for a single tool card.
   * @param {object} t        — normalized tool object
   * @param {object} opts
   * @param {Set}    opts.favorites
   * @param {Set}    opts.compare
   * @param {object} opts.toolLogos  — {name: emoji, …}
   * @param {object} opts.flag       — {country: emoji, …}
   * @param {object} opts.priceLabels
   * @returns {string}
   */
  function buildCard(t, opts) {
    opts = opts || {};
    var favorites  = opts.favorites  || new Set();
    var toolLogos  = opts.toolLogos  || {};
    var flag       = opts.flag       || {};
    var priceLabels= opts.priceLabels|| {};

    var isFav  = favorites.has(t.name);
    var logo   = toolLogos[t.name] || '🛠️';
    var stars  = '⭐'.repeat(Math.floor((t.trend || 80) / 20));
    var empty  = '☆'.repeat(5 - Math.floor((t.trend || 80) / 20));
    var cats   = (t.cats || []).map(function (c) { return '<span class="tool-tag">' + _esc(c) + '</span>'; }).join('');

    /* Inline onclick uses single-quoted attribute wrapping; name is attr-escaped */
    var safeName = t.name.replace(/'/g, "\\'");

    return '<div class="tool-card" data-tool="' + _escAttr(t.name) + '" onclick="openToolDetails(\'' + safeName + '\')">' +
      '<div class="tool-header">' +
        '<div class="tool-logo">' + logo + '</div>' +
        '<div>' +
          '<h3 class="tool-name">' + _esc(t.name) + '</h3>' +
          '<div class="tool-meta">' +
            '<span>' + _esc((flag[t.country] || '🌍') + ' ' + t.country) + '</span>' +
            '<span class="tool-rating">' + stars + empty + ' ' + _esc(String(t.trend || 80)) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<p class="tool-description">' + _esc(t.tagline || '') + '</p>' +
      '<div class="tool-tags">' + cats + '</div>' +
      '<div class="tool-actions">' +
        '<a class="tool-link" href="' + _escAttr(t.url || '#') + '" target="_blank" rel="noopener noreferrer">🔗 Link</a>' +
        '<button class="fav-btn" data-action="fav" data-tool="' + _escAttr(t.name) + '" aria-label="' + (isFav ? 'Șterge din favorite' : 'Adaugă la favorite') + '">' + (isFav ? '❤️' : '🤍') + '</button>' +
        '<button class="compare-btn" data-action="compare" data-tool="' + _escAttr(t.name) + '" aria-label="Adaugă la comparare">⚖️</button>' +
      '</div>' +
    '</div>';
  }

  function _esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function _escAttr(s) {
    return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  window.SignalGrid = { buildCard: buildCard };
})();
