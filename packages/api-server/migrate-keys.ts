import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
  let defaultSettings = await prisma.siteSettings.findUnique({
    where: { id: 'default' }
  });

  if (!defaultSettings) {
    console.log('No default settings found. Looking for the first one...');
    defaultSettings = await prisma.siteSettings.findFirst();
  }

  if (!defaultSettings) {
    console.log('No SiteSettings found in DB.');
    return;
  }

  // Parse existing JSON
  const lineSettings = typeof defaultSettings.lineSettings === 'string' ? JSON.parse(defaultSettings.lineSettings || '{}') : (defaultSettings.lineSettings || {});
  const paymentSettings = typeof defaultSettings.paymentSettings === 'string' ? JSON.parse(defaultSettings.paymentSettings || '{}') : (defaultSettings.paymentSettings || {});

  // Inject env vars
  if (process.env.LINE_PAY_CHANNEL_ID) lineSettings.linePayChannelId = process.env.LINE_PAY_CHANNEL_ID;
  if (process.env.LINE_PAY_CHANNEL_SECRET) lineSettings.linePayChannelSecret = process.env.LINE_PAY_CHANNEL_SECRET;
  if (process.env.LINE_PAY_API_URL) lineSettings.linePayApiUrl = process.env.LINE_PAY_API_URL;
  if (process.env.LINE_PAY_RETURN_URL) lineSettings.linePayReturnUrl = process.env.LINE_PAY_RETURN_URL;
  if (process.env.LINE_PAY_PROXY_URL) lineSettings.linePayProxyUrl = process.env.LINE_PAY_PROXY_URL;
  lineSettings.linePayEnabled = true;

  if (process.env.STRIPE_SECRET_KEY) paymentSettings.stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (process.env.STRIPE_WEBHOOK_SECRET) paymentSettings.stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (process.env.SMTP_USER) {
    const mailSettings = typeof defaultSettings.mailSettings === 'string' ? JSON.parse(defaultSettings.mailSettings || '{}') : (defaultSettings.mailSettings || {});
    mailSettings.smtpHost = process.env.SMTP_HOST || 'localhost';
    mailSettings.smtpPort = process.env.SMTP_PORT || '1025';
    mailSettings.smtpUser = process.env.SMTP_USER;
    mailSettings.smtpPass = process.env.SMTP_PASS;
    await prisma.siteSettings.update({
      where: { id: defaultSettings.id },
      data: { mailSettings }
    });
  }

  await prisma.siteSettings.update({
    where: { id: defaultSettings.id },
    data: {
      lineSettings,
      paymentSettings
    }
  });

  console.log('Successfully migrated environment variables to SiteSettings in DB.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
