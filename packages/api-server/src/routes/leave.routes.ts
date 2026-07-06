import { Router } from 'express';
import { authenticate, requireManager } from '../middlewares/auth.js';
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
router.get('/', requireManager, getAllLeaveRequests);
router.put('/:id/status', requireManager, updateLeaveStatus);

export default router;
