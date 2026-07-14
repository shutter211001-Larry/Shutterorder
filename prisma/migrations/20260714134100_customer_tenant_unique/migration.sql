-- Drop old constraints safely
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_email_key') THEN ALTER TABLE "customers" DROP CONSTRAINT "customers_email_key"; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_lineUserId_key') THEN ALTER TABLE "customers" DROP CONSTRAINT "customers_lineUserId_key"; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_facebookId_key') THEN ALTER TABLE "customers" DROP CONSTRAINT "customers_facebookId_key"; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_googleId_key') THEN ALTER TABLE "customers" DROP CONSTRAINT "customers_googleId_key"; END IF; END $$;

-- Drop old indexes safely
DROP INDEX IF EXISTS "customers_email_key";
DROP INDEX IF EXISTS "customers_lineUserId_key";
DROP INDEX IF EXISTS "customers_facebookId_key";
DROP INDEX IF EXISTS "customers_googleId_key";

-- Create new composite constraints
CREATE UNIQUE INDEX IF NOT EXISTS "customers_tenantId_email_key" ON "customers"("tenantId", "email");
CREATE UNIQUE INDEX IF NOT EXISTS "customers_tenantId_lineUserId_key" ON "customers"("tenantId", "lineUserId");
CREATE UNIQUE INDEX IF NOT EXISTS "customers_tenantId_facebookId_key" ON "customers"("tenantId", "facebookId");
CREATE UNIQUE INDEX IF NOT EXISTS "customers_tenantId_googleId_key" ON "customers"("tenantId", "googleId");
