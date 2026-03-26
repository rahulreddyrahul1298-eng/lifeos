import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import {
  getTodayString,
  getMonthString,
  calculateLifeScore,
  getLast7Days,
  getDailyBudgetRemaining,
  getDaysRemainingInMonth,
  groupByCategory,
} from "@/lib/utils";

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

  const [user, habits, expenses, goals, categoryBudgets] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        income: true,
        budget: true,
        isPremium: true,
      },
    }),
    prisma.habit.findMany({
      where: { userId },
      include: {
        completions: {
          where: {
            date: { in: last7Days },
          },
        },
      },
      orderBy: { createdAt: "asc" },
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
  ]);

  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  // --- EXPENSE CALCULATIONS ---
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const todayExpenses = expenses.filter((e) => e.date === today);
  const todaySpent = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const dailyBudgetRemaining = getDailyBudgetRemaining(user.budget, totalSpent);
  const daysRemaining = getDaysRemainingInMonth();
  const categoryBreakdown = groupByCategory(
    expenses.map((e) => ({ category: e.category, amount: e.amount }))
  );

  // Category budgets with spending data
  const categoryBudgetMap: Record<string, number> = {};
  for (const cb of categoryBudgets) {
    categoryBudgetMap[cb.category] = cb.limit;
  }

  // Build full category data: budget + spent + expenses list
  const allCategories = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Education", "Other"];
  const categoryDetails = allCategories.map((cat) => {
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
      expenses: catExpenses.map((e) => ({
        id: e.id,
        title: e.title,
        amount: e.amount,
        date: e.date,
      })),
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

  // --- HABIT CALCULATIONS ---
  const habitsFormatted = habits.map((h) => {
    const todayCompletion = h.completions.find((c) => c.date === today);
    const weekCompletions = last7Days.map((date) => ({
      date,
      done: h.completions.some((c) => c.date === date),
    }));
    return {
      id: h.id,
      name: h.name,
      streak: h.streak,
      completedToday: !!todayCompletion,
      weekCompletions,
    };
  });

  const habitsCompleted = habitsFormatted.filter((h) => h.completedToday).length;
  const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);
  const totalCompletionsThisWeek = habitsFormatted.reduce(
    (sum, h) => sum + h.weekCompletions.filter((w) => w.done).length,
    0
  );
  const possibleCompletionsThisWeek = habits.length * 7;
  const weeklyConsistency =
    possibleCompletionsThisWeek > 0
      ? Math.round((totalCompletionsThisWeek / possibleCompletionsThisWeek) * 100)
      : 0;

  // --- GOALS ---
  const goalsCompleted = goals.filter((g) => g.completed).length;

  // --- LIFE SCORE ---
  const lifeScore = calculateLifeScore(
    habitsCompleted,
    habits.length,
    totalSpent,
    user.budget,
    maxStreak,
    goalsCompleted,
    goals.length
  );

  // --- SMART INSIGHTS ---
  const insights: { type: "warning" | "success" | "info" | "tip"; message: string }[] = [];

  const budgetUsed = user.budget > 0 ? totalSpent / user.budget : 0;

  // Budget insights
  if (budgetUsed > 1.0) {
    insights.push({
      type: "warning",
      message: `🚨 You've exceeded your budget by ${Math.round((budgetUsed - 1) * 100)}%! Try to avoid unnecessary expenses for the rest of the month.`,
    });
  } else if (budgetUsed > 0.9) {
    insights.push({
      type: "warning",
      message: `⚠️ You've used ${Math.round(budgetUsed * 100)}% of your budget with ${daysRemaining} days left. Be careful with spending.`,
    });
  } else if (budgetUsed > 0.7) {
    insights.push({
      type: "info",
      message: `💡 ${Math.round(budgetUsed * 100)}% budget used. You can spend ~₹${Math.round(dailyBudgetRemaining)}/day for the remaining ${daysRemaining} days.`,
    });
  } else if (budgetUsed < 0.4 && user.budget > 0 && totalSpent > 0) {
    insights.push({
      type: "success",
      message: `🎉 Amazing! Only ${Math.round(budgetUsed * 100)}% budget used. You're saving well this month!`,
    });
  }

  // Today's spending insight
  if (todaySpent > dailyBudgetRemaining * 2 && dailyBudgetRemaining > 0) {
    insights.push({
      type: "warning",
      message: `📊 You spent ₹${Math.round(todaySpent)} today — that's more than double your daily budget of ₹${Math.round(dailyBudgetRemaining)}.`,
    });
  }

  // Top spending category
  if (categoryBreakdown.length > 0 && categoryBreakdown[0].percent > 40) {
    insights.push({
      type: "tip",
      message: `💸 ${categoryBreakdown[0].percent}% of your spending is on ${categoryBreakdown[0].category}. Consider cutting back in this area.`,
    });
  }

  // Habit insights
  if (habits.length > 0 && habitsCompleted === habits.length) {
    insights.push({
      type: "success",
      message: "🔥 All habits completed today! You're unstoppable!",
    });
  } else if (habits.length > 0 && habitsCompleted === 0) {
    insights.push({
      type: "info",
      message: "👋 No habits done yet today. Start with just one — momentum builds!",
    });
  } else if (habits.length > 0 && habitsCompleted > 0) {
    const remaining = habits.length - habitsCompleted;
    insights.push({
      type: "info",
      message: `💪 ${habitsCompleted} done, ${remaining} to go. Keep pushing!`,
    });
  }

  // Streak insights
  if (maxStreak >= 30) {
    insights.push({
      type: "success",
      message: `🏆 Incredible! ${maxStreak}-day streak! You've built a real habit.`,
    });
  } else if (maxStreak >= 7) {
    insights.push({
      type: "success",
      message: `🔥 ${maxStreak}-day streak! Keep going — 21 days makes a habit!`,
    });
  }

  // Weekly consistency
  if (weeklyConsistency >= 80) {
    insights.push({
      type: "success",
      message: `📈 ${weeklyConsistency}% weekly consistency — you're in the top tier!`,
    });
  } else if (weeklyConsistency < 40 && weeklyConsistency > 0) {
    insights.push({
      type: "tip",
      message: `📉 Only ${weeklyConsistency}% consistency this week. Try setting reminders for your habits.`,
    });
  }

  // Savings insight
  if (user.income > 0 && user.budget > 0) {
    const projectedSavings = user.income - totalSpent;
    if (projectedSavings > 0) {
      insights.push({
        type: "success",
        message: `💰 At this rate, you'll save ~₹${Math.round(projectedSavings).toLocaleString()} this month!`,
      });
    }
  }

  return NextResponse.json({
    user: {
      name: user.name,
      income: user.income,
      budget: user.budget,
      isPremium: user.isPremium,
    },
    habits: habitsFormatted,
    expenses: expenses.slice(0, 10),
    goals: goals.map((g) => ({
      id: g.id,
      title: g.title,
      completed: g.completed,
    })),
    // Money stats
    totalSpent,
    todaySpent,
    dailyBudgetRemaining: Math.round(dailyBudgetRemaining),
    daysRemaining,
    categoryBreakdown,
    categoryDetails,
    spendingByDay,
    // Habit stats
    habitsCompleted,
    totalHabits: habits.length,
    maxStreak,
    weeklyConsistency,
    // Goals stats
    goalsCompleted,
    totalGoals: goals.length,
    // Score
    lifeScore,
    insights: insights.slice(0, 5),

    // Premium-only: Smart predictions
    predictions: user.isPremium ? {
      budgetRunsOutDate: (() => {
        if (totalSpent === 0 || daysRemaining <= 0) return null;
        const today = new Date();
        const dayOfMonth = today.getDate();
        const dailyAvg = totalSpent / dayOfMonth;
        const daysUntilBudgetGone = dailyAvg > 0 ? Math.floor(user.budget / dailyAvg) : 999;
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        if (daysUntilBudgetGone < lastDay) {
          const runOutDate = new Date(today.getFullYear(), today.getMonth(), daysUntilBudgetGone);
          return runOutDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
        }
        return null;
      })(),
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
      topSpendingDay: (() => {
        let maxDay = { date: "", total: 0 };
        for (const day of spendingByDay) {
          if (day.total > maxDay.total) maxDay = day;
        }
        return maxDay;
      })(),
      avgDailySpend: (() => {
        const today = new Date();
        const dayOfMonth = today.getDate();
        return dayOfMonth > 0 ? Math.round(totalSpent / dayOfMonth) : 0;
      })(),
    } : null,

    // Achievements
    achievements: (() => {
      const list: { icon: string; title: string; unlocked: boolean; desc: string }[] = [];
      list.push({ icon: "🌱", title: "First Step", unlocked: totalSpent > 0 || habitsCompleted > 0, desc: "Start tracking your life" });
      list.push({ icon: "🔥", title: "3-Day Streak", unlocked: maxStreak >= 3, desc: "Complete habits 3 days in a row" });
      list.push({ icon: "💪", title: "Week Warrior", unlocked: maxStreak >= 7, desc: "7-day habit streak" });
      list.push({ icon: "🏆", title: "Month Master", unlocked: maxStreak >= 30, desc: "30-day streak" });
      list.push({ icon: "💰", title: "Saver", unlocked: user.budget > 0 && totalSpent < user.budget * 0.5, desc: "Stay under 50% budget" });
      list.push({ icon: "🎯", title: "Goal Crusher", unlocked: goalsCompleted > 0, desc: "Complete your first goal" });
      list.push({ icon: "⭐", title: "Perfect Day", unlocked: habitsCompleted === habits.length && habits.length > 0, desc: "Complete all habits in a day" });
      list.push({ icon: "📊", title: "Life Score 80+", unlocked: lifeScore >= 80, desc: "Reach 80+ life score" });
      return list;
    })(),
  });
}
