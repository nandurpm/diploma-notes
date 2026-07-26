# Data Files

JSON and data files that power the POLY PMNA portal's dynamic content. These files are loaded at runtime by JavaScript modules.

## Revision 2026 Data

| File | Loaded By | Purpose |
|------|-----------|---------|
| `revision-2026-programmes.json` | `revision-2026-browser.js` | List of all 39+ departments/programmes with slugs, official codes, and metadata. |
| `revision-2026-subjects.json` | `revision-2026-browser.js` | Complete subject database for Revision 2026 (code, name, programme, semester, type). |
| `rev2026-programme-status.json` | `revision-2026-browser.js` | Status flags for each programme (active, lessons available, notes available). |

## Quiz Data

| File | Loaded By | Purpose |
|------|-----------|---------|
| `quiz-subjects.json` | `quiz-core.js` | Quiz subject metadata (names, codes, question counts). |

## Site Configuration

| File | Loaded By | Purpose |
|------|-----------|---------|
| `site-config.json` | `poly-config.js` | Site-wide configuration: API endpoints, feature flags, cache durations. |

## Asset Indexes

| File | Loaded By | Purpose |
|------|-----------|---------|
| `asset-manifest.json` | `asset-manifest.js` | Index of all lesson content assets for the site assistant's search. |

## Knowledge Base

| File | Loaded By | Purpose |
|------|-----------|---------|
| `knowledge-base.json` | `ask-poly-knowledge.js` | Global knowledge base for Ask POLY AI responses. |
