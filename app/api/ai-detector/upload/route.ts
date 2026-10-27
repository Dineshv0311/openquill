import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";
import { analyzeAiContent } from "@/lib/aiDetectorEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const filename = file.name || "uploaded-document.pdf";
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    let fullText = "";
    const pageBreakdown: Array<{
      pageNumber: number;
      words: number;
      aiPercent: number;
      humanPercent: number;
      preview: string;
    }> = [];

    const isPdf =
      filename.toLowerCase().endsWith(".pdf") ||
      file.type === "application/pdf";

    if (isPdf) {
      const pdfData = await extractText(uint8Array);
      const rawPages = Array.isArray(pdfData.text)
        ? pdfData.text
        : [pdfData.text || ""];

      const cleanedPages: string[] = [];

      rawPages.forEach((rawPageText: string, index: number) => {
        const clean = (rawPageText || "").replace(/\r\n/g, "\n").trim();
        if (clean) {
          cleanedPages.push(clean);
          const pageWords = clean.split(/\s+/).filter(Boolean).length;
          const pageAnalysis = analyzeAiContent(clean);

          pageBreakdown.push({
            pageNumber: index + 1,
            words: pageWords,
            aiPercent: pageAnalysis.overallAiPercent,
            humanPercent: pageAnalysis.humanPercent,
            preview: clean.slice(0, 160) + (clean.length > 160 ? "..." : ""),
          });
        }
      });

      fullText = cleanedPages.join("\n\n");
    } else {
      // Plain text or markdown
      fullText = Buffer.from(arrayBuffer).toString("utf-8").trim();
      const words = fullText.split(/\s+/).filter(Boolean).length;
      const analysis = analyzeAiContent(fullText);

      pageBreakdown.push({
        pageNumber: 1,
        words,
        aiPercent: analysis.overallAiPercent,
        humanPercent: analysis.humanPercent,
        preview: fullText.slice(0, 160) + (fullText.length > 160 ? "..." : ""),
      });
    }

    if (!fullText.trim()) {
      return NextResponse.json(
        {
          error:
            "Could not extract readable text from the uploaded PDF. It may be scanned as an image or password protected.",
        },
        { status: 422 }
      );
    }

    const overallReport = analyzeAiContent(fullText);
    const totalWords = fullText.split(/\s+/).filter(Boolean).length;

    return NextResponse.json({
      success: true,
      filename,
      fileSize: file.size,
      totalPages: Math.max(1, pageBreakdown.length),
      totalWords,
      extractedText: fullText,
      overallAiPercent: overallReport.overallAiPercent,
      humanPercent: overallReport.humanPercent,
      verdict: overallReport.verdict,
      sentences: overallReport.sentences,
      pageBreakdown,
    });
  } catch (error: any) {
    console.error("PDF upload detection error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to parse and analyze PDF file" },
      { status: 500 }
    );
  }
}
