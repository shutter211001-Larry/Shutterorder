-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lineNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "locations" ADD COLUMN     "apiEndpoint" TEXT,
ADD COLUMN     "contractEnd" TEXT DEFAULT '2028-12-31',
ADD COLUMN     "contractStart" TEXT DEFAULT '2025-01-01',
ADD COLUMN     "owner" TEXT DEFAULT '未指派',
ADD COLUMN     "royaltyRate" DOUBLE PRECISION DEFAULT 5.0;
