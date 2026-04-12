import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { CreateObservationInput, safeParse } from "@/lib/validation";
import { saveObservationEmbedding } from "@/lib/embedding";
import { generateSummary } from "@/lib/summary";
import { computeObservationTrustScore } from "@/lib/trust-score";

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Zodバリデーション
  const parsed = safeParse(CreateObservationInput, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const input = parsed.data;

  // タグのtype情報を取得してtrustScore計算に使う
  const tagRecords = input.tagIds.length > 0
    ? await prisma.ontologyTag.findMany({
        where: { id: { in: input.tagIds } },
        select: { id: true, type: true },
      })
    : [];
  const tagTypes = new Set(tagRecords.map((t) => t.type));

  const trustScore = computeObservationTrustScore({
    confidence: input.confidence,
    provenance: input.provenance,
    createdAt: new Date(),
    insightLinkCount: 0,
    tagCount: input.tagIds.length,
    tagTypes,
  });

  const observation = await prisma.observation.create({
    data: {
      text: input.text,
      summary: generateSummary(input.text),
      modelLayer: input.modelLayer,
      provenance: input.provenance,
      primaryValueAxis: input.primaryValueAxis || null,
      confidence: input.confidence,
      country: input.country,
      projectId: input.projectId || null,
      storeId: input.storeId || null,
      sourceType: input.sourceType || null,
      sourceTitle: input.sourceTitle || null,
      trustScore,
      tags: {
        create: input.tagIds.map((tagId: string) => ({ tagId })),
      },
    },
    include: {
      tags: { include: { tag: true } },
    },
  });

  // Embedding生成（非同期、失敗してもObservation作成は成功させる）
  saveObservationEmbedding(observation.id, observation.text).catch((err) =>
    console.error("Embedding generation failed:", err)
  );

  return NextResponse.json(observation, { status: 201 });
}
