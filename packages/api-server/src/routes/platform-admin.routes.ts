import { Router } from 'express';
import { listTenants, createTenant, updateTenant } from '../controllers/platform-admin.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Protect all these routes for SUPER_ADMIN only
router.use(authenticate);
router.use(requireRole('SUPER_ADMIN'));

router.get('/tenants', listTenants);
router.post('/tenants', createTenant);
router.patch('/tenants/:id', updateTenant);

export default router;
