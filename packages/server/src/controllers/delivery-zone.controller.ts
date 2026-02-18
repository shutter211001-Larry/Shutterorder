import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/db.js';

const createZoneSchema = z.object({
  name: z.string().min(1),
  charge: z.number().min(0).default(0),
  minOrder: z.number().min(0).default(0),
  boundaries: z.any().optional(),
  isActive: z.boolean().default(true),
});

const updateZoneSchema = createZoneSchema.partial();

export async function listDeliveryZones(req: Request<{ locationId: string }>, res: Response): Promise<void> {
  const { locationId } = req.params;

  const location = await prisma.location.findUnique({ where: { id: locationId } });
  if (!location) {
    res.status(404).json({ success: false, error: 'Location not found' });
    return;
  }

  const zones = await prisma.deliveryZone.findMany({
    where: { locationId },
    orderBy: { name: 'asc' },
  });

  res.json({ success: true, data: zones });
}

export async function createDeliveryZone(req: Request<{ locationId: string }>, res: Response): Promise<void> {
  const { locationId } = req.params;
  const parsed = createZoneSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors });
    return;
  }

  const location = await prisma.location.findUnique({ where: { id: locationId } });
  if (!location) {
    res.status(404).json({ success: false, error: 'Location not found' });
    return;
  }

  const zone = await prisma.deliveryZone.create({
    data: { locationId, ...parsed.data },
  });

  res.status(201).json({ success: true, data: zone });
}

export async function updateDeliveryZone(req: Request<{ locationId: string; zoneId: string }>, res: Response): Promise<void> {
  const { locationId, zoneId } = req.params;
  const parsed = updateZoneSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors });
    return;
  }

  const zone = await prisma.deliveryZone.findFirst({
    where: { id: zoneId, locationId },
  });
  if (!zone) {
    res.status(404).json({ success: false, error: 'Delivery zone not found' });
    return;
  }

  const updated = await prisma.deliveryZone.update({
    where: { id: zoneId },
    data: parsed.data,
  });

  res.json({ success: true, data: updated });
}

export async function deleteDeliveryZone(req: Request<{ locationId: string; zoneId: string }>, res: Response): Promise<void> {
  const { locationId, zoneId } = req.params;

  const zone = await prisma.deliveryZone.findFirst({
    where: { id: zoneId, locationId },
  });
  if (!zone) {
    res.status(404).json({ success: false, error: 'Delivery zone not found' });
    return;
  }

  await prisma.deliveryZone.delete({ where: { id: zoneId } });
  res.json({ success: true, message: 'Delivery zone deleted' });
}
