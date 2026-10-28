import { NextRequest, NextResponse } from "next/server";
import { generateHumanizedPdf } from "@/lib/pdfGenerator";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let text = "";
    let filename = "humanized-document.pdf";
    let title = "";

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      text = body.text || "";
      filename = body.filename || filename;
      title = body.title || "";
    } else if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      const formData = await req.formData();
      text = (formData.get("text") as string) || "";
      filename = (formData.get("filename") as string) || filename;
      title = (formData.get("title") as string) || "";
    } else {
      text = await req.text();
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "No text provided for PDF generation" },
        { status: 400 }
      );
    }

    // Ensure output filename ends with .pdf and has humanized tag
    let outName = filename;
    if (outName.toLowerCase().endsWith(".pdf")) {
      outName = outName.replace(/\.pdf$/i, "-humanized.pdf");
    } else if (!outName.toLowerCase().endsWith(".pdf")) {
      outName = `${outName}-humanized.pdf`;
    }

    const pdfBytes = await generateHumanizedPdf(text, {
      title: title || filename.replace(/-humanized\.pdf$/i, "").replace(/\.pdf$/i, ""),
      filename: outName,
    });

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
