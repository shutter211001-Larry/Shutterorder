import fs from 'fs';
import path from 'path';
import { translateFields } from './ai.js';

const localesDir = 'c:/Github/kitchenasty/packages/storefront/src/i18n/locales';
const baselineFile = 'zh-TW.json';

const langNames: Record<string, string> = {
  'de.json': 'German',
  'en.json': 'English',
  'es.json': 'Spanish',
  'fr.json': 'French',
  'id.json': 'Indonesian',
  'it.json': 'Italian',
  'ja.json': 'Japanese',
  'ko.json': 'Korean',
  'pt.json': 'Portuguese',
  'th.json': 'Thai',
  'tl.json': 'Tagalog',
  'vi.json': 'Vietnamese'
};

function flattenObject(obj: any, prefix = ''): Record<string, string> {
  let paths: Record<string, string> = {};
  for (const key in obj) {
    const value = obj[key];
    const newPrefix = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(paths, flattenObject(value, newPrefix));
    } else {
      paths[newPrefix] = value;
    }
  }
  return paths;
}

function unflattenObject(flat: Record<string, string>): any {
  const result: any = {};
  for (const key in flat) {
    const keys = key.split('.');
    let current = result;
    for (let i = 0; i < keys.length; i++) {
      const part = keys[i];
      if (i === keys.length - 1) {
        current[part] = flat[key];
      } else {
        current[part] = current[part] || {};
        current = current[part];
      }
    }
  }
  return result;
}

function sortObjectKeys(obj: any, baselineObj: any): any {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const sorted: any = {};
  const baselineKeys = baselineObj ? Object.keys(baselineObj) : [];
  const objKeys = Object.keys(obj);
  
  for (const k of baselineKeys) {
    if (objKeys.includes(k)) {
      sorted[k] = sortObjectKeys(obj[k], baselineObj[k]);
    }
  }
  
  const extraKeys = objKeys.filter(k => !baselineKeys.includes(k)).sort();
  for (const k of extraKeys) {
    sorted[k] = sortObjectKeys(obj[k], null);
  }
  
  return sorted;
}

async function run() {
  try {
    const baselinePath = path.join(localesDir, baselineFile);
    const baselineData = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    const baselineFlat = flattenObject(baselineData);
    const baselineKeys = Object.keys(baselineFlat);

    const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json') && f !== baselineFile);

    for (const file of files) {
      const targetLang = langNames[file];
      if (!targetLang) continue;

      const filePath = path.join(localesDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const flat = flattenObject(data);

      const missingKeys = baselineKeys.filter(k => flat[k] === undefined);

      if (missingKeys.length === 0) {
        console.log(`[${file}] is fully up to date!`);
        continue;
      }

      console.log(`[${file}] Found ${missingKeys.length} missing keys. Initiating translations into ${targetLang}...`);

      const itemsToTranslate = missingKeys.map(k => ({
        key: k,
        value: baselineFlat[k]
      }));

      // Translate in batches of 15
      const batchSize = 15;
      const newFlatTranslations: Record<string, string> = {};

      for (let i = 0; i < itemsToTranslate.length; i += batchSize) {
        const batch = itemsToTranslate.slice(i, i + batchSize);
        console.log(`[${file}] Translating batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(itemsToTranslate.length / batchSize)}...`);
        
        const langCode = file.split('.')[0];
        const res = await translateFields(batch, [langCode]);
        
        for (const item of batch) {
          if (res && res[item.key] && res[item.key][langCode]) {
            newFlatTranslations[item.key] = res[item.key][langCode];
          } else {
            console.warn(`[${file}] Warning: translation for key ${item.key} is missing in response.`);
          }
        }
      }

      // Merge new translations
      const mergedFlat = { ...flat, ...newFlatTranslations };
      const unflattened = unflattenObject(mergedFlat);
      const sorted = sortObjectKeys(unflattened, baselineData);

      fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2), 'utf8');
      console.log(`[${file}] Successfully translated and merged ${Object.keys(newFlatTranslations).length} keys!`);
    }

    console.log('\n--- TRANSLATION ALIGNMENT COMPLETE! ---');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

run();
