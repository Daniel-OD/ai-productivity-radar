/* workflow-genome.js — Workflow Genome™ analysis module */
(function () {
  'use strict';

  var WORKFLOW_PATTERNS = [
    {
      keywords: ['email', 'mail', 'inbox', 'newsletter', 'mesaje'],
      task: 'Gestionare email',
      cat: 'productivitate',
      tools: ['Claude', 'ChatGPT', 'Gemini'],
      saving: '2-3 ore/săptămână',
      icon: '📧'
    },
    {
      keywords: ['cod', 'programare', 'code', 'debug', 'script', 'python', 'javascript', 'develop'],
      task: 'Scriere cod',
      cat: 'programare',
      tools: ['Cursor', 'GitHub Copilot', 'Windsurf'],
      saving: '4-6 ore/săptămână',
      icon: '💻'
    },
    {
      keywords: ['raport', 'report', 'excel', 'spreadsheet', 'tabel', 'date', 'analize', 'analiz'],
      task: 'Rapoarte și analize',
      cat: 'date',
      tools: ['Julius AI', 'ChatGPT', 'Gemini'],
      saving: '3-5 ore/săptămână',
      icon: '📊'
    },
    {
      keywords: ['meeting', 'ședință', 'întâlnire', 'prezentare', 'convocare', 'call', 'video'],
      task: 'Ședințe și meeting-uri',
      cat: 'productivitate',
      tools: ['Granola', 'Otter.ai', 'Fireflies'],
      saving: '2-4 ore/săptămână',
      icon: '🎙️'
    },
    {
      keywords: ['scris', 'articol', 'blog', 'text', 'conținut', 'content', 'copywriting', 'writing'],
      task: 'Creare conținut',
      cat: 'scriere',
      tools: ['Claude', 'Jasper AI', 'Copy.ai'],
      saving: '3-5 ore/săptămână',
      icon: '✍️'
    },
    {
      keywords: ['cercetare', 'research', 'documentare', 'cauta', 'căuta', 'informații', 'studiu'],
      task: 'Cercetare și documentare',
      cat: 'cercetare',
      tools: ['Perplexity', 'Elicit', 'Consensus'],
      saving: '4-8 ore/săptămână',
      icon: '🔍'
    },
    {
      keywords: ['imagine', 'design', 'grafic', 'logo', 'vizual', 'poster', 'foto', 'grafică'],
      task: 'Design și imagini',
      cat: 'vizual',
      tools: ['Midjourney', 'DALL-E 3', 'Adobe Firefly'],
      saving: '3-6 ore/săptămână',
      icon: '🎨'
    },
    {
      keywords: ['video', 'film', 'montaj', 'editare video', 'reels', 'tiktok', 'youtube'],
      task: 'Producție video',
      cat: 'video',
      tools: ['Runway ML', 'Descript', 'Kling AI'],
      saving: '5-10 ore/săptămână',
      icon: '🎬'
    },
    {
      keywords: ['prezentare', 'slides', 'powerpoint', 'deck', 'pitch'],
      task: 'Prezentări și slide-uri',
      cat: 'productivitate',
      tools: ['Gamma', 'Beautiful.ai', 'ChatGPT'],
      saving: '2-4 ore/săptămână',
      icon: '📑'
    },
    {
      keywords: ['traducere', 'translate', 'traduce', 'limbă', 'language'],
      task: 'Traducere și localizare',
      cat: 'scriere',
      tools: ['DeepL', 'Claude', 'ChatGPT'],
      saving: '1-3 ore/săptămână',
      icon: '🌍'
    },
    {
      keywords: ['social media', 'instagram', 'facebook', 'twitter', 'linkedin', 'postare', 'post'],
      task: 'Social Media',
      cat: 'marketing',
      tools: ['Jasper AI', 'Copy.ai', 'Claude'],
      saving: '3-5 ore/săptămână',
      icon: '📱'
    },
    {
      keywords: ['noțe', 'note', 'notițe', 'organizare', 'task', 'todo', 'project', 'proiect'],
      task: 'Note și organizare',
      cat: 'productivitate',
      tools: ['Notion AI', 'Claude', 'ChatGPT'],
      saving: '1-2 ore/săptămână',
      icon: '📋'
    },
    {
      keywords: ['audio', 'podcast', 'voce', 'narare', 'text-to-speech', 'tts', 'vorbire'],
      task: 'Audio și voce',
      cat: 'audio',
      tools: ['ElevenLabs', 'Murf AI', 'Descript'],
      saving: '2-4 ore/săptămână',
      icon: '🎵'
    }
  ];

  function analyzeWorkflow(text) {
    var normalized = text.toLowerCase();
    var matched = [];
    for (var i = 0; i < WORKFLOW_PATTERNS.length; i++) {
      var p = WORKFLOW_PATTERNS[i];
      for (var j = 0; j < p.keywords.length; j++) {
        if (normalized.indexOf(p.keywords[j]) !== -1) {
          matched.push(p);
          break;
        }
      }
    }
    return matched;
  }

  function renderSVGMap(patterns, svgEl) {
    svgEl.innerHTML = '';
    var W = svgEl.offsetWidth || 400;
    var H = 200;
    svgEl.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    if (!patterns.length) return;

    var n = patterns.length;
    var spacing = W / (n + 1);

    for (var i = 0; i < n; i++) {
      var cx = spacing * (i + 1);
      var cy = 80 + Math.sin(i * 1.2) * 30;

      if (i > 0) {
        var prevCx = spacing * i;
        var prevCy = 80 + Math.sin((i - 1) * 1.2) * 30;
        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', prevCx); line.setAttribute('y1', prevCy);
        line.setAttribute('x2', cx); line.setAttribute('y2', cy);
        line.setAttribute('stroke', 'rgba(232,184,109,0.25)');
        line.setAttribute('stroke-width', '1');
        svgEl.appendChild(line);
      }

      var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', cx); circle.setAttribute('cy', cy);
      circle.setAttribute('r', '16');
      circle.setAttribute('fill', 'rgba(232,184,109,0.12)');
      circle.setAttribute('stroke', 'rgba(232,184,109,0.5)');
      circle.setAttribute('stroke-width', '1');
      svgEl.appendChild(circle);

      var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', cx); text.setAttribute('y', cy + 5);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '14');
      text.textContent = patterns[i].icon;
      svgEl.appendChild(text);

      var label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', cx); label.setAttribute('y', cy + 36);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '9');
      label.setAttribute('fill', 'rgba(168,154,133,0.8)');
      label.textContent = patterns[i].task.split(' ')[0];
      svgEl.appendChild(label);
    }
  }

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function renderRecs(patterns, el) {
    if (!patterns.length) {
      el.innerHTML = '<p style="color:var(--text-dim);font-family:var(--mono);font-size:13px">Nu am detectat tipare cunoscute. Încearcă să descrii mai detaliat activitățile zilnice.</p>';
      return;
    }
    var html = '';
    for (var i = 0; i < patterns.length; i++) {
      var p = patterns[i];
      html += '<div class="wg-rec-card" data-cat="' + escHtml(p.cat) + '" role="button" tabindex="0" title="Filtrează ' + escHtml(p.cat) + '">';
      html += '<div class="wg-rec-task">' + escHtml(p.icon) + ' ' + escHtml(p.task) + '</div>';
      html += '<div class="wg-saving">⚡ Economisești ' + escHtml(p.saving) + '</div>';
      html += '<div style="display:flex;gap:8px;flex-wrap:wrap">';
      for (var j = 0; j < p.tools.length; j++) {
        html += '<span style="font-family:var(--mono);font-size:11px;background:var(--surface-2);border:1px solid var(--border);border-radius:4px;padding:3px 8px;color:var(--text-muted)">' + escHtml(p.tools[j]) + '</span>';
      }
      html += '</div></div>';
    }
    el.innerHTML = html;

    el.querySelectorAll('.wg-rec-card').forEach(function (card) {
      function activate() {
        var cat = card.getAttribute('data-cat');
        if (cat && window.filterByCategory) window.filterByCategory(cat);
        else {
          var toolsSection = document.getElementById('tools');
          if (toolsSection) toolsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      card.addEventListener('click', activate);
      card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') activate(); });
    });
  }

  function safeSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) {}
  }
  function safeGet(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; }
  }

  function initWorkflowGenome() {
    var btn = document.getElementById('wgAnalyze');
    var textarea = document.getElementById('wgInput');
    var results = document.getElementById('wgResults');
    var svgEl = document.getElementById('wgMap');
    var recsEl = document.getElementById('wgRecs');
    var totalEl = document.getElementById('wgTotal');

    if (!btn || !textarea) return;

    var saved = safeGet('signalWorkflow');
    if (saved && saved.text) {
      textarea.value = saved.text;
    }

    function run() {
      var text = textarea.value.trim();
      if (!text) return;
      var patterns = analyzeWorkflow(text);
      safeSet('signalWorkflow', { text: text, patternsCount: patterns.length });

      results.style.display = '';
      renderSVGMap(patterns, svgEl);
      renderRecs(patterns, recsEl);

      if (patterns.length) {
        var totalHours = 0;
        for (var i = 0; i < patterns.length; i++) {
          var match = patterns[i].saving.match(/(\d+)/);
          if (match) totalHours += parseInt(match[1]);
        }
        totalEl.innerHTML = '⚡ Potențial total: <strong>' + totalHours + '+</strong> ore/săptămână recuperabile cu AI';
        totalEl.style.display = '';
      } else {
        totalEl.style.display = 'none';
      }

      results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    btn.addEventListener('click', run);
    textarea.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run();
    });
  }

  window.initWorkflowGenome = initWorkflowGenome;
})();
