const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    await prisma.siteSettings.create({
      data: {
        id: require('crypto').randomUUID(),
        tenantId: 'demo-tenant'
      }
    });
    console.log('Success');
  } catch (e) {
    console.error(e.message);
  }
}
run();
