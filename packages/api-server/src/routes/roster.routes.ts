import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  listShifts,
  upsertShift,
  deleteShift,
  listAvailabilities,
  saveAvailabilities,
  listRequirements,
  saveRequirements,
  listWeeklyRequirements,
  saveWeeklyRequirements,
} from '../controllers/roster.controller.js';
import { autoSchedule } from '../controllers/auto-schedule.controller.js';

const router = Router();

router.use(authenticate);

// Shifts
router.get('/shifts', listShifts);
router.post('/shifts', upsertShift);
router.delete('/shifts/:id', deleteShift);

// Availabilities
router.get('/availabilities', listAvailabilities);
router.post('/availabilities', saveAvailabilities);

// Requirements (Overrides)
router.get('/requirements', listRequirements);
router.post('/requirements', saveRequirements);

// Weekly Requirements (Templates)
router.get('/weekly-requirements', listWeeklyRequirements);
router.post('/weekly-requirements', saveWeeklyRequirements);

// Auto-Scheduling
router.post('/auto-schedule', autoSchedule);

export default router;
