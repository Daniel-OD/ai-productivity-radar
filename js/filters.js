/**
 * SignalFilters — pure filtering + sorting logic.
 * IIFE, exposes window.SignalFilters.
 * No DOM access, no side-effects. Accepts explicit params so it's testable.
 */
(function () {
  'use strict';

  var SORT_MODES = ['default', 'trend', 'rating', 'name', 'price', 'favorites'];

  /**
   * Filter and sort a tools array.
   * @param {object} opts
   * @param {Array}  opts.tools
   * @param {string} opts.activeCat
   * @param {string} opts.activePrice
   * @param {string} opts.activeRegion
   * @param {string} opts.searchQuery
   * @param {string} opts.sortMode
   * @param {Set}    opts.favorites
   * @param {object} opts.priceOrder  — {gratuit:1, freemium:2, platit:3}
   * @returns {Array}
   */
  function getFiltered(opts) {
    var tools       = opts.tools       || [];
    var activeCat   = opts.activeCat   || 'all';
    var activePrice = opts.activePrice || 'all';
    var activeRegion= opts.activeRegion|| 'all';
    var sortMode    = opts.sortMode    || 'default';
    var favorites   = opts.favorites   || new Set();
    var priceOrder  = opts.priceOrder  || { gratuit: 1, freemium: 2, platit: 3 };
    var q = String(opts.searchQuery || '').toLowerCase().trim();

    var out = tools.filter(function (t) {
      var hay = [t.name, t.tagline, t.when, t.country, t.region, t.price]
        .concat(t.cats || []).concat(t.badges || []).join(' ').toLowerCase();
      return (activeCat    === 'all' || (t.cats  || []).indexOf(activeCat)   !== -1)
          && (activePrice  === 'all' || t.price  === activePrice)
          && (activeRegion === 'all' || t.region === activeRegion)
          && (!q || hay.indexOf(q) !== -1);
    });

    if      (sortMode === 'trend')     out.sort(function (a, b) { return (b.trend || 0) - (a.trend || 0); });
    else if (sortMode === 'rating')    out.sort(function (a, b) { return (b.trend || 0) - (a.trend || 0); });
    else if (sortMode === 'name')      out.sort(function (a, b) { return a.name.localeCompare(b.name, 'ro'); });
    else if (sortMode === 'price')     out.sort(function (a, b) { return (priceOrder[a.price] || 9) - (priceOrder[b.price] || 9); });
    else if (sortMode === 'favorites') out.sort(function (a, b) { return (favorites.has(b.name) ? 1 : 0) - (favorites.has(a.name) ? 1 : 0); });
    else                               out.sort(function (a, b) { return (a._i || 0) - (b._i || 0); });

    return out;
  }

  window.SignalFilters = { getFiltered: getFiltered };
})();
