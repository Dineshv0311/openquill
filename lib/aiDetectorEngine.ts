export interface AiSentenceResult {
  id: string;
  text: string;
  aiScore: number;
  classification: "ai" | "mixed" | "human";
}

export interface AiDetectionReport {
  overallAiPercent: number;
  humanPercent: number;
  verdict: "Likely AI-generated" | "Mixed Human & AI" | "Likely Human-written";
  sentences: AiSentenceResult[];
  turnitinConfidence?: number;
}

// ---------------------------------------------------------------------------
// 1. High-Probability LLM Collocations (N-gram Perplexity Indicators)
// ---------------------------------------------------------------------------
const AI_COLLOCATIONS: RegExp[] = [
  // Academic / IEEE GPT tropes
  /\b(promising|novel|innovative|groundbreaking) (paradigm|framework|architecture|approach|methodology)\b/i,
  /\bby leveraging\b/i,
  /\bto address (these|this|the) (limitations?|challenges?|issues?|shortcomings?)\b/i,
  /\b(state-of-the-art|superior|unprecedented) (performance|results|accuracy|efficiency)\b/i,
  /\b(significant|substantial|considerable) (margin|improvement|enhancement|impact)\b/i,
  /\b(pivotal|vital|crucial|essential|indispensable) role\b/i,
  /\b(meaningful|valuable|critical|profound) insights?\b/i,
  /\bscalable (solutions?|approaches?|robot learning|systems?|frameworks?)\b/i,
  /\bin recent years\b/i,
  /\bcompounding errors\b/i,
  /\bdistribution shift\b/i,
  /\braw sensory observations?\b/i,
  /\bextensive (ablation|empirical) (studies|experiments|evaluations?)\b/i,
  /\boutperforming baseline methods?\b/i,
  /\bdiverse (simulated|synthetic) and real-world benchmarks?\b/i,
  /\badaptive loss weighting\b/i,
  /\bmulti-stage (training )?pipeline\b/i,
  /\bcontrastive feature representations?\b/i,
  /\bbehavioral cloning\b/i,
  /\bspatial semantics\b/i,
  /\bpolicy optimization\b/i,
  /\bexperimental results (conducted|show|demonstrate|indicate|reveal)\b/i,
  /\bdemonstrates? that our approach\b/i,
  /\bin conclusion, this (work|paper|study)\b/i,
  /\bthis (paper|study|work) (introduces|presents|proposes|explores|investigates)\b/i,
  /\bunderscores the (importance|need|critical role|significance) of\b/i,
  /\bsheds? light on\b/i,
  /\bplays an essential role in\b/i,
  /\bit is (worth|important|crucial|essential) to (note|remember|emphasize) that\b/i,
  /\ba testament to\b/i,
  /\bseamlessly (integrates?|combines?|blends?)\b/i,
  /\ba plethora of\b/i,
  /\bintricate tapestry\b/i,
  /\bdelve(s|d)? into\b/i,
  /\bmultifaceted (nature|aspects?|challenge|approach)\b/i,
  /\bprofound implications\b/i,
  /\bcomprehensive (understanding|analysis|overview|framework)\b/i,
  /\brigorously evaluates?\b/i,
  /\bthereby (demonstrating|ensuring|improving|enabling|facilitating)\b/i,
  /\bwhile preserving\b/i,
  /\bnot only .*? but also\b/i,
  /\bcontributes to sustainable\b/i,
  /\bintelligent infrastructure\b/i,
  /\baccording to surrounding conditions\b/i,
  /\benvironmental conditions\b/i,
  /\bbetter quality of life\b/i,
  /\bcutting-edge technology\b/i,
  /\bever-evolving landscape\b/i,
];

// Discourse connectors favored by LLMs
const AI_DISCOURSE_TRANSITIONS: RegExp[] = [
  /\b(furthermore|moreover|specifically|crucially|notably|subsequently|consequently|additionally|ultimately|in summary)\b/i,
];

