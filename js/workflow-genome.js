const WG_PATTERNS = [
  {kw:['email','emailuri','inbox','mail'], task:'Email Management', icon:'📧', cat:'productivitate', tools:['ChatGPT','Claude'], saving:'30 min/zi'},
  {kw:['meeting','sedinta','call','zoom','teams'], task:'Meeting Intelligence', icon:'🎙️', cat:'productivitate', tools:['NotebookLM','Claude'], saving:'45 min/zi'},
  {kw:['excel','csv','tabel','date','raport','spreadsheet','sql'], task:'Data Analysis', icon:'📊', cat:'date', tools:['Julius AI','Power BI Copilot'], saving:'60 min/zi'},
  {kw:['cod','code','programez','bug','python','javascript','script'], task:'Coding', icon:'💻', cat:'programare', tools:['Cursor','Claude','DeepSeek'], saving:'90 min/zi'},
  {kw:['scriu','copy','blog','postare','content','document','text'], task:'Writing', icon:'✍️', cat:'scris', tools:['Claude','ChatGPT'], saving:'40 min/zi'},
  {kw:['research','cercetare','pdf','articol','surse','citesc'], task:'Research', icon:'🔍', cat:'cercetare', tools:['Perplexity','NotebookLM'], saving:'50 min/zi'},
  {kw:['prezentare','powerpoint','slides','deck'], task:'Presentations', icon:'📽️', cat:'design', tools:['Claude','ChatGPT'], saving:'35 min/zi'},
  {kw:['design','imagine','grafic','logo','vizual','foto'], task:'Visual Design', icon:'🎨', cat:'design', tools:['Midjourney','Canva'], saving:'60 min/zi'},
  {kw:['traduc','traducere','limba'], task:'Translation', icon:'🌐', cat:'scris', tools:['DeepL','ChatGPT'], saving:'20 min/zi'},
  {kw:['notite','note','idei','brainstorm'], task:'Note-taking', icon:'📝', cat:'productivitate', tools:['NotebookLM','Claude'], saving:'25 min/zi'}
];

function wgEscapeHtml(value) {
  if (typeof escapeHtml === 'function') return escapeHtml(value);
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wgEscapeAttr(value) {
  if (typeof escapeAttr === 'function') return escapeAttr(value);
  return wgEscapeHtml(value);
}

function initWorkflowGenome() {
  const btn = document.getElementById('wgAnalyze');
  const input = document.getElementById('wgInput');
  if (!btn || !input) return;

  btn.addEventListener('click', () => {
    const text = input.value.trim();
    if (text.length < 15) {
      if (typeof toast === 'function') toast('Descrie puțin mai mult ce faci zilnic.');
      return;
    }

    const lower = text.toLowerCase();
    const matched = WG_PATTERNS.filter((pattern) => pattern.kw.some((keyword) => lower.includes(keyword)));
    const result = matched.length ? matched : [{
      task: 'Productivitate generală', icon: '⚡', cat: 'productivitate', tools: ['ChatGPT','Claude'], saving: '30 min/zi'
    }];

    renderWGResults(result);
  });
}

function renderWGResults(patterns) {
  const nodesEl = document.getElementById('wgNodes');
  const totalEl = document.getElementById('wgTotal');
  const results = document.getElementById('wgResults');
  if (!nodesEl || !totalEl || !results) return;

  const totalMin = patterns.reduce((sum, pattern) => {
    const n = parseInt(pattern.saving, 10);
    return sum + (Number.isNaN(n) ? 0 : n);
  }, 0);

  nodesEl.innerHTML = patterns.map((pattern, index) => {
    const toolLinks = pattern.tools
      .map((name) => '<button class="wg-tool-pill" data-wg-tool="' + wgEscapeAttr(name) + '" aria-label="Arată toolul ' + wgEscapeAttr(name) + '">' + wgEscapeHtml(name) + '</button>')
      .join('');

    return '<div class="wg-node" style="animation-delay:' + (index * 80) + 'ms">' +
      '<div class="wg-node-icon" aria-hidden="true">' + pattern.icon + '</div>' +
      '<div class="wg-node-body">' +
        '<div class="wg-node-task">' + wgEscapeHtml(pattern.task) + '</div>' +
        '<div class="wg-node-saving">⏱ Economie estimată: <strong>' + wgEscapeHtml(pattern.saving) + '</strong></div>' +
        '<div class="wg-node-tools">' + toolLinks + '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  totalEl.innerHTML = totalMin > 0
    ? '<div class="wg-total-inner">SIGNAL estimează că poți economisi <strong>' + totalMin + ' min/zi</strong> (' + (Math.round((totalMin / 60) * 10) / 10) + ' ore) cu AI.</div>'
    : '';

  results.style.display = 'block';
  results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  document.querySelectorAll('[data-wg-tool]').forEach((button) => {
    button.addEventListener('click', () => {
      const name = button.dataset.wgTool;
      if (typeof setQuery === 'function') {
        setQuery(name);
      } else {
        const search = document.getElementById('search');
        if (search) search.value = name;
      }
      document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' });
      if (typeof openDecision === 'function') openDecision(name);
    });
  });
}

document.addEventListener('DOMContentLoaded', initWorkflowGenome);
window.initWorkflowGenome = initWorkflowGenome;
