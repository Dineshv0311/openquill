import { NextRequest, NextResponse } from "next/server";
import { humanizeDocumentText } from "@/lib/humanizerEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { text, mode = "academic" } = await req.json();

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const result = humanizeDocumentText(text, mode);

    return NextResponse.json({
      success: true,
      originalText: text,
      humanizedText: result.humanizedText,
      originalAiPercent: result.originalAiPercent,
      humanizedAiPercent: result.humanizedAiPercent,
      originalHumanPercent: result.originalHumanPercent,
      humanizedHumanPercent: result.humanizedHumanPercent,
      verdictBefore: result.verdictBefore,
      verdictAfter: result.verdictAfter,
      humanScore: result.humanizedHumanPercent,
      changesCount: result.changesCount,
      readabilityGrade:
        result.humanizedAiPercent <= 20
          ? "Natural Human Cadence (Bypasses AI Detectors)"
          : "Significantly Humanized",
    });
  } catch (error: any) {
    console.error("Humanizer error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
