import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting data cleanup for SiteSettings JSON fields...');
  const settingsList = await prisma.siteSettings.findMany();

  for (const settings of settingsList) {
    let changed = false;
    const updateData = {};
    const fieldsToCheck = [
      'heroSection', 'featuresSection', 'ctaSection', 'generalSettings', 
      'orderSettings', 'reservationSettings', 'mailSettings', 'paymentSettings', 
      'reviewSettings', 'advancedSettings', 'lineSettings', 'menuSection', 
      'invoiceSettings', 'googleSettings'
    ];

    for (const field of fieldsToCheck) {
      if (settings[field] && typeof settings[field] === 'string') {
        try {
          const parsed = JSON.parse(settings[field]);
          if (parsed !== null && typeof parsed === 'object') {
            updateData[field] = parsed;
            changed = true;
            console.log(`[SiteSettings ${settings.id}] Field '${field}' was double-stringified. Fixing...`);
          }
        } catch (e) {}
      }
    }

    if (changed) {
      await prisma.siteSettings.update({
        where: { id: settings.id },
        data: updateData
      });
      console.log(`[SiteSettings ${settings.id}] Successfully updated.`);
    }
  }

  console.log('Cleanup completed.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
