export interface DailyAttendance {
  hours: number;
}

export interface PayrollSettings {
  overtimeMultiplier1: number;
  overtimeMultiplier2: number;
}

const DEFAULT_SETTINGS: PayrollSettings = {
  overtimeMultiplier1: 1.34, // 勞基法：第 9-10 小時
  overtimeMultiplier2: 1.67, // 勞基法：第 11-12 小時
};

/**
 * 依據台灣勞動基準法計算計時人員薪資
 * @param attendances 每日出勤時數陣列
 * @param hourlyWage 基本時薪
 * @param settings 倍率設定 (可選，預設依勞基法)
 */
export function calculateHourlyPayroll(
  attendances: DailyAttendance[],
  hourlyWage: number,
  settings: PayrollSettings = DEFAULT_SETTINGS
) {
  let totalBasePay = 0;
  let totalOvertimePay = 0;

  for (const att of attendances) {
    const hours = Math.max(0, att.hours);
    
    if (hours <= 8) {
      // 正常工時
      totalBasePay += hours * hourlyWage;
    } else if (hours <= 10) {
      // 延長工時 2 小時以內 (第 9-10 小時)
      totalBasePay += 8 * hourlyWage;
      totalOvertimePay += (hours - 8) * hourlyWage * settings.overtimeMultiplier1;
    } else {
      // 再延長工時 (第 11-12 小時及以上)
      totalBasePay += 8 * hourlyWage;
      totalOvertimePay += 2 * hourlyWage * settings.overtimeMultiplier1;
      totalOvertimePay += (hours - 10) * hourlyWage * settings.overtimeMultiplier2;
    }
  }

  // 四捨五入至整數
  const basePay = Math.round(totalBasePay);
  const overtimePay = Math.round(totalOvertimePay);

  return {
    basePay,
    overtimePay,
    totalPay: basePay + overtimePay
  };
}
