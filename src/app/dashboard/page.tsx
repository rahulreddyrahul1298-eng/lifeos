"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, getGreeting, getDayName, getCategoryEmoji } from "@/lib/utils";

interface WeekDay { date: string; done: boolean; }
interface Habit { id: string; name: string; streak: number; completedToday: boolean; weekCompletions: WeekDay[]; }
interface Expense { id: string; title: string; amount: number; category: string; date: string; }
interface Goal { id: string; title: string; completed: boolean; }
interface CategoryBreakdown { category: string; total: number; percent: number; }
interface CategoryDetail {
  category: string; spent: number; limit: number; percent: number;
  exceeded: boolean; remaining: number;
  expenses: { id: string; title: string; amount: number; date: string }[];
}
interface SpendingDay { date: string; total: number; }
interface Insight { type: "warning" | "success" | "info" | "tip"; message: string; }
interface Achievement { icon: string; title: string; unlocked: boolean; desc: string; }
interface Predictions {
  budgetRunsOutDate: string | null; projectedMonthEnd: number;
  projectedSavings: number; topSpendingDay: { date: string; total: number };
  avgDailySpend: number;
}
interface DashboardData {
  user: { name: string; income: number; budget: number; isPremium: boolean };
  habits: Habit[]; expenses: Expense[]; goals: Goal[];
  totalSpent: number; todaySpent: number; dailyBudgetRemaining: number; daysRemaining: number;
  categoryBreakdown: CategoryBreakdown[]; categoryDetails: CategoryDetail[]; spendingByDay: SpendingDay[];
  habitsCompleted: number; totalHabits: number; maxStreak: number; weeklyConsistency: number;
  goalsCompleted: number; totalGoals: number; lifeScore: number; insights: Insight[];
  predictions: Predictions | null; achievements: Achievement[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"home" | "money" | "habits" | "goals">("home");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Food");
  const [newHabit, setNewHabit] = useState("");
  const [newGoal, setNewGoal] = useState("");

  // Category views
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [showBudgetSetup, setShowBudgetSetup] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState("Food");
  const [budgetLimit, setBudgetLimit] = useState("");

  // Quick category presets — user enters their own amount
  const quickCategories = [
    { icon: "☕", title: "Tea/Coffee", category: "Food" },
    { icon: "🍔", title: "Lunch/Dinner", category: "Food" },
    { icon: "🛒", title: "Groceries", category: "Shopping" },
    { icon: "🚗", title: "Auto/Cab", category: "Transport" },
    { icon: "⛽", title: "Petrol", category: "Transport" },
    { icon: "📄", title: "Bills", category: "Bills" },
    { icon: "🎬", title: "Entertainment", category: "Entertainment" },
    { icon: "💊", title: "Medical", category: "Health" },
    { icon: "👕", title: "Shopping", category: "Shopping" },
    { icon: "📚", title: "Education", category: "Education" },
    { icon: "🍕", title: "Snacks", category: "Food" },
    { icon: "📦", title: "Other", category: "Other" },
  ];

  // Quick add state
  const [quickTitle, setQuickTitle] = useState("");
  const [quickAmount, setQuickAmount] = useState("");
  const [quickCategory, setQuickCategory] = useState("");
  const [showQuickAmount, setShowQuickAmount] = useState(false);

  const selectQuickCategory = (title: string, category: string) => {
    setQuickTitle(title);
    setQuickCategory(category);
    setQuickAmount("");
    setShowQuickAmount(true);
  };

  const submitQuickExpense = async () => {
    if (!quickAmount || parseFloat(quickAmount) <= 0) return;
    await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: quickTitle, amount: quickAmount, category: quickCategory }),
    });
    setQuickTitle("");
    setQuickAmount("");
    setQuickCategory("");
    setShowQuickAmount(false);
    fetchDashboard();
  };

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.status === 401) { router.push("/auth"); return; }
      setData(await res.json());
    } catch { console.error("Failed"); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const toggleHabit = async (habitId: string) => {
    if (data) {
      setData({ ...data, habits: data.habits.map((h) => h.id === habitId ? { ...h, completedToday: !h.completedToday } : h) });
    }
    await fetch("/api/habits/toggle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ habitId }) });
    fetchDashboard();
  };

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount) return;
    await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: expenseTitle, amount: expenseAmount, category: expenseCategory }) });
    setExpenseTitle(""); setExpenseAmount(""); setExpenseCategory("Food"); setShowExpenseForm(false);
    fetchDashboard();
  };

  const deleteExpense = async (id: string) => { await fetch(`/api/expenses?id=${id}`, { method: "DELETE" }); fetchDashboard(); };

  const addHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit) return;
    const res = await fetch("/api/habits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newHabit }) });
    if (res.status === 403) { const d = await res.json(); alert(d.error); return; }
    setNewHabit(""); setShowHabitForm(false); fetchDashboard();
  };

  const deleteHabit = async (id: string) => { await fetch(`/api/habits?id=${id}`, { method: "DELETE" }); fetchDashboard(); };

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal) return;
    if (!data?.user.isPremium && data && data.totalGoals >= 2) {
      alert("Free plan limited to 2 goals. Upgrade to Premium for unlimited goals!"); return;
    }
    await fetch("/api/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newGoal }) });
    setNewGoal(""); setShowGoalForm(false); fetchDashboard();
  };

  const toggleGoal = async (id: string, completed: boolean) => {
    await fetch("/api/goals", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, completed: !completed }) });
    fetchDashboard();
  };

  const deleteGoal = async (id: string) => { await fetch(`/api/goals?id=${id}`, { method: "DELETE" }); fetchDashboard(); };

  const saveCategoryBudget = async () => {
    if (!budgetLimit || parseFloat(budgetLimit) <= 0) return;
    await fetch("/api/category-budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: budgetCategory, limit: budgetLimit }),
    });
    setBudgetLimit("");
    setShowBudgetSetup(false);
    fetchDashboard();
  };

  const handleLogout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }
  if (!data) return null;

  const isPremium = data.user.isPremium;
  const budgetPercent = data.user.budget > 0 ? Math.min(100, (data.totalSpent / data.user.budget) * 100) : 0;
  const budgetBarColor = budgetPercent > 90 ? "bg-red-500" : budgetPercent > 70 ? "bg-amber-500" : "bg-green-500";
  const savingsThisMonth = data.user.income - data.totalSpent;
  const maxDaySpend = Math.max(...data.spendingByDay.map((d) => d.total), 1);

  // Insight border color by type
  const insightBorder = (type: string) => {
    if (type === "warning") return "border-l-red-500 text-red-700";
    if (type === "success") return "border-l-green-500 text-green-700";
    if (type === "tip") return "border-l-amber-500 text-amber-700";
    return "border-l-indigo-500 text-indigo-700";
  };

  // Premium lock overlay
  const PremiumLock = ({ feature, height = "h-40" }: { feature: string; height?: string }) => (
    <div className={`relative ${height} overflow-hidden rounded-xl`}>
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-900">{feature}</span>
        <span className="text-xs text-gray-500 mt-0.5 mb-3">Premium feature</span>
        <button onClick={() => router.push("/pricing")}
          className="btn-primary px-5 py-2 text-xs">
          Upgrade
        </button>
      </div>
    </div>
  );

  // Free user limit banner
  const FreeLimitBanner = ({ current, max, feature }: { current: number; max: number; feature: string }) => (
    !isPremium && current >= max ? (
      <div className="card mt-3 p-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-900">{feature} limit reached ({current}/{max})</div>
          <div className="text-xs text-gray-500 mt-0.5">Upgrade for unlimited {feature.toLowerCase()}</div>
        </div>
        <button onClick={() => router.push("/pricing")}
          className="btn-primary px-3 py-1.5 text-xs flex-shrink-0 ml-3">Upgrade</button>
      </div>
    ) : null
  );

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-gray-900">Life<span className="text-indigo-500">OS</span></span>
            <span className="text-sm text-gray-500">{getGreeting()}, <span className="font-medium text-gray-700">{data.user.name || "Friend"}</span></span>
          </div>
          <div className="flex items-center gap-3">
            {isPremium ? (
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md">
                PRO
              </span>
            ) : (
              <button onClick={() => router.push("/pricing")}
                className="text-xs px-3 py-1.5 rounded-md font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-colors">
                Upgrade
              </button>
            )}
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Free user banner */}
      {!isPremium && (
        <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-2">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
            <span className="text-xs text-indigo-700">
              <button onClick={() => router.push("/pricing")} className="font-semibold hover:underline">Upgrade to Pro</button> for predictions, charts, unlimited habits & more
            </span>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-6 py-6 space-y-5">

        {/* ===== HOME TAB ===== */}
        {activeTab === "home" && (
          <>
            {/* Life Score + Quick Stats */}
            <div className="card p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative w-28 h-28 flex-shrink-0">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" stroke="#E5E7EB" strokeWidth="6" fill="none" />
                    <circle cx="60" cy="60" r="52"
                      stroke={data.lifeScore >= 70 ? "#22C55E" : data.lifeScore >= 40 ? "#F59E0B" : "#EF4444"}
                      strokeWidth="6" fill="none"
                      strokeDasharray={`${(data.lifeScore / 100) * 327} 327`}
                      strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">{data.lifeScore}</span>
                    <span className="text-[10px] text-gray-400 font-medium">Life Score</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 flex-1 w-full">
                  <div className="rounded-xl p-3 text-center border border-gray-200">
                    <div className="text-lg font-bold text-gray-900">{data.habitsCompleted}/{data.totalHabits}</div>
                    <div className="text-[10px] text-gray-500 font-medium">Habits Today</div>
                  </div>
                  <div className="rounded-xl p-3 text-center border border-gray-200">
                    <div className="text-lg font-bold text-gray-900">{data.maxStreak}d</div>
                    <div className="text-[10px] text-gray-500 font-medium">Best Streak</div>
                  </div>
                  <div className="rounded-xl p-3 text-center border border-gray-200">
                    <div className={`text-lg font-bold ${budgetPercent > 90 ? "text-red-500" : "text-gray-900"}`}>{Math.round(budgetPercent)}%</div>
                    <div className="text-[10px] text-gray-500 font-medium">Budget Used</div>
                  </div>
                  <div className="rounded-xl p-3 text-center border border-gray-200">
                    <div className="text-lg font-bold text-gray-900">{data.weeklyConsistency}%</div>
                    <div className="text-[10px] text-gray-500 font-medium">Weekly Consistency</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Insights */}
            {data.insights.length > 0 && (
              <div className="space-y-2">
                {isPremium && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-indigo-600">Premium Insights</span>
                  </div>
                )}
                {data.insights.slice(0, isPremium ? 5 : 1).map((insight, i) => (
                  <div key={i} className={`card border-l-2 p-4 text-sm ${insightBorder(insight.type)}`}>
                    {insight.message}
                  </div>
                ))}
                {!isPremium && data.insights.length > 1 && (
                  <div onClick={() => router.push("/pricing")}
                    className="card p-4 text-center cursor-pointer hover:shadow-md transition-all">
                    <div className="text-sm font-medium text-gray-900 mb-1">{data.insights.length - 1} more insight{data.insights.length - 1 > 1 ? "s" : ""} hidden</div>
                    <div className="text-xs text-gray-500">Premium members get personalized daily tips</div>
                    <div className="mt-2 inline-block btn-primary px-4 py-1.5 text-xs">Unlock All Insights</div>
                  </div>
                )}
              </div>
            )}

            {/* Premium: Daily Tip */}
            {isPremium && (
              <div className="card p-5 border-l-2 border-l-indigo-500">
                <div className="text-xs font-medium text-indigo-600 mb-1">Daily Tip</div>
                <div className="text-sm text-gray-600">
                  {data.dailyBudgetRemaining > 0
                    ? `You can spend up to ${formatCurrency(data.dailyBudgetRemaining)} today and still hit your savings goal.`
                    : "Try to avoid any spending today to get back on track with your budget."
                  }
                </div>
              </div>
            )}

            {/* Premium: Smart Predictions */}
            {isPremium && data.predictions && (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-semibold text-gray-900">Predictions</span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-medium">PRO</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-[10px] text-gray-400 mb-1">Avg. Daily Spend</div>
                    <div className="text-sm font-bold text-gray-900">{formatCurrency(data.predictions.avgDailySpend)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-[10px] text-gray-400 mb-1">Projected Month-End</div>
                    <div className="text-sm font-bold text-gray-900">{formatCurrency(data.predictions.projectedMonthEnd)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-[10px] text-gray-400 mb-1">Projected Savings</div>
                    <div className={`text-sm font-bold ${data.predictions.projectedSavings >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {data.predictions.projectedSavings >= 0 ? formatCurrency(data.predictions.projectedSavings) : `-${formatCurrency(Math.abs(data.predictions.projectedSavings))}`}
                    </div>
                  </div>
                  {data.predictions.budgetRunsOutDate && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-[10px] text-gray-400 mb-1">Budget Runs Out</div>
                      <div className="text-sm font-bold text-red-500">{data.predictions.budgetRunsOutDate}</div>
                    </div>
                  )}
                  {!data.predictions.budgetRunsOutDate && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-[10px] text-gray-400 mb-1">Budget Status</div>
                      <div className="text-sm font-bold text-green-600">On Track</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Free: Blurred predictions teaser */}
            {!isPremium && data.totalSpent > 0 && (
              <div className="card p-5 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-semibold text-gray-900">Predictions</span>
                </div>
                <div className="grid grid-cols-2 gap-3 blur-[4px]">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-[10px] text-gray-400 mb-1">Avg. Daily Spend</div>
                    <div className="text-sm font-bold text-gray-900">&#8377;1,234</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-[10px] text-gray-400 mb-1">Projected Month-End</div>
                    <div className="text-sm font-bold text-gray-900">&#8377;25,678</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-[10px] text-gray-400 mb-1">Projected Savings</div>
                    <div className="text-sm font-bold text-green-600">&#8377;12,345</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-[10px] text-gray-400 mb-1">Budget Runs Out</div>
                    <div className="text-sm font-bold text-red-500">Mar 25</div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white flex flex-col items-center justify-end pb-5">
                  <div className="text-sm font-medium text-gray-900 mb-1">Know where your money goes</div>
                  <div className="text-xs text-gray-500 mb-3">See predictions based on your spending data</div>
                  <button onClick={() => router.push("/pricing")} className="btn-primary px-6 py-2 text-xs">
                    Unlock Predictions
                  </button>
                </div>
              </div>
            )}

            {/* Achievements */}
            {data.achievements && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-gray-900">Achievements</span>
                  <span className="text-xs text-gray-400">
                    {data.achievements.filter((a) => a.unlocked).length}/{data.achievements.length} unlocked
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {data.achievements.map((ach, i) => (
                    <div key={i} className={`rounded-lg p-2.5 text-center border transition-all ${
                      ach.unlocked
                        ? "border-gray-200 bg-white"
                        : "border-gray-100 bg-gray-50 opacity-40"
                    }`}>
                      <div className={`text-2xl ${!ach.unlocked ? "grayscale" : ""}`}>{ach.icon}</div>
                      <div className="text-[9px] font-medium text-gray-700 mt-1 leading-tight">{ach.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Today Summary */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Today&apos;s Summary</h2>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-red-500">{formatCurrency(data.todaySpent)}</div>
                  <div className="text-xs text-gray-500 mt-1">Spent Today</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{formatCurrency(data.dailyBudgetRemaining)}</div>
                  <div className="text-xs text-gray-500 mt-1">Daily Budget</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${savingsThisMonth >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {formatCurrency(Math.abs(savingsThisMonth))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{savingsThisMonth >= 0 ? "Savings" : "Over Budget"}</div>
                </div>
              </div>
            </div>

            {/* Quick Add from Home */}
            <div className="card p-5">
              <h3 className="font-semibold text-sm text-gray-900 mb-3">Quick Add Expense</h3>
              {!showQuickAmount ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {quickCategories.slice(0, 6).map((qc, i) => (
                    <button key={i} onClick={() => { selectQuickCategory(qc.title, qc.category); setActiveTab("money"); }}
                      className="border border-gray-200 rounded-lg p-2.5 text-center hover:border-indigo-300 transition-all group">
                      <div className="text-lg">{qc.icon}</div>
                      <div className="text-[10px] font-medium text-gray-500 group-hover:text-indigo-600 mt-0.5">{qc.title}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-3 text-center text-sm text-gray-600">
                  Go to Money tab to enter the amount
                </div>
              )}
            </div>

            {/* Upgrade Banner -- Free users */}
            {!isPremium && (
              <div onClick={() => router.push("/pricing")}
                className="card overflow-hidden cursor-pointer hover:shadow-md transition-all">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">Upgrade to Premium</div>
                      <div className="text-gray-500 text-xs mt-1">Unlock charts, predictions, unlimited habits & more</div>
                    </div>
                    <span className="btn-primary px-4 py-2 text-sm font-medium">&#8377;99/mo</span>
                  </div>
                </div>
              </div>
            )}

            {/* Premium user: Savings summary */}
            {isPremium && savingsThisMonth > 0 && (
              <div className="card p-5 border-l-2 border-l-green-500">
                <div className="text-sm font-medium text-gray-900">You&apos;re saving {formatCurrency(savingsThisMonth)} this month</div>
                <div className="text-xs text-gray-500 mt-0.5">That&apos;s {formatCurrency(savingsThisMonth * 12)}/year if you keep this up</div>
              </div>
            )}
          </>
        )}

        {/* ===== MONEY TAB ===== */}
        {activeTab === "money" && (
          <>
            {/* Category Detail View */}
            {openCategory ? (
              <>
                {(() => {
                  const cat = data.categoryDetails?.find((c) => c.category === openCategory);
                  if (!cat) return null;
                  return (
                    <>
                      <div className="card p-5">
                        <button onClick={() => setOpenCategory(null)}
                          className="text-sm text-indigo-500 font-medium mb-4 hover:underline flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                          Back
                        </button>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-xl border border-gray-200">
                            {getCategoryEmoji(cat.category)}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 text-lg">{cat.category}</div>
                            <div className="text-xs text-gray-400">
                              {cat.limit > 0 ? `Budget: ${formatCurrency(cat.limit)}` : "No budget set"}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${cat.exceeded ? "text-red-500" : "text-gray-900"}`}>
                              {formatCurrency(cat.spent)}
                            </div>
                            <div className="text-xs text-gray-400">spent</div>
                          </div>
                        </div>

                        {cat.limit > 0 && (
                          <div className="mb-2">
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full transition-all duration-700 ${cat.exceeded ? "bg-red-500" : cat.percent > 70 ? "bg-amber-500" : "bg-green-500"}`}
                                style={{ width: `${Math.min(cat.percent, 100)}%` }} />
                            </div>
                            <div className="flex justify-between mt-1.5">
                              <span className={`text-xs font-medium ${cat.exceeded ? "text-red-500" : "text-green-600"}`}>
                                {cat.exceeded ? `Over by ${formatCurrency(cat.spent - cat.limit)}` : `${formatCurrency(cat.remaining)} remaining`}
                              </span>
                              <span className="text-xs text-gray-400">{cat.percent}% used</span>
                            </div>
                          </div>
                        )}

                        {cat.exceeded && (
                          <div className="border border-red-200 rounded-lg p-3 mt-3 text-sm text-red-600">
                            You&apos;ve exceeded your {cat.category} budget. Consider cutting back on {cat.category.toLowerCase()} expenses.
                          </div>
                        )}
                      </div>

                      {/* Expenses list */}
                      <div className="card p-5">
                        <h3 className="font-semibold text-sm text-gray-900 mb-3">
                          {cat.category} Expenses ({cat.expenses.length})
                        </h3>
                        <div className="space-y-2">
                          {cat.expenses.length === 0 ? (
                            <div className="text-center py-6 text-sm text-gray-400">No {cat.category.toLowerCase()} expenses this month</div>
                          ) : (
                            cat.expenses.map((exp) => (
                              <div key={exp.id} className="flex items-center justify-between rounded-lg px-4 py-3 border border-gray-200">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{exp.title}</div>
                                  <div className="text-xs text-gray-400">{exp.date}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-semibold text-red-500">-{formatCurrency(exp.amount)}</span>
                                  <button onClick={() => deleteExpense(exp.id)} className="text-gray-300 hover:text-red-500 text-xs transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Quick add to this category */}
                      <div className="card p-5">
                        <h3 className="font-semibold text-sm text-gray-900 mb-3">Add {cat.category} Expense</h3>
                        <div className="flex gap-2">
                          <input type="text" value={expenseTitle} onChange={(e) => setExpenseTitle(e.target.value)}
                            placeholder={`What ${cat.category.toLowerCase()} expense?`} className="input-field flex-1" />
                          <div className="relative w-28">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">&#8377;</span>
                            <input type="number" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)}
                              placeholder="Amount" className="input-field pl-7" />
                          </div>
                          <button onClick={async () => {
                            if (!expenseTitle || !expenseAmount) return;
                            await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ title: expenseTitle, amount: expenseAmount, category: cat.category }) });
                            setExpenseTitle(""); setExpenseAmount(""); fetchDashboard();
                          }} className="btn-primary px-4 py-2 text-sm">Add</button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </>
            ) : (
              <>
                {/* Main Budget Overview */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-900">Budget</h2>
                    <button onClick={() => setShowBudgetSetup(!showBudgetSetup)}
                      className="btn-outline text-xs px-3 py-1.5">Set Limits</button>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">Spent: <span className="text-gray-900 font-semibold">{formatCurrency(data.totalSpent)}</span></span>
                      <span className="text-gray-500">Budget: <span className="text-gray-900 font-semibold">{formatCurrency(data.user.budget)}</span></span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className={`${budgetBarColor} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${Math.min(budgetPercent, 100)}%` }} />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-gray-400">{formatCurrency(Math.max(0, data.user.budget - data.totalSpent))} remaining</span>
                      <span className="text-xs text-gray-400">{data.daysRemaining} days left &middot; {formatCurrency(data.dailyBudgetRemaining)}/day</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-900">{formatCurrency(data.user.income)}</div>
                      <div className="text-[10px] text-gray-500">Income</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-900">{formatCurrency(data.dailyBudgetRemaining)}</div>
                      <div className="text-[10px] text-gray-500">Per Day Left</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-bold ${savingsThisMonth >= 0 ? "text-green-600" : "text-red-500"}`}>{formatCurrency(Math.abs(savingsThisMonth))}</div>
                      <div className="text-[10px] text-gray-500">{savingsThisMonth >= 0 ? "Saved" : "Over"}</div>
                    </div>
                  </div>
                </div>

                {/* Set Category Budgets -- PREMIUM ONLY */}
                {showBudgetSetup && !isPremium && (
                  <div className="card p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="font-medium text-gray-900 mb-1">Category Budgets</div>
                    <div className="text-xs text-gray-500 mb-4">Set spending limits for each category and get warned when you overspend.</div>
                    <button onClick={() => router.push("/pricing")} className="btn-primary px-6 py-2.5 text-sm">Unlock with Premium</button>
                  </div>
                )}
                {showBudgetSetup && isPremium && (
                  <div className="card p-5 space-y-3">
                    <h3 className="font-semibold text-sm text-gray-900">Set Category Budget</h3>
                    <p className="text-xs text-gray-500">Set a monthly spending limit for each category.</p>
                    <div className="flex gap-2">
                      <select value={budgetCategory} onChange={(e) => setBudgetCategory(e.target.value)} className="input-field w-auto">
                        {["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Education", "Other"].map((c) => (
                          <option key={c} value={c}>{getCategoryEmoji(c)} {c}</option>
                        ))}
                      </select>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">&#8377;</span>
                        <input type="number" value={budgetLimit} onChange={(e) => setBudgetLimit(e.target.value)}
                          placeholder="Monthly limit" className="input-field pl-7"
                          onKeyDown={(e) => e.key === "Enter" && saveCategoryBudget()} />
                      </div>
                      <button onClick={saveCategoryBudget} className="btn-primary px-4 py-2 text-sm">Set</button>
                    </div>
                  </div>
                )}

                {/* Category Cards */}
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm text-gray-900">Categories</h3>
                    {isPremium && <span className="text-[10px] text-gray-400">Tap for details</span>}
                  </div>
                  <div className="space-y-2">
                    {(data.categoryDetails && data.categoryDetails.length > 0) ? (
                      data.categoryDetails.map((cat, i) => (
                        <button key={i} onClick={() => isPremium ? setOpenCategory(cat.category) : router.push("/pricing")}
                          className="w-full text-left border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg">{getCategoryEmoji(cat.category)}</span>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{cat.category}</div>
                                <div className="text-[10px] text-gray-400">
                                  {cat.expenses.length} expense{cat.expenses.length !== 1 ? "s" : ""}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-bold ${cat.exceeded ? "text-red-500" : "text-gray-900"}`}>
                                {formatCurrency(cat.spent)}
                              </div>
                              {cat.limit > 0 && (
                                <div className="text-[10px] text-gray-400">of {formatCurrency(cat.limit)}</div>
                              )}
                            </div>
                          </div>
                          {cat.limit > 0 && (
                            <div className="w-full bg-gray-100 rounded-full h-1">
                              <div className={`h-1 rounded-full transition-all ${cat.exceeded ? "bg-red-500" : cat.percent > 70 ? "bg-amber-500" : "bg-green-500"}`}
                                style={{ width: `${Math.min(cat.percent, 100)}%` }} />
                            </div>
                          )}
                          {cat.exceeded && (
                            <div className="mt-2 text-xs text-red-500 font-medium">Over budget by {formatCurrency(cat.spent - cat.limit)}</div>
                          )}
                          {cat.limit > 0 && !cat.exceeded && (
                            <div className="mt-1 text-[10px] text-green-600">{formatCurrency(cat.remaining)} remaining</div>
                          )}
                          {cat.limit === 0 && isPremium && (
                            <div className="mt-1 text-[10px] text-gray-400">No limit set</div>
                          )}
                          {!isPremium && (
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-[10px] text-indigo-500 font-medium">Tap to unlock details</span>
                              <span className="text-[10px] text-gray-300">&rarr;</span>
                            </div>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-6 text-sm text-gray-400">
                        No expenses yet. Add your first expense below.
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Add Expense */}
                <div className="card p-5">
                  <h3 className="font-semibold text-sm text-gray-900 mb-3">Add Expense</h3>
                  {!showQuickAmount ? (
                    <>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {quickCategories.map((qc, i) => (
                          <button key={i} onClick={() => selectQuickCategory(qc.title, qc.category)}
                            className="border border-gray-200 rounded-lg p-2.5 text-center hover:border-indigo-300 transition-all group">
                            <div className="text-xl">{qc.icon}</div>
                            <div className="text-[10px] font-medium text-gray-500 group-hover:text-indigo-600 mt-0.5 leading-tight">{qc.title}</div>
                          </button>
                        ))}
                      </div>
                      <button onClick={() => setShowExpenseForm(!showExpenseForm)}
                        className="w-full btn-outline py-2.5 text-xs font-medium">
                        {showExpenseForm ? "Close" : "Or enter manually"}
                      </button>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-sm text-gray-500">Adding expense for</div>
                        <div className="text-lg font-bold text-gray-900 mt-1">{quickTitle}</div>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 font-medium mb-1.5">How much did you spend?</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">&#8377;</span>
                          <input type="number" value={quickAmount} onChange={(e) => setQuickAmount(e.target.value)}
                            placeholder="Enter amount" className="input-field pl-8 text-xl font-semibold text-center"
                            autoFocus onKeyDown={(e) => e.key === "Enter" && submitQuickExpense()} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={submitQuickExpense} disabled={!quickAmount || parseFloat(quickAmount) <= 0}
                          className="flex-1 btn-primary py-3 text-sm disabled:opacity-40">Add Expense</button>
                        <button onClick={() => { setShowQuickAmount(false); setQuickTitle(""); setQuickAmount(""); }}
                          className="btn-outline px-4 py-3 text-sm">Back</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom Form */}
                {showExpenseForm && !showQuickAmount && (
                  <form onSubmit={addExpense} className="card p-5 space-y-3">
                    <h3 className="font-semibold text-sm text-gray-900">Custom Expense</h3>
                    <input type="text" value={expenseTitle} onChange={(e) => setExpenseTitle(e.target.value)}
                      placeholder="What did you spend on?" className="input-field" required autoFocus />
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">&#8377;</span>
                        <input type="number" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)}
                          placeholder="Amount" className="input-field pl-7" required />
                      </div>
                      <select value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)} className="input-field w-auto">
                        {["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Education", "Other"].map((c) => (
                          <option key={c} value={c}>{getCategoryEmoji(c)} {c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="btn-primary px-5 py-2.5 text-sm">Add Expense</button>
                      <button type="button" onClick={() => setShowExpenseForm(false)} className="text-sm text-gray-400 hover:text-gray-600 px-3">Cancel</button>
                    </div>
                  </form>
                )}

                {/* 7-Day Spending Chart -- PREMIUM */}
                <div className="card p-6 relative">
                  <h3 className="font-semibold text-sm mb-4 text-gray-900">Last 7 Days</h3>
                  {!isPremium && <PremiumLock feature="Spending Charts" />}
                  <div className={`flex items-end gap-2 h-32 ${!isPremium ? "blur-sm" : ""}`}>
                    {data.spendingByDay.map((day, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] text-gray-400">{day.total > 0 ? `₹${day.total}` : ""}</span>
                        <div className={`w-full rounded-t-md transition-all duration-500 ${day.total > 0 ? "bg-indigo-500" : "bg-gray-100"}`}
                          style={{ height: `${day.total > 0 ? Math.max(8, (day.total / maxDaySpend) * 80) : 4}px` }} />
                        <span className="text-[10px] text-gray-400">{getDayName(day.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Expenses */}
                <div className="card p-6">
                  <h3 className="font-semibold text-sm mb-4 text-gray-900">Recent Expenses</h3>
                  <div className="space-y-2">
                    {data.expenses.length === 0 ? (
                      <div className="text-center py-8 text-sm text-gray-400">No expenses yet. Add your first one above.</div>
                    ) : (
                      data.expenses.map((exp) => (
                        <div key={exp.id} className="flex items-center justify-between rounded-lg px-4 py-3 border border-gray-200">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{getCategoryEmoji(exp.category)}</span>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{exp.title}</div>
                              <div className="text-xs text-gray-400">{exp.category} &middot; {exp.date}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-red-500">-{formatCurrency(exp.amount)}</span>
                            <button onClick={() => deleteExpense(exp.id)} className="text-gray-300 hover:text-red-500 text-xs transition-colors">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ===== HABITS TAB ===== */}
        {activeTab === "habits" && (
          <>
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Habits</h2>
                <button onClick={() => setShowHabitForm(!showHabitForm)} className="btn-primary text-xs px-4 py-2">+ Add Habit</button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{data.habitsCompleted}/{data.totalHabits}</div>
                  <div className="text-[10px] text-gray-500 font-medium">Today</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{data.maxStreak}d</div>
                  <div className="text-[10px] text-gray-500 font-medium">Best Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{data.weeklyConsistency}%</div>
                  <div className="text-[10px] text-gray-500 font-medium">This Week</div>
                </div>
              </div>
              <FreeLimitBanner current={data.totalHabits} max={3} feature="Habits" />
            </div>

            {showHabitForm && (
              <form onSubmit={addHabit} className="card p-5 flex gap-2">
                <input type="text" value={newHabit} onChange={(e) => setNewHabit(e.target.value)}
                  placeholder="New habit name..." className="input-field flex-1" required autoFocus />
                <button type="submit" className="btn-primary px-5 py-3 text-sm">Add</button>
              </form>
            )}

            <div className="space-y-3">
              {data.habits.length === 0 ? (
                <div className="card p-8 text-center text-sm text-gray-400">No habits yet. Add your first habit to get started.</div>
              ) : (
                data.habits.map((habit) => (
                  <div key={habit.id} className="card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleHabit(habit.id)}
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                            habit.completedToday ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-indigo-400"}`}>
                          {habit.completedToday && (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <span className={`text-sm font-medium ${habit.completedToday ? "text-gray-400 line-through" : "text-gray-900"}`}>{habit.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {habit.streak > 0 && <span className="text-xs text-gray-500 font-medium">{habit.streak}d streak</span>}
                        <button onClick={() => deleteHabit(habit.id)} className="text-gray-300 hover:text-red-500 text-xs transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                    {/* Weekly Calendar */}
                    {isPremium ? (
                      <div className="flex gap-1.5">
                        {habit.weekCompletions.map((day, i) => (
                          <div key={i} className="flex-1 text-center">
                            <div className={`w-full aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-all ${
                              day.done ? "bg-green-50 text-green-600 border border-green-200" : "bg-gray-50 text-gray-300 border border-gray-100"}`}>
                              {day.done ? "✓" : "·"}
                            </div>
                            <div className="text-[9px] text-gray-400 mt-1">{getDayName(day.date)}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="flex gap-1.5 blur-[3px] opacity-50">
                          {habit.weekCompletions.map((day, i) => (
                            <div key={i} className="flex-1 text-center">
                              <div className="w-full aspect-square rounded-md flex items-center justify-center text-xs bg-gray-100 text-gray-300 border border-gray-100">·</div>
                              <div className="text-[9px] text-gray-400 mt-1">{getDayName(day.date)}</div>
                            </div>
                          ))}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <button onClick={() => router.push("/pricing")}
                            className="bg-white border border-gray-200 rounded-md px-4 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:shadow transition-all">
                            Unlock Weekly View
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ===== GOALS TAB ===== */}
        {activeTab === "goals" && (
          <>
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Goals</h2>
                <button onClick={() => setShowGoalForm(!showGoalForm)} className="btn-primary text-xs px-4 py-2">+ Add Goal</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{data.goalsCompleted}/{data.totalGoals}</div>
                  <div className="text-[10px] text-gray-500 font-medium">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{data.totalGoals - data.goalsCompleted}</div>
                  <div className="text-[10px] text-gray-500 font-medium">In Progress</div>
                </div>
              </div>
              <FreeLimitBanner current={data.totalGoals} max={2} feature="Goals" />
            </div>

            {showGoalForm && (
              <form onSubmit={addGoal} className="card p-5 flex gap-2">
                <input type="text" value={newGoal} onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="e.g. Save ₹10,000 this month" className="input-field flex-1" required autoFocus />
                <button type="submit" className="btn-primary px-5 py-3 text-sm">Add</button>
              </form>
            )}

            <div className="space-y-2">
              {data.goals.length === 0 ? (
                <div className="card p-8 text-center text-sm text-gray-400">No goals yet. What do you want to achieve?</div>
              ) : (
                data.goals.map((goal) => (
                  <div key={goal.id} className="card px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleGoal(goal.id, goal.completed)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          goal.completed ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-indigo-400"}`}>
                        {goal.completed && (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <span className={`text-sm ${goal.completed ? "text-gray-400 line-through" : "text-gray-900"}`}>{goal.title}</span>
                    </div>
                    <button onClick={() => deleteGoal(goal.id)} className="text-gray-300 hover:text-red-500 text-xs transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-around py-2">
          {[
            { id: "home" as const, label: "Home", icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            )},
            { id: "money" as const, label: "Money", icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )},
            { id: "habits" as const, label: "Habits", icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )},
            { id: "goals" as const, label: "Goals", icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
              </svg>
            )},
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-5 py-2 rounded-lg transition-all ${
                activeTab === tab.id ? "text-indigo-500" : "text-gray-400 hover:text-gray-600"}`}>
              {tab.icon}
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
