
-- Create Table
CREATE TABLE IF NOT EXISTS "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- Create Unique Index for Domain
DO $$ BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'tenants_domain_key') THEN 
    CREATE UNIQUE INDEX "tenants_domain_key" ON "tenants"("domain"); 
  END IF; 
END $$;

-- Add tenantId Columns
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- Create Unique Index for site_settings tenantId
DO $$ BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'site_settings_tenantId_key') THEN 
    CREATE UNIQUE INDEX "site_settings_tenantId_key" ON "site_settings"("tenantId"); 
  END IF; 
END $$;

-- Add Foreign Key Constraints idempotently
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_tenantId_fkey') THEN 
    ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE; 
  END IF; 

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_tenantId_fkey') THEN 
    ALTER TABLE "customers" ADD CONSTRAINT "customers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE; 
  END IF; 

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'locations_tenantId_fkey') THEN 
    ALTER TABLE "locations" ADD CONSTRAINT "locations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE; 
  END IF; 

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_tenantId_fkey') THEN 
    ALTER TABLE "categories" ADD CONSTRAINT "categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE; 
  END IF; 

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_tenantId_fkey') THEN 
    ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE; 
  END IF; 

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_tenantId_fkey') THEN 
    ALTER TABLE "orders" ADD CONSTRAINT "orders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE; 
  END IF; 

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coupons_tenantId_fkey') THEN 
    ALTER TABLE "coupons" ADD CONSTRAINT "coupons_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE; 
  END IF; 

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'site_settings_tenantId_fkey') THEN 
    ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE; 
  END IF; 
END $$;
