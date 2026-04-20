// 重複Observationクラスタの検出
// GET /api/observations/duplicates?threshold=0.85
import { NextRequest, NextResponse } from "next/server";
import { detectDuplicateClusters, DUPLICATE_THRESHOLD } from "@/lib/dedup";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const thresholdParam = url.searchParams.get("threshold");
  const projectId = url.searchParams.get("projectId") || undefined;
  const threshold = thresholdParam ? parseFloat(thresholdParam) : DUPLICATE_THRESHOLD;

  if (isNaN(threshold) || threshold < 0.5 || threshold > 1) {
    return NextResponse.json(
      { error: "threshold は 0.5〜1.0 の範囲で指定してください" },
      { status: 400 },
    );
  }

  try {
    const clusters = await detectDuplicateClusters(threshold, projectId);
    return NextResponse.json({ threshold, projectId: projectId || null, clusters, total: clusters.length });
  } catch (err) {
    console.error("Duplicate detection error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "重複検出に失敗しました" },
      { status: 500 },
    );
  }
}
