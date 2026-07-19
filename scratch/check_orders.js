import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, guestName: true, orderType: true }
  });
  console.log(orders);
}

main().catch(console.error).finally(() => prisma.$disconnect());
