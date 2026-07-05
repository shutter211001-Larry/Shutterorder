import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export async function seedUsers(prisma: PrismaClient) {
  console.log('Seeding Users...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@shutter.com' },
    update: {},
    create: {
      email: 'admin@shutter.com',
      password: hashedPassword,
      name: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
      preferredLanguage: 'zh-TW',
    },
  });

  // Create manager user
  await prisma.user.upsert({
    where: { email: 'manager@shutter.com' },
    update: {},
    create: {
      email: 'manager@shutter.com',
      password: hashedPassword,
      name: 'Store Manager',
      role: 'MANAGER',
      isActive: true,
      preferredLanguage: 'zh-TW',
    },
  });

  // Create staff user
  await prisma.user.upsert({
    where: { email: 'staff@shutter.com' },
    update: {},
    create: {
      email: 'staff@shutter.com',
      password: hashedPassword,
      name: 'Staff Member',
      role: 'STAFF',
      isActive: true,
      hourlyWage: 180,
      salaryType: 'HOURLY',
      preferredLanguage: 'zh-TW',
    },
  });

  // Create customer group
  await prisma.customerGroup.upsert({
    where: { name: 'Regular' },
    update: {},
    create: { name: 'Regular' },
  });

  const vipGroup = await prisma.customerGroup.upsert({
    where: { name: 'VIP' },
    update: {},
    create: { name: 'VIP' },
  });

  // Create a customer
  const customerPassword = await bcrypt.hash('customer123', 10);
  await prisma.customer.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: customerPassword,
      name: 'John Doe',
      phone: '(555) 987-6543',
      groupId: vipGroup.id,
      loyaltyPoints: 100,
    },
  });
}

