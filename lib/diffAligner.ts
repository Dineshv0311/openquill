import { getSynonymsForWord } from "./thesaurus";

export type DiffSpanType = "unchanged" | "synonym" | "structural" | "inserted";

export interface WordToken {
  id: string;
  text: string;
  type: DiffSpanType;
  originalText?: string;
  synonyms: string[];
}

/**
 * Align original and paraphrased words, annotating changed tokens with
 * synonyms and change classification (matching QuillBot's single-flip).
 */
export function alignParaphraseDiff(originalText: string, paraphrasedText: string): WordToken[] {
  const origTokens = originalText.trim().split(/\s+/).filter(Boolean);
  const paraTokens = paraphrasedText.trim().split(/\s+/).filter(Boolean);

  const result: WordToken[] = [];

  // Simple token alignment
  let pIdx = 0;
  for (let i = 0; i < paraTokens.length; i++) {
    const pWord = paraTokens[i];
    const cleanP = pWord.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Check if exact match exists around current position
    let matchedInOrig = false;
    for (let oIdx = Math.max(0, pIdx - 2); oIdx < Math.min(origTokens.length, pIdx + 3); oIdx++) {
      const oWord = origTokens[oIdx];
      const cleanO = oWord.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (cleanP === cleanO) {
        matchedInOrig = true;
        pIdx = oIdx + 1;
        break;
      }
    }

    const availableSynonyms = getSynonymsForWord(pWord);

    if (matchedInOrig) {
      result.push({
        id: `token-${i}`,
        text: pWord,
        type: "unchanged",
        synonyms: availableSynonyms.slice(0, 5),
      });
    } else {
      // It was changed!
      const isSynonym = availableSynonyms.length > 0;
      result.push({
        id: `token-${i}`,
        text: pWord,
        type: isSynonym ? "synonym" : "structural",
        originalText: origTokens[i] || undefined,
        synonyms: availableSynonyms.slice(0, 5),
      });
    }
  }

  return result;
}
