import fs from 'fs';
import path from 'path';

const localesDir = path.join(process.cwd(), 'packages', 'adminfront', 'src', 'i18n', 'locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const newAttendanceKeys = {
  "leaveTitle": "請假申請",
  "requestLeave": "新增請假單",
  "leaveType": "假別",
  "leaveStartTime": "開始時間",
  "leaveEndTime": "結束時間",
  "leaveReason": "原因",
  "status": "狀態",
  "leavePersonal": "事假",
  "leaveSick": "病假",
  "leaveAnnual": "特休",
  "leaveOther": "其他",
  "noLeaveRecords": "目前沒有請假紀錄",
  "leaveApprovalTitle": "請假審核",
  "employee": "員工",
  "leaveSuccess": "請假單已送出",
  "leaveStatusUpdated": "狀態已更新"
};

const newPayrollKeys = {
  "salaryType": "計薪方式",
  "baseSalary": "底薪",
  "holidayOvertimePay": "國定假日加班費/津貼",
  "leaveDeduction": "請假扣款",
  "typeMonthly": "月薪",
  "typeHourly": "時薪"
};

const newLocationKeys = {
  "payrollSettings": "薪資設定 (Payroll)",
  "payrollSettingsDescription": "設定此門市的國定假日計薪標準。",
  "hourlyHolidayMultiplier": "時薪制國定假日薪資倍率",
  "monthlyHolidayOvertime": "月薪制國定假日發給加班費"
};

files.forEach(file => {
  const filePath = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  let modified = false;

  if (!data.attendance) data.attendance = {};
  for (const [k, v] of Object.entries(newAttendanceKeys)) {
    if (!data.attendance[k]) {
      data.attendance[k] = v;
      modified = true;
    }
  }

  if (!data.attendancePayroll) data.attendancePayroll = {};
  for (const [k, v] of Object.entries(newPayrollKeys)) {
    if (!data.attendancePayroll[k]) {
      data.attendancePayroll[k] = v;
      modified = true;
    }
  }

  if (!data.locationForm) data.locationForm = {};
  for (const [k, v] of Object.entries(newLocationKeys)) {
    if (!data.locationForm[k]) {
      data.locationForm[k] = v;
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    console.log(`Updated ${file}`);
  }
});
