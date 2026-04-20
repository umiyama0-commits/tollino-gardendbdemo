import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectCreateForm } from "./project-create-form";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      client: { select: { id: true, name: true, industry: true } },
      _count: { select: { observations: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">プロジェクト</h1>
          <p className="text-zinc-500 mt-1 text-sm">
            プロジェクト単位で複数フォーマットの観測データを集約・突号・整理します。
          </p>
        </div>
        <ProjectCreateForm />
      </div>

      {projects.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center text-sm text-zinc-400">
            まだプロジェクトがありません。右上から作成してください。
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="block">
              <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-zinc-900 truncate">
                      {p.name}
                    </p>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] shrink-0 ${
                        p.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {p.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-zinc-500 truncate">
                    🏢 {p.client.name}
                    {p.client.industry ? ` · ${p.client.industry}` : ""}
                  </p>
                  {p.hypothesisTheme && (
                    <p className="text-xs text-zinc-700 line-clamp-2">
                      💡 {p.hypothesisTheme}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-zinc-500 pt-1 border-t border-zinc-100">
                    <span>観測 {p._count.observations}</span>
                    {p.primaryValueAxis && (
                      <span className="text-blue-600">{p.primaryValueAxis}</span>
                    )}
                    {p.targetKPI && (
                      <span className="truncate">🎯 {p.targetKPI}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
