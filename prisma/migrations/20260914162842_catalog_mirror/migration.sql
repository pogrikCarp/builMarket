-- CreateEnum
CREATE TYPE "CatalogSyncStatus" AS ENUM ('RUNNING', 'OK', 'FAILED');

-- CreateTable
CREATE TABLE "CatalogFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pathName" TEXT,
    "href" TEXT NOT NULL,
    "parentHref" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogProduct" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "article" TEXT,
    "code" TEXT,
    "price" INTEGER,
    "quantity" DOUBLE PRECISION,
    "uom" TEXT,
    "folderId" TEXT,
    "folderName" TEXT,
    "folderPath" TEXT,
    "groupLabel" TEXT,
    "subgroupLabel" TEXT,
    "images" JSONB NOT NULL,
    "attributes" JSONB NOT NULL,
    "msUpdatedAt" TIMESTAMP(3),
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "searchText" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogSyncRun" (
    "id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "status" "CatalogSyncStatus" NOT NULL DEFAULT 'RUNNING',
    "trigger" TEXT,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "imageCount" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "CatalogSyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogFolder_href_key" ON "CatalogFolder"("href");

-- CreateIndex
CREATE INDEX "CatalogFolder_parentHref_idx" ON "CatalogFolder"("parentHref");

-- CreateIndex
CREATE INDEX "CatalogProduct_folderId_idx" ON "CatalogProduct"("folderId");

-- CreateIndex
CREATE INDEX "CatalogProduct_archived_idx" ON "CatalogProduct"("archived");

-- CreateIndex
CREATE INDEX "CatalogProduct_name_idx" ON "CatalogProduct"("name");

-- CreateIndex
CREATE INDEX "CatalogSyncRun_startedAt_idx" ON "CatalogSyncRun"("startedAt");
