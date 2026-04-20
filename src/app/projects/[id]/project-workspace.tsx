"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Observation = {
  id: string;
  text: string;
  summary: string | null;
  modelLayer: string;
  provenance: string;
  confidence: string;
  primaryValueAxis: string | null;
  sourceType: string | null;
  sourceTitle: string | null;
  trustScore: number;
  createdAt: string;
  tags: { id: string; code: string; name: string; type: string }[];
  rawFileIds: string[];
};

type RawFile = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  blobUrl: string;
  status: string;
  createdAt: string;
  observationCount: number;
};

type Stats = {
  observationCount: number;
  rawFileCount: number;
  insightLinkCount: number;
  bySourceType: Record<string, number>;
  rawFileTypeCount: Record<string, number>;
};

type Workspace = {
  project: unknown;
  stats: Stats;
  observations: Observation[];
  rawFiles: RawFile[];
};

type Tab = "overview" | "files" | "observations" | "dedup";

const MODEL_LAYER_LABELS: Record<string, { label: string; color: string }> = {
  MOVEMENT: { label: "動線", color: "bg-blue-100 text-blue-700" },
  APPROACH: { label: "接点", color: "bg-emerald-100 text-emerald-700" },
  BREAKDOWN: { label: "離脱", color: "bg-red-100 text-red-700" },
  TRANSFER: { label: "伝承", color: "bg-violet-100 text-violet-700" },
};

const PROVENANCE_LABELS: Record<string, string> = {
  FIELD_OBSERVED: "①固有知",
  ANONYMIZED_DERIVED: "②汎用知",
  PUBLIC_CODIFIED: "③公知",
};

