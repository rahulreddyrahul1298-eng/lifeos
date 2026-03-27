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

const QUICK_CATEGORIES = [
  { icon: "☕", title: "Tea/Coffee", category: "Food" },
  { icon: "🍔", title: "Lunch", category: "Food" },
  { icon: "🛒", title: "Groceries", category: "Shopping" },
  { icon: "🚗", title: "Auto/Cab", category: "Transport" },
  { icon: "⛽", title: "Petrol", category: "Transport" },
  { icon: "📄", title: "Bills", category: "Bills" },
  { icon: "🎬", title: "Movies", category: "Entertainment" },
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

  // Forms
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Food");
  const [newHabit, setNewHabit] = useState("");
  const [newGoal, setNewGoal] = useState("");

  // Money
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [showBudgetSetup, setShowBudgetSetup] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState("Food");
  const [budgetLimit, setBudgetLimit] = useState("");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickAmount, setQuickAmount] = useState("");
  const [quickCategory, setQuickCategory] = useState("");
  const [showQuickAmount, setShowQuickAmount] = useState(false);

  // Home
  const [showAchievements, setShowAchievements] = useState(false);
  const [eveningMood, setEveningMood] = useState<string | null>(null);
  const [startedDay, setStartedDay] = useState(false);

  // ── Fetch ──
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
      const nd = await res.json(); setData(nd);
      if (!wasCompleted && habit) {
        const ns = (habit.streak || 0) + 1;
        if ([3, 7, 14, 21, 30].includes(ns)) setToast({ message: `${ns}-day streak! Keep going!`, icon: "🔥" });
        if (nd.habitsCompleted === nd.totalHabits && nd.totalHabits > 0) setToast({ message: "Perfect day! All habits done!", icon: "⭐" });
      }
    }
  };
  const addExpense = async (e: React.FormEvent) => { e.preventDefault(); if (!expenseTitle || !expenseAmount) return; await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: expenseTitle, amount: expenseAmount, category: expenseCategory }) }); setExpenseTitle(""); setExpenseAmount(""); setExpenseCategory("Food"); setShowExpenseForm(false); fetchDashboard(); };
  const deleteExpense = async (id: string) => { await fetch(`/api/expenses?id=${id}`, { method: "DELETE" }); fetchDashboard(); };
  const submitQuickExpense = async () => { if (!quickAmount || parseFloat(quickAmount) <= 0) return; await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: quickTitle, amount: quickAmount, category: quickCategory }) }); setQuickTitle(""); setQuickAmount(""); setQuickCategory(""); setShowQuickAmount(false); setToast({ message: `₹${quickAmount} added`, icon: "✅" }); fetchDashboard(); };
  const addHabit = async (e: React.FormEvent) => { e.preventDefault(); if (!newHabit) return; const res = await fetch("/api/habits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newHabit }) }); if (res.status === 403) { const d = await res.json(); alert(d.error); return; } setNewHabit(""); setShowHabitForm(false); fetchDashboard(); };
  const deleteHabit = async (id: string) => { await fetch(`/api/habits?id=${id}`, { method: "DELETE" }); fetchDashboard(); };
  const addGoal = async (e: React.FormEvent) => { e.preventDefault(); if (!newGoal) return; if (!data?.user.isPremium && data && data.totalGoals >= 2) { alert("Free plan: 2 goals max. Upgrade for unlimited!"); return; } await fetch("/api/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newGoal }) }); setNewGoal(""); setShowGoalForm(false); fetchDashboard(); };
  const toggleGoal = async (id: string, completed: boolean) => { await fetch("/api/goals", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, completed: !completed }) }); fetchDashboard(); };
  const deleteGoal = async (id: string) => { await fetch(`/api/goals?id=${id}`, { method: "DELETE" }); fetchDashboard(); };
  const saveCategoryBudget = async () => { if (!budgetLimit || parseFloat(budgetLimit) <= 0) return; await fetch("/api/category-budgets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: budgetCategory, limit: budgetLimit }) }); setBudgetLimit(""); setShowBudgetSetup(false); fetchDashboard(); };
  const handleLogout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); };

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

  // Track % - how on-track user is today
  const habitPercent = data.totalHabits > 0 ? Math.round((data.habitsCompleted / data.totalHabits) * 100) : 0;
  const budgetOk = budgetPercent <= 100;
  const overallTrack = Math.round((habitPercent + (budgetOk ? 100 - budgetPercent : 0)) / 2);

  const insightColor = (type: string) => {
    if (type === "warning") return "border-l-red-400 bg-red-50/60";
    if (type === "success") return "border-l-green-400 bg-green-50/60";
    if (type === "tip") return "border-l-amber-400 bg-amber-50/60";
    return "border-l-blue-400 bg-blue-50/60";
  };
  const insightTextColor = (type: string) => {
    if (type === "warning") return "text-red-700";
    if (type === "success") return "text-green-700";
    if (type === "tip") return "text-amber-700";
    return "text-blue-700";
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {toast && <Toast message={toast.message} icon={toast.icon} onClose={() => setToast(null)} />}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-50">
        <div className="max-w-lg mx-auto px-5 py-2.5 flex items-center justify-between">
          <span className="text-base font-bold text-gray-900">Life<span className="text-indigo-500">OS</span></span>
          <div className="flex items-center gap-2">
            {isPremium ? (
              <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md tracking-wider">PRO</span>
            ) : (
              <button onClick={() => router.push("/pricing")} className="text-[10px] px-2.5 py-1 rounded-lg font-bold bg-indigo-500 text-white active:scale-95 transition-transform">Upgrade</button>
            )}
            <button onClick={handleLogout} className="text-[10px] text-gray-300 hover:text-gray-500 transition-colors">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-4 pb-2">

        {/* ═══════════════ HOME TAB ═══════════════ */}
        {activeTab === "home" && (
          <div className="space-y-4 animate-fade-in">

            {/* 1. HERO SECTION — highest priority */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-5 text-white">
              <div className="relative z-10">
                <p className="text-indigo-200 text-sm">{todayFormatted}</p>
                <h1 className="text-xl font-bold mt-1">{getGreeting()}, {data.user.name || "Friend"} 👋</h1>
                <p className="text-indigo-100 text-sm mt-1">
                  You&apos;re <span className="font-bold text-white">{overallTrack}%</span> on track today
                </p>

                <div className="w-full bg-white/20 rounded-full h-2 mt-3">
                  <div className="bg-white h-2 rounded-full transition-all duration-1000" style={{ width: `${overallTrack}%` }} />
                </div>

                {!startedDay && incompleteHabits.length > 0 && hour < 18 && (
                  <button onClick={() => setStartedDay(true)}
                    className="mt-4 bg-white text-indigo-600 font-bold text-sm px-6 py-2.5 rounded-xl active:scale-95 transition-transform shadow-lg">
                    Start Your Day →
                  </button>
                )}
              </div>
              {/* Decorative circle */}
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full" />
              <div className="absolute -right-2 -bottom-8 w-24 h-24 bg-white/5 rounded-full" />
            </div>

            {/* 2. LIFE SCORE — visual ring */}
            <div className="card p-4 flex items-center gap-4">
              <ProgressRing score={data.lifeScore} size={60} strokeWidth={5} />
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Life Score</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {data.lifeScore >= 70 ? "Great! Keep it up" : data.lifeScore >= 40 ? "Good. Room to improve" : "Let's work on this"}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-green-500">+{data.weeklyConsistency > 50 ? "5" : "2"}</div>
                <div className="text-[9px] text-gray-400">this week</div>
              </div>
            </div>

            {/* 3. AI INSIGHT — mandatory, actionable */}
            {data.insights.length > 0 && (
              <div className={`card border-l-[3px] p-4 ${insightColor(data.insights[0].type)}`}>
                <div className="flex items-start gap-2">
                  <span className="text-base mt-0.5">🤖</span>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">AI Insight</p>
                    <p className={`text-sm leading-relaxed ${insightTextColor(data.insights[0].type)}`}>{data.insights[0].message}</p>
                  </div>
                </div>
              </div>
            )}
            {isPremium && data.insights.length > 1 && (
              <div className={`card border-l-[3px] p-4 ${insightColor(data.insights[1].type)}`}>
                <p className={`text-sm leading-relaxed ${insightTextColor(data.insights[1].type)}`}>{data.insights[1].message}</p>
              </div>
            )}
            {!isPremium && data.insights.length > 1 && (
              <button onClick={() => router.push("/pricing")} className="card p-3 w-full text-center hover:shadow-md transition-all">
                <p className="text-xs font-semibold text-gray-900">{data.insights.length - 1} more AI insights</p>
                <p className="text-[10px] text-gray-400">Upgrade to unlock</p>
              </button>
            )}

            {/* 4. TODAY'S CHECKLIST — habits as tasks */}
            {(startedDay || data.habitsCompleted > 0) && data.habits.length > 0 && (
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-gray-900">Today&apos;s Tasks</p>
                  <span className="text-[10px] font-bold text-indigo-500">{data.habitsCompleted}/{data.totalHabits}</span>
                </div>
                <div className="space-y-2">
                  {data.habits.slice(0, 3).map(h => (
                    <button key={h.id} onClick={() => toggleHabit(h.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98] text-left ${
                        h.completedToday ? "bg-green-50 border border-green-100" : "bg-gray-50 border border-gray-100 hover:border-indigo-200"}`}>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        h.completedToday ? "bg-green-500 border-green-500 text-white" : "border-gray-300"}`}>
                        {h.completedToday && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className={`text-sm flex-1 ${h.completedToday ? "text-gray-400 line-through" : "text-gray-800 font-medium"}`}>{h.name}</span>
                      {h.streak > 0 && <span className="text-[9px] text-orange-500 font-bold">🔥{h.streak}d</span>}
                    </button>
                  ))}
                  {data.habits.length > 3 && (
                    <button onClick={() => setActiveTab("habits")} className="text-xs text-indigo-500 font-medium w-full text-center py-1">
                      +{data.habits.length - 3} more →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 5. QUICK ACTIONS — max 3 */}
            <div className="grid grid-cols-3 gap-2.5">
              <button onClick={() => { setActiveTab("money"); setShowQuickAmount(false); }}
                className="card p-3.5 text-center active:scale-95 transition-transform hover:shadow-md">
                <span className="text-xl block">💰</span>
                <span className="text-[10px] font-semibold text-gray-700 mt-1 block">Add Expense</span>
              </button>
              <button onClick={() => setActiveTab("habits")}
                className="card p-3.5 text-center active:scale-95 transition-transform hover:shadow-md">
                <span className="text-xl block">✅</span>
                <span className="text-[10px] font-semibold text-gray-700 mt-1 block">Log Habit</span>
              </button>
              <button onClick={() => setActiveTab("goals")}
                className="card p-3.5 text-center active:scale-95 transition-transform hover:shadow-md">
                <span className="text-xl block">🎯</span>
                <span className="text-[10px] font-semibold text-gray-700 mt-1 block">View Goals</span>
              </button>
            </div>

            {/* Today Summary — 3 key numbers */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="card p-3 text-center">
                <div className={`text-base font-bold ${data.todaySpent > data.dailyBudgetRemaining ? "text-red-500" : "text-gray-900"}`}>{formatCurrency(data.todaySpent)}</div>
                <div className="text-[9px] text-gray-400 mt-0.5">Spent Today</div>
              </div>
              <div className="card p-3 text-center">
                <div className={`text-base font-bold ${data.dailyBudgetRemaining > 0 ? "text-green-600" : "text-red-500"}`}>{formatCurrency(data.dailyBudgetRemaining)}</div>
                <div className="text-[9px] text-gray-400 mt-0.5">Can Spend</div>
              </div>
              <div className="card p-3 text-center">
                <div className="text-base font-bold text-gray-900">{data.maxStreak}d</div>
                <div className="text-[9px] text-gray-400 mt-0.5">Best Streak</div>
              </div>
            </div>

            {/* Evening Reflection */}
            {hour >= 19 && data.habitsCompleted > 0 && !eveningMood && (
              <div className="card p-4">
                <p className="text-sm font-bold text-gray-900 mb-2">How was today?</p>
                <div className="flex gap-2">
                  {[{ e: "😊", l: "Great" }, { e: "😐", l: "Okay" }, { e: "😓", l: "Tough" }].map(m => (
                    <button key={m.l} onClick={() => { setEveningMood(m.l); setToast({ message: `Logged: ${m.l}`, icon: m.e }); }}
                      className="flex-1 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 text-center active:scale-95 transition-all">
                      <div className="text-2xl">{m.e}</div>
                      <div className="text-[10px] text-gray-500 mt-1">{m.l}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Premium predictions */}
            {isPremium && data.predictions && (
              <div className="card p-4">
                <p className="text-sm font-bold text-gray-900 mb-2.5">Predictions <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-black">PRO</span></p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-xl p-3"><div className="text-[9px] text-gray-400">Avg Daily</div><div className="text-sm font-bold text-gray-900">{formatCurrency(data.predictions.avgDailySpend)}</div></div>
                  <div className="bg-gray-50 rounded-xl p-3"><div className="text-[9px] text-gray-400">Month-End</div><div className="text-sm font-bold text-gray-900">{formatCurrency(data.predictions.projectedMonthEnd)}</div></div>
                  <div className="bg-gray-50 rounded-xl p-3"><div className="text-[9px] text-gray-400">Savings</div><div className={`text-sm font-bold ${data.predictions.projectedSavings >= 0 ? "text-green-600" : "text-red-500"}`}>{formatCurrency(Math.abs(data.predictions.projectedSavings))}</div></div>
                  <div className="bg-gray-50 rounded-xl p-3"><div className="text-[9px] text-gray-400">Status</div><div className={`text-sm font-bold ${data.predictions.budgetRunsOutDate ? "text-red-500" : "text-green-600"}`}>{data.predictions.budgetRunsOutDate || "On Track ✓"}</div></div>
                </div>
              </div>
            )}

            {/* Achievements collapsed */}
            {data.achievements && (
              <div className="card overflow-hidden">
                <button onClick={() => setShowAchievements(!showAchievements)} className="w-full p-3.5 flex items-center justify-between text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">Achievements</span>
                    <span className="text-[10px] text-gray-400">{data.achievements.filter(a => a.unlocked).length}/{data.achievements.length}</span>
                  </div>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${showAchievements ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showAchievements && (
                  <div className="px-3.5 pb-3.5 grid grid-cols-4 gap-2 animate-fade-in">
                    {data.achievements.map((a, i) => (
                      <div key={i} className={`rounded-xl p-2 text-center ${a.unlocked ? "bg-white border border-gray-100" : "bg-gray-50 opacity-30"}`}>
                        <div className={`text-xl ${!a.unlocked ? "grayscale" : ""}`}>{a.icon}</div>
                        <div className="text-[7px] font-semibold text-gray-600 mt-0.5">{a.title}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Upgrade CTA */}
            {!isPremium && (
              <button onClick={() => router.push("/pricing")} className="card w-full p-4 flex items-center justify-between hover:shadow-md transition-all active:scale-[0.98] text-left">
                <div><p className="text-sm font-bold text-gray-900">Unlock Premium</p><p className="text-[10px] text-gray-400">AI insights, charts, unlimited habits</p></div>
                <span className="text-[10px] font-black text-white bg-indigo-500 px-3 py-1.5 rounded-lg">₹99/mo</span>
              </button>
            )}

            {isPremium && savingsThisMonth > 0 && (
              <div className="card p-3.5 border-l-[3px] border-l-green-400 bg-green-50/30">
                <p className="text-sm font-semibold text-green-700">Saving {formatCurrency(savingsThisMonth)} this month</p>
                <p className="text-[10px] text-green-600/70">= {formatCurrency(savingsThisMonth * 12)}/year</p>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ MONEY TAB ═══════════════ */}
        {activeTab === "money" && (
          <div className="space-y-4 animate-fade-in">
            {openCategory ? (
              <>
                {(() => {
                  const cat = data.categoryDetails?.find(c => c.category === openCategory);
                  if (!cat) return null;
                  return (<>
                    <div className="card p-5">
                      <button onClick={() => setOpenCategory(null)} className="text-xs text-indigo-500 font-semibold mb-3 flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>Back</button>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl border border-gray-100">{getCategoryEmoji(cat.category)}</div>
                        <div className="flex-1"><div className="font-bold text-gray-900">{cat.category}</div><div className="text-[10px] text-gray-400">{cat.limit > 0 ? `Budget: ${formatCurrency(cat.limit)}` : "No budget"}</div></div>
                        <div className={`text-lg font-bold ${cat.exceeded ? "text-red-500" : "text-gray-900"}`}>{formatCurrency(cat.spent)}</div>
                      </div>
                      {cat.limit > 0 && (<><div className="w-full bg-gray-100 rounded-full h-1.5"><div className={`h-1.5 rounded-full transition-all duration-700 ${cat.exceeded ? "bg-red-500" : cat.percent > 70 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${Math.min(cat.percent, 100)}%` }} /></div><div className="flex justify-between mt-1.5"><span className={`text-[10px] font-semibold ${cat.exceeded ? "text-red-500" : "text-green-600"}`}>{cat.exceeded ? `Over by ${formatCurrency(cat.spent - cat.limit)}` : `${formatCurrency(cat.remaining)} left`}</span><span className="text-[10px] text-gray-400">{cat.percent}%</span></div></>)}
                    </div>
                    <div className="card p-4">
                      <h3 className="font-bold text-sm text-gray-900 mb-2.5">Expenses ({cat.expenses.length})</h3>
                      <div className="space-y-1.5">
                        {cat.expenses.length === 0 ? <p className="text-center py-4 text-xs text-gray-400">None yet</p> : cat.expenses.map(exp => (
                          <div key={exp.id} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-50 hover:bg-gray-50 transition-colors">
                            <div><div className="text-sm font-medium text-gray-900">{exp.title}</div><div className="text-[10px] text-gray-400">{exp.date}</div></div>
                            <div className="flex items-center gap-2"><span className="text-sm font-bold text-red-500">-{formatCurrency(exp.amount)}</span><button onClick={() => deleteExpense(exp.id)} className="text-gray-300 hover:text-red-500 transition-colors"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="card p-4">
                      <h3 className="font-bold text-sm text-gray-900 mb-2">Add {cat.category} Expense</h3>
                      <div className="flex gap-2">
                        <input type="text" value={expenseTitle} onChange={e => setExpenseTitle(e.target.value)} placeholder="What?" className="input-field flex-1" />
                        <div className="relative w-20"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span><input type="number" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} placeholder="Amt" className="input-field pl-6" /></div>
                        <button onClick={async () => { if (!expenseTitle || !expenseAmount) return; await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: expenseTitle, amount: expenseAmount, category: cat.category }) }); setExpenseTitle(""); setExpenseAmount(""); fetchDashboard(); }} className="btn-primary px-3 py-2 text-xs">Add</button>
                      </div>
                    </div>
                  </>);
                })()}
              </>
            ) : (<>
              {/* Budget Overview */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3"><h2 className="font-bold text-gray-900">Budget</h2><button onClick={() => setShowBudgetSetup(!showBudgetSetup)} className="text-[10px] text-indigo-500 font-semibold">Set Limits</button></div>
                <div className="flex justify-between text-sm mb-2"><span className="text-gray-500">Spent: <b className="text-gray-900">{formatCurrency(data.totalSpent)}</b></span><span className="text-gray-500">of <b className="text-gray-900">{formatCurrency(data.user.budget)}</b></span></div>
                <div className="w-full bg-gray-100 rounded-full h-2.5"><div className={`${budgetBarColor} h-2.5 rounded-full transition-all duration-1000`} style={{ width: `${Math.min(budgetPercent, 100)}%` }} /></div>
                <div className="flex justify-between mt-2"><span className="text-[10px] text-gray-400">{formatCurrency(Math.max(0, data.user.budget - data.totalSpent))} left</span><span className="text-[10px] text-gray-400">{data.daysRemaining}d • {formatCurrency(data.dailyBudgetRemaining)}/day</span></div>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-50">
                  <div className="text-center"><div className="text-sm font-bold text-gray-900">{formatCurrency(data.user.income)}</div><div className="text-[9px] text-gray-400">Income</div></div>
                  <div className="text-center"><div className="text-sm font-bold text-gray-900">{formatCurrency(data.dailyBudgetRemaining)}</div><div className="text-[9px] text-gray-400">Per Day</div></div>
                  <div className="text-center"><div className={`text-sm font-bold ${savingsThisMonth >= 0 ? "text-green-600" : "text-red-500"}`}>{formatCurrency(Math.abs(savingsThisMonth))}</div><div className="text-[9px] text-gray-400">{savingsThisMonth >= 0 ? "Saved" : "Over"}</div></div>
                </div>
              </div>

              {showBudgetSetup && !isPremium && (<div className="card p-5 text-center"><span className="text-2xl block mb-2">🔒</span><p className="text-sm font-bold text-gray-900 mb-1">Category Budgets</p><p className="text-[10px] text-gray-500 mb-3">Set per-category limits</p><button onClick={() => router.push("/pricing")} className="btn-primary px-5 py-2 text-xs">Unlock Premium</button></div>)}
              {showBudgetSetup && isPremium && (<div className="card p-4 space-y-2"><h3 className="font-bold text-sm text-gray-900">Set Budget</h3><div className="flex gap-2"><select value={budgetCategory} onChange={e => setBudgetCategory(e.target.value)} className="input-field w-auto text-sm">{["Food","Transport","Shopping","Bills","Entertainment","Health","Education","Other"].map(c => <option key={c} value={c}>{getCategoryEmoji(c)} {c}</option>)}</select><div className="relative flex-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span><input type="number" value={budgetLimit} onChange={e => setBudgetLimit(e.target.value)} placeholder="Limit" className="input-field pl-6" onKeyDown={e => e.key === "Enter" && saveCategoryBudget()} /></div><button onClick={saveCategoryBudget} className="btn-primary px-3 py-2 text-xs">Set</button></div></div>)}

              {/* Categories */}
              <div className="card p-4">
                <h3 className="font-bold text-sm text-gray-900 mb-2.5">Categories</h3>
                <div className="space-y-1.5">
                  {data.categoryDetails && data.categoryDetails.length > 0 ? data.categoryDetails.map((cat, i) => (
                    <button key={i} onClick={() => isPremium ? setOpenCategory(cat.category) : router.push("/pricing")} className="w-full text-left border border-gray-50 rounded-xl p-3 hover:bg-gray-50 transition-all active:scale-[0.99]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><span className="text-base">{getCategoryEmoji(cat.category)}</span><div><div className="text-sm font-medium text-gray-900">{cat.category}</div><div className="text-[9px] text-gray-400">{cat.expenses.length} item{cat.expenses.length !== 1 ? "s" : ""}</div></div></div>
                        <div className="text-right"><div className={`text-sm font-bold ${cat.exceeded ? "text-red-500" : "text-gray-900"}`}>{formatCurrency(cat.spent)}</div>{cat.limit > 0 && <div className="text-[9px] text-gray-400">of {formatCurrency(cat.limit)}</div>}</div>
                      </div>
                      {cat.limit > 0 && <div className="w-full bg-gray-100 rounded-full h-1 mt-2"><div className={`h-1 rounded-full ${cat.exceeded ? "bg-red-500" : cat.percent > 70 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${Math.min(cat.percent, 100)}%` }} /></div>}
                    </button>
                  )) : <p className="text-center py-6 text-xs text-gray-400">No expenses yet</p>}
                </div>
              </div>

              {/* Quick Add */}
              <div className="card p-4">
                <h3 className="font-bold text-sm text-gray-900 mb-2.5">Add Expense</h3>
                {!showQuickAmount ? (<>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {QUICK_CATEGORIES.map((qc, i) => (
                      <button key={i} onClick={() => { setQuickTitle(qc.title); setQuickCategory(qc.category); setQuickAmount(""); setShowQuickAmount(true); }}
                        className="border border-gray-50 rounded-xl p-2 text-center hover:border-indigo-200 hover:bg-indigo-50/30 transition-all active:scale-95">
                        <div className="text-lg">{qc.icon}</div><div className="text-[9px] font-medium text-gray-500 mt-0.5">{qc.title}</div>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setShowExpenseForm(!showExpenseForm)} className="w-full text-[10px] text-gray-400 py-1">{showExpenseForm ? "Close" : "Or enter manually"}</button>
                </>) : (
                  <div className="space-y-3 animate-fade-in">
                    <div className="bg-gray-50 rounded-xl p-3 text-center"><div className="text-[10px] text-gray-400">Adding</div><div className="text-base font-bold text-gray-900">{quickTitle}</div></div>
                    <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span><input type="number" value={quickAmount} onChange={e => setQuickAmount(e.target.value)} placeholder="0" className="input-field pl-8 text-2xl font-bold text-center py-4" autoFocus onKeyDown={e => e.key === "Enter" && submitQuickExpense()} /></div>
                    <div className="flex gap-2"><button onClick={submitQuickExpense} disabled={!quickAmount || parseFloat(quickAmount) <= 0} className="flex-1 btn-primary py-3 text-sm font-bold disabled:opacity-30 active:scale-[0.98]">Add Expense</button><button onClick={() => { setShowQuickAmount(false); setQuickTitle(""); setQuickAmount(""); }} className="btn-outline px-4 py-3 text-sm">Back</button></div>
                  </div>
                )}
              </div>

              {showExpenseForm && !showQuickAmount && (
                <form onSubmit={addExpense} className="card p-4 space-y-2.5 animate-fade-in">
                  <input type="text" value={expenseTitle} onChange={e => setExpenseTitle(e.target.value)} placeholder="What?" className="input-field" required autoFocus />
                  <div className="flex gap-2"><div className="relative flex-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span><input type="number" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} placeholder="Amount" className="input-field pl-7" required /></div><select value={expenseCategory} onChange={e => setExpenseCategory(e.target.value)} className="input-field w-auto">{["Food","Transport","Shopping","Bills","Entertainment","Health","Education","Other"].map(c => <option key={c} value={c}>{getCategoryEmoji(c)} {c}</option>)}</select></div>
                  <button type="submit" className="btn-primary w-full py-2.5 text-sm">Add</button>
                </form>
              )}

              {/* 7-day chart */}
              <div className="card p-4 relative">
                <h3 className="font-bold text-sm mb-3 text-gray-900">Last 7 Days</h3>
                {!isPremium && <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center"><span className="text-xl mb-1">📊</span><p className="text-xs font-bold text-gray-900">Premium Feature</p><button onClick={() => router.push("/pricing")} className="btn-primary px-4 py-1.5 text-[10px] mt-2">Upgrade</button></div>}
                <div className={`flex items-end gap-1.5 h-24 ${!isPremium ? "blur-sm" : ""}`}>
                  {data.spendingByDay.map((day, i) => (<div key={i} className="flex-1 flex flex-col items-center gap-0.5"><span className="text-[8px] text-gray-400">{day.total > 0 ? `₹${day.total}` : ""}</span><div className={`w-full rounded-md transition-all duration-500 ${day.total > 0 ? "bg-indigo-400" : "bg-gray-100"}`} style={{ height: `${day.total > 0 ? Math.max(6, (day.total / maxDaySpend) * 64) : 3}px` }} /><span className="text-[8px] text-gray-400">{getDayName(day.date)}</span></div>))}
                </div>
              </div>

              {/* Recent */}
              <div className="card p-4">
                <h3 className="font-bold text-sm mb-2.5 text-gray-900">Recent</h3>
                <div className="space-y-1">
                  {data.expenses.length === 0 ? <p className="text-center py-6 text-xs text-gray-400">No expenses</p> : data.expenses.slice(0, 8).map(exp => (
                    <div key={exp.id} className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-2 transition-colors">
                      <div className="flex items-center gap-2"><span className="text-sm">{getCategoryEmoji(exp.category)}</span><div><div className="text-sm font-medium text-gray-900">{exp.title}</div><div className="text-[9px] text-gray-400">{exp.category} • {exp.date}</div></div></div>
                      <div className="flex items-center gap-2"><span className="text-sm font-bold text-red-500">-{formatCurrency(exp.amount)}</span><button onClick={() => deleteExpense(exp.id)} className="text-gray-300 hover:text-red-500 transition-colors"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
                    </div>
                  ))}
                </div>
              </div>
            </>)}
          </div>
        )}

        {/* ═══════════════ HABITS TAB ═══════════════ */}
        {activeTab === "habits" && (
          <div className="space-y-4 animate-fade-in">
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3"><h2 className="font-bold text-gray-900">Habits</h2><button onClick={() => setShowHabitForm(!showHabitForm)} className="btn-primary text-[10px] px-3 py-1.5 active:scale-95 transition-transform">+ Add</button></div>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <svg className="-rotate-90" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" stroke="#F3F4F6" strokeWidth="4" fill="none" /><circle cx="24" cy="24" r="20" stroke="#6366F1" strokeWidth="4" fill="none" strokeDasharray={`${data.totalHabits > 0 ? (data.habitsCompleted / data.totalHabits) * 125.6 : 0} 125.6`} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.7s ease" }} /></svg>
                  <div className="absolute inset-0 flex items-center justify-center"><span className="text-[10px] font-black text-gray-900">{data.habitsCompleted}/{data.totalHabits}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 flex-1">
                  <div><div className="text-sm font-bold text-gray-900">{data.maxStreak}d</div><div className="text-[9px] text-gray-400">Best Streak</div></div>
                  <div><div className="text-sm font-bold text-gray-900">{data.weeklyConsistency}%</div><div className="text-[9px] text-gray-400">This Week</div></div>
                </div>
              </div>
              {!isPremium && data.totalHabits >= 3 && <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl mt-3"><div><p className="text-[10px] font-bold text-gray-900">Limit reached (3/3)</p><p className="text-[9px] text-gray-400">Upgrade for unlimited</p></div><button onClick={() => router.push("/pricing")} className="btn-primary px-2.5 py-1 text-[9px]">Upgrade</button></div>}
            </div>

            {showHabitForm && <form onSubmit={addHabit} className="card p-3.5 flex gap-2 animate-fade-in"><input type="text" value={newHabit} onChange={e => setNewHabit(e.target.value)} placeholder="New habit..." className="input-field flex-1" required autoFocus /><button type="submit" className="btn-primary px-4 py-2 text-sm">Add</button></form>}

            {data.habitsCompleted === data.totalHabits && data.totalHabits > 0 && <div className="card p-3.5 bg-green-50 border-green-100 text-center animate-fade-in"><span className="text-xl">⭐</span><p className="text-sm font-bold text-green-700 mt-0.5">Perfect Day!</p></div>}

            <div className="space-y-2">
              {data.habits.length === 0 ? <div className="card p-8 text-center text-sm text-gray-400">Add your first habit</div> :
              [...data.habits].sort((a, b) => Number(a.completedToday) - Number(b.completedToday)).map(h => (
                <div key={h.id} className="card p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleHabit(h.id)} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${h.completedToday ? "bg-green-500 border-green-500 text-white" : "border-gray-200 hover:border-indigo-300"}`}>
                        {h.completedToday && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </button>
                      <div><span className={`text-sm font-medium ${h.completedToday ? "text-gray-400 line-through" : "text-gray-900"}`}>{h.name}</span>{h.streak > 0 && <span className="ml-1.5 text-[9px] text-orange-500 font-bold">🔥{h.streak}d</span>}</div>
                    </div>
                    <button onClick={() => deleteHabit(h.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                  {isPremium ? (
                    <div className="flex gap-1">{h.weekCompletions.map((d, i) => (<div key={i} className="flex-1 text-center"><div className={`w-full aspect-square rounded-lg flex items-center justify-center text-[10px] font-semibold ${d.done ? "bg-green-50 text-green-600 border border-green-200" : "bg-gray-50 text-gray-300 border border-gray-100"}`}>{d.done ? "✓" : "·"}</div><div className="text-[7px] text-gray-400 mt-0.5">{getDayName(d.date)}</div></div>))}</div>
                  ) : (
                    <div className="relative"><div className="flex gap-1 blur-[3px] opacity-40">{h.weekCompletions.map((d, i) => (<div key={i} className="flex-1 text-center"><div className="w-full aspect-square rounded-lg bg-gray-100 border border-gray-100" /><div className="text-[7px] text-gray-400 mt-0.5">{getDayName(d.date)}</div></div>))}</div><div className="absolute inset-0 flex items-center justify-center"><button onClick={() => router.push("/pricing")} className="bg-white border border-gray-200 rounded-lg px-3 py-1 text-[10px] font-semibold text-gray-700 shadow-sm active:scale-95">Unlock Weekly View</button></div></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════ GOALS TAB ═══════════════ */}
        {activeTab === "goals" && (
          <div className="space-y-4 animate-fade-in">
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3"><h2 className="font-bold text-gray-900">Goals</h2><button onClick={() => setShowGoalForm(!showGoalForm)} className="btn-primary text-[10px] px-3 py-1.5 active:scale-95 transition-transform">+ Add</button></div>
              <div className="grid grid-cols-2 gap-2"><div className="text-center p-2.5 bg-green-50 rounded-xl"><div className="text-lg font-bold text-green-600">{data.goalsCompleted}/{data.totalGoals}</div><div className="text-[9px] text-green-700/70 font-semibold">Done</div></div><div className="text-center p-2.5 bg-gray-50 rounded-xl"><div className="text-lg font-bold text-gray-900">{data.totalGoals - data.goalsCompleted}</div><div className="text-[9px] text-gray-500 font-semibold">In Progress</div></div></div>
              {!isPremium && data.totalGoals >= 2 && <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl mt-3"><div><p className="text-[10px] font-bold text-gray-900">Limit reached (2/2)</p><p className="text-[9px] text-gray-400">Upgrade for unlimited</p></div><button onClick={() => router.push("/pricing")} className="btn-primary px-2.5 py-1 text-[9px]">Upgrade</button></div>}
            </div>

            {showGoalForm && <form onSubmit={addGoal} className="card p-3.5 flex gap-2 animate-fade-in"><input type="text" value={newGoal} onChange={e => setNewGoal(e.target.value)} placeholder="e.g. Save ₹10,000" className="input-field flex-1" required autoFocus /><button type="submit" className="btn-primary px-4 py-2 text-sm">Add</button></form>}

            <div className="space-y-2">
              {data.goals.length === 0 ? <div className="card p-8 text-center text-sm text-gray-400">What do you want to achieve?</div> :
              [...data.goals].sort((a, b) => Number(a.completed) - Number(b.completed)).map(g => (
                <div key={g.id} className="card px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleGoal(g.id, g.completed)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${g.completed ? "bg-green-500 border-green-500 text-white" : "border-gray-200 hover:border-indigo-300"}`}>
                      {g.completed && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </button>
                    <span className={`text-sm ${g.completed ? "text-gray-400 line-through" : "text-gray-900 font-medium"}`}>{g.title}</span>
                  </div>
                  <button onClick={() => deleteGoal(g.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-50 z-50 safe-area-pb">
        <div className="max-w-lg mx-auto flex items-center justify-around py-1.5">
          {([
            { id: "home" as const, label: "Home", icon: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" },
            { id: "money" as const, label: "Money", icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
            { id: "habits" as const, label: "Habits", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
            { id: "goals" as const, label: "Goals", icon: "M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all active:scale-90 ${activeTab === tab.id ? "text-indigo-500" : "text-gray-400"}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeTab === tab.id ? 2 : 1.5}><path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} /></svg>
              <span className={`text-[9px] ${activeTab === tab.id ? "font-bold" : "font-medium"}`}>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
