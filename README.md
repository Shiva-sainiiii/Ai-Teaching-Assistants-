# Margin

A teaching assistant for your documents. Upload a PDF or a photo of a page, then ask questions, write a summary, take a quiz and track progress. Text extraction and OCR run in the browser; only the relevant excerpts go to the AI.

## Features
- PDF and image upload with automatic OCR for scanned pages (PDF.js, Tesseract.js)
- Library of documents stored in the browser (IndexedDB): switch between them or ask across all of them
- Streaming chat and summaries with page-aware retrieval and follow-up memory; each answer shows which pages it read from
- Summary in three styles, copy, and save as PDF through the browser print dialog
- One-question-at-a-time quiz (5 or 10 questions) with explanations and a review of misses
- Voice input and read-aloud, switchable between English and Hindi
- Progress view: average score, study time, quiz history chart (Chart.js)
- Three palettes (emerald, orange, black and white), each in light and dark; sidebar layout on laptops, bottom tabs on phones
- Local-first storage with Firebase Firestore as a backup

## Run
Static site plus one serverless function. Deploy to Vercel and set `OPENROUTER_API_KEY` (optional: `OPENROUTER_MODEL`).

```
index.html      app shell and all views
dashboard.html  redirects to index.html#progress
css/styles.css  design tokens, layout, themes, print
js/script.js    upload, retrieval, chat, summary, quiz, voice, progress, sync
api/ask.js      OpenRouter proxy
```

MIT License
