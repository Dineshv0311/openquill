import { NextRequest, NextResponse } from "next/server";
import { executeParaphrase, ParaphraseMode } from "@/lib/paraphraserEngine";
import { alignParaphraseDiff } from "@/lib/diffAligner";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, mode = "STANDARD", synonymLevel = 2 } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const outputText = executeParaphrase(text, {
      mode: mode as ParaphraseMode,
      synonymLevel: Number(synonymLevel) || 2,
    });

    const tokens = alignParaphraseDiff(text, outputText);

    return NextResponse.json({
      success: true,
      mode,
      synonymLevel,
      originalText: text,
      paraphrasedText: outputText,
      tokens,
      stats: {
        inputWords: text.trim().split(/\s+/).filter(Boolean).length,
        outputWords: outputText.trim().split(/\s+/).filter(Boolean).length,
        changesCount: tokens.filter((t) => t.type !== "unchanged").length,
      },
    });
  } catch (error) {
    console.error("Paraphrase API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
