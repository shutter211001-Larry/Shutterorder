import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

const R2_ENDPOINT = process.env.R2_ENDPOINT || 'https://b9737e76e2c397a6e3e3ac861d0c491d.r2.cloudflarestorage.com';
const R2_BUCKET = process.env.R2_BUCKET || 'pizzastudio26-upload';
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY || '4552940922b01aad9f4f2218f24a18ea';
const R2_SECRET_KEY = process.env.R2_SECRET_KEY || 'ea71c497a5c4edc6f7c9e2f9ad51a7bd6927d4141bfdbe6c86347cd4f6d26900';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pizzastudio26.com';

const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
});

async function uploadToR2(filename: string, buffer: Buffer, mimeType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: filename,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);
  
  const baseUrl = R2_PUBLIC_URL.endsWith('/') ? R2_PUBLIC_URL.slice(0, -1) : R2_PUBLIC_URL;
  return `${baseUrl}/${filename}`;
}

async function fetchOldImage(oldUrl: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const match = oldUrl.match(/\/uploads\/([^?]+)/);
  if (!match) throw new Error(`Invalid old URL format: ${oldUrl}`);
  
  const filename = match[1];
  const localFilePath = path.join(UPLOADS_DIR, filename);
  
  const buffer = await fs.readFile(localFilePath);
  
  // Basic mime type guessing based on extension
  const ext = path.extname(filename).toLowerCase();
  let mimeType = 'application/octet-stream';
  if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
  else if (ext === '.png') mimeType = 'image/png';
  else if (ext === '.webp') mimeType = 'image/webp';
  else if (ext === '.svg') mimeType = 'image/svg+xml';
  else if (ext === '.gif') mimeType = 'image/gif';
  
  return { buffer, mimeType };
}

async function migrateImage(oldUrl: string | null | undefined): Promise<string | null> {
  if (!oldUrl || !oldUrl.includes('/uploads/')) return oldUrl || null;
  
  try {
    console.log(`Migrating ${oldUrl}...`);
    const match = oldUrl.match(/\/uploads\/([^?]+)/);
    if (!match) return oldUrl;
    const filename = match[1];

    const { buffer, mimeType } = await fetchOldImage(oldUrl);
    const newUrl = await uploadToR2(filename, buffer, mimeType);
    console.log(`✅ Success: ${newUrl}`);
    return newUrl;
  } catch (err: any) {
    console.error(`❌ Failed migrating ${oldUrl}: ${err.message}`);
    return oldUrl;
  }
}

async function main() {
  console.log('--- Starting CF R2 Migration from Local ---');

  // 1. Migrate MenuItems
  const menuItems = await prisma.menuItem.findMany({ 
    where: { image: { contains: '/uploads/' } },
    select: { id: true, image: true }
  });
  console.log(`Found ${menuItems.length} MenuItems to migrate.`);
  for (const item of menuItems) {
    const newUrl = await migrateImage(item.image);
    if (newUrl !== item.image) {
      await prisma.menuItem.update({ where: { id: item.id }, data: { image: newUrl } });
    }
  }

  // 2. Migrate Categories
  const categories = await prisma.category.findMany({ 
    where: { image: { contains: '/uploads/' } },
    select: { id: true, image: true }
  });
  console.log(`Found ${categories.length} Categories to migrate.`);
  for (const cat of categories) {
    const newUrl = await migrateImage(cat.image);
    if (newUrl !== cat.image) {
      await prisma.category.update({ where: { id: cat.id }, data: { image: newUrl } });
    }
  }

  // 3. Migrate Users (Avatar)
  const users = await prisma.user.findMany({ 
    where: { avatar: { contains: '/uploads/' } },
    select: { id: true, avatar: true }
  });
  console.log(`Found ${users.length} Users to migrate.`);
  for (const user of users) {
    const newUrl = await migrateImage(user.avatar);
    if (newUrl !== user.avatar) {
      await prisma.user.update({ where: { id: user.id }, data: { avatar: newUrl } });
    }
  }

  // 4. Migrate SiteSettings
  const settingsList = await prisma.siteSettings.findMany({
    select: { id: true, logo: true, favicon: true, heroSection: true }
  });
  for (const settings of settingsList) {
    let needsUpdate = false;
    const dataToUpdate: any = {};

    if (settings.logo && settings.logo.includes('/uploads/')) {
      dataToUpdate.logo = await migrateImage(settings.logo);
      if (dataToUpdate.logo !== settings.logo) needsUpdate = true;
    }
    
    if (settings.favicon && settings.favicon.includes('/uploads/')) {
      dataToUpdate.favicon = await migrateImage(settings.favicon);
      if (dataToUpdate.favicon !== settings.favicon) needsUpdate = true;
    }

    // Hero Section Background
    if (settings.heroSection) {
      const hero = settings.heroSection as any;
      if (hero.backgroundImage && typeof hero.backgroundImage === 'string' && hero.backgroundImage.includes('/uploads/')) {
        const newBg = await migrateImage(hero.backgroundImage);
        if (newBg !== hero.backgroundImage) {
          hero.backgroundImage = newBg;
          dataToUpdate.heroSection = hero;
          needsUpdate = true;
        }
      }
    }

    if (needsUpdate) {
      await prisma.siteSettings.update({ where: { id: settings.id }, data: dataToUpdate });
    }
  }

  console.log('--- Migration Completed ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
