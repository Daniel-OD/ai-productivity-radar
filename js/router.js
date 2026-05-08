/**
 * SignalRouter — client-side routing for /tool deep-links.
 * IIFE, exposes window.SignalRouter. Must load before the inline app script.
 *
 * Uses query-param routing (?tool=name) — no server config needed for
 * static hosting.
 */
(function () {
  'use strict';

  var _openFn  = null; // set by registerOpen()
  var _closeFn = null; // set by registerClose()

  /** Register the functions that physically open/close the tool modal. */
  function registerOpen(fn)  { _openFn  = fn; }
  function registerClose(fn) { _closeFn = fn; }

  /**
   * Push a tool URL onto the history stack and open the modal.
   * Calling openToolDetails directly still works; call this to also get
   * a history entry so the back button closes the modal.
   */
  function push(toolName) {
    try {
      var u = new URL(location.href);
      u.searchParams.set('tool', toolName);
      history.pushState({ tool: toolName }, '', u.toString());
    } catch (e) {}
    if (typeof _openFn === 'function') _openFn(toolName);
  }

  /**
   * Remove ?tool= from URL without adding a history entry, then close modal.
   */
  function pop() {
    try {
      var u = new URL(location.href);
      if (u.searchParams.has('tool')) {
        u.searchParams.delete('tool');
        var newUrl = u.pathname + (u.search && u.search !== '?' ? u.search : '') + u.hash;
        history.replaceState(null, '', newUrl || u.pathname);
      }
    } catch (e) {}
    if (typeof _closeFn === 'function') _closeFn();
  }

  /** Open the modal for whatever ?tool= is in the current URL (called after tools load). */
  function handleDeepLink() {
    var toolName = new URLSearchParams(location.search).get('tool');
    if (!toolName) return;
    setTimeout(function () {
      if (typeof _openFn === 'function') _openFn(toolName);
    }, 400);
  }

  /** popstate handler: sync modal to browser history state. */
  window.addEventListener('popstate', function (e) {
    var toolName = (e.state && e.state.tool) || new URLSearchParams(location.search).get('tool');
    if (toolName) {
      if (typeof _openFn === 'function') _openFn(toolName);
    } else {
      if (typeof _closeFn === 'function') _closeFn();
    }
  });

  window.SignalRouter = {
    registerOpen:    registerOpen,
    registerClose:   registerClose,
    push:            push,
    pop:             pop,
    handleDeepLink:  handleDeepLink
  };
})();
