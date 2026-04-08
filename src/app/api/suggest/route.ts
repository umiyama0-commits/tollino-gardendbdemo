import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { suggestMetadata } from "@/lib/llm";

// POST: テキストからメタデータを自動推定
export async function POST(request: NextRequest) {
  const { text } = await request.json();

  if (!text?.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const suggestion = await suggestMetadata(text.trim());

    // tagCodesをtagIdsに変換
    const tagIds: string[] = [];
    if (suggestion.tagCodes?.length) {
      const tags = await prisma.ontologyTag.findMany({
        where: { code: { in: suggestion.tagCodes } },
        select: { id: true, code: true },
      });
      tagIds.push(...tags.map((t) => t.id));
    }

    return NextResponse.json({
      modelLayer: suggestion.modelLayer,
      primaryValueAxis: suggestion.primaryValueAxis,
      provenance: suggestion.provenance,
      confidence: suggestion.confidence,
      tagIds,
      tagCodes: suggestion.tagCodes || [],
      reasoning: suggestion.reasoning,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
