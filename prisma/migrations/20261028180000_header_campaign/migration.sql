CREATE TABLE "HeaderCampaign" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "theme" TEXT NOT NULL DEFAULT 'none',
    "customImage" TEXT,
    "customTitle" TEXT NOT NULL DEFAULT 'Сезонные акции',
    "buttonLabel" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HeaderCampaign_pkey" PRIMARY KEY ("id")
);
