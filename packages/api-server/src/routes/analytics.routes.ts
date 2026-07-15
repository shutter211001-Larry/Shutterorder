import { Router } from 'express';
import { recordEvent, getFunnelStats } from '../controllers/analytics.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// 前台公開的追蹤端點
router.post('/events', recordEvent);

// 後台取得數據的端點
router.get('/funnel', authenticate, requireRole('SUPER_ADMIN', 'MANAGER'), getFunnelStats);

export default router;
