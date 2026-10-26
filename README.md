# 🪶 OpenQuill

> **The Free, Unlimited & Open-Source Writing, Paraphrasing, Plagiarism, Grammar & AI Detection Suite.**

OpenQuill is a full-stack, local-first replica of QuillBot offering 7 essential writing tools in a unified, modern interface. Built with **Next.js 14**, **TypeScript**, and **Tailwind CSS**, OpenQuill runs on-device algorithms with hybrid live-web capabilities for maximum speed, privacy, and zero paywalls.

---

## ✨ Features & Tools

### 1. 🔄 AI Paraphraser
- **8 Distinct Modes**:
  - `Standard`: Balanced clarity and natural vocabulary adjustments.
  - `Fluency`: Polishes grammar and sentence cadence.
  - `Formal`: Academic, research-oriented phrasing with elevated diction.
  - `Simple`: Straightforward communication for accessibility.
  - `Creative`: Expressive syntax and imaginative vocabulary.
  - `Expand`: Adds depth, context, and descriptive detail.
  - `Shorten`: Removes fluff for punchy, concise sentences.
  - `Academic`: Rigorous scholastic terminology with citation-friendly structure.
- **4-Level Synonym Slider**: Dynamically adjusts vocabulary substitution density.
- **Interactive Thesaurus**: Click any highlighted word to inspect alternative synonyms and substitute instantly.

### 2. 🛡️ Plagiarism Checker & Report Downloader
- **N-Gram Shingling Engine**: Uses 4-word sliding shingles and Jaccard similarity metrics to identify copied or paraphrased sequences.
- **Hybrid Architecture**:
  - *Local Corpus*: Pre-indexed academic definitions from IBM, MIT, Stanford, AWS, and Coursera.
  - *Live Internet Layer*: Real-time search across **60+ million Wikipedia articles**.
- **Formatted Report Generator**: Download comprehensive `.txt` scan reports containing exact similarity scores, match classification (Exact / Partial / Unique), and source citations with URLs.

### 3. ✅ Grammar & Spell Checker
- **Levenshtein Distance Spell Checker**: Detects typos and missing/extra characters (e.g., `throuugh` &rarr; `through`).
- **Duplicate Word & Phrase Scanner**: Automatically catches repeated words (`Basically, basically` &rarr; `Basically`) and repeated phrases.
- **Verb Group & Phrase Repair**: Fixes broken syntactic constructs (e.g., `was be fair` &rarr; `To be fair`).
- **One-Click Resolvers**: Accept suggestions individually or resolve all issues at once with "Fix All Errors".

### 4. 🔍 AI Content Detector
- **Burstiness Variance Scoring**: Evaluates the standard deviation ($\sigma$) of sentence lengths across the document (AI models write with uniform 16-20 word sentence lengths; humans write with high variance).
- **Per-Sentence Classification**: Flags sentences as `Human`, `Mixed`, or `AI` with color-coded risk indicators.

### 5. ✨ AI Text Humanizer
- **3 Modes**: `Casual`, `Academic`, and `Creative`.
- **Cliché Stripper**: Replaces telltale AI markers (*"the development of"*, *"is transforming"*, *"delve into"*, *"testament to"*).
- **Contraction & Rhythm Injection**: Inserts natural contractions and conversational openers without stuttering or word repetition.

### 6. 💬 AI Co-Writer Chat
- **Typo & Keyboard-Mash Filter**: Identifies keystroke smashes and clarifies user intent.
- **Live Knowledge Search**: Queries encyclopedia APIs for real-time concept definitions (*"What is Machine Learning?"*).
- **Drafting & Writing**: Generates multi-paragraph academic essays and articles on demand.
- **Quick Action Pills**: Instant generation for outlines, opening hooks, formal tone guidelines, APA/MLA citations, and counterarguments.

### 7. 🌐 Document Translator
- **Multi-Lingual Support**: Spanish, French, German, Hindi, Japanese, Chinese, Italian, Portuguese, and more.
- **Hybrid Engine**: Google Neural Translation online with offline local dictionary fallback.

---

## 🚀 Quick Start

### Prerequisites
- Node.js `v18+` or `v20+` (Node `v24` supported)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/Dineshv0311/openquill.git

# Navigate into project directory
cd openquill

# Install dependencies
npm install

# Start development server
npm run dev
```

Open **[http://localhost:3001](http://localhost:3001)** in your browser.

### Production Build

```bash
# Build production bundle
npm run build

# Start production server
npm run start
```

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions, API Routes)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Diff & Alignment**: `diff-match-patch`
- **NLP / Algorithms**:
  - Levenshtein Edit Distance
  - 4-Gram Shingling & Winnowing Fingerprinting
  - Sentence Length Variance Burstiness ($\sigma$)
  - Wikipedia Live Knowledge REST API
  - Google Neural Machine Translation

---

## 🔒 Privacy & Local-First Philosophy

OpenQuill is designed to run locally on your own machine.
- Your personal text, academic essays, and sensitive documents are processed on your local CPU.
- No text is logged or stored by third parties.
- Full offline fallback ensures functionality without Wi-Fi.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
