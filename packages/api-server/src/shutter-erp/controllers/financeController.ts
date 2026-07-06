import { Request, Response } from 'express';
import { prisma as adminPrisma } from '../../lib/db.js';
import shutterErpPrisma from '../lib/prisma.js';
import { OrderStatus } from '@prisma/client';

export const getProfitAndLoss = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // 1. Calculate Revenue (Admin DB)
    const orders = await adminPrisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: {
          notIn: ['CANCELLED'] as any,
        },
      },
      select: { total: true },
    });
    const revenue = orders.reduce((sum, order) => sum + order.total, 0);

    // 2. Calculate Expenses (ERP DB)
    const expenses = await shutterErpPrisma.expense.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: 'PAID',
      },
      select: { amount: true },
    });
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // 3. Calculate Payroll (Admin DB)
    // A. Hourly Staff
    const attendances = await adminPrisma.staffAttendance.findMany({
      where: {
        checkIn: {
          gte: start,
          lte: end,
        },
        checkOut: { not: null },
      },
      include: {
        user: {
          select: { hourlyWage: true },
        },
      },
    });

    let hourlyPayroll = 0;
    attendances.forEach((record) => {
      if (record.checkOut && record.user) {
        const hours = (record.checkOut.getTime() - record.checkIn.getTime()) / (1000 * 60 * 60);
        hourlyPayroll += hours * (record.user.hourlyWage || 0);
      }
    });

    // B. Monthly Staff
    const monthlyUsers = await adminPrisma.user.findMany({
      where: {
        salaryType: 'MONTHLY',
        isActive: true, // Only count active staff, or we can count everyone to be accurate for historical, but let's stick to active for simplicity
      },
      select: { monthlyWage: true },
    });

    const msInRange = end.getTime() - start.getTime();
    // Calculate days inclusive, if start and end are same day, it's 1 day. 
    // Wait, end is usually 23:59:59 or something. Let's just do math.ceil(ms / day)
    const daysInRange = Math.max(1, Math.ceil(msInRange / (1000 * 60 * 60 * 24)));
    
    // Standard accounting often uses 30 days for prorated monthly salary
    const proportion = daysInRange / 30;

    let monthlyPayroll = 0;
    monthlyUsers.forEach((user) => {
      monthlyPayroll += (user.monthlyWage || 0) * proportion;
    });

    const totalPayroll = hourlyPayroll + monthlyPayroll;

    // 4. Calculate PnL
    const grossProfit = revenue - totalExpenses;
    const netProfit = grossProfit - totalPayroll;

    res.json({
      period: { start, end },
      revenue,
      expenses: totalExpenses,
      payroll: {
        hourly: hourlyPayroll,
        monthly: monthlyPayroll,
        total: totalPayroll,
      },
      grossProfit,
      netProfit,
    });
  } catch (error: any) {
    console.error('Error fetching PnL:', error);
    res.status(500).json({ error: 'Failed to fetch PnL data' });
  }
};
