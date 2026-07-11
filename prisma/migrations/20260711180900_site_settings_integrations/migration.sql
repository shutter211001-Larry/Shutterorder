-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "pendingIntegrations" JSONB;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "pendingIntegrationsToken" TEXT;
