import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import { AdminPanel } from "./admin-panel";

export const dynamic = "force-dynamic";

// デフォルト値マイグレーション: 旧デフォルトを新デフォルトに更新
const CONFIG_MIGRATIONS: Record<string, string> = {
  "trust.halfLifeDays": "900",
};

// デフォルト設定値（APIルートと同一 — 新キー追加時にここも更新）
const DEFAULT_CONFIGS = [
  { key: "llm.provider", value: "openai", label: "LLMプロバイダー", category: "llm" },
  { key: "llm.model", value: "gpt-4o", label: "使用モデル", category: "llm" },
  { key: "llm.temperature", value: "0.3", label: "Temperature", category: "llm" },
  { key: "trust.halfLifeDays", value: "900", label: "信頼スコア半減期（日）", category: "trust" },
  { key: "trust.fieldWeight", value: "3.0", label: "固有知ウェイト", category: "trust" },
  { key: "trust.anonWeight", value: "2.0", label: "汎用知ウェイト", category: "trust" },
  { key: "trust.publicWeight", value: "0.5", label: "公知ウェイト", category: "trust" },
  { key: "display.defaultCountry", value: "JP", label: "デフォルト国コード", category: "display" },
  { key: "display.language", value: "ja", label: "表示言語", category: "display" },
  { key: "embedding.model", value: "text-embedding-3-small", label: "Embeddingモデル", category: "llm" },
  { key: "embedding.dimensions", value: "512", label: "Embedding次元数", category: "llm" },
  { key: "cluster.similarityThreshold", value: "0.7", label: "クラスタ類似度閾値", category: "trust" },
  { key: "cluster.minIndustries", value: "2", label: "パターン生成最低業種数", category: "trust" },
  { key: "ingest.dailyLimit", value: "100", label: "1日あたり自動取込件数", category: "ingest" },
  { key: "ingest.publicRatioCap", value: "0.3", label: "Q&A公知比率上限", category: "ingest" },
  { key: "ingest.countryWeights", value: "JP:70,SG:6,US:6,HK:6,AU:6,TW:6", label: "国別取込比率(%)", category: "ingest" },
];

async function AdminData() {
  // まずマイグレーションを実行
  for (const [key, newValue] of Object.entries(CONFIG_MIGRATIONS)) {
    await prisma.systemConfig.updateMany({
      where: { key, value: { not: newValue } },
      data: { value: newValue },
    }).catch(() => {});
  }

  // デフォルト設定のシーディング（新キーがあれば追加）
  for (const config of DEFAULT_CONFIGS) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { label: config.label, category: config.category },
      create: config,
    }).catch(() => {});
  }

  const [users, configs, stats] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, apiKey: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.systemConfig.findMany({
      orderBy: [{ category: "asc" }, { key: "asc" }],
    }).catch(() => []),
    Promise.all([
      prisma.observation.count(),
      prisma.insight.count(),
      prisma.crossIndustryPattern.count(),
      prisma.compilationEvent.count(),
      prisma.qASession.count(),
      prisma.lintResult.count({ where: { status: "open" } }),
      prisma.similarityCluster.count(),
    ]).then(([obs, ins, pat, comp, qa, lint, cluster]) => ({
      observations: obs, insights: ins, patterns: pat,
      compilations: comp, qaSessions: qa, openLints: lint, clusters: cluster,
    })),
  ]);

  return (
    <AdminPanel
      users={users}
      configs={configs}
      stats={stats}
    />
  );
}

export default function AdminPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">管理設定</h1>
        <p className="text-zinc-500 text-sm mt-1">
          システム設定・ユーザー管理・稼働統計
        </p>
      </div>
      <Suspense fallback={<div className="text-zinc-400 text-sm">読み込み中...</div>}>
        <AdminData />
      </Suspense>
    </div>
  );
}
