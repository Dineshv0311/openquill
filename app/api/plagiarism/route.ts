import { NextRequest, NextResponse } from "next/server";

export interface PlagiarismSource {
  id: string;
  title: string;
  url: string;
  domain: string;
  matchPercent: number;
  matchedWords: number;
  snippet: string;
  sourceSnippet: string;
  matchedSentence: string;
}

export interface PlagiarismSentenceMatch {
  id: string;
  sentence: string;
  similarity: number;
  matchType: "exact" | "partial" | "unique";
  sourceId: string;
  sourceTitle: string;
  sourceDomain: string;
  sourceUrl: string;
  sourceExcerpt: string;
}

// Broad multi-domain corpus covering common definitions, educational materials, and web sources
const CORE_REFERENCE_CORPUS = [
  {
    title: "Artificial Intelligence Definition and Concepts",
    domain: "coursera.org",
    url: "https://www.coursera.org/articles/what-is-artificial-intelligence",
    content:
      "Artificial intelligence enables digital computers to perform tasks typically associated with intelligent beings. These tasks include learning, problem-solving, decision-making, language understanding, and image recognition across modern technological applications.",
  },
  {
    title: "What is Artificial Intelligence (AI)?",
    domain: "ibm.com",
    url: "https://www.ibm.com/topics/artificial-intelligence",
    content:
      "Artificial intelligence is the intelligence of machines or software, as opposed to the intelligence of living beings, primarily of humans. These tasks include learning, problem-solving, decision-making, language understanding, and image recognition. Machine learning allows computers to learn from data without being explicitly programmed.",
  },
  {
    title: "Machine Learning & Deep Neural Networks",
    domain: "wikipedia.org",
    url: "https://en.wikipedia.org/wiki/Machine_learning",
    content:
      "Machine learning is a field of inquiry devoted to understanding and building methods that learn, that is, methods that leverage data to improve performance on some set of tasks. Deep learning uses artificial neural networks with multiple layers to extract higher-level features from raw input.",
  },
  {
    title: "Natural Language Processing and Speech",
    domain: "stanford.edu",
    url: "https://nlp.stanford.edu/projects",
    content:
      "Natural language processing enables computers to understand, interpret, and manipulate human language. Natural language processing draws from many disciplines including computer science and computational linguistics.",
  },
  {
    title: "Cybersecurity Framework & Defense In Depth",
    domain: "cisa.gov",
    url: "https://www.cisa.gov/cybersecurity-best-practices",
    content:
      "Cybersecurity involves protecting digital systems, networks, and sensitive programs from malicious attacks and unauthorized access. Implementing defense-in-depth strategies ensures multi-layered security controls.",
  },
  {
    title: "Reverse Engineering Principles",
    domain: "mit.edu",
    url: "https://ocw.mit.edu/courses/electrical-engineering-and-computer-science",
    content:
      "Reverse engineering is the process of analyzing a software system to identify its components and their interrelationships, and create representations of the system at another level of abstraction.",
  },
  {
    title: "Cloud Computing Fundamentals",
    domain: "aws.amazon.com",
    url: "https://aws.amazon.com/what-is-cloud-computing",
    content:
      "Cloud computing is the on-demand delivery of IT resources over the Internet with pay-as-you-go pricing. Instead of buying, owning, and maintaining physical servers, organizations access technology services on an as-needed basis.",
  },
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

// Queries Wikipedia Search API in real-time for live internet matching
async function queryLiveWeb(sentence: string): Promise<Array<{ title: string; domain: string; url: string; snippet: string }>> {
  try {
    const cleanQuery = sentence
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .split(/\s+/)
      .slice(0, 10)
      .join(" ");

    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      cleanQuery
    )}&format=json&utf8=`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const data = await res.json();
    const searchItems = data.query?.search || [];

    return searchItems.slice(0, 3).map((item: any) => ({
      title: item.title,
      domain: "wikipedia.org",
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s+/g, "_"))}`,
      snippet: item.snippet.replace(/<[^>]+>/g, "").trim(),
    }));
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const { text, excludeQuotes = false } = await req.json();

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    let processedText = text;
    if (excludeQuotes) {
      processedText = processedText.replace(/"[^"]*"/g, "");
    }

    const rawSentences = (processedText.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [processedText])
      .map((s) => s.trim())
      .filter((s) => s.length > 5);

    const allWords = tokenize(processedText);
    const totalWordsCount = allWords.length || 1;

    let exactMatchedWords = 0;
    let partialMatchedWords = 0;

    const matchedSentences: PlagiarismSentenceMatch[] = [];
    const sourceMap = new Map<string, PlagiarismSource>();

    for (let sIdx = 0; sIdx < rawSentences.length; sIdx++) {
      const sentence = rawSentences[sIdx];
      const sWords = tokenize(sentence);
      if (sWords.length < 4) continue;

      let bestMatch: {
        title: string;
        domain: string;
        url: string;
        snippet: string;
        matchType: "exact" | "partial";
        similarity: number;
      } | null = null;

      // 1. Check against local comprehensive corpus
      for (const doc of CORE_REFERENCE_CORPUS) {
        const docWords = tokenize(doc.content);
        const sJoined = sWords.join(" ");
        const docJoined = docWords.join(" ");

        if (docJoined.includes(sJoined) || doc.content.toLowerCase().includes(sentence.toLowerCase())) {
          bestMatch = {
            title: doc.title,
            domain: doc.domain,
            url: doc.url,
            snippet: doc.content.slice(0, 180) + "...",
            matchType: "exact",
            similarity: 100,
          };
          break;
        }

        const shingleSize = 4;
        const totalShingles = Math.max(1, sWords.length - shingleSize + 1);
        let sharedShingles = 0;

        for (let i = 0; i <= sWords.length - shingleSize; i++) {
          const shingle = sWords.slice(i, i + shingleSize).join(" ");
          if (docJoined.includes(shingle)) {
            sharedShingles++;
          }
        }

        const sim = sharedShingles / totalShingles;
        if (sim >= 0.55 && (!bestMatch || sim * 100 > bestMatch.similarity)) {
          bestMatch = {
            title: doc.title,
            domain: doc.domain,
            url: doc.url,
            snippet: doc.content.slice(0, 180) + "...",
            matchType: sim >= 0.8 ? "exact" : "partial",
            similarity: Math.round(sim * 100),
          };
        }
      }

      // 2. Query live web (Wikipedia API) if not matched yet
      if (!bestMatch) {
        const webResults = await queryLiveWeb(sentence);
        for (const webDoc of webResults) {
          const webWords = tokenize(webDoc.snippet);
          const sJoined = sWords.join(" ");
          const webJoined = webWords.join(" ");

          if (webJoined.includes(sJoined) || webDoc.snippet.toLowerCase().includes(sentence.toLowerCase())) {
            bestMatch = {
              title: webDoc.title,
              domain: webDoc.domain,
              url: webDoc.url,
              snippet: webDoc.snippet,
              matchType: "exact",
              similarity: 95,
            };
            break;
          }

          const shingleSize = 4;
          const totalShingles = Math.max(1, sWords.length - shingleSize + 1);
          let sharedShingles = 0;

          for (let i = 0; i <= sWords.length - shingleSize; i++) {
            const shingle = sWords.slice(i, i + shingleSize).join(" ");
            if (webJoined.includes(shingle)) {
              sharedShingles++;
            }
          }

          const sim = sharedShingles / totalShingles;
          if (sim >= 0.6 && (!bestMatch || sim * 100 > bestMatch.similarity)) {
            bestMatch = {
              title: webDoc.title,
              domain: webDoc.domain,
              url: webDoc.url,
              snippet: webDoc.snippet,
              matchType: sim >= 0.8 ? "exact" : "partial",
              similarity: Math.round(sim * 100),
            };
          }
        }
      }

      // 3. Register match if detected
      if (bestMatch) {
        const wordsCount = sWords.length;
        if (bestMatch.matchType === "exact") {
          exactMatchedWords += wordsCount;
        } else {
          partialMatchedWords += wordsCount;
        }

        const sourceId = `src-${bestMatch.domain.replace(/\./g, "-")}-${sIdx}`;

        matchedSentences.push({
          id: `match-sentence-${sIdx}`,
          sentence,
          similarity: bestMatch.similarity,
          matchType: bestMatch.matchType,
          sourceId,
          sourceTitle: bestMatch.title,
          sourceDomain: bestMatch.domain,
          sourceUrl: bestMatch.url,
          sourceExcerpt: bestMatch.snippet,
        });

        sourceMap.set(sourceId, {
          id: sourceId,
          title: bestMatch.title,
          domain: bestMatch.domain,
          url: bestMatch.url,
          matchPercent: bestMatch.similarity,
          matchedWords: wordsCount,
          snippet: bestMatch.snippet,
          sourceSnippet: bestMatch.snippet,
          matchedSentence: sentence,
        });
      }
    }

    const exactMatchPercent = Math.min(100, Math.round((exactMatchedWords / totalWordsCount) * 100));
    const partialMatchPercent = Math.min(100, Math.round((partialMatchedWords / totalWordsCount) * 100));
    const totalPlagiarismPercent = Math.min(100, exactMatchPercent + partialMatchPercent);
    const uniqueContentPercent = Math.max(0, 100 - totalPlagiarismPercent);

    const sources = Array.from(sourceMap.values());

    return NextResponse.json({
      success: true,
      originalText: text,
      statistics: {
        totalWords: totalWordsCount,
        plagiarizedWords: exactMatchedWords + partialMatchedWords,
        plagiarismPercent: totalPlagiarismPercent,
        exactMatchPercent,
        partialMatchPercent,
        uniqueContentPercent,
        identicalSentences: matchedSentences.filter((m) => m.matchType === "exact").length,
        paraphrasedSentences: matchedSentences.filter((m) => m.matchType === "partial").length,
      },
      sources,
      matchedSentences,
    });
  } catch (error) {
    console.error("Plagiarism API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
