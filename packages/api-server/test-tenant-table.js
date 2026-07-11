const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.$queryRaw`SELECT count(*) FROM "Tenant"`;
  console.log(count);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => process.exit(0));
