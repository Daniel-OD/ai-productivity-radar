/* ── Calendar helpers ─────────────────────────────────────────────────────── */
const RO_MONTHS = ['ian','feb','mar','apr','mai','iun','iul','aug','sep','oct','nov','dec'];
const _now = new Date();
const currentMonthYear = RO_MONTHS[_now.getMonth()] + ' ' + _now.getFullYear();

/* ── Fallback dataset (used while tools-market.json loads) ──────────────── */
const FALLBACK_TOOLS = [
  {name:'ChatGPT',cats:['programare','scris','cercetare','productivitate','studiu','date'],price:'freemium',country:'SUA',region:'america',tagline:'Asistent AI generalist pentru scris, cod, research și analiză de date.',when:'Când vrei un punct de pornire universal pentru aproape orice workflow.',url:'https://chatgpt.com',lastUpdated:'mai 2026',trend:92,badges:['popular','generalist'],apiAvailable:true,apiInfo:'OpenAI API public pentru chat, imagini și automatizări.',integrations:['Zapier','Make','n8n','Microsoft 365']},
  {name:'Claude',cats:['programare','scris','cercetare','date'],price:'freemium',country:'SUA',region:'america',tagline:'AI cu raționament puternic, excelent la documente lungi și cod.',when:'Când ai proiecte complexe sau vrei răspunsuri atent structurate.',url:'https://claude.ai',lastUpdated:'mai 2026',trend:88,badges:['cod-clean','documente'],apiAvailable:true,apiInfo:'Anthropic API disponibil pentru integrare în produse și workflow-uri.',integrations:['Zapier','Make','LangChain','AWS Bedrock']},
  {name:'Perplexity',cats:['cercetare'],price:'freemium',country:'SUA',region:'america',tagline:'Motor de căutare AI cu surse și citări.',when:'Când vrei research rapid și verificabil.',url:'https://www.perplexity.ai',lastUpdated:'mai 2026',trend:75,badges:['research']},
  {name:'Cursor',cats:['programare'],price:'freemium',country:'SUA',region:'america',tagline:'IDE AI-first pentru dezvoltare software asistată.',when:'Când vrei să editezi cod rapid în contextul proiectului.',url:'https://cursor.com',lastUpdated:'mai 2026',trend:85,badges:['editor','coding']},
  {name:'DeepSeek',cats:['programare','cercetare','scris'],price:'freemium',country:'China',region:'asia',tagline:'Modele puternice și eficiente, bune pentru cod și reasoning.',when:'Când vrei o alternativă ieftină și capabilă.',url:'https://chat.deepseek.com',lastUpdated:'mai 2026',trend:82,badges:['open-source','ieftin']},
  {name:'Mistral / Le Chat',cats:['programare','scris','cercetare'],price:'freemium',country:'Franța',region:'europa',tagline:'Campion european LLM cu modele open-weight.',when:'Când preferi o alternativă europeană rapidă și serioasă.',url:'https://chat.mistral.ai',lastUpdated:'mai 2026',trend:80,badges:['europa','open-weight']},
  {name:'Hugging Face',cats:['programare','cercetare','date'],price:'freemium',country:'Franța',region:'europa',tagline:'Hub pentru modele, datasets și aplicații open-source.',when:'Când vrei să testezi sau să construiești cu modele AI reale.',url:'https://huggingface.co',lastUpdated:'mai 2026',trend:85,badges:['open-source','hub']},
  {name:'NotebookLM',cats:['cercetare','studiu'],price:'gratuit',country:'SUA',region:'america',tagline:'Analizează documente și creează sinteze utile pentru studiu.',when:'Când lucrezi cu PDF-uri, notițe sau materiale lungi.',url:'https://notebooklm.google.com',lastUpdated:'mai 2026',trend:86,badges:['studiu']},
  {name:'Julius AI',cats:['date'],price:'freemium',country:'Canada',region:'america',tagline:'Analiză de CSV/Excel în limbaj natural.',when:'Când vrei insight-uri rapide din date fără cod.',url:'https://julius.ai',lastUpdated:'mai 2026',trend:78,badges:['date']},
  {name:'Power BI Copilot',cats:['date','productivitate'],price:'platit',country:'SUA',region:'america',tagline:'AI pentru dashboard-uri și analiză în ecosistemul Microsoft.',when:'Când lucrezi deja cu Power BI sau Microsoft Fabric.',url:'https://powerbi.microsoft.com',lastUpdated:'mai 2026',trend:81,badges:['BI','enterprise']},
  {name:'Synthesia',cats:['design'],price:'platit',country:'UK',region:'europa',tagline:'Avatare video AI pentru training și comunicare corporate.',when:'Când ai nevoie de video explicativ fără filmare.',url:'https://www.synthesia.io',lastUpdated:'mai 2026',trend:74,badges:['video']}
];

/* ── Filter metadata ─────────────────────────────────────────────────────── */
const categories = [['all','Toate'],['programare','Programare'],['scris','Scris'],['cercetare','Cercetare'],['design','Design'],['productivitate','Productivitate'],['studiu','Studiu'],['date','Date']];
const prices     = [['all','Toate'],['gratuit','Gratuit'],['freemium','Freemium'],['platit','Plătit']];
const regions    = [['all','Toate'],['america','America'],['europa','Europa'],['asia','Asia'],['israel','Israel']];

const priceLabels = {gratuit:'Gratuit',freemium:'Freemium',platit:'Plătit'};
const priceOrder  = {gratuit:1,freemium:2,platit:3};
const validCats    = new Set(categories.map(x => x[0]));
const validPrices  = new Set(prices.map(x => x[0]));
const validRegions = new Set(regions.map(x => x[0]));

const flag = {SUA:'🇺🇸',Canada:'🇨🇦',China:'🇨🇳',Franța:'🇫🇷',Germania:'🇩🇪',UK:'🇬🇧',Israel:'🇮🇱','Coreea de Sud':'🇰🇷',Japonia:'🇯🇵',India:'🇮🇳',Australia:'🇦🇺',România:'🇷🇴'};
// Synthetic rating weights keep "Rating" distinct from raw trend without introducing a new backend field.
const RATING_BADGE_WEIGHT = 2;
const RATING_API_WEIGHT = 4;

