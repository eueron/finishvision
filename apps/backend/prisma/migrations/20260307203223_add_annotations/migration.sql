-- CreateEnum
CREATE TYPE "AnnotationType" AS ENUM ('CALIBRATION', 'MEASUREMENT', 'MARKER', 'NOTE');

-- CreateTable
CREATE TABLE "annotations" (
    "id" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "type" "AnnotationType" NOT NULL,
    "label" TEXT,
    "data" JSONB NOT NULL,
    "color" TEXT DEFAULT '#2563EB',
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "annotations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "annotations_sheetId_idx" ON "annotations"("sheetId");

-- CreateIndex
CREATE INDEX "annotations_type_idx" ON "annotations"("type");

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
