-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "showProbabilities" BOOLEAN NOT NULL DEFAULT false;
