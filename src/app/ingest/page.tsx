import { prisma } from "@/lib/prisma";
import { IngestForm } from "./ingest-form";

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
        <h1 className="text-3xl font-bold tracking-tight">Data Ingest</h1>
        <p className="text-zinc-500 mt-1 text-sm">
          観測事実を構造化して登録。適切なタグ付けが信頼度チェーンの基盤になります。
        </p>
      </div>
      <IngestForm tagsByType={tagsByType} />
    </div>
  );
}