const OFFICIAL_URLS = {'chatgpt':'https://chatgpt.com','claude':'https://claude.ai','perplexity':'https://www.perplexity.ai','cursor':'https://cursor.com','deepseek':'https://chat.deepseek.com','qwen':'https://chat.qwen.ai','tongyi qianwen':'https://chat.qwen.ai','mistral':'https://chat.mistral.ai','le chat':'https://chat.mistral.ai','hugging face':'https://huggingface.co','notebooklm':'https://notebooklm.google.com','julius':'https://julius.ai','power bi copilot':'https://powerbi.microsoft.com','synthesia':'https://www.synthesia.io','kimi':'https://kimi.com','manus':'https://manus.im','photoroom':'https://www.photoroom.com','stability ai':'https://stability.ai','stable diffusion':'https://stability.ai','github copilot':'https://github.com/features/copilot','canva':'https://www.canva.com','figma':'https://www.figma.com/ai'};

const TOOL_DOMAINS = {'chatgpt':'chatgpt.com','claude':'claude.ai','perplexity':'perplexity.ai','cursor':'cursor.com','deepseek':'deepseek.com','mistral':'mistral.ai','le chat':'mistral.ai','hugging face':'huggingface.co','notebooklm':'notebooklm.google.com','julius':'julius.ai','julius ai':'julius.ai','power bi copilot':'powerbi.microsoft.com','synthesia':'synthesia.io','canva':'canva.com','figma':'figma.com','github copilot':'github.com','midjourney':'midjourney.com','runway':'runwayml.com','runway ml':'runwayml.com','stability ai':'stability.ai','stable diffusion':'stability.ai','kimi':'kimi.moonshot.cn','manus':'manus.im','photoroom':'photoroom.com','notion ai':'notion.so','grammarly':'grammarly.com','gemini':'gemini.google.com','copilot':'copilot.microsoft.com','microsoft copilot':'copilot.microsoft.com','qwen':'qwen.ai','tongyi qianwen':'qwen.ai','n8n':'n8n.io','make':'make.com','zapier':'zapier.com','hex':'hex.tech','reclaim':'reclaim.ai','reclaim ai':'reclaim.ai','granola':'granola.so','windsurf':'windsurf.com','codeium':'codeium.com','jasper':'jasper.ai','jasper ai':'jasper.ai','copy.ai':'copy.ai','copyai':'copy.ai','gamma':'gamma.app','elevenlabs':'elevenlabs.io','eleven labs':'elevenlabs.io','heygen':'heygen.com','hey gen':'heygen.com','murf':'murf.ai','murf ai':'murf.ai','suno':'suno.com','suno ai':'suno.com','descript':'descript.com','kling':'klingai.com','kling ai':'klingai.com','ideogram':'ideogram.ai','leonardo':'leonardo.ai','leonardo ai':'leonardo.ai','adobe firefly':'firefly.adobe.com','firefly':'firefly.adobe.com','consensus':'consensus.app','elicit':'elicit.org','grok':'x.ai','meta ai':'meta.ai','bolt':'bolt.new','bolt.new':'bolt.new','v0':'v0.dev','v0.dev':'v0.dev','lovable':'lovable.dev','amazon q':'aws.amazon.com','cohere':'cohere.com','dall-e':'openai.com','dall e 3':'openai.com','aleph alpha':'aleph-alpha.com','ollama':'ollama.com','lm studio':'lmstudio.ai','tableau pulse':'tableau.com','thoughtspot':'thoughtspot.com','databricks assistant':'databricks.com','uipath':'uipath.com','uipath ai center':'uipath.com','bitdefender':'bitdefender.com','ai21':'ai21.com','lobechat':'lobechat.com'};

function toolFaviconUrl(name) {
  const key = normKey(name);
  const domain = TOOL_DOMAINS[key] || Object.entries(TOOL_DOMAINS).find(([k]) => key.includes(k) || k.includes(key))?.[1];
  if (!domain) return '';
  return 'https://www.google.com/s2/favicons?domain=' + domain + '&sz=64';
}

/* ── ★ TopAI element 2: Badge "Nou" — tool adăugat în ultimele 90 de zile ── */
function isNewTool(lastUpdated) {
  const months = ['ian','feb','mar','apr','mai','iun','iul','aug','sep','oct','nov','dec'];
  const parts = String(lastUpdated || '').trim().split(' ');
  if (parts.length < 2) return false;
  const mIdx = months.indexOf(parts[0].toLowerCase());
  if (mIdx === -1) return false;
  const year = parseInt(parts[1]);
  if (isNaN(year)) return false;
  const toolDate = new Date(year, mIdx, 1);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  return toolDate >= cutoff;
}

/* Semantic intent taxonomy – also consumed by command-palette.js */
const TASK_INTENTS = [
  {id:'date',          label:'analiză de date / Excel / CSV',     cats:['date'],               words:['excel','csv','tabel','date','analiza','analizez','grafic','dashboard','bi','statistici','raport','spreadsheet','sql','insight','forecast','predictie','dataset']},
  {id:'programare',    label:'programare / cod / debugging',       cats:['programare'],         words:['cod','code','programare','programez','bug','debug','debugging','ide','aplicatie','app','script','python','javascript','refactor','repo','github','developer','dezvoltare']},
  {id:'cercetare',     label:'research / surse / PDF',             cats:['cercetare','studiu'], words:['research','cercetare','surse','pdf','articol','document','documente','studiu','studiez','rezumat','sinteza','citari','bibliografie','paper','raport','citesc','invatare','invat']},
  {id:'design',        label:'design / imagine / video / avatar',  cats:['design'],             words:['design','imagine','imagini','poza','foto','poster','logo','avatar','video','clip','vizual','background','prezentare','creativ','art','animatie','render']},
  {id:'scris',         label:'scris / copy / texte',               cats:['scris'],              words:['scriu','scris','text','email','copy','copywriting','blog','postare','linkedin','traduc','traducere','rescriu','corectez','gramatica','content','document']},
  {id:'productivitate',label:'productivitate / automatizare',      cats:['productivitate'],     words:['productivitate','automatizare','automatizez','task','taskuri','workflow','meeting','sedinta','calendar','notite','organizare','agent','agent autonom','operational']},
  {id:'gratis',        label:'buget gratuit sau ieftin',           price:['gratuit','freemium'],words:['gratis','gratuit','free','ieftin','buget','low cost','cost mic','fara bani','trial']},
  {id:'enterprise',    label:'business / enterprise',              price:['platit'],            words:['enterprise','business','firma','echipa','corporate','companie','training','securitate','organizatie','profesional']},
  {id:'europa',        label:'preferință Europa',                  region:'europa',             words:['europa','european','europeana','franta','germania','uk','gdpr','suveranitate']},
  {id:'asia',          label:'preferință Asia',                    region:'asia',               words:['asia','china','japonia','coreea','india','asiatic']},
  {id:'america',       label:'preferință SUA / America',           region:'america',            words:['sua','america','canada','us','usa']}
];

