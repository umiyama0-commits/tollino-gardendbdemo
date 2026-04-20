// 観測データ重複検出・LLM整合・統合のコアロジック
// 類似度閾値 ≥ 0.85 のペアを Union-Find でクラスタ化し、
// LLMで統合案を生成、人間承認後にマージ実行する。

import { prisma } from "@/lib/prisma";
import { LLMReconcileOutput, parseLLMOutput } from "@/lib/validation";
import type { KpiImpact } from "@/lib/llm";

export const DUPLICATE_THRESHOLD = 0.85;
export const MAX_PAIRS = 500;

// ─── Union-Find ─────────────────────────────────────────

class UnionFind {
  parent: Map<string, string> = new Map();

  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x);
    let root = x;
    while (this.parent.get(root) !== root) {
      root = this.parent.get(root)!;
    }
    // path compression
    let cur = x;
    while (this.parent.get(cur) !== root) {
      const next = this.parent.get(cur)!;
      this.parent.set(cur, root);
      cur = next;
    }
    return root;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
}

// ─── 重複ペア検出 ───────────────────────────────────────

type DuplicatePair = {
  id1: string;
  id2: string;
  similarity: number;
};

/**
 * 閾値以上の類似Observation対を抽出。同一projectId内のみマッチ
 * (projectIdがnullの場合は他のnullとだけマッチ)
 */
async function findDuplicatePairs(
  threshold: number = DUPLICATE_THRESHOLD,
): Promise<DuplicatePair[]> {
  const rows = await prisma.$queryRawUnsafe<
    { id1: string; id2: string; similarity: number }[]
  >(
    `SELECT a.id AS id1, b.id AS id2,
            1 - (a.embedding <=> b.embedding) AS similarity
     FROM "Observation" a
     JOIN "Observation" b ON a.id < b.id
       AND (
         (a."projectId" IS NOT NULL AND a."projectId" = b."projectId")
         OR (a."projectId" IS NULL AND b."projectId" IS NULL)
       )
     WHERE a.embedding IS NOT NULL AND b.embedding IS NOT NULL
       AND 1 - (a.embedding <=> b.embedding) >= $1
     ORDER BY similarity DESC
     LIMIT $2`,
    threshold,
    MAX_PAIRS,
  );

  return rows;
}

// ─── クラスタ構築 ──────────────────────────────────────

export type DuplicateClusterMember = {
  id: string;
  text: string;
  summary: string | null;
  modelLayer: string;
  provenance: string;
  confidence: string;
  primaryValueAxis: string | null;
  trustScore: number;
  createdAt: Date;
  projectId: string | null;
  projectName: string | null;
  sourceTitle: string | null;
  sourceType: string | null;
  tagCount: number;
};

export type DuplicateCluster = {
  id: string; // 先頭メンバーのIDをクラスタIDとして流用
  members: DuplicateClusterMember[];
  pairs: DuplicatePair[]; // クラスタ内の重複ペア
  topSimilarity: number;
};

export async function detectDuplicateClusters(
  threshold: number = DUPLICATE_THRESHOLD,
): Promise<DuplicateCluster[]> {
  const pairs = await findDuplicatePairs(threshold);
  if (pairs.length === 0) return [];

  // Union-Find でクラスタ化
  const uf = new UnionFind();
  for (const p of pairs) uf.union(p.id1, p.id2);

  const clusterToIds = new Map<string, Set<string>>();
  const allIds = new Set<string>();
  for (const p of pairs) {
    allIds.add(p.id1);
    allIds.add(p.id2);
  }
  for (const id of allIds) {
    const root = uf.find(id);
    if (!clusterToIds.has(root)) clusterToIds.set(root, new Set());
    clusterToIds.get(root)!.add(id);
  }

  // メンバー詳細を一括取得
  const idList = Array.from(allIds);
  const observations = await prisma.observation.findMany({
    where: { id: { in: idList } },
    select: {
      id: true,
      text: true,
      summary: true,
      modelLayer: true,
      provenance: true,
      confidence: true,
      primaryValueAxis: true,
      trustScore: true,
      createdAt: true,
      projectId: true,
      sourceTitle: true,
      sourceType: true,
      project: { select: { name: true } },
      _count: { select: { tags: true } },
    },
  });
  const obsMap = new Map(observations.map((o) => [o.id, o]));

  // クラスタ配列を組み立て
  const clusters: DuplicateCluster[] = [];
  for (const [root, ids] of clusterToIds) {
    const members: DuplicateClusterMember[] = Array.from(ids)
      .map((id) => {
        const o = obsMap.get(id);
        if (!o) return null;
        return {
          id: o.id,
          text: o.text,
          summary: o.summary,
          modelLayer: o.modelLayer,
          provenance: o.provenance,
          confidence: o.confidence,
          primaryValueAxis: o.primaryValueAxis,
          trustScore: o.trustScore,
          createdAt: o.createdAt,
          projectId: o.projectId,
          projectName: o.project?.name ?? null,
          sourceTitle: o.sourceTitle,
          sourceType: o.sourceType,
          tagCount: o._count.tags,
        };
      })
      .filter((m): m is DuplicateClusterMember => m !== null);

    if (members.length < 2) continue;

    const clusterPairs = pairs.filter(
      (p) => uf.find(p.id1) === root && uf.find(p.id2) === root,
    );
    const topSimilarity = Math.max(...clusterPairs.map((p) => p.similarity));

    clusters.push({
      id: root,
      members: members.sort(
        (a, b) => b.trustScore - a.trustScore || b.tagCount - a.tagCount,
      ),
      pairs: clusterPairs,
      topSimilarity,
    });
  }

  // 類似度の高い順に返す
  clusters.sort((a, b) => b.topSimilarity - a.topSimilarity);
  return clusters;
}

