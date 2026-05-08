/* stack-score.js — Stack Score Calculator module */
(function () {
  'use strict';

  var QUESTIONS = [
    {
      id: 'q1',
      label: 'Câte tooluri AI folosești zilnic?',
      options: [
        { text: 'Niciunul', score: 0 },
        { text: '1-2', score: 150 },
        { text: '3-5', score: 280 },
        { text: '6+', score: 400 }
      ]
    },
    {
      id: 'q2',
      label: 'Ai un tool AI dedicat pentru cod?',
      options: [
        { text: 'Nu', score: 0 },
        { text: 'Uneori ChatGPT', score: 80 },
        { text: 'Cursor / Windsurf', score: 180 },
        { text: 'Cursor + Copilot', score: 200 }
      ]
    },
    {
      id: 'q3',
      label: 'Cum gestionezi cercetarea și documentarea?',
      options: [
        { text: 'Google clasic', score: 0 },
        { text: 'ChatGPT/Claude ocazional', score: 80 },
        { text: 'Perplexity + Claude regulat', score: 150 },
        { text: 'Stack complet: Perplexity + NotebookLM + Elicit', score: 200 }
      ]
    },
    {
      id: 'q4',
      label: 'Ce procent din taskuri folosesc AI?',
      options: [
        { text: 'Sub 10%', score: 0 },
        { text: '10-30%', score: 60 },
        { text: '30-60%', score: 120 },
        { text: 'Peste 60%', score: 200 }
      ]
    },
    {
      id: 'q5',
      label: 'Cât investești în tooluri AI/lună?',
      options: [
        { text: 'Nimic (doar free)', score: 0 },
        { text: '$1-20', score: 0 },
        { text: '$21-80', score: 50 },
        { text: 'Peste $80', score: 0 }
      ]
    }
  ];

  var LEVELS = [
    { min: 0,   max: 199,  name: 'Scout',      desc: 'Abia ai început. Potențial mare de îmbunătățire.' },
    { min: 200, max: 399,  name: 'Analyst',    desc: 'Folosești AI ocazional. Câteva tooluri cheie te-ar ajuta mult.' },
    { min: 400, max: 599,  name: 'Strategist', desc: 'Stack solid. Optimizare și integrare mai profundă te-ar duce mai departe.' },
    { min: 600, max: 799,  name: 'Architect',  desc: 'Stack avansat. Ești în top 15% utilizatori AI.' },
    { min: 800, max: 1000, name: 'SIGNAL',     desc: 'Stack de elită. Ești în top 5% — un multiplicator de forță.' }
  ];

  var RECS_BY_LEVEL = {
    'Scout': [
      { icon: '🔍', title: 'Începe cu Perplexity', desc: 'Înlocuiește Google pentru cercetare. Gratuit, rapid, cu surse.' },
      { icon: '💬', title: 'Claude pentru scriere', desc: 'Emailuri, rapoarte, rezumate — economisești ore pe săptămână.' },
      { icon: '📅', title: 'Reclaim AI pentru calendar', desc: 'Optimizare automată a timpului. Gratuit până la un punct.' }
    ],
    'Analyst': [
      { icon: '💻', title: 'Încearcă Cursor', desc: '14 zile trial. Dacă scrii orice cod, e game-changer.' },
      { icon: '🎙️', title: 'Granola pentru meeting-uri', desc: 'Notițe automate din call-uri. Economisești 30 min/ședință.' },
      { icon: '📊', title: 'Julius AI pentru date', desc: 'Analizează Excel/CSV cu limbaj natural.' }
    ],
    'Strategist': [
      { icon: '🔗', title: 'Integrări prin API', desc: 'Conectează toolurile între ele. Automatizare cu Zapier + AI.' },
      { icon: '🧪', title: 'Testează DeepSeek R2', desc: 'Raționament avansat pentru probleme complexe.' },
      { icon: '📚', title: 'NotebookLM pentru context lung', desc: 'Perfect pentru documente mari și cercetare profundă.' }
    ],
    'Architect': [
      { icon: '🤖', title: 'Build cu Claude API', desc: 'Automatizează workflow-uri custom cu API-ul Claude.' },
      { icon: '🎬', title: 'Runway ML pentru video', desc: 'Adaugă producție video AI în workflow.' },
      { icon: '⚡', title: 'Fine-tuning modele', desc: 'Personalizează modele pentru nevoile specifice ale echipei.' }
    ],
    'SIGNAL': [
      { icon: '🌐', title: 'Multi-agent orchestration', desc: 'Sisteme multi-agent pentru workflow-uri complexe.' },
      { icon: '📡', title: 'Monitorizare ecosistem', desc: 'Ești deja la vârf — menține avantajul cu SIGNAL Feed.' },
      { icon: '🧬', title: 'Contribuie la comunitate', desc: 'Partajează stack-ul tău și ajută pe alții să evolueze.' }
    ]
  };

  var answers = {};

  function animateCounter(el, target, duration) {
    var start = 0;
    var startTime = null;
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(ease * target);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function safeSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) {}
  }
  function safeGet(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; }
  }

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function getLevel(score) {
    for (var i = LEVELS.length - 1; i >= 0; i--) {
      if (score >= LEVELS[i].min) return LEVELS[i];
    }
    return LEVELS[0];
  }

  function renderResult(container, score) {
    var level = getLevel(score);
    var recs = RECS_BY_LEVEL[level.name] || RECS_BY_LEVEL['Scout'];

    var recsHtml = '';
    for (var i = 0; i < recs.length; i++) {
      recsHtml += '<div class="ss-rec-card">';
      recsHtml += '<div class="ss-rec-icon">' + escHtml(recs[i].icon) + '</div>';
      recsHtml += '<strong style="font-family:var(--serif);font-size:15px">' + escHtml(recs[i].title) + '</strong>';
      recsHtml += '<p>' + escHtml(recs[i].desc) + '</p>';
      recsHtml += '</div>';
    }

    container.innerHTML =
      '<div class="ss-result">' +
        '<div class="ss-score-display" id="ssScoreNum">0</div>' +
        '<div class="ss-score-label">Stack Score · Nivel: <strong style="color:var(--gold)">' + escHtml(level.name) + '</strong></div>' +
        '<p style="max-width:480px;margin:12px auto;color:var(--text-muted);font-size:14px">' + escHtml(level.desc) + '</p>' +
        '<div class="ss-recs">' + recsHtml + '</div>' +
        '<div class="ss-actions">' +
          '<button class="primary" id="ssShare">Partajează scorul</button>' +
          '<button class="mini-btn" id="ssRetake">Recalculează</button>' +
        '</div>' +
      '</div>';

    requestAnimationFrame(function () {
      var numEl = document.getElementById('ssScoreNum');
      if (numEl) animateCounter(numEl, score, 1200);
    });

    var badge = document.getElementById('ssNavBadge');
    if (badge) { badge.textContent = score; badge.style.display = 'block'; }

    document.getElementById('ssShare').addEventListener('click', function () {
      var text = 'Stack Score-ul meu AI este ' + score + '/1000 (' + level.name + ') pe SIGNAL — platforma de inteligență AI. Calculează-l și tu!';
      if (navigator.share) {
        navigator.share({ title: 'SIGNAL Stack Score', text: text, url: location.href });
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function () {
          if (window.toast) window.toast('Scor copiat!');
        });
      }
    });

    document.getElementById('ssRetake').addEventListener('click', function () {
      safeSet('signalStackScore', null);
      safeSet('signalStackData', null);
      answers = {};
      if (badge) badge.style.display = 'none';
      renderForm(container);
    });
  }

  function renderForm(container) {
    var html = '<div class="ss-questions">';
    for (var i = 0; i < QUESTIONS.length; i++) {
      var q = QUESTIONS[i];
      html += '<div class="ss-question" data-qid="' + escHtml(q.id) + '">';
      html += '<div class="ss-q-label">' + (i + 1) + '. ' + escHtml(q.label) + '</div>';
      html += '<div class="ss-options">';
      for (var j = 0; j < q.options.length; j++) {
        html += '<button class="ss-opt" data-score="' + q.options[j].score + '" data-qid="' + escHtml(q.id) + '">' + escHtml(q.options[j].text) + '</button>';
      }
      html += '</div></div>';
    }
    html += '</div>';
    html += '<div class="ss-submit-wrap" style="display:none"><button class="primary" id="ssSubmit">Calculează Stack Score →</button></div>';
    container.innerHTML = html;

    container.querySelectorAll('.ss-opt').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var qid = btn.getAttribute('data-qid');
        var score = parseInt(btn.getAttribute('data-score'));
        answers[qid] = score;
        container.querySelectorAll('.ss-opt[data-qid="' + qid + '"]').forEach(function (b) {
          b.classList.remove('selected');
        });
        btn.classList.add('selected');
        if (Object.keys(answers).length === QUESTIONS.length) {
          var sw = container.querySelector('.ss-submit-wrap');
          if (sw) sw.style.display = '';
        }
      });
    });

    container.querySelector('#ssSubmit').addEventListener('click', function () {
      var total = 0;
      for (var k in answers) total += answers[k];
      total = Math.min(1000, total);
      safeSet('signalStackScore', total);
      safeSet('signalStackData', answers);
      renderResult(container, total);
    });
  }

  function initStackScore() {
    var container = document.getElementById('stackScoreUI');
    if (!container) return;
    var saved = safeGet('signalStackScore');
    if (saved !== null && typeof saved === 'number') {
      answers = safeGet('signalStackData') || {};
      renderResult(container, saved);
    } else {
      renderForm(container);
    }
  }

  window.initStackScore = initStackScore;
})();