const profiles = [
  {title:'Scriu cod',           cat:'programare',    hint:'IDE, agenți, debugging',      rec:'Cursor + Claude + DeepSeek.'},
  {title:'Fac research',        cat:'cercetare',     hint:'surse, PDF-uri, sinteză',     rec:'Perplexity + NotebookLM + Claude.'},
  {title:'Analizez date',       cat:'date',          hint:'CSV, Excel, BI, SQL',         rec:'Julius + Hex + Power BI Copilot.'},
  {title:'Creez vizual',        cat:'design',        hint:'imagini, video, avatar',      rec:'Midjourney + Runway + Synthesia.'},
  {title:'Scriu mai bine',      cat:'scris',         hint:'copy, email, documente',      rec:'Claude + ChatGPT + Grammarly.'},
  {title:'Vreau productivitate',cat:'productivitate',hint:'meeting, calendar, taskuri',  rec:'Notion AI + Granola + Reclaim.'}
];

/* ── App state ───────────────────────────────────────────────────────────── */
let tools = [], activeCat = 'all', activePrice = 'all', activeRegion = 'all';
let searchQuery = '', sortMode = 'default', hasInteracted = false, isLoading = true, hasDeepLink = false;
let favorites = new Set(JSON.parse(safeStorageGet('aiRadarFavorites', '[]')));
let compare   = new Set();
const $ = id => document.getElementById(id);

/* ── Storage helpers ─────────────────────────────────────────────────────── */
function safeStorageGet(k, f) { try { return localStorage.getItem(k) || f; } catch (e) { return f; } }
function safeStorageSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

/* ── Toast notification ──────────────────────────────────────────────────── */
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