// ─── LLM整合 ────────────────────────────────────────────

const RECONCILE_PROMPT = `あなたは小売・サービス業の店舗行動観測の専門家です。
以下に示す複数の観測データは類似度が高く重複の可能性があります。
これらを**1つの統合観測**としてまとめてください。

## 統合ルール
1. **text**: event + outcome + KPI影響 を統合した1文〜2文の要約 (100〜250文字)
2. **event**: すべての観測に共通する事象を1つにまとめる。重複排除・最も具体的な表現を採用
3. **outcome**: 帰結を統合。複数の観測が同じ帰結を示すなら強化され、異なるなら妥当な範囲で併記
4. **kpiImpacts**: 全観測のKPI影響をマージ。同一metricは direction/magnitude を統合（レンジで表現）
5. **modelLayer**: 多数決で最も妥当なものを選択
6. **provenance**: 最強を採用（FIELD_OBSERVED > ANONYMIZED_DERIVED > PUBLIC_CODIFIED）
7. **confidence**: 複数観測で裏付けられたら1段階上げる（MEDIUM→HIGH 等）
8. **primaryValueAxis**: 多数決
9. **tagCodes**: 全観測のタグコードをUnion（重複排除）
10. **conflicts**: 観測間で矛盾する点があれば列挙。なければ空配列

## 出力フォーマット (JSON)
{
  "text": "統合後のテキスト",
  "event": "統合された事象",
  "outcome": "統合された帰結",
  "kpiImpacts": [
    { "metric": "売上", "direction": "UP", "magnitude": "+8〜15%", "note": "推定" }
  ],
  "modelLayer": "MOVEMENT" | "APPROACH" | "BREAKDOWN" | "TRANSFER",
  "primaryValueAxis": "REVENUE_UP" | "COST_DOWN" | "RETENTION" | null,
  "provenance": "FIELD_OBSERVED" | "ANONYMIZED_DERIVED" | "PUBLIC_CODIFIED",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "tagCodes": ["tag_code_1", "tag_code_2"],
  "reasoning": "統合判断の根拠(1〜2文)",
  "conflicts": ["矛盾点1", "矛盾点2"]
}

必ずJSON形式のみで応答してください。`;

export type ReconcileInput = {
  text: string;
  event?: string;
  outcome?: string;
  modelLayer: string;
  primaryValueAxis: string | null;
  provenance: string;
  confidence: string;
  tagCodes: string[];
};

