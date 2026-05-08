#!/usr/bin/env node
/*
 * SIGNAL — market data collector
 *
 * Generates static market signals from safe APIs, then writes:
 *   data/market-signals.json
 *
 * Sources:
 * - GitHub API for open-source / developer-tool momentum
 * - Product Hunt GraphQL API when PRODUCT_HUNT_TOKEN is configured
 *
 * This script is intentionally server-side/offline. Do not expose Product Hunt
 * tokens in browser code.
 */

const fs = require('node:fs/promises');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const TOOLS_PATH = path.join(ROOT, 'tools-market.json');
const OUTPUT_DIR = path.join(ROOT, 'data');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'market-signals.json');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const PRODUCT_HUNT_TOKEN = process.env.PRODUCT_HUNT_TOKEN || '';

const GITHUB_REPOS_BY_TOOL = {
  'Hugging Face': 'huggingface/transformers',
  'LangChain': 'langchain-ai/langchain',
  'LlamaIndex': 'run-llama/llama_index',
  'Open WebUI': 'open-webui/open-webui',
  'Ollama': 'ollama/ollama',
  'Continue': 'continuedev/continue',
  'ComfyUI': 'comfyanonymous/ComfyUI',
  'n8n': 'n8n-io/n8n',
  'Flowise': 'FlowiseAI/Flowise',
  'Dify': 'langgenius/dify',
  'AnythingLLM': 'Mintplex-Labs/anything-llm',
  'DeepSeek': 'deepseek-ai/DeepSeek-V3',
  'Qwen / Tongyi Qianwen': 'QwenLM/Qwen'
};

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function readTools() {
  const raw = await fs.readFile(TOOLS_PATH, 'utf8');
  const data = JSON.parse(raw);
  return Array.isArray(data) ? data : data.tools || [];
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      'User-Agent': 'ai-productivity-radar-market-collector',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 180)}`);
  }

  return response.json();
}

async function fetchGitHubRepo(repo) {
  const headers = GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {};
  const data = await fetchJson(`https://api.github.com/repos/${repo}`, { headers });

  return {
    repo,
    stars: safeNumber(data.stargazers_count),
    forks: safeNumber(data.forks_count),
    openIssues: safeNumber(data.open_issues_count),
    watchers: safeNumber(data.subscribers_count),
    pushedAt: data.pushed_at || null,
    updatedAt: data.updated_at || null,
    url: data.html_url || `https://github.com/${repo}`,
    source: 'github'
  };
}

async function collectGitHubSignals(tools) {
  const knownNames = new Set(tools.map((tool) => normalizeText(tool.name)));
  const signals = [];
  const errors = [];

  for (const [toolName, repo] of Object.entries(GITHUB_REPOS_BY_TOOL)) {
    try {
      const repoSignal = await fetchGitHubRepo(repo);
      signals.push({
        toolName,
        slug: slugify(toolName),
        known: knownNames.has(normalizeText(toolName)),
        ...repoSignal
      });
    } catch (error) {
      errors.push({ source: 'github', toolName, repo, message: error.message });
    }
  }

  return { signals, errors };
}

