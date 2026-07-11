require('dotenv').config({path: '../../.env'});
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.SHUTTER_ERP_DATABASE_URL } } });

async function main() {
  const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`;
  console.log(JSON.stringify(tables.map(t => t.table_name), null, 2));
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => process.exit(0));
