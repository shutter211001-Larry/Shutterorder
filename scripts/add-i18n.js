const fs = require('fs');
const path = require('path');

const locales = ['en.json', 'es.json', 'fr.json', 'de.json', 'it.json', 'ja.json', 'ko.json', 'pt.json', 'th.json', 'tl.json', 'vi.json', 'id.json', 'zh-TW.json'];

function setNestedProperty(obj, keyPath, value) {
  const keys = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!current[k]) current[k] = {};
    current = current[k];
  }
  const lastKey = keys[keys.length - 1];
  if (current[lastKey] === undefined) {
    current[lastKey] = value;
  }
}

function addI18nKey(frontend, keyPath, value) {
  const localesDir = path.join(__dirname, '..', 'packages', frontend, 'src', 'i18n', 'locales');
  
  if (!fs.existsSync(localesDir)) {
    console.error(`Locales directory not found: ${localesDir}`);
    return;
  }

  for (const locale of locales) {
    const filePath = path.join(localesDir, locale);
    if (!fs.existsSync(filePath)) continue;
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const json = JSON.parse(content);
      
      setNestedProperty(json, keyPath, value);
      
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
    } catch (e) {
      console.error(`Error processing ${filePath}:`, e.message);
    }
  }
  console.log(`Added key ${keyPath} to ${frontend} locales.`);
}

const args = process.argv.slice(2);
if (args.length >= 3) {
  const [frontend, keyPath, ...valueParts] = args;
  const value = valueParts.join(' ');
  addI18nKey(frontend, keyPath, value);
} else {
  console.log('Usage: node add-i18n.js <frontend> <keyPath> <value>');
}
