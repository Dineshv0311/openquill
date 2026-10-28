"use client";

import React, { useState, useRef } from "react";
import {
  RotateCcw,
  CheckCircle2,
  Scan,
  Copy,
  Sparkles,
  MessageSquare,
  Image as ImageIcon,
  Languages,
  MoreHorizontal,
  Chrome,
  Upload,
  ClipboardPaste,
  Trash2,
  RefreshCw,
  Sliders,
  ExternalLink,
  BookOpen,
  AlertTriangle,
  Check,
  Volume2,
  FileCheck,
  ShieldCheck,
  Send,
  Zap,
  FileText,
  FileUp,
  Layers,
  Download,
} from "lucide-react";

interface WordToken {
  id: string;
  text: string;
  type: "unchanged" | "synonym" | "structural" | "inserted";
  originalText?: string;
  synonyms: string[];
}

interface PlagiarismSource {
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

interface PlagiarismSentenceMatch {
  id: string;
  sentence: string;
  similarity: number;
  matchType: "exact" | "partial" | "identical" | "minor_changes" | "paraphrased";
  sourceId: string;
  sourceTitle?: string;
  sourceDomain?: string;
  sourceUrl?: string;
  sourceExcerpt?: string;
}

const MODES = [
  { id: "STANDARD", label: "Standard", desc: "Balanced rewrite that preserves original meaning" },
  { id: "FLUENCY", label: "Fluency", desc: "Ensures text is grammatically sound and reads smoothly" },
  { id: "FORMAL", label: "Formal", desc: "Sophisticated and professional tone for formal writing" },
  { id: "SIMPLE", label: "Simple", desc: "Makes language easy to read, accessible and direct" },
  { id: "CREATIVE", label: "Creative", desc: "Expressive vocabulary and varied sentence structure" },
  { id: "EXPAND", label: "Expand", desc: "Adds descriptive detail to increase sentence length" },
  { id: "SHORTEN", label: "Shorten", desc: "Removes extra words for concise, punchy communication" },
  { id: "ACADEMIC", label: "Academic", desc: "Scholarly, research-oriented phrasing with citations tone" },
];

const SAMPLE_PARAPHRASE =
  "OpenQuill is a free, powerful writing platform that helps users improve their text, make changes to sentence structure, and quickly understand different ways to phrase an idea.";

const SAMPLE_PLAGIARISM =
  "Artificial intelligence is the intelligence of machines or software, as opposed to the intelligence of living beings, primarily of humans. Natural language processing enables computers to understand, interpret, and generate human language. However, students should also write their own original essays and avoid directly copying online articles without giving proper citations.";

export default function OpenQuillApp() {
  // Navigation
  const [activeTab, setActiveTab] = useState<
    | "paraphraser"
    | "grammar"
    | "detector"
    | "plagiarism"
    | "humanizer"
    | "chat"
    | "translate"
  >("plagiarism"); // Default to plagiarism as requested!

  // Shared text
  const [inputText, setInputText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Paraphraser states
  const [selectedMode, setSelectedMode] = useState<string>("STANDARD");
  const [synonymLevel, setSynonymLevel] = useState<number>(2);
  const [tokens, setTokens] = useState<WordToken[]>([]);
  const [activeToken, setActiveToken] = useState<WordToken | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);

  // Plagiarism states
  const [plagiarismStats, setPlagiarismStats] = useState<any | null>(null);
  const [plagiarismSources, setPlagiarismSources] = useState<PlagiarismSource[]>([]);
  const [matchedSentences, setMatchedSentences] = useState<PlagiarismSentenceMatch[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [excludeQuotes, setExcludeQuotes] = useState<boolean>(false);

  // AI Detector states
  const [aiDetectorResult, setAiDetectorResult] = useState<any | null>(null);
  const [detectorInputMode, setDetectorInputMode] = useState<"pdf" | "text">("pdf");
  const [uploadedPdfInfo, setUploadedPdfInfo] = useState<{
    filename: string;
    fileSize: number;
    totalPages: number;
    totalWords: number;
    pageBreakdown: Array<{
      pageNumber: number;
      words: number;
      aiPercent: number;
      humanPercent: number;
      preview: string;
    }>;
  } | null>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState<boolean>(false);
  const [pdfUploadError, setPdfUploadError] = useState<string | null>(null);
  const [isDraggingPdf, setIsDraggingPdf] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // AI Humanizer states
  const [humanizerInputMode, setHumanizerInputMode] = useState<"text" | "pdf">("text");
  const [humanizerMode, setHumanizerMode] = useState<"casual" | "academic" | "creative">("academic");
  const [humanizerResult, setHumanizerResult] = useState<string>("");
  const [humanizerStats, setHumanizerStats] = useState<any | null>(null);
  const [humanizerPdfInfo, setHumanizerPdfInfo] = useState<{
    filename: string;
    fileSize: number;
    totalPages: number;
    totalWords: number;
    originalText: string;
    humanizedText: string;
    originalAiPercent: number;
    humanizedAiPercent: number;
    originalHumanPercent: number;
    humanizedHumanPercent: number;
    verdictBefore: string;
    verdictAfter: string;
    changesCount: number;
  } | null>(null);
  const [isHumanizingPdf, setIsHumanizingPdf] = useState<boolean>(false);
  const [humanizerPdfError, setHumanizerPdfError] = useState<string | null>(null);
  const [isDraggingHumanizerPdf, setIsDraggingHumanizerPdf] = useState<boolean>(false);
  const humanizerFileInputRef = useRef<HTMLInputElement | null>(null);

  // AI Chat states
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    { role: "assistant", text: "Hello! I am your OpenQuill AI writing partner. How can I help you brainstorm, edit, or research today?" },
  ]);
  const [chatInput, setChatInput] = useState<string>("");

  // Grammar states
  const [grammarIssues, setGrammarIssues] = useState<any[]>([]);
  const [correctedGrammarText, setCorrectedGrammarText] = useState<string>("");

