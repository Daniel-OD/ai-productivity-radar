# AI Productivity Radar

Un ghid modern pentru tooluri AI, organizat pe categorii, regiuni și use-case-uri reale.

## Features

- filtre inteligente;
- radar de trend;
- tooluri europene și asiatice;
- persistare filtre;
- compare-ready architecture;
- import/export JSON;
- market signals;
- data analysis AI stack.

## Stack

- HTML + CSS + JS vanilla
- GitHub Pages ready
- JSON extensibil
- fără backend obligatoriu

## Planned

- auto updates;
- GitHub Actions market sync;
- Hugging Face/OpenRouter/Product Hunt ingestion;
- favorite sync;
- compare mode;
- AI stack recommendations.

## Îmbunătățiri recente

### Ascundere/Afișare dinamică pentru "Categorie" și "Preț"
Secțiunile de filtre "Categorie" și "Preț" pot fi ascunse și afișate dinamic direct din interfață.

#### Cum Funcționează
- Clasele **CSS** utilizează `.hidden` pentru a ascunde vizual secțiunea selectată.
- Funcția JavaScript `toggleFilter(filterId, button)` activează/dezactivează vizibilitatea secțiunii selectate.

#### Pași pentru utilizare
1. Apasă butonul `Ascunde` de lângă `Categorie` sau `Preț` pentru a ascunde secțiunea.
2. Apasă butonul `Arată` pentru a o face din nou vizibilă.
3. Comportamentul este definit în `index.html` (CSS + JavaScript inline).

---
Pentru mai multe detalii, contribuie direct sau deschide un issue pe GitHub repo.
