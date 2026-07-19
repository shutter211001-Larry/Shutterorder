const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function test() {
  const cats = await prisma.category.findMany({
    where: { tenantId: "demo-tenant-id", deletedAt: null }
  });
  console.log("Categories in demo-tenant-id:", cats.map(c => c.name).join(", "));
}
test().catch(console.error).finally(() => prisma.$disconnect());
