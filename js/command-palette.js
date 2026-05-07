// PR #2 — Command Palette Stabilization
// Task-aware ranking utilities extracted from the inline prototype.
// This module is intentionally side-effect free so it can be tested before wiring into index.html.

export const TASK_INTENTS = [
  {
    id: 'date',
    label: 'analiză de date / Excel / CSV',
    cats: ['date'],
    words: ['excel', 'csv', 'tabel', 'date', 'analiza', 'analizez', 'grafic', 'dashboard', 'bi', 'statistici', 'raport', 'spreadsheet', 'sql', 'insight', 'forecast', 'predictie', 'dataset']
  },
  {
    id: 'programare',
    label: 'programare / cod / debugging',
    cats: ['programare'],
    words: ['cod', 'code', 'programare', 'programez', 'bug', 'debug', 'debugging', 'ide', 'aplicatie', 'app', 'script', 'python', 'javascript', 'refactor', 'repo', 'github', 'developer', 'dezvoltare']
  },
  {
    id: 'cercetare',
    label: 'research / surse / PDF',
    cats: ['cercetare', 'studiu'],
    words: ['research', 'cercetare', 'surse', 'pdf', 'articol', 'document', 'documente', 'studiu', 'studiez', 'rezumat', 'sinteza', 'citari', 'bibliografie', 'paper', 'raport', 'citesc', 'invatare', 'invat']
  },
  {
    id: 'design',
    label: 'design / imagine / video / avatar',
    cats: ['design'],
    words: ['design', 'imagine', 'imagini', 'poza', 'foto', 'poster', 'logo', 'avatar', 'video', 'clip', 'vizual', 'background', 'prezentare', 'creativ', 'art', 'animatie', 'render']
  },
  {
    id: 'scris',
    label: 'scris / copy / texte',
    cats: ['scris'],
    words: ['scriu', 'scris', 'text', 'email', 'copy', 'copywriting', 'blog', 'postare', 'linkedin', 'traduc', 'traducere', 'rescriu', 'corectez', 'gramatica', 'content', 'document']
  },
  {
    id: 'productivitate',
    label: 'productivitate / automatizare / taskuri',
    cats: ['productivitate'],
    words: ['productivitate', 'automatizare', 'automatizez', 'task', 'taskuri', 'workflow', 'meeting', 'sedinta', 'calendar', 'notite', 'organizare', 'agent', 'agent autonom', 'operational']
  },
  {
    id: 'gratis',
    label: 'buget gratuit sau ieftin',
    price: ['gratuit', 'freemium'],
    words: ['gratis', 'gratuit', 'free', 'ieftin', 'buget', 'low cost', 'cost mic', 'fara bani', 'trial']
  },
  {
    id: 'europa',
    label: 'preferință Europa',
    region: 'europa',
    words: ['europa', 'european', 'europeana', 'franta', 'germania', 'uk', 'gdpr', 'suveranitate']
  }
];

export function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function commandHaystack(tool) {
  return normalizeText([
    tool.name,
    tool.tagline,
    tool.when,
    tool.country,
    tool.region,
    tool.price,
    tool.apiInfo,
    tool.standaloneNote,
    tool.audience,
    ...(tool.cats || []),
    ...(tool.badges || [])
  ].join(' '));
}

export function detectTaskIntents(query) {
  const normalizedQuery = normalizeText(query);

  return TASK_INTENTS
    .map((intent) => {
      const hits = intent.words.filter((word) => normalizedQuery.includes(normalizeText(word)));
      return hits.length ? { intent, hits } : null;
    })
    .filter(Boolean);
}

export function rankToolForTask(tool, query) {
  const normalizedQuery = normalizeText(query);
  const haystack = commandHaystack(tool);
  const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);
  const matchedIntents = detectTaskIntents(query);

  let score = 0;
  const reasons = new Set();

  if (!normalizedQuery) {
    return {
      tool,
      score: Number(tool.trend || 0),
      reason: 'Popular acum'
    };
  }

  for (const word of queryWords) {
    if (word.length > 1 && haystack.includes(word)) score += 7;
  }

  if (normalizeText(tool.name).includes(normalizedQuery)) score += 60;

  for (const match of matchedIntents) {
    const intent = match.intent;

    if (intent.cats) {
      const overlap = intent.cats.filter((cat) => (tool.cats || []).includes(cat)).length;
      if (overlap) {
        score += 34 * overlap;
        reasons.add(intent.label);
      }
    }

    if (intent.price && intent.price.includes(tool.price)) {
      score += 16;
      reasons.add(intent.label);
    }

    if (intent.region && tool.region === intent.region) {
      score += 18;
      reasons.add(intent.label);
    }
  }

  if (Number(tool.trend || 0) >= 85) score += 8;
  if (tool.price === 'gratuit' || tool.price === 'freemium') score += 3;

  return {
    tool,
    score,
    reason: Array.from(reasons).slice(0, 2).join(' · ') || 'Potrivire după nume, descriere sau categorie'
  };
}

export function getCommandRecommendations(tools, query, limit = 8) {
  return tools
    .map((tool) => rankToolForTask(tool, query))
    .filter((result) => !query || result.score > 0)
    .sort((a, b) => b.score - a.score || Number(b.tool.trend || 0) - Number(a.tool.trend || 0))
    .slice(0, limit);
}
