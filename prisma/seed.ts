import { PrismaClient } from '@prisma/client';
import { seedSystem } from './seeds/01_system';
import { seedUsers } from './seeds/02_users';
import { seedLocations } from './seeds/03_locations';
import { seedMenu } from './seeds/04_menu';
import { seedErp } from './seeds/05_erp';
import { seedStaff } from './seeds/06_staff';
import { seedOrders } from './seeds/07_orders';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  try {
    await seedSystem(prisma);
    await seedUsers(prisma);
    await seedLocations(prisma);
    await seedMenu(prisma);
    await seedErp(prisma);
    await seedStaff(prisma);
    await seedOrders(prisma);

    console.log('\n✅ Seed completed successfully!');
    console.log('--------------------------------------------------');
    console.log('🔑 Admin login: admin@shutter.com / admin123');
    console.log('🔑 Manager login: manager@shutter.com / admin123');
    console.log('🔑 Staff login: staff@shutter.com / admin123');
    console.log('🔑 Customer login: customer@example.com / customer123');
    console.log('--------------------------------------------------');
  } catch (e) {
    console.error('\n❌ Error during seeding:');
    console.error(e);
    process.exit(1);
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
