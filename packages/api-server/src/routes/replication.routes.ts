import { Router } from 'express';
import { pullReplication, pushReplication } from '../controllers/replication.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// RxDB 同步路由 (需驗證身分與租戶)
router.get('/pull/:collection', requireAuth, pullReplication);
router.post('/push/:collection', requireAuth, pushReplication);

export default router;
