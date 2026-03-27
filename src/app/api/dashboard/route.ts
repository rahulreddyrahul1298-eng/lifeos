import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import {
  getDailyBudgetRemaining,
  getDaysRemainingInMonth,
  getLast7Days,
  getMonthString,
  getTodayString,
  groupByCategory,
  summarizeBudgets,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

type Alert = {
  type: "warning" | "success" | "info" | "danger";
  message: string;
};

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.userId;
  const today = getTodayString();
  const month = getMonthString();
  const last7Days = getLast7Days();

  const [user, expenses, goals, categoryBudgets, debts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
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
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.categoryBudget.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.debt.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const todaySpent = expenses
    .filter((expense) => expense.date === today)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const remaining = user.income - totalSpent;
  const dailyBudgetRemaining = getDailyBudgetRemaining(user.budget, totalSpent);
  const daysRemaining = getDaysRemainingInMonth();
  const incomeUsedPct = user.income > 0 ? Math.round((totalSpent / user.income) * 100) : 0;

  const categoryDetails = summarizeBudgets(
    categoryBudgets.map((budget) => ({ category: budget.category, limit: budget.limit })),
    expenses.map((expense) => ({ category: expense.category, amount: expense.amount }))
  );

  const spendingByDay = last7Days.map((date) => {
    const dayExpenses = expenses.filter((expense) => expense.date === date);
    return {
      date,
      total: dayExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    };
  });

  const categoryBreakdown = groupByCategory(
    expenses.map((expense) => ({ category: expense.category, amount: expense.amount }))
  );

  const goalsFormatted = goals.map((goal) => ({
    id: goal.id,
    title: goal.title,
    icon: goal.icon,
    targetAmount: goal.targetAmount,
    savedAmount: goal.savedAmount,
    deadline: goal.deadline,
    completed: goal.completed,
    progress:
      goal.targetAmount && goal.targetAmount > 0
        ? Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100))
        : 0,
    remainingAmount: goal.targetAmount ? Math.max(0, goal.targetAmount - goal.savedAmount) : null,
  }));

  const debtsFormatted = debts.map((debt) => ({
    id: debt.id,
    name: debt.name,
    totalAmount: debt.totalAmount,
    paidAmount: debt.paidAmount,
    monthlyEMI: debt.monthlyEMI,
    remaining: Math.max(0, debt.totalAmount - debt.paidAmount),
    progress:
      debt.totalAmount > 0
        ? Math.min(100, Math.round((debt.paidAmount / debt.totalAmount) * 100))
        : 0,
  }));

  const totalDebt = debtsFormatted.reduce((sum, debt) => sum + debt.remaining, 0);
  const totalEMI = debtsFormatted.reduce((sum, debt) => sum + debt.monthlyEMI, 0);
  const totalGoalTarget = goalsFormatted.reduce((sum, goal) => sum + (goal.targetAmount || 0), 0);
  const totalGoalSaved = goalsFormatted.reduce((sum, goal) => sum + goal.savedAmount, 0);

  const alerts: Alert[] = [];

  for (const category of categoryDetails) {
    if (category.exceeded) {
      const transferText = category.transferredFromOther > 0
        ? ` after moving Rs ${Math.round(category.transferredFromOther).toLocaleString()} from Other`
        : "";
      alerts.push({
        type: "danger",
        message: `${category.category} is over budget by Rs ${Math.round(category.overBy).toLocaleString()}${transferText}`,
      });
      continue;
    }

    if (category.percent >= 90 && category.effectiveLimit > 0) {
      alerts.push({
        type: "warning",
        message: `${category.category} budget is ${category.percent}% used`,
      });
    }
  }

  if (remaining > 0 && user.income > 0) {
    alerts.push({
      type: "success",
      message: `You are on track to save Rs ${Math.round(remaining).toLocaleString()} this month`,
    });
  }

  if (dailyBudgetRemaining > 0 && daysRemaining > 0) {
    alerts.push({
      type: "info",
      message: `You can still spend about Rs ${Math.round(dailyBudgetRemaining).toLocaleString()} per day for the next ${daysRemaining} days`,
    });
  }

  if (totalEMI > 0) {
    alerts.push({
      type: "info",
      message: `Monthly EMIs add up to Rs ${Math.round(totalEMI).toLocaleString()}`,
    });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      income: user.income,
      budget: user.budget,
      isPremium: user.isPremium,
      bank: user.bank,
      occupation: user.occupation,
    },
    overview: {
      income: user.income,
      totalSpent,
      todaySpent,
      remaining,
      incomeUsedPct,
      daysRemaining,
      dailyBudgetRemaining: Math.round(dailyBudgetRemaining),
      totalGoalTarget,
      totalGoalSaved,
      totalDebt,
      totalEMI,
    },
    categoryDetails,
    categoryBreakdown,
    spendingByDay,
    transactions: expenses.map((expense) => ({
      id: expense.id,
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
    })),
    recentExpenses: expenses.slice(0, 8).map((expense) => ({
      id: expense.id,
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
    })),
    goals: goalsFormatted,
    debts: debtsFormatted,
    alerts: alerts.slice(0, 6),
    premium: user.isPremium
      ? {
          projectedMonthEnd: (() => {
            const now = new Date();
            const dayOfMonth = now.getDate();
            const dailyAvg = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            return Math.round(dailyAvg * lastDay);
          })(),
          projectedSavings: (() => {
            const now = new Date();
            const dayOfMonth = now.getDate();
            const dailyAvg = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            return Math.round(user.income - dailyAvg * lastDay);
          })(),
          avgDailySpend: (() => {
            const now = new Date();
            return now.getDate() > 0 ? Math.round(totalSpent / now.getDate()) : 0;
          })(),
        }
      : null,
  });
}

