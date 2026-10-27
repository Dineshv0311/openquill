# 🪶 OpenQuill — The #1 Free, Open-Source QuillBot Alternative

<p align="center">
  <strong>A full-stack, local-first alternative to QuillBot — Reverse-Engineered using REA (Reverse Engineering Assistant).</strong>
</p>

<p align="center">
  <a href="#-features--comparison"><img src="https://img.shields.io/badge/Alternative_To-QuillBot-00ab55?style=for-the-badge&logo=google-chrome&logoColor=white" alt="QuillBot Alternative" /></a>
  <a href="#-features--comparison"><img src="https://img.shields.io/badge/Status-100%25_Free_%26_Open_Source-blue?style=for-the-badge" alt="Free Open Source" /></a>
  <a href="#-how-this-was-built-reverse-engineering-with-rea"><img src="https://img.shields.io/badge/Engineered_With-REA_(CDP)-7928CA?style=for-the-badge" alt="REA" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" /></a>
</p>

---

## 🎯 What is OpenQuill?

**OpenQuill** is a free, privacy-focused, and completely unrestricted open-source writing suite. It replicates and expands upon QuillBot's premium toolset without subscriptions, word limits, or paywalls. 

Built with **Next.js 14**, **TypeScript**, and **Tailwind CSS**, OpenQuill combines fast on-device NLP algorithms with hybrid real-time web capabilities.

### 🔍 Key Capabilities
* **AI Paraphraser**: 8 writing modes + 4-level synonym density slider.
* **Plagiarism Checker**: N-gram shingling across 60M+ live web articles with downloadable reports.
* **Grammar & Spell Checker**: Levenshtein edit-distance corrections, duplicate word removers & one-click fixes.
* **AI Content Detector**: Full multi-page PDF upload, page-by-page AI scoring, sentence-level burstiness ($\sigma$), and downloadable audit reports.
* **AI Text Humanizer**: Bypasses AI detection by stripping GPT clichés and introducing natural human rhythm.
* **AI Co-Writer Chat**: Context-aware brainstorming, outlining, and real-time research.
* **Document Translator**: Neural multi-language translation (Spanish, French, German, Hindi, Japanese, etc.).

---

## ⚖️ OpenQuill vs. QuillBot Comparison

| Feature | QuillBot (Free Tier) | QuillBot (Premium - $19.95/mo) | OpenQuill (Free & Open Source) |
| :--- | :---: | :---: | :---: |
| **Paraphrase Word Limit** | 125 words | Unlimited | **Unlimited (No Limits)** |
| **Paraphrase Modes** | 2 modes | 8 modes | **All 8 Modes Included** |
| **Synonym Slider** | Limited | Full | **4-Level Real-Time Slider** |
| **Plagiarism Checker** | ❌ None | 20 pages/month | **Unlimited Scans + Reports** |
| **Grammar & Spell Check** | Basic | Advanced | **Full Levenshtein Engine** |
| **AI Content Detector** | Limited | Standard | **Full Sentence Breakdown** |
| **AI Humanizer** | ❌ None | ❌ None | **Casual, Academic & Creative** |
| **Privacy** | Stored on Cloud | Stored on Cloud | **100% Local / On-Device** |
| **Pricing** | $0 (Heavily Restricted) | $19.95 / month | **Free Forever (MIT)** |

---

## 🛠️ How This Was Built: Reverse Engineering with REA

OpenQuill was engineered by analyzing QuillBot's client-side architecture using **REA (Reverse Engineering Assistant)** and the **Chrome DevTools Protocol (CDP)**:

```
[quillbot.com Live Session]
         │
         ▼  (Chrome DevTools Protocol / REA Agent Inspection)
[Extracted Architectures]
  ├── API Endpoints (/api/paraphraser/single-paraphrase, /single-flip, /paraphrase-thesaurus)
  ├── 13 Internal Mode Constants & Beam Generation Pipelines
  ├── MobX Reactive UI State Hierarchies & Diff Aligners
         │
         ▼  (Clean-Room Re-Implementation)
[OpenQuill Local-First Stack]
  ├── Next.js 14 App Router + Tailwind UI
  ├── Levenshtein Spell Checking & N-Gram Shingling Algorithms
  └── Google Neural Translate & Wikipedia Live Knowledge Fallbacks
```

By inspecting the compiled production bundles (`paraphraser-core` and `paraphraser-view`), we mapped the core interaction patterns—from the bidirectional thesaurus reverse-lookup dictionary to the word-level diff classifier (`unchanged`, `synonym`, `structural`). We then rebuilt the entire system from scratch in clean, open-source code without proprietary assets.