export type ReconcileResult = {
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

export async function reconcileObservationsWithLLM(
  members: ReconcileInput[],
): Promise<ReconcileResult> {
  const provider =
    process.env.LLM_PROVIDER ||
    (process.env.ANTHROPIC_API_KEY ? "anthropic" : "openai");
  const apiKey =
    provider === "anthropic"
      ? process.env.ANTHROPIC_API_KEY
      : process.env.OPENAI_API_KEY;

  if (!apiKey) throw new Error("LLM API key not configured");

  const payload = members
    .map(
      (m, i) =>
        `### 観測 ${i + 1}
- text: ${m.text}
- modelLayer: ${m.modelLayer}
- provenance: ${m.provenance}
- confidence: ${m.confidence}
- primaryValueAxis: ${m.primaryValueAxis ?? "null"}
- tagCodes: ${m.tagCodes.join(", ") || "(なし)"}`,
    )
    .join("\n\n");

  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: RECONCILE_PROMPT,
        messages: [{ role: "user", content: payload }],
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${err}`);
    }
    const data = await res.json();
    const content = data.content?.[0]?.text;
    if (!content) throw new Error("Empty response from Anthropic");
    return parseLLMOutput(LLMReconcileOutput, content) as ReconcileResult;
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: RECONCILE_PROMPT },
        { role: "user", content: payload },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 2048,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI");
  return parseLLMOutput(LLMReconcileOutput, content) as ReconcileResult;
}

// ─── マージ実行 ────────────────────────────────────────

export type MergeResult = {
  canonicalId: string;
  absorbedCount: number;
  rawFilesMoved: number;
  insightLinksMerged: number;
};

/**
 * canonicalId を残し、absorbedIds を吸収して削除する。
 * RawFile.observationId と ObservationInsightLink を canonical に寄せ、
 * canonical の text/tags/フィールドを mergedFields で上書きする。
 */
export async function mergeObservations(params: {
  canonicalId: string;
  absorbedIds: string[];
  mergedText: string;
  mergedSummary: string | null;
  mergedModelLayer: string;
  mergedProvenance: string;
  mergedConfidence: string;
  mergedPrimaryValueAxis: string | null;
  mergedTagIds: string[];
  mergedTrustScore: number;
}): Promise<MergeResult> {
  const {
    canonicalId,
    absorbedIds,
    mergedText,
    mergedSummary,
    mergedModelLayer,
    mergedProvenance,
    mergedConfidence,
    mergedPrimaryValueAxis,
    mergedTagIds,
    mergedTrustScore,
  } = params;

  if (absorbedIds.includes(canonicalId)) {
    throw new Error("canonical cannot be in absorbedIds");
  }
  if (absorbedIds.length === 0) {
    throw new Error("absorbedIds must not be empty");
  }

  return await prisma.$transaction(async (tx) => {
    // 1. RawFile.observationId を canonical に張替え
    const rawFileResult = await tx.rawFile.updateMany({
      where: { observationId: { in: absorbedIds } },
      data: { observationId: canonicalId },
    });

    // 2. 吸収される側の ObservationInsightLink を canonical に付け替え
    //    (canonical 側に既存リンクがあれば重複を避ける)
    const existingLinks = await tx.observationInsightLink.findMany({
      where: { observationId: canonicalId },
      select: { insightId: true },
    });
    const existingInsightIds = new Set(existingLinks.map((l) => l.insightId));

    const absorbedLinks = await tx.observationInsightLink.findMany({
      where: { observationId: { in: absorbedIds } },
      select: { insightId: true, role: true },
    });

    let insightLinksMerged = 0;
    for (const link of absorbedLinks) {
      if (existingInsightIds.has(link.insightId)) continue;
      await tx.observationInsightLink.create({
        data: {
          observationId: canonicalId,
          insightId: link.insightId,
          role: link.role,
        },
      });
      existingInsightIds.add(link.insightId);
      insightLinksMerged++;
    }

    // 3. canonical を update（text / summary / タグ / フィールド）
    await tx.observationTag.deleteMany({ where: { observationId: canonicalId } });
    await tx.observation.update({
      where: { id: canonicalId },
      data: {
        text: mergedText,
        summary: mergedSummary,
        modelLayer: mergedModelLayer,
        provenance: mergedProvenance,
        confidence: mergedConfidence,
        primaryValueAxis: mergedPrimaryValueAxis,
        trustScore: mergedTrustScore,
        tags: {
          create: mergedTagIds.map((tagId) => ({ tagId })),
        },
      },
    });

    // 4. 吸収対象を削除 (ObservationTag/InsightLink は Cascade)
    await tx.observation.deleteMany({ where: { id: { in: absorbedIds } } });

    // 5. 監査ログ
    await tx.compilationEvent.create({
      data: {
        trigger: "merge",
        sourceType: "observation",
        sourceId: absorbedIds.join(","),
        resultType: "observation",
        resultId: canonicalId,
      },
    });

    return {
      canonicalId,
      absorbedCount: absorbedIds.length,
      rawFilesMoved: rawFileResult.count,
      insightLinksMerged,
    };
  });
}
