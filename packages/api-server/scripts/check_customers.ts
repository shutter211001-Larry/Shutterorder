import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const nullTenantCustomers = await prisma.customer.count({ where: { tenantId: null } });
  const allCustomers = await prisma.customer.findMany({ select: { email: true, tenantId: true, name: true, googleId: true } });
  console.log('Null tenant customers:', nullTenantCustomers);
  console.log('Total customers:', allCustomers.length);
  const emails = allCustomers.map(c => c.email).filter(Boolean);
  const uniqueEmails = new Set(emails);
  console.log('Duplicate emails?', emails.length !== uniqueEmails.size);
  console.log(allCustomers);
}
run().catch(console.error).finally(() => prisma.$disconnect());
