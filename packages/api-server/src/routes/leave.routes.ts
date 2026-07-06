import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  createLeaveRequest,
  getMyLeaveRequests,
  getAllLeaveRequests,
  updateLeaveStatus
} from '../controllers/leave.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', createLeaveRequest);
router.get('/my-records', getMyLeaveRequests);
router.get('/', requireRole('MANAGER', 'SUPER_ADMIN'), getAllLeaveRequests);
router.put('/:id/status', requireRole('MANAGER', 'SUPER_ADMIN'), updateLeaveStatus);

export default router;
