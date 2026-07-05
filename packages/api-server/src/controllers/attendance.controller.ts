import { Request, Response } from 'express';
import prisma from '../lib/db.js';
import jwt from 'jsonwebtoken';

// Haversine formula to calculate distance in meters
function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; // Radius of the earth in m
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in m
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export const getQrToken = async (req: Request, res: Response) => {
  const { locationId } = req.query;
  if (!locationId) {
    return res.status(400).json({ success: false, error: 'Missing locationId' });
  }

  try {
    const token = jwt.sign(
      { locationId, type: 'attendance_qr' },
      process.env.JWT_SECRET || 'super-secret',
      { expiresIn: '30s' }
    );
    res.json({ success: true, data: { token } });
  } catch (error) {
    console.error('Error generating QR token:', error);
    res.status(500).json({ success: false, error: 'Failed to generate token' });
  }
};

export const checkIn = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { locationId, lat, lng, device, qrToken } = req.body;

  let finalLocationId = locationId;
  let isOutOfRange = false;
  let isQR = false;

  if (qrToken) {
    try {
      const decoded = jwt.verify(qrToken, process.env.JWT_SECRET || 'super-secret') as any;
      if (decoded.type === 'attendance_qr' && decoded.locationId) {
        finalLocationId = decoded.locationId;
        isOutOfRange = false;
        isQR = true;
      } else {
        return res.status(400).json({ success: false, error: 'Invalid QR token' });
      }
    } catch (err) {
      return res.status(400).json({ success: false, error: 'Invalid or expired QR token' });
    }
  }

  if (!userId || !finalLocationId) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  if (!qrToken && (lat === undefined || lng === undefined)) {
    return res.status(400).json({ success: false, error: 'Missing location data for GPS check-in' });
  }

  const location = await prisma.location.findUnique({
    where: { id: finalLocationId }
  });

  if (!location) {
    return res.status(404).json({ success: false, error: 'Location not found' });
  }

  if (!qrToken && location.lat && location.lng && lat !== undefined && lng !== undefined) {
    const distance = getDistanceFromLatLonInM(lat, lng, location.lat, location.lng);
    if (distance > 100) {
      isOutOfRange = true;
    }
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const existing = await prisma.staffAttendance.findFirst({
    where: {
      userId,
      locationId: finalLocationId,
      checkIn: { gte: startOfDay },
      checkOut: null
    }
  });

  if (existing) {
    return res.status(400).json({ success: false, error: 'Already checked in without checkout today' });
  }

  const record = await prisma.staffAttendance.create({
    data: {
      userId,
      locationId: finalLocationId,
      lat: lat ?? null,
      lng: lng ?? null,
      device: isQR ? `${device || 'Unknown'} (QR Scan)` : device,
      isOutOfRange
    }
  });

  res.status(201).json({ success: true, data: record });
};

export const checkOut = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const id = req.params.id as string;

  if (!userId || !id) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const record = await prisma.staffAttendance.findUnique({
    where: { id }
  });

  if (!record || record.userId !== userId) {
    return res.status(404).json({ success: false, error: 'Record not found' });
  }

  if (record.checkOut) {
    return res.status(400).json({ success: false, error: 'Already checked out' });
  }

  const updated = await prisma.staffAttendance.update({
    where: { id },
    data: { checkOut: new Date() }
  });

  res.json({ success: true, data: updated });
};

export const getMyRecords = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const records = await prisma.staffAttendance.findMany({
    where: { userId },
    include: { location: { select: { name: true } } },
    orderBy: { checkIn: 'desc' },
    take: 50
  });

  res.json({ success: true, data: records });
};

export const getRecords = async (req: Request, res: Response) => {
  const { locationId, userId, startDate, endDate, isOutOfRange } = req.query;

  const where: any = {};
  if (locationId) where.locationId = String(locationId);
  if (userId) where.userId = String(userId);
  if (isOutOfRange === 'true') where.isOutOfRange = true;

  if (startDate || endDate) {
    where.checkIn = {};
    if (startDate) where.checkIn.gte = new Date(String(startDate));
    if (endDate) {
      const end = new Date(String(endDate));
      end.setHours(23, 59, 59, 999);
      where.checkIn.lte = end;
    }
  }

  const records = await prisma.staffAttendance.findMany({
    where,
    include: {
      location: { select: { name: true } },
      user: { select: { name: true, email: true } }
    },
    orderBy: { checkIn: 'desc' },
    take: 100
  });

  res.json({ success: true, data: records });
};

