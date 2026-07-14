const fs = require('fs');
const dir = 'packages/api-server/src/__tests__/integration';
const files = fs.readdirSync(dir);
files.forEach(f => {
  if (!f.endsWith('.ts')) return;
  const p = dir + '/' + f;
  let c = fs.readFileSync(p, 'utf8');
  if (c.includes('siteSettings: {')) {
    c = c.replace(/siteSettings: \{.*?\}/s, "siteSettings: { findUnique: vi.fn().mockResolvedValue({ id: 'default', generalSettings: { permissions: {} }, orderSettings: { preOpeningBuffer: 30, postClosingBuffer: 30, timeSlotInterval: 15 } }), findFirst: vi.fn().mockResolvedValue({ id: 'default', generalSettings: { permissions: {} }, orderSettings: { preOpeningBuffer: 30, postClosingBuffer: 30, timeSlotInterval: 15 } }), create: vi.fn().mockResolvedValue({ id: 'default', generalSettings: { permissions: {} }, orderSettings: { preOpeningBuffer: 30, postClosingBuffer: 30, timeSlotInterval: 15 } }) }");
    fs.writeFileSync(p, c);
  }
});
