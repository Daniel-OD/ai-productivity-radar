const SS_QUESTIONS = [
  { q: 'Câte tooluri AI plătite folosești?', opts: ['Niciunul','1–2','3–5','Peste 5'], scores: [0,150,200,100] },
  { q: 'Ce % din workflow-ul tău e augmentat cu AI?', opts: ['0%','Sub 25%','25–50%','Peste 50%'], scores: [0,100,200,300] },
  { q: 'Ai tooluri care fac același lucru?', opts: ['Da, câteva','Probabil','Nu știu','Nu, deloc'], scores: [0,50,75,150] },
  { q: 'Cât plătești lunar pe tooluri AI?', opts: ['0€','Sub 30€','30–100€','Peste 100€'], scores: [0,75,150,100] },
  { q: 'Descoperi funcții noi ale toolurilor tale?', opts: ['Rar','Lunar','Săptămânal','Zilnic'], scores: [0,50,75,100] }
];

const SS_LABELS = [
  { min:0, max:200, label:'Scout', desc:'Abia începi. Potențial imens de câștig.' },
  { min:200, max:450, label:'Analyst', desc:'Stack de bază. Câteva gap-uri de acoperit.' },
  { min:450, max:650, label:'Strategist', desc:'Stack solid. Optimizări fine disponibile.' },
  { min:650, max:850, label:'Architect', desc:'Stack avansat. Ești în top 20%.' },
  { min:850, max:1001, label:'Signal', desc:'Stack de elită. Top 5% din utilizatori.' }
];

function ssEscape(value) {
  if (typeof escapeHtml === 'function') return escapeHtml(value);
  return String(value == null ? '' : value)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');
}

function initStackScore() {
  const widget = document.getElementById('ssWidget');
  if (!widget) return;

  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem('signalStackScore'));
  } catch (e) {
    console.warn('[SIGNAL] stack score storage unavailable');
  }

  if (saved && saved.score !== undefined) {
    renderSSResult(saved.score, saved.answers || []);
    return;
  }

  renderSSForm();
}

function renderSSForm() {
  const widget = document.getElementById('ssWidget');
  let answers = new Array(SS_QUESTIONS.length).fill(null);

  function buildForm() {
    widget.innerHTML = SS_QUESTIONS.map((question, qi) =>
      '<div class="ss-question">' +
        '<div class="ss-q-label">' + (qi + 1) + '. ' + ssEscape(question.q) + '</div>' +
        '<div class="ss-opts">' +
          question.opts.map((opt, oi) =>
            '<button class="ss-opt ' + (answers[qi] === oi ? 'active' : '') + '" ' +
            'data-qi="' + qi + '" data-oi="' + oi + '" aria-pressed="' + (answers[qi] === oi) + '">' +
            ssEscape(opt) + '</button>'
          ).join('') +
        '</div>' +
      '</div>'
    ).join('') +
    '<button class="primary ss-calc-btn" id="ssCalc" aria-label="Calculează Stack Score" ' +
    (answers.includes(null) ? 'disabled' : '') + '>Calculează Stack Score →</button>';

    widget.querySelectorAll('.ss-opt').forEach((button) => {
      button.addEventListener('click', () => {
        answers[+button.dataset.qi] = +button.dataset.oi;
        buildForm();
      });
    });

    const calcBtn = document.getElementById('ssCalc');
    if (calcBtn && !answers.includes(null)) {
      calcBtn.addEventListener('click', () => {
        const score = answers.reduce((sum, oi, qi) => sum + SS_QUESTIONS[qi].scores[oi], 0);
        try {
          localStorage.setItem('signalStackScore', JSON.stringify({ score, answers }));
        } catch (e) {
          console.warn('[SIGNAL] unable to save stack score');
        }
        renderSSResult(score, answers);
      });
    }
  }

  buildForm();
}

function renderSSResult(score, answers) {
  const widget = document.getElementById('ssWidget');
  const tierObj = SS_LABELS.find((tier) => score >= tier.min && score < tier.max) || SS_LABELS[0];

  const recs = [];
  if (answers[1] !== null && answers[1] <= 1) recs.push('Identifică 2–3 taskuri repetitive și testează un tool AI gratuit pentru ele.');
  if (answers[2] !== null && answers[2] <= 1) recs.push('Auditează toolurile: elimini suprapunerile și economisești bani imediat.');
  if (answers[4] !== null && answers[4] === 0) recs.push('Alocă 15 minute săptămânal pentru funcții noi și automatizări.');
  if (!recs.length) recs.push('Stack-ul tău e bine optimizat. Explorează tooluri noi pentru avantaj competitiv.');

  widget.innerHTML =
    '<div class="ss-result">' +
      '<div class="ss-score-display">' +
        '<div class="ss-score-num" id="ssScoreNum">0</div>' +
        '<div class="ss-score-max">/1000</div>' +
      '</div>' +
      '<div class="ss-tier">' + ssEscape(tierObj.label) + '</div>' +
      '<div class="ss-tier-desc">' + ssEscape(tierObj.desc) + '</div>' +
      '<div class="ss-recs">' +
        '<div class="ss-recs-title">Pași recomandați</div>' +
        recs.map((rec) => '<div class="ss-rec">→ ' + ssEscape(rec) + '</div>').join('') +
      '</div>' +
      '<div class="ss-actions">' +
        '<button class="primary" id="ssShare" aria-label="Distribuie scorul">Distribuie scorul →</button>' +
        '<button class="secondary" id="ssReset" aria-label="Recalculează scorul">Recalculează</button>' +
      '</div>' +
    '</div>';

  animateCounter('ssScoreNum', score, 1500);

  document.getElementById('ssShare')?.addEventListener('click', () => {
    const text = 'Am obținut ' + score + '/1000 pe SIGNAL Stack Score (' + tierObj.label + ').';
    navigator.clipboard.writeText(text).then(() => {
      if (typeof toast === 'function') toast('Scorul a fost copiat.');
    });
  });

  document.getElementById('ssReset')?.addEventListener('click', () => {
    try {
      localStorage.removeItem('signalStackScore');
    } catch (e) {
      console.warn('[SIGNAL] unable to reset score');
    }
    renderSSForm();
  });
}

function animateCounter(elId, target, duration) {
  const el = document.getElementById(elId);
  if (!el) return;

  const start = performance.now();

  function step(now) {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(ease * target);
    if (p < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

document.addEventListener('DOMContentLoaded', initStackScore);
window.initStackScore = initStackScore;
