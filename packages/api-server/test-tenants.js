const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({ take: 1 });
  console.log(JSON.stringify(tenants, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => process.exit(0));
