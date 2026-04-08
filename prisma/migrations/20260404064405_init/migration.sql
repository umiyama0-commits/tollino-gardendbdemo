-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "industryDetail" TEXT,
    "scale" TEXT,
    "contractStatus" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locationType" TEXT NOT NULL,
    "area" REAL,
    "staffCount" INTEGER,
    "address" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Store_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpatialZone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zoneType" TEXT NOT NULL,
    CONSTRAINT "SpatialZone_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hypothesisTheme" TEXT,
    "primaryValueAxis" TEXT,
    "targetKPI" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OntologyTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "code" TEXT NOT NULL,
    "displayNameJa" TEXT NOT NULL,
    "displayNameEn" TEXT,
    "description" TEXT,
    "modelLayer" TEXT,
    "category" TEXT,
    "parentId" TEXT,
    "clientId" TEXT,
    CONSTRAINT "OntologyTag_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "OntologyTag" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Observation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT,
    "storeId" TEXT,
    "text" TEXT NOT NULL,
    "subjectivity" TEXT NOT NULL DEFAULT 'objective',
    "confidence" TEXT NOT NULL DEFAULT 'MEDIUM',
    "modelLayer" TEXT NOT NULL,
    "provenance" TEXT NOT NULL DEFAULT 'FIELD_OBSERVED',
    "primaryValueAxis" TEXT,
    "sourceType" TEXT,
    "sourceUrl" TEXT,
    "sourceTitle" TEXT,
    "similarityHint" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Observation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Observation_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ObservationTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "observationId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "ObservationTag_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "Observation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ObservationTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "OntologyTag" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "evidenceStrength" TEXT NOT NULL DEFAULT 'MEDIUM',
    "generalizability" TEXT NOT NULL DEFAULT 'MEDIUM',
    "applicableConditions" TEXT,
    "counterConditions" TEXT,
    "valueImpact" TEXT,
    "primaryValueAxis" TEXT,
    "modelLayer" TEXT,
    "provenance" TEXT NOT NULL DEFAULT 'FIELD_OBSERVED',
    "derivedFromId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InsightTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "insightId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "InsightTag_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InsightTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "OntologyTag" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CrossIndustryPattern" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "industries" TEXT NOT NULL,
    "modelLayer" TEXT,
    "primaryValueAxis" TEXT,
    "insightCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SimilarityCluster" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "modelLayer" TEXT,
    "primaryValueAxis" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SimilarityClusterMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clusterId" TEXT NOT NULL,
    "insightId" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SimilarityClusterMember_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "SimilarityCluster" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SimilarityClusterMember_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'consultant',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "OntologyTag_code_key" ON "OntologyTag"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
