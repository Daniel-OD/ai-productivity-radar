# AI Productivity Radar

Un ghid modern pentru tooluri AI, organizat pe categorii, regiuni, preț și tip de utilizare (standalone/API).

## Features

- filtre inteligente (categorie, preț, regiune, tip AI);
- toggle pentru ascundere/afișare rapidă la filtrele **Categorie** + **Preț**;
- stare filtre și toggle salvată în `localStorage`;
- radar de trend + metadata extinsă pentru fiecare tool;
- **Tool Decision Modal**: click pe orice card afișează detalii extinse (Best for, Strengths, Integrations, Pricing, Similar tools) cu acțiuni rapide (Open site, Compare, Favorite);
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

## Cum funcționează tehnic

### Sursa de date: `tools-market.json`

Toate toolurile sunt definite în fișierul `tools-market.json` din rădăcina repo-ului. Pagina `index.html` îl citește direct în browser prin `fetch`.  
Format acceptat: array de tooluri direct sau obiect `{ updatedAt, tools: [...] }`.
`url` poate lipsi; în acest caz, aplicația și scripturile de validare folosesc un catalog intern de URL-uri canonice sau fallback search.
Pentru tooluri noi sau listări sensibile la acuratețe, preferă totuși un `url` explicit în dataset.

### Câmpuri per tool

| Câmp | Tip | Descriere |
|---|---|---|
| `type` | string | `standalone`, `api-based`, `hybrid`, `integrated`, `platform` |
| `url` | string | URL oficial opțional; dacă lipsește, UI-ul și scripturile folosesc catalogul intern de URL-uri/fallback search |
| `apiAvailable` | boolean | Dacă există un API public |
| `apiInfo` | string | Detalii concrete despre API |
| `integrations` | string[] | Platforme compatibile (Zapier, Make.com, n8n, LangChain etc.) |
| `standaloneNote` | string | Cum îl poți folosi direct, fără integrare |

### Câmpuri opționale pentru Tool Decision Modal

Aceste câmpuri sunt afișate în modalul detaliat care se deschide la click pe un card. Toate sunt opționale; dacă lipsesc, modalul afișează un placeholder.

| Câmp | Tip | Descriere |
|---|---|---|
| `bestFor` | string[] | Scenarii ideale de utilizare (ex: `["Cod complex", "Documente lungi"]`) |
| `notIdeal` | string[] | Cazuri în care toolul nu e recomandat |
| `strengths` | string[] | Puncte forte distinctive |
| `similar` | string[] | Tooluri similare sau alternative (ex: `["Claude", "Gemini"]`) |
| `pricing` | string | Detalii de preț (ex: `"Gratuit · Pro $20/lună · API pay-as-you-go"`) |
| `trendExplanation` | string | Explicație narativă pentru scorul de trend |

### Actualizare automată (GitHub Actions + Render)

GitHub Actions poate actualiza `tools-market.json` pe un schedule sau la push, iar Render redeployează pagina automat după fiecare commit pe `main`. Astfel ghidul rămâne viu fără backend propriu.

### Sync / Export / Import JSON

Funcționalitățile de Sync, Export și Import JSON sunt disponibile din cod (JavaScript) pentru scenarii de contribuție sau testare locală:

- **Sync**: reîncarcă `tools-market.json` din rețea fără refresh de pagină.
- **Export**: descarcă setul curent de tooluri ca fișier `.json`.
- **Import**: înlocuiește dataset-ul cu un fișier `.json` local.

Aceste butoane sunt omise din interfața principală pentru a păstra pagina curată pentru utilizatorul final. Poți reintroduce elementele cu ID-urile `syncBtn`, `exportBtn` și `importJson` dacă ai nevoie de ele.
