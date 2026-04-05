import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: ツリー一覧（テンプレート or PJ紐づき）
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isTemplate = searchParams.get("template");
  const projectId = searchParams.get("projectId");

  const where: Record<string, unknown> = {};
  if (isTemplate === "true") where.isTemplate = true;
  if (isTemplate === "false") where.isTemplate = false;
  if (projectId) where.projectId = projectId;

  const trees = await prisma.analysisTree.findMany({
    where,
    include: {
      project: { select: { id: true, name: true, client: { select: { name: true } } } },
      template: { select: { id: true, title: true } },
      _count: { select: { nodes: true, instances: true } },
    },
    orderBy: [{ isTemplate: "desc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json(trees);
}

// POST: 新規ツリー作成 or テンプレートからクローン
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, projectId, templateId } = body;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  // テンプレートからのクローン
  if (templateId) {
    const template = await prisma.analysisTree.findUnique({
      where: { id: templateId },
      include: { nodes: { orderBy: { sortOrder: "asc" } } },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // ツリーを作成
    const newTree = await prisma.analysisTree.create({
      data: {
        title,
        description: description || template.description,
        projectId: projectId || null,
        isTemplate: false,
        templateId,
        status: "draft",
      },
    });

    // ノードをクローン（親子関係を維持）
    const idMap = new Map<string, string>(); // oldId → newId

    // ルートノードから順にクローン（parentIdがnullのものから）
    const sortedNodes = [...template.nodes].sort((a, b) => {
      // parentId が null のものを先に
      if (!a.parentId && b.parentId) return -1;
      if (a.parentId && !b.parentId) return 1;
      return a.sortOrder - b.sortOrder;
    });

    // 階層順に挿入するため、複数パスで処理
    let remaining = [...sortedNodes];
    while (remaining.length > 0) {
      const batch = remaining.filter(
        (n) => !n.parentId || idMap.has(n.parentId)
      );
      if (batch.length === 0) break; // 循環参照防止

      for (const node of batch) {
        const newNode = await prisma.analysisNode.create({
          data: {
            treeId: newTree.id,
            parentId: node.parentId ? idMap.get(node.parentId) || null : null,
            templateNodeId: node.id, // ★横串集計キー
            nodeType: node.nodeType,
            label: node.label,
            description: node.description,
            sortOrder: node.sortOrder,
          },
        });
        idMap.set(node.id, newNode.id);
      }

      remaining = remaining.filter((n) => !idMap.has(n.id));
    }

    const result = await prisma.analysisTree.findUnique({
      where: { id: newTree.id },
      include: {
        nodes: { include: { metrics: true }, orderBy: { sortOrder: "asc" } },
        template: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(result, { status: 201 });
  }

  // 新規テンプレート作成
  const tree = await prisma.analysisTree.create({
    data: {
      title,
      description,
      projectId: projectId || null,
      isTemplate: !projectId,
      status: "draft",
    },
  });

  return NextResponse.json(tree, { status: 201 });
}
