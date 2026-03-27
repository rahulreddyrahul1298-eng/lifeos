"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, getGreeting, getDayName, getCategoryEmoji } from "@/lib/utils";
import ProgressRing from "@/components/ui/ProgressRing";
import DashboardSkeleton from "@/components/ui/Skeleton";
import Toast from "@/components/ui/Toast";

// ── Types ──
interface WeekDay { date: string; done: boolean }
interface Habit { id: string; name: string; streak: number; completedToday: boolean; weekCompletions: WeekDay[] }
interface Expense { id: string; title: string; amount: number; category: string; date: string }
interface Goal { id: string; title: string; completed: boolean }
interface CategoryDetail { category: string; spent: number; limit: number; percent: number; exceeded: boolean; remaining: number; expenses: { id: string; title: string; amount: number; date: string }[] }
interface SpendingDay { date: string; total: number }
interface Insight { type: "warning" | "success" | "info" | "tip"; message: string }
interface Achievement { icon: string; title: string; unlocked: boolean; desc: string }
interface Predictions { budgetRunsOutDate: string | null; projectedMonthEnd: number; projectedSavings: number; topSpendingDay: { date: string; total: number }; avgDailySpend: number }
interface DashboardData {
  user: { name: string; income: number; budget: number; isPremium: boolean };
  habits: Habit[]; expenses: Expense[]; goals: Goal[];
  totalSpent: number; todaySpent: number; dailyBudgetRemaining: number; daysRemaining: number;
  categoryBreakdown: { category: string; total: number; percent: number }[];
  categoryDetails: CategoryDetail[]; spendingByDay: SpendingDay[];
  habitsCompleted: number; totalHabits: number; maxStreak: number; weeklyConsistency: number;
  goalsCompleted: number; totalGoals: number; lifeScore: number; insights: Insight[];
  predictions: Predictions | null; achievements: Achievement[];
}

