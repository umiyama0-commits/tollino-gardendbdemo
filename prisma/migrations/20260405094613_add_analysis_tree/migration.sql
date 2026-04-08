-- CreateTable
CREATE TABLE "AnalysisTree" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "templateId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AnalysisTree_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AnalysisTree_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AnalysisTree" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AnalysisTree_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnalysisNode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "treeId" TEXT NOT NULL,
    "parentId" TEXT,
    "templateNodeId" TEXT,
    "nodeType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "linkedObservationIds" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AnalysisNode_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "AnalysisTree" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AnalysisNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AnalysisNode" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnalysisMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unit" TEXT,
    "valueBefore" TEXT,
    "valueAfter" TEXT,
    "colorBefore" TEXT,
    "colorAfter" TEXT,
    "trend" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AnalysisMetric_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "AnalysisNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnalysisNodeLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "linkType" TEXT NOT NULL DEFAULT 'addresses',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnalysisNodeLink_sourceNodeId_fkey" FOREIGN KEY ("sourceNodeId") REFERENCES "AnalysisNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AnalysisNodeLink_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "AnalysisNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AnalysisTree_projectId_idx" ON "AnalysisTree"("projectId");

-- CreateIndex
CREATE INDEX "AnalysisTree_isTemplate_idx" ON "AnalysisTree"("isTemplate");

-- CreateIndex
CREATE INDEX "AnalysisTree_templateId_idx" ON "AnalysisTree"("templateId");

-- CreateIndex
CREATE INDEX "AnalysisNode_treeId_idx" ON "AnalysisNode"("treeId");

-- CreateIndex
CREATE INDEX "AnalysisNode_treeId_nodeType_idx" ON "AnalysisNode"("treeId", "nodeType");

-- CreateIndex
CREATE INDEX "AnalysisNode_parentId_idx" ON "AnalysisNode"("parentId");

-- CreateIndex
CREATE INDEX "AnalysisNode_templateNodeId_idx" ON "AnalysisNode"("templateNodeId");

-- CreateIndex
CREATE INDEX "AnalysisMetric_nodeId_idx" ON "AnalysisMetric"("nodeId");

-- CreateIndex
CREATE INDEX "AnalysisNodeLink_sourceNodeId_idx" ON "AnalysisNodeLink"("sourceNodeId");

-- CreateIndex
CREATE INDEX "AnalysisNodeLink_targetNodeId_idx" ON "AnalysisNodeLink"("targetNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisNodeLink_sourceNodeId_targetNodeId_key" ON "AnalysisNodeLink"("sourceNodeId", "targetNodeId");
