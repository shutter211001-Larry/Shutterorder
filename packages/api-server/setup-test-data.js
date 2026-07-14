const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setup() {
  const t = await prisma.tenant.upsert({
    where: { id: 'demo-tenant-123' },
    update: {},
    create: {
      id: 'demo-tenant-123',
      name: 'Demo Tenant',
      domain: 'demo.com',
      isActive: true,
      siteSettings: {
        create: { id: require('crypto').randomUUID() }
      }
    }
  });

  const c = await prisma.customer.upsert({
    where: { tenantId_email: { email: 'customer@test.com', tenantId: t.id } },
    update: {},
    create: {
      id: 'customer-1',
      tenantId: t.id,
      email: 'customer@test.com',
      password: await require('bcryptjs').hash('password123', 10),
      name: 'Test Customer'
    }
  });

  console.log(`Tenant ID: ${t.id}`);
  console.log(`Customer: ${c.email} / password123`);
}
setup();
