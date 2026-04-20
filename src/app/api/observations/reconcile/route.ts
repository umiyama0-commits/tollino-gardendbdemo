// クラスタ内観測のLLM統合案生成
// POST /api/observations/reconcile { observationIds: string[] }
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reconcileObservationsWithLLM } from "@/lib/dedup";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { observationIds } = await request.json();

  if (!Array.isArray(observationIds) || observationIds.length < 2) {
    return NextResponse.json(
      { error: "observationIds は2件以上必要です" },
      { status: 400 },
    );
  }

  const obs = await prisma.observation.findMany({
    where: { id: { in: observationIds } },
    include: {
      tags: { include: { tag: { select: { code: true } } } },
    },
  });

  if (obs.length < 2) {
    return NextResponse.json(
      { error: "観測データが不足しています" },
      { status: 400 },
    );
  }

  const members = obs.map((o) => ({
    text: o.text,
    modelLayer: o.modelLayer,
    primaryValueAxis: o.primaryValueAxis,
    provenance: o.provenance,
    confidence: o.confidence,
    tagCodes: o.tags.map((t) => t.tag.code),
  }));

  try {
    const reconciled = await reconcileObservationsWithLLM(members);

    // tagCodes を tagId に解決
    const tagRecords = await prisma.ontologyTag.findMany({
      where: { code: { in: reconciled.tagCodes } },
      select: { id: true, code: true, displayNameJa: true, type: true },
    });
    const codeToId = new Map(tagRecords.map((t) => [t.code, t.id]));
    const resolvedTagIds = reconciled.tagCodes
      .map((c) => codeToId.get(c))
      .filter((id): id is string => Boolean(id));

    return NextResponse.json({
      reconciled,
      resolvedTags: tagRecords.map((t) => ({
        id: t.id,
        code: t.code,
        name: t.displayNameJa,
        type: t.type,
      })),
      resolvedTagIds,
    });
  } catch (err) {
    console.error("Reconcile error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "統合案生成に失敗しました" },
      { status: 500 },
    );
  }
}