export const getPayroll = async (req: Request, res: Response) => {
  const { year, month } = req.query;

  if (!year || !month) {
    return res.status(400).json({ success: false, error: 'Missing year or month' });
  }

  const startDate = new Date(Number(year), Number(month) - 1, 1);
  const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);

  const records = await prisma.staffAttendance.findMany({
    where: {
      checkIn: { gte: startDate, lte: endDate },
      checkOut: { not: null }
    },
    include: {
      user: { select: { id: true, name: true, hourlyWage: true } }
    }
  });

  // Aggregate hours and salary by user
  const payrollMap: Record<string, any> = {};

  records.forEach(record => {
    if (!record.checkOut || !record.user) return;
    const userId = record.user.id;
    if (!payrollMap[userId]) {
      payrollMap[userId] = {
        userId,
        name: record.user.name,
        hourlyWage: record.user.hourlyWage,
        totalHours: 0,
        totalSalary: 0
      };
    }

    const durationMs = record.checkOut.getTime() - record.checkIn.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    payrollMap[userId].totalHours += durationHours;
  });

  // Calculate salary and format
  const payrollData = Object.values(payrollMap).map(p => {
    p.totalHours = Number(p.totalHours.toFixed(2));
    p.totalSalary = Math.round(p.totalHours * p.hourlyWage);
    return p;
  });

  res.json({ success: true, data: payrollData });
};

export const createCorrectionRequest = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const { attendanceId, requestedCheckIn, requestedCheckOut, reason } = req.body;

  if (!reason) {
    return res.status(400).json({ success: false, error: 'Reason is required' });
  }

  try {
    const request = await prisma.attendanceCorrectionRequest.create({
      data: {
        userId,
        attendanceId: attendanceId || null,
        requestedCheckIn: requestedCheckIn ? new Date(requestedCheckIn) : null,
        requestedCheckOut: requestedCheckOut ? new Date(requestedCheckOut) : null,
        reason
      }
    });
    res.status(201).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create request' });
  }
};

export const getMyCorrectionRequests = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const requests = await prisma.attendanceCorrectionRequest.findMany({
      where: { userId },
      include: {
        attendance: true,
        manager: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch requests' });
  }
};

export const getCorrectionRequests = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status) {
      where.status = status as any;
    }

    const requests = await prisma.attendanceCorrectionRequest.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        attendance: true,
        manager: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch requests' });
  }
};

export const updateCorrectionRequestStatus = async (req: Request, res: Response) => {
  const managerId = req.user?.id;
  const { id } = req.params;
  const { status, locationId } = req.body; // locationId is needed if creating a new attendance record

  if (!managerId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }

  try {
    const request = await prisma.attendanceCorrectionRequest.findUnique({
      where: { id: String(id) }
    });

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Request is already processed' });
    }

    const updatedRequest = await prisma.attendanceCorrectionRequest.update({
      where: { id: String(id) },
      data: {
        status: status as any,
        managerId
      }
    });

    if (status === 'APPROVED') {
      if (request.attendanceId) {
        // Update existing attendance
        const updateData: any = {};
        if (request.requestedCheckIn) updateData.checkIn = request.requestedCheckIn;
        if (request.requestedCheckOut) updateData.checkOut = request.requestedCheckOut;
        
        await prisma.staffAttendance.update({
          where: { id: request.attendanceId },
          data: updateData
        });
      } else {
        // Create new attendance
        if (!request.requestedCheckIn) {
           return res.status(400).json({ success: false, error: 'Cannot create attendance without check-in time' });
        }
        await prisma.staffAttendance.create({
          data: {
            userId: request.userId,
            locationId: locationId || null,
            checkIn: request.requestedCheckIn,
            checkOut: request.requestedCheckOut,
            device: 'Manual Correction',
            isOutOfRange: false
          }
        });
      }
    }

    res.json({ success: true, data: updatedRequest });
  } catch (error) {
    console.error('Error updating correction request:', error);
    res.status(500).json({ success: false, error: 'Failed to update request' });
  }
};
