import { NextRequest, NextResponse } from "next/server";
import { generateHumanizedPdf, humanizeUploadedPdf } from "@/lib/pdfGenerator";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let text = "";
    let filename = "humanized-document.pdf";
    let title = "";
    let mode: "casual" | "academic" | "creative" = "academic";
    let originalFileBuffer: Uint8Array | null = null;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      const file = formData.get("file");
      if (file && file instanceof Blob) {
        const ab = await file.arrayBuffer();
        originalFileBuffer = new Uint8Array(ab);
        filename = (file as any).name || filename;
      }
      text = (formData.get("text") as string) || "";
      filename = (formData.get("filename") as string) || filename;
      title = (formData.get("title") as string) || "";
      mode = ((formData.get("mode") as any) || "academic");
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      text = body.text || "";
      filename = body.filename || filename;
      title = body.title || "";
      mode = body.mode || "academic";
    } else {
      text = await req.text();
    }

    // Determine output filename
    let outName = filename;
    if (outName.toLowerCase().endsWith(".pdf")) {
      outName = outName.replace(/\.pdf$/i, "-humanized.pdf");
    } else {
      outName = `${outName}-humanized.pdf`;
    }

    let pdfBytes: Uint8Array;

    if (originalFileBuffer && originalFileBuffer.byteLength > 0) {
      // In-place PDF preservation: keep exact original format, figures, tables, 2-column layout, and pages
      pdfBytes = await humanizeUploadedPdf(originalFileBuffer, mode);
    } else {
      if (!text.trim()) {
        return NextResponse.json(
          { error: "No text or PDF file provided for generation" },
          { status: 400 }
        );
      }
      pdfBytes = await generateHumanizedPdf(text, {
        title: title || filename.replace(/-humanized\.pdf$/i, "").replace(/\.pdf$/i, ""),
        filename: outName,
      });
    }

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(outName)}"`,
        "Content-Length": pdfBytes.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate PDF document" },
      { status: 500 }
    );
  }
}
