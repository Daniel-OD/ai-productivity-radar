/**
 * Command Palette – semantic task search for SIGNAL.
 *
 * Phases covered: 2 (command palette hardening)
 *
 * Runtime dependencies (resolved lazily from global scope, set by app.js):
 *   tools, normKey, TASK_INTENTS, flag, priceLabels, openDecision,
 *   escapeHtml, escapeAttr, debounce
 */
(function () {
  'use strict';

  /* ── Internal state ───────────────────────────────────────────────────────── */
  var cpOpen = false;
  var cpIndex = 0;
  var cpMatches = [];
  var cpPrevFocus = null;
  var cpRenderTimer = null;

  /* Expose cpOpen as window.commandOpen for backward-compat. */
  function setOpen(val) { cpOpen = val; window.commandOpen = val; }
  window.commandOpen = false;

  /* ── Search / ranking ─────────────────────────────────────────────────────── */

  function commandHay(t) {
    return [
      t.name, t.tagline, t.when,
      t.country, t.region, t.price,
      t.apiInfo || '', t.standaloneNote || '', t.audience || ''
    ].concat(t.cats || [], t.badges || []).join(' ').toLowerCase();
  }

  function intentMatches(q) {
    var nq = normKey(q);
    return TASK_INTENTS.map(function (intent) {
      var hits = intent.words.filter(function (w) { return nq.includes(normKey(w)); });
      return hits.length ? { intent: intent, hits: hits } : null;
    }).filter(Boolean);
  }

  /** Simple fuzzy-match score: fraction of needle chars found in order in haystack. */
  function fuzzyScore(needle, haystack) {
    if (!needle || !haystack) return 0;
    var score = 0, hi = 0;
    for (var ni = 0; ni < needle.length && hi < haystack.length; ni++) {
      while (hi < haystack.length && haystack[hi] !== needle[ni]) hi++;
      if (hi < haystack.length) { score++; hi++; }
    }
    return score / needle.length;
  }

  function rankForTask(t, q) {
    var nq = normKey(q);
    var hay = normKey(commandHay(t));
    var words = nq.split(/\s+/).filter(Boolean);
    var score = 0;
    var reasons = [];

    if (!nq) { score += t.trend / 2; }

    words.forEach(function (w) {
      if (w.length > 1 && hay.includes(w)) score += 7;
    });

    var toolNameNorm = normKey(t.name);
    if (nq && toolNameNorm.includes(nq)) score += 60;
    if (nq && toolNameNorm === nq) score += 30;

    /* Fuzzy name bonus for queries ≥ 3 chars */
    if (nq && nq.length >= 3) {
      var fs = fuzzyScore(nq, toolNameNorm);
      if (fs > 0.7) score += Math.round(fs * 20);
    }

    intentMatches(q).forEach(function (m) {
      var it = m.intent;
      if (it.cats) {
        var overlap = it.cats.filter(function (c) { return t.cats.includes(c); }).length;
        if (overlap) { score += 34 * overlap; reasons.push(it.label); }
      }
      if (it.price && it.price.includes(t.price)) { score += 16; reasons.push(it.label); }
      if (it.region && t.region === it.region)    { score += 18; reasons.push(it.label); }
    });

    if (t.trend >= 85) score += 8;
    if (t.price === 'gratuit' || t.price === 'freemium') score += 3;

    var deduped = [];
    reasons.forEach(function (r) { if (!deduped.includes(r)) deduped.push(r); });
    var reason = deduped.slice(0, 2).join(' · ')
      || (nq ? 'Potrivire după nume, descriere sau categorie' : 'Popular acum');

    return { tool: t, score: score, reason: reason };
  }

  /* ── Rendering ────────────────────────────────────────────────────────────── */

  function updateActive() {
    document.querySelectorAll('.command-item').forEach(function (el, j) {
      el.classList.toggle('active', j === cpIndex);
      el.setAttribute('aria-selected', String(j === cpIndex));
    });
  }

  function renderCommandResults() {
    var inputEl  = document.getElementById('commandInput');
    var resultsEl = document.getElementById('commandResults');
    var countEl   = document.getElementById('commandCount');
    if (!inputEl || !resultsEl) return;

    var q = inputEl.value.trim();

    if (!q) {
      cpMatches = Array.prototype.slice.call(tools)
        .sort(function (a, b) { return b.trend - a.trend; })
        .slice(0, 8)
        .map(function (t) { return { tool: t, score: t.trend, reason: 'Popular acum' }; });
    } else {
      cpMatches = tools
        .map(function (t) { return rankForTask(t, q); })
        .filter(function (r) { return r.score > 0; })
        .sort(function (a, b) { return b.score - a.score || b.tool.trend - a.tool.trend; })
        .slice(0, 8);
    }

    if (cpIndex >= cpMatches.length) cpIndex = 0;
    if (countEl) countEl.textContent = cpMatches.length + ' recomandări';

    if (!cpMatches.length) {
      resultsEl.innerHTML = '<div class="loading-state">Nu am găsit o potrivire bună. Încearcă: „analizez excel", „fac video", „scriu cod".</div>';
      return;
    }

    resultsEl.innerHTML = cpMatches.map(function (r, i) {
      var t = r.tool;
      return '<div class="command-item' + (i === cpIndex ? ' active' : '') +
        '" data-command-index="' + i +
        '" role="option" aria-selected="' + (i === cpIndex) + '">' +
        '<div>' +
        '<div class="command-name">' + escapeHtml((flag[t.country] || '🌍') + ' ' + t.name) + '</div>' +
        '<div class="command-meta">' + escapeHtml(t.country + ' · ' + priceLabels[t.price] + ' · ' + t.cats.join(', ')) + '</div>' +
        '<div class="command-tagline">' + escapeHtml(t.tagline) + '</div>' +
        '<div class="command-reason">Potrivire: ' + escapeHtml(r.reason) + '</div>' +
        '</div>' +
        '<div class="command-score">↗ ' + escapeHtml(String(t.trend)) + '</div>' +
        '</div>';
    }).join('');

    document.querySelectorAll('[data-command-index]').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        cpIndex = +el.dataset.commandIndex;
        updateActive();
      });
      el.addEventListener('mousedown', function (e) {
        e.preventDefault();
        cpIndex = +el.dataset.commandIndex;
        selectCommand(false);
      });
    });
  }

  /* Debounce delay for command palette input (ms) */
  var DEBOUNCE_DELAY = 120;

  function debouncedRender() {
    clearTimeout(cpRenderTimer);
    cpRenderTimer = setTimeout(renderCommandResults, DEBOUNCE_DELAY);
  }

  /* ── Selection ────────────────────────────────────────────────────────────── */

  function selectCommand(openLink) {
    var r = cpMatches[cpIndex];
    var t = r && r.tool;
    if (!t) return;
    closeCommandPalette();
    if (openLink) { window.open(t.url, '_blank', 'noopener,noreferrer'); return; }
    if (typeof openDecision === 'function') openDecision(t.name);
  }

  /* ── Public API ───────────────────────────────────────────────────────────── */

  window.openCommandPalette = function (seed) {
    setOpen(true);
    cpIndex = 0;
    cpPrevFocus = document.activeElement;
    var modal = document.getElementById('commandModal');
    var input = document.getElementById('commandInput');
    if (!modal || !input) return;
    modal.classList.add('show');
    input.value = seed != null ? String(seed) : '';
    renderCommandResults();
    setTimeout(function () { input.focus(); }, 20);
  };

  window.closeCommandPalette = function () {
    setOpen(false);
    var modal = document.getElementById('commandModal');
    if (modal) modal.classList.remove('show');
    if (cpPrevFocus) { try { cpPrevFocus.focus(); } catch (e) {} }
    cpPrevFocus = null;
  };

  /* ── Init (called from app.js after tools are loaded) ────────────────────── */

  window.initCommandPalette = function () {
    var input = document.getElementById('commandInput');
    var modal = document.getElementById('commandModal');
    var btn   = document.getElementById('commandBtn');

    if (input) {
      input.addEventListener('input', function () {
        cpIndex = 0;
        debouncedRender();
      });
    }

    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeCommandPalette();
      });
    }

    if (btn) {
      btn.addEventListener('click', function () { openCommandPalette(); });
    }

    /* Keyboard navigation – only active when palette is open */
    document.addEventListener('keydown', function (e) {
      if (!cpOpen) return;
      var len = Math.max(cpMatches.length, 1);
      if (e.key === 'Escape') { e.preventDefault(); closeCommandPalette(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); cpIndex = (cpIndex + 1) % len; updateActive(); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); cpIndex = (cpIndex - 1 + len) % len; updateActive(); return; }
      if (e.key === 'Enter')     { e.preventDefault(); selectCommand(e.metaKey || e.ctrlKey); }
    });
  };

})();
