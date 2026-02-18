import { Router } from 'express';
import {
  listLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
} from '../controllers/location.controller.js';
import {
  listDeliveryZones,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
} from '../controllers/delivery-zone.controller.js';
import { authenticate, requireStaff, requireRole } from '../middleware/auth.js';

const router = Router();

// Locations - read is open, write requires staff
router.get('/', listLocations);
router.get('/:id', getLocation);
router.post('/', authenticate, requireStaff, requireRole('SUPER_ADMIN', 'MANAGER'), createLocation);
router.patch('/:id', authenticate, requireStaff, requireRole('SUPER_ADMIN', 'MANAGER'), updateLocation);
router.delete('/:id', authenticate, requireStaff, requireRole('SUPER_ADMIN'), deleteLocation);

// Delivery zones - nested under locations
router.get('/:locationId/delivery-zones', listDeliveryZones);
router.post('/:locationId/delivery-zones', authenticate, requireStaff, requireRole('SUPER_ADMIN', 'MANAGER'), createDeliveryZone);
router.patch('/:locationId/delivery-zones/:zoneId', authenticate, requireStaff, requireRole('SUPER_ADMIN', 'MANAGER'), updateDeliveryZone);
router.delete('/:locationId/delivery-zones/:zoneId', authenticate, requireStaff, requireRole('SUPER_ADMIN'), deleteDeliveryZone);

export default router;
