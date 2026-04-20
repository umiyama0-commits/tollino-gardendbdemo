// プロジェクト一覧 + 作成
// GET  /api/projects   一覧（Client名・観測件数付き）
// POST /api/projects   作成（name必須、clientIdなければ既定Clientを自動採用）
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_CLIENT_NAME = "未分類クライアント";

async function resolveDefaultClient(): Promise<string> {
  const existing = await prisma.client.findFirst({
    where: { name: DEFAULT_CLIENT_NAME },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await prisma.client.create({
    data: { name: DEFAULT_CLIENT_NAME, industry: "未分類" },
    select: { id: true },
  });
  return created.id;
}

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      client: { select: { id: true, name: true, industry: true } },
      _count: { select: { observations: true } },
    },
  });
  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name: string | undefined = body.name?.trim();
  const hypothesisTheme: string | null = body.hypothesisTheme?.trim() || null;
  const primaryValueAxis: string | null = body.primaryValueAxis || null;
  const targetKPI: string | null = body.targetKPI?.trim() || null;
  let clientId: string | null = body.clientId || null;

  if (!name) {
    return NextResponse.json({ error: "name は必須です" }, { status: 400 });
  }

  if (!clientId) {
    clientId = await resolveDefaultClient();
  } else {
    const exists = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json({ error: "指定された clientId が存在しません" }, { status: 400 });
    }
  }

  const project = await prisma.project.create({
    data: {
      name,
      clientId,
      hypothesisTheme,
      primaryValueAxis,
      targetKPI,
    },
    include: { client: { select: { id: true, name: true } } },
  });

  return NextResponse.json(project, { status: 201 });
}
