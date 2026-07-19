import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import * as authController from '../controllers/auth.controller.js';
import { authenticate, generateToken, requireRole } from '../middleware/auth.js';
import { loginRateLimiter, registerRateLimiter } from '../middleware/security.js';
import { tenantStorage } from '../middleware/tenantStorage.js';
const router = Router();
const STOREFRONT_URL = process.env.STORE_URL_PUBLIC || 'http://localhost:5174';

// STAFF AUTH
router.get('/staff/setup-status', authController.getSetupStatus);
router.post('/staff/login', loginRateLimiter, authController.staffLogin);
router.post('/staff/select-tenant', authController.staffSelectTenant);
router.post('/staff/register', authenticate, requireRole('SUPER_ADMIN'), registerRateLimiter, authController.staffRegister);
router.post('/staff/forgot-password', authController.requestStaffPasswordReset);
router.post('/staff/reset-password', authController.resetStaffPassword);

// CUSTOMER AUTH
router.post('/customer/register', registerRateLimiter, authController.customerRegister);
router.post('/customer/login', loginRateLimiter, authController.customerLogin);

const handleSocialCallback = async (req: Request, res: Response) => {
  let baseUrl = process.env.STORE_URL_PUBLIC || 'http://localhost:5174';
  if (!req.user) return res.redirect(`${baseUrl}/auth/callback?error=auth_failed`);
  const user = req.user as any;
  const { tenantStorage } = await import('../middleware/tenantStorage.js');
  const token = generateToken({
    id: user.id,
    email: user.email,
    type: user.type || 'customer',
    tenantId: tenantStorage.getStore()?.tenantId || null,
  });
  
  // Extract redirect from state if present
  let redirectPath = '/';
  const stateStr = req.query.state as string;
  const directRedirect = req.query.redirectUri || req.query.redirect;

  if (stateStr) {
    try {
      // Some providers or double-encoding might require multiple decodes, 
      // but usually Express decodes once. Let's try to parse as JSON first.
      let stateObj: any = null;
      if (stateStr.startsWith('{')) {
        stateObj = JSON.parse(stateStr);
      } else {
        // Try decoding in case it's double-encoded
        const decoded = decodeURIComponent(stateStr);
        if (decoded.startsWith('{')) {
          stateObj = JSON.parse(decoded);
        } else {
          // Try parsing as query string
          const params = new URLSearchParams(stateStr);
          redirectPath = params.get('redirect') || params.get('redirectUri') || redirectPath;
        }
      }

      if (stateObj) {
        redirectPath = stateObj.redirect || stateObj.redirectUri || redirectPath;
        if (stateObj.origin) {
          baseUrl = stateObj.origin;
        }
      }
    } catch (e) {
      console.warn('[Auth] Failed to parse OAuth state:', e);
    }
  }

  // Fallback to direct query param if state didn't yield anything
  if (redirectPath === '/' && directRedirect) {
    redirectPath = directRedirect as string;
  }

  // Ensure redirectPath is relative to prevent open redirect vulnerabilities
  if (redirectPath.startsWith('http')) {
    try {
      const url = new URL(redirectPath);
      redirectPath = url.pathname + url.search;
    } catch (e) {
      redirectPath = '/';
    }
  }

  res.redirect(`${baseUrl}/auth/callback?token=${token}&redirect=${encodeURIComponent(redirectPath)}`);
};

// Social login — Google (Stateless)
router.post('/google/verify', authController.verifyGoogleToken);

// SHARED
router.get('/me', authenticate, authController.getMe);
router.delete('/me', authenticate, authController.deleteMe);
router.post('/set-password', authenticate, authController.setPassword);
router.patch('/me', authenticate, authController.updateMe);
router.patch('/me/language', authenticate, authController.updateLanguage);
router.post('/google/unbind', authenticate, authController.unbindGoogle);
router.post('/social/merge', authenticate, authController.mergeSocialAccount);

export default router;
