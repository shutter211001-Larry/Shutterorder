-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "isRandomDispatch" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "randomDispatchPool" JSONB;
