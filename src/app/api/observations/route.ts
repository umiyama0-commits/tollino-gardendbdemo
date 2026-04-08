import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const observation = await prisma.observation.create({
    data: {
      text: body.text,
      modelLayer: body.modelLayer,
      provenance: body.provenance,
      primaryValueAxis: body.primaryValueAxis || null,
      confidence: body.confidence || "MEDIUM",
      projectId: body.projectId || null,
      storeId: body.storeId || null,
      sourceType: body.sourceType || null,
      sourceTitle: body.sourceTitle || null,
      tags: {
        create: (body.tagIds as string[])?.map((tagId: string) => ({
          tagId,
        })) || [],
      },
    },
    include: {
      tags: { include: { tag: true } },
    },
  });

  return NextResponse.json(observation, { status: 201 });
}
