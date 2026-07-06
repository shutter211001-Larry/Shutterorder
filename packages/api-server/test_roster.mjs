import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTest() {
  console.log("=== 清理舊的測試資料 ===");
  await prisma.shift.deleteMany({
    where: { user: { email: { endsWith: '@test.com' } } }
  });
  await prisma.staffTimeOff.deleteMany({
    where: { user: { email: { endsWith: '@test.com' } } }
  });
  // Must delete availabilities first
  await prisma.userAvailability.deleteMany({
    where: { user: { email: { endsWith: '@test.com' } } }
  });
  await prisma.user.deleteMany({
    where: { email: { endsWith: '@test.com' } }
  });
  
  // Find an existing location or create a test one
  let location = await prisma.location.findFirst({
    where: { name: '台北測試門市 (自動產生)' }
  });
  if (!location) {
    location = await prisma.location.create({
      data: { name: '台北測試門市 (自動產生)', address: 'Taipei', slug: 'tpe-test', city: 'Taipei', postalCode: '100' }
    });
  }

  // Find a job role
  let roleChef = await prisma.jobRole.findFirst({
    where: { name: '測試主廚' }
  });
  if (!roleChef) {
    roleChef = await prisma.jobRole.create({
      data: { name: '測試主廚' }
    });
  }

  // Clear previous requirements for this location
  await prisma.shiftRequirement.deleteMany({
    where: { locationId: location.id }
  });
  await prisma.shift.deleteMany({
    where: { locationId: location.id }
  });

  console.log("=== 建立刁鑽的員工資料 ===");
  const availabilitiesData = [
    { dayOfWeek: 0, startTime: '00:00', endTime: '23:59' },
    { dayOfWeek: 1, startTime: '00:00', endTime: '23:59' },
    { dayOfWeek: 2, startTime: '00:00', endTime: '23:59' },
    { dayOfWeek: 3, startTime: '00:00', endTime: '23:59' },
    { dayOfWeek: 4, startTime: '00:00', endTime: '23:59' },
    { dayOfWeek: 5, startTime: '00:00', endTime: '23:59' },
    { dayOfWeek: 6, startTime: '00:00', endTime: '23:59' },
  ];

  // Staff A: 時數限制 (Max 40 hrs), 可以上 7 天
  const staffA = await prisma.user.create({
    data: {
      email: 'staffA@test.com',
      password: 'password',
      name: '員工A (時數限制40)',
      role: 'STAFF',
      locationId: location.id,
      salaryType: 'HOURLY',
      hourlyWage: 200,
      maxHoursPerWeek: 40,
      maxDaysPerWeek: 7,
      availabilities: { create: availabilitiesData },
      jobRoles: { connect: [{ id: roleChef.id }] }
    }
  });

  // Staff B: 天數限制 (Max 3 days), 時數無限制 (168)
  const staffB = await prisma.user.create({
    data: {
      email: 'staffB@test.com',
      password: 'password',
      name: '員工B (天數限制3)',
      role: 'STAFF',
      locationId: location.id,
      salaryType: 'HOURLY',
      hourlyWage: 180,
      maxHoursPerWeek: 168,
      maxDaysPerWeek: 3,
      availabilities: { create: availabilitiesData },
      jobRoles: { connect: [{ id: roleChef.id }] }
    }
  });

  // Staff C: 特定日期休假 (週三禁排)
  const staffC = await prisma.user.create({
    data: {
      email: 'staffC@test.com',
      password: 'password',
      name: '員工C (指定休假)',
      role: 'STAFF',
      locationId: location.id,
      salaryType: 'HOURLY',
      hourlyWage: 150,
      maxHoursPerWeek: 40,
      maxDaysPerWeek: 5,
      availabilities: { create: availabilitiesData },
      jobRoles: { connect: [{ id: roleChef.id }] },
      timeOffs: {
        create: [
          { date: new Date('2026-12-23T00:00:00.000Z'), reason: '聖誕節請假' }
        ]
      }
    }
  });

  console.log("=== 建立人力需求 ===");
  const startDate = new Date('2026-12-21T00:00:00.000Z'); // Monday
  for (let i = 0; i < 7; i++) {
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + i);
    
    await prisma.shiftRequirement.create({
      data: {
        locationId: location.id,
        date: targetDate,
        jobRoleId: roleChef.id,
        startTime: '10:00',
        endTime: '18:00',
        count: 3
      }
    });
  }

  console.log("資料建立完成！");
  
  // Now actually test the auto-scheduler!
  console.log("=== 執行自動排班演算法 (COST_OPTIMIZED) ===");
  const { default: jwt } = await import('jsonwebtoken');
  const { default: dotenv } = await import('dotenv');
  dotenv.config();
  const token = jwt.sign({ id: staffA.id, role: 'SUPER_ADMIN' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
  const res = await fetch('http://localhost:3000/api/roster/auto-schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      locationId: location.id,
      startDate: '2026-12-21',
      endDate: '2026-12-27',
      mode: 'COST_OPTIMIZED'
    })
  });
  
  if (!res.ok) {
    const err = await res.text();
    console.error("API Error:", err);
    return;
  }
  
  console.log("排班完成！正在分析結果...");
  
  // Verify results
  const createdShifts = await prisma.shift.findMany({
    where: { locationId: location.id },
    include: { user: true }
  });
  
  console.log(`總共需求：21 個班次 (每天 3 人 * 7 天)`);
  console.log(`成功排定：${createdShifts.length} 個班次`);
  console.log(`缺額：${21 - createdShifts.length} 個班次`);
  
  const staffCounts = {};
  createdShifts.forEach(s => {
    staffCounts[s.user.name] = (staffCounts[s.user.name] || 0) + 1;
  });
  
  console.log("各員工排定天數：", staffCounts);
  
}

runTest().catch(console.error).finally(() => prisma.$disconnect());
