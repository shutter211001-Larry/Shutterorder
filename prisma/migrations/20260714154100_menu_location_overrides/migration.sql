-- CreateTable
CREATE TABLE IF NOT EXISTS "menu_item_location_overrides" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "trackStock" BOOLEAN NOT NULL DEFAULT false,
    "stockQty" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "menu_item_location_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "menu_option_value_location_overrides" (
    "id" TEXT NOT NULL,
    "menuOptionValueId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "trackStock" BOOLEAN NOT NULL DEFAULT false,
    "stockQty" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "menu_option_value_location_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "menu_item_location_overrides_menuItemId_locationId_key" ON "menu_item_location_overrides"("menuItemId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "menu_option_value_location_overrides_menuOptionValueId_locationId_key" ON "menu_option_value_location_overrides"("menuOptionValueId", "locationId");

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_item_location_overrides_menuItemId_fkey') THEN
ALTER TABLE "menu_item_location_overrides" ADD CONSTRAINT "menu_item_location_overrides_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_item_location_overrides_locationId_fkey') THEN
ALTER TABLE "menu_item_location_overrides" ADD CONSTRAINT "menu_item_location_overrides_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_option_value_location_overrides_menuOptionValueId_fkey') THEN
ALTER TABLE "menu_option_value_location_overrides" ADD CONSTRAINT "menu_option_value_location_overrides_menuOptionValueId_fkey" FOREIGN KEY ("menuOptionValueId") REFERENCES "menu_option_values"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

-- AddForeignKey
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_option_value_location_overrides_locationId_fkey') THEN
ALTER TABLE "menu_option_value_location_overrides" ADD CONSTRAINT "menu_option_value_location_overrides_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;
