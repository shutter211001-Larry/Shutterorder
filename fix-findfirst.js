const fs = require('fs');
const dir = 'packages/api-server/src/__tests__/integration';
const files = fs.readdirSync(dir);
files.forEach(f => {
  if (!f.endsWith('.ts')) return;
  const p = dir + '/' + f;
  let c = fs.readFileSync(p, 'utf8');
  let changed = false;
  
  c = c.replace(/customer:\s*\{([\s\S]*?)\}/g, (match, inner) => {
    if (!inner.includes('findFirst')) {
      changed = true;
      return `customer: { findFirst: vi.fn(), ${inner.trim()} }`;
    }
    return match;
  });
  
  c = c.replace(/user:\s*\{([\s\S]*?)\}/g, (match, inner) => {
    if (!inner.includes('findFirst')) {
      changed = true;
      return `user: { findFirst: vi.fn(), ${inner.trim()} }`;
    }
    return match;
  });

  if (changed) fs.writeFileSync(p, c);
});
