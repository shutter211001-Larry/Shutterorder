import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const items = await prisma.menuItem.findMany({ select: { id: true, name: true, locationId: true } });
  console.log('Total items:', items.length);
  console.log('Items with locationId:', items.filter(i => i.locationId !== null).length);
  console.log('Items without locationId (global):', items.filter(i => i.locationId === null).length);
  
  const overrides = await prisma.menuItemLocationOverride.count();
  console.log('Total location overrides:', overrides);
}
main().catch(console.error).finally(() => prisma.$disconnect());