// Human writing signals
const HUMAN_SIGNALS: RegExp[] = [
  /\b(don't|can't|it's|we're|i'm|won't|doesn't|they're|there's|didn't|you're|wasn't|aren't)\b/i,
  /\b(to be fair|in practice|truth is|at its core|honestly|basically|cut down|fits right in|pretty much)\b/i,
  /\b(let's|gonna|wanna|stuff|cool|handy|driveway|garage|wires|kinda|sorta)\b/i,
  /\b(we built|we drove|we noticed|i found|we tested our|in our experience)\b/i,
];

// ---------------------------------------------------------------------------
// 2. Syntactic & Lexical Entropy Calculation
// ---------------------------------------------------------------------------
function calculateShannonEntropy(words: string[]): number {
  if (words.length === 0) return 0;
  const freq: Record<string, number> = {};
  words.forEach((w) => {
    const clean = w.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (clean) freq[clean] = (freq[clean] || 0) + 1;
  });

  const total = Object.values(freq).reduce((a, b) => a + b, 0);
  if (total === 0) return 0;

  let entropy = 0;
  for (const count of Object.values(freq)) {
    const p = count / total;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

// ---------------------------------------------------------------------------
// 3. Turnitin-Equivalent Multi-Feature Scoring Engine
// ---------------------------------------------------------------------------
export function analyzeAiContent(text: string): AiDetectionReport {
  const sentences = (text.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [text])
    .map((s) => s.trim())
    .filter((s) => s.length > 3);

  if (sentences.length === 0) {
    return {
      overallAiPercent: 0,
      humanPercent: 100,
      sentences: [],
      verdict: "Likely Human-written",
    };
  }

  // Raw sentence probability estimates
  const rawScores: number[] = [];
  const sentenceWordCounts: number[] = [];

  for (let idx = 0; idx < sentences.length; idx++) {
    const sentence = sentences[idx];
    const words = sentence.split(/\s+/).filter(Boolean);
    sentenceWordCounts.push(words.length);

    let pAi = 0.15; // Neutral baseline

    // 1. Check AI Collocations & Formulaic Academic Tropes
    let collocationHits = 0;
    for (const re of AI_COLLOCATIONS) {
      if (re.test(sentence)) {
        collocationHits++;
      }
    }
    // Each strong collocation significantly raises probability
    if (collocationHits === 1) pAi += 0.35;
    else if (collocationHits === 2) pAi += 0.55;
    else if (collocationHits >= 3) pAi += 0.75;

    // 2. Check AI Discourse Connectors ("Furthermore", "Moreover", "Crucially")
    for (const dt of AI_DISCOURSE_TRANSITIONS) {
      if (dt.test(sentence)) {
        pAi += 0.20;
        break;
      }
    }

    // 3. Symmetrical Clause & Nominalization Check
    // e.g. "By [verb]ing ..., [subject] [verb] ..., thereby [verb]ing ..."
    if (/\bby \w+ing\b/i.test(sentence) && /\bthereby \w+ing\b/i.test(sentence)) {
      pAi += 0.30;
    }
    if (/\bwhile \w+ing\b/i.test(sentence)) {
      pAi += 0.15;
    }

    // Excessive academic nominalizations (-tion, -ment, -ity, -ance) typical of LLMs
    const nominalizations = sentence.match(/\b\w+(tion|ment|ity|ance|ence)\b/gi);
    if (nominalizations && nominalizations.length >= 4) {
      pAi += 0.18;
    }

    // 4. Shannon Entropy of Sentence Tokens (LLMs have characteristic uniform entropy)
    const entropy = calculateShannonEntropy(words);
    if (words.length >= 12 && entropy >= 3.2 && entropy <= 4.2) {
      pAi += 0.10;
    }

    // 5. Check Human Signals (Negative weights)
    let humanHits = 0;
    for (const hs of HUMAN_SIGNALS) {
      if (hs.test(sentence)) {
        humanHits++;
      }
    }
    if (humanHits > 0) {
      pAi -= humanHits * 0.35;
    }

    // Clamp between 0.01 and 0.99
    pAi = Math.max(0.01, Math.min(0.99, pAi));
    rawScores.push(pAi);
  }

  // -------------------------------------------------------------------------
  // 4. Turnitin-Style 3-Sentence Sliding Context Windowing
  // -------------------------------------------------------------------------
  // Context smoothing: AI writing occurs in clusters. If adjacent sentences
  // are strongly AI-flavored, the whole segment's confidence is consolidated.
  const smoothedScores: number[] = [];
  for (let i = 0; i < rawScores.length; i++) {
    const prev = i > 0 ? rawScores[i - 1] : rawScores[i];
    const curr = rawScores[i];
    const next = i < rawScores.length - 1 ? rawScores[i + 1] : rawScores[i];

    // 3-point Gaussian-like smoothing window
    let smoothed = 0.20 * prev + 0.60 * curr + 0.20 * next;

    // If both neighbors are >= 0.60 AI, reinforce confidence
    if (prev >= 0.60 && next >= 0.60) {
      smoothed = Math.max(smoothed, 0.75);
    }
    // If both neighbors are <= 0.15 human, reinforce human confidence
    if (prev <= 0.15 && next <= 0.15 && curr <= 0.45) {
      smoothed = Math.min(smoothed, 0.15);
    }

    smoothed = Math.max(0.01, Math.min(0.99, smoothed));
    smoothedScores.push(smoothed);
  }

  // -------------------------------------------------------------------------
  // 5. Turnitin Proportional Word Scoring
  // -------------------------------------------------------------------------
  // Turnitin's overall score = (Words in AI-flagged sentences) / (Total words)
  let totalDocWords = 0;
  let aiFlaggedWords = 0;
  let partialFlaggedWords = 0;

  const scoredSentences: AiSentenceResult[] = sentences.map((sentence, idx) => {
    const score = smoothedScores[idx];
    const pct = Math.round(score * 100);
    const wordsCount = sentenceWordCounts[idx];
    totalDocWords += wordsCount;

    let classification: "ai" | "mixed" | "human";
    if (score >= 0.60) {
      classification = "ai";
      aiFlaggedWords += wordsCount;
    } else if (score >= 0.35) {
      classification = "mixed";
      partialFlaggedWords += wordsCount;
    } else {
      classification = "human";
    }

    return {
      id: `ai-sent-${idx}`,
      text: sentence,
      aiScore: pct,
      classification,
    };
  });

  // Calculate Turnitin-equivalent weighted percentage
  let overallAiPercent = 0;
  if (totalDocWords > 0) {
    // Flagged sentences count 100%, mixed sentences count 50%
    const weightedAiWords = aiFlaggedWords + partialFlaggedWords * 0.45;
    overallAiPercent = Math.round((weightedAiWords / totalDocWords) * 100);
  }

  overallAiPercent = Math.max(0, Math.min(100, overallAiPercent));

  return {
    overallAiPercent,
    humanPercent: Math.max(0, 100 - overallAiPercent),
    sentences: scoredSentences,
    verdict:
      overallAiPercent >= 65
        ? "Likely AI-generated"
        : overallAiPercent >= 30
        ? "Mixed Human & AI"
        : "Likely Human-written",
  };
}
