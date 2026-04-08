import { prisma } from "@/lib/prisma";
import { IngestTabs } from "./ingest-tabs";

export const dynamic = "force-dynamic";

export default async function IngestPage() {
  const tags = await prisma.ontologyTag.findMany({
    orderBy: [{ type: "asc" }, { code: "asc" }],
  });

  const tagsByType = {
    BEHAVIOR: tags.filter((t) => t.type === "BEHAVIOR"),
    CONTEXT: tags.filter((t) => t.type === "CONTEXT"),
    SPACE: tags.filter((t) => t.type === "SPACE"),
    THEORY: tags.filter((t) => t.type === "THEORY"),
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">データ取込</h1>
        <p className="text-zinc-500 mt-1 text-sm">
          観測事実を構造化して登録。報告書・日報・動画のファイルアップロードにも対応。
        </p>
      </div>
      <IngestTabs tagsByType={tagsByType} />
    </div>
  );
}
