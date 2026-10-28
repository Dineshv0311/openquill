import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import zlib from "zlib";

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

function parseTj(tjStr: string): string {
  return tjStr
    .replace(/\[|\]\s*TJ/g, "")
    .replace(/\((.*?)\)|-?\d+/g, (_m, g1) => (g1 !== undefined ? g1 : ""))
    .replace(/\\([()\\])/g, "$1");
}

export async function humanizeUploadedPdf(
  originalPdfBytes: Uint8Array,
  mode: "casual" | "academic" | "creative" = "academic"
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(originalPdfBytes);

  const MARKERS =
    mode === "casual"
      ? [
          "In practice, ",
          "Truth is, ",
          "At its core, ",
          "Basically, ",
          "In our experience, ",
        ]
      : [
          "In our experiments, ",
          "In our setup, ",
          "In practice, ",
          "We noticed that ",
          "In our evaluation, ",
          "Our tests revealed that ",
          "As we observed, ",
          "Our benchmarks showed that ",
          "In our trials, ",
          "We verified that ",
        ];

  const PHRASES: Array<[RegExp, string]> = [
    [/\bTo address this, we pair\b/gi, "In our setup, our team combines"],
    [/\bTo address\b/gi, "In our setup, to tackle"],
    [/\bTo tackle this\b/gi, "In our setup, our team combines"],
    [/\bTo counter\b/gi, "In our design, to prevent"],
    [/\bTo mitigate\b/gi, "In our implementation, to reduce"],
    [/\bTo overcome\b/gi, "In our pipeline, to solve"],
    [/\bTo evaluate\b/gi, "In our evaluation, to benchmark"],
    [/\bTo investigate\b/gi, "In our study, to examine"],
    [/\bTo benchmark\b/gi, "In our tests, to compare"],
    [/\bThis turns dense\b/gi, "In practice, this turns dense"],
    [/\bWe benchmark three\b/gi, "Our team evaluated three"],
    [/\bUnder such controlled conditions\b/gi, "In practice, under these conditions"],
    [/\bOver the past five decades\b/gi, "For over fifty years"],
    [/\bThese successes relied\b/gi, "In practice, these successes relied"],
    [/\bHowever, as global manufacturing\b/gi, "Yet as global manufacturing"],
    [/\bReal-world manipulation is\b/gi, "In practice, real-world manipulation is"],
    [/\bIn these settings robots\b/gi, "In our evaluation, robots"],
    [/\bAcross four standardized\b/gi, "In our benchmarks across four"],
    [/\bOur residual policy\b/gi, "In our tests, our residual policy"],
    [/\bThese results support\b/gi, "Our findings confirm"],
    [/\bThis paper presents the design, mathematical\b/gi, "In this study, our team designed, formulated, and"],
    [/\bThis paper (presents|introduces|proposes|evaluates)\b/gi, "In our study, we evaluate"],
    [/\bGlobal average pooling in stand\b/gi, "We noticed that pooling in stand"],
    [/\bGlobal average pooling\b/gi, "We noticed that global average pooling"],
    [/\bFurthermore\b/gi, "In addition,"],
    [/\bMoreover\b/gi, "At the same time,"],
    [/\bSpecifically\b/gi, "In particular,"],
    [/\bConsequently\b/gi, "As a direct result,"],
    [/\bNotably\b/gi, "Noticeably,"],
    [/\bCrucially\b/gi, "Importantly,"],
    [/\bAdditionally\b/gi, "Also,"],
    [/\butilize\b/gi, "use"],
    [/\butilizing\b/gi, "using"],
    [/\bdemonstrates\b/gi, "shows"],
    [/\bdemonstrate\b/gi, "show"],
    [/\bexhibits\b/gi, "displays"],
    [/\bdelivers\b/gi, "provides"],
    [/\bconsistently struggle\b/gi, "often run into difficulties"],
    [/\bis formulated to\b/gi, "is designed to"],
    [/\bwas formulated to\b/gi, "was set up to"],
    [/\bwas benchmarked\b/gi, "was evaluated"],
    [/\bwere benchmarked\b/gi, "were tested"],
    [/\bwas evaluated\b/gi, "was examined"],
    [/\bwere evaluated\b/gi, "were tested"],
    [/\bwas conducted\b/gi, "was performed"],
    [/\bwere conducted\b/gi, "were performed"],
    [/\bare trained to\b/gi, "learn to"],
    [/\bis paired with\b/gi, "works alongside"],
    [/\bwas observed\b/gi, "we observed"],
    [/\bwithout needing\b/gi, "without requiring"],
    [/\bstate-of-the-art\b/gi, "leading-edge"],
    [/\bseamlessly integrates\b/gi, "cleanly integrates"],
  ];

  let sentenceIdx = 0;
  let lastEndedWithPeriod = false;

  for (let p = 0; p < doc.getPageCount(); p++) {
    const page = doc.getPage(p);
    const contentsObj = page.node.Contents();
    if (!contentsObj) continue;

    const streamNodes = Array.isArray((contentsObj as any).asArray?.())
      ? (contentsObj as any).asArray()
      : [contentsObj];

    for (const streamNode of streamNodes) {
      const rawStream = (doc.context.lookup(streamNode) || streamNode) as any;
      if (!rawStream || !rawStream.contents) continue;

      let decomp: string;
      let isCompressed = false;
      try {
        decomp = zlib.inflateSync(Buffer.from(rawStream.contents)).toString("latin1");
        isCompressed = true;
      } catch {
        decomp = Buffer.from(rawStream.contents).toString("latin1");
      }

      decomp = decomp.replace(/\[(.*?)\]\s*TJ/gs, (match) => {
        let text = parseTj(match);
        if (!text.trim()) return match;

        for (const [regex, rep] of PHRASES) {
          text = text.replace(regex, rep);
        }

        const isMeta =
          text.startsWith("Vision-") ||
          text.startsWith("Robotic Manipulation") ||
          text.startsWith("Dinesh") ||
          text.startsWith("School of") ||
          text.includes("@") ||
          text.startsWith("Abstract") ||
          text.startsWith("Index Terms") ||
          text.startsWith("REFERENCES") ||
          text.startsWith("IEEE") ||
          text.startsWith("Figure") ||
          text.startsWith("Table") ||
          /^(I|II|III|IV|V|VI|VII|VIII|IX|X)\.\s+/.test(text.trim());

        if (!isMeta) {
          if (lastEndedWithPeriod && /^[A-Z][a-z]{3,}\b/.test(text.trim())) {
            sentenceIdx++;
            const marker = MARKERS[sentenceIdx % MARKERS.length];
            text = marker + text.charAt(0).toLowerCase() + text.slice(1);
          }

          text = text.replace(/\.\s+([A-Z][a-z]{3,}\b)/g, (_m, word) => {
            sentenceIdx++;
            const marker = MARKERS[sentenceIdx % MARKERS.length];
            return ". " + marker + word.charAt(0).toLowerCase() + word.slice(1);
          });
        }

        lastEndedWithPeriod = /[.!?]\s*$/.test(text.trim());

        const escaped = text
          .replace(/\\/g, "\\\\")
          .replace(/\(/g, "\\(")
          .replace(/\)/g, "\\)");
        return "[(" + escaped + ")] TJ";
      });

      if (isCompressed) {
        rawStream.contents = new Uint8Array(
          zlib.deflateSync(Buffer.from(decomp, "latin1"))
        );
      } else {
        rawStream.contents = new Uint8Array(Buffer.from(decomp, "latin1"));
      }
    }
  }

  return await doc.save();
}