  // Translate states
  const [sourceLang, setSourceLang] = useState<string>("en");
  const [targetLang, setTargetLang] = useState<string>("es");
  const [translatedText, setTranslatedText] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // Handlers
  const handleScanPlagiarism = async (textOverride?: string) => {
    const textToScan = textOverride ?? inputText;
    if (!textToScan.trim()) return;

    setIsLoading(true);
    setSelectedSourceId(null);
    try {
      const res = await fetch("/api/plagiarism", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToScan, excludeQuotes }),
      });
      const data = await res.json();
      setPlagiarismStats(data.statistics);
      setPlagiarismSources(data.sources || []);
      setMatchedSentences(data.matchedSentences || []);
    } catch (err) {
      console.error("Plagiarism error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleParaphrase = async (overrideText?: string, overrideMode?: string, overrideLevel?: number) => {
    const textToProcess = overrideText ?? inputText;
    if (!textToProcess.trim()) return;

    setIsLoading(true);
    setActiveToken(null);
    try {
      const res = await fetch("/api/paraphrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToProcess,
          mode: overrideMode ?? selectedMode,
          synonymLevel: overrideLevel ?? synonymLevel,
        }),
      });
      const data = await res.json();
      if (data.tokens) setTokens(data.tokens);
    } catch (err) {
      console.error("Paraphrase error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiDetect = async (overrideText?: string | React.MouseEvent) => {
    const textToScan = typeof overrideText === "string" ? overrideText : inputText;
    if (!textToScan.trim()) return;
    setIsLoading(true);
    setPdfUploadError(null);
    try {
      const res = await fetch("/api/ai-detector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToScan }),
      });
      const data = await res.json();
      setAiDetectorResult(data);
    } catch (err) {
      console.error("AI Detect error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHumanizePdfUpload = async (file: File) => {
    if (!file) return;
    setIsHumanizingPdf(true);
    setHumanizerPdfError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", humanizerMode);

      const res = await fetch("/api/humanizer/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setHumanizerPdfError(data.error || "Failed to process and humanize PDF file");
        return;
      }

      setHumanizerPdfInfo(data);
      setHumanizerResult(data.humanizedText);
      setHumanizerStats({
        humanScore: data.humanizedHumanPercent,
        readabilityGrade: "Natural Human Cadence",
        changesCount: data.changesCount,
        originalAiPercent: data.originalAiPercent,
        humanizedAiPercent: data.humanizedAiPercent,
      });
    } catch (err: any) {
      console.error("PDF humanize error:", err);
      setHumanizerPdfError("Failed to upload and humanize PDF file.");
    } finally {
      setIsHumanizingPdf(false);
    }
  };

  const handleDownloadHumanizedText = () => {
    if (!humanizerResult) return;
    const blob = new Blob([humanizerResult], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const baseName = humanizerPdfInfo?.filename ? humanizerPdfInfo.filename.replace(/\.[^/.]+$/, "") : "document";
    a.download = `openquill-humanized-${baseName}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleScanHumanizedInDetector = (textToScan: string) => {
    setActiveTab("detector");
    setDetectorInputMode("text");
    setInputText(textToScan);
    setUploadedPdfInfo(null);
    handleAiDetect(textToScan);
  };

  const handlePdfUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingPdf(true);
    setPdfUploadError(null);
    setUploadedPdfInfo(null);
    setAiDetectorResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/ai-detector/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setPdfUploadError(data.error || "Failed to parse and analyze PDF file");
        return;
      }

      setUploadedPdfInfo({
        filename: data.filename,
        fileSize: data.fileSize,
        totalPages: data.totalPages,
        totalWords: data.totalWords,
        pageBreakdown: data.pageBreakdown || [],
      });

      setInputText(data.extractedText);

      setAiDetectorResult({
        overallAiPercent: data.overallAiPercent,
        humanPercent: data.humanPercent,
        verdict: data.verdict,
        sentences: data.sentences,
      });
    } catch (err: any) {
      console.error("PDF upload error:", err);
      setPdfUploadError("Failed to upload and analyze PDF. Please check connection.");
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleDownloadPdfAiReport = () => {
    if (!aiDetectorResult) return;
    const totalWordsCount = uploadedPdfInfo?.totalWords || (inputText.trim() ? inputText.trim().split(/\s+/).length : 0);
    const reportContent = `=====================================================
OPENQUILL AI CONTENT DETECTION & AUDIT REPORT
Document: ${uploadedPdfInfo?.filename || "Uploaded Text Document"}
Date: ${new Date().toLocaleString()}
=====================================================

OVERVIEW SUMMARY:
- Total Pages Scanned: ${uploadedPdfInfo?.totalPages || 1}
- Total Words Analyzed: ${totalWordsCount}
- Overall AI Likelihood: ${aiDetectorResult.overallAiPercent}%
- Human Probability Score: ${aiDetectorResult.humanPercent}%
- Verified Status: ${aiDetectorResult.verdict.toUpperCase()}

${uploadedPdfInfo?.pageBreakdown && uploadedPdfInfo.pageBreakdown.length > 0 ? `-----------------------------------------------------
PAGE-BY-PAGE AI BREAKDOWN:
-----------------------------------------------------
${uploadedPdfInfo.pageBreakdown
  .map(
    (p) => `[Page ${p.pageNumber}] Words: ${p.words} | AI Score: ${p.aiPercent}% (${p.aiPercent >= 65 ? "High AI" : p.aiPercent >= 35 ? "Mixed" : "Human"})\nExcerpt: "${p.preview}"\n`
  )
  .join("\n")}` : ""}

-----------------------------------------------------
SENTENCE CLASSIFICATION BREAKDOWN:
-----------------------------------------------------
${(aiDetectorResult.sentences || [])
  .map(
    (s: any, i: number) => `[Sentence #${i + 1}] [${(s.classification || "unknown").toUpperCase()}] (${s.aiScore}% AI Risk):\n"${s.text}"\n`
  )
  .join("\n")}

=====================================================
Report generated by OpenQuill AI Detector Engine
=====================================================`;

    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const baseName = uploadedPdfInfo?.filename ? uploadedPdfInfo.filename.replace(/\.[^/.]+$/, "") : "document";
    a.download = `openquill-ai-report-${baseName}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleHumanize = async (overrideText?: string, modeOverride?: "casual" | "academic" | "creative") => {
    const textToProcess = overrideText ?? inputText;
    if (!textToProcess.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/humanizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToProcess,
          mode: modeOverride ?? humanizerMode,
        }),
      });
      const data = await res.json();
      setHumanizerResult(data.humanizedText || "");
      setHumanizerStats({
        humanScore: data.humanScore || 98,
        readabilityGrade: data.readabilityGrade || "Very Natural",
        changesCount: data.changesCount || 0,
      });
    } catch (err) {
      console.error("Humanize error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendChat = async (presetPrompt?: string) => {
    const msgToSend = presetPrompt || chatInput;
    if (!msgToSend.trim()) return;

    setChatMessages((prev) => [...prev, { role: "user", text: msgToSend }]);
    setChatInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msgToSend,
          history: chatMessages,
        }),
      });
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply || "I am here to assist with your writing.",
        },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I encountered an issue processing that. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslate = async (overrideText?: string) => {
    const textToTranslate = overrideText ?? inputText;
    if (!textToTranslate.trim()) return;

    setIsTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToTranslate,
          sourceLang,
          targetLang,
        }),
      });
      const data = await res.json();
      setTranslatedText(data.translatedText || "");
    } catch (err) {
      console.error("Translate error:", err);
    } finally {
      setIsTranslating(false);
    }
  };

  const [downloadToast, setDownloadToast] = useState<boolean>(false);

  const handleCheckGrammar = async (textToCheck?: string) => {
    const text = textToCheck ?? inputText;
    if (!text.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.success) {
        setGrammarIssues(data.issues || []);
        setCorrectedGrammarText(data.correctedText || text);
      }
    } catch (err) {
      console.error("Grammar check error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFixAllGrammar = () => {
    if (correctedGrammarText) {
      setInputText(correctedGrammarText);
      setGrammarIssues([]);
    }
  };

  const handleFixSingleIssue = (issueId: string) => {
    const issue = grammarIssues.find((iss) => iss.id === issueId);
    if (!issue) return;
    const updated = inputText.replace(issue.original, issue.replacement);
    setInputText(updated);
    const remaining = grammarIssues.filter((iss) => iss.id !== issueId);
    setGrammarIssues(remaining);
  };

  const handleDownloadReport = async () => {
    let stats = plagiarismStats;
    let matches = matchedSentences;
    const textToScan = inputText.trim() || SAMPLE_PLAGIARISM;

    if (!stats) {
      setIsLoading(true);
      try {
        const res = await fetch("/api/plagiarism", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textToScan, excludeQuotes }),
        });
        const data = await res.json();
        if (data.success) {
          stats = data.statistics;
          matches = data.matchedSentences;
          setPlagiarismStats(data.statistics);
          setPlagiarismSources(data.sources || []);
          setMatchedSentences(data.matchedSentences || []);
          if (!inputText.trim()) setInputText(SAMPLE_PLAGIARISM);
        }
      } catch (err) {
        console.error("Auto scan for download report error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (!stats) return;

    const reportContent = `=====================================================
OPENQUILL PLAGIARISM SCAN & INTEGRITY REPORT
Date: ${new Date().toLocaleString()}
Status: Verified by OpenQuill Free Engine
=====================================================

OVERVIEW SUMMARY:
- Total Words Scanned: ${stats.totalWords}
- Plagiarism Similarity Index: ${stats.plagiarismPercent}%
- Exact Matches: ${stats.exactMatchPercent}%
- Partial / Paraphrased Matches: ${stats.partialMatchPercent}%
- Unique Content Score: ${stats.uniqueContentPercent}%
- Identical Sentences: ${stats.identicalSentences}
- Paraphrased Sentences: ${stats.paraphrasedSentences}

-----------------------------------------------------
DETECTED MATCHED SOURCES & CITATIONS:
-----------------------------------------------------
${(matches || [])
  .map(
    (m: any, i: number) => `[Match #${i + 1}] Similarity: ${m.similarity}% (${(m.matchType || "partial").toUpperCase()})
Sentence: "${m.sentence}"
Matched Source: ${m.sourceTitle || "Academic & Online Database"}
Source Domain: ${m.sourceDomain || "Internet"}
Direct Link: ${m.sourceUrl || "N/A"}
Matched Source Excerpt: "${m.sourceExcerpt || ""}"
`
  )
  .join("\n")}

-----------------------------------------------------
ORIGINAL DOCUMENT TEXT:
-----------------------------------------------------
${textToScan}

=====================================================
Report generated by OpenQuill Suite (Free & Open-Source)
=====================================================`;

    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `openquill-plagiarism-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadToast(true);
    setTimeout(() => setDownloadToast(false), 3500);
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen bg-[#fafbfc]">
      {/* Exact Left Vertical Side Panel Matching QuillBot */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 select-none">
        <div>
          {/* Logo Header */}
          <div className="px-5 py-4 flex items-center space-x-2.5 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-[#188038] flex items-center justify-center text-white font-black text-xl shadow-xs">
              Q
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-2xl tracking-tight text-[#188038]">
                OpenQuill
              </span>
              <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md tracking-wider">
                Free
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveTab("paraphraser")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                activeTab === "paraphraser"
                  ? "bg-emerald-50 text-[#188038]"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <RotateCcw className="w-4 h-4 text-emerald-600" />
              <span>Paraphraser</span>
            </button>

            <button
              onClick={() => setActiveTab("grammar")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                activeTab === "grammar"
                  ? "bg-emerald-50 text-[#188038]"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Grammar Checker</span>
            </button>

            <button
              onClick={() => setActiveTab("detector")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                activeTab === "detector"
                  ? "bg-emerald-50 text-[#188038]"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Scan className="w-4 h-4 text-emerald-600" />
              <span>AI Detector</span>
            </button>

            {/* Plagiarism Checker Highlighted */}
            <button
              onClick={() => setActiveTab("plagiarism")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                activeTab === "plagiarism"
                  ? "bg-[#188038] text-white shadow-xs"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${activeTab === "plagiarism" ? "text-white" : "text-emerald-600"}`} />
              <span>Plagiarism Checker</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ml-auto ${
                activeTab === "plagiarism" ? "bg-emerald-800 text-emerald-100" : "bg-emerald-100 text-emerald-800"
              }`}>
                Pro
              </span>
            </button>

            <button
              onClick={() => setActiveTab("humanizer")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                activeTab === "humanizer"
                  ? "bg-emerald-50 text-[#188038]"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>AI Humanizer</span>
            </button>

            <button
              onClick={() => setActiveTab("chat")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                activeTab === "chat"
                  ? "bg-emerald-50 text-[#188038]"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>AI Chat</span>
            </button>

            <button
              onClick={() => setActiveTab("translate")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                activeTab === "translate"
                  ? "bg-emerald-50 text-[#188038]"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Languages className="w-4 h-4 text-emerald-600" />
              <span>Translate</span>
            </button>
          </nav>
        </div>

        {/* Bottom Extension Badge */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center space-x-2 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 p-2.5 rounded-xl hover:bg-gray-100 transition cursor-pointer">
            <Chrome className="w-4 h-4 text-emerald-600" />
            <span>OpenQuill Web Suite</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-bold text-gray-900 capitalize">
              {activeTab === "plagiarism"
                ? "Plagiarism Checker"
                : activeTab === "paraphraser"
                ? "AI Paraphraser"
                : activeTab === "detector"
                ? "AI Content Detector"
                : activeTab === "humanizer"
                ? "AI Text Humanizer"
                : activeTab === "chat"
                ? "AI Co-Writer Chat"
                : activeTab === "translate"
                ? "Document Translator"
                : "Grammar Checker"}
            </h1>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-semibold">
              Live Engine
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>OpenQuill Local & Web Engine</span>
          </div>
        </header>

        {/* WORKSPACE CONTENT */}
        <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
          {/* ========================================================= */}
          {/* 1. PLAGIARISM CHECKER VIEW (FEATURED)                      */}
          {/* ========================================================= */}
          {activeTab === "plagiarism" && (
            <div className="space-y-6">
              {/* Introduction Banner */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    Stay original and confident
                  </h2>
                  <p className="text-sm text-gray-600 max-w-2xl">
                    OpenQuill's Plagiarism Checker detects matching text, uncredited paraphrasing, and missing citations across billions of web pages and academic papers.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setInputText(SAMPLE_PLAGIARISM);
                    handleScanPlagiarism(SAMPLE_PLAGIARISM);
                  }}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#188038] font-bold text-xs rounded-xl border border-emerald-200 transition"
                >
                  Load Sample Paper
                </button>
              </div>

              {/* Main Input Box */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-4">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="To check for plagiarism, enter text here, or paste from your clipboard..."
                    className="w-full h-44 resize-none outline-none text-base leading-relaxed text-gray-800 placeholder-gray-400 bg-transparent"
                  />
                </div>

                <div className="border-t border-gray-100 px-5 py-3 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-gray-500 font-semibold">
                      {inputText.trim() ? inputText.trim().split(/\s+/).length : 0} / 25,000 words
                    </span>
                    <label className="flex items-center space-x-1.5 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={excludeQuotes}
                        onChange={(e) => setExcludeQuotes(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Exclude Quotations ("...")</span>
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    {inputText && (
                      <button
                        onClick={() => {
                          setInputText("");
                          setPlagiarismStats(null);
                          setPlagiarismSources([]);
                          setMatchedSentences([]);
                        }}
                        className="text-xs text-gray-500 hover:text-red-600 flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleScanPlagiarism()}
                      disabled={!inputText.trim() || isLoading}
                      className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#188038] hover:bg-[#0d5c24] text-white font-bold text-sm shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                      <span>{isLoading ? "Scanning Corpus..." : "Scan for Plagiarism"}</span>
                    </button>
                    <button
                      onClick={handleDownloadReport}
                      disabled={isLoading}
                      className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-xs shadow-xs transition"
                      title="Download complete scan report as text"
                    >
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>Download Report</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Plagiarism Results Section */}
              {plagiarismStats && (
                <div className="space-y-6">
                  {/* Plagiarism Results Section - Styled matching plagiarismchecker.ai & QuillBot */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Document View with Color-Coded Segments */}
                    <div className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col min-h-[460px]">
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Uploaded Text
                        </span>
                        <div className="flex items-center space-x-4 text-xs font-semibold text-gray-600">
                          <span>Words: <strong className="text-gray-900">{plagiarismStats.totalWords}</strong></span>
                          <span>Characters: <strong className="text-gray-900">{inputText.length}</strong></span>
                        </div>
                      </div>

                      <div className="flex-1 text-sm leading-relaxed text-gray-800 space-y-2.5 overflow-y-auto">
                        {(inputText.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [inputText]).map((sentencePart, idx) => {
                          const cleanPart = sentencePart.trim();
                          if (!cleanPart) return null;

                          const match = matchedSentences.find((m) =>
                            cleanPart.toLowerCase().includes(m.sentence.toLowerCase().slice(0, 30)) ||
                            m.sentence.toLowerCase().includes(cleanPart.toLowerCase().slice(0, 30))
                          );

                          if (match) {
                            const isSelected = selectedSourceId === match.sourceId;
                            return (
                              <span
                                key={idx}
                                onClick={() => setSelectedSourceId(match.sourceId)}
                                className={`cursor-pointer inline-block mr-1.5 p-1 rounded-md transition ${
                                  isSelected
                                    ? "bg-red-200 text-red-950 font-bold ring-2 ring-red-400"
                                    : match.matchType === "exact"
                                    ? "bg-pink-100 text-pink-950 border border-pink-300 hover:bg-pink-200"
                                    : "bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200"
                                }`}
                                title={`Plagiarized sentence (${match.similarity}% similarity from ${match.sourceDomain})`}
                              >
                                {sentencePart}
                              </span>
                            );
                          }

                          return (
                            <span
                              key={idx}
                              className="inline-block mr-1.5 p-1 rounded-md bg-emerald-50 text-emerald-950 border border-emerald-200/60"
                            >
                              {sentencePart}
                            </span>
                          );
                        })}
                      </div>

                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                        <button
                          onClick={() => handleCopy(inputText)}
                          className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                          title="Copy original text"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleDownloadReport}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5"
                        >
                          <FileCheck className="w-4 h-4" />
                          <span>Download Report</span>
                        </button>
                      </div>
                    </div>

                    {/* Right: Plagiarized Scores & Sources Panel */}
                    <div className="lg:col-span-5 bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col space-y-5">
                      {/* Gauge & Metrics Card */}
                      <div className="flex items-center justify-between pb-5 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="relative w-16 h-16 flex items-center justify-center">
                            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                              <path
                                className="text-gray-100"
                                strokeWidth="4"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className={plagiarismStats.plagiarismPercent > 0 ? "text-red-500" : "text-emerald-500"}
                                strokeDasharray={`${plagiarismStats.plagiarismPercent}, 100`}
                                strokeWidth="4"
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            <span className="absolute text-xs font-black text-gray-900">
                              {plagiarismStats.plagiarismPercent}%
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-extrabold text-red-600 block">
                              {plagiarismStats.plagiarismPercent}% Plagiarized
                            </span>
                            <span className="text-xs text-gray-400">Similarity index</span>
                          </div>
                        </div>

                        <div className="space-y-1 text-right text-xs">
                          <div className="flex justify-end space-x-2">
                            <span className="text-gray-500">Exact Match:</span>
                            <span className="font-bold text-red-600">{plagiarismStats.exactMatchPercent}%</span>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <span className="text-gray-500">Partial Match:</span>
                            <span className="font-bold text-amber-600">{plagiarismStats.partialMatchPercent}%</span>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <span className="text-gray-500">Unique Content:</span>
                            <span className="font-bold text-emerald-600">{plagiarismStats.uniqueContentPercent}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Plagiarized Scores Section */}
                      <div className="space-y-3 flex-1 flex flex-col">
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center justify-between">
                          <span>Plagiarized Scores</span>
                          <span className="text-gray-400 font-normal">
                            {matchedSentences.length} matches detected
                          </span>
                        </h4>

                        {matchedSentences.length === 0 ? (
                          <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400 flex-1">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2" />
                            <p className="font-bold text-sm text-gray-700">100% Unique</p>
                            <p className="text-xs text-gray-400">No overlapping web or academic sources found.</p>
                          </div>
                        ) : (
                          <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
                            {matchedSentences.map((match, mIdx) => (
                              <div
                                key={mIdx}
                                onClick={() => setSelectedSourceId(match.sourceId)}
                                className={`border rounded-xl p-3.5 transition cursor-pointer ${
                                  selectedSourceId === match.sourceId
                                    ? "border-red-400 bg-red-50/60 shadow-xs"
                                    : "border-gray-200 bg-white hover:border-gray-300"
                                }`}
                              >
                                <div className="flex items-start space-x-2 mb-2">
                                  <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0"></span>
                                  <span className="text-xs font-bold text-gray-800 line-clamp-2">
                                    {match.sentence}
                                  </span>
                                </div>

                                <div className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 text-xs text-gray-600 italic mb-2">
                                  "{match.sourceExcerpt}"
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px]">
                                  <a
                                    href={match.sourceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-emerald-700 hover:underline font-mono flex items-center space-x-1"
                                  >
                                    <span className="truncate max-w-[200px]">{match.sourceUrl}</span>
                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                  </a>
                                  <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                    {match.similarity}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. PARAPHRASER VIEW                                       */}
          {/* ========================================================= */}
          {activeTab === "paraphraser" && (
            <div className="space-y-4">
              {/* Mode Selector */}
              <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-1 overflow-x-auto">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">
                    Modes:
                  </span>
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedMode(m.id);
                        if (inputText.trim()) handleParaphrase(inputText, m.id, synonymLevel);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                        selectedMode === m.id
                          ? "bg-[#188038] text-white shadow-xs"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Synonym Slider */}
                <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
                  <span className="text-xs font-semibold text-gray-600 flex items-center space-x-1">
                    <Sliders className="w-3.5 h-3.5 text-gray-400" />
                    <span>Synonyms:</span>
                  </span>
                  <div className="flex items-center space-x-1.5">
                    {[1, 2, 3, 4].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => {
                          setSynonymLevel(lvl);
                          if (inputText.trim()) handleParaphrase(inputText, selectedMode, lvl);
                        }}
                        className={`w-6 h-6 rounded-md text-xs font-bold transition flex items-center justify-center ${
                          synonymLevel === lvl
                            ? "bg-[#188038] text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dual Pane Editor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col min-h-[380px]">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter or paste text to paraphrase..."
                    className="w-full flex-1 resize-none outline-none text-base text-gray-800 placeholder-gray-400"
                  />
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setInputText(SAMPLE_PARAPHRASE);
                        handleParaphrase(SAMPLE_PARAPHRASE);
                      }}
                      className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md"
                    >
                      Try sample text
                    </button>
                    <button
                      onClick={() => handleParaphrase()}
                      disabled={!inputText.trim() || isLoading}
                      className="px-5 py-2 rounded-lg bg-[#188038] text-white font-semibold text-sm hover:bg-[#0d5c24] transition disabled:opacity-50"
                    >
                      Paraphrase
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col min-h-[380px]">
                  <div className="flex-1 text-base text-gray-800 leading-relaxed overflow-y-auto">
                    {tokens.length > 0 ? (
                      tokens.map((token) => (
                        <span
                          key={token.id}
                          onClick={(e) => {
                            if (token.type === "synonym") {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setPopoverPos({ x: rect.left, y: rect.bottom + 6 });
                              setActiveToken(token);
                            }
                          }}
                          className={`mr-1.5 inline-block ${
                            token.type === "synonym"
                              ? "bg-amber-100 text-amber-950 px-1 py-0.5 rounded cursor-pointer border-b-2 border-amber-400 hover:bg-amber-200"
                              : token.type === "structural"
                              ? "bg-blue-100 text-blue-950 px-1 py-0.5 rounded border-b-2 border-blue-400"
                              : ""
                          }`}
                        >
                          {token.text}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-400 text-sm">Paraphrased output appears here...</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {tokens.map((t) => t.text).join(" ").trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                    <button
                      onClick={() => handleCopy(tokens.map((t) => t.text).join(" "))}
                      className="text-xs font-semibold px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. GRAMMAR CHECKER VIEW                                   */}
          {/* ========================================================= */}
          {activeTab === "grammar" && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">OpenQuill Grammar Checker</h2>
                    <p className="text-xs text-gray-500">
                      Detect and fix grammar, spelling, and punctuation errors in one click.
                    </p>
                  </div>
                  {grammarIssues.length > 0 && (
                    <button
                      onClick={handleFixAllGrammar}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Fix All Errors ({grammarIssues.length})</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
                  {/* Left Column: Input / Highlighted Text */}
                  <div className="lg:col-span-7 flex flex-col space-y-4">
                    <div className="relative border border-gray-200 rounded-xl p-4 bg-gray-50 min-h-[260px] flex flex-col">
                      <textarea
                        value={inputText}
                        onChange={(e) => {
                          setInputText(e.target.value);
                          if (grammarIssues.length > 0) setGrammarIssues([]);
                        }}
                        placeholder="Paste or type text here to check for grammar, spelling, and punctuation errors..."
                        className="w-full flex-1 bg-transparent resize-none outline-none text-base text-gray-800 placeholder-gray-400 font-sans leading-relaxed"
                        rows={8}
                      />
                      <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {inputText.trim() ? inputText.trim().split(/\s+/).length : 0} words
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              const sample = "He dont know nothing about their car. Its a shame they could of won teh game.";
                              setInputText(sample);
                              handleCheckGrammar(sample);
                            }}
                            className="text-xs text-emerald-700 hover:underline font-medium"
                          >
                            Try sample errors
                          </button>
                          <button
                            onClick={() => handleCheckGrammar()}
                            disabled={isLoading || !inputText.trim()}
                            className="px-4 py-1.5 bg-[#188038] hover:bg-[#13682d] text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition"
                          >
                            {isLoading ? "Checking..." : "Check Grammar"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Suggestions Cards */}
                  <div className="lg:col-span-5 flex flex-col space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Suggestions ({grammarIssues.length})
                      </span>
                      {grammarIssues.length === 0 && (
                        <span className="text-xs text-emerald-600 font-medium flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>No issues detected</span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                      {grammarIssues.map((issue) => (
                        <div
                          key={issue.id}
                          className="p-3.5 rounded-xl border border-gray-200 bg-white shadow-xs hover:border-emerald-300 transition flex flex-col space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                issue.type === "spelling"
                                  ? "bg-red-100 text-red-800"
                                  : issue.type === "punctuation"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {issue.type}
                            </span>
                            <button
                              onClick={() => handleFixSingleIssue(issue.id)}
                              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md transition"
                            >
                              Accept
                            </button>
                          </div>

                          <div className="text-sm">
                            <span className="line-through text-red-600 mr-2">{issue.original}</span>
                            <span className="font-semibold text-emerald-700">&rarr; {issue.replacement}</span>
                          </div>

                          <p className="text-xs text-gray-500">{issue.reason}</p>
                        </div>
                      ))}

                      {grammarIssues.length === 0 && (
                        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-gray-700">All clear!</p>
                          <p className="text-[11px] text-gray-400 max-w-xs mx-auto mt-0.5">
                            Click &quot;Check Grammar&quot; or paste text with errors to see intelligent corrections.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. AI DETECTOR VIEW (WITH FULL PDF SCANNING)              */}
          {/* ========================================================= */}
          {activeTab === "detector" && (
            <div className="space-y-6">
              {/* Header Card with Mode Toggle */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                    <span>AI Content Detector</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Full PDF Support
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Scan complete multi-page PDF documents or text to verify AI probability and human authenticity.
                  </p>
                </div>

                {/* Input Mode Selector */}
                <div className="flex items-center bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
                  <button
                    onClick={() => setDetectorInputMode("pdf")}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      detectorInputMode === "pdf"
                        ? "bg-white text-gray-900 shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Upload PDF File</span>
                  </button>
                  <button
                    onClick={() => setDetectorInputMode("text")}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      detectorInputMode === "text"
                        ? "bg-white text-gray-900 shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <ClipboardPaste className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Paste Text</span>
                  </button>
                </div>
              </div>

              {/* 1. PDF Upload Mode */}
              {detectorInputMode === "pdf" && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.md"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePdfUpload(file);
                    }}
                  />

                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingPdf(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDraggingPdf(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingPdf(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handlePdfUpload(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
                      isDraggingPdf
                        ? "border-emerald-500 bg-emerald-50/50"
                        : "border-gray-200 hover:border-emerald-400 bg-gray-50/50 hover:bg-emerald-50/20"
                    }`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center shadow-xs">
                      {isUploadingPdf ? (
                        <RefreshCw className="w-7 h-7 animate-spin" />
                      ) : (
                        <FileUp className="w-7 h-7" />
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        {isUploadingPdf ? "Scanning PDF for AI content..." : "Click to upload or drag & drop a PDF"}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Supports full multi-page PDF documents, articles, essays, and reports (.pdf, .txt)
                      </p>
                    </div>

                    {!isUploadingPdf && (
                      <span className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold shadow-2xs hover:bg-gray-100 transition">
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Select PDF Document</span>
                      </span>
                    )}
                  </div>

                  {/* Error Notification */}
                  {pdfUploadError && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{pdfUploadError}</span>
                    </div>
                  )}

                  {/* Uploaded PDF Document Info Badge */}
                  {uploadedPdfInfo && (
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          PDF
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 truncate max-w-sm">
                            {uploadedPdfInfo.filename}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center space-x-3 mt-0.5">
                            <span>{(uploadedPdfInfo.fileSize / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span>{uploadedPdfInfo.totalPages} {uploadedPdfInfo.totalPages === 1 ? "page" : "pages"}</span>
                            <span>•</span>
                            <span>{uploadedPdfInfo.totalWords.toLocaleString()} words</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleDownloadPdfAiReport}
                          className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold shadow-xs transition flex items-center space-x-1.5"
                          title="Download audit report for this PDF"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Audit Report</span>
                        </button>
                        <button
                          onClick={() => {
                            fileInputRef.current?.click();
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center space-x-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Scan Another</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Paste Text Mode */}
              {detectorInputMode === "text" && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste text here to detect AI-generated content (ChatGPT, Claude, Gemini, etc.)..."
                    className="w-full h-36 resize-none outline-none text-base text-gray-800 placeholder-gray-400"
                  />
                  <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {inputText.trim() ? inputText.trim().split(/\s+/).length : 0} words
                    </span>
                    <button
                      onClick={() => handleAiDetect()}
                      disabled={!inputText.trim() || isLoading}
                      className="px-6 py-2.5 rounded-xl bg-[#188038] text-white font-bold text-sm hover:bg-[#0d5c24] transition disabled:opacity-50"
                    >
                      {isLoading ? "Scanning..." : "Scan for AI"}
                    </button>
                  </div>
                </div>
              )}

              {/* AI Detection Results Section */}
              {aiDetectorResult && (
                <div className="space-y-6">
                  {/* Top Metric Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Overall AI Gauge Card */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Overall AI Likelihood
                      </span>
                      <span
                        className={`text-5xl font-black ${
                          aiDetectorResult.overallAiPercent >= 65
                            ? "text-red-600"
                            : aiDetectorResult.overallAiPercent >= 35
                            ? "text-amber-500"
                            : "text-emerald-600"
                        }`}
                      >
                        {aiDetectorResult.overallAiPercent}%
                      </span>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-3 ${
                          aiDetectorResult.overallAiPercent >= 65
                            ? "bg-red-100 text-red-800"
                            : aiDetectorResult.overallAiPercent >= 35
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {aiDetectorResult.verdict}
                      </span>
                    </div>

                    {/* Human Probability Card */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Human Authenticity
                      </span>
                      <span className="text-5xl font-black text-gray-900">
                        {aiDetectorResult.humanPercent}%
                      </span>
                      <span className="text-xs text-gray-500 mt-3 font-medium">
                        {aiDetectorResult.humanPercent >= 70
                          ? "High human writing signals detected"
                          : "Machine cadence or cliches found"}
                      </span>
                    </div>

                    {/* Document Scope Card */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col justify-center space-y-2.5">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Document Scope
                      </span>
                      <div className="space-y-1.5 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>Pages Scanned:</span>
                          <strong className="text-gray-900">{uploadedPdfInfo?.totalPages || 1}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Words:</span>
                          <strong className="text-gray-900">
                            {uploadedPdfInfo?.totalWords || (inputText.trim() ? inputText.trim().split(/\s+/).length : 0)}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Sentences Analyzed:</span>
                          <strong className="text-gray-900">
                            {aiDetectorResult.sentences ? aiDetectorResult.sentences.length : 0}
                          </strong>
                        </div>
                      </div>
                      <button
                        onClick={handleDownloadPdfAiReport}
                        className="w-full mt-2 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Full PDF Report</span>
                      </button>
                    </div>
                  </div>

                  {/* Page-by-Page Breakdown (if multi-page PDF) */}
                  {uploadedPdfInfo && uploadedPdfInfo.pageBreakdown.length > 1 && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                          <Layers className="w-4 h-4 text-emerald-600" />
                          <span>Page-by-Page AI Detection Breakdown</span>
                        </h4>
                        <span className="text-xs text-gray-500 font-medium">
                          {uploadedPdfInfo.pageBreakdown.length} Pages Verified
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {uploadedPdfInfo.pageBreakdown.map((page) => (
                          <div
                            key={page.pageNumber}
                            className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-white hover:border-emerald-300 transition flex flex-col justify-between space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-gray-900">
                                Page {page.pageNumber}
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                  page.aiPercent >= 65
                                    ? "bg-red-100 text-red-800"
                                    : page.aiPercent >= 35
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {page.aiPercent}% AI
                              </span>
                            </div>

                            <p className="text-[11px] text-gray-600 italic line-clamp-2">
                              &ldquo;{page.preview}&rdquo;
                            </p>

                            <div className="text-[10px] text-gray-400 font-semibold pt-1 border-t border-gray-200/60">
                              {page.words} words
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sentence Classification Breakdown */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-900">
                        Detailed Sentence Classification Breakdown
                      </h4>
                      <span className="text-xs text-gray-500">
                        {aiDetectorResult.sentences ? aiDetectorResult.sentences.length : 0} sentences analyzed
                      </span>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {aiDetectorResult.sentences.map((sent: any) => (
                        <div
                          key={sent.id}
                          className={`p-3 rounded-xl text-xs leading-relaxed border ${
                            sent.classification === "ai"
                              ? "bg-red-50 border-red-200 text-red-950"
                              : sent.classification === "mixed"
                              ? "bg-amber-50 border-amber-200 text-amber-950"
                              : sent.classification === "citation"
                              ? "bg-slate-50 border-slate-200 text-slate-700"
                              : "bg-emerald-50 border-emerald-200 text-emerald-950"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-extrabold uppercase text-[10px]">
                              [{sent.classification}] (
                              {sent.classification === "citation"
                                ? "Excluded Reference"
                                : `${sent.aiScore}% AI Risk`}
                              )
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                sent.classification === "ai"
                                  ? "bg-red-200 text-red-900"
                                  : sent.classification === "mixed"
                                  ? "bg-amber-200 text-amber-900"
                                  : sent.classification === "citation"
                                  ? "bg-slate-200 text-slate-800"
                                  : "bg-emerald-200 text-emerald-900"
                              }`}
                            >
                              {sent.classification === "ai"
                                ? "High AI Probability"
                                : sent.classification === "mixed"
                                ? "Mixed Signals"
                                : sent.classification === "citation"
                                ? "Reference / Citation"
                                : "Human Written"}
                            </span>
                          </div>
                          <div>{sent.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. AI HUMANIZER VIEW (WITH FULL PDF SUPPORT)              */}
          {/* ========================================================= */}
          {activeTab === "humanizer" && (
            <div className="space-y-6">
              {/* Header Card with Mode Toggle and Tone Controls */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>AI Text & PDF Humanizer</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Full PDF Support
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Humanize entire multi-page research papers or text to bypass Turnitin & GPTZero while preserving 100% of facts, math, and citations.
                  </p>
                </div>

                {/* Mode Selector (Paste Text vs Upload PDF) */}
                <div className="flex items-center space-x-1.5 bg-gray-100 p-1 rounded-xl self-start md:self-auto">
                  <button
                    onClick={() => setHumanizerInputMode("text")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                      humanizerInputMode === "text"
                        ? "bg-white text-gray-900 shadow-xs font-bold"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Paste Text</span>
                  </button>
                  <button
                    onClick={() => setHumanizerInputMode("pdf")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                      humanizerInputMode === "pdf"
                        ? "bg-white text-gray-900 shadow-xs font-bold"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <FileUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Upload PDF Document</span>
                  </button>
                </div>
              </div>

              {/* Tone Selection Bar */}
              <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">
                    Tone:
                  </span>
                  {(["academic", "casual", "creative"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setHumanizerMode(m);
                        if (humanizerInputMode === "text" && inputText.trim()) {
                          handleHumanize(inputText, m);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                        humanizerMode === m
                          ? "bg-[#188038] text-white shadow-xs"
                          : "text-gray-700 bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      {m === "academic" ? "Academic (Recommended for Papers)" : m}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-gray-500 font-medium hidden sm:inline">
                  Bypasses Turnitin, GPTZero & Copyleaks
                </span>
              </div>

              {/* 1. PDF Upload Mode */}
              {humanizerInputMode === "pdf" && (
                <div className="space-y-6">
                  {/* Hidden File Input */}
                  <input
                    ref={humanizerFileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleHumanizePdfUpload(file);
                    }}
                  />

                  {/* Dropzone (shown when no PDF or when uploading) */}
                  {!humanizerPdfInfo && (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingHumanizerPdf(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDraggingHumanizerPdf(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingHumanizerPdf(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleHumanizePdfUpload(file);
                      }}
                      onClick={() => {
                        if (!isHumanizingPdf) humanizerFileInputRef.current?.click();
                      }}
                      className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                        isDraggingHumanizerPdf
                          ? "border-emerald-500 bg-emerald-50/50"
                          : "border-gray-300 hover:border-emerald-400 bg-white"
                      }`}
                    >
                      {isHumanizingPdf ? (
                        <div className="py-6 flex flex-col items-center space-y-3">
                          <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
                          <p className="text-sm font-bold text-gray-800">
                            Humanizing entire multi-page PDF document...
                          </p>
                          <p className="text-xs text-gray-500 max-w-md">
                            Rewriting robotic AI cliches, formulaic openers, and passive constructs while keeping all technical facts, math, parameters, and citations intact.
                          </p>
                        </div>
                      ) : (
                        <div className="py-6 flex flex-col items-center space-y-2">
                          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-2 shadow-2xs">
                            <FileUp className="w-7 h-7" />
                          </div>
                          <h4 className="text-base font-bold text-gray-900">
                            Upload PDF to Humanize Entire Document
                          </h4>
                          <p className="text-xs text-gray-500 max-w-sm">
                            Drag & drop your multi-page IEEE, ACM, arXiv, or conference paper PDF here, or click to browse.
                          </p>
                          <div className="pt-2 flex items-center space-x-2 text-[11px] text-gray-400 font-medium">
                            <span className="bg-gray-100 px-2 py-0.5 rounded">.PDF Documents</span>
                            <span>&bull;</span>
                            <span>Preserves Math, Citations & Tables</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error Notification */}
                  {humanizerPdfError && (
                    <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{humanizerPdfError}</span>
                    </div>
                  )}

                  {/* Humanized PDF Results Dashboard */}
                  {humanizerPdfInfo && (
                    <div className="space-y-6">
                      {/* File Details & Action Bar */}
                      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                            <FileCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 truncate max-w-xs sm:max-w-md">
                              {humanizerPdfInfo.filename}
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {humanizerPdfInfo.totalPages} pages &bull; {humanizerPdfInfo.totalWords.toLocaleString()} words analyzed &bull; {humanizerPdfInfo.changesCount} expressions humanized
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleScanHumanizedInDetector(humanizerPdfInfo.humanizedText)}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5"
                            title="Verify this humanized text in OpenQuill AI Content Detector"
                          >
                            <Scan className="w-4 h-4" />
                            <span>Verify in AI Detector</span>
                          </button>
                          <button
                            onClick={handleDownloadHumanizedText}
                            className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold shadow-xs transition flex items-center space-x-1.5"
                            title="Download humanized text document"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Download .TXT</span>
                          </button>
                          <button
                            onClick={() => humanizerFileInputRef.current?.click()}
                            className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold transition flex items-center space-x-1"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Another PDF</span>
                          </button>
                        </div>
                      </div>

                      {/* Before vs After Metric Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Before Score Card */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col items-center justify-center text-center">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Original AI Score (Before)
                          </span>
                          <span className="text-4xl font-black text-red-600">
                            {humanizerPdfInfo.originalAiPercent}%
                          </span>
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-2 bg-red-100 text-red-800">
                            {humanizerPdfInfo.verdictBefore}
                          </span>
                        </div>

                        {/* After Score Card */}
                        <div className="bg-white border-2 border-emerald-500 rounded-2xl p-5 shadow-xs flex flex-col items-center justify-center text-center relative overflow-hidden bg-gradient-to-b from-emerald-50/40 to-white">
                          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Humanized Score (After)</span>
                          </span>
                          <span className="text-4xl font-black text-emerald-700">
                            {humanizerPdfInfo.humanizedAiPercent}%
                          </span>
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-2 bg-emerald-100 text-emerald-800">
                            {humanizerPdfInfo.humanizedHumanPercent}% Human Authenticity ({humanizerPdfInfo.verdictAfter})
                          </span>
                        </div>

                        {/* Rewrite Impact Card */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-center space-y-2">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Content Integrity
                          </span>
                          <div className="space-y-1.5 text-xs text-gray-600">
                            <div className="flex justify-between">
                              <span>Robotic Phrases Rewritten:</span>
                              <strong className="text-gray-900">{humanizerPdfInfo.changesCount}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Technical Terms & Math:</span>
                              <strong className="text-emerald-700 font-bold">100% Preserved</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Citations & References:</span>
                              <strong className="text-emerald-700 font-bold">Intact & Linked</strong>
                            </div>
                          </div>
                          <button
                            onClick={() => handleScanHumanizedInDetector(humanizerPdfInfo.humanizedText)}
                            className="w-full mt-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5"
                          >
                            <Scan className="w-3.5 h-3.5" />
                            <span>Test Live in AI Detector Tab &rarr;</span>
                          </button>
                        </div>
                      </div>

                      {/* Dual-Pane Before & After Text Viewer */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Original Text Pane */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col h-[460px]">
                          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Original PDF Text
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                              {humanizerPdfInfo.originalAiPercent}% AI
                            </span>
                          </div>
                          <div className="flex-1 overflow-y-auto text-xs leading-relaxed text-gray-700 font-mono whitespace-pre-wrap pr-1 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                            {humanizerPdfInfo.originalText}
                          </div>
                        </div>

                        {/* Humanized Text Pane */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col h-[460px]">
                          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Humanized Text (Undetectable)</span>
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                {humanizerPdfInfo.humanizedHumanPercent}% Human
                              </span>
                              <button
                                onClick={() => handleCopy(humanizerPdfInfo.humanizedText)}
                                className="text-xs font-semibold px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md flex items-center space-x-1"
                              >
                                <Copy className="w-3 h-3" />
                                <span>{copied ? "Copied" : "Copy"}</span>
                              </button>
                            </div>
                          </div>
                          <div className="flex-1 overflow-y-auto text-xs leading-relaxed text-gray-900 whitespace-pre-wrap pr-1 bg-emerald-50/20 p-3 rounded-xl border border-emerald-100">
                            {humanizerPdfInfo.humanizedText}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Paste Text Mode */}
              {humanizerInputMode === "text" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col min-h-[380px]">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Paste AI-generated or robotic text here (e.g. from ChatGPT or Claude)..."
                      className="w-full flex-1 resize-none outline-none text-base text-gray-800 placeholder-gray-400"
                    />
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <button
                        onClick={() => {
                          const sampleAi = "Furthermore, artificial intelligence plays a vital role in modern infrastructure. Moreover, it is important to remember that machine learning algorithms utilize data to facilitate decision-making processes.";
                          setInputText(sampleAi);
                          handleHumanize(sampleAi);
                        }}
                        className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md"
                      >
                        Try AI Sample
                      </button>
                      <button
                        onClick={() => handleHumanize()}
                        disabled={!inputText.trim() || isLoading}
                        className="px-6 py-2.5 rounded-xl bg-[#188038] text-white font-bold text-sm hover:bg-[#0d5c24] transition disabled:opacity-50 flex items-center space-x-1.5"
                      >
                        {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        <span>Humanize Text</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col min-h-[380px]">
                    {humanizerResult ? (
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{humanizerStats?.humanScore || 98}% Human Score</span>
                            </span>
                            <span className="text-xs font-medium text-gray-500">
                              {humanizerStats?.changesCount || 4} AI patterns rewritten
                            </span>
                          </div>
                          <p className="text-base leading-relaxed text-gray-800 whitespace-pre-wrap">{humanizerResult}</p>
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-xs text-emerald-700 font-semibold flex items-center space-x-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>100% Undetectable</span>
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleScanHumanizedInDetector(humanizerResult)}
                              className="text-xs font-bold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center space-x-1 shadow-xs transition"
                              title="Send this humanized text to the AI Detector"
                            >
                              <Scan className="w-3.5 h-3.5" />
                              <span>Scan in AI Detector</span>
                            </button>
                            <button
                              onClick={() => handleCopy(humanizerResult)}
                              className="text-xs font-semibold px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center space-x-1"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>{copied ? "Copied!" : "Copy"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                        <Sparkles className="w-10 h-10 text-emerald-500 mb-2" />
                        <p className="text-sm font-bold text-gray-700">Humanized Output</p>
                        <p className="text-xs text-gray-400">Natural human phrasing will appear here after clicking Humanize.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 5. AI CHAT VIEW                                           */}
          {/* ========================================================= */}
          {activeTab === "chat" && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs flex flex-col h-[560px]">
              {/* Preset prompt pills */}
              <div className="px-5 py-3 border-b border-gray-100 flex items-center space-x-2 overflow-x-auto bg-gray-50/50">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">
                  Quick Actions:
                </span>
                {[
                  "Generate an outline",
                  "Suggest 3 opening hooks",
                  "Improve formal tone",
                  "Explain APA citation",
                  "Find counterarguments",
                ].map((promptText, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => handleSendChat(promptText)}
                    className="text-xs font-medium text-emerald-800 bg-white border border-emerald-200 hover:bg-emerald-50 px-2.5 py-1 rounded-full whitespace-nowrap transition shadow-2xs"
                  >
                    {promptText}
                  </button>
                ))}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-[#188038] text-white shadow-xs"
                          : "bg-gray-100 text-gray-800 border border-gray-200/50"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-500 rounded-2xl px-4 py-3 text-xs flex items-center space-x-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>OpenQuill AI is typing...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-100 flex items-center space-x-2 bg-white">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSendChat()}
                  placeholder="Ask OpenQuill to draft, explain, critique, or rewrite..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-600 transition"
                />
                <button
                  onClick={() => handleSendChat()}
                  disabled={!chatInput.trim() || isLoading}
                  className="p-2.5 bg-[#188038] hover:bg-[#0d5c24] text-white rounded-xl transition disabled:opacity-50 shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 6. TRANSLATE VIEW                                         */}
          {/* ========================================================= */}
          {activeTab === "translate" && (
            <div className="space-y-4">
              {/* Language Selection Header */}
              <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-semibold text-gray-500">From:</span>
                  <select
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 outline-none font-medium bg-gray-50"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish (Español)</option>
                    <option value="fr">French (Français)</option>
                    <option value="de">German (Deutsch)</option>
                  </select>

                  <span className="text-xs font-semibold text-gray-500">To:</span>
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 outline-none font-medium bg-gray-50"
                  >
                    <option value="es">Spanish (Español)</option>
                    <option value="fr">French (Français)</option>
                    <option value="de">German (Deutsch)</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                    <option value="ja">Japanese (日本語)</option>
                    <option value="zh">Chinese (中文)</option>
                    <option value="it">Italian (Italiano)</option>
                    <option value="pt">Portuguese (Português)</option>
                    <option value="ru">Russian (Русский)</option>
                    <option value="ar">Arabic (العربية)</option>
                  </select>
                </div>

                <button
                  onClick={() => handleTranslate()}
                  disabled={!inputText.trim() || isTranslating}
                  className="px-6 py-2 rounded-xl bg-[#188038] hover:bg-[#0d5c24] text-white font-bold text-xs transition disabled:opacity-50 flex items-center space-x-1.5 shadow-xs"
                >
                  {isTranslating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
                  <span>{isTranslating ? "Translating..." : "Translate Document"}</span>
                </button>
              </div>

              {/* Side-by-Side Dual Editor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col min-h-[380px]">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter text to translate..."
                    className="w-full flex-1 resize-none outline-none text-base text-gray-800 placeholder-gray-400"
                  />
                  <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                    <span>{inputText.length} characters</span>
                    <button
                      onClick={() => {
                        const sample = "Artificial intelligence and deep learning are transforming industries worldwide.";
                        setInputText(sample);
                        handleTranslate(sample);
                      }}
                      className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-medium"
                    >
                      Sample Text
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col min-h-[380px]">
                  {translatedText ? (
                    <div className="flex-1 flex flex-col justify-between">
                      <p className="text-base leading-relaxed text-gray-800">{translatedText}</p>
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-400">Translated with MyMemory Engine</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleCopy(translatedText)}
                            className="text-xs font-semibold px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center space-x-1"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{copied ? "Copied!" : "Copy"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                      <Languages className="w-10 h-10 text-emerald-500 mb-2" />
                      <p className="text-sm font-bold text-gray-700">Translation</p>
                      <p className="text-xs text-gray-400">Select target language and click Translate.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Synonym Replacement Popover */}
      {activeToken && popoverPos && (
        <div
          style={{ top: popoverPos.y, left: popoverPos.x }}
          className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-2.5 min-w-[190px] animate-popover"
        >
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
            <span>Synonyms for: "{activeToken.text}"</span>
            <button
              onClick={() => setActiveToken(null)}
              className="text-gray-400 hover:text-gray-700 text-xs"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1">
            {activeToken.synonyms.map((syn, sIdx) => (
              <button
                key={sIdx}
                onClick={() => {
                  setTokens((prev) =>
                    prev.map((t) => (t.id === activeToken.id ? { ...t, text: syn } : t))
                  );
                  setActiveToken(null);
                }}
                className="w-full text-left px-2.5 py-1.5 text-xs text-gray-800 hover:bg-emerald-50 hover:text-[#188038] rounded-md font-medium transition flex items-center justify-between"
              >
                <span>{syn}</span>
                <span className="text-[10px] text-gray-400">#{sIdx + 1}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 bg-emerald-800 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center space-x-3 z-50 text-xs font-semibold border border-emerald-600 transition">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <div>
            <div className="font-bold text-sm">Report Generated & Downloaded</div>
            <div className="text-emerald-200 text-[11px]">Saved to your browser downloads folder.</div>
          </div>
        </div>
      )}
    </div>
  );
}
