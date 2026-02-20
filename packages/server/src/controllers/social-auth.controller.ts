import { Request, Response } from 'express';
import { generateToken } from '../middleware/auth.js';

const STOREFRONT_URL = process.env.STOREFRONT_URL || 'http://localhost:5173';

export function handleSocialCallback(req: Request, res: Response): void {
  const customer = req.user as any;

  if (!customer?.id) {
    res.redirect(`${STOREFRONT_URL}/login?error=auth_failed`);
    return;
  }

  const token = generateToken({
    id: customer.id,
    email: customer.email,
    type: 'customer',
  });

  res.redirect(`${STOREFRONT_URL}/auth/callback?token=${encodeURIComponent(token)}`);
}
