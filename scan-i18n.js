const fs = require('fs');
const path = require('path');

const localesDir = 'packages/adminfront/src/i18n/locales';
const srcDir = 'packages/adminfront/src';

const keysInCode = new Set();
function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (f !== 'i18n') scanDir(p);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      const content = fs.readFileSync(p, 'utf8');
      // Match \bt('some.key') so we don't match get('...')
      const matches = content.matchAll(/[^a-zA-Z0-9]t\(['"]([^'"]+)['"]\)/g);
      for (const m of matches) {
        keysInCode.add(m[1]);
      }
    }
  }
}
scanDir(srcDir);

console.log(`Found ${keysInCode.size} translation keys used in code.`);

const locales = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));
let missingFound = false;

for (const loc of locales) {
  const p = path.join(localesDir, loc);
  const json = JSON.parse(fs.readFileSync(p, 'utf8'));
  
  const flatten = (obj, prefix = '') => {
    return Object.keys(obj).reduce((acc, k) => {
      const pre = prefix.length ? prefix + '.' : '';
      if (typeof obj[k] === 'object' && obj[k] !== null) {
        Object.assign(acc, flatten(obj[k], pre + k));
      } else {
        acc[pre + k] = obj[k];
      }
      return acc;
    }, {});
  };
  
  const flatKeys = flatten(json);
  const jsonKeySet = new Set(Object.keys(flatKeys));
  
  const missing = [];
  for (const k of keysInCode) {
    if (!jsonKeySet.has(k)) missing.push(k);
  }
  
  if (missing.length > 0) {
    missingFound = true;
    console.log(`[${loc}] Missing ${missing.length} keys!`);
    console.log(missing.slice(0, 10).join(', ') + (missing.length > 10 ? '...' : ''));
  }
}

if (!missingFound) {
  console.log('All i18n keys are fully synchronized across all languages! 🎉');
}
