-- CreateEnum
CREATE TYPE "AiJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "DetectionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'MODIFIED');

-- CreateEnum
CREATE TYPE "DetectionType" AS ENUM ('DOOR_SINGLE', 'DOOR_DOUBLE', 'DOOR_SLIDING', 'DOOR_POCKET', 'DOOR_BIFOLD', 'DOOR_METAL', 'WINDOW', 'CLOSET', 'CABINET_RUN', 'ROOM_LABEL', 'DIMENSION', 'SCHEDULE_ENTRY', 'SYMBOL_OTHER');

-- CreateTable
CREATE TABLE "ai_jobs" (
    "id" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "triggeredById" TEXT NOT NULL,
    "status" "AiJobStatus" NOT NULL DEFAULT 'QUEUED',
    "pipelineSteps" JSONB,
    "ocrText" TEXT,
    "ocrMetadata" JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "processingMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_detections" (
    "id" TEXT NOT NULL,
    "aiJobId" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "DetectionType" NOT NULL,
    "label" TEXT NOT NULL,
    "confidence" DECIMAL(5,4) NOT NULL,
    "boundingBox" JSONB NOT NULL,
    "coordinates" JSONB,
    "metadata" JSONB,
    "status" "DetectionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "takeoffItemId" TEXT,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_detections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_jobs_sheetId_idx" ON "ai_jobs"("sheetId");

-- CreateIndex
CREATE INDEX "ai_jobs_projectId_idx" ON "ai_jobs"("projectId");

-- CreateIndex
CREATE INDEX "ai_jobs_status_idx" ON "ai_jobs"("status");

-- CreateIndex
CREATE INDEX "ai_detections_aiJobId_idx" ON "ai_detections"("aiJobId");

-- CreateIndex
CREATE INDEX "ai_detections_sheetId_idx" ON "ai_detections"("sheetId");

-- CreateIndex
CREATE INDEX "ai_detections_status_idx" ON "ai_detections"("status");

-- CreateIndex
CREATE INDEX "ai_detections_type_idx" ON "ai_detections"("type");

-- AddForeignKey
ALTER TABLE "ai_jobs" ADD CONSTRAINT "ai_jobs_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_detections" ADD CONSTRAINT "ai_detections_aiJobId_fkey" FOREIGN KEY ("aiJobId") REFERENCES "ai_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_detections" ADD CONSTRAINT "ai_detections_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_detections" ADD CONSTRAINT "ai_detections_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "takeoff_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
