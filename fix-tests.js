const fs = require('fs');
const dir = 'packages/api-server/src/__tests__/integration';
const files = fs.readdirSync(dir);
files.forEach(f => {
  if (!f.endsWith('.ts')) return;
  const p = dir + '/' + f;
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/generateToken\(\{/g, "generateToken({ tenantId: 'tenant-1',");
  fs.writeFileSync(p, c);
});
