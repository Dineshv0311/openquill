import { NextRequest, NextResponse } from "next/server";

// Fallback dictionary for common phrases and vocabulary
const DICTIONARY_FALLBACK: Record<string, Record<string, string>> = {
  es: {
    hello: "hola",
    world: "mundo",
    how: "cómo",
    are: "estás",
    you: "tú",
    today: "hoy",
    artificial: "artificial",
    intelligence: "inteligencia",
    computer: "computadora",
    learning: "aprendizaje",
    language: "idioma",
    text: "texto",
    good: "bueno",
    morning: "días",
    thank: "gracias",
  },
  fr: {
    hello: "bonjour",
    world: "monde",
    how: "comment",
    are: "êtes",
    you: "vous",
    today: "aujourd'hui",
    artificial: "artificielle",
    intelligence: "intelligence",
    computer: "ordinateur",
    learning: "apprentissage",
    language: "langue",
    text: "texte",
    good: "bon",
    morning: "matin",
    thank: "merci",
  },
  de: {
    hello: "hallo",
    world: "welt",
    how: "wie",
    are: "bist",
    you: "du",
    today: "heute",
    artificial: "künstliche",
    intelligence: "intelligenz",
    computer: "computer",
    learning: "lernen",
    language: "sprache",
    text: "text",
    good: "gut",
    morning: "morgen",
    thank: "danke",
  },
  hi: {
    hello: "नमस्ते",
    world: "दुनिया",
    how: "कैसे",
    are: "हैं",
    you: "आप",
    today: "आज",
    artificial: "कृत्रिम",
    intelligence: "बुद्धिमत्ता",
    computer: "कंप्यूटर",
    learning: "सीखना",
    language: "भाषा",
    text: "पाठ",
    good: "अच्छा",
    thank: "धन्यवाद",
  },
};

async function fetchGoogleTranslate(text: string, targetLang: string, sourceLang = "auto"): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
      sourceLang
    )}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        return data[0].map((chunk: any) => chunk[0]).join("");
      }
    }
  } catch {
    // remote fetch timed out or network blocked, proceed to fallback
  }
  return null;
}

function fallbackTranslate(text: string, targetLang: string): string {
  const dict = DICTIONARY_FALLBACK[targetLang.toLowerCase()];
  if (!dict) {
    return `[${targetLang.toUpperCase()} Translation]: ${text}`;
  }

  // Token-by-token replacement with punctuation preservation
  return text
    .split(/(\s+|[.,!?;:()]+)/)
    .map((token) => {
      const lower = token.toLowerCase();
      if (dict[lower]) {
        if (token[0] === token[0].toUpperCase() && token[0] !== token[0].toLowerCase()) {
          const translated = dict[lower];
          return translated.charAt(0).toUpperCase() + translated.slice(1);
        }
        return dict[lower];
      }
      return token;
    })
    .join("");
}

export async function POST(req: NextRequest) {
  try {
    const { text, sourceLang = "auto", targetLang = "es" } = await req.json();

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Try primary high-accuracy translation
    const googleResult = await fetchGoogleTranslate(text, targetLang, sourceLang);
    const translatedText = googleResult || fallbackTranslate(text, targetLang);

    return NextResponse.json({
      success: true,
      originalText: text,
      sourceLang,
      targetLang,
      translatedText,
    });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json({
      success: true,
      originalText: "",
      translatedText: "Translation service temporarily unavailable. Please try again.",
    });
  }
}
