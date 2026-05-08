/* signal-feed.js — SIGNAL Feed module */
(function () {
  'use strict';

  var TYPE_LABELS = {
    'update':      '📦 Update',
    'launch':      '🚀 Launch',
    'milestone':   '🏆 Milestone',
    'deprecation': '⚠️ Deprecation',
    'research':    '🔬 Research',
    'news':        '📰 News'
  };

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function formatDate(dateStr) {
    try {
      var d = new Date(dateStr);
      return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (_) { return dateStr; }
  }

  function renderFeed(items, container) {
    if (!items || !items.length) {
      container.innerHTML = '<p style="padding:20px;color:var(--text-dim);font-family:var(--mono);font-size:13px">Feed indisponibil momentan.</p>';
      return;
    }

    var html = '';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var dotClass = 'feed-dot feed-dot-' + (item.impact || 'low');
      var impactClass = 'feed-impact feed-impact-' + (item.impact || 'low');
      var typeLabel = TYPE_LABELS[item.type] || item.type;

      html += '<article class="feed-item" data-id="' + escHtml(item.id) + '" role="button" tabindex="0" aria-expanded="false">';
      html += '<div class="' + dotClass + '"></div>';
      html += '<div>';
      html += '<div class="feed-type">' + escHtml(typeLabel) + ' · ' + escHtml(item.tool) + '</div>';
      html += '<div class="feed-tool">' + escHtml(item.title) + '</div>';
      html += '<div class="feed-body" id="fb-' + escHtml(item.id) + '">' + escHtml(item.body);
      if (item.url) {
        html += ' <a href="' + escHtml(item.url) + '" target="_blank" rel="noopener noreferrer" style="color:var(--gold);text-decoration:none" onclick="event.stopPropagation()">→ Citește mai mult</a>';
      }
      html += '</div>';
      html += '</div>';
      html += '<div class="feed-meta">';
      html += '<div class="feed-date">' + escHtml(formatDate(item.date)) + '</div>';
      html += '<div class="' + impactClass + '">' + escHtml(item.impact || 'low') + '</div>';
      html += '</div>';
      html += '</article>';
    }
    container.innerHTML = html;

    container.querySelectorAll('.feed-item').forEach(function (el) {
      function toggle() {
        var id = el.getAttribute('data-id');
        var body = document.getElementById('fb-' + id);
        if (!body) return;
        var expanded = body.classList.toggle('expanded');
        el.setAttribute('aria-expanded', String(expanded));
      }
      el.addEventListener('click', toggle);
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });
  }

  function initSignalFeed() {
    var container = document.getElementById('feedList');
    if (!container) return;

    fetch('data/signal-feed.json', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        renderFeed(Array.isArray(data) ? data : [], container);
      })
      .catch(function () {
        container.innerHTML = '<p style="padding:20px;color:var(--text-dim);font-family:var(--mono);font-size:13px">Nu s-a putut încărca feed-ul. Reîncearcă mai târziu.</p>';
      });
  }

  window.initSignalFeed = initSignalFeed;
})();
