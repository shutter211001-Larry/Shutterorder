import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import logger from '../lib/logger.js';

export const tenantStorage = new AsyncLocalStorage<{ tenantId: string | null }>();

export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 1. Extract from Header (Primary strategy for SPA and Mobile)
  let tenantId = req.headers['x-tenant-id'] as string;

  // 2. Extract from Query (Fallback for some webhooks or redirects)
  if (!tenantId && req.query.tenantId) {
    tenantId = req.query.tenantId as string;
  }

  if (tenantId) {
    logger.debug({ tenantId, path: req.path }, 'Tenant resolved from request');
  }

  // Store the tenantId in AsyncLocalStorage for the lifetime of this request
  tenantStorage.run({ tenantId: tenantId || null }, () => {
    next();
  });
};