async function collectProductHuntSignals() {
  if (!PRODUCT_HUNT_TOKEN) {
    return {
      signals: [],
      errors: [],
      skipped: true,
      reason: 'PRODUCT_HUNT_TOKEN is not configured'
    };
  }

  const query = `
    query RecentAiPosts {
      posts(first: 50, order: NEWEST) {
        edges {
          node {
            id
            name
            tagline
            votesCount
            commentsCount
            website
            url
            createdAt
            topics(first: 10) {
              edges { node { name slug } }
            }
          }
        }
      }
    }
  `;

  try {
    const data = await fetchJson('https://api.producthunt.com/v2/api/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PRODUCT_HUNT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    if (data.errors) throw new Error(JSON.stringify(data.errors).slice(0, 500));

    const signals = (data?.data?.posts?.edges || [])
      .map((edge) => edge.node)
      .filter((post) => {
        const hay = normalizeText([
          post.name,
          post.tagline,
          ...(post.topics?.edges || []).map((topic) => topic.node?.name)
        ].join(' '));
        return /\b(ai|llm|agent|automation|productivity|coding|research|video|data)\b/.test(hay);
      })
      .map((post) => ({
        toolName: post.name,
        slug: slugify(post.name),
        tagline: post.tagline || '',
        votes: safeNumber(post.votesCount),
        comments: safeNumber(post.commentsCount),
        website: post.website || '',
        productHuntUrl: post.url || '',
        createdAt: post.createdAt || null,
        topics: (post.topics?.edges || []).map((topic) => topic.node?.name).filter(Boolean),
        source: 'product-hunt'
      }));

    return { signals, errors: [], skipped: false };
  } catch (error) {
    return { signals: [], errors: [{ source: 'product-hunt', message: error.message }], skipped: false };
  }
}

function scoreGitHub(signal) {
  const stars = safeNumber(signal.stars);
  const forks = safeNumber(signal.forks);
  const pushedAt = signal.pushedAt ? new Date(signal.pushedAt).getTime() : 0;
  const daysSincePush = pushedAt ? (Date.now() - pushedAt) / 86400000 : 999;

  const starScore = Math.min(60, Math.log10(stars + 1) * 14);
  const forkScore = Math.min(20, Math.log10(forks + 1) * 6);
  const freshnessScore = daysSincePush <= 14 ? 20 : daysSincePush <= 45 ? 12 : daysSincePush <= 120 ? 6 : 0;

  return Math.round(starScore + forkScore + freshnessScore);
}

function scoreProductHunt(signal) {
  const votes = safeNumber(signal.votes);
  const comments = safeNumber(signal.comments);
  const createdAt = signal.createdAt ? new Date(signal.createdAt).getTime() : 0;
  const daysSinceLaunch = createdAt ? (Date.now() - createdAt) / 86400000 : 999;

  const voteScore = Math.min(70, Math.log10(votes + 1) * 22);
  const commentScore = Math.min(15, Math.log10(comments + 1) * 8);
  const recencyScore = daysSinceLaunch <= 7 ? 15 : daysSinceLaunch <= 30 ? 10 : daysSinceLaunch <= 90 ? 5 : 0;

  return Math.round(voteScore + commentScore + recencyScore);
}

function buildRecommendations({ github, productHunt }) {
  const githubItems = github.signals.map((signal) => ({
    ...signal,
    score: scoreGitHub(signal),
    recommendationType: signal.known ? 'update-existing' : 'candidate-open-source',
    rationale: signal.known
      ? `Actualizează semnalul GitHub: ${signal.stars} stars, pushed ${signal.pushedAt || 'unknown'}.`
      : `Candidat open-source: ${signal.stars} stars și activitate GitHub.`
  }));

  const productHuntItems = productHunt.signals.map((signal) => ({
    ...signal,
    score: scoreProductHunt(signal),
    recommendationType: 'candidate-launch',
    rationale: `Lansare Product Hunt cu ${signal.votes} upvotes și ${signal.comments} comentarii.`
  }));

  return [...githubItems, ...productHuntItems]
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);
}

async function main() {
  const tools = await readTools();
  const github = await collectGitHubSignals(tools);
  const productHunt = await collectProductHuntSignals();
  const recommendations = buildRecommendations({ github, productHunt });

  const output = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sources: {
      github: {
        enabled: true,
        note: GITHUB_TOKEN ? 'Authenticated with GITHUB_TOKEN' : 'Unauthenticated GitHub API, rate limit is lower',
        count: github.signals.length
      },
      productHunt: {
        enabled: Boolean(PRODUCT_HUNT_TOKEN),
        skipped: Boolean(productHunt.skipped),
        note: productHunt.skipped ? productHunt.reason : 'Product Hunt API queried',
        count: productHunt.signals.length
      }
    },
    recommendations,
    raw: {
      github: github.signals,
      productHunt: productHunt.signals
    },
    errors: [...github.errors, ...productHunt.errors]
  };

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');

  console.log(`Generated ${path.relative(ROOT, OUTPUT_PATH)}`);
  console.log(`Recommendations: ${recommendations.length}`);
  if (output.errors.length) console.warn(`Warnings: ${output.errors.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
