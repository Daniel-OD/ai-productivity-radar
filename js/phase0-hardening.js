// Phase 0 Production Hardening
// Lightweight runtime guards for AI Productivity Radar.

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
})();
