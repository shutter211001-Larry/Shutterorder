import { PrismaClient } from '@prisma/client';

export async function seedStaff(prisma: PrismaClient) {
  console.log('Seeding Staff Activity...');

  const staff = await prisma.user.findFirst({ where: { role: 'STAFF' } });
  const manager = await prisma.user.findFirst({ where: { role: 'MANAGER' } });
  const location = await prisma.location.findUnique({ where: { slug: 'downtown' } });

  if (staff && location) {
    // Attendance
    const today = new Date();
    today.setHours(9, 0, 0, 0);

    const checkout = new Date();
    checkout.setHours(17, 0, 0, 0);

    const attendance = await prisma.staffAttendance.create({
      data: {
        userId: staff.id,
        locationId: location.id,
        checkIn: today,
        checkOut: checkout,
        lat: location.lat,
        lng: location.lng,
        device: 'Staff Mobile App',
        isOutOfRange: false,
      },
    });

    // Correction Request
    if (manager) {
      await prisma.attendanceCorrectionRequest.create({
        data: {
          userId: staff.id,
          attendanceId: attendance.id,
          requestedCheckIn: new Date(today.getTime() - 15 * 60000), // 15 mins earlier
          reason: 'Forgot to check in when arriving early for prep.',
          status: 'PENDING',
        },
      });
    }

    // Chat Message
    await prisma.chatMessage.create({
      data: {
        senderId: staff.id,
        locationId: location.id,
        content: 'I have finished prepping the dough for today.',
      },
    });

    if (manager) {
      await prisma.chatMessage.create({
        data: {
          senderId: manager.id,
          locationId: location.id,
          content: 'Great, thanks!',
        },
      });
    }
  }
}
