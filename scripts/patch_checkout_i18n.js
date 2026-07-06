import fs from 'fs';
import path from 'path';

const localesDir = path.join(process.cwd(), 'packages', 'adminfront', 'src', 'i18n', 'locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const newKeys = {
  "missingCheckout": "未下班"
};

files.forEach(file => {
  const filePath = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  let modified = false;

  if (data.attendanceRecords) {
    if (!data.attendanceRecords.missingCheckout) {
      data.attendanceRecords.missingCheckout = file === 'zh-TW.json' ? '未下班' : 'Missing Check-out';
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    console.log(`Updated ${file}`);
  }
});
