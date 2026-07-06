import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(process.cwd(), 'packages', 'adminfront', 'src', 'i18n', 'locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const newKeys = {
  "actions": "操作",
  "requestCorrection": "補登/異動",
  "createNew": "新增全新補打卡紀錄 (無原始紀錄時使用)"
};

files.forEach(file => {
  const filePath = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  let modified = false;

  if (data.attendance) {
    if (!data.attendance.actions) {
      data.attendance.actions = newKeys.actions;
      modified = true;
    }
    if (!data.attendance.requestCorrection) {
      data.attendance.requestCorrection = newKeys.requestCorrection;
      modified = true;
    }
  }

  if (data.attendanceCorrections) {
    if (!data.attendanceCorrections.createNew) {
      data.attendanceCorrections.createNew = newKeys.createNew;
      modified = true;
    }
    
    if (file === 'zh-TW.json') {
       if (data.attendanceCorrections.requestedCheckIn === '申請上班時間') {
          data.attendanceCorrections.requestedCheckIn = '申請上班時間 (含日期)';
          modified = true;
       }
       if (data.attendanceCorrections.requestedCheckOut === '申請下班時間') {
          data.attendanceCorrections.requestedCheckOut = '申請下班時間 (含日期)';
          modified = true;
       }
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`No changes needed in ${file}`);
  }
});
