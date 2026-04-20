import { Suspense } from "react";
import { DedupClient } from "./dedup-client";

export const dynamic = "force-dynamic";

export default function DedupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">重複データ統合</h1>
        <p className="text-zinc-500 mt-1 text-sm">
          類似度が高いObservationを検出し、AIが統合案を生成。人間の承認後に1件に集約します。
        </p>
      </div>
      <Suspense fallback={<div className="text-sm text-zinc-400">読み込み中…</div>}>
        <DedupClient />
      </Suspense>
    </div>
  );
}
