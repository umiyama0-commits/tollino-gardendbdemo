// プロジェクトワークスペース: 観測 + RawFile を突号・整理するための統合ビュー
// GET /api/projects/[id]/workspace
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { client: { select: { id: true, name: true, industry: true } } },
  });

  if (!project) {
    return NextResponse.json({ error: "プロジェクトが見つかりません" }, { status: 404 });
  }

  const observations = await prisma.observation.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    include: {
      tags: { include: { tag: { select: { id: true, code: true, displayNameJa: true, type: true } } } },
      rawFiles: {
        select: {
          id: true,
          fileName: true,
          fileType: true,
          fileSize: true,
          blobUrl: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  // フォーマット別に観測を集計
  const bySourceType: Record<string, number> = {};
  for (const o of observations) {
    const key = o.sourceType || "manual";
    bySourceType[key] = (bySourceType[key] || 0) + 1;
  }

  // プロジェクトに紐づく RawFile を直接集約（Observation経由）
  const rawFileMap = new Map<
    string,
    {
      id: string;
      fileName: string;
      fileType: string;
      fileSize: number;
      blobUrl: string;
      status: string;
      createdAt: Date;
      observationCount: number;
    }
  >();
  for (const o of observations) {
    for (const rf of o.rawFiles) {
      const existing = rawFileMap.get(rf.id);
      if (existing) {
        existing.observationCount += 1;
      } else {
        rawFileMap.set(rf.id, { ...rf, observationCount: 1 });
      }
    }
  }
  const rawFiles = Array.from(rawFileMap.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  const rawFileTypeCount: Record<string, number> = {};
  for (const rf of rawFiles) {
    rawFileTypeCount[rf.fileType] = (rawFileTypeCount[rf.fileType] || 0) + 1;
  }

  // このプロジェクトの Insight 数（Observation→Insight リンク経由）
  const insightLinkCount = await prisma.observationInsightLink.count({
    where: { observation: { projectId: id } },
  });

  return NextResponse.json({
    project,
    stats: {
      observationCount: observations.length,
      rawFileCount: rawFiles.length,
      insightLinkCount,
      bySourceType,
      rawFileTypeCount,
    },
    observations: observations.map((o) => ({
      id: o.id,
      text: o.text,
      summary: o.summary,
      modelLayer: o.modelLayer,
      provenance: o.provenance,
      confidence: o.confidence,
      primaryValueAxis: o.primaryValueAxis,
      sourceType: o.sourceType,
      sourceTitle: o.sourceTitle,
      trustScore: o.trustScore,
      createdAt: o.createdAt,
      tags: o.tags.map((t) => ({
        id: t.tag.id,
        code: t.tag.code,
        name: t.tag.displayNameJa,
        type: t.tag.type,
      })),
      rawFileIds: o.rawFiles.map((r) => r.id),
    })),
    rawFiles,
  });
}
