import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ProjectWorkspace } from "./project-workspace";

export const dynamic = "force-dynamic";

export default async function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { client: { select: { id: true, name: true, industry: true } } },
  });

  if (!project) notFound();

  return (
    <div className="space-y-5">
      <div>
        <Link href="/projects" className="text-xs text-zinc-500 hover:text-zinc-700">
          ← プロジェクト一覧
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-1">{project.name}</h1>
        <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2 flex-wrap">
          <span>🏢 {project.client.name}</span>
          {project.client.industry && <span>· {project.client.industry}</span>}
          {project.hypothesisTheme && <span>· 💡 {project.hypothesisTheme}</span>}
          {project.primaryValueAxis && (
            <span className="text-blue-600">· {project.primaryValueAxis}</span>
          )}
          {project.targetKPI && <span>· 🎯 {project.targetKPI}</span>}
        </div>
      </div>
      <ProjectWorkspace projectId={id} />
    </div>
  );
}
