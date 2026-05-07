# AI Productivity Radar

Un ghid modern pentru tooluri AI, organizat pe categorii, regiuni, preț și tip de utilizare (standalone/API).

## Features

- filtre inteligente (categorie, preț, regiune, tip AI);
- toggle pentru ascundere/afișare rapidă la filtrele **Categorie** + **Preț**;
- stare filtre și toggle salvată în `localStorage`;
- radar de trend + metadata extinsă pentru fiecare tool;
- badge special pentru tooluri **🇷🇴 Made in Romania**;
- import/export JSON.

## Clasificare AI: Standalone vs API-based

Fiecare tool include:

- `type`: `standalone`, `api-based`, `hybrid`, `integrated`, `platform`
- `apiAvailable`: disponibilitate API public
- `apiInfo`: detalii concrete despre API
- `integrations`: platforme compatibile (Zapier, Make.com, n8n, LangChain etc.)
- `standaloneNote`: cum îl poți folosi direct fără integrare

### Cum filtrezi rapid

1. Selectezi regiunea (ex: **România**)
2. Selectezi tipul AI (ex: **Standalone** sau **API-based**)
3. Opțional ascunzi filtrele de categorie/preț din butonul toggle pentru o interfață mai simplă

## 🇷🇴 AI-uri Made in Romania

Setul curent include:

- LobeChat
- Agora AI
- NovaAI
- RoboChat
- TextLang AI
- Brainscale
- UiPath AI Center
- Bitdefender AI Security

### De ce contează ecosistemul local

- acces mai bun la suport în limba română;
- aliniere mai bună la piața și fluxurile de lucru locale;
- susținerea startup-urilor și companiilor tech românești.

## Stack

- HTML + CSS + JS vanilla
- GitHub Pages ready
- JSON extensibil
- fără backend obligatoriu
