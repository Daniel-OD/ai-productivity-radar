#!/usr/bin/env node

/**
 * SIGNAL - JSON Validator
 * 
 * Validează structura și câmpurile obligatorii din tools-market.json.
 * 
 * Rulare: node scripts/validate-tools.js
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const { resolveToolUrl } = require('./tool-url-resolver');
const ajv = new Ajv({ allErrors: true, strict: false });

const pricingTierSchema = {
  type: 'object',
  required: ['name', 'price', 'desc'],
  properties: {
    name: { type: 'string', minLength: 1 },
    price: { type: 'string', minLength: 1 },
    desc: { type: 'string', minLength: 1 },
    highlight: { type: 'boolean' }
  },
  additionalProperties: false
};

// Schema pentru validarea unui tool individual
const toolSchema = {
  type: 'object',
  required: ['name', 'cats', 'price', 'country', 'region', 'tagline'],
  properties: {
    name: { type: 'string', minLength: 1 },
    cats: { 
      type: 'array', 
      items: { type: 'string' },
      minItems: 1 
    },
    price: { 
      type: 'string', 
      enum: ['gratuit', 'freemium', 'platit'] 
    },
    country: { type: 'string', minLength: 1 },
    region: { 
      type: 'string', 
      enum: ['america', 'europa', 'asia', 'israel', 'romania'] 
    },
    tagline: { type: 'string', minLength: 5 },
    when: { type: 'string', minLength: 5 },
    url: { type: 'string', format: 'uri' },
    trend: { type: 'number', minimum: 0, maximum: 100 },
    lastUpdated: { type: 'string' },
    badges: { 
      type: 'array', 
      items: { type: 'string' } 
    },
    audience: { type: 'string' },
    source: { type: 'string' },
    type: { 
      type: 'string', 
      enum: ['hybrid', 'standalone', 'integrated', 'api-based', 'platform'] 
    },
    apiAvailable: { type: 'boolean' },
    apiInfo: { type: 'string' },
    integrations: { 
      type: 'array', 
      items: { type: 'string' } 
    },
    standaloneNote: { type: 'string' },
    bestFor: {
      type: 'array',
      items: { type: 'string' }
    },
    notIdeal: {
      type: 'array',
      items: { type: 'string' }
    },
    strengths: {
      type: 'array',
      items: { type: 'string' }
    },
    similar: {
      type: 'array',
      items: { type: 'string' }
    },
    pricing: { type: 'string' },
    trendExplanation: { type: 'string' },
    longDescription: { type: 'string' },
    features: {
      type: 'array',
      items: { type: 'string' }
    },
    useCases: {
      type: 'array',
      items: { type: 'string' }
    },
    platforms: {
      type: 'array',
      items: { type: 'string' }
    },
    pricingTiers: {
      type: 'array',
      items: pricingTierSchema
    }
  },
  additionalProperties: false
};

// Schema pentru întregul fișier tools-market.json
const schema = {
  type: 'object',
  required: ['tools', 'updatedAt'],
  properties: {
    tools: {
      type: 'array',
      items: toolSchema,
      minItems: 1
    },
    updatedAt: { type: 'string' },
    sourceNote: { type: 'string' }
  },
  additionalProperties: false
};

// Compile schema
const validate = ajv.compile(schema);

// Cale către fișierul tools-market.json
const toolsFilePath = path.join(__dirname, '..', 'tools-market.json');

function validateTools() {
  console.log('🔍 Validating tools-market.json...\n');
  
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
    console.error('   → File is not valid JSON. Please fix syntax errors.');
    process.exit(1);
  }
  
  // Validare cu schema
  const isValid = validate(data);
  
  if (isValid) {
    console.log('✅ tools-market.json is valid!');
    console.log(`   → Found ${data.tools.length} tools`);
    console.log(`   → Last updated: ${data.updatedAt || 'N/A'}`);
    
    // Validări suplimentare
    const errors = performAdditionalValidations(data);
    if (errors.length > 0) {
      console.log('\n⚠️  Additional validation warnings:');
      errors.forEach(error => console.log(`   → ${error}`));
      process.exit(1);
    }
    
    process.exit(0);
  } else {
    console.error('❌ tools-market.json validation failed:\n');
    validate.errors.forEach(error => {
      const toolIndex = error.instancePath.split('/')[1];
      const toolName = toolIndex !== undefined && data.tools[toolIndex] 
        ? data.tools[toolIndex].name 
        : 'Unknown';
      console.error(`   → Tool "${toolName}" (index ${toolIndex}): ${error.message}`);
    });
    process.exit(1);
  }
}

function performAdditionalValidations(data) {
  const errors = [];
  
  // Verifică duplicate names
  const names = new Set();
  data.tools.forEach((tool, index) => {
    if (names.has(tool.name)) {
      errors.push(`Duplicate tool name: "${tool.name}" (first at index ${Array.from(names).indexOf(tool.name)}, then at ${index})`);
    } else {
      names.add(tool.name);
    }
  });
  
  // Verifică că URL-urile încep cu http/https
  data.tools.forEach((tool, index) => {
    if (tool.url && !/^https?:\/\//i.test(tool.url)) {
      errors.push(`Tool "${tool.name}" has invalid URL: "${tool.url}" (must start with http:// or https://)`);
    }

    const resolved = resolveToolUrl(tool);
    if (!resolved.url) {
      errors.push(`Tool "${tool.name}" could not be mapped to a usable URL`);
    }
  });
  
  // Verifică că trend e între 0 și 100
  data.tools.forEach((tool, index) => {
    if (typeof tool.trend !== 'undefined' && (tool.trend < 0 || tool.trend > 100)) {
      errors.push(`Tool "${tool.name}" has invalid trend value: ${tool.trend} (must be between 0 and 100)`);
    }
  });
  
  // Verifică că regiunea corespunde țării
  data.tools.forEach((tool, index) => {
    const countryToRegion = {
      'SUA': 'america', 'Canada': 'america',
      'China': 'asia', 'Japonia': 'asia', 'Coreea de Sud': 'asia', 'India': 'asia', 'Australia': 'asia',
      'Franța': 'europa', 'Germania': 'europa', 'UK': 'europa', 'România': 'europa',
      'Israel': 'israel'
    };
    
    const expectedRegion = countryToRegion[tool.country];
    if (expectedRegion && tool.region !== expectedRegion) {
      errors.push(`Tool "${tool.name}" has inconsistent region: country is "${tool.country}" but region is "${tool.region}" (expected: "${expectedRegion}")`);
    }
  });
  
  return errors;
}

// Rulează validarea
validateTools();
