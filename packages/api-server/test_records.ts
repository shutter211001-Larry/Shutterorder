import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const events = await prisma.analyticsEvent.findMany();
  console.log('Analytics events:', events.length);
  console.dir(events, { depth: null });

  const orders = await prisma.order.findMany({
    select: { id: true, status: true, utmSource: true, createdAt: true, tenantId: true }
  });
  console.log('Orders:', orders.length);
  console.dir(orders, { depth: null });
}
main().finally(() => prisma.$disconnect());
