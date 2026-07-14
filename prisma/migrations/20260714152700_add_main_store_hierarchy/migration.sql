-- AlterTable
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "isMainStore" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "parentLocationId" TEXT;
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "syncOrdersWithMain" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "syncSettingsWithMain" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'locations_parentLocationId_fkey') THEN
  ALTER TABLE "locations" ADD CONSTRAINT "locations_parentLocationId_fkey" FOREIGN KEY ("parentLocationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
END IF; END $$;
