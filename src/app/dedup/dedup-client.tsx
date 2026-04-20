"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ClusterMember = {
  id: string;
  text: string;
  summary: string | null;
  modelLayer: string;
  provenance: string;
  confidence: string;
  primaryValueAxis: string | null;
  trustScore: number;
  createdAt: string;
  projectId: string | null;
  projectName: string | null;
  sourceTitle: string | null;
  sourceType: string | null;
  tagCount: number;
};

type Pair = { id1: string; id2: string; similarity: number };

type Cluster = {
  id: string;
  members: ClusterMember[];
  pairs: Pair[];
  topSimilarity: number;
};

type KpiImpact = {
  metric: string;
  direction: "UP" | "DOWN" | "NEUTRAL" | "UNKNOWN";
  magnitude: string;
  note: string;
};

type Reconciled = {
  text: string;
  event: string;
  outcome: string;
  kpiImpacts: KpiImpact[];
  modelLayer: string;
  primaryValueAxis: string | null;
  provenance: string;
  confidence: string;
  tagCodes: string[];
  reasoning: string;
  conflicts: string[];
};

type ResolvedTag = { id: string; code: string; name: string; type: string };

type ClusterUIState = {
  selected: Set<string>; // 吸収対象として選択されたID (canonical以外)
  canonicalId: string | null;
  reconciled: Reconciled | null;
  resolvedTags: ResolvedTag[];
  resolvedTagIds: string[];
  reconciling: boolean;
  merging: boolean;
  merged: boolean;
  error: string | null;
};

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

const CONFIDENCE_LABELS: Record<string, { label: string; color: string }> = {
  HIGH: { label: "高", color: "bg-emerald-100 text-emerald-700" },
  MEDIUM: { label: "中", color: "bg-amber-100 text-amber-700" },
  LOW: { label: "低", color: "bg-zinc-100 text-zinc-600" },
};

const DIRECTION_SYMBOL: Record<string, string> = {
  UP: "↑",
  DOWN: "↓",
  NEUTRAL: "→",
  UNKNOWN: "?",
};

const DIRECTION_COLOR: Record<string, string> = {
  UP: "text-emerald-600 bg-emerald-50 border-emerald-200",
  DOWN: "text-red-600 bg-red-50 border-red-200",
  NEUTRAL: "text-zinc-600 bg-zinc-50 border-zinc-200",
  UNKNOWN: "text-zinc-400 bg-zinc-50 border-zinc-200",
};

