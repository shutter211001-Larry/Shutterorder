const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function run() { 
  try { 
    await prisma.order.deleteMany({ where: { tenantId: 'demo-tenant-id' } }); 
    await prisma.tenant.delete({ where: { id: 'demo-tenant-id' } }); 
    console.log('Deleted successfully'); 
  } catch (e) { 
    console.error(e.message); 
  } finally { 
    await prisma.$disconnect(); 
  } 
} 

run();
