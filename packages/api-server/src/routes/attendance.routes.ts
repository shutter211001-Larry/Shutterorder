import { Router } from 'express';
import {
  checkIn,
  checkOut,
  getMyRecords,
  getRecords,
  getQrToken,
  getPayroll,
  createCorrectionRequest,
  getMyCorrectionRequests,
  getCorrectionRequests,
  updateCorrectionRequestStatus,
  toggleIgnoreRecord,
} from '../controllers/attendance.controller.js';
import { authenticate, requireStaff, requireRole } from '../middleware/auth.js';

const router = Router();

// QR Token Endpoint
router.get('/qr-token', authenticate, requireStaff, getQrToken);

// Payroll Endpoint
router.get('/payroll', authenticate, requireStaff, requireRole('SUPER_ADMIN', 'MANAGER'), getPayroll);

// Staff endpoints
router.post('/check-in', authenticate, requireStaff, checkIn);
router.post('/check-out/:id', authenticate, requireStaff, checkOut);
router.get('/my-records', authenticate, requireStaff, getMyRecords);

// Admin endpoints
router.get('/records', authenticate, requireStaff, requireRole('SUPER_ADMIN', 'MANAGER'), getRecords);
router.put('/records/:id/ignore', authenticate, requireStaff, requireRole('SUPER_ADMIN', 'MANAGER'), toggleIgnoreRecord);

// Correction Request endpoints (Staff)
router.post('/corrections', authenticate, requireStaff, createCorrectionRequest);
router.get('/corrections/my-records', authenticate, requireStaff, getMyCorrectionRequests);

// Correction Request endpoints (Admin)
router.get('/corrections', authenticate, requireStaff, requireRole('SUPER_ADMIN', 'MANAGER'), getCorrectionRequests);
router.put('/corrections/:id/status', authenticate, requireStaff, requireRole('SUPER_ADMIN', 'MANAGER'), updateCorrectionRequestStatus);

export default router;
