-- AlterTable
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "customDomain" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_customDomain_key" ON "tenants"("customDomain");
