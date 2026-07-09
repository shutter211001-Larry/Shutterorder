const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // Revert first
  execSync('git checkout HEAD -- prisma/schema.prisma');
  // Copy to old
  fs.copyFileSync(path.join(__dirname, '../prisma/schema.prisma'), path.join(__dirname, '../prisma/schema.old.prisma'));
  // Run migration script
  execSync('node scripts/migrate_timestamptz.js', { stdio: 'inherit' });
  // Format
  execSync('npx prisma format', { stdio: 'inherit' });
  // Get Diff
  console.log('Running prisma migrate diff...');
  const diffOutput = execSync('npx prisma migrate diff --from-schema-datamodel prisma/schema.old.prisma --to-schema-datamodel prisma/schema.prisma --script', { encoding: 'utf8' });
  
  // Write migration SQL
  const migDir = path.join(__dirname, '../prisma/migrations');
  if (!fs.existsSync(migDir)) fs.mkdirSync(migDir);
  
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const targetDir = path.join(migDir, `${timestamp}_tz_standardization`);
  fs.mkdirSync(targetDir);
  
  // Prisma generates ALTER COLUMN TYPE, but Rule 2 says idempotency might be needed.
  // We'll write the raw SQL first.
  fs.writeFileSync(path.join(targetDir, 'migration.sql'), diffOutput, 'utf8');
  
  console.log('Migration generated successfully at', targetDir);
} catch (e) {
  console.error(e);
}
