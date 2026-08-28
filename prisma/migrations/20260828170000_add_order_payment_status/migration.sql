DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentProvider" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentOperationId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentAmount" DECIMAL(12,2);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);

DO $$ BEGIN
  ALTER TABLE "Order" ADD CONSTRAINT "Order_paymentOperationId_key" UNIQUE ("paymentOperationId");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
