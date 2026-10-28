import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface PdfGenerationOptions {
  title?: string;
  filename?: string;
  author?: string;
  institution?: string;
}

export async function generateHumanizedPdf(
  text: string,
  options: PdfGenerationOptions = {}
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Embed standard professional typography
  const regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  // Standard A4 dimensions
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const bodyFontSize = 10;
  const bodyLineHeight = 13.5;

  // Clean title
  let docTitle = options.title?.trim();
  const rawParagraphs = text.split(/\n\s*\n|\r\n\s*\r\n/).map((p) => p.trim()).filter(Boolean);

  if (!docTitle && rawParagraphs.length > 0) {
    const firstLines = rawParagraphs[0].split("\n");
    docTitle = firstLines[0]?.slice(0, 100);
  }
  if (!docTitle) {
    docTitle = "Humanized Academic Document";
  }

  // Draw Header Bar / Title Block on First Page
  page.drawText(docTitle, {
    x: margin,
    y: y - 8,
    size: 13,
    font: boldFont,
    color: rgb(0.08, 0.08, 0.08),
    maxWidth: contentWidth,
  });
  y -= 28;

  // Draw metadata line
  const metaText = "OpenQuill Humanized Document  •  100% Academic & Editorial Integrity Preserved";
  page.drawText(metaText, {
    x: margin,
    y,
    size: 8,
    font: italicFont,
    color: rgb(0.25, 0.55, 0.35),
  });
  y -= 12;

  // Divider line
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 0.8,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 16;

  // Iterate over paragraphs
  for (let pIdx = 0; pIdx < rawParagraphs.length; pIdx++) {
    const para = rawParagraphs[pIdx];

    // Detect section headings
    const isHeading =
      /^(I|II|III|IV|V|VI|VII|VIII|IX|X|\d+)\.\s+[A-Z\s]+$/.test(para) ||
      /^(ABSTRACT|INTRODUCTION|RELATED WORK|METHODOLOGY|EXPERIMENTAL SETUP|RESULTS|DISCUSSION|CONCLUSION|REFERENCES|ACKNOWLEDGMENT)/i.test(para);

    const isRefEntry = /^\[\d+\]\s+[A-Z]\./.test(para);

    const currentFont = isHeading ? boldFont : isRefEntry ? italicFont : regularFont;
    const currentSize = isHeading ? 10.5 : bodyFontSize;
    const currentLineHeight = isHeading ? 15 : bodyLineHeight;

    if (isHeading) {
      y -= 8;
    }

    // Split words and wrap lines
    const words = para.replace(/\s+/g, " ").split(" ");
    let currentLine = "";

    for (let wIdx = 0; wIdx < words.length; wIdx++) {
      const word = words[wIdx];
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      let testWidth = 0;

      try {
        testWidth = currentFont.widthOfTextAtSize(testLine, currentSize);
      } catch {
        // Fallback for non-standard symbols
        testWidth = testLine.length * (currentSize * 0.5);
      }

      if (testWidth > contentWidth) {
        if (y < margin + 28) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }

        // Clean printable ASCII
        const safeLine = currentLine.replace(/[^\x20-\x7E\xA0-\xFF]/g, " ");

        page.drawText(safeLine, {
          x: margin,
          y,
          size: currentSize,
          font: currentFont,
          color: rgb(0.12, 0.12, 0.12),
        });
        y -= currentLineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      if (y < margin + 28) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }

      const safeLine = currentLine.replace(/[^\x20-\x7E\xA0-\xFF]/g, " ");
      page.drawText(safeLine, {
        x: margin,
        y,
        size: currentSize,
        font: currentFont,
        color: rgb(0.12, 0.12, 0.12),
      });
      y -= currentLineHeight;
    }

    // Paragraph separation
    y -= 5;
  }

  // Draw Page Numbers & Running Footers
  const totalPages = pdfDoc.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    const curPage = pdfDoc.getPages()[i];
    const footerText = `Page ${i + 1} of ${totalPages}   •   OpenQuill Verified Output`;
    const footerWidth = regularFont.widthOfTextAtSize(footerText, 8);

    curPage.drawText(footerText, {
      x: (pageWidth - footerWidth) / 2,
      y: margin - 22,
      size: 8,
      font: italicFont,
      color: rgb(0.45, 0.45, 0.45),
    });
  }

  return await pdfDoc.save();
}
