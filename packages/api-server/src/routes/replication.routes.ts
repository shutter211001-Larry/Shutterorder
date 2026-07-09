import { Router } from 'express';
import { pullReplication, pushReplication } from '../controllers/replication.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// RxDB 同步路由 (需驗證身分與租戶)
router.get('/pull/:collection', authenticate, pullReplication);
router.post('/push/:collection', authenticate, pushReplication);

export default router;
