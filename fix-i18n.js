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
      const matches = content.matchAll(/[^a-zA-Z0-9]t\(['"]([^'"]+)['"]\)/g);
      for (const m of matches) {
        keysInCode.add(m[1]);
      }
    }
  }
}
scanDir(srcDir);

const locales = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

function setNested(obj, path, value) {
  const parts = path.split('.');
  let curr = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!curr[parts[i]]) curr[parts[i]] = {};
    curr = curr[parts[i]];
  }
  if (curr[parts[parts.length - 1]] === undefined) {
    curr[parts[parts.length - 1]] = value;
  }
}

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
  
  let modified = false;
  for (const k of keysInCode) {
    if (!jsonKeySet.has(k)) {
      // Use the last part of the key as English fallback, title cased
      const fallback = k.split('.').pop().replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      setNested(json, k, fallback);
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(p, JSON.stringify(json, null, 2) + '\n');
    console.log(`Updated ${loc} with missing keys`);
  }
}
