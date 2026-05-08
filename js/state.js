/**
 * SignalState — shared reactive state store for SIGNAL.
 * IIFE, exposes window.SignalState. Must load before app.js.
 */
(function () {
  'use strict';

  var _state = {
    activeCat:    'all',
    activePrice:  'all',
    activeRegion: 'all',
    searchQuery:  '',
    sortMode:     'default',
    hasInteracted: false,
    hasDeepLink:   false,
    isLoading:     true
  };

  var _subscribers = {};

  function get(key) {
    return _state[key];
  }

  function set(key, value, silent) {
    _state[key] = value;
    if (!silent) _notify(key);
  }

  function patch(obj, silent) {
    Object.keys(obj).forEach(function (k) { _state[k] = obj[k]; });
    if (!silent) _notify('*');
  }

  function subscribe(key, fn) {
    if (!_subscribers[key]) _subscribers[key] = [];
    _subscribers[key].push(fn);
    return function () {
      _subscribers[key] = _subscribers[key].filter(function (f) { return f !== fn; });
    };
  }

  function _notify(key) {
    var fns = (_subscribers[key] || []).concat(_subscribers['*'] || []);
    fns.forEach(function (fn) { try { fn(key, _state[key]); } catch (e) {} });
  }

  function save() {
    var fn = typeof safeStorageSet === 'function' ? safeStorageSet : null;
    if (!fn) return;
    fn('aiRadarState', JSON.stringify({
      activeCat:    _state.activeCat,
      activePrice:  _state.activePrice,
      activeRegion: _state.activeRegion,
      searchQuery:  _state.searchQuery,
      sortMode:     _state.sortMode
    }));
  }

  function load() {
    var fn = typeof safeStorageGet === 'function' ? safeStorageGet : null;
    if (!fn) return;
    try {
      var s = JSON.parse(fn('aiRadarState', '{}') || '{}');
      if (s.activeCat)    _state.activeCat    = s.activeCat;
      if (s.activePrice)  _state.activePrice  = s.activePrice;
      if (s.activeRegion) _state.activeRegion = s.activeRegion;
      if (s.searchQuery)  _state.searchQuery  = s.searchQuery;
      if (s.sortMode)     _state.sortMode     = s.sortMode;
    } catch (e) {}
  }

  function readUrl(validCats, validPrices, validRegions) {
    var p = new URLSearchParams(location.search);
    var cat = p.get('cat'), price = p.get('price'), region = p.get('region');
    var q   = p.get('q'),   sort  = p.get('sort');
    var sorts = ['default', 'trend', 'name', 'price', 'favorites', 'rating'];
    if (cat    && (!validCats    || validCats.has(cat)))     { _state.activeCat    = cat;    _state.hasDeepLink = true; }
    if (price  && (!validPrices  || validPrices.has(price))) { _state.activePrice  = price;  _state.hasDeepLink = true; }
    if (region && (!validRegions || validRegions.has(region))){ _state.activeRegion = region; _state.hasDeepLink = true; }
    if (q)                                                   { _state.searchQuery  = q;      _state.hasDeepLink = true; }
    if (sort && sorts.indexOf(sort) !== -1)                  { _state.sortMode     = sort;   _state.hasDeepLink = true; }
    if (_state.hasDeepLink) _state.hasInteracted = true;
  }

  function syncUrl() {
    var p = new URLSearchParams();
    if (_state.activeCat    !== 'all') p.set('cat',    _state.activeCat);
    if (_state.activePrice  !== 'all') p.set('price',  _state.activePrice);
    if (_state.activeRegion !== 'all') p.set('region', _state.activeRegion);
    if (_state.searchQuery && _state.searchQuery.trim()) p.set('q', _state.searchQuery.trim());
    if (_state.sortMode !== 'default') p.set('sort',   _state.sortMode);
    var qs = p.toString();
    /* preserve ?tool= if a decision modal is open */
    var tool = new URLSearchParams(location.search).get('tool');
    if (tool) p.set('tool', tool);
    qs = p.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
  }

  window.SignalState = {
    get:       get,
    set:       set,
    patch:     patch,
    subscribe: subscribe,
    save:      save,
    load:      load,
    readUrl:   readUrl,
    syncUrl:   syncUrl
  };
})();
