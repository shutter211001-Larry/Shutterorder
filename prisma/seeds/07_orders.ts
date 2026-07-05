import { PrismaClient, OrderStatus } from '@prisma/client';

export async function seedOrders(prisma: PrismaClient) {
  console.log('Seeding Orders & Transactions...');

  const location = await prisma.location.findUnique({ where: { slug: 'downtown' } });
  const customer = await prisma.customer.findUnique({ where: { email: 'customer@example.com' } });
  const margherita = await prisma.menuItem.findUnique({ where: { slug: 'margherita-pizza' } });
  const table = await prisma.table.findFirst({ where: { locationId: location?.id } });

  if (!location || !customer || !margherita) return;

  // Coupons
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      type: 'PERCENTAGE',
      value: 10,
      minOrder: 20,
      maxDiscount: 15,
      usageLimit: 1000,
      perCustomer: 1,
      isActive: true,
    },
  });

  // Group Order Session
  if (table) {
    const groupSession = await prisma.groupOrderSession.create({
      data: {
        pin: '1234',
        locationId: location.id,
        tableId: table.id,
        status: 'ACTIVE',
      },
    });

    // Sample Group Order
    await prisma.order.upsert({
      where: { orderNumber: 'SH-SEED-GRP-001' },
      update: {},
      create: {
        orderNumber: 'SH-SEED-GRP-001',
        customerId: customer.id,
        locationId: location.id,
        orderType: 'PICKUP',
        status: 'PENDING',
        subtotal: 14.99,
        total: 14.99 * 1.08,
        tax: 14.99 * 0.08,
        groupId: groupSession.id,
        tableId: table.id,
        items: {
          create: [
            {
              menuItemId: margherita.id,
              name: 'Margherita Pizza',
              quantity: 1,
              unitPrice: 14.99,
              subtotal: 14.99,
            },
          ],
        },
      },
    });
  }

  // Sample Frozen Order
  const frozenPizza = await prisma.menuItem.findUnique({ where: { slug: 'frozen-margherita' } });
  if (frozenPizza) {
    await prisma.order.upsert({
      where: { orderNumber: 'SH-SEED-FRZ-001' },
      update: {},
      create: {
        orderNumber: 'SH-SEED-FRZ-001',
        customerId: customer.id,
        locationId: location.id,
        orderType: 'FROZEN_DELIVERY',
        status: 'CONFIRMED',
        frozenDeliveryMethod: '711_FROZEN',
        subtotal: 35.00,
        deliveryFee: 15.00,
        total: 50.00,
        logisticsProvider: '711',
        trackingNumber: '711-TRACK-123',
        items: {
          create: [{
            menuItemId: frozenPizza.id,
            name: frozenPizza.name,
            quantity: 1,
            unitPrice: 35.00,
            subtotal: 35.00,
          }],
        },
      },
    });
  }
}
