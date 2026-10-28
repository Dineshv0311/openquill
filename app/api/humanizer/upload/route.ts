import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";
import { humanizeDocumentText } from "@/lib/humanizerEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const mode = (formData.get("mode") as "casual" | "academic" | "creative") || "academic";

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No PDF file uploaded" }, { status: 400 });
    }

    const filename = file.name || "uploaded-document.pdf";
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    let fullText = "";
    let totalPages = 1;

    const isPdf =
      filename.toLowerCase().endsWith(".pdf") ||
      file.type === "application/pdf";

    if (isPdf) {
      const pdfData = await extractText(uint8Array);
      const rawPages = Array.isArray(pdfData.text)
        ? pdfData.text
        : [pdfData.text || ""];

      totalPages = rawPages.length;
      const cleanedPages: string[] = [];

      rawPages.forEach((rawPageText: string) => {
        const clean = (rawPageText || "").replace(/\r\n/g, "\n").trim();
        if (clean) {
          cleanedPages.push(clean);
        }
      });

      fullText = cleanedPages.join("\n\n");
    } else {
      fullText = Buffer.from(arrayBuffer).toString("utf-8").trim();
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

    const totalWords = fullText.split(/\s+/).filter(Boolean).length;
    const result = humanizeDocumentText(fullText, mode);

    return NextResponse.json({
      success: true,
      filename,
      fileSize: file.size,
      totalPages,
      totalWords,
      originalText: fullText,
      humanizedText: result.humanizedText,
      originalAiPercent: result.originalAiPercent,
      humanizedAiPercent: result.humanizedAiPercent,
      originalHumanPercent: result.originalHumanPercent,
      humanizedHumanPercent: result.humanizedHumanPercent,
      verdictBefore: result.verdictBefore,
      verdictAfter: result.verdictAfter,
      changesCount: result.changesCount,
      humanScore: result.humanizedHumanPercent,
    });
  } catch (error: any) {
    console.error("PDF upload humanization error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process and humanize PDF file" },
      { status: 500 }
    );
  }
}
