const fs = require('fs');

const p1 = 'packages/saasfront/src/components/AdminLayout.tsx';
let c1 = fs.readFileSync(p1, 'utf8');
c1 = c1.replace(/label:\s*\(t\('([^']+)'\)\s*\|\|\s*'[^']+'\)/g, "label: '$1'");
fs.writeFileSync(p1, c1, 'utf8');

const p2 = 'packages/saasfront/src/i18n/index.ts';
let c2 = fs.readFileSync(p2, 'utf8');
c2 = c2.replace(/name:\s*\(t\('[^']+'\)\s*\|\|\s*'([^']+)'\)/g, "name: '$1'");
fs.writeFileSync(p2, c2, 'utf8');
