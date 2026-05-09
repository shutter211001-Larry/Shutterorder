import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import authRoutes from './routes/auth.routes.js';
import locationRoutes from './routes/location.routes.js';
import menuRoutes from './routes/menu.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import reservationRoutes from './routes/reservation.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import reviewRoutes from './routes/review.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import automationRoutes from './routes/automation.routes.js';
import loyaltyRoutes from './routes/loyalty.routes.js';
import legalRoutes from './routes/legal.routes.js';
import consentRoutes from './routes/consent.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import staffRoutes from './routes/staff.routes.js';
import customerRoutes from './routes/customer.routes.js';
import developerRoutes from './routes/developer.routes.js';
import lineRoutes from './routes/line.routes.js';
import { openApiSpec } from './lib/openapi.js';
import { initPassport } from './lib/passport.js';
import passport from 'passport';
import prisma from './lib/db.js';
import logger from './lib/logger.js';
import { requestId } from './middleware/requestId.js';
import { httpLogger } from './middleware/httpLogger.js';
import { metricsCollector } from './middleware/metricsCollector.js';

// Initialize automation event listeners
import './lib/events.js';

export function createApp() {
  const app = express();
  // On Railway/Cloud providers, we trust the first proxy
  app.set('trust proxy', 1);

  // Middleware
  app.use(requestId);
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // In development/simple production, we can disable or fine-tune this
  }));
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes('*')) {
        return callback(null, true);
      }
      // Allow configured origins + any local development IPs
      const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.') || origin.includes('10.');
      const isAllowed = corsOrigins.includes(origin) || isLocal;

      if (isAllowed) {
        callback(null, true);
      } else {
        // Return false instead of throwing a hard error to avoid 500s
        callback(null, false);
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }));
  if (process.env.NODE_ENV !== 'test') {
    app.use(httpLogger);
  }

  // Health check (before rate limiter so monitoring/readiness probes always work)
  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
  });

  // Rate limiting
  if (process.env.NODE_ENV !== 'test') {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: 'Too many requests, please try again later.' },
    });
    app.use('/api/', limiter);
  }

  // Stripe webhook needs raw body — register before JSON parser
  app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize passport for social login
  initPassport();
  app.use(passport.initialize());

  // Metrics collection (after passport so req.user is available)
  if (process.env.NODE_ENV !== 'test') {
    app.use(metricsCollector);
  }

  // Serve uploaded files
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  // API Documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'KitchenAsty API Documentation',
  }));

  // OpenAPI spec endpoint
  app.get('/api/openapi.json', (_req, res) => {
    res.json(openApiSpec);
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/locations', locationRoutes);
  app.use('/api/menu', menuRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/reservations', reservationRoutes);
  app.use('/api/coupons', couponRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/automation-rules', automationRoutes);
  app.use('/api/loyalty', loyaltyRoutes);
  app.use('/api/legal', legalRoutes);
  app.use('/api/consent', consentRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/staff', staffRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/developer', developerRoutes);
  app.use('/api/line', lineRoutes);

  // Temporary Debug Route
  app.get('/api/debug-db', async (req, res) => {
    try {
      const users = await prisma.user.count();
      const menuItems = await prisma.menuItem.count();
      const categories = await prisma.category.count();
      const locations = await prisma.location.count();
      const siteSettings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
      const uploadsDir = path.join(process.cwd(), 'uploads');
    
    // Emergency: Try to add columns manually if they are missing
    let migrationStatus = 'No migration needed';
    if (req.query.fix === 'true') {
      try {
        await prisma.$executeRawUnsafe('ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "googleId" TEXT;');
        await prisma.$executeRawUnsafe('ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "facebookId" TEXT;');
        await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "customers_googleId_key" ON "customers"("googleId");');
        await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "customers_facebookId_key" ON "customers"("facebookId");');
        migrationStatus = 'Migration successful (columns added via Raw SQL)';
      } catch (e: any) {
        migrationStatus = 'Migration failed: ' + e.message;
      }
    }

    res.json({
      success: true,
      counts: {
        users,
        menuItems,
        categories,
        locations,
        hasDefaultSettings: !!siteSettings,
      },
      migrationStatus,
      connectedTo: process.env.DATABASE_URL?.split('@')[1],
      cwd: process.cwd(),
      uploadsDir,
      hint: 'Add ?fix=true to the URL to run emergency SQL migration'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: 'Not Found',
    });
  });

  // Error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ err }, 'Unhandled error');
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    });
  });

  return app;
}
