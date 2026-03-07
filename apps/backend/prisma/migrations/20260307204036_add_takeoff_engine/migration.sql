-- CreateEnum
CREATE TYPE "TakeoffMeasureType" AS ENUM ('COUNT', 'LINEAR', 'AREA');

-- CreateEnum
CREATE TYPE "TakeoffSource" AS ENUM ('MANUAL', 'AI_DETECTED', 'AI_CONFIRMED');

-- CreateTable
CREATE TABLE "takeoff_categories" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#2563EB',
    "icon" TEXT,
    "measureType" "TakeoffMeasureType" NOT NULL DEFAULT 'COUNT',
    "unit" TEXT NOT NULL DEFAULT 'ea',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "takeoff_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "takeoff_items" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "sheetId" TEXT,
    "roomId" TEXT,
    "createdById" TEXT NOT NULL,
    "source" "TakeoffSource" NOT NULL DEFAULT 'MANUAL',
    "label" TEXT,
    "description" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'ea',
    "length" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "area" DOUBLE PRECISION,
    "coordinates" JSONB,
    "confidence" DOUBLE PRECISION,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "takeoff_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "takeoff_summaries" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "roomId" TEXT,
    "totalCount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLF" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSF" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "takeoff_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "takeoff_categories_companyId_idx" ON "takeoff_categories"("companyId");

-- CreateIndex
CREATE INDEX "takeoff_categories_isSystem_idx" ON "takeoff_categories"("isSystem");

-- CreateIndex
CREATE UNIQUE INDEX "takeoff_categories_companyId_code_key" ON "takeoff_categories"("companyId", "code");

-- CreateIndex
CREATE INDEX "takeoff_items_projectId_idx" ON "takeoff_items"("projectId");

-- CreateIndex
CREATE INDEX "takeoff_items_categoryId_idx" ON "takeoff_items"("categoryId");

-- CreateIndex
CREATE INDEX "takeoff_items_sheetId_idx" ON "takeoff_items"("sheetId");

-- CreateIndex
CREATE INDEX "takeoff_items_roomId_idx" ON "takeoff_items"("roomId");

-- CreateIndex
CREATE INDEX "takeoff_items_source_idx" ON "takeoff_items"("source");

-- CreateIndex
CREATE INDEX "takeoff_summaries_projectId_idx" ON "takeoff_summaries"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "takeoff_summaries_projectId_categoryId_roomId_key" ON "takeoff_summaries"("projectId", "categoryId", "roomId");

-- AddForeignKey
ALTER TABLE "takeoff_items" ADD CONSTRAINT "takeoff_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "takeoff_items" ADD CONSTRAINT "takeoff_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "takeoff_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