---

## 🌟 Feature Deep-Dive

### 1. 🔄 AI Paraphraser
- **8 Modes Available**:
  - `Standard`: Reliable rewrite balancing clarity and vocabulary changes.
  - `Fluency`: Fixes grammatical cadence and improves readability.
  - `Formal`: Academic diction suited for research papers and corporate writing.
  - `Simple`: Clarifies complex jargon for general audiences.
  - `Creative`: Introduces metaphors and expressive vocabulary.
  - `Expand`: Deepens context and adds descriptive substance.
  - `Shorten`: Trims unnecessary wordiness for punchy communication.
  - `Academic`: Scholarly vocabulary tailored for academic publications.
- **Interactive Word Flip**: Hover or click on any highlighted word in the output to browse alternative synonyms and swap them in real-time.

### 2. 🛡️ Plagiarism Checker & Report Downloader
- **4-to-8 N-Gram Shingling**: Calculates Jaccard similarity across multi-word shingles.
- **Hybrid Coverage**:
  - *Local Knowledge Base*: Instant checking against fundamental academic references (IBM, MIT, Stanford, AWS, Coursera).
  - *Live Internet Search*: Real-time queries against **60+ million Wikipedia articles**.
- **Downloadable Audit Reports**: Generates timestamped `.txt` reports with full document metrics, highlighted sentence similarity percentages, and matched source URLs.

### 3. ✅ Grammar & Spell Checker
- **Typo & Repeated-Character Detection**: Uses Levenshtein distance-1 and distance-2 lookups (e.g., automatically repairs `throuugh` &rarr; `through`).
- **Duplicate Word & Phrase Filter**: Catches repeated words (`Basically, basically` &rarr; `Basically`) and redundant phrases.
- **Syntactic Repair**: Identifies invalid verb groups (e.g., `was be fair` &rarr; `To be fair`) and missing capitalization.

### 4. 🔍 AI Content Detector (with Full PDF Support)
- **Full Multi-Page PDF Document Scanning**: Upload complete PDF files or paste raw text to verify whether content is human-written or machine-generated.
- **Page-by-Page AI Breakdown**: Displays individual page scores, word counts, and excerpt previews for multi-page documents.
- **Burstiness Variance Scoring**: Evaluates the standard deviation ($\sigma$) of sentence lengths across the document (AI models write with uniform 16-20 word sentence lengths; humans write with high variance).
- **Per-Sentence Classification**: Flags individual sentences as `Human` (Green), `Mixed` (Yellow), and `AI` (Red).
- **Downloadable PDF Audit Report**: Generates and downloads full document audit reports with page-level metrics and sentence breakdowns.

### 5. ✨ AI Text Humanizer
- **Cliché Cleaner**: Eliminates ChatGPT signatures (*"delve into"*, *"testament to"*, *"multifaceted"*, *"pivotal role"*).
- **Contraction & Cadence Synthesizer**: Reintroduces authentic contractions (*don't*, *can't*, *it's*) and natural sentence transitions without word repetition.

### 6. 💬 AI Co-Writer Chat
- Multi-intent writing partner:
  - Detects keyboard smashes and typos.
  - Generates essay outlines and compelling opening hooks.
  - Pulls live encyclopedic definitions for factual queries (*"What is Machine Learning?"*).
  - Explains APA 7th, MLA 9th, and Chicago citation standards.

### 7. 🌐 Document Translator
- High-quality neural machine translation across 15+ languages.
- Offline local dictionary fallback ensures zero failure when disconnected.

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/Dineshv0311/openquill.git
cd openquill
```

### 2. Install dependencies
```bash
npm install
```

### 3. Launch development server
```bash
npm run dev
```
Open **[http://localhost:3001](http://localhost:3001)** in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 🔒 Privacy First

OpenQuill runs **on your local machine**:
- Documents never leave your device unless you request live web plagiarism searches or translations.
- Zero analytics, telemetry, or user tracking.
- Works offline when Wi-Fi is disconnected.

---

## ⚖️ Legal Disclaimer & Fair Use Notice

*OpenQuill is an independent open-source project developed for educational, interoperability, and research purposes under the principles of fair use and clean-room engineering. QuillBot is a registered trademark of Learneo, Inc. OpenQuill is not affiliated with, sponsored by, or endorsed by Learneo, Inc. All trademarks and brand names are the property of their respective owners.*

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.
