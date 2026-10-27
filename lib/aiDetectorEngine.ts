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
}

// Explicit AI markers commonly produced by LLMs
const HIGH_AI_PATTERNS = [
  /\bfurthermore\b/i,
  /\bmoreover\b/i,
  /\bdelve\b/i,
  /\btestament to\b/i,
  /\bin conclusion\b/i,
  /\bpivotal role\b/i,
  /\bvital role\b/i,
  /\bintricate tapestry\b/i,
  /\bseamlessly integrates\b/i,
  /\bmultifaceted\b/i,
  /\ba plethora of\b/i,
  /\bit is essential to remember\b/i,
  /\bit is important to remember\b/i,
  /\bprofound implications\b/i,
  /\bserves as a testament\b/i,
];

// Human indicators: contractions, conversational flow, informal particles
const HUMAN_SIGNALS = [
  /\b(don't|can't|it's|we're|i'm|won't|doesn't|they're|there's|didn't|you're)\b/i,
  /\b(to be fair|in practice|truth is|at its core|honestly|basically|cut down|fits right in)\b/i,
  /\b(let's|gonna|wanna|pretty much|stuff|cool|handy)\b/i,
];

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

  // Compute document burstiness (standard deviation of sentence length)
  const lengths = sentences.map((s) => s.split(/\s+/).length);
  const meanLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((acc, len) => acc + Math.pow(len - meanLength, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  // If stdDev is high (> 5.0), the writing has natural human burstiness
  const burstinessBonus = stdDev >= 5.0 ? -0.15 : stdDev <= 1.5 ? 0.15 : 0;

  let totalScore = 0;

  const scoredSentences: AiSentenceResult[] = sentences.map((sentence, idx) => {
    let score = 0.08 + burstinessBonus; // Realistic low base score

    // Check high AI clichés
    HIGH_AI_PATTERNS.forEach((p) => {
      if (p.test(sentence)) {
        score += 0.35;
      }
    });

    // Check human signals
    HUMAN_SIGNALS.forEach((p) => {
      if (p.test(sentence)) {
        score -= 0.30;
      }
    });

    // Clamp between 0.02 and 0.98
    score = Math.max(0.02, Math.min(0.98, score));
    totalScore += score;

    const pct = Math.round(score * 100);
    const classification: "ai" | "mixed" | "human" =
      pct >= 65 ? "ai" : pct >= 35 ? "mixed" : "human";

    return {
      id: `ai-sent-${idx}`,
      text: sentence,
      aiScore: pct,
      classification,
    };
  });

  const overallAiPercent = Math.round((totalScore / sentences.length) * 100);

  return {
    overallAiPercent,
    humanPercent: Math.max(0, 100 - overallAiPercent),
    sentences: scoredSentences,
    verdict:
      overallAiPercent >= 65
        ? "Likely AI-generated"
        : overallAiPercent >= 35
        ? "Mixed Human & AI"
        : "Likely Human-written",
  };
}