const SOURCE_TYPE_ICON: Record<string, string> = {
  PDF: "📄",
  DOCX: "📝",
  TXT: "📃",
  CSV: "📊",
  MP4: "🎥",
  MOV: "🎥",
  PNG: "🖼️",
  JPG: "🖼️",
  manual: "✏️",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectWorkspace({ projectId }: { projectId: string }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/workspace`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "読み込み失敗");
      setData(json);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="py-12 text-center text-sm text-zinc-400">
          読み込み中…
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="shadow-sm">
        <CardContent className="py-12 text-center text-sm text-red-600">
          {error || "データが取得できませんでした"}
        </CardContent>
      </Card>
    );
  }

  const { stats, observations, rawFiles } = data;

  const sourceTypes = Array.from(
    new Set(observations.map((o) => o.sourceType || "manual")),
  ).sort();

  const filteredObservations =
    sourceFilter === "ALL"
      ? observations
      : observations.filter((o) => (o.sourceType || "manual") === sourceFilter);

  return (
    <div className="space-y-4">
      {/* サマリ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="shadow-sm">
          <CardContent className="py-3">
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
              観測データ
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1">
              {stats.observationCount}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="py-3">
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
              紐付ファイル
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1">
              {stats.rawFileCount}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="py-3">
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
              洞察リンク
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1">
              {stats.insightLinkCount}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="py-3">
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
              フォーマット内訳
            </p>
            <div className="flex flex-wrap gap-1 mt-1 text-[11px]">
              {Object.entries(stats.bySourceType).map(([k, v]) => (
                <span key={k} className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
                  {SOURCE_TYPE_ICON[k] || "📎"} {k} {v}
                </span>
              ))}
              {Object.keys(stats.bySourceType).length === 0 && (
                <span className="text-[11px] text-zinc-400">まだありません</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* アクションバー */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link href={`/ingest`}>
          <Button size="sm" className="text-xs h-8">
            このPJにデータを取込む →
          </Button>
        </Link>
        <Link href={`/dedup?projectId=${projectId}`}>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8"
            disabled={stats.observationCount < 2}
          >
            このPJで重複統合
          </Button>
        </Link>
        <Link href={`/search?projectId=${projectId}`} className="hidden">
          {/* 将来: プロジェクト絞込検索 */}
        </Link>
      </div>

      {/* タブ */}
      <div className="flex gap-1 border-b border-zinc-200">
        {(
          [
            { id: "overview", label: "概要" },
            { id: "files", label: `ファイル (${rawFiles.length})` },
            { id: "observations", label: `観測 (${observations.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-xs font-medium relative ${
              tab === t.id
                ? "text-zinc-900"
                : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900" />
            )}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      {tab === "overview" && (
        <Card className="shadow-sm">
          <CardContent className="py-4 space-y-3 text-sm">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                データ整理のヒント
              </p>
              <ul className="text-xs text-zinc-600 space-y-1 list-disc list-inside">
                <li>
                  複数フォーマット(PDF/日報/動画)が同じ事象を別角度で捉えている場合は「重複統合」で1件に集約できます
                </li>
                <li>
                  フォーマット別件数で投入バランスを確認 — 観測が偏っていれば別ソースからの取込を検討
                </li>
                <li>
                  観測タブの「ソース絞込」で PDF のみ / 手入力のみ等を比較できます
                </li>
              </ul>
            </div>
            {Object.keys(stats.rawFileTypeCount).length > 0 && (
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                  ファイルタイプ別
                </p>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  {Object.entries(stats.rawFileTypeCount).map(([k, v]) => (
                    <span
                      key={k}
                      className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700"
                    >
                      {SOURCE_TYPE_ICON[k] || "📎"} {k} × {v}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "files" && (
        <Card className="shadow-sm">
          <CardContent className="py-3">
            {rawFiles.length === 0 ? (
              <p className="text-sm text-zinc-400 py-8 text-center">
                このプロジェクトに紐づくファイルはまだありません。「データを取込む」からアップロードしてください。
              </p>
            ) : (
              <div className="divide-y">
                {rawFiles.map((rf) => (
                  <div
                    key={rf.id}
                    className="py-2 flex items-start gap-3 text-sm"
                  >
                    <span className="text-xl shrink-0">
                      {SOURCE_TYPE_ICON[rf.fileType] || "📎"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={rf.blobUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-zinc-900 hover:text-blue-600 truncate"
                        >
                          {rf.fileName}
                        </a>
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-zinc-100 text-zinc-600"
                        >
                          {rf.fileType}
                        </Badge>
                        <span className="text-[10px] text-zinc-400">
                          {formatFileSize(rf.fileSize)}
                        </span>
                        <Badge className="text-[10px] bg-emerald-50 text-emerald-700">
                          観測 {rf.observationCount}件
                        </Badge>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {new Date(rf.createdAt).toLocaleString("ja-JP")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "observations" && (
        <div className="space-y-2">
          {/* ソース絞込 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-zinc-500">ソース:</span>
            <button
              type="button"
              onClick={() => setSourceFilter("ALL")}
              className={`text-[10px] px-2 py-0.5 rounded border ${
                sourceFilter === "ALL"
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-600 border-zinc-300"
              }`}
            >
              ALL ({observations.length})
            </button>
            {sourceTypes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSourceFilter(s)}
                className={`text-[10px] px-2 py-0.5 rounded border ${
                  sourceFilter === s
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-600 border-zinc-300"
                }`}
              >
                {SOURCE_TYPE_ICON[s] || "📎"} {s} ({stats.bySourceType[s] || 0})
              </button>
            ))}
          </div>

          {filteredObservations.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="py-8 text-center text-sm text-zinc-400">
                該当する観測データがありません
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredObservations.map((o) => (
                <Card key={o.id} className="shadow-sm">
                  <CardContent className="py-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                          MODEL_LAYER_LABELS[o.modelLayer]?.color || "bg-zinc-100"
                        }`}
                      >
                        {MODEL_LAYER_LABELS[o.modelLayer]?.label || o.modelLayer}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {PROVENANCE_LABELS[o.provenance] || o.provenance}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        Trust {(o.trustScore * 100).toFixed(0)}
                      </span>
                      {o.sourceType && (
                        <span className="text-[10px] text-zinc-500">
                          {SOURCE_TYPE_ICON[o.sourceType] || "📎"} {o.sourceType}
                        </span>
                      )}
                      {o.sourceTitle && (
                        <span className="text-[10px] text-zinc-400 truncate max-w-[200px]">
                          {o.sourceTitle}
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-400 ml-auto">
                        {new Date(o.createdAt).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-800 whitespace-pre-wrap">
                      {o.text}
                    </p>
                    {o.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {o.tags.map((t) => (
                          <Badge
                            key={t.id}
                            variant="outline"
                            className="text-[10px] bg-zinc-50"
                          >
                            {t.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
