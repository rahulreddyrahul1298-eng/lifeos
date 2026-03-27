"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  formatCurrency,
  getGreeting,
  getCategoryIcon,
  getCategoryColor,
  getCategoryBgColor,
  CATEGORIES,
  autoCategorize,
} from "@/lib/utils";
import Toast from "@/components/ui/Toast";

type DashboardData = {
  user: { name: string; income: number; budget: number; isPremium: boolean; bank: string; occupation: string };
  totalSpent: number;
  todaySpent: number;
  remaining: number;
  incomeUsedPct: number;
  dailyBudgetRemaining: number;
  daysRemaining: number;
  categoryDetails: {
    category: string; spent: number; limit: number; percent: number;
    exceeded: boolean; remaining: number; overBy: number;
  }[];
  categoryBreakdown: { category: string; total: number; percent: number }[];
  recentExpenses: { id: string; title: string; amount: number; category: string; date: string }[];
  goals: {
    id: string; title: string; icon: string; targetAmount: number;
    savedAmount: number; deadline: string; completed: boolean; progress: number;
  }[];
  debts: {
    id: string; name: string; totalAmount: number; paidAmount: number;
    monthlyEMI: number; remaining: number; progress: number;
  }[];
  totalDebt: number;
  totalEMI: number;
  alerts: { type: string; message: string }[];
  predictions: { projectedMonthEnd: number; projectedSavings: number; avgDailySpend: number } | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"home" | "transactions" | "goals">("home");
  const [toast, setToast] = useState<{ icon: string; message: string } | null>(null);

  // Expense form
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expTitle, setExpTitle] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expCategory, setExpCategory] = useState("");
  const [expSubmitting, setExpSubmitting] = useState(false);

  // Goal fund form
  const [addingFundGoalId, setAddingFundGoalId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState("");

  // Transaction filter
  const [txFilter, setTxFilter] = useState("All");

  // All expenses for transactions tab
  const [allExpenses, setAllExpenses] = useState<DashboardData["recentExpenses"]>([]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.status === 401) { router.push("/auth"); return; }
      const json = await res.json();
      setData(json);
    } catch {
      router.push("/auth");
    }
    setLoading(false);
  }, [router]);

  const fetchExpenses = useCallback(async () => {
    const params = txFilter !== "All" ? `?category=${encodeURIComponent(txFilter)}` : "";
    const res = await fetch(`/api/expenses${params}`);
    if (res.ok) {
      const json = await res.json();
      setAllExpenses(json.expenses);
    }
  }, [txFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (tab === "transactions") fetchExpenses(); }, [tab, txFilter, fetchExpenses]);

  async function addExpense() {
    if (!expTitle || !expAmount) return;
    setExpSubmitting(true);
    const suggestedCat = expCategory || autoCategorize(expTitle);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: expTitle, amount: expAmount, category: suggestedCat }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.alert?.type === "exceeded") {
        setToast({ icon: "🔴", message: `${json.alert.category} budget exceeded by ₹${json.alert.overBy}` });
      } else if (json.alert?.type === "warning") {
        setToast({ icon: "⚠️", message: `${json.alert.category} budget ${json.alert.pct}% used` });
      } else {
        setToast({ icon: "✅", message: "Expense added" });
      }
      setExpTitle(""); setExpAmount(""); setExpCategory(""); setShowAddExpense(false);
      fetchData();
      if (tab === "transactions") fetchExpenses();
    }
    setExpSubmitting(false);
  }

  async function deleteExpense(id: string) {
    await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
    fetchData();
    if (tab === "transactions") fetchExpenses();
  }

  async function addFundToGoal(goalId: string) {
    if (!fundAmount) return;
    const goal = data?.goals.find((g) => g.id === goalId);
    if (!goal) return;
    const newSaved = goal.savedAmount + parseFloat(fundAmount);
    await fetch("/api/goals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: goalId, savedAmount: newSaved }),
    });
    setFundAmount(""); setAddingFundGoalId(null);
    setToast({ icon: "💰", message: `Added ₹${parseInt(fundAmount).toLocaleString()} to goal` });
    fetchData();
  }

  async function payDebt(debtId: string, amount: number) {
    const debt = data?.debts.find((d) => d.id === debtId);
    if (!debt) return;
    const newPaid = debt.paidAmount + amount;
    await fetch("/api/debts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: debtId, paidAmount: newPaid }),
    });
    setToast({ icon: "✅", message: `Paid ₹${amount.toLocaleString()} on ${debt.name}` });
    fetchData();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  // Auto-suggest category while typing title
  function handleTitleChange(val: string) {
    setExpTitle(val);
    if (!expCategory && val.length > 2) {
      const suggested = autoCategorize(val);
      if (suggested !== "Other") setExpCategory(suggested);
    }
  }

  if (loading) return <LoadingSkeleton />;
  if (!data) return null;

  const { user } = data;
  const spentPct = user.income > 0 ? Math.min(100, (data.totalSpent / user.income) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-24">
      {toast && <Toast icon={toast.icon} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{getGreeting()}</p>
            <h1 className="text-lg font-bold text-gray-900">{user.name || "User"}</h1>
          </div>
          <div className="flex items-center gap-3">
            {user.isPremium ? (
              <span className="badge-pro">PRO</span>
            ) : (
              <button onClick={() => router.push("/pricing")} className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">
                Upgrade
              </button>
            )}
            <button onClick={logout} className="text-gray-400 text-sm">Logout</button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-5">
        {/* ===== HOME TAB ===== */}
        {tab === "home" && (
          <>
            {/* Money Overview */}
            <div className="card p-5 mb-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Monthly Income</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(user.income)}</p>
                </div>
                {user.bank && (
                  <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg">
                    {user.bank}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-red-50 rounded-xl p-3">
                  <p className="text-xs text-red-400">Spent</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(data.totalSpent)}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-xs text-green-400">Remaining</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(Math.max(0, data.remaining))}</p>
                </div>
              </div>

              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    spentPct > 90 ? "bg-red-500" : spentPct > 70 ? "bg-amber-500" : "bg-green-500"
                  }`}
                  style={{ width: `${spentPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {data.incomeUsedPct}% of income used &middot; {data.daysRemaining} days left
              </p>
            </div>

            {/* Category Budgets Grid */}
            {data.categoryDetails.length > 0 && (
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Budget Categories</h2>
                <div className="grid grid-cols-2 gap-3">
                  {data.categoryDetails.map((cat) => (
                    <div key={cat.category} className="card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                          style={{ backgroundColor: getCategoryBgColor(cat.category) }}
                        >
                          {getCategoryIcon(cat.category)}
                        </div>
                        <span className="text-xs font-medium text-gray-700 truncate">{cat.category}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-gray-900">₹{Math.round(cat.spent).toLocaleString()}</span>
                        <span className="text-xs text-gray-400">/ ₹{cat.limit.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, cat.percent)}%`,
                            backgroundColor: cat.exceeded ? "#EF4444" : cat.percent > 80 ? "#F59E0B" : getCategoryColor(cat.category),
                          }}
                        />
                      </div>
                      {cat.exceeded && (
                        <p className="text-xs text-red-500 font-medium mt-1">Over by ₹{Math.round(cat.overBy).toLocaleString()}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            {data.recentExpenses.length > 0 && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-sm font-semibold text-gray-900">Recent Transactions</h2>
                  <button onClick={() => setTab("transactions")} className="text-xs text-indigo-600 font-medium">
                    View All
                  </button>
                </div>
                <div className="card divide-y divide-gray-50">
                  {data.recentExpenses.slice(0, 5).map((exp) => (
                    <div key={exp.id} className="flex items-center gap-3 p-3.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0"
                        style={{ backgroundColor: getCategoryBgColor(exp.category) }}
                      >
                        {getCategoryIcon(exp.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{exp.title}</p>
                        <p className="text-xs text-gray-400">{exp.category} &middot; {exp.date}</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">-₹{exp.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Savings Goals Preview */}
            {data.goals.length > 0 && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-sm font-semibold text-gray-900">Savings Goals</h2>
                  <button onClick={() => setTab("goals")} className="text-xs text-indigo-600 font-medium">
                    View All
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5">
                  {data.goals.map((goal) => (
                    <div key={goal.id} className="card p-4 min-w-[180px] shrink-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{goal.icon || "🎯"}</span>
                        <span className="text-xs font-medium text-gray-700 truncate">{goal.title}</span>
                      </div>
                      {goal.targetAmount ? (
                        <>
                          <p className="text-sm font-bold text-gray-900">
                            ₹{goal.savedAmount.toLocaleString()} <span className="text-xs text-gray-400 font-normal">/ ₹{goal.targetAmount.toLocaleString()}</span>
                          </p>
                          <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${goal.progress}%` }} />
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-gray-400">No target set</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alerts */}
            {data.alerts.length > 0 && (
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Alerts</h2>
                <div className="space-y-2">
                  {data.alerts.map((alert, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-xl text-sm ${
                        alert.type === "danger" ? "bg-red-50 text-red-700" :
                        alert.type === "warning" ? "bg-amber-50 text-amber-700" :
                        alert.type === "success" ? "bg-green-50 text-green-700" :
                        "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {alert.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Add Expense */}
            <button
              onClick={() => setShowAddExpense(true)}
              className="btn-primary w-full py-3.5 text-base"
            >
              + Add Expense
            </button>
          </>
        )}

        {/* ===== TRANSACTIONS TAB ===== */}
        {tab === "transactions" && (
          <>
            {/* Filter */}
            <div className="flex gap-2 overflow-x-auto pb-3 -mx-5 px-5 mb-4">
              {["All", ...CATEGORIES.map((c) => c.name)].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setTxFilter(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    txFilter === cat
                      ? "bg-gray-900 text-white"
                      : "bg-white border border-gray-100 text-gray-600"
                  }`}
                >
                  {cat === "All" ? "All" : `${getCategoryIcon(cat)} ${cat}`}
                </button>
              ))}
            </div>

            {/* Expense List */}
            {allExpenses.length > 0 ? (
              <div className="card divide-y divide-gray-50 mb-4">
                {allExpenses.map((exp) => (
                  <div key={exp.id} className="flex items-center gap-3 p-3.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0"
                      style={{ backgroundColor: getCategoryBgColor(exp.category) }}
                    >
                      {getCategoryIcon(exp.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{exp.title}</p>
                      <p className="text-xs text-gray-400">{exp.category} &middot; {exp.date}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">-₹{exp.amount.toLocaleString()}</span>
                      <button onClick={() => deleteExpense(exp.id)} className="block text-xs text-red-400 mt-0.5">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center mb-4">
                <p className="text-gray-400 text-sm">No transactions{txFilter !== "All" ? ` in ${txFilter}` : ""} this month</p>
              </div>
            )}

            <button
              onClick={() => setShowAddExpense(true)}
              className="btn-primary w-full py-3.5 text-base"
            >
              + Add Expense
            </button>
          </>
        )}

        {/* ===== GOALS TAB ===== */}
        {tab === "goals" && (
          <>
            {/* Savings Goals */}
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Savings Goals</h2>
            {data.goals.length > 0 ? (
              <div className="space-y-3 mb-6">
                {data.goals.map((goal) => (
                  <div key={goal.id} className="card p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{goal.icon || "🎯"}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{goal.title}</p>
                        {goal.deadline && (
                          <p className="text-xs text-gray-400">Target: {goal.deadline}</p>
                        )}
                      </div>
                    </div>
                    {goal.targetAmount ? (
                      <>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-500">Saved</span>
                          <span className="font-bold text-gray-900">
                            ₹{goal.savedAmount.toLocaleString()} / ₹{goal.targetAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all"
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mb-3">{goal.progress}% complete</p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400 mb-3">No target amount set</p>
                    )}
                    {addingFundGoalId === goal.id ? (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                          <input
                            type="number"
                            value={fundAmount}
                            onChange={(e) => setFundAmount(e.target.value)}
                            placeholder="Amount"
                            className="input-field pl-7 text-sm py-2"
                            autoFocus
                          />
                        </div>
                        <button
                          onClick={() => addFundToGoal(goal.id)}
                          className="bg-indigo-500 text-white px-4 rounded-xl text-sm font-medium"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => { setAddingFundGoalId(null); setFundAmount(""); }}
                          className="text-gray-400 px-2 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingFundGoalId(goal.id)}
                        className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-medium"
                      >
                        + Add Money
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center mb-6">
                <p className="text-gray-400 text-sm">No savings goals yet</p>
              </div>
            )}

            {/* Debts */}
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Debt Tracking</h2>
            {data.debts.length > 0 ? (
              <>
                {/* Debt Summary */}
                <div className="card p-4 mb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-400">Total Debt Left</p>
                      <p className="text-lg font-bold text-red-600">₹{data.totalDebt.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Monthly EMI</p>
                      <p className="text-lg font-bold text-gray-900">₹{data.totalEMI.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {data.debts.map((debt) => (
                    <div key={debt.id} className="card p-4">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold text-gray-900">{debt.name}</p>
                        <p className="text-xs text-gray-400">EMI: ₹{debt.monthlyEMI.toLocaleString()}/mo</p>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Paid</span>
                        <span className="font-bold text-gray-900">
                          ₹{debt.paidAmount.toLocaleString()} / ₹{debt.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${debt.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-400">₹{debt.remaining.toLocaleString()} remaining</p>
                        <button
                          onClick={() => payDebt(debt.id, debt.monthlyEMI)}
                          className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-lg font-medium"
                        >
                          Pay EMI (₹{debt.monthlyEMI.toLocaleString()})
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="card p-8 text-center">
                <p className="text-gray-400 text-sm">No debts tracked</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
          <div className="bg-white w-full max-w-lg mx-auto rounded-t-3xl p-6 animate-slideUp">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-900">Add Expense</h3>
              <button onClick={() => setShowAddExpense(false)} className="text-gray-400 text-2xl leading-none">&times;</button>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">What did you spend on?</label>
              <input
                type="text"
                value={expTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g., Swiggy, Uber, Amazon"
                className="input-field"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                <input
                  type="number"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder="0"
                  className="input-field pl-8 text-lg font-semibold"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setExpCategory(cat.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      expCategory === cat.name
                        ? "text-white"
                        : "bg-gray-50 text-gray-600"
                    }`}
                    style={expCategory === cat.name ? { backgroundColor: cat.color } : {}}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={addExpense}
              disabled={!expTitle || !expAmount || expSubmitting}
              className="btn-primary w-full py-3.5 text-base disabled:opacity-40"
            >
              {expSubmitting ? "Adding..." : "Add Expense"}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom">
        <div className="max-w-lg mx-auto flex">
          {[
            { key: "home" as const, label: "Home", icon: "🏠" },
            { key: "transactions" as const, label: "Transactions", icon: "💳" },
            { key: "goals" as const, label: "Goals", icon: "🎯" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-3 flex flex-col items-center gap-0.5 transition-all ${
                tab === t.key ? "text-indigo-600" : "text-gray-400"
              }`}
            >
              <span className="text-lg">{t.icon}</span>
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 8px); }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-20">
      <div className="bg-white border-b border-gray-100 px-5 py-4">
        <div className="max-w-lg mx-auto">
          <div className="h-4 bg-gray-100 rounded w-24 mb-2 animate-pulse" />
          <div className="h-6 bg-gray-100 rounded w-32 animate-pulse" />
        </div>
      </div>
      <div className="max-w-lg mx-auto px-5 pt-5 space-y-4">
        <div className="card p-5">
          <div className="h-4 bg-gray-100 rounded w-20 mb-3 animate-pulse" />
          <div className="h-8 bg-gray-100 rounded w-36 mb-4 animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
            <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-4 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