export function DedupClient() {
  const [threshold, setThreshold] = useState(0.85);
  const [scanning, setScanning] = useState(false);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [ui, setUi] = useState<Record<string, ClusterUIState>>({});

  const scan = useCallback(async () => {
    setScanning(true);
    setScanError(null);
    try {
      const res = await fetch(`/api/observations/duplicates?threshold=${threshold}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "検出失敗");
      setClusters(data.clusters || []);
      // 初期UI状態: 各クラスタで最高trustScoreのメンバーをcanonicalに、その他全員を吸収候補に
      const initUi: Record<string, ClusterUIState> = {};
      for (const c of data.clusters as Cluster[]) {
        const canonical = c.members[0]; // すでにtrustScore降順
        initUi[c.id] = {
          selected: new Set(c.members.filter((m) => m.id !== canonical.id).map((m) => m.id)),
          canonicalId: canonical.id,
          reconciled: null,
          resolvedTags: [],
          resolvedTagIds: [],
          reconciling: false,
          merging: false,
          merged: false,
          error: null,
        };
      }
      setUi(initUi);
    } catch (err) {
      setScanError((err as Error).message);
    } finally {
      setScanning(false);
    }
  }, [threshold]);

  const setCanonical = useCallback((clusterId: string, memberId: string) => {
    setUi((prev) => {
      const s = prev[clusterId];
      if (!s) return prev;
      const nextSelected = new Set(s.selected);
      nextSelected.delete(memberId); // canonicalは吸収対象から外す
      return {
        ...prev,
        [clusterId]: {
          ...s,
          canonicalId: memberId,
          selected: nextSelected,
          reconciled: null, // canonicalが変わったら再生成が必要
        },
      };
    });
  }, []);

  const toggleAbsorb = useCallback((clusterId: string, memberId: string) => {
    setUi((prev) => {
      const s = prev[clusterId];
      if (!s) return prev;
      if (memberId === s.canonicalId) return prev; // canonicalは切替不可
      const next = new Set(s.selected);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return {
        ...prev,
        [clusterId]: { ...s, selected: next, reconciled: null },
      };
    });
  }, []);

  const reconcile = useCallback(
    async (clusterId: string) => {
      const s = ui[clusterId];
      if (!s?.canonicalId) return;
      const ids = [s.canonicalId, ...Array.from(s.selected)];
      if (ids.length < 2) {
        setUi((prev) => ({
          ...prev,
          [clusterId]: { ...prev[clusterId], error: "2件以上選択してください" },
        }));
        return;
      }
      setUi((prev) => ({
        ...prev,
        [clusterId]: { ...prev[clusterId], reconciling: true, error: null },
      }));
      try {
        const res = await fetch("/api/observations/reconcile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ observationIds: ids }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "統合案生成失敗");
        setUi((prev) => ({
          ...prev,
          [clusterId]: {
            ...prev[clusterId],
            reconciled: data.reconciled,
            resolvedTags: data.resolvedTags || [],
            resolvedTagIds: data.resolvedTagIds || [],
            reconciling: false,
          },
        }));
      } catch (err) {
        setUi((prev) => ({
          ...prev,
          [clusterId]: {
            ...prev[clusterId],
            reconciling: false,
            error: (err as Error).message,
          },
        }));
      }
    },
    [ui],
  );

  const executeMerge = useCallback(
    async (clusterId: string) => {
      const s = ui[clusterId];
      if (!s?.canonicalId || !s.reconciled) return;
      const absorbedIds = Array.from(s.selected);
      if (absorbedIds.length === 0) {
        setUi((prev) => ({
          ...prev,
          [clusterId]: { ...prev[clusterId], error: "吸収対象を1件以上選択してください" },
        }));
        return;
      }
      if (!confirm(`canonical 1件 + 吸収 ${absorbedIds.length}件 を統合します。吸収される観測は削除されます (取り消し不可)。よろしいですか?`)) {
        return;
      }
      setUi((prev) => ({
        ...prev,
        [clusterId]: { ...prev[clusterId], merging: true, error: null },
      }));
      try {
        const payload = {
          canonicalId: s.canonicalId,
          absorbedIds,
          text: s.reconciled.text,
          modelLayer: s.reconciled.modelLayer,
          provenance: s.reconciled.provenance,
          confidence: s.reconciled.confidence,
          primaryValueAxis: s.reconciled.primaryValueAxis,
          tagIds: s.resolvedTagIds,
        };
        const res = await fetch("/api/observations/merge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "統合失敗");
        setUi((prev) => ({
          ...prev,
          [clusterId]: { ...prev[clusterId], merging: false, merged: true },
        }));
      } catch (err) {
        setUi((prev) => ({
          ...prev,
          [clusterId]: {
            ...prev[clusterId],
            merging: false,
            error: (err as Error).message,
          },
        }));
      }
    },
    [ui],
  );

  const updateReconciledField = useCallback(
    <K extends keyof Reconciled>(clusterId: string, key: K, value: Reconciled[K]) => {
      setUi((prev) => {
        const s = prev[clusterId];
        if (!s?.reconciled) return prev;
        return {
          ...prev,
          [clusterId]: {
            ...s,
            reconciled: { ...s.reconciled, [key]: value },
          },
        };
      });
    },
    [],
  );

  return (
    <div className="space-y-5">
      {/* 検出トリガー */}
      <Card className="shadow-sm">
        <CardContent className="py-4 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-600">類似度閾値:</label>
            <input
              type="range"
              min="0.70"
              max="1.0"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-32"
            />
            <span className="text-xs font-mono tabular-nums w-12">{threshold.toFixed(2)}</span>
          </div>
          <Button onClick={scan} disabled={scanning} className="text-xs h-8">
            {scanning ? "検出中..." : "重複を検出"}
          </Button>
          {clusters.length > 0 && (
            <span className="text-xs text-zinc-500">
              {clusters.length} クラスタ (合計{" "}
              {clusters.reduce((s, c) => s + c.members.length, 0)}件)
            </span>
          )}
          {scanError && <span className="text-xs text-red-600">{scanError}</span>}
        </CardContent>
      </Card>

      {!scanning && clusters.length === 0 && (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center text-sm text-zinc-400">
            閾値 {threshold.toFixed(2)} 以上の重複は検出されませんでした。閾値を下げて再検出できます。
          </CardContent>
        </Card>
      )}

      {/* クラスタ一覧 */}
      {clusters.map((cluster) => {
        const state = ui[cluster.id];
        if (!state) return null;
        const absorbedCount = state.selected.size;
        return (
          <Card
            key={cluster.id}
            className={`shadow-sm ${state.merged ? "opacity-60" : ""}`}
          >
            <CardContent className="py-4 space-y-4">
              {/* ヘッダー */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {cluster.members.length}件のクラスタ
                  </span>
                  <Badge className="bg-violet-100 text-violet-700 text-[10px] px-1.5 py-0">
                    最大類似度 {(cluster.topSimilarity * 100).toFixed(1)}%
                  </Badge>
                  {state.merged && (
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0">
                      統合済
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-zinc-500">
                  canonical 1 / 吸収 {absorbedCount}
                </div>
              </div>

              {/* メンバー一覧 */}
              <div className="space-y-2">
                {cluster.members.map((m) => {
                  const isCanonical = state.canonicalId === m.id;
                  const isAbsorbed = state.selected.has(m.id);
                  return (
                    <div
                      key={m.id}
                      className={`border rounded-lg p-2 ${
                        isCanonical
                          ? "border-blue-300 bg-blue-50/40"
                          : isAbsorbed
                            ? "border-red-200 bg-red-50/30"
                            : "border-zinc-200"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setCanonical(cluster.id, m.id)}
                            disabled={state.merged || state.merging}
                            className={`text-[10px] px-1.5 py-0.5 rounded border ${
                              isCanonical
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-zinc-500 border-zinc-300 hover:border-blue-300"
                            }`}
                            title="canonical (残す) に指定"
                          >
                            残す
                          </button>
                          {!isCanonical && (
                            <label className="flex items-center gap-1 text-[10px] text-zinc-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isAbsorbed}
                                onChange={() => toggleAbsorb(cluster.id, m.id)}
                                disabled={state.merged || state.merging}
                                className="w-3 h-3"
                              />
                              吸収
                            </label>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${MODEL_LAYER_LABELS[m.modelLayer]?.color || "bg-zinc-100"}`}
                            >
                              {MODEL_LAYER_LABELS[m.modelLayer]?.label || m.modelLayer}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {PROVENANCE_LABELS[m.provenance] || m.provenance}
                            </span>
                            <span
                              className={`text-[10px] px-1 rounded ${CONFIDENCE_LABELS[m.confidence]?.color || "bg-zinc-100"}`}
                            >
                              {CONFIDENCE_LABELS[m.confidence]?.label || m.confidence}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              Trust {(m.trustScore * 100).toFixed(0)} / Tag {m.tagCount}
                            </span>
                            {m.projectName && (
                              <span className="text-[10px] text-zinc-400">
                                PJ: {m.projectName}
                              </span>
                            )}
                            {m.sourceTitle && (
                              <span className="text-[10px] text-zinc-400 truncate max-w-[240px]">
                                📎 {m.sourceTitle}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-700 whitespace-pre-wrap">
                            {m.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* アクション & 統合案 */}
              {!state.merged && (
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => reconcile(cluster.id)}
                    disabled={
                      state.reconciling ||
                      state.merging ||
                      !state.canonicalId ||
                      absorbedCount === 0
                    }
                    className="text-xs h-7"
                  >
                    {state.reconciling ? "生成中..." : "AI統合案を生成"}
                  </Button>
                  {state.reconciled && (
                    <Button
                      size="sm"
                      onClick={() => executeMerge(cluster.id)}
                      disabled={state.merging}
                      className="text-xs h-7"
                    >
                      {state.merging
                        ? "統合中..."
                        : `統合実行 (1 + ${absorbedCount}件を吸収)`}
                    </Button>
                  )}
                </div>
              )}

              {state.error && (
                <div className="text-xs text-red-600 bg-red-50 px-2 py-1.5 rounded">
                  {state.error}
                </div>
              )}

              {/* 統合案プレビュー */}
              {state.reconciled && !state.merged && (
                <div className="border-2 border-emerald-300 bg-emerald-50/30 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0">
                      AI統合案
                    </Badge>
                    <span className="text-[11px] text-emerald-700">
                      {state.reconciled.reasoning}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-medium text-zinc-600">
                      統合テキスト
                    </span>
                    <textarea
                      value={state.reconciled.text}
                      onChange={(e) =>
                        updateReconciledField(cluster.id, "text", e.target.value)
                      }
                      rows={3}
                      className="w-full mt-1 text-xs text-zinc-800 border border-zinc-200 rounded px-2 py-1 focus:outline-none focus:border-zinc-400 resize-y bg-white"
                    />
                  </div>

                  {state.reconciled.event && (
                    <div>
                      <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                        事象
                      </span>
                      <p className="text-xs text-zinc-700 mt-1">
                        {state.reconciled.event}
                      </p>
                    </div>
                  )}

                  {state.reconciled.outcome && (
                    <div>
                      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        帰結
                      </span>
                      <p className="text-xs text-zinc-700 mt-1">
                        {state.reconciled.outcome}
                      </p>
                    </div>
                  )}

                  {state.reconciled.kpiImpacts.length > 0 && (
                    <div>
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        KPI影響
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {state.reconciled.kpiImpacts.map((k, ki) => (
                          <span
                            key={ki}
                            className={`text-[10px] px-1.5 py-0.5 rounded border ${DIRECTION_COLOR[k.direction] || ""}`}
                            title={k.note}
                          >
                            {k.metric} {DIRECTION_SYMBOL[k.direction] || ""} {k.magnitude}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap text-[10px]">
                    <span
                      className={`px-1.5 py-0.5 font-medium rounded ${MODEL_LAYER_LABELS[state.reconciled.modelLayer]?.color || "bg-zinc-100"}`}
                    >
                      {MODEL_LAYER_LABELS[state.reconciled.modelLayer]?.label ||
                        state.reconciled.modelLayer}
                    </span>
                    <span className="text-zinc-500">
                      {PROVENANCE_LABELS[state.reconciled.provenance] ||
                        state.reconciled.provenance}
                    </span>
                    <span
                      className={`px-1 rounded ${CONFIDENCE_LABELS[state.reconciled.confidence]?.color || "bg-zinc-100"}`}
                    >
                      信頼度 {CONFIDENCE_LABELS[state.reconciled.confidence]?.label ||
                        state.reconciled.confidence}
                    </span>
                  </div>

                  {state.resolvedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {state.resolvedTags.map((t) => (
                        <Badge
                          key={t.id}
                          variant="outline"
                          className="text-[10px] bg-white"
                        >
                          {t.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {state.reconciled.conflicts.length > 0 && (
                    <div className="border-l-2 border-red-400 pl-2 bg-red-50/40 py-1">
                      <span className="text-[10px] font-medium text-red-700">
                        ⚠ 矛盾検出
                      </span>
                      <ul className="text-[11px] text-red-700 list-disc list-inside mt-0.5">
                        {state.reconciled.conflicts.map((c, ci) => (
                          <li key={ci}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
