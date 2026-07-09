import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateHourlyPayroll } from '../../utils/payroll.js';

describe('Property-Based Testing: TW Labor Law Payroll Engine', () => {
  
  // 隨機產生合理出勤時數陣列 (0 ~ 12小時, 精確到小數點第二位)
  const arbitraryAttendances = fc.array(
    fc.float({ min: 0, max: 12, noNaN: true }).map(h => ({ hours: Math.round(h * 100) / 100 }))
  );
  
  // 隨機產生時薪 (183 ~ 500)
  const arbitraryWage = fc.integer({ min: 183, max: 500 });

  it('Property 1: 不低於底薪原則 (Total Pay >= Total Hours * Hourly Wage)', () => {
    fc.assert(
      fc.property(arbitraryAttendances, arbitraryWage, (attendances, hourlyWage) => {
        const result = calculateHourlyPayroll(attendances, hourlyWage);
        
        const totalHours = attendances.reduce((sum, att) => sum + att.hours, 0);
        const expectedMinPay = totalHours * hourlyWage;
        
        // 考量四捨五入的誤差，允許 -1 塊錢的容差
        expect(result.totalPay).toBeGreaterThanOrEqual(Math.floor(expectedMinPay) - 1);
      }),
      { numRuns: 1000 }
    );
  });

  it('Property 2: 無加班費原則 (If all daily hours <= 8, overtimePay === 0)', () => {
    // 過濾出只有正常工時的打卡組合
    const normalAttendances = fc.array(
      fc.float({ min: 0, max: 8, noNaN: true }).map(h => ({ hours: Math.round(h * 100) / 100 }))
    );

    fc.assert(
      fc.property(normalAttendances, arbitraryWage, (attendances, hourlyWage) => {
        const result = calculateHourlyPayroll(attendances, hourlyWage);
        expect(result.overtimePay).toBe(0);
        
        const totalHours = attendances.reduce((sum, att) => sum + att.hours, 0);
        expect(result.totalPay).toBe(Math.round(totalHours * hourlyWage));
      }),
      { numRuns: 1000 }
    );
  });

  it('Property 3: 加班費必發原則 (If any day > 8, totalPay > Total Hours * Hourly Wage)', () => {
    const mixedAttendances = fc.array(
      fc.float({ min: 0, max: 12, noNaN: true }).map(h => ({ hours: Math.round(h * 100) / 100 })),
      { minLength: 1 } // 確保至少有一天
    ).filter(arr => arr.some(a => a.hours > 8)); // 確保必定包含至少一天超時

    fc.assert(
      fc.property(mixedAttendances, arbitraryWage, (attendances, hourlyWage) => {
        const result = calculateHourlyPayroll(attendances, hourlyWage);
        expect(result.overtimePay).toBeGreaterThan(0);
        
        const totalHours = attendances.reduce((sum, att) => sum + att.hours, 0);
        const baseLinePay = totalHours * hourlyWage;
        
        // 有加班費的情況，總薪水必須實質大於「時數*時薪」
        // 加班時數可能很小 (例如 8.01)，因此加 0.1 避免四捨五入等號
        expect(result.totalPay).toBeGreaterThan(baseLinePay);
      }),
      { numRuns: 1000 }
    );
  });

});
