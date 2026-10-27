import { NextRequest, NextResponse } from "next/server";
import { analyzeAiContent } from "@/lib/aiDetectorEngine";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const report = analyzeAiContent(text);

    return NextResponse.json({
      success: true,
      ...report,
    });
  } catch (error) {
    console.error("AI Detector error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
