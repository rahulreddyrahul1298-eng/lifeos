import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import {
  getTodayString,
  getMonthString,
  getLast7Days,
  getDailyBudgetRemaining,
  getDaysRemainingInMonth,
  groupByCategory,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = payload.userId;
  const today = getTodayString();
  const month = getMonthString();
  const last7Days = getLast7Days();

  const [user, expenses, goals, categoryBudgets, debts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        income: true,
        budget: true,
        isPremium: true,
        occupation: true,
        bank: true,
      },
    }),
    prisma.expense.findMany({
      where: { userId, date: { startsWith: month } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.categoryBudget.findMany({
      where: { userId },
    }),
    prisma.debt.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  // --- EXPENSE CALCULATIONS ---
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const todayExpenses = expenses.filter((e) => e.date === today);
  const todaySpent = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = user.income - totalSpent;
  const dailyBudgetRemaining = getDailyBudgetRemaining(user.budget, totalSpent);
  const daysRemaining = getDaysRemainingInMonth();
  const incomeUsedPct = user.income > 0 ? Math.round((totalSpent / user.income) * 100) : 0;

  // Category budgets with spending
  const categoryBudgetMap: Record<string, number> = {};
  for (const cb of categoryBudgets) {
    categoryBudgetMap[cb.category] = cb.limit;
  }

  const allCats = [
    "Food & Dining", "Transport", "Groceries", "Shopping",
    "Bills & Utilities", "Entertainment", "Health & Medical",
    "Education", "Clothing", "Rent / EMI", "Savings", "Other"
  ];

  const categoryDetails = allCats.map((cat) => {
    const catExpenses = expenses.filter((e) => e.category === cat);
    const spent = catExpenses.reduce((sum, e) => sum + e.amount, 0);
    const budgetLimit = categoryBudgetMap[cat] || 0;
    const percent = budgetLimit > 0 ? Math.min(100, (spent / budgetLimit) * 100) : 0;
    const exceeded = budgetLimit > 0 && spent > budgetLimit;
    return {
      category: cat,
      spent,
      limit: budgetLimit,
      percent: Math.round(percent),
      exceeded,
      remaining: Math.max(0, budgetLimit - spent),
      overBy: exceeded ? spent - budgetLimit : 0,
    };
  }).filter((c) => c.spent > 0 || c.limit > 0);

  // Spending per day (last 7 days)
  const spendingByDay = last7Days.map((date) => {
    const dayExpenses = expenses.filter((e) => e.date === date);
    return {
      date,
      total: dayExpenses.reduce((sum, e) => sum + e.amount, 0),
    };
  });

  const categoryBreakdown = groupByCategory(
    expenses.map((e) => ({ category: e.category, amount: e.amount }))
  );

  // --- GOALS ---
  const goalsFormatted = goals.map((g) => ({
    id: g.id,
    title: g.title,
    icon: g.icon,
    targetAmount: g.targetAmount,
    savedAmount: g.savedAmount,
    deadline: g.deadline,
    completed: g.completed,
    progress: g.targetAmount && g.targetAmount > 0
      ? Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100))
      : 0,
  }));

  // --- DEBTS ---
  const debtsFormatted = debts.map((d) => ({
    id: d.id,
    name: d.name,
    totalAmount: d.totalAmount,
    paidAmount: d.paidAmount,
    monthlyEMI: d.monthlyEMI,
    remaining: d.totalAmount - d.paidAmount,
    progress: d.totalAmount > 0
      ? Math.min(100, Math.round((d.paidAmount / d.totalAmount) * 100))
      : 0,
  }));

  const totalDebt = debts.reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);
  const totalEMI = debts.reduce((sum, d) => sum + d.monthlyEMI, 0);

  // --- ALERTS ---
  const alerts: { type: "warning" | "success" | "info" | "danger"; message: string }[] = [];

  // Budget exceeded alerts
  for (const cat of categoryDetails) {
    if (cat.exceeded) {
      alerts.push({
        type: "danger",
        message: `${cat.category} budget exceeded by ₹${Math.round(cat.overBy).toLocaleString()}`,
      });
    } else if (cat.percent >= 90 && cat.limit > 0) {
      alerts.push({
        type: "warning",
        message: `${cat.category} budget ${cat.percent}% used`,
      });
    }
  }

  // Overall spending
  if (incomeUsedPct < 50 && totalSpent > 0) {
    alerts.push({
      type: "success",
      message: `Great! Only ${incomeUsedPct}% of income used this month`,
    });
  }

  // Daily insight
  if (dailyBudgetRemaining > 0 && daysRemaining > 0) {
    alerts.push({
      type: "info",
      message: `You can spend ~₹${Math.round(dailyBudgetRemaining).toLocaleString()}/day for ${daysRemaining} days`,
    });
  }

  // Savings projection
  if (remaining > 0 && user.income > 0) {
    alerts.push({
      type: "success",
      message: `Projected savings: ₹${Math.round(remaining).toLocaleString()} this month`,
    });
  }

  return NextResponse.json({
    user: {
      name: user.name,
      income: user.income,
      budget: user.budget,
      isPremium: user.isPremium,
      bank: user.bank,
      occupation: user.occupation,
    },
    // Money overview
    totalSpent,
    todaySpent,
    remaining,
    incomeUsedPct,
    dailyBudgetRemaining: Math.round(dailyBudgetRemaining),
    daysRemaining,
    // Categories
    categoryDetails,
    categoryBreakdown,
    spendingByDay,
    // Transactions
    recentExpenses: expenses.slice(0, 10).map((e) => ({
      id: e.id,
      title: e.title,
      amount: e.amount,
      category: e.category,
      date: e.date,
    })),
    // Goals & Debts
    goals: goalsFormatted,
    debts: debtsFormatted,
    totalDebt,
    totalEMI,
    // Alerts
    alerts: alerts.slice(0, 5),
    // Premium predictions
    predictions: user.isPremium ? {
      projectedMonthEnd: (() => {
        const today = new Date();
        const dayOfMonth = today.getDate();
        const dailyAvg = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        return Math.round(dailyAvg * lastDay);
      })(),
      projectedSavings: (() => {
        const today = new Date();
        const dayOfMonth = today.getDate();
        const dailyAvg = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        return Math.round(user.income - (dailyAvg * lastDay));
      })(),
      avgDailySpend: (() => {
        const today = new Date();
        const dayOfMonth = today.getDate();
        return dayOfMonth > 0 ? Math.round(totalSpent / dayOfMonth) : 0;
      })(),
    } : null,
  });
}
