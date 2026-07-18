import fs from 'fs';
import path from 'path';

const localesDir = 'c:/Github/kitchenasty/packages/adminfront/src/i18n/locales';
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const newKeys = {
  "zh-TW": {
    "comment": "備註",
    "commentPlaceholder": "輸入訂單備註...",
    "estimatedWaitTime": "預估製作時間",
    "minutes": "分鐘",
    "expectedReadyTime": "預計取餐"
  },
  "default": {
    "comment": "Comment",
    "commentPlaceholder": "Enter order comment...",
    "estimatedWaitTime": "Estimated Wait Time",
    "minutes": "minutes",
    "expectedReadyTime": "Expected Ready Time"
  }
};

for (const file of files) {
  const filePath = path.join(localesDir, file);
  const lang = file.replace('.json', '');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!data.orderCreate) {
    data.orderCreate = {};
  }

  const keysToUse = newKeys[lang] || newKeys["default"];

  for (const [k, v] of Object.entries(keysToUse)) {
    if (!data.orderCreate[k]) {
      data.orderCreate[k] = v;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Updated ${file}`);
}
