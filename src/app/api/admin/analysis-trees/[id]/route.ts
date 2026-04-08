import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: ツリー詳細（全ノード + メトリクス + リンク）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const tree = await prisma.analysisTree.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, client: { select: { name: true } } } },
      template: { select: { id: true, title: true } },
      _count: { select: { instances: true } },
      nodes: {
        include: {
          metrics: { orderBy: { sortOrder: "asc" } },
          outgoingLinks: {
            include: { targetNode: { select: { id: true, label: true, nodeType: true } } },
          },
          incomingLinks: {
            include: { sourceNode: { select: { id: true, label: true, nodeType: true } } },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!tree) {
    return NextResponse.json({ error: "Tree not found" }, { status: 404 });
  }

  return NextResponse.json(tree);
}

// PUT: ツリー更新（タイトル・ステータス変更）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { title, description, status } = body;

  const tree = await prisma.analysisTree.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(status && { status }),
    },
  });

  return NextResponse.json(tree);
}

// POST: ノード追加 / メトリクス追�� / リンク追加
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { action } = body;

  if (action === "addNode") {
    const { parentId, nodeType, label, description, sortOrder, templateNodeId } = body;
    const node = await prisma.analysisNode.create({
      data: {
        treeId: id,
        parentId: parentId || null,
        templateNodeId: templateNodeId || null,
        nodeType,
        label,
        description: description || null,
        sortOrder: sortOrder || 0,
      },
    });
    return NextResponse.json(node, { status: 201 });
  }

  if (action === "addMetric") {
    const { nodeId, label, unit, valueBefore, valueAfter, colorBefore, colorAfter, trend } = body;
    const metric = await prisma.analysisMetric.create({
      data: { nodeId, label, unit, valueBefore, valueAfter, colorBefore, colorAfter, trend },
    });
    return NextResponse.json(metric, { status: 201 });
  }

  if (action === "addLink") {
    const { sourceNodeId, targetNodeId, linkType, note } = body;
    const link = await prisma.analysisNodeLink.create({
      data: {
        sourceNodeId,
        targetNodeId,
        linkType: linkType || "addresses",
        note: note || null,
      },
    });
    return NextResponse.json(link, { status: 201 });
  }

  if (action === "updateNode") {
    const { nodeId, label, description, sortOrder, linkedObservationIds } = body;
    const node = await prisma.analysisNode.update({
      where: { id: nodeId },
      data: {
        ...(label && { label }),
        ...(description !== undefined && { description }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(linkedObservationIds !== undefined && { linkedObservationIds }),
      },
    });
    return NextResponse.json(node);
  }

  if (action === "crossProjectSummary") {
    const { templateNodeId } = body;
    const nodes = await prisma.analysisNode.findMany({
      where: { templateNodeId },
      include: {
        tree: {
          include: {
            project: { select: { id: true, name: true, client: { select: { name: true, industry: true } } } },
          },
        },
        metrics: { orderBy: { sortOrder: "asc" } },
        children: {
          where: { nodeType: { in: ["FACTOR", "COUNTERMEASURE"] } },
          select: { id: true, label: true, nodeType: true },
        },
      },
    });

    return NextResponse.json({
      templateNodeId,
      projectCount: new Set(nodes.map((n) => n.tree.projectId)).size,
      nodes,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
