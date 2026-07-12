const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function main() { 
  const records = await prisma.staffAttendance.findMany({ 
    orderBy: { createdAt: 'desc' }, 
    take: 5, 
    include: { user: { select: { name: true, role: true } } } 
  }); 
  console.log(records.map(r => ({ user: r.user.name, role: r.user.role, locationId: r.locationId }))); 
  await prisma.$disconnect(); 
} 
main();
