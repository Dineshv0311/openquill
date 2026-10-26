import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, type = "paragraph", length = "medium" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const sentences = text.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [text];
    if (sentences.length <= 1) {
      return NextResponse.json({
        summary: text,
        reductionPercent: 0,
      });
    }

    // Score sentences by word frequency / importance
    const wordFreq: Record<string, number> = {};
    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    words.forEach((w) => {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    });

    const scored = sentences.map((s, idx) => {
      const sWords = s.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
      const score = sWords.reduce((acc, w) => acc + (wordFreq[w] || 0), 0) / (sWords.length || 1);
      return { sentence: s.trim(), score, idx };
    });

    // Fraction to keep
    const ratio = length === "short" ? 0.35 : length === "long" ? 0.75 : 0.5;
    const keepCount = Math.max(1, Math.round(sentences.length * ratio));

    const topSentences = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, keepCount)
      .sort((a, b) => a.idx - b.idx)
      .map((s) => s.sentence);

    let summary = "";
    if (type === "bullets") {
      summary = topSentences.map((s) => `• ${s}`).join("\n");
    } else {
      summary = topSentences.join(" ");
    }

    const originalWords = text.trim().split(/\s+/).length;
    const summaryWords = summary.trim().split(/\s+/).length;
    const reductionPercent = Math.max(0, Math.round(((originalWords - summaryWords) / originalWords) * 100));

    return NextResponse.json({
      success: true,
      type,
      length,
      summary,
      originalWords,
      summaryWords,
      reductionPercent,
    });
  } catch (error) {
    console.error("Summarize API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
