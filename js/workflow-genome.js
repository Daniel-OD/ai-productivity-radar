/* workflow-genome.js — Workflow Genome™ analysis module */
(function () {
  'use strict';

  var WORKFLOW_PATTERNS = [
    { keywords: ['email', 'mail', 'inbox', 'newsletter', 'mesaje'], task: 'Gestionare email', cat: 'productivitate', filterCat: 'productivitate', tools: ['Claude', 'ChatGPT', 'Gemini'], saving: '2-3 ore/săptămână', icon: '📧' },
    { keywords: ['cod', 'programare', 'code', 'debug', 'script', 'python', 'javascript', 'develop'], task: 'Scriere cod', cat: 'programare', filterCat: 'programare', tools: ['Cursor', 'GitHub Copilot', 'Windsurf'], saving: '4-6 ore/săptămână', icon: '💻' },
    { keywords: ['raport', 'report', 'excel', 'spreadsheet', 'tabel', 'date', 'analize', 'analiz'], task: 'Rapoarte și analize', cat: 'date', filterCat: 'date', tools: ['Julius AI', 'ChatGPT', 'Gemini'], saving: '3-5 ore/săptămână', icon: '📊' },
    { keywords: ['meeting', 'ședință', 'întâlnire', 'prezentare', 'convocare', 'call', 'video'], task: 'Ședințe și meeting-uri', cat: 'productivitate', filterCat: 'productivitate', tools: ['Granola', 'Otter.ai', 'Fireflies'], saving: '2-4 ore/săptămână', icon: '🎙️' },
    { keywords: ['scris', 'articol', 'blog', 'text', 'conținut', 'content', 'copywriting', 'writing'], task: 'Creare conținut', cat: 'scriere', filterCat: 'scris', tools: ['Claude', 'Jasper AI', 'Copy.ai'], saving: '3-5 ore/săptămână', icon: '✍️' },
    { keywords: ['cercetare', 'research', 'documentare', 'cauta', 'căuta', 'informații', 'studiu'], task: 'Cercetare și documentare', cat: 'cercetare', filterCat: 'cercetare', tools: ['Perplexity', 'Elicit', 'Consensus'], saving: '4-8 ore/săptămână', icon: '🔍' },
    { keywords: ['imagine', 'design', 'grafic', 'logo', 'vizual', 'poster', 'foto', 'grafică'], task: 'Design și imagini', cat: 'vizual', filterCat: 'design', tools: ['Midjourney', 'DALL-E 3', 'Adobe Firefly'], saving: '3-6 ore/săptămână', icon: '🎨' },
    { keywords: ['video', 'film', 'montaj', 'editare video', 'reels', 'tiktok', 'youtube'], task: 'Producție video', cat: 'video', filterCat: 'design', tools: ['Runway ML', 'Descript', 'Kling AI'], saving: '5-10 ore/săptămână', icon: '🎬' },
    { keywords: ['prezentare', 'slides', 'powerpoint', 'deck', 'pitch'], task: 'Prezentări și slide-uri', cat: 'productivitate', filterCat: 'productivitate', tools: ['Gamma', 'Beautiful.ai', 'ChatGPT'], saving: '2-4 ore/săptămână', icon: '📑' },
    { keywords: ['traducere', 'translate', 'traduce', 'limbă', 'language'], task: 'Traducere și localizare', cat: 'scriere', filterCat: 'scris', tools: ['DeepL', 'Claude', 'ChatGPT'], saving: '1-3 ore/săptămână', icon: '🌍' },
    { keywords: ['social media', 'instagram', 'facebook', 'twitter', 'linkedin', 'postare', 'post'], task: 'Social Media', cat: 'marketing', filterCat: 'scris', tools: ['Jasper AI', 'Copy.ai', 'Claude'], saving: '3-5 ore/săptămână', icon: '📱' },
    { keywords: ['noțe', 'note', 'notițe', 'organizare', 'task', 'todo', 'project', 'proiect'], task: 'Note și organizare', cat: 'productivitate', filterCat: 'productivitate', tools: ['Notion AI', 'Claude', 'ChatGPT'], saving: '1-2 ore/săptămână', icon: '📋' },
    { keywords: ['audio', 'podcast', 'voce', 'narare', 'text-to-speech', 'tts', 'vorbire'], task: 'Audio și voce', cat: 'audio', filterCat: 'productivitate', tools: ['ElevenLabs', 'Murf AI', 'Descript'], saving: '2-4 ore/săptămână', icon: '🎵' }
  ];

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) {}
  }

  function safeGet(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; }
  }

  function analyzeWorkflow(text) {
    var normalized = String(text == null ? '' : text).toLowerCase();
    var matched = [];
    for (var i = 0; i < WORKFLOW_PATTERNS.length; i++) {
      var pattern = WORKFLOW_PATTERNS[i];
      for (var j = 0; j < pattern.keywords.length; j++) {
        if (normalized.indexOf(pattern.keywords[j]) !== -1) {
          matched.push(pattern);
          break;
        }
      }
    }
    return matched;
  }

  function renderResults(patterns, resultsEl) {
    if (!patterns.length) {
      resultsEl.innerHTML = '<div class="wg-node"><div class="wg-node-body"><div class="wg-node-task">Nu am detectat încă un tipar clar</div><p class="helper">Încearcă să menționezi taskuri concrete, precum email, Excel, PowerPoint, research sau meeting-uri.</p></div></div>';
      return;
    }

    resultsEl.innerHTML = patterns.map(function (pattern) {
      var pills = pattern.tools.map(function (tool) {
        return '<button class="wg-tool-pill" type="button" data-tool="' + escHtml(tool) + '" data-cat="' + escHtml(pattern.filterCat || pattern.cat) + '">' + escHtml(tool) + '</button>';
      }).join('');

      return '<div class="wg-node" data-cat="' + escHtml(pattern.filterCat || pattern.cat) + '">' +
        '<div class="wg-node-icon" aria-hidden="true">' + escHtml(pattern.icon) + '</div>' +
        '<div class="wg-node-body">' +
          '<div class="wg-node-task">' + escHtml(pattern.task) + '</div>' +
          '<div class="wg-node-saving">⚡ Economisești ' + escHtml(pattern.saving) + '</div>' +
          '<div class="wg-node-tools">' + pills + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    resultsEl.querySelectorAll('.wg-tool-pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        var toolName = pill.getAttribute('data-tool');
        var cat = pill.getAttribute('data-cat');
        if (toolName && typeof window.openDecision === 'function') {
          window.openDecision(toolName);
          return;
        }
        if (cat && typeof window.filterByCategory === 'function') {
          window.filterByCategory(cat);
        }
      });
    });
  }

  function renderTotal(patterns, totalEl) {
    if (!patterns.length) {
      totalEl.style.display = 'none';
      totalEl.innerHTML = '';
      return;
    }

    var totalHours = 0;
    for (var i = 0; i < patterns.length; i++) {
      var match = patterns[i].saving.match(/(\d+)(?:\s*-\s*(\d+))?/);
      if (match) {
        var low = parseInt(match[1], 10);
        var high = match[2] ? parseInt(match[2], 10) : low;
        totalHours += Math.round((low + high) / 2);
      }
    }

    totalEl.innerHTML = '<div class="wg-total-inner">⚡ Potențial total: <strong>' + totalHours + '+</strong> ore/săptămână recuperabile cu AI</div>';
    totalEl.style.display = '';
  }

  function initWorkflowGenome() {
    if (window.__signalWorkflowGenomeInitialized) return;
    window.__signalWorkflowGenomeInitialized = true;

    var btn = document.getElementById('wgAnalyze');
    var textarea = document.getElementById('wgInput');
    var resultsEl = document.getElementById('wgResults');
    var nodesEl = document.getElementById('wgNodes');
    var totalEl = document.getElementById('wgTotal');

    if (!btn || !textarea || !resultsEl || !nodesEl || !totalEl) return;

    var saved = safeGet('signalWorkflow');
    if (saved && saved.text) textarea.value = saved.text;

    function run() {
      var text = textarea.value.trim();
      if (!text) return;

      var patterns = analyzeWorkflow(text);
      safeSet('signalWorkflow', { text: text, patterns: patterns });

      resultsEl.style.display = '';
      renderResults(patterns, nodesEl);
      renderTotal(patterns, totalEl);
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    btn.addEventListener('click', run);
    textarea.addEventListener('keydown', function (event) {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') run();
    });

    if (saved && saved.text) run();
  }

  window.initWorkflowGenome = initWorkflowGenome;
})();
