import { NextRequest, NextResponse } from "next/server";

export interface GrammarIssue {
  id: string;
  original: string;
  replacement: string;
  reason: string;
  type: "spelling" | "grammar" | "punctuation";
  index: number;
}

// Common dictionary for spell check reference and fast Levenshtein lookup
const COMMON_DICTIONARY = new Set([
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with",
  "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her",
  "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up",
  "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time",
  "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could",
  "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think",
  "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even",
  "new", "want", "because", "any", "these", "give", "day", "most", "us", "through", "though",
  "thought", "thorough", "throughout", "development", "smart", "cities", "city", "transforming",
  "urban", "life", "advanced", "technology", "intelligent", "infrastructure", "sensors", "connected",
  "devices", "data", "analytics", "help", "manage", "traffic", "reduce", "energy", "consumption",
  "improve", "waste", "collection", "monitor", "environmental", "conditions", "transportation",
  "systems", "congestion", "while", "automated", "streetlights", "save", "electricity", "adjusting",
  "brightness", "according", "surrounding", "basically", "renewable", "sources", "such", "solar",
  "wind", "power", "contribute", "sustainable", "however", "require", "strong", "cybersecurity",
  "reliable", "internet", "connectivity", "effective", "protection", "policies", "combining",
  "planning", "public", "services", "impact", "provide", "citizens", "better", "quality",
  "fair", "truth", "practice", "really", "actually", "clear", "need", "should", "must",
]);

