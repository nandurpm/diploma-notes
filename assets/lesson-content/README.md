# Quick Overview — English

- Purpose: Shared lesson fragments and reusable content blocks loaded into lesson pages. Use short, semantic HTML fragments for best printing results.

## ലഘു ഗൈഡ് — മലയാളം

- ഉദ്ദേശ്യം: പാഠങ്ങളുടെ പങ്കുകളായി ഉപയോഗിക്കുന്ന ഫ്രീഗ്മന്റുകൾ ഇവിടെ സൂക്ഷിക്കുന്നു. ക്ലീൻ semantic HTML ഉപയോഗിക്കുക; പ്രിന്റ് റിസൾട്ടുകൾ പരിശോധിക്കുക.

# Lesson Content

Shared lesson content fragments and reusable components loaded by lesson pages.

## Contents

This directory contains HTML fragments, JSON data, and shared content blocks that are dynamically loaded into lesson pages. These are used by the lesson rendering pipeline to populate lesson sections.

## File Types

| Type | Description |
|------|-------------|
| `.html` fragments | HTML content blocks injected into lesson panels |
| `.json` data | Structured lesson metadata and content indexes |

## Usage

Lesson pages (`lessons/lessons-[CODE].html`) load these content files dynamically via the `lesson-content-loader.js` script. The content is injected into `.panel` or `.view-section` elements based on the lesson structure.

## Relationship to Lesson Pages

- The `assets/js/lesson-navigation-fix.js` script reveals all sections containing this content
- The `assets/js/site-assistant.js` indexes this content for search functionality
- Lesson pages in `/lessons/` and `/revision-2026-content/lessons/` both reference these files
