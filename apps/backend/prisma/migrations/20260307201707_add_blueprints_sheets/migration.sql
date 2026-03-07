-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('UPLOADING', 'PROCESSING', 'READY', 'ERROR');

-- CreateEnum
CREATE TYPE "SheetType" AS ENUM ('FLOOR_PLAN', 'DOOR_SCHEDULE', 'WINDOW_SCHEDULE', 'ELEVATION', 'DETAIL', 'COVER', 'OTHER');

-- CreateTable
CREATE TABLE "blueprints" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "status" "FileStatus" NOT NULL DEFAULT 'UPLOADING',
    "pageCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "blueprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sheets" (
    "id" TEXT NOT NULL,
    "blueprintId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "sheetName" TEXT,
    "sheetType" "SheetType" NOT NULL DEFAULT 'OTHER',
    "thumbnailPath" TEXT,
    "imagePath" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "dpi" INTEGER,
    "scaleText" TEXT,
    "scaleFactor" DOUBLE PRECISION,
    "ocrText" TEXT,
    "ocrCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sheets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blueprints_projectId_idx" ON "blueprints"("projectId");

-- CreateIndex
CREATE INDEX "blueprints_status_idx" ON "blueprints"("status");

-- CreateIndex
CREATE INDEX "sheets_blueprintId_idx" ON "sheets"("blueprintId");

-- CreateIndex
CREATE INDEX "sheets_sheetType_idx" ON "sheets"("sheetType");

-- CreateIndex
CREATE UNIQUE INDEX "sheets_blueprintId_pageNumber_key" ON "sheets"("blueprintId", "pageNumber");

-- AddForeignKey
ALTER TABLE "blueprints" ADD CONSTRAINT "blueprints_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sheets" ADD CONSTRAINT "sheets_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "blueprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
