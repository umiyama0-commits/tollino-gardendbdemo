-- CreateIndex
CREATE INDEX "Client_industry_idx" ON "Client"("industry");

-- CreateIndex
CREATE INDEX "Insight_provenance_idx" ON "Insight"("provenance");

-- CreateIndex
CREATE INDEX "Insight_createdAt_idx" ON "Insight"("createdAt");

-- CreateIndex
CREATE INDEX "InsightTag_insightId_idx" ON "InsightTag"("insightId");

-- CreateIndex
CREATE INDEX "InsightTag_tagId_idx" ON "InsightTag"("tagId");

-- CreateIndex
CREATE INDEX "Observation_provenance_idx" ON "Observation"("provenance");

-- CreateIndex
CREATE INDEX "Observation_modelLayer_idx" ON "Observation"("modelLayer");

-- CreateIndex
CREATE INDEX "Observation_primaryValueAxis_idx" ON "Observation"("primaryValueAxis");

-- CreateIndex
CREATE INDEX "Observation_createdAt_idx" ON "Observation"("createdAt");

-- CreateIndex
CREATE INDEX "Observation_projectId_idx" ON "Observation"("projectId");

-- CreateIndex
CREATE INDEX "Observation_storeId_idx" ON "Observation"("storeId");

-- CreateIndex
CREATE INDEX "ObservationTag_observationId_idx" ON "ObservationTag"("observationId");

-- CreateIndex
CREATE INDEX "ObservationTag_tagId_idx" ON "ObservationTag"("tagId");
