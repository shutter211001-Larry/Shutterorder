-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'site_settings_tenantId_fkey') THEN
    ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "site_settings_tenantId_key" ON "site_settings"("tenantId");
