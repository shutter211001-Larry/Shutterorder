import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from './db.js';
import { grantRegistrationBonus } from './registrationBonus.js';

export const initPassport = async () => {
  // Fetch settings from DB
  let siteSettings = null;
  try {
    siteSettings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
  } catch (err) {
    console.warn('[Passport] Could not fetch site settings from DB (database might be offline). Using env defaults.');
  }
  const googleSettings = siteSettings?.googleSettings ? (typeof siteSettings.googleSettings === 'string' ? JSON.parse(siteSettings.googleSettings) : siteSettings.googleSettings) : {};

  const googleClientId = googleSettings.googleLoginClientId || process.env.GOOGLE_LOGIN_CLIENT_ID;
  const googleClientSecret = googleSettings.googleLoginClientSecret || process.env.GOOGLE_LOGIN_CLIENT_SECRET;

  // Google Strategy has been removed in favor of stateless verification via /api/auth/google/verify

  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });
};