/* ── String utilities ────────────────────────────────────────────────────── */
function normKey(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function officialUrl(t) {
  if (t && /^https?:\/\//i.test(t.url || '')) return t.url;
  const n = normKey(t && t.name);
  if (OFFICIAL_URLS[n]) return OFFICIAL_URLS[n];
  for (const k in OFFICIAL_URLS) { if (n.includes(k) || k.includes(n)) return OFFICIAL_URLS[k]; }
  return 'https://www.google.com/search?q=' + encodeURIComponent((t && t.name ? t.name : 'AI tool') + ' official website');
}

function regionOf(c) {
  if (['SUA','Canada'].includes(c)) return 'america';
  if (['China','Japonia','Coreea de Sud','India','Australia'].includes(c)) return 'asia';
  if (c === 'Israel') return 'israel';
  return 'europa';
}

function normalize(t, i) {
  t = t || {};
  let cats = Array.isArray(t.cats) ? t.cats.filter(Boolean) : ['productivitate'];
  if (!cats.length) cats = ['productivitate'];
  const country = String(t.country || 'SUA');
  return {
    name:             String(t.name || 'Tool AI'),
    cats,
    price:            priceLabels[t.price] ? t.price : 'freemium',
    country,
    region:           t.region || regionOf(country),
    tagline:          String(t.tagline || t.description || 'Descriere în curs de verificare.'),
    when:             String(t.when || t.whenToUse || 'Folosește după testare.'),
    url:              officialUrl(t),
    lastUpdated:      String(t.lastUpdated || currentMonthYear),
    trend:            Number.isFinite(Number(t.trend)) ? Number(t.trend) : 80,
    badges:           Array.isArray(t.badges)      ? t.badges      : [],
    apiInfo:          t.apiInfo || '',
    apiAvailable:     !!t.apiAvailable,
    integrations:     Array.isArray(t.integrations)? t.integrations: [],
    standaloneNote:   t.standaloneNote  || '',
    audience:         t.audience        || '',
    source:           t.source          || '',
    type:             t.type            || '',
    bestFor:          Array.isArray(t.bestFor)   ? t.bestFor   : [],
    notIdeal:         Array.isArray(t.notIdeal)  ? t.notIdeal  : [],
    strengths:        Array.isArray(t.strengths) ? t.strengths : [],
    similar:          Array.isArray(t.similar)   ? t.similar   : [],
    pricing:          String(t.pricing           || ''),
    trendExplanation: String(t.trendExplanation  || ''),
    longDescription:  String(t.longDescription   || ''),
    features:         Array.isArray(t.features)      ? t.features      : [],
    useCases:         Array.isArray(t.useCases)       ? t.useCases       : [],
    platforms:        Array.isArray(t.platforms)      ? t.platforms      : [],
    pricingTiers:     Array.isArray(t.pricingTiers)   ? t.pricingTiers   : [],
    _i: i
  };
}

/* ── URL / state persistence ────────────────────────────────────────────── */
function readUrlState() {
  const p = new URLSearchParams(location.search);
  const cat = p.get('cat'), price = p.get('price'), region = p.get('region'), q = p.get('q'), sort = p.get('sort');
  if (cat    && validCats.has(cat))                                        { activeCat    = cat;    hasDeepLink = true; }
  if (price  && validPrices.has(price))                                    { activePrice  = price;  hasDeepLink = true; }
  if (region && validRegions.has(region))                                  { activeRegion = region; hasDeepLink = true; }
  if (q)                                                                   { searchQuery  = q;      hasDeepLink = true; }
  if (sort && ['default','trend','name','price','favorites'].includes(sort)){ sortMode     = sort;   hasDeepLink = true; }
  if (hasDeepLink) hasInteracted = true;
}

function save() {
  safeStorageSet('aiRadarState', JSON.stringify({activeCat, activePrice, activeRegion, searchQuery, sortMode}));
  syncUrl();
}

function loadState() {
  try {
    const s = JSON.parse(safeStorageGet('aiRadarState', '{}'));
    activeCat    = s.activeCat    || activeCat;
    activePrice  = s.activePrice  || activePrice;
    activeRegion = s.activeRegion || activeRegion;
    searchQuery  = s.searchQuery  || searchQuery;
    sortMode     = s.sortMode     || sortMode;
  } catch (e) {}
  readUrlState();
}

function syncUrl() {
  const p = new URLSearchParams();
  if (activeCat    !== 'all') p.set('cat',    activeCat);
  if (activePrice  !== 'all') p.set('price',  activePrice);
  if (activeRegion !== 'all') p.set('region', activeRegion);
  if (searchQuery.trim())     p.set('q',      searchQuery.trim());
  if (sortMode !== 'default') p.set('sort',   sortMode);
  const qs = p.toString();
  history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
}

/* ── Initialisation ─────────────────────────────────────────────────────── */
async function init() {
  loadState();
  tools = FALLBACK_TOOLS.map(normalize);
  isLoading = false;
  if ($('metaTools')) $('metaTools').textContent = tools.length;
  renderWizard();
  renderTrending();
  renderRadar();
  renderTools();
  setupUiEnhancements();
  setupToolbar();

  try {
    const r = await fetch('tools-market.json');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    const arr  = Array.isArray(data) ? data : data.tools;
    if (!Array.isArray(arr) || !arr.length) throw new Error('Listă goală');
    tools = mergeTools(tools, arr.map(normalize));
  } catch (e) {
    console.warn('[SIGNAL] using fallback tools because remote data failed');
  }

  if ($('metaTools')) $('metaTools').textContent = tools.length;
  renderTrending();
  renderRadar();
  renderTools();
  if (typeof setupToolbar.__repopulate === 'function') setupToolbar.__repopulate();

  if (typeof initCommandPalette === 'function') initCommandPalette();
  if (typeof initDecisionModal   === 'function') initDecisionModal();
  if (typeof initSignalFeed      === 'function') initSignalFeed();
  if (typeof initWorkflowGenome  === 'function') initWorkflowGenome();
  if (typeof initStackScore      === 'function') initStackScore();
  if (typeof handleToolDeepLink  === 'function') handleToolDeepLink();

  if (hasDeepLink) {
    setTimeout(() => {
      document.querySelector('#tools')?.scrollIntoView({behavior:'smooth', block:'start'});
      toast('Filtru din URL aplicat');
    }, 350);
  }

  window.__signalCoreUiReady = true;
  registerServiceWorker();
}

function mergeTools(localTools, remoteTools) {
  const merged = new Map();
  localTools.forEach(tool => merged.set(normKey(tool.name), tool));
  remoteTools.forEach(tool => {
    const key = normKey(tool.name);
    const localTool = merged.get(key);
    merged.set(key, localTool ? {
      ...localTool,
      ...tool,
      badges: (tool.badges && tool.badges.length) ? tool.badges : localTool.badges,
      integrations: (tool.integrations && tool.integrations.length) ? tool.integrations : localTool.integrations,
      features: (tool.features && tool.features.length) ? tool.features : localTool.features,
      useCases: (tool.useCases && tool.useCases.length) ? tool.useCases : localTool.useCases,
      platforms: (tool.platforms && tool.platforms.length) ? tool.platforms : localTool.platforms,
      pricingTiers: (tool.pricingTiers && tool.pricingTiers.length) ? tool.pricingTiers : localTool.pricingTiers,
    } : tool);
  });
  return Array.from(merged.values());
}

function computeToolRating(tool) {
  return (tool.trend || 0)
    + ((tool.badges || []).length * RATING_BADGE_WEIGHT)
    + ((tool.integrations || []).length || 0)
    + (tool.apiAvailable ? RATING_API_WEIGHT : 0);
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(e => console.warn('[SW] Registration failed:', e));
  }
}

/* ── Loading placeholder ─────────────────────────────────────────────────── */
function renderLoading() {
  $('toolsGrid').style.display = 'block';
  $('toolsGrid').innerHTML = '<div class="loading-state">Se încarcă radarul...</div>';
  $('emptyState').classList.remove('show');
  $('resultsCount').textContent = 'Se încarcă radarul...';
}

/* ── Filter pill helpers ─────────────────────────────────────────────────── */
function count(kind, id) {
  if (id === 'all')    return tools.length;
  if (kind === 'cat')  return tools.filter(t => t.cats.includes(id)).length;
  if (kind === 'price')return tools.filter(t => t.price   === id).length;
  return tools.filter(t => t.region === id).length;
}

function pills(items, active, kind) {
  return items.map(([id, label]) =>
    '<button class="pill ' + (active === id ? 'active' : '') + '"' +
    ' role="button" aria-pressed="' + (active === id) + '"' +
    ' data-' + kind + '="' + escapeAttr(id) + '">' +
    escapeHtml(label) +
    '<span class="count">' + count(kind, id) + '</span></button>'
  ).join('');
}

/* renderPills removed — replaced by setupToolbar */

/* ── Wizard ──────────────────────────────────────────────────────────────── */
function renderWizard() {
  $('wizardGrid').innerHTML = profiles.map((p, i) =>
    '<button class="choice" data-profile="' + i + '">' +
    '<strong>' + escapeHtml(p.title) + '</strong>' +
    '<span>' + escapeHtml(p.hint) + '</span></button>'
  ).join('');
  document.querySelectorAll('[data-profile]').forEach(b => b.onclick = () => {
    const p = profiles[+b.dataset.profile];
    hasInteracted = true; activeCat = p.cat; activePrice = activeRegion = 'all'; searchQuery = '';
    $('recommendation').innerHTML = 'Recomandare: <strong>' + escapeHtml(p.rec) + '</strong>';
    save();
    renderTools('Am filtrat pentru: <strong>' + escapeHtml(p.title) + '</strong>');
    if (typeof setupToolbar.__syncToUI === 'function') setupToolbar.__syncToUI();
    document.querySelector('#tools').scrollIntoView({behavior:'smooth'});
  });
}

/* ── Filtering & sorting ─────────────────────────────────────────────────── */
function getFiltered() {
  const q = searchQuery.toLowerCase().trim();
  let out = tools.filter(t => {
    const hay = [t.name,t.tagline,t.when,t.country,t.region,t.price,t.apiInfo,t.standaloneNote,t.audience,...t.cats,...t.badges].join(' ').toLowerCase();
    return (activeCat    === 'all' || t.cats.includes(activeCat))
        && (activePrice  === 'all' || t.price   === activePrice)
        && (activeRegion === 'all' || t.region  === activeRegion)
        && (!q || hay.includes(q));
  });
  if      (sortMode === 'trend')    out.sort((a,b) => b.trend - a.trend);
  else if (sortMode === 'rating')   out.sort((a,b) => computeToolRating(b) - computeToolRating(a) || b.trend - a.trend);
  else if (sortMode === 'name')     out.sort((a,b) => a.name.localeCompare(b.name,'ro'));
  else if (sortMode === 'price')    out.sort((a,b) => priceOrder[a.price] - priceOrder[b.price]);
  else if (sortMode === 'favorites')out.sort((a,b) => favorites.has(b.name) - favorites.has(a.name));
  else                              out.sort((a,b) => a._i - b._i);
  return out;
}

/* ── Trending strip ──────────────────────────────────────────────────────── */
function renderTrending() {
  if (!$('trendingStrip')) return;
  const top = [...tools].sort((a,b) => b.trend - a.trend).slice(0,4);
  $('trendingStrip').innerHTML = top.map(t =>
    '<div class="trend-card" data-trendtool="' + escapeAttr(t.name) + '">' +
    '<div class="score">↗ trend ' + escapeHtml(String(t.trend)) + '</div>' +
    '<h3>' + escapeHtml(t.name) + '</h3>' +
    '<p>' + escapeHtml(t.tagline) + '</p></div>'
  ).join('');
  document.querySelectorAll('[data-trendtool]').forEach(c => c.onclick = () => {
    hasInteracted=true; searchQuery=c.dataset.trendtool;
    activeCat=activePrice=activeRegion='all'; save();
    renderTools();
    if (typeof setupToolbar.__syncToUI === 'function') setupToolbar.__syncToUI();
    document.querySelector('#tools').scrollIntoView({behavior:'smooth'});
  });
}

/* ── Radar stats ─────────────────────────────────────────────────────────── */
function renderRadar() {
  if (!$('radarGrid')) return;
  const hot  = tools.filter(t => t.trend >= 85).length;
  const free = tools.filter(t => t.price === 'gratuit' || t.price === 'freemium').length;
  const data = tools.filter(t => t.cats.includes('date')).length;
  const eu   = tools.filter(t => t.region === 'europa').length;
  $('radarGrid').innerHTML =
    '<div class="radar-card"><strong>' + tools.length + '</strong><span>tooluri monitorizate</span></div>' +
    '<div class="radar-card"><strong>' + hot  + '</strong><span>trend 85+</span></div>' +
    '<div class="radar-card"><strong>' + free + '</strong><span>gratuite/freemium</span></div>' +
    '<div class="radar-card"><strong>' + data + '</strong><span>pentru date</span></div>' +
    '<div class="radar-card"><strong>' + eu   + '</strong><span>Europa</span></div>';
}

/* ── Tool grid ───────────────────────────────────────────────────────────── */
function renderTools(msg) {
  const CAT_BORDER = {
    programare: '#3B82F6',
    date: '#38bdf8',
    design: '#c084fc',
    cercetare: '#E8B86D',
    scris: '#10B981',
    productivitate: '#5eead4',
    studiu: '#818cf8'
  };
  if (msg === undefined) msg = '';
  if (isLoading) { renderLoading(); return; }
  const out = getFiltered();
  if (!$('toolsGrid')) return;
  $('toolsGrid').style.display = out.length ? 'grid' : 'none';
  $('emptyState')?.classList.toggle('show', !out.length && hasInteracted);
  if (!out.length) {
    $('toolsGrid').innerHTML = '';
    if ($('resultsCount')) $('resultsCount').innerHTML = hasInteracted
      ? 'Afișez <strong>0</strong> rezultate'
      : 'Alege un profil sau folosește filtrele pentru a începe.';
    return;
  }
  $('toolsGrid').innerHTML = out.map((t, i) =>
    '<div class="tool-card" data-tool-name="' + escapeAttr(t.name) + '" style="border-left:3px solid ' + (CAT_BORDER[t.cats[0]] || 'var(--border)') + ';animation-delay:' + Math.min(i*22,350) + 'ms">' +

    /* ★ TopAI element: tool-head cu favicon icon */
    '<div class="tool-head">' +
    '<div class="tool-head-left">' +
    '<img class="tool-icon" src="' + escapeAttr(toolFaviconUrl(t.name)) + '" alt="" aria-hidden="true" loading="lazy"' +
    ' onerror="this.style.display=\'none\';var fb=this.nextElementSibling;if(fb)fb.style.display=\'flex\';">' +
    '<span class="tool-icon-fallback" style="display:none">' + escapeHtml(t.name.charAt(0).toUpperCase()) + '</span>' +
    '<div class="tool-name">' + escapeHtml(t.name) +
    /* ★ TopAI element: badge "Nou" */
    (isNewTool(t.lastUpdated) ? '<span class="badge-new">Nou</span>' : '') +
    '</div>' +
    '</div>' +
    '<div class="price-stack">' +
    '<span class="price-tag price-' + escapeAttr(t.price) + '">' + escapeHtml(priceLabels[t.price]) + '</span>' +
    '<span class="trend-tag">↗ ' + escapeHtml(String(t.trend)) + '</span></div></div>' +

    '<div class="country-line">' + escapeHtml(flag[t.country]||'🌍') + ' ' + escapeHtml(t.country) + ' · 🔄 ' + escapeHtml(t.lastUpdated) + '</div>' +
    '<div class="tool-tagline">' + escapeHtml(t.tagline) + '</div>' +
    '<div class="tool-when">↳ ' + escapeHtml(t.when) + '</div>' +

    /* ★ TopAI element: cat-tag colorate per categorie */
    '<div class="tool-cats">' +
    t.cats.map(c => '<span class="cat-tag cat-' + escapeAttr(c) + '">' + escapeHtml(c) + '</span>').join('') +
    t.badges.map(b => '<span class="cat-tag">' + escapeHtml(b) + '</span>').join('') +
    '</div>' +

    '<div class="tool-actions">' +
    '<button class="details-btn" data-detail="' + escapeAttr(t.name) + '">Analiză decizie</button>' +
    '<a class="tool-link" href="' + escapeAttr(t.url) + '" target="_blank" rel="noopener noreferrer">Deschide →</a>' +
    '<button class="similar-btn" data-similar="' + escapeAttr(t.cats[0]) + '" data-name="' + escapeAttr(t.name) + '">Similar</button>' +
    '<button class="fav-btn" data-fav="' + escapeAttr(t.name) + '">' + (favorites.has(t.name)?'★':'☆') + ' Favorit</button>' +
    '<button class="compare-btn" data-compare="' + escapeAttr(t.name) + '">' + (compare.has(t.name)?'✓':'+') + ' Compară</button>' +
    '</div></div>'
  ).join('');
  if ($('resultsCount')) $('resultsCount').innerHTML = msg || 'Afișez <strong>' + out.length + '</strong> din <strong>' + tools.length + '</strong> tooluri';
  if (window.__stbUpdateCount) window.__stbUpdateCount(out.length);
  wireCards();
}

function wireCards() {
  document.querySelectorAll('.tool-card').forEach(card => {
    card.onclick = e => { if (e.target.closest('a,button')) return; openDecision(card.dataset.toolName); };
  });
  document.querySelectorAll('[data-detail]').forEach(  b => b.onclick = () => openDecision(b.dataset.detail));
  document.querySelectorAll('[data-similar]').forEach( b => b.onclick = () => {
    hasInteracted=true; activeCat=b.dataset.similar; activePrice=activeRegion='all'; searchQuery='';
    save();
    renderTools('Tooluri similare cu <strong>' + escapeHtml(b.dataset.name) + '</strong>');
    if (typeof setupToolbar.__syncToUI === 'function') setupToolbar.__syncToUI();
  });
  document.querySelectorAll('[data-fav]').forEach(b => b.onclick = () => {
    favorites.has(b.dataset.fav) ? favorites.delete(b.dataset.fav) : favorites.add(b.dataset.fav);
    safeStorageSet('aiRadarFavorites', JSON.stringify([...favorites]));
    toast(favorites.has(b.dataset.fav) ? 'Adăugat la favorite' : 'Scos din favorite');
    renderTools();
  });
  document.querySelectorAll('[data-compare]').forEach(b => b.onclick = () => toggleCompare(b.dataset.compare));
}

/* ── Compare ─────────────────────────────────────────────────────────────── */
function toggleCompare(name) {
  if (compare.has(name)) compare.delete(name);
  else if (compare.size < 4) compare.add(name);
  else toast('Poți compara maximum 4 tooluri.');
  updateCompare();
  renderTools();
}

function updateCompare() {
  const bar = $('compareBar'), btn = $('openCompare');
  bar.classList.toggle('show', compare.size > 0);
  $('compareText').textContent = compare.size === 1
    ? '1 selectat · mai alege unul pentru comparație'
    : compare.size + ' selectate';
  btn.disabled = compare.size < 2;
}

function openCompare() {
  if (compare.size < 2) { toast('Selectează cel puțin 2 tooluri pentru comparație.'); return; }
  const selected = [...compare].map(n => tools.find(t => t.name === n)).filter(Boolean);
  $('compareContent').innerHTML =
    '<table class="compare-table">' +
    '<tr><th>Tool</th>'              + selected.map(t => '<th>' + escapeHtml(t.name) + '</th>').join('') + '</tr>' +
    '<tr><td>Preț</td>'              + selected.map(t => '<td>' + escapeHtml(priceLabels[t.price]) + '</td>').join('') + '</tr>' +
    '<tr><td>Țară</td>'              + selected.map(t => '<td>' + escapeHtml(t.country) + '</td>').join('') + '</tr>' +
    '<tr><td>Trend</td>'             + selected.map(t => '<td>' + escapeHtml(String(t.trend)) + '</td>').join('') + '</tr>' +
    '<tr><td>Categorii</td>'         + selected.map(t => '<td>' + escapeHtml(t.cats.join(', ')) + '</td>').join('') + '</tr>' +
    '<tr><td>Când îl folosești</td>' + selected.map(t => '<td>' + escapeHtml(t.when) + '</td>').join('') + '</tr>' +
    '<tr><td>Link</td>'              + selected.map(t => '<td><a class="tool-link" href="' + escapeAttr(t.url) + '" target="_blank" rel="noopener noreferrer">Deschide</a></td>').join('') + '</tr>' +
    '</table>';
  $('compareModal').classList.add('show');
}

/* ── Search input ────────────────────────────────────────────────────────── */
function setQuery(v) {
  hasInteracted = true;
  searchQuery = v;
  save();
  renderTools();
  if (typeof setupToolbar.__syncToUI === 'function') setupToolbar.__syncToUI();
}

window.filterByCategory = function (cat) {
  hasInteracted = true;
  activeCat = cat || 'all';
  activePrice = 'all';
  activeRegion = 'all';
  searchQuery = '';
  save();
  renderTools();
  var stbCat = document.getElementById('stbCat');
  if (stbCat) stbCat.value = activeCat;
  var mfsCat = document.getElementById('mfsCat');
  if (mfsCat) mfsCat.value = activeCat;
  if (typeof setupToolbar.__syncToUI === 'function') setupToolbar.__syncToUI();
  document.querySelector('#tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/* ── Contextual Filter Toolbar ───────────────────────────────────────────── */
function setupToolbar() {
  var CAT_LABELS    = { all:'Categorie', programare:'Programare', scris:'Scris', cercetare:'Cercetare', design:'Design', productivitate:'Productivitate', studiu:'Studiu', date:'Date' };
  var PRICE_LABELS  = { all:'Preț', gratuit:'Gratuit', freemium:'Freemium', platit:'Plătit' };
  var REGION_LABELS = { all:'Regiune', america:'America', europa:'Europa', asia:'Asia', israel:'Israel' };

  function buildOpts(items, labels) {
    return items.map(function(item) {
      var id = Array.isArray(item) ? item[0] : item;
      var lbl = labels[id] || (Array.isArray(item) ? item[1] : (id.charAt(0).toUpperCase() + id.slice(1)));
      return { id: id, lbl: lbl };
    });
  }

  function fillSelect(el, opts) {
    if (!el) return;
    var cur = el.value;
    el.innerHTML = '';
    opts.forEach(function(o) {
      var opt = document.createElement('option');
      opt.value = o.id;
      opt.textContent = o.lbl;
      el.appendChild(opt);
    });
    el.value = opts.some(function(o) { return o.id === cur; }) ? cur : opts[0].id;
  }

  var catOpts    = buildOpts(categories, CAT_LABELS);
  var priceOpts  = buildOpts(prices, PRICE_LABELS);
  var regionOpts = buildOpts(regions, REGION_LABELS);

  var stbSearch  = document.getElementById('stbSearch');
  var stbCat     = document.getElementById('stbCat');
  var stbPrice   = document.getElementById('stbPrice');
  var stbRegion  = document.getElementById('stbRegion');
  var stbSort    = document.getElementById('stbSort');
  var stbReset   = document.getElementById('stbReset');
  var stbCount   = document.getElementById('stbCount');
  var stbActiveBadge      = document.getElementById('stbActiveBadge');
  var stbActiveBadgeCount = document.getElementById('stbActiveBadgeCount');
  var mfsCat    = document.getElementById('mfsCat');
  var mfsPrice  = document.getElementById('mfsPrice');
  var mfsRegion = document.getElementById('mfsRegion');
  var mfsSort   = document.getElementById('mfsSort');
  var mobileBtn    = document.getElementById('stbMobileFilterBtn');
  var mobileSheet  = document.getElementById('mobileFilterSheet');
  var mfsBadge     = document.getElementById('stbMobileBadge');
  var mfsClose     = document.getElementById('mfsClose');
  var mfsBackdrop  = document.getElementById('mfsBackdrop');
  var mfsReset     = document.getElementById('mfsReset');
  var mfsApply     = document.getElementById('mfsApply');

  // Fill selects
  fillSelect(stbCat,    catOpts);
  fillSelect(stbPrice,  priceOpts);
  fillSelect(stbRegion, regionOpts);
  fillSelect(mfsCat,    catOpts);
  fillSelect(mfsPrice,  priceOpts);
  fillSelect(mfsRegion, regionOpts);

  function syncToUI() {
    if (stbSearch) stbSearch.value = searchQuery;
    if (stbCat)    stbCat.value    = activeCat;
    if (stbPrice)  stbPrice.value  = activePrice;
    if (stbRegion) stbRegion.value = activeRegion;
    if (stbSort)   stbSort.value   = sortMode;
    if (mfsCat)    mfsCat.value    = activeCat;
    if (mfsPrice)  mfsPrice.value  = activePrice;
    if (mfsRegion) mfsRegion.value = activeRegion;
    if (mfsSort)   mfsSort.value   = sortMode;

    var activeCount = (activeCat !== 'all' ? 1 : 0) + (activePrice !== 'all' ? 1 : 0) + (activeRegion !== 'all' ? 1 : 0) + (sortMode !== 'default' ? 1 : 0);
    var showReset   = activeCount > 0 || searchQuery.trim().length > 0;

    if (stbCat)    stbCat.classList.toggle('active',    activeCat    !== 'all');
    if (stbPrice)  stbPrice.classList.toggle('active',  activePrice  !== 'all');
    if (stbRegion) stbRegion.classList.toggle('active', activeRegion !== 'all');
    if (stbSort)   stbSort.classList.toggle('active',   sortMode     !== 'default');

    if (stbReset) stbReset.style.display = showReset ? '' : 'none';
    if (stbActiveBadge) {
      stbActiveBadge.style.display = activeCount > 0 ? '' : 'none';
      if (stbActiveBadgeCount) stbActiveBadgeCount.textContent = activeCount;
    }
    if (mfsBadge) {
      mfsBadge.style.display = activeCount > 0 ? '' : 'none';
      mfsBadge.textContent   = activeCount;
    }
    if (mobileBtn) mobileBtn.setAttribute('aria-expanded', mobileSheet && !mobileSheet.hidden ? 'true' : 'false');
  }

  function updateCount(n) {
    if (stbCount) stbCount.textContent = n + ' tooluri';
  }

  // Expose on setupToolbar for external callers
  setupToolbar.__syncToUI   = syncToUI;
  setupToolbar.__repopulate = function() {
    fillSelect(stbCat,    catOpts);
    fillSelect(stbPrice,  priceOpts);
    fillSelect(stbRegion, regionOpts);
    fillSelect(mfsCat,    catOpts);
    fillSelect(mfsPrice,  priceOpts);
    fillSelect(mfsRegion, regionOpts);
    syncToUI();
  };

  // Debounced search
  var searchTimer;
  if (stbSearch) {
    stbSearch.addEventListener('input', function() {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function() {
        hasInteracted = true;
        searchQuery = stbSearch.value;
        save(); renderTools(); syncToUI();
      }, 150);
    });
    stbSearch.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        stbSearch.value = ''; searchQuery = '';
        save(); renderTools(); syncToUI();
      }
    });
  }

  // Desktop selects
  if (stbCat)    stbCat.addEventListener('change',    function() { hasInteracted=true; activeCat    = stbCat.value;    save(); renderTools(); syncToUI(); });
  if (stbPrice)  stbPrice.addEventListener('change',  function() { hasInteracted=true; activePrice  = stbPrice.value;  save(); renderTools(); syncToUI(); });
  if (stbRegion) stbRegion.addEventListener('change', function() { hasInteracted=true; activeRegion = stbRegion.value; save(); renderTools(); syncToUI(); });
  if (stbSort)   stbSort.addEventListener('change',   function() { hasInteracted=true; sortMode     = stbSort.value;   save(); renderTools(); syncToUI(); });

  // Reset
  function doReset() {
    hasInteracted = false; hasDeepLink = false;
    activeCat = activePrice = activeRegion = 'all';
    searchQuery = ''; sortMode = 'default';
    safeStorageSet('aiRadarState', '{}'); syncUrl();
    syncToUI(); renderTools(); toast('Filtre resetate');
  }
  if (stbReset) stbReset.addEventListener('click', doReset);

  // Mobile sheet
  function openSheet() {
    if (!mobileSheet) return;
    mobileSheet.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function() { mobileSheet.classList.add('open'); });
    if (mobileBtn) mobileBtn.setAttribute('aria-expanded', 'true');
    setTimeout(function() { if (mfsClose) mfsClose.focus(); }, 50);
  }
  function closeSheet() {
    if (!mobileSheet) return;
    mobileSheet.classList.remove('open');
    document.body.style.overflow = '';
    if (mobileBtn) mobileBtn.setAttribute('aria-expanded', 'false');
    setTimeout(function() { mobileSheet.hidden = true; }, 300);
  }
  if (mobileBtn)   mobileBtn.addEventListener('click', openSheet);
  if (mfsClose)    mfsClose.addEventListener('click', closeSheet);
  if (mfsBackdrop) mfsBackdrop.addEventListener('click', closeSheet);
  if (mfsReset)    mfsReset.addEventListener('click', function() {
    doReset();
    if (mfsCat)    mfsCat.value    = 'all';
    if (mfsPrice)  mfsPrice.value  = 'all';
    if (mfsRegion) mfsRegion.value = 'all';
    if (mfsSort)   mfsSort.value   = 'default';
  });
  if (mfsApply)    mfsApply.addEventListener('click', function() {
    hasInteracted = true;
    if (mfsCat)    activeCat    = mfsCat.value;
    if (mfsPrice)  activePrice  = mfsPrice.value;
    if (mfsRegion) activeRegion = mfsRegion.value;
    if (mfsSort)   sortMode     = mfsSort.value;
    save(); renderTools(); syncToUI(); closeSheet();
  });

  // Esc closes sheet
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && mobileSheet && !mobileSheet.hidden) closeSheet();
  });

  // Focus trap inside mobile sheet
  if (mobileSheet) {
    mobileSheet.addEventListener('keydown', function(e) {
      if (e.key !== 'Tab') return;
      var focusable = Array.from(mobileSheet.querySelectorAll('button, select, [tabindex]:not([tabindex="-1"])'));
      var visible = focusable.filter(function(el) { return !el.closest('[hidden]'); });
      if (!visible.length) return;
      var first = visible[0], last = visible[visible.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  // Toolbar elevation on scroll
  var toolbar = document.getElementById('signalToolbar');
  if (toolbar) {
    window.addEventListener('scroll', function() {
      toolbar.classList.toggle('elevated', window.scrollY > 100);
    }, { passive: true });
  }

  // Expose updateCount
  window.__stbUpdateCount = updateCount;

  // Initial sync
  syncToUI();
}

function setupUiEnhancements() {
  /* setupScrollHide removed — replaced by toolbar elevation in setupToolbar */
  setupStackButtons();
  setupTheme();
  setupFooterSubscribe();
}

function setupStackButtons() {
  document.querySelectorAll('[data-stack]').forEach(btn => {
    if (btn.classList.contains('stack-toggle-btn')) return;
    btn.onclick = () => {
      hasInteracted = true;
      activeCat = btn.dataset.stack;
      activePrice = 'all';
      activeRegion = 'all';
      searchQuery = '';
      save();
      renderTools('Stack: <strong>' + escapeHtml(btn.dataset.stack) + '</strong>');
      if (typeof setupToolbar.__syncToUI === 'function') setupToolbar.__syncToUI();
      document.querySelector('#tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
  });

  document.querySelectorAll('[data-region-stack]').forEach(btn => {
    btn.onclick = () => {
      hasInteracted = true;
      activeRegion = btn.dataset.regionStack;
      activeCat = 'all';
      activePrice = 'all';
      searchQuery = '';
      save();
      renderTools('Radar: <strong>' + escapeHtml(btn.dataset.regionStack) + '</strong>');
      if (typeof setupToolbar.__syncToUI === 'function') setupToolbar.__syncToUI();
      document.querySelector('#tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
  });
}

function setupTheme() {
  const root = document.documentElement;
  const btn = $('themeToggle');
  try {
    root.classList.toggle('light-mode', localStorage.getItem('theme') === 'light');
  } catch (_) {}
  if (btn) {
    btn.textContent = root.classList.contains('light-mode') ? '🌙' : '☀️';
    btn.onclick = () => {
      root.classList.toggle('light-mode');
      const nextTheme = root.classList.contains('light-mode') ? 'light' : 'dark';
      try { localStorage.setItem('theme', nextTheme); } catch (_) {}
      btn.textContent = nextTheme === 'light' ? '🌙' : '☀️';
    };
  }
}

function setupFooterSubscribe() {
  const subscribe = $('footerSubscribe');
  const emailInput = $('footerEmail');
  if (!subscribe || !emailInput) return;
  subscribe.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const emailLooksValid = emailInput.checkValidity
      ? emailInput.checkValidity()
      : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!email || !emailLooksValid) {
      toast('Email invalid');
      return;
    }
    try {
      localStorage.setItem('signalEmail', email);
    } catch (error) {
      console.warn('[SIGNAL] unable to save email preference');
    }
    toast('Abonare salvată!');
    emailInput.value = '';
  });
}

/* ── Event wiring ────────────────────────────────────────────────────────── */
/* Note: search/reset are now handled by setupToolbar() */

$('favQuick').onclick = () => {
  hasInteracted=true; sortMode='favorites';
  save();
  renderTools('Favoritele sunt afișate primele.');
  if (typeof setupToolbar.__syncToUI === 'function') setupToolbar.__syncToUI();
};

$('openCompare').onclick  = openCompare;
$('clearCompare').onclick = () => { compare.clear(); updateCompare(); renderTools(); };
$('closeCompare').onclick = () => $('compareModal').classList.remove('show');
$('compareModal').onclick = e => { if (e.target.id === 'compareModal') $('compareModal').classList.remove('show'); };

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !window.commandOpen) {
    if (typeof closeDecision === 'function') closeDecision();
    $('compareModal').classList.remove('show');
  }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (typeof openCommandPalette === 'function') openCommandPalette();
  }
  if (e.key === '/' && !window.commandOpen
      && document.activeElement.tagName !== 'INPUT'
      && document.activeElement.tagName !== 'TEXTAREA'
      && !document.activeElement.isContentEditable) {
    e.preventDefault();
    if (typeof openCommandPalette === 'function') openCommandPalette();
  }
});

init();