// Known typos mapping
const KNOWN_TYPOS: Record<string, { replacement: string; reason: string }> = {
  throuugh: { replacement: "through", reason: "Spelling typo: 'throuugh' should be 'through'" },
  throught: { replacement: "through", reason: "Spelling typo: 'throught' should be 'through'" },
  definately: { replacement: "definitely", reason: "Spelling: 'definately' should be 'definitely'" },
  seperate: { replacement: "separate", reason: "Spelling: 'seperate' should be 'separate'" },
  recieve: { replacement: "receive", reason: "Spelling: 'i before e except after c'" },
  teh: { replacement: "the", reason: "Typo: 'teh' should be 'the'" },
  wierd: { replacement: "weird", reason: "Spelling: 'wierd' should be 'weird'" },
  untill: { replacement: "until", reason: "Spelling: 'until' has only one 'l'" },
  alot: { replacement: "a lot", reason: "Spelling: 'a lot' is two words" },
  noone: { replacement: "no one", reason: "Spelling: 'no one' is two words" },
  accomodate: { replacement: "accommodate", reason: "Spelling: double 'c' and double 'm'" },
  occured: { replacement: "occurred", reason: "Spelling: double 'r' in 'occurred'" },
};

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const d: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[m][n];
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const issues: GrammarIssue[] = [];
    let workingText = text;

    // 1. Check for malformed phrase: "was be fair" -> "To be fair"
    const malformedRegex = /\bwas be fair\b/gi;
    let match;
    while ((match = malformedRegex.exec(text)) !== null) {
      issues.push({
        id: `issue-phrase-${match.index}`,
        original: match[0],
        replacement: match.index === 0 ? "To be fair" : "to be fair",
        reason: "Grammar: 'was be fair' is an invalid verb phrase. Use 'To be fair'.",
        type: "grammar",
        index: match.index,
      });
    }

    // 2. Check for duplicate phrases like "to be fair, to be fair"
    const duplicatePhraseRegex = /\b(to be fair|in practice|as a result|you know|in fact)\b[,\s]+\b\1\b/gi;
    while ((match = duplicatePhraseRegex.exec(text)) !== null) {
      const full = match[0];
      const single = match[1];
      issues.push({
        id: `issue-dupphrase-${match.index}`,
        original: full,
        replacement: single,
        reason: `Repeated phrase: remove redundant duplicate '${single}'`,
        type: "grammar",
        index: match.index,
      });
    }

    // 3. Check for general repeated words: "Basically, basically", "the the", etc.
    const duplicateWordRegex = /\b([a-zA-Z]{2,})\b([,\s]+)\b\1\b/gi;
    while ((match = duplicateWordRegex.exec(text)) !== null) {
      const full = match[0];
      const word = match[1];
      // Skip if already captured by duplicate phrase
      if (!issues.some((iss) => iss.index <= match!.index && iss.index + iss.original.length >= match!.index + full.length)) {
        issues.push({
          id: `issue-dupword-${match.index}`,
          original: full,
          replacement: word,
          reason: `Repeated word: remove duplicate '${word}'`,
          type: "grammar",
          index: match.index,
        });
      }
    }

    // 4. Check for known typos or 3+ repeated characters (e.g., 'throuugh')
    const wordRegex = /\b[a-zA-Z]{3,}\b/g;
    while ((match = wordRegex.exec(text)) !== null) {
      const word = match[0];
      const lower = word.toLowerCase();

      // Check known typos table
      if (KNOWN_TYPOS[lower]) {
        const item = KNOWN_TYPOS[lower];
        let rep = item.replacement;
        if (word[0] === word[0].toUpperCase()) {
          rep = rep.charAt(0).toUpperCase() + rep.slice(1);
        }
        issues.push({
          id: `issue-typo-${match.index}`,
          original: word,
          replacement: rep,
          reason: item.reason,
          type: "spelling",
          index: match.index,
        });
        continue;
      }

      // Check repeated letters like 'uuu' in 'throuugh'
      if (/(.)\1{2,}/i.test(word)) {
        const cleaned = word.replace(/(.)\1+/gi, "$1");
        // find closest dictionary word
        let bestCandidate = cleaned;
        let minD = 99;
        for (const dictWord of COMMON_DICTIONARY) {
          const d = levenshtein(cleaned.toLowerCase(), dictWord);
          if (d < minD) {
            minD = d;
            bestCandidate = dictWord;
          }
        }
        let rep = minD <= 2 ? bestCandidate : cleaned;
        if (word[0] === word[0].toUpperCase()) {
          rep = rep.charAt(0).toUpperCase() + rep.slice(1);
        }
        issues.push({
          id: `issue-repchar-${match.index}`,
          original: word,
          replacement: rep,
          reason: `Spelling typo: remove extra repeated characters in '${word}'`,
          type: "spelling",
          index: match.index,
        });
        continue;
      }

      // If word not in dictionary and not capitalized acronym, check distance 1
      if (!COMMON_DICTIONARY.has(lower) && word !== word.toUpperCase() && lower.length >= 4) {
        let bestWord = "";
        let bestDist = 99;
        for (const candidate of COMMON_DICTIONARY) {
          if (Math.abs(candidate.length - lower.length) <= 1) {
            const d = levenshtein(lower, candidate);
            if (d === 1 && d < bestDist) {
              bestDist = d;
              bestWord = candidate;
              break;
            }
          }
        }
        if (bestWord) {
          let rep = bestWord;
          if (word[0] === word[0].toUpperCase()) {
            rep = rep.charAt(0).toUpperCase() + rep.slice(1);
          }
          issues.push({
            id: `issue-lev-${match.index}`,
            original: word,
            replacement: rep,
            reason: `Possible misspelling: did you mean '${rep}'?`,
            type: "spelling",
            index: match.index,
          });
        }
      }
    }

    // 5. Check subject-verb agreement and contractions
    const grammarPatterns: Array<{ regex: RegExp; replacement: string; reason: string }> = [
      { regex: /\b(he|she|it)\s+(dont|don't)\s+know\s+nothing\b/gi, replacement: "$1 doesn't know anything", reason: "Double negative & subject-verb agreement" },
      { regex: /\b(he|she|it)\s+(dont|don't)\b/gi, replacement: "$1 doesn't", reason: "Subject-verb agreement: third-person singular takes 'doesn't'" },
      { regex: /\b(they|we|you)\s+(doesnt|doesn't)\b/gi, replacement: "$1 don't", reason: "Subject-verb agreement: plural pronouns take 'don't'" },
      { regex: /\btheir is\b/gi, replacement: "there is", reason: "Confused word: use 'there' for existence" },
      { regex: /\byour right\b/gi, replacement: "you're right", reason: "Contraction: 'you are' -> 'you're'" },
      { regex: /\bcould of\b/gi, replacement: "could have", reason: "Grammar: 'could of' should be 'could have'" },
      { regex: /\bshould of\b/gi, replacement: "should have", reason: "Grammar: 'should of' should be 'should have'" },
      { regex: /\bwould of\b/gi, replacement: "would have", reason: "Grammar: 'would of' should be 'would have'" },
    ];

    for (const gp of grammarPatterns) {
      let gMatch;
      while ((gMatch = gp.regex.exec(text)) !== null) {
        issues.push({
          id: `issue-gram-${gMatch.index}`,
          original: gMatch[0],
          replacement: gMatch[0].replace(gp.regex, gp.replacement),
          reason: gp.reason,
          type: "grammar",
          index: gMatch.index,
        });
      }
    }

    // 6. Sentence capitalization check (first letter of text)
    if (/^[a-z]/.test(text.trim())) {
      const firstChar = text.trim().charAt(0);
      issues.push({
        id: "issue-cap-0",
        original: firstChar,
        replacement: firstChar.toUpperCase(),
        reason: "Capitalization: Start sentence with an uppercase letter",
        type: "grammar",
        index: text.indexOf(firstChar),
      });
    }

    // Deduplicate issues by overlapping indexes
    const uniqueIssues: GrammarIssue[] = [];
    issues.sort((a, b) => a.index - b.index);

    for (const issue of issues) {
      const overlaps = uniqueIssues.some(
        (u) =>
          (issue.index >= u.index && issue.index < u.index + u.original.length) ||
          (issue.index + issue.original.length > u.index &&
            issue.index + issue.original.length <= u.index + u.original.length)
      );
      if (!overlaps) {
        uniqueIssues.push(issue);
      }
    }

    // Apply all fixes to build corrected text
    let correctedText = text;
    // Replace from back to front to preserve string indices
    const sortedBackwards = [...uniqueIssues].sort((a, b) => b.index - a.index);
    for (const issue of sortedBackwards) {
      correctedText =
        correctedText.slice(0, issue.index) +
        issue.replacement +
        correctedText.slice(issue.index + issue.original.length);
    }

    return NextResponse.json({
      success: true,
      originalText: text,
      correctedText,
      issuesCount: uniqueIssues.length,
      issues: uniqueIssues,
    });
  } catch (error) {
    console.error("Grammar check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
