const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  try {
    const tenantId = 'dummy-tenant-id';
    const menuItemsFilter = tenantId ? { where: { menuItem: { tenantId } } } : true;
    const allergens = await prisma.allergen.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { menuItems: menuItemsFilter } } },
    });
    console.log('Success:', allergens.length);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
