import fs from 'fs';
import path from 'path';

const localesDir = path.join(process.cwd(), 'packages', 'adminfront', 'src', 'i18n', 'locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const newKeys = {
  "attendanceCorrections": {
    "title": "補打卡申請",
    "requestCorrection": "提出補打卡申請",
    "reason": "補打卡原因",
    "requestedCheckIn": "申請上班時間",
    "requestedCheckOut": "申請下班時間",
    "status": "狀態",
    "statusPending": "待審核",
    "statusApproved": "已核准",
    "statusRejected": "已拒絕",
    "approve": "核准",
    "reject": "拒絕",
    "submit": "送出申請",
    "success": "申請已送出",
    "updateSuccess": "狀態已更新",
    "noRecords": "目前沒有申請紀錄",
    "cancel": "取消",
    "selectDate": "選擇日期",
    "checkInMissing": "忘記打上班卡",
    "checkOutMissing": "忘記打下班卡",
    "bothMissing": "忘記打上下班卡",
    "employee": "員工",
    "manager": "審核主管",
    "date": "日期"
  }
};

files.forEach(file => {
  const filePath = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  if (!data.attendanceCorrections) {
    data.attendanceCorrections = newKeys.attendanceCorrections;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`Already exists in ${file}`);
  }
});
