import { SYNONYM_DICTIONARY } from "./thesaurus";

export type ParaphraseMode =
  | "STANDARD"
  | "FLUENCY"
  | "FORMAL"
  | "SIMPLE"
  | "CREATIVE"
  | "EXPAND"
  | "SHORTEN"
  | "ACADEMIC";

export interface ParaphraseOptions {
  mode: ParaphraseMode;
  synonymLevel: number; // 1 to 4
}

/**
 * Intelligent Paraphrase Transformer
 * Translates input text into paraphrased candidate according to mode & synonym strength.
 */
export function executeParaphrase(text: string, options: ParaphraseOptions): string {
  if (!text || !text.trim()) return "";

  const sentences = text.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [text];

  const paraphrasedSentences = sentences.map((sentence) => {
    return transformSentence(sentence.trim(), options.mode, options.synonymLevel);
  });

  return paraphrasedSentences.join(" ");
}

function transformSentence(sentence: string, mode: ParaphraseMode, strength: number): string {
  let words = sentence.split(/\s+/);

  // Mode-based structural transitions
  if (mode === "FORMAL" || mode === "ACADEMIC") {
    sentence = sentence
      .replace(/\bcan't\b/gi, "cannot")
      .replace(/\bdon't\b/gi, "do not")
      .replace(/\bwon't\b/gi, "will not")
      .replace(/\bit's\b/gi, "it is")
      .replace(/\bi'm\b/gi, "I am")
      .replace(/\bthey're\b/gi, "they are")
      .replace(/\blet's\b/gi, "let us")
      .replace(/\bkids\b/gi, "children")
      .replace(/\ba lot of\b/gi, "a substantial volume of")
      .replace(/\bbig\b/gi, "significant")
      .replace(/\bgood\b/gi, "advantageous")
      .replace(/\bget\b/gi, "obtain")
      .replace(/\bshow\b/gi, "demonstrate");
    words = sentence.split(/\s+/);
  } else if (mode === "SIMPLE") {
    sentence = sentence
      .replace(/\butilize\b/gi, "use")
      .replace(/\bfacilitate\b/gi, "help")
      .replace(/\bdemonstrate\b/gi, "show")
      .replace(/\bcommence\b/gi, "start")
      .replace(/\bsubstantial\b/gi, "large")
      .replace(/\bconsequently\b/gi, "so")
      .replace(/\bmoreover\b/gi, "also");
    words = sentence.split(/\s+/);
  } else if (mode === "SHORTEN") {
    sentence = sentence
      .replace(/\bin order to\b/gi, "to")
      .replace(/\bdue to the fact that\b/gi, "because")
      .replace(/\bat the present moment\b/gi, "now")
      .replace(/\bfor the purpose of\b/gi, "for")
      .replace(/\bin the event that\b/gi, "if")
      .replace(/\bhas the ability to\b/gi, "can");
    words = sentence.split(/\s+/);
  } else if (mode === "EXPAND") {
    sentence = sentence
      .replace(/\bimportant\b/gi, "exceptionally important and necessary")
      .replace(/\bhelp\b/gi, "provide comprehensive assistance to")
      .replace(/\bchange\b/gi, "gradually evolve and transform")
      .replace(/\bimprove\b/gi, "significantly enhance and refine");
    words = sentence.split(/\s+/);
  }

  // Synonym Replacement according to strength (1 to 4)
  // Higher strength = higher probability of replacement
  const replacementRate = [0.15, 0.35, 0.60, 0.85][strength - 1] ?? 0.35;

  const transformedWords = words.map((word, idx) => {
    // Keep short punctuation or common stop words
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, "");
    if (cleanWord.length <= 3) return word;

    const punctuationMatch = word.match(/[^a-zA-Z0-9]+$/);
    const trailingPunctuation = punctuationMatch ? punctuationMatch[0] : "";
    const isCapitalized = /^[A-Z]/.test(word);

    const synonyms = SYNONYM_DICTIONARY[cleanWord];
    if (synonyms && synonyms.length > 0) {
      // Deterministic pseudo-random based on word index & text length for stability
      const shouldReplace = ((idx * 17 + sentence.length) % 100) / 100 < replacementRate;
      if (shouldReplace) {
        // Choose synonym based on mode
        let picked = synonyms[0];
        if (mode === "FORMAL" || mode === "ACADEMIC") {
          picked = synonyms[synonyms.length - 1]; // More sophisticated words placed later
        } else if (mode === "CREATIVE") {
          picked = synonyms[Math.min(synonyms.length - 1, 2)];
        } else if (mode === "SIMPLE") {
          picked = synonyms[0];
        }

        if (isCapitalized) {
          picked = picked.charAt(0).toUpperCase() + picked.slice(1);
        }
        return picked + trailingPunctuation;
      }
    }
    return word;
  });

  return transformedWords.join(" ");
}
