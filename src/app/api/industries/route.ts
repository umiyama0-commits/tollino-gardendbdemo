import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const clients = await prisma.client.findMany({
    select: { industry: true, industryDetail: true },
    distinct: ["industryDetail"],
  });

  const industries = [
    ...new Set(
      clients.map((c) => c.industryDetail || c.industry).filter(Boolean)
    ),
  ];

  return NextResponse.json({ industries });
}
