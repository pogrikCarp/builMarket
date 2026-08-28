CREATE TABLE IF NOT EXISTS "PromoItem" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "oldPrice" DECIMAL(12,2),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoItem_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "PromoItem" ADD CONSTRAINT "PromoItem_productId_key" UNIQUE ("productId");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
