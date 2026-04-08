import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") || "";
  const industry = request.nextUrl.searchParams.get("industry") || "";

  if (!query.trim() && !industry.trim()) {
    return NextResponse.json({ observations: [], insights: [] });
  }

  // Build observation filter
  const obsWhere: Record<string, unknown> = {};
  const insWhere: Record<string, unknown> = {};

  if (query.trim()) {
    obsWhere.text = { contains: query };
    insWhere.text = { contains: query };
  }

  // If industry is specified, filter observations by client industry
  if (industry.trim()) {
    obsWhere.OR = [
      { store: { client: { industryDetail: { contains: industry } } } },
      { store: { client: { industry: { contains: industry } } } },
      { project: { client: { industryDetail: { contains: industry } } } },
      { project: { client: { industry: { contains: industry } } } },
    ];
  }

  const [observations, insights] = await Promise.all([
    prisma.observation.findMany({
      where: obsWhere,
      include: {
        tags: { include: { tag: true } },
        store: { select: { client: { select: { industry: true, industryDetail: true } } } },
        project: { select: { client: { select: { industry: true, industryDetail: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.insight.findMany({
      where: insWhere,
      include: { tags: { include: { tag: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  // Extract industries from fetched observations instead of a separate query
  const industrySet = new Set<string>();
  for (const obs of observations) {
    const ind = obs.store?.client?.industryDetail || obs.store?.client?.industry
      || obs.project?.client?.industryDetail || obs.project?.client?.industry;
    if (ind) industrySet.add(ind);
  }
  const industries = [...industrySet];

  return NextResponse.json({ observations, insights, industries });
}
