export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export function getMonthString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Get last 7 days as array of date strings
export function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

// Get day name from date string
export function getDayName(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

// Days remaining in current month
export function getDaysRemainingInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
}

// Daily budget remaining
export function getDailyBudgetRemaining(budget: number, spent: number): number {
  const daysLeft = getDaysRemainingInMonth();
  if (daysLeft <= 0) return 0;
  return Math.max(0, (budget - spent) / daysLeft);
}

// Calculate spending by category
export function groupByCategory(
  expenses: { category: string; amount: number }[]
): { category: string; total: number; percent: number }[] {
  const map: Record<string, number> = {};
  let grandTotal = 0;
  for (const e of expenses) {
    map[e.category] = (map[e.category] || 0) + e.amount;
    grandTotal += e.amount;
  }
  return Object.entries(map)
    .map(([category, total]) => ({
      category,
      total,
      percent: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

// Improved Life Score (weighted)
export function calculateLifeScore(
  habitsCompleted: number,
  totalHabits: number,
  spent: number,
  budget: number,
  maxStreak: number,
  goalsCompleted: number,
  totalGoals: number
): number {
  // Habit consistency: 35%
  const habitScore =
    totalHabits > 0 ? (habitsCompleted / totalHabits) * 35 : 17;

  // Budget health: 30%
  let budgetScore = 15;
  if (budget > 0) {
    const ratio = spent / budget;
    if (ratio <= 0.5) budgetScore = 30;
    else if (ratio <= 0.7) budgetScore = 25;
    else if (ratio <= 0.9) budgetScore = 20;
    else if (ratio <= 1.0) budgetScore = 10;
    else budgetScore = 5;
  }

  // Streak bonus: 20%
  let streakScore = 0;
  if (maxStreak >= 30) streakScore = 20;
  else if (maxStreak >= 14) streakScore = 15;
  else if (maxStreak >= 7) streakScore = 12;
  else if (maxStreak >= 3) streakScore = 8;
  else if (maxStreak >= 1) streakScore = 4;

  // Goals: 15%
  const goalScore =
    totalGoals > 0 ? (goalsCompleted / totalGoals) * 15 : 7;

  return Math.round(
    Math.min(100, habitScore + budgetScore + streakScore + goalScore)
  );
}

// Category emoji map
export function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    Food: "🍔",
    Transport: "🚗",
    Shopping: "🛍️",
    Bills: "📄",
    Entertainment: "🎬",
    Health: "💊",
    Education: "📚",
    Other: "📦",
  };
  return map[category] || "📦";
}
