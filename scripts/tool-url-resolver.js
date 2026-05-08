const OFFICIAL_URLS = {
  'chatgpt': 'https://chatgpt.com',
  'claude': 'https://claude.ai',
  'perplexity': 'https://www.perplexity.ai',
  'cursor': 'https://cursor.com',
  'deepseek': 'https://chat.deepseek.com',
  'qwen': 'https://chat.qwen.ai',
  'tongyi qianwen': 'https://chat.qwen.ai',
  'mistral': 'https://chat.mistral.ai',
  'le chat': 'https://chat.mistral.ai',
  'hugging face': 'https://huggingface.co',
  'notebooklm': 'https://notebooklm.google.com',
  'julius': 'https://julius.ai',
  'power bi copilot': 'https://powerbi.microsoft.com',
  'synthesia': 'https://www.synthesia.io',
  'kimi': 'https://kimi.com',
  'manus': 'https://manus.im',
  'photoroom': 'https://www.photoroom.com',
  'stability ai': 'https://stability.ai',
  'stable diffusion': 'https://stability.ai',
  'github copilot': 'https://github.com/features/copilot',
  'canva': 'https://www.canva.com',
  'figma': 'https://www.figma.com/ai',
  'copy ai': 'https://www.copy.ai',
  'naver hyperclova x': 'https://clova-x.naver.com'
};

const TOOL_DOMAINS = {
  'chatgpt': 'chatgpt.com',
  'claude': 'claude.ai',
  'perplexity': 'perplexity.ai',
  'cursor': 'cursor.com',
  'deepseek': 'deepseek.com',
  'mistral': 'mistral.ai',
  'le chat': 'mistral.ai',
  'hugging face': 'huggingface.co',
  'notebooklm': 'notebooklm.google.com',
  'julius': 'julius.ai',
  'julius ai': 'julius.ai',
  'power bi copilot': 'powerbi.microsoft.com',
  'synthesia': 'synthesia.io',
  'canva': 'canva.com',
  'figma': 'figma.com',
  'github copilot': 'github.com',
  'midjourney': 'midjourney.com',
  'runway': 'runwayml.com',
  'runway ml': 'runwayml.com',
  'stability ai': 'stability.ai',
  'stable diffusion': 'stability.ai',
  'kimi': 'kimi.moonshot.cn',
  'manus': 'manus.im',
  'photoroom': 'photoroom.com',
  'notion ai': 'notion.so',
  'grammarly': 'grammarly.com',
  'gemini': 'gemini.google.com',
  'copilot': 'copilot.microsoft.com',
  'microsoft copilot': 'copilot.microsoft.com',
  'qwen': 'qwen.ai',
  'tongyi qianwen': 'qwen.ai',
  'n8n': 'n8n.io',
  'make': 'make.com',
  'zapier': 'zapier.com',
  'hex': 'hex.tech',
  'reclaim': 'reclaim.ai',
  'reclaim ai': 'reclaim.ai',
  'granola': 'granola.so',
  'windsurf': 'windsurf.com',
  'codeium': 'codeium.com',
  'jasper': 'jasper.ai',
  'jasper ai': 'jasper.ai',
  'copy ai': 'copy.ai',
  'copy.ai': 'copy.ai',
  'copyai': 'copy.ai',
  'gamma': 'gamma.app',
  'elevenlabs': 'elevenlabs.io',
  'eleven labs': 'elevenlabs.io',
  'heygen': 'heygen.com',
  'hey gen': 'heygen.com',
  'murf': 'murf.ai',
  'murf ai': 'murf.ai',
  'suno': 'suno.com',
  'suno ai': 'suno.com',
  'descript': 'descript.com',
  'kling': 'klingai.com',
  'kling ai': 'klingai.com',
  'ideogram': 'ideogram.ai',
  'leonardo': 'leonardo.ai',
  'leonardo ai': 'leonardo.ai',
  'adobe firefly': 'firefly.adobe.com',
  'firefly': 'firefly.adobe.com',
  'consensus': 'consensus.app',
  'elicit': 'elicit.org',
  'grok': 'x.ai',
  'meta ai': 'meta.ai',
  'bolt': 'bolt.new',
  'bolt.new': 'bolt.new',
  'v0': 'v0.dev',
  'v0.dev': 'v0.dev',
  'lovable': 'lovable.dev',
  'amazon q': 'aws.amazon.com',
  'amazon q developer': 'aws.amazon.com',
  'cohere': 'cohere.com',
  'dall-e': 'openai.com',
  'dall e 3': 'openai.com',
  'aleph alpha': 'aleph-alpha.com',
  'ollama': 'ollama.com',
  'lm studio': 'lmstudio.ai',
  'tableau pulse': 'tableau.com',
  'thoughtspot': 'thoughtspot.com',
  'databricks assistant': 'databricks.com',
  'uipath': 'uipath.com',
  'uipath ai center': 'uipath.com',
  'bitdefender': 'bitdefender.com',
  'bitdefender ai security': 'bitdefender.com',
  'ai21': 'ai21.com',
  'ai21 labs jamba': 'ai21.com',
  'lobechat': 'lobechat.com',
  'naver hyperclova x': 'clova-x.naver.com'
};

function normKey(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function createNormalizedLookup(source) {
  return Object.entries(source).reduce((acc, [key, value]) => {
    acc[normKey(key)] = value;
    return acc;
  }, {});
}

const normalizedOfficialUrls = createNormalizedLookup(OFFICIAL_URLS);
const normalizedToolDomains = createNormalizedLookup(TOOL_DOMAINS);

function lookupNormalized(map, key) {
  if (map[key]) return map[key];
  const paddedKey = ` ${key} `;
  for (const [candidate, value] of Object.entries(map)) {
    const paddedCandidate = ` ${candidate} `;
    if (paddedKey.includes(paddedCandidate) || paddedCandidate.includes(paddedKey)) return value;
  }
  return '';
}

function resolveToolUrl(tool) {
  const explicitUrl = typeof tool?.url === 'string' ? tool.url.trim() : '';
  if (/^https?:\/\//i.test(explicitUrl)) {
    return { url: explicitUrl, source: 'explicit' };
  }

  const key = normKey(tool?.name);
  const officialUrl = lookupNormalized(normalizedOfficialUrls, key);
  if (officialUrl) {
    return { url: officialUrl, source: 'catalog' };
  }

  const domain = lookupNormalized(normalizedToolDomains, key);
  if (domain) {
    return { url: 'https://' + domain, source: 'domain' };
  }

  return {
    url: 'https://www.google.com/search?q=' + encodeURIComponent(String(tool?.name || 'AI tool') + ' official website'),
    source: 'search'
  };
}

module.exports = {
  normKey,
  resolveToolUrl
};
