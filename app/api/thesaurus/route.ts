import { NextRequest, NextResponse } from "next/server";
import { getSynonymsForWord } from "@/lib/thesaurus";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const word = searchParams.get("word");

  if (!word) {
    return NextResponse.json({ error: "Word parameter is required" }, { status: 400 });
  }

  const synonyms = getSynonymsForWord(word);

  return NextResponse.json({
    word,
    synonyms,
  });
}
