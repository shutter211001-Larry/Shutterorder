import { PrismaClient } from '@prisma/client';

export async function seedLocations(prisma: PrismaClient) {
  console.log('Seeding Locations...');

  // Create location
  const location = await prisma.location.upsert({
    where: { slug: 'downtown' },
    update: {},
    create: {
      name: 'Saffron & Sage Downtown',
      slug: 'downtown',
      description: 'Our flagship location in the heart of downtown San Francisco — seasonal Mediterranean cuisine in a warm, inviting setting',
      phone: '(555) 123-4567',
      email: 'downtown@saffronandsage.com',
      address: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'US',
      lat: 37.7749,
      lng: -122.4194,
      deliveryEnabled: true,
      pickupEnabled: true,
      minOrderDelivery: 15,
      minOrderPickup: 0,
      deliveryLeadTime: 35,
      pickupLeadTime: 15,
    },
  });

  // Operating hours (Mon-Sun, 10am-10pm)
  for (let day = 0; day <= 6; day++) {
    const existingHour = await prisma.operatingHour.findFirst({
      where: { locationId: location.id, dayOfWeek: day },
    });

    if (existingHour) {
      await prisma.operatingHour.update({
        where: { id: existingHour.id },
        data: {
          openTime: '10:00',
          closeTime: '22:00',
          isClosed: false,
        },
      });
    } else {
      await prisma.operatingHour.create({
        data: {
          locationId: location.id,
          dayOfWeek: day,
          openTime: '10:00',
          closeTime: '22:00',
          isClosed: false,
        },
      });
    }
  }

  // Delivery zones
  await prisma.deliveryZone.createMany({
    data: [
      {
        locationId: location.id,
        name: 'Zone 1 - Nearby',
        charge: 3.99,
        minOrder: 15,
        isActive: true,
      },
      {
        locationId: location.id,
        name: 'Zone 2 - Extended',
        charge: 6.99,
        minOrder: 25,
        isActive: true,
      }
    ],
    skipDuplicates: true,
  });

  // Tables
  for (let i = 1; i <= 10; i++) {
    await prisma.table.upsert({
      where: { locationId_name: { locationId: location.id, name: `Table ${i}` } },
      update: {},
      create: {
        locationId: location.id,
        name: `Table ${i}`,
        capacity: i <= 4 ? 2 : i <= 8 ? 4 : 6,
      },
    });
  }

  // Assign staff to location (for Attendance and Chat)
  const staffUsers = await prisma.user.findMany({
    where: { role: { in: ['STAFF', 'MANAGER'] } }
  });

  for (const staff of staffUsers) {
    await prisma.user.update({
      where: { id: staff.id },
      data: { locationId: location.id }
    });
  }
}
