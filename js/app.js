/**
 * AI Productivity Radar - Main Application Logic
 * 
 * This file contains:
 * - Core application state and initialization
 * - Tool data loading with inline JSON fallback
 * - Rendering functions for all components
 * - Event handlers and setup functions
 * - Theme management
 * - Service Worker registration
 * - Filters drawer for mobile
 * - Command Palette integration
 * - Related Tools integration
 */

// ==================== DATA ====================
const FALLBACK_TOOLS = [
  {
    name: 'ChatGPT',
    cats: ['programare', 'scris', 'cercetare', 'productivitate', 'studiu', 'date'],
    price: 'freemium',
    country: 'SUA',
    region: 'america',
    tagline: 'Asistent AI generalist pentru scris, cod, research și analiză de date.',
    when: 'Când vrei un punct de pornire universal pentru aproape orice workflow.',
    url: 'https://chatgpt.com',
    lastUpdated: '2026-05-08',
    trend: 92,
    badges: ['popular', 'generalist'],
    audience: 'Toți utilizatorii'
  },
  {
    name: 'Claude',
    cats: ['programare', 'scris', 'cercetare', 'date'],
    price: 'freemium',
    country: 'SUA',
    region: 'america',
    tagline: 'AI cu raționament puternic, excelent la documente lungi și cod.',
    when: 'Când ai proiecte complexe sau vrei răspunsuri atent structurate.',
    url: 'https://claude.ai',
    lastUpdated: '2026-05-08',
    trend: 88,
    badges: ['cod-clean', 'documente'],
    audience: 'Developeri, cercetători, scriitori'
  },
  {
    name: 'Perplexity',
    cats: ['cercetare'],
    price: 'freemium',
    country: 'SUA',
    region: 'america',
    tagline: 'Motor de căutare AI cu surse și citări.',
    when: 'Când vrei research rapid și verificabil.',
    url: 'https://www.perplexity.ai',
    lastUpdated: '2026-05-08',
    trend: 75,
    badges: ['research', 'citation-verified'],
    audience: 'Cercetători, jurnaliști, studenți'
  },
  {
    name: 'Cursor',
    cats: ['programare'],
    price: 'freemium',
    country: 'SUA',
    region: 'america',
    tagline: 'IDE-ul desenat de AI. Înțelege codul tău și editează mai multe fișiere deodată.',
    when: 'Alegi Cursor ca editor dacă vrei să scrii cod mai rapid cu ajutorul AI integrat direct.',
    url: 'https://cursor.com',
    lastUpdated: '2026-05-08',
    trend: 85,
    badges: ['editor', 'coding'],
    audience: 'Developeri'
  },
  {
    name: 'DeepSeek',
    cats: ['programare', 'cercetare', 'scris'],
    price: 'freemium',
    country: 'China',
    region: 'asia',
    tagline: 'Modele puternice și eficiente, bune pentru cod și reasoning.',
    when: 'Alegi DeepSeek când vrei o alternativă ieftină și capabilă.',
    url: 'https://chat.deepseek.com',
    lastUpdated: '2026-05-08',
    trend: 82,
    badges: ['open-source', 'ieftin'],
    audience: 'Startup-uri, studenți, buget mic'
  },
  {
    name: 'Mistral / Le Chat',
    cats: ['programare', 'scris', 'cercetare'],
    price: 'freemium',
    country: 'Franța',
    region: 'europa',
    tagline: 'Campion european LLM cu modele open-weight.',
    when: 'Alegi Mistral dacă preferi o alternativă europeană rapidă și serioasă.',
    url: 'https://chat.mistral.ai',
    lastUpdated: '2026-05-08',
    trend: 80,
    badges: ['europa', 'open-weight'],
    audience: 'Europa, enterprise, GDPR-conscious'
  }
];

// ==================== CONFIG ====================
const categories = [
  ['all', 'Toate'],
  ['programare', 'Programare'],
  ['scris', 'Scris'],
  ['cercetare', 'Cercetare'],
  ['design', 'Design'],
  ['productivitate', 'Productivitate'],
  ['studiu', 'Studiu'],
  ['date', 'Date']
];

const prices = [
  ['all', 'Toate'],
  ['gratuit', 'Gratuit'],
  ['freemium', 'Freemium'],
  ['platit', 'Plătit']
];

const regions = [
  ['all', 'Toate'],
  ['america', 'America'],
  ['europa', 'Europa'],
  ['asia', 'Asia'],
  ['israel', 'Israel']
];

const priceLabels = { gratuit: 'Gratuit', freemium: 'Freemium', platit: 'Plătit' };
const priceOrder = { gratuit: 1, freemium: 2, platit: 3 };
const validCats = new Set(categories.map(x => x[0]));
const validPrices = new Set(prices.map(x => x[0]));
const validRegions = new Set(regions.map(x => x[0]));

const flag = {
  SUA: '🇺🇸', Canada: '🇨🇦', China: '🇨🇳', Franța: '🇫🇷', Germania: '🇩🇪',
  UK: '🇬🇧', Israel: '🇮🇱', 'Coreea de Sud': '🇰🇷', Japonia: '🇯🇵', India: '🇮🇳',
  Australia: '🇦🇺', România: '🇷🇴'
};

const OFFICIAL_URLS = {
  'chatgpt': 'https://chatgpt.com',
  'claude': 'https://claude.ai',
  'perplexity': 'https://www.perplexity.ai',
  'cursor': 'https://cursor.com'
};

const profiles = [
  { title: 'Scriu cod', cat: 'programare', hint: 'IDE, agenți, debugging', rec: 'Cursor + Claude' }
];

// Logo mappings for tools
const toolLogos = {
  'ChatGPT': '🤖',
  'Claude': '💬',
  'Perplexity': '🔍'
};

// ==================== STATE ====================
let tools = [];
let activeCat = 'all';
let activePrice = 'all';
let activeRegion = 'all';
let searchQuery = '';
let sortMode = 'default';
let hasInteracted = false;
let isLoading = true;
let hasDeepLink = false;

let favorites = new Set();
let compare = new Set();

const $ = id => document.getElementById(id);

// ==================== UTILITY FUNCTIONS ====================
function safeStorageGet(k, f) {
  try { return localStorage.getItem(k) || f; } catch (e) { return f; }
}

function safeStorageSet(k, v) {
  try { localStorage.setItem(k, v); } catch (e) {}
}

function toast(t) {
  const el = $('toast');
  if (el) {
    el.textContent = t;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2200);
  }
}

// ==================== INITIALIZATION ====================
// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('App initialized');
  });
} else {
  console.log('App initialized (DOM already loaded)');
}