// ── Quick Categories ──
const QUICK_CATEGORIES = [
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

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"home" | "money" | "habits" | "goals">("home");
  const [toast, setToast] = useState<{ message: string; icon: string } | null>(null);

  // Form states
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Food");
  const [newHabit, setNewHabit] = useState("");
  const [newGoal, setNewGoal] = useState("");

  // Money tab
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [showBudgetSetup, setShowBudgetSetup] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState("Food");
  const [budgetLimit, setBudgetLimit] = useState("");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickAmount, setQuickAmount] = useState("");
  const [quickCategory, setQuickCategory] = useState("");
  const [showQuickAmount, setShowQuickAmount] = useState(false);

  // Home tab
  const [showAchievements, setShowAchievements] = useState(false);
  const [eveningMood, setEveningMood] = useState<string | null>(null);

  // ── Data fetching ──
  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.status === 401) { router.push("/auth"); return; }
      setData(await res.json());
    } catch { console.error("Failed"); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // ── Actions ──
  const toggleHabit = async (habitId: string) => {
    if (!data) return;
    const habit = data.habits.find(h => h.id === habitId);
    const wasCompleted = habit?.completedToday;
    setData({ ...data, habits: data.habits.map(h => h.id === habitId ? { ...h, completedToday: !h.completedToday } : h) });

    await fetch("/api/habits/toggle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ habitId }) });
    const res = await fetch("/api/dashboard");
    if (res.ok) {
      const newData = await res.json();
      setData(newData);

      if (!wasCompleted && habit) {
        const newStreak = (habit.streak || 0) + 1;
        if ([3, 7, 14, 21, 30].includes(newStreak)) {
          setToast({ message: `${newStreak}-day streak! Keep it up!`, icon: "🔥" });
        }
        if (newData.habitsCompleted === newData.totalHabits && newData.totalHabits > 0) {
          setToast({ message: "Perfect day! All habits complete!", icon: "⭐" });
        }
      }
    }
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

  const submitQuickExpense = async () => {
    if (!quickAmount || parseFloat(quickAmount) <= 0) return;
    await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: quickTitle, amount: quickAmount, category: quickCategory }) });
    setQuickTitle(""); setQuickAmount(""); setQuickCategory(""); setShowQuickAmount(false);
    setToast({ message: `₹${quickAmount} added to ${quickCategory}`, icon: "✅" });
    fetchDashboard();
  };

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
    await fetch("/api/category-budgets", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: budgetCategory, limit: budgetLimit }) });
    setBudgetLimit(""); setShowBudgetSetup(false); fetchDashboard();
  };

  const handleLogout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); };

  // ── Loading state ──
  if (loading) return <DashboardSkeleton />;
  if (!data) return null;

  const isPremium = data.user.isPremium;
  const budgetPercent = data.user.budget > 0 ? Math.min(100, (data.totalSpent / data.user.budget) * 100) : 0;
  const budgetBarColor = budgetPercent > 90 ? "bg-red-500" : budgetPercent > 70 ? "bg-amber-500" : "bg-green-500";
  const savingsThisMonth = data.user.income - data.totalSpent;
  const maxDaySpend = Math.max(...data.spendingByDay.map(d => d.total), 1);
  const hour = new Date().getHours();
  const incompleteHabits = data.habits.filter(h => !h.completedToday);
  const todayFormatted = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });

  const insightBorder = (type: string) => {
    if (type === "warning") return "border-l-red-400 bg-red-50/50";
    if (type === "success") return "border-l-green-400 bg-green-50/50";
    if (type === "tip") return "border-l-amber-400 bg-amber-50/50";
    return "border-l-indigo-400 bg-indigo-50/50";
  };
  const insightText = (type: string) => {
    if (type === "warning") return "text-red-700";
    if (type === "success") return "text-green-700";
    if (type === "tip") return "text-amber-700";
    return "text-indigo-700";
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24">
      {/* Toast */}
      {toast && <Toast message={toast.message} icon={toast.icon} onClose={() => setToast(null)} />}

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">Life<span className="text-indigo-500">OS</span></span>
          <div className="flex items-center gap-2.5">
            {isPremium ? (
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md tracking-wide">PRO</span>
            ) : (
              <button onClick={() => router.push("/pricing")}
                className="text-[11px] px-3 py-1.5 rounded-lg font-semibold bg-indigo-500 text-white hover:bg-indigo-600 transition-all active:scale-95">
                Upgrade
              </button>
            )}
            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-5 space-y-4">

        {/* ════════════ HOME TAB ════════════ */}
        {activeTab === "home" && (
          <div className="space-y-4 animate-fade-in">
            {/* Greeting + Life Score */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{getGreeting()}, {data.user.name || "Friend"}</h1>
                <p className="text-sm text-gray-400 mt-0.5">{todayFormatted}</p>
              </div>
              <ProgressRing score={data.lifeScore} size={64} strokeWidth={5} />
            </div>

            {/* ── Hero Card (Time-aware) ── */}
            <div className="card p-5 border-l-3 border-l-indigo-500">
              {hour < 12 && data.habitsCompleted === 0 ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🌅</span>
                    <span className="text-sm font-semibold text-gray-900">Start Your Day</span>
                  </div>
                  <div className="space-y-2">
                    {incompleteHabits.slice(0, 3).map(h => (
                      <button key={h.id} onClick={() => toggleHabit(h.id)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-indigo-200 transition-all active:scale-[0.98] text-left">
                        <div className="w-6 h-6 rounded-full border-2 border-gray-200 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{h.name}</span>
                      </button>
                    ))}
                  </div>
                  {data.user.budget > 0 && (
                    <p className="text-xs text-gray-400 mt-3">Today&apos;s budget: <span className="font-semibold text-gray-600">{formatCurrency(data.dailyBudgetRemaining)}</span></p>
                  )}
                </>
              ) : hour >= 19 ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🌙</span>
                    <span className="text-sm font-semibold text-gray-900">Reflect on Today</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center p-2 rounded-lg bg-gray-50">
                      <div className="text-sm font-bold text-gray-900">{data.habitsCompleted}/{data.totalHabits}</div>
                      <div className="text-[10px] text-gray-400">Habits</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-gray-50">
                      <div className="text-sm font-bold text-red-500">{formatCurrency(data.todaySpent)}</div>
                      <div className="text-[10px] text-gray-400">Spent</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-gray-50">
                      <div className={`text-sm font-bold ${savingsThisMonth >= 0 ? "text-green-600" : "text-red-500"}`}>{formatCurrency(Math.abs(savingsThisMonth))}</div>
                      <div className="text-[10px] text-gray-400">{savingsThisMonth >= 0 ? "Saved" : "Over"}</div>
                    </div>
                  </div>
                  {!eveningMood && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">How was your day?</p>
                      <div className="flex gap-2">
                        {[{ emoji: "😊", label: "Great" }, { emoji: "😐", label: "Okay" }, { emoji: "😓", label: "Tough" }].map(m => (
                          <button key={m.label} onClick={() => { setEveningMood(m.label); setToast({ message: `Logged: ${m.label} day`, icon: m.emoji }); }}
                            className="flex-1 p-2.5 rounded-lg border border-gray-100 hover:border-indigo-200 text-center transition-all active:scale-95">
                            <div className="text-xl">{m.emoji}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5">{m.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {eveningMood && (
                    <p className="text-sm text-gray-500">Today was <span className="font-medium text-gray-700">{eveningMood.toLowerCase()}</span>. Rest well! 💤</p>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">⚡</span>
                    <span className="text-sm font-semibold text-gray-900">Keep Going</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-indigo-500 h-2 rounded-full transition-all duration-700"
                          style={{ width: `${data.totalHabits > 0 ? (data.habitsCompleted / data.totalHabits) * 100 : 0}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">{data.habitsCompleted}/{data.totalHabits} habits done &middot; {formatCurrency(data.todaySpent)} spent today</p>
                    </div>
                  </div>
                  {incompleteHabits.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {incompleteHabits.slice(0, 2).map(h => (
                        <button key={h.id} onClick={() => toggleHabit(h.id)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-all active:scale-[0.98] text-left">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{h.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-3.5 text-center">
                <div className={`text-base font-bold ${data.todaySpent > data.dailyBudgetRemaining ? "text-red-500" : "text-gray-900"}`}>
                  {formatCurrency(data.todaySpent)}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">Spent Today</div>
              </div>
              <div className="card p-3.5 text-center">
                <div className="text-base font-bold text-gray-900">{data.habitsCompleted}/{data.totalHabits}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Habits Done</div>
              </div>
              <div className="card p-3.5 text-center">
                <div className={`text-base font-bold ${data.dailyBudgetRemaining > 0 ? "text-green-600" : "text-red-500"}`}>
                  {formatCurrency(data.dailyBudgetRemaining)}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">Budget Left</div>
              </div>
            </div>

            {/* AI Insights (max 2) */}
            {data.insights.length > 0 && (
              <div className="space-y-2">
                {data.insights.slice(0, isPremium ? 2 : 1).map((insight, i) => (
                  <div key={i} className={`card border-l-[3px] p-4 ${insightBorder(insight.type)}`}
                    style={{ animationDelay: `${i * 100}ms` }}>
                    <p className={`text-sm leading-relaxed ${insightText(insight.type)}`}>{insight.message}</p>
                  </div>
                ))}
                {!isPremium && data.insights.length > 1 && (
                  <button onClick={() => router.push("/pricing")}
                    className="card p-4 w-full text-center hover:shadow-card-hover transition-all">
                    <p className="text-sm font-medium text-gray-900">{data.insights.length - 1} more insights available</p>
                    <p className="text-xs text-gray-400 mt-0.5">Upgrade for personalized daily tips</p>
                  </button>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setActiveTab("money")}
                className="card p-4 text-left hover:shadow-card-hover transition-all active:scale-[0.98]">
                <span className="text-xl">💰</span>
                <p className="text-sm font-medium text-gray-900 mt-1.5">Add Expense</p>
                <p className="text-[10px] text-gray-400">Quick log spending</p>
              </button>
              <button onClick={() => setActiveTab("habits")}
                className="card p-4 text-left hover:shadow-card-hover transition-all active:scale-[0.98]">
                <span className="text-xl">✅</span>
                <p className="text-sm font-medium text-gray-900 mt-1.5">Track Habits</p>
                <p className="text-[10px] text-gray-400">{incompleteHabits.length} remaining</p>
              </button>
              <button onClick={() => setActiveTab("goals")}
                className="card p-4 text-left hover:shadow-card-hover transition-all active:scale-[0.98]">
                <span className="text-xl">🎯</span>
                <p className="text-sm font-medium text-gray-900 mt-1.5">View Goals</p>
                <p className="text-[10px] text-gray-400">{data.goalsCompleted}/{data.totalGoals} done</p>
              </button>
              <button onClick={() => setActiveTab("money")}
                className="card p-4 text-left hover:shadow-card-hover transition-all active:scale-[0.98]">
                <span className="text-xl">📊</span>
                <p className="text-sm font-medium text-gray-900 mt-1.5">View Budget</p>
                <p className="text-[10px] text-gray-400">{Math.round(budgetPercent)}% used</p>
              </button>
            </div>

            {/* Premium Predictions */}
            {isPremium && data.predictions && (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-gray-900">Predictions</span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold">PRO</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-[10px] text-gray-400 mb-1">Avg. Daily</div>
                    <div className="text-sm font-bold text-gray-900">{formatCurrency(data.predictions.avgDailySpend)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-[10px] text-gray-400 mb-1">Month-End</div>
                    <div className="text-sm font-bold text-gray-900">{formatCurrency(data.predictions.projectedMonthEnd)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-[10px] text-gray-400 mb-1">Savings</div>
                    <div className={`text-sm font-bold ${data.predictions.projectedSavings >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {data.predictions.projectedSavings >= 0 ? formatCurrency(data.predictions.projectedSavings) : `-${formatCurrency(Math.abs(data.predictions.projectedSavings))}`}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-[10px] text-gray-400 mb-1">Status</div>
                    <div className={`text-sm font-bold ${data.predictions.budgetRunsOutDate ? "text-red-500" : "text-green-600"}`}>
                      {data.predictions.budgetRunsOutDate || "On Track"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Achievements (collapsed) */}
            {data.achievements && (
              <div className="card overflow-hidden">
                <button onClick={() => setShowAchievements(!showAchievements)}
                  className="w-full p-4 flex items-center justify-between text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">Achievements</span>
                    <span className="text-xs text-gray-400">{data.achievements.filter(a => a.unlocked).length}/{data.achievements.length}</span>
                  </div>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${showAchievements ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showAchievements && (
                  <div className="px-4 pb-4 grid grid-cols-4 gap-2 animate-fade-in">
                    {data.achievements.map((ach, i) => (
                      <div key={i} className={`rounded-lg p-2 text-center transition-all ${
                        ach.unlocked ? "bg-white border border-gray-200" : "bg-gray-50 border border-gray-100 opacity-35"}`}>
                        <div className={`text-xl ${!ach.unlocked ? "grayscale" : ""}`}>{ach.icon}</div>
                        <div className="text-[8px] font-medium text-gray-600 mt-0.5 leading-tight">{ach.title}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Upgrade */}
            {!isPremium && (
              <button onClick={() => router.push("/pricing")}
                className="card w-full p-4 flex items-center justify-between hover:shadow-card-hover transition-all active:scale-[0.98] text-left">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Unlock Premium</p>
                  <p className="text-xs text-gray-400 mt-0.5">Charts, predictions, unlimited habits & more</p>
                </div>
                <span className="text-xs font-bold text-white bg-indigo-500 px-3 py-1.5 rounded-lg">&#8377;99/mo</span>
              </button>
            )}

            {isPremium && savingsThisMonth > 0 && (
              <div className="card p-4 border-l-[3px] border-l-green-400 bg-green-50/30">
                <p className="text-sm font-medium text-green-700">Saving {formatCurrency(savingsThisMonth)} this month</p>
                <p className="text-xs text-green-600/70 mt-0.5">That&apos;s {formatCurrency(savingsThisMonth * 12)}/year if you keep this up</p>
              </div>
            )}
          </div>
        )}

        {/* ════════════ MONEY TAB ════════════ */}
        {activeTab === "money" && (
          <div className="space-y-4 animate-fade-in">
            {openCategory ? (
              <>
                {(() => {
                  const cat = data.categoryDetails?.find(c => c.category === openCategory);
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
                          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl border border-gray-100">
                            {getCategoryEmoji(cat.category)}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{cat.category}</div>
                            <div className="text-xs text-gray-400">{cat.limit > 0 ? `Budget: ${formatCurrency(cat.limit)}` : "No budget set"}</div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${cat.exceeded ? "text-red-500" : "text-gray-900"}`}>{formatCurrency(cat.spent)}</div>
                          </div>
                        </div>
                        {cat.limit > 0 && (
                          <>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full transition-all duration-700 ${cat.exceeded ? "bg-red-500" : cat.percent > 70 ? "bg-amber-500" : "bg-green-500"}`}
                                style={{ width: `${Math.min(cat.percent, 100)}%` }} />
                            </div>
                            <div className="flex justify-between mt-1.5">
                              <span className={`text-xs font-medium ${cat.exceeded ? "text-red-500" : "text-green-600"}`}>
                                {cat.exceeded ? `Over by ${formatCurrency(cat.spent - cat.limit)}` : `${formatCurrency(cat.remaining)} remaining`}
                              </span>
                              <span className="text-xs text-gray-400">{cat.percent}%</span>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="card p-5">
                        <h3 className="font-semibold text-sm text-gray-900 mb-3">{cat.category} Expenses ({cat.expenses.length})</h3>
                        <div className="space-y-2">
                          {cat.expenses.length === 0 ? (
                            <p className="text-center py-6 text-sm text-gray-400">No {cat.category.toLowerCase()} expenses this month</p>
                          ) : cat.expenses.map(exp => (
                            <div key={exp.id} className="flex items-center justify-between rounded-lg px-3 py-2.5 border border-gray-100 hover:border-gray-200 transition-colors">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{exp.title}</div>
                                <div className="text-xs text-gray-400">{exp.date}</div>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <span className="text-sm font-semibold text-red-500">-{formatCurrency(exp.amount)}</span>
                                <button onClick={() => deleteExpense(exp.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="card p-5">
                        <h3 className="font-semibold text-sm text-gray-900 mb-3">Add {cat.category} Expense</h3>
                        <div className="flex gap-2">
                          <input type="text" value={expenseTitle} onChange={e => setExpenseTitle(e.target.value)}
                            placeholder={`What ${cat.category.toLowerCase()} expense?`} className="input-field flex-1" />
                          <div className="relative w-24">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">&#8377;</span>
                            <input type="number" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)}
                              placeholder="Amt" className="input-field pl-7" />
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
                {/* Budget Overview */}
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-900">Budget</h2>
                    <button onClick={() => setShowBudgetSetup(!showBudgetSetup)}
                      className="text-xs text-indigo-500 font-medium hover:underline">Set Limits</button>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">Spent: <span className="text-gray-900 font-bold">{formatCurrency(data.totalSpent)}</span></span>
                      <span className="text-gray-500">of <span className="text-gray-900 font-bold">{formatCurrency(data.user.budget)}</span></span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`${budgetBarColor} h-2 rounded-full transition-all duration-1000`} style={{ width: `${Math.min(budgetPercent, 100)}%` }} />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-gray-400">{formatCurrency(Math.max(0, data.user.budget - data.totalSpent))} left</span>
                      <span className="text-xs text-gray-400">{data.daysRemaining}d &middot; {formatCurrency(data.dailyBudgetRemaining)}/day</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-50">
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-900">{formatCurrency(data.user.income)}</div>
                      <div className="text-[10px] text-gray-400">Income</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-900">{formatCurrency(data.dailyBudgetRemaining)}</div>
                      <div className="text-[10px] text-gray-400">Per Day</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-bold ${savingsThisMonth >= 0 ? "text-green-600" : "text-red-500"}`}>{formatCurrency(Math.abs(savingsThisMonth))}</div>
                      <div className="text-[10px] text-gray-400">{savingsThisMonth >= 0 ? "Saved" : "Over"}</div>
                    </div>
                  </div>
                </div>

                {/* Category Budget Setup */}
                {showBudgetSetup && !isPremium && (
                  <div className="card p-5 text-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">🔒</div>
                    <p className="font-medium text-gray-900 text-sm mb-1">Category Budgets</p>
                    <p className="text-xs text-gray-500 mb-3">Set limits per category and get alerts.</p>
                    <button onClick={() => router.push("/pricing")} className="btn-primary px-5 py-2 text-xs">Unlock with Premium</button>
                  </div>
                )}
                {showBudgetSetup && isPremium && (
                  <div className="card p-5 space-y-3">
                    <h3 className="font-semibold text-sm text-gray-900">Set Category Budget</h3>
                    <div className="flex gap-2">
                      <select value={budgetCategory} onChange={e => setBudgetCategory(e.target.value)} className="input-field w-auto">
                        {["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Education", "Other"].map(c => (
                          <option key={c} value={c}>{getCategoryEmoji(c)} {c}</option>
                        ))}
                      </select>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">&#8377;</span>
                        <input type="number" value={budgetLimit} onChange={e => setBudgetLimit(e.target.value)}
                          placeholder="Monthly limit" className="input-field pl-7" onKeyDown={e => e.key === "Enter" && saveCategoryBudget()} />
                      </div>
                      <button onClick={saveCategoryBudget} className="btn-primary px-4 py-2 text-sm">Set</button>
                    </div>
                  </div>
                )}

                {/* Category Cards */}
                <div className="card p-5">
                  <h3 className="font-semibold text-sm text-gray-900 mb-3">Categories</h3>
                  <div className="space-y-2">
                    {(data.categoryDetails && data.categoryDetails.length > 0) ? (
                      data.categoryDetails.map((cat, i) => (
                        <button key={i} onClick={() => isPremium ? setOpenCategory(cat.category) : router.push("/pricing")}
                          className="w-full text-left border border-gray-100 rounded-xl p-3.5 hover:border-gray-200 transition-all active:scale-[0.99]">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">{getCategoryEmoji(cat.category)}</span>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{cat.category}</div>
                                <div className="text-[10px] text-gray-400">{cat.expenses.length} expense{cat.expenses.length !== 1 ? "s" : ""}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-bold ${cat.exceeded ? "text-red-500" : "text-gray-900"}`}>{formatCurrency(cat.spent)}</div>
                              {cat.limit > 0 && <div className="text-[10px] text-gray-400">of {formatCurrency(cat.limit)}</div>}
                            </div>
                          </div>
                          {cat.limit > 0 && (
                            <div className="w-full bg-gray-100 rounded-full h-1">
                              <div className={`h-1 rounded-full transition-all ${cat.exceeded ? "bg-red-500" : cat.percent > 70 ? "bg-amber-500" : "bg-green-500"}`}
                                style={{ width: `${Math.min(cat.percent, 100)}%` }} />
                            </div>
                          )}
                        </button>
                      ))
                    ) : (
                      <p className="text-center py-6 text-sm text-gray-400">No expenses yet. Add your first one below.</p>
                    )}
                  </div>
                </div>

                {/* Quick Add Expense */}
                <div className="card p-5">
                  <h3 className="font-semibold text-sm text-gray-900 mb-3">Add Expense</h3>
                  {!showQuickAmount ? (
                    <>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {QUICK_CATEGORIES.map((qc, i) => (
                          <button key={i} onClick={() => { setQuickTitle(qc.title); setQuickCategory(qc.category); setQuickAmount(""); setShowQuickAmount(true); }}
                            className="border border-gray-100 rounded-xl p-2.5 text-center hover:border-indigo-200 hover:bg-indigo-50/30 transition-all active:scale-95 group">
                            <div className="text-lg">{qc.icon}</div>
                            <div className="text-[10px] font-medium text-gray-500 group-hover:text-indigo-600 mt-0.5 leading-tight">{qc.title}</div>
                          </button>
                        ))}
                      </div>
                      <button onClick={() => setShowExpenseForm(!showExpenseForm)}
                        className="w-full text-xs text-gray-400 hover:text-gray-600 py-2 transition-colors">
                        {showExpenseForm ? "Close" : "Or enter manually"}
                      </button>
                    </>
                  ) : (
                    <div className="space-y-3 animate-fade-in">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-xs text-gray-400">Adding</div>
                        <div className="text-base font-bold text-gray-900 mt-0.5">{quickTitle}</div>
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">&#8377;</span>
                        <input type="number" value={quickAmount} onChange={e => setQuickAmount(e.target.value)}
                          placeholder="0" className="input-field pl-8 text-2xl font-bold text-center py-4"
                          autoFocus onKeyDown={e => e.key === "Enter" && submitQuickExpense()} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={submitQuickExpense} disabled={!quickAmount || parseFloat(quickAmount) <= 0}
                          className="flex-1 btn-primary py-3 text-sm font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform">Add Expense</button>
                        <button onClick={() => { setShowQuickAmount(false); setQuickTitle(""); setQuickAmount(""); }}
                          className="btn-outline px-4 py-3 text-sm">Back</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom Form */}
                {showExpenseForm && !showQuickAmount && (
                  <form onSubmit={addExpense} className="card p-5 space-y-3 animate-fade-in">
                    <h3 className="font-semibold text-sm text-gray-900">Custom Expense</h3>
                    <input type="text" value={expenseTitle} onChange={e => setExpenseTitle(e.target.value)}
                      placeholder="What did you spend on?" className="input-field" required autoFocus />
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">&#8377;</span>
                        <input type="number" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)}
                          placeholder="Amount" className="input-field pl-7" required />
                      </div>
                      <select value={expenseCategory} onChange={e => setExpenseCategory(e.target.value)} className="input-field w-auto">
                        {["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Education", "Other"].map(c => (
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

                {/* 7-Day Chart */}
                <div className="card p-5 relative">
                  <h3 className="font-semibold text-sm mb-4 text-gray-900">Last 7 Days</h3>
                  {!isPremium && (
                    <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center">
                      <span className="text-2xl mb-2">📊</span>
                      <p className="text-sm font-medium text-gray-900">Spending Charts</p>
                      <p className="text-xs text-gray-500 mb-3">Premium feature</p>
                      <button onClick={() => router.push("/pricing")} className="btn-primary px-4 py-1.5 text-xs">Upgrade</button>
                    </div>
                  )}
                  <div className={`flex items-end gap-2 h-28 ${!isPremium ? "blur-sm" : ""}`}>
                    {data.spendingByDay.map((day, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] text-gray-400">{day.total > 0 ? `₹${day.total}` : ""}</span>
                        <div className={`w-full rounded-md transition-all duration-700 ${day.total > 0 ? "bg-indigo-400" : "bg-gray-100"}`}
                          style={{ height: `${day.total > 0 ? Math.max(8, (day.total / maxDaySpend) * 72) : 4}px` }} />
                        <span className="text-[9px] text-gray-400">{getDayName(day.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Expenses */}
                <div className="card p-5">
                  <h3 className="font-semibold text-sm mb-3 text-gray-900">Recent Expenses</h3>
                  <div className="space-y-1.5">
                    {data.expenses.length === 0 ? (
                      <p className="text-center py-8 text-sm text-gray-400">No expenses yet</p>
                    ) : data.expenses.map(exp => (
                      <div key={exp.id} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{getCategoryEmoji(exp.category)}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{exp.title}</div>
                            <div className="text-[10px] text-gray-400">{exp.category} &middot; {exp.date}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-semibold text-red-500">-{formatCurrency(exp.amount)}</span>
                          <button onClick={() => deleteExpense(exp.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ════════════ HABITS TAB ════════════ */}
        {activeTab === "habits" && (
          <div className="space-y-4 animate-fade-in">
            {/* Habits Header + Progress */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Habits</h2>
                <button onClick={() => setShowHabitForm(!showHabitForm)}
                  className="btn-primary text-xs px-3.5 py-1.5 active:scale-95 transition-transform">+ Add</button>
              </div>
              {/* Progress ring */}
              <div className="flex items-center gap-4 mb-3">
                <div className="relative w-14 h-14 flex-shrink-0">
                  <svg className="-rotate-90" width="56" height="56" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" stroke="#F3F4F6" strokeWidth="4" fill="none" />
                    <circle cx="28" cy="28" r="24" stroke="#6366F1" strokeWidth="4" fill="none"
                      strokeDasharray={`${data.totalHabits > 0 ? (data.habitsCompleted / data.totalHabits) * 150.8 : 0} 150.8`}
                      strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.7s ease" }} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-900">{data.habitsCompleted}/{data.totalHabits}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 flex-1">
                  <div>
                    <div className="text-sm font-bold text-gray-900">{data.maxStreak}d</div>
                    <div className="text-[10px] text-gray-400">Best Streak</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{data.weeklyConsistency}%</div>
                    <div className="text-[10px] text-gray-400">This Week</div>
                  </div>
                </div>
              </div>
              {!isPremium && data.totalHabits >= 3 && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-gray-900">Habit limit reached (3/3)</p>
                    <p className="text-[10px] text-gray-500">Upgrade for unlimited</p>
                  </div>
                  <button onClick={() => router.push("/pricing")} className="btn-primary px-3 py-1 text-xs">Upgrade</button>
                </div>
              )}
            </div>

            {showHabitForm && (
              <form onSubmit={addHabit} className="card p-4 flex gap-2 animate-fade-in">
                <input type="text" value={newHabit} onChange={e => setNewHabit(e.target.value)}
                  placeholder="New habit name..." className="input-field flex-1" required autoFocus />
                <button type="submit" className="btn-primary px-5 py-2.5 text-sm">Add</button>
              </form>
            )}

            {/* Perfect Day Banner */}
            {data.habitsCompleted === data.totalHabits && data.totalHabits > 0 && (
              <div className="card p-4 bg-green-50 border-green-100 text-center animate-fade-in">
                <span className="text-2xl">⭐</span>
                <p className="text-sm font-semibold text-green-700 mt-1">Perfect Day!</p>
                <p className="text-xs text-green-600">All habits complete. Keep the momentum!</p>
              </div>
            )}

            {/* Habits List - Incomplete first */}
            <div className="space-y-2.5">
              {data.habits.length === 0 ? (
                <div className="card p-8 text-center text-sm text-gray-400">No habits yet. Add your first habit to start building streaks.</div>
              ) : (
                [...data.habits].sort((a, b) => Number(a.completedToday) - Number(b.completedToday)).map(habit => (
                  <div key={habit.id} className="card p-4">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleHabit(habit.id)}
                          className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${
                            habit.completedToday ? "bg-green-500 border-green-500 text-white scale-100" : "border-gray-200 hover:border-indigo-300"}`}>
                          {habit.completedToday && (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <div>
                          <span className={`text-sm font-medium ${habit.completedToday ? "text-gray-400 line-through" : "text-gray-900"}`}>{habit.name}</span>
                          {habit.streak > 0 && <span className="ml-2 text-[10px] text-orange-500 font-semibold">🔥 {habit.streak}d</span>}
                        </div>
                      </div>
                      <button onClick={() => deleteHabit(habit.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    {/* Weekly Calendar */}
                    {isPremium ? (
                      <div className="flex gap-1.5">
                        {habit.weekCompletions.map((day, i) => (
                          <div key={i} className="flex-1 text-center">
                            <div className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                              day.done ? "bg-green-50 text-green-600 border border-green-200" : "bg-gray-50 text-gray-300 border border-gray-100"}`}>
                              {day.done ? "✓" : "·"}
                            </div>
                            <div className="text-[8px] text-gray-400 mt-0.5">{getDayName(day.date)}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="flex gap-1.5 blur-[3px] opacity-40">
                          {habit.weekCompletions.map((day, i) => (
                            <div key={i} className="flex-1 text-center">
                              <div className="w-full aspect-square rounded-lg bg-gray-100 border border-gray-100" />
                              <div className="text-[8px] text-gray-400 mt-0.5">{getDayName(day.date)}</div>
                            </div>
                          ))}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <button onClick={() => router.push("/pricing")}
                            className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:shadow transition-all active:scale-95">
                            Unlock Weekly View
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ════════════ GOALS TAB ════════════ */}
        {activeTab === "goals" && (
          <div className="space-y-4 animate-fade-in">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Goals</h2>
                <button onClick={() => setShowGoalForm(!showGoalForm)}
                  className="btn-primary text-xs px-3.5 py-1.5 active:scale-95 transition-transform">+ Add</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <div className="text-lg font-bold text-green-600">{data.goalsCompleted}/{data.totalGoals}</div>
                  <div className="text-[10px] text-green-700/70 font-medium">Completed</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <div className="text-lg font-bold text-gray-900">{data.totalGoals - data.goalsCompleted}</div>
                  <div className="text-[10px] text-gray-500 font-medium">In Progress</div>
                </div>
              </div>
              {!isPremium && data.totalGoals >= 2 && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mt-3">
                  <div>
                    <p className="text-xs font-medium text-gray-900">Goal limit reached (2/2)</p>
                    <p className="text-[10px] text-gray-500">Upgrade for unlimited</p>
                  </div>
                  <button onClick={() => router.push("/pricing")} className="btn-primary px-3 py-1 text-xs">Upgrade</button>
                </div>
              )}
            </div>

            {showGoalForm && (
              <form onSubmit={addGoal} className="card p-4 flex gap-2 animate-fade-in">
                <input type="text" value={newGoal} onChange={e => setNewGoal(e.target.value)}
                  placeholder="e.g. Save ₹10,000 this month" className="input-field flex-1" required autoFocus />
                <button type="submit" className="btn-primary px-5 py-2.5 text-sm">Add</button>
              </form>
            )}

            <div className="space-y-2">
              {data.goals.length === 0 ? (
                <div className="card p-8 text-center text-sm text-gray-400">No goals yet. What do you want to achieve?</div>
              ) : (
                [...data.goals].sort((a, b) => Number(a.completed) - Number(b.completed)).map(goal => (
                  <div key={goal.id} className="card px-4 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleGoal(goal.id, goal.completed)}
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${
                          goal.completed ? "bg-green-500 border-green-500 text-white" : "border-gray-200 hover:border-indigo-300"}`}>
                        {goal.completed && (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <span className={`text-sm ${goal.completed ? "text-gray-400 line-through" : "text-gray-900 font-medium"}`}>{goal.title}</span>
                    </div>
                    <button onClick={() => deleteGoal(goal.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Bottom Navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-around py-1.5 px-2">
          {([
            { id: "home" as const, label: "Home", icon: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" },
            { id: "money" as const, label: "Money", icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
            { id: "habits" as const, label: "Habits", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
            { id: "goals" as const, label: "Goals", icon: "M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all active:scale-90 ${
                activeTab === tab.id ? "text-indigo-500" : "text-gray-400"}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeTab === tab.id ? 2 : 1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
              </svg>
              <span className={`text-[10px] ${activeTab === tab.id ? "font-semibold" : "font-medium"}`}>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
