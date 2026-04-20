// 承認された統合案でObservationをマージ実行
// POST /api/observations/merge
import { NextRequest, NextResponse } from "next/server";
import { mergeObservations } from "@/lib/dedup";
import { computeObservationTrustScore } from "@/lib/trust-score";
import { prisma } from "@/lib/prisma";
import { saveObservationEmbedding } from "@/lib/embedding";
import { generateSummary } from "@/lib/summary";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    canonicalId,
    absorbedIds,
    text,
    modelLayer,
    provenance,
    confidence,
    primaryValueAxis,
    tagIds,
  } = body;

  if (!canonicalId || !Array.isArray(absorbedIds) || absorbedIds.length === 0) {
    return NextResponse.json(
      { error: "canonicalId と absorbedIds は必須です" },
      { status: 400 },
    );
  }
  if (!text || !modelLayer || !provenance || !confidence) {
    return NextResponse.json(
      { error: "統合テキストと必須フィールドが不足しています" },
      { status: 400 },
    );
  }
  if (absorbedIds.includes(canonicalId)) {
    return NextResponse.json(
      { error: "canonicalId は absorbedIds に含められません" },
      { status: 400 },
    );
  }

  // trustScore 再計算
  const finalTagIds: string[] = Array.isArray(tagIds) ? tagIds : [];
  const tagRecords = finalTagIds.length
    ? await prisma.ontologyTag.findMany({
        where: { id: { in: finalTagIds } },
        select: { id: true, type: true },
      })
    : [];
  const tagTypes = new Set(tagRecords.map((t) => t.type));

  // 統合後は複数観測の裏付けがあるため insightLinkCount は統合後の実数を取得
  const insightLinkCount = await prisma.observationInsightLink.count({
    where: { observationId: { in: [canonicalId, ...absorbedIds] } },
  });

  const trustScore = computeObservationTrustScore({
    confidence,
    provenance,
    createdAt: new Date(),
    insightLinkCount,
    tagCount: finalTagIds.length,
    tagTypes,
  });

  try {
    const result = await mergeObservations({
      canonicalId,
      absorbedIds,
      mergedText: text,
      mergedSummary: generateSummary(text),
      mergedModelLayer: modelLayer,
      mergedProvenance: provenance,
      mergedConfidence: confidence,
      mergedPrimaryValueAxis: primaryValueAxis ?? null,
      mergedTagIds: finalTagIds,
      mergedTrustScore: trustScore,
    });

    // embedding を再生成（失敗しても統合自体は成功とみなす）
    saveObservationEmbedding(canonicalId, text).catch((err) =>
      console.error("Embedding regeneration failed:", err),
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("Merge error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "統合に失敗しました" },
      { status: 500 },
    );
  }
}
