#!/usr/bin/env node

/**
 * SIGNAL - Link Checker
 * 
 * Verifică dacă URL-urile tool-urilor din tools-market.json sunt valide (HTTP 200).
 * 
 * Rulare: node scripts/check-links.js
 * 
 * Dependințe: axios (pentru request-uri HTTP)
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { resolveToolUrl } = require('./tool-url-resolver');
const HTTP_FORBIDDEN = 403;
const HTTP_METHOD_NOT_ALLOWED = 405;
const MAX_REDIRECTS = 5;

// Cale către fișierul tools-market.json
const toolsFilePath = path.join(__dirname, '..', 'tools-market.json');

// Configurare axios (timeout și user-agent)
const axiosInstance = axios.create({
  timeout: 10000, // 10 secunde timeout
  headers: {
    'User-Agent': 'AI-Productivity-Radar-Link-Checker/1.0'
  }
});

// Listă de user-agents pentru a evita blocarea (rotire)
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
];

async function checkLinks() {
  console.log('🔗 Checking links in tools-market.json...\n');
  
  // Citire fișier
  let rawData;
  try {
    rawData = fs.readFileSync(toolsFilePath, 'utf8');
  } catch (error) {
    console.error('❌ Error reading tools-market.json:', error.message);
    process.exit(1);
  }
  
  // Parsare JSON
  let data;
  try {
    data = JSON.parse(rawData);
  } catch (error) {
    console.error('❌ Error parsing tools-market.json:', error.message);
    process.exit(1);
  }
  
  if (!data.tools || !Array.isArray(data.tools)) {
    console.error('❌ Invalid data structure: tools array not found');
    process.exit(1);
  }
  
  console.log(`📊 Found ${data.tools.length} tools to check...\n`);
  
  // Filtrează tool-urile cu URL-uri
  const toolsWithUrls = data.tools.map(tool => {
    const resolved = resolveToolUrl(tool);
    return {
      ...tool,
      resolvedUrl: resolved.url,
      resolvedUrlSource: resolved.source
    };
  }).filter(tool => tool.resolvedUrl);
  
  // Grupează URL-urile pentru a evita duplicate
  const uniqueUrls = new Map();
  toolsWithUrls.forEach(tool => {
    if (!uniqueUrls.has(tool.resolvedUrl)) {
      uniqueUrls.set(tool.resolvedUrl, []);
    }
    uniqueUrls.get(tool.resolvedUrl).push({
      name: tool.name,
      source: tool.resolvedUrlSource,
      explicitUrl: tool.url || null
    });
  });
  console.log(`🔍 Checking ${uniqueUrls.size} unique URLs...\n`);
  
  // Rezultate
  const results = {
    total: uniqueUrls.size,
    success: 0,
    failed: 0,
    errors: 0,
    details: []
  };
  
  // Verifică fiecare URL
  for (const [url, toolRefs] of uniqueUrls) {
    const toolNames = toolRefs.map(tool => tool.name);
    try {
      // Alege un user-agent aleatoriu pentru a evita blocarea
      const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
      const response = await requestUrl(url, userAgent);
      
      const status = response.status;
      
      if (status === 200) {
        console.log(`✅ ${url} (used by: ${toolNames.join(', ')}) - Status: ${status}`);
        results.success++;
        results.details.push({
          url,
          toolNames,
          status,
          statusText: response.statusText,
          requestMethod: response.config.method.toUpperCase()
        });
      } else if (status >= 300 && status < 400) {
        // Redirect - considerăm OK
        console.log(`⚠️  ${url} (used by: ${toolNames.join(', ')}) - Redirect (${status})`);
        results.success++;
        results.details.push({
          url,
          toolNames,
          status,
          statusText: response.statusText,
          note: 'Redirect',
          requestMethod: response.config.method.toUpperCase()
        });
      } else {
        console.log(`❌ ${url} (used by: ${toolNames.join(', ')}) - Status: ${status}`);
        results.failed++;
        results.details.push({
          url,
          toolNames,
          status,
          statusText: response.statusText,
          error: `HTTP ${status}`,
          requestMethod: response.config.method.toUpperCase()
        });
      }
    } catch (error) {
      const errorMessage = error.response 
        ? `HTTP ${error.response.status} - ${error.response.statusText}`
        : error.code === 'ECONNABORTED' 
          ? 'Timeout' 
          : error.message;
      
      console.log(`❌ ${url} (used by: ${toolNames.join(', ')}) - Error: ${errorMessage}`);
      results.failed++;
      results.details.push({
        url,
        toolNames,
        status: null,
        statusText: null,
        error: errorMessage
      });
    }
    
    // Mic delay pentru a evita rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Afișează rezumat
  console.log('\n📈 Summary:');
  console.log(`   ✅ Success: ${results.success}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   📊 Total: ${results.total}`);
  
  if (results.failed > 0) {
    console.log('\n⚠️  Failed URLs:');
    results.details
      .filter(d => d.error || (d.status && d.status >= 400))
      .forEach(d => {
        console.log(`   → ${d.url} (${d.toolNames.join(', ')}) - ${d.error || `HTTP ${d.status}`}`);
      });
    process.exit(1);
  } else {
    console.log('\n✅ All URLs are valid!');
    process.exit(0);
  }
}

async function requestUrl(url, userAgent) {
  const headers = { 'User-Agent': userAgent };
  let response = await axiosInstance.head(url, {
    headers,
    maxRedirects: MAX_REDIRECTS,
    // We want to inspect non-2xx/3xx responses ourselves and optionally retry with GET.
    validateStatus: () => true
  });

  if ([HTTP_FORBIDDEN, HTTP_METHOD_NOT_ALLOWED].includes(response.status)) {
    response = await axiosInstance.get(url, {
      headers,
      maxRedirects: MAX_REDIRECTS,
      validateStatus: () => true
    });
  }

  return response;
}

// Rulează verificarea
checkLinks().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
