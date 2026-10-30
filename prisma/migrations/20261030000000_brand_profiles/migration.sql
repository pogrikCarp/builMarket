CREATE TABLE "BrandProfile" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "tagline" TEXT NOT NULL DEFAULT '',
    "description" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "categories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "advantages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "searchTerm" TEXT NOT NULL DEFAULT '',
    "productIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "showOnHome" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT NOT NULL DEFAULT '',
    "seoDescription" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BrandProfile_pkey" PRIMARY KEY ("slug")
);
