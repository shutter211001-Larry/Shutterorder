const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function test() {
  try {
    await prisma.$executeRawUnsafe(`DO $$ BEGIN CREATE TYPE "TranslationStatus" AS ENUM ('PENDING', 'TRANSLATED', 'FAILED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "translationStatus" "TranslationStatus" NOT NULL DEFAULT 'PENDING';`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "translationStatus" "TranslationStatus" NOT NULL DEFAULT 'PENDING';`);
    console.log("SQL executed manually");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
