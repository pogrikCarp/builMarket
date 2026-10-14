CREATE TABLE "CatalogInterestEvent" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "visitorHash" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CatalogInterestEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CatalogInterestEvent_kind_check" CHECK ("kind" IN ('VIEW', 'CART', 'FAVORITE')),
    CONSTRAINT "CatalogInterestEvent_productId_fkey" FOREIGN KEY ("productId")
      REFERENCES "CatalogProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CatalogInterestEvent_productId_visitorHash_kind_day_key"
  ON "CatalogInterestEvent"("productId", "visitorHash", "kind", "day");
CREATE INDEX "CatalogInterestEvent_day_productId_idx" ON "CatalogInterestEvent"("day", "productId");
