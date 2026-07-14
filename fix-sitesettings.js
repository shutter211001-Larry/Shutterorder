const fs = require('fs');
const dir = 'packages/api-server/src/__tests__/integration';
const files = fs.readdirSync(dir);
files.forEach(f => {
  if (!f.endsWith('.ts')) return;
  const p = dir + '/' + f;
  let c = fs.readFileSync(p, 'utf8');
  if (c.includes('const mockPrisma = {') && !c.includes('siteSettings: {')) {
    c = c.replace('const mockPrisma = {', "const mockPrisma = {\n    siteSettings: { findUnique: vi.fn().mockResolvedValue({ id: 'default', generalSettings: { permissions: {} }, orderSettings: { preOpeningBuffer: 30, postClosingBuffer: 30, timeSlotInterval: 15 } }) },");
    fs.writeFileSync(p, c);
  }
});
