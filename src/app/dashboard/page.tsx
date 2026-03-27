"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/ui/Toast";
import {
  CATEGORIES,
  GOAL_PRESETS,
  autoCategorize,
  formatCurrency,
  getCategoryBgColor,
  getCategoryColor,
  getCategoryIcon,
  normalizeAmount,
} from "@/lib/utils";

type AlertItem = {
  type: "warning" | "success" | "info" | "danger";
  message: string;
};

type Transaction = {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
};

type Goal = {
  id: string;
  title: string;
  icon: string | null;
  targetAmount: number | null;
  savedAmount: number;
  deadline: string | null;
  completed: boolean;
  progress: number;
  remainingAmount: number | null;
};

type Debt = {
  id: string;
  name: string;
  totalAmount: number;
  paidAmount: number;
  monthlyEMI: number;
  remaining: number;
  progress: number;
};

type CategoryDetail = {
  category: string;
  spent: number;
  limit: number;
  effectiveLimit: number;
  percent: number;
  exceeded: boolean;
  remaining: number;
  overBy: number;
  transferredFromOther: number;
};

type DashboardData = {
  user: {
    id: string;
    name: string | null;
    income: number;
    budget: number;
    isPremium: boolean;
    bank: string | null;
    occupation: string | null;
  };
  overview: {
    income: number;
    totalSpent: number;
    todaySpent: number;
    remaining: number;
    incomeUsedPct: number;
    daysRemaining: number;
    dailyBudgetRemaining: number;
    totalGoalTarget: number;
    totalGoalSaved: number;
    totalDebt: number;
    totalEMI: number;
  };
  categoryDetails: CategoryDetail[];
  categoryBreakdown: { category: string; total: number; percent: number }[];
  spendingByDay: { date: string; total: number }[];
  transactions: Transaction[];
  recentExpenses: Transaction[];
  goals: Goal[];
  debts: Debt[];
  alerts: AlertItem[];
  premium: {
    projectedMonthEnd: number;
    projectedSavings: number;
    avgDailySpend: number;
  } | null;
};

const tabs = [
  { key: "home", label: "Home", icon: "??" },
  { key: "transactions", label: "Transactions", icon: "??" },
  { key: "goals", label: "Goals", icon: "??" },
] as const;

export default function DashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("home");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ icon: string; message: string } | null>(null);

  const [showExpenseSheet, setShowExpenseSheet] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState("All");

  const [goalContribution, setGoalContribution] = useState<Record<string, string>>({});
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalIcon, setNewGoalIcon] = useState("??");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalSaved, setNewGoalSaved] = useState("");
  const [newGoalDeadline, setNewGoalDeadline] = useState("");

  const [showDebtForm, setShowDebtForm] = useState(false);
  const [debtName, setDebtName] = useState("");
  const [debtAmount, setDebtAmount] = useState("");
  const [debtEmi, setDebtEmi] = useState("");
  const [debtPaid, setDebtPaid] = useState("");

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (response.status === 401) {
        router.push("/auth");
        return;
      }

      const json = (await response.json()) as DashboardData;
      setData(json);
    } catch (error) {
      console.error(error);
      router.push("/auth");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const filteredTransactions = useMemo(() => {
    if (!data) return [];
    if (transactionFilter === "All") return data.transactions;
    return data.transactions.filter((transaction) => transaction.category === transactionFilter);
  }, [data, transactionFilter]);

  function onExpenseTitleChange(value: string) {
    setExpenseTitle(value);
    if (!expenseCategory) {
      const suggestion = autoCategorize(value);
      if (suggestion !== "Other") setExpenseCategory(suggestion);
    }
  }

  async function addExpense() {
    if (!expenseTitle || normalizeAmount(expenseAmount) <= 0) return;
    setExpenseSaving(true);
    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: expenseTitle,
          amount: normalizeAmount(expenseAmount),
          category: expenseCategory || autoCategorize(expenseTitle),
          date: expenseDate || undefined,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.alert?.type === "exceeded") {
          setToast({
            icon: "??",
            message:
              json.alert.transferredFromOther > 0
                ? `${json.alert.category} exceeded. Moved Rs ${json.alert.transferredFromOther} from Other.`
                : `${json.alert.category} exceeded by Rs ${json.alert.overBy}.`,
          });
        } else if (json.alert?.type === "warning") {
          setToast({ icon: "??", message: `${json.alert.category} is at ${json.alert.pct}% of budget.` });
        } else {
          setToast({ icon: "?", message: `Expense saved under ${json.suggestedCategory}.` });
        }

        setExpenseTitle("");
        setExpenseAmount("");
        setExpenseCategory("");
        setExpenseDate("");
        setShowExpenseSheet(false);
        fetchDashboard();
      }
    } finally {
      setExpenseSaving(false);
    }
  }

  async function deleteExpense(id: string) {
    await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
    setToast({ icon: "???", message: "Transaction removed." });
    fetchDashboard();
  }

  async function addMoneyToGoal(goal: Goal) {
    const amount = normalizeAmount(goalContribution[goal.id]);
    if (amount <= 0) return;

    const response = await fetch("/api/goals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: goal.id, savedAmount: goal.savedAmount + amount }),
    });

    if (response.ok) {
      setGoalContribution((current) => ({ ...current, [goal.id]: "" }));
      setToast({ icon: "??", message: `${formatCurrency(amount)} added to ${goal.title}.` });
      fetchDashboard();
    }
  }

  async function createGoal() {
    if (!newGoalTitle || normalizeAmount(newGoalTarget) <= 0) return;

    const response = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newGoalTitle,
        icon: newGoalIcon,
        targetAmount: normalizeAmount(newGoalTarget),
        savedAmount: normalizeAmount(newGoalSaved),
        deadline: newGoalDeadline || null,
      }),
    });

    if (response.ok) {
      setToast({ icon: "??", message: `${newGoalTitle} goal created.` });
      setShowGoalForm(false);
      setNewGoalTitle("");
      setNewGoalIcon("??");
      setNewGoalTarget("");
      setNewGoalSaved("");
      setNewGoalDeadline("");
      fetchDashboard();
    }
  }

  async function createDebt() {
    if (!debtName || normalizeAmount(debtAmount) <= 0) return;

    const response = await fetch("/api/debts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: debtName,
        totalAmount: normalizeAmount(debtAmount),
        monthlyEMI: normalizeAmount(debtEmi),
        paidAmount: normalizeAmount(debtPaid),
      }),
    });

    if (response.ok) {
      setToast({ icon: "??", message: `${debtName} added to debt tracking.` });
      setShowDebtForm(false);
      setDebtName("");
      setDebtAmount("");
      setDebtEmi("");
      setDebtPaid("");
      fetchDashboard();
    }
  }

  async function payDebt(debt: Debt, amount?: number) {
    const payment = amount ?? debt.monthlyEMI;
    if (payment <= 0) return;

    const response = await fetch("/api/debts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: debt.id,
        paidAmount: Math.min(debt.totalAmount, debt.paidAmount + payment),
      }),
    });

    if (response.ok) {
      setToast({ icon: "?", message: `${formatCurrency(payment)} marked as paid on ${debt.name}.` });
      fetchDashboard();
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  if (loading) {
    return <LoadingState />;
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-28">
      {toast ? <Toast icon={toast.icon} message={toast.message} onClose={() => setToast(null)} /> : null}

      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
          <div>
            <p className="eyebrow">LifeOS</p>
            <h1 className="mt-1 text-xl font-extrabold text-slate-900">
              {data.user.name ? `${data.user.name}'s money hub` : "Your money hub"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {data.user.bank ? (
              <div className="rounded-full bg-[#E8F0FE] px-4 py-2 text-sm font-bold text-[#1A73E8]">
                {data.user.bank}
              </div>
            ) : null}
            {data.user.isPremium ? (
              <span className="badge-pro">PREMIUM</span>
            ) : (
              <button onClick={() => router.push("/pricing")} className="btn-secondary px-4 py-2 text-sm">
                Upgrade
              </button>
            )}
            <button onClick={logout} className="text-sm font-semibold text-slate-500">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-6">
        {tab === "home" ? <HomeTab data={data} onOpenTransactions={() => setTab("transactions")} onOpenGoals={() => setTab("goals")} onAddExpense={() => setShowExpenseSheet(true)} /> : null}
        {tab === "transactions" ? (
          <TransactionsTab
            filter={transactionFilter}
            setFilter={setTransactionFilter}
            transactions={filteredTransactions}
            onDelete={deleteExpense}
            onAddExpense={() => setShowExpenseSheet(true)}
          />
        ) : null}
        {tab === "goals" ? (
          <GoalsTab
            data={data}
            contribution={goalContribution}
            setContribution={setGoalContribution}
            onAddMoney={addMoneyToGoal}
            onPayDebt={payDebt}
            showGoalForm={showGoalForm}
            setShowGoalForm={setShowGoalForm}
            newGoalTitle={newGoalTitle}
            setNewGoalTitle={setNewGoalTitle}
            newGoalIcon={newGoalIcon}
            setNewGoalIcon={setNewGoalIcon}
            newGoalTarget={newGoalTarget}
            setNewGoalTarget={setNewGoalTarget}
            newGoalSaved={newGoalSaved}
            setNewGoalSaved={setNewGoalSaved}
            newGoalDeadline={newGoalDeadline}
            setNewGoalDeadline={setNewGoalDeadline}
            createGoal={createGoal}
            showDebtForm={showDebtForm}
            setShowDebtForm={setShowDebtForm}
            debtName={debtName}
            setDebtName={setDebtName}
            debtAmount={debtAmount}
            setDebtAmount={setDebtAmount}
            debtEmi={debtEmi}
            setDebtEmi={setDebtEmi}
            debtPaid={debtPaid}
            setDebtPaid={setDebtPaid}
            createDebt={createDebt}
          />
        ) : null}
      </main>

      {showExpenseSheet ? (
        <div className="fixed inset-0 z-40 flex items-end bg-slate-950/35 p-0 sm:items-center sm:justify-center sm:p-4">
          <div className="w-full rounded-t-[28px] bg-white p-6 sm:max-w-xl sm:rounded-[28px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Add expense</p>
                <h3 className="mt-1 text-2xl font-extrabold text-slate-900">Track a transaction</h3>
              </div>
              <button onClick={() => setShowExpenseSheet(false)} className="text-2xl text-slate-400">
                ×
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Merchant or note</label>
                <input
                  value={expenseTitle}
                  onChange={(event) => onExpenseTitleChange(event.target.value)}
                  placeholder="Swiggy, Uber, Amazon..."
                  className="input-field"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">Rs</span>
                    <input
                      type="number"
                      value={expenseAmount}
                      onChange={(event) => setExpenseAmount(event.target.value)}
                      placeholder="0"
                      className="input-field pl-12"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Date</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(event) => setExpenseDate(event.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => setExpenseCategory(category.name)}
                      className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                        expenseCategory === category.name
                          ? "text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                      style={expenseCategory === category.name ? { backgroundColor: category.color } : undefined}
                    >
                      {category.icon} {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={addExpense} disabled={expenseSaving} className="btn-primary mt-6 w-full py-4 text-base">
              {expenseSaving ? "Saving transaction..." : "Save expense"}
            </button>
          </div>
        </div>
      ) : null}

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200/80 bg-white/96 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-3xl px-2 py-2">
          {tabs.map((item) => {
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`flex-1 rounded-2xl px-4 py-3 text-center text-sm font-bold transition ${
                  active ? "bg-[#E8F0FE] text-[#1A73E8]" : "text-slate-500"
                }`}
              >
                <div className="text-lg">{item.icon}</div>
                <div className="mt-1">{item.label}</div>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function HomeTab({
  data,
  onOpenTransactions,
  onOpenGoals,
  onAddExpense,
}: {
  data: DashboardData;
  onOpenTransactions: () => void;
  onOpenGoals: () => void;
  onAddExpense: () => void;
}) {
  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
        <div className="card overflow-hidden p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Income overview</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">{formatCurrency(data.overview.income)}</h2>
              <p className="mt-2 text-sm text-slate-500">
                {data.overview.incomeUsedPct}% of your income has been used this month.
              </p>
            </div>
            <button onClick={onAddExpense} className="btn-primary px-5 py-3 text-sm">
              Add expense
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <MetricCard label="Spent" value={formatCurrency(data.overview.totalSpent)} tone="red" />
            <MetricCard label="Remaining" value={formatCurrency(Math.max(0, data.overview.remaining))} tone="green" />
            <MetricCard label="Today" value={formatCurrency(data.overview.todaySpent)} tone="blue" />
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
              <span>Monthly progress</span>
              <span>{data.overview.daysRemaining} days left</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  data.overview.incomeUsedPct >= 90
                    ? "bg-[#D93025]"
                    : data.overview.incomeUsedPct >= 70
                      ? "bg-[#F29900]"
                      : "bg-[#0F9D58]"
                }`}
                style={{ width: `${Math.min(100, data.overview.incomeUsedPct)}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Safe daily spend left: {formatCurrency(data.overview.dailyBudgetRemaining)}
            </p>
          </div>
        </div>

        <div className="card p-6">
          <p className="eyebrow">This month</p>
          <div className="mt-4 space-y-4">
            <MiniMetric label="Goal savings" value={formatCurrency(data.overview.totalGoalSaved)} helper={`${formatCurrency(data.overview.totalGoalTarget)} target`} />
            <MiniMetric label="Debt left" value={formatCurrency(data.overview.totalDebt)} helper={`${formatCurrency(data.overview.totalEMI)} in monthly EMIs`} />
            <MiniMetric label="Top category" value={data.categoryBreakdown[0]?.category || "No spending yet"} helper={data.categoryBreakdown[0] ? formatCurrency(data.categoryBreakdown[0].total) : "Add your first expense"} />
            {data.premium ? (
              <MiniMetric label="Premium forecast" value={formatCurrency(data.premium.projectedSavings)} helper="Projected month-end savings" />
            ) : (
              <div className="rounded-[22px] bg-[#E8F0FE] p-4 text-sm text-[#1A73E8]">
                Upgrade to keep the premium forecasts and smart projections.
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-slate-900">Category budgets</h3>
          <span className="text-sm font-semibold text-slate-500">Envelope view</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.categoryDetails.map((category) => (
            <div key={category.category} className="card p-5">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                  style={{ backgroundColor: getCategoryBgColor(category.category) }}
                >
                  {getCategoryIcon(category.category)}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{category.category}</p>
                  <p className="text-sm text-slate-500">{formatCurrency(category.spent)} spent</p>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-sm text-slate-500">Budget</p>
                  <p className="text-xl font-extrabold text-slate-900">{formatCurrency(category.effectiveLimit || category.limit)}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${category.exceeded ? "bg-[#FDECEC] text-[#D93025]" : category.percent >= 90 ? "bg-[#FFF3E0] text-[#F29900]" : "bg-[#E9F7EF] text-[#0F9D58]"}`}>
                  {category.exceeded ? `Over by ${formatCurrency(category.overBy)}` : `${category.percent}% used`}
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, category.percent)}%`,
                    backgroundColor: category.exceeded
                      ? "#D93025"
                      : category.percent >= 90
                        ? "#F29900"
                        : getCategoryColor(category.category),
                  }}
                />
              </div>
              <p className="mt-3 text-sm text-slate-500">
                {category.transferredFromOther > 0
                  ? `${formatCurrency(category.transferredFromOther)} moved from Other to keep this covered.`
                  : `${formatCurrency(Math.max(0, category.remaining))} left in this category.`}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-slate-900">Recent transactions</h3>
            <button onClick={onOpenTransactions} className="text-sm font-semibold text-[#1A73E8]">
              View all
            </button>
          </div>
          <div className="card overflow-hidden">
            {data.recentExpenses.length > 0 ? (
              data.recentExpenses.map((transaction) => (
                <TransactionRow key={transaction.id} transaction={transaction} compact />
              ))
            ) : (
              <EmptyState title="No transactions yet" body="Add your first expense to start tracking your month." />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-slate-900">Savings goals</h3>
              <button onClick={onOpenGoals} className="text-sm font-semibold text-[#1A73E8]">
                Open goals
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-1">
              {data.goals.length > 0 ? (
                data.goals.map((goal) => (
                  <div key={goal.id} className="card min-w-[220px] p-5">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{goal.icon || "??"}</span>
                      <div>
                        <p className="font-bold text-slate-900">{goal.title}</p>
                        <p className="text-sm text-slate-500">{goal.deadline || "Flexible target"}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-lg font-extrabold text-slate-900">
                      {formatCurrency(goal.savedAmount)}
                      <span className="ml-1 text-sm font-semibold text-slate-400">
                        / {formatCurrency(goal.targetAmount || 0)}
                      </span>
                    </p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-[#1A73E8]" style={{ width: `${goal.progress}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="card min-w-full p-6">
                  <EmptyState title="No goals yet" body="Set your first savings target in the Goals tab." />
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-slate-900">Alerts</h3>
              <span className="text-sm font-semibold text-slate-500">Live budget watch</span>
            </div>
            <div className="space-y-3">
              {data.alerts.length > 0 ? (
                data.alerts.map((alert, index) => (
                  <div key={`${alert.message}-${index}`} className={`card p-4 ${getAlertTone(alert.type)}`}>
                    <p className="text-sm font-semibold">{alert.message}</p>
                  </div>
                ))
              ) : (
                <div className="card p-5">
                  <p className="text-sm text-slate-500">You are all clear right now.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TransactionsTab({
  filter,
  setFilter,
  transactions,
  onDelete,
  onAddExpense,
}: {
  filter: string;
  setFilter: (value: string) => void;
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onAddExpense: () => void;
}) {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Transactions</p>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900">All spending</h2>
        </div>
        <button onClick={onAddExpense} className="btn-primary px-5 py-3 text-sm">
          Add expense
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {["All", ...CATEGORIES.map((category) => category.name)].map((category) => {
          const active = filter === category;
          return (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                active ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-500"
              }`}
            >
              {category === "All" ? "All" : `${getCategoryIcon(category)} ${category}`}
            </button>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        {transactions.length > 0 ? (
          transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                style={{ backgroundColor: getCategoryBgColor(transaction.category) }}
              >
                {getCategoryIcon(transaction.category)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-slate-900">{transaction.title}</p>
                <p className="text-sm text-slate-500">{transaction.category} • {transaction.date}</p>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-slate-900">-{formatCurrency(transaction.amount)}</p>
                <button onClick={() => onDelete(transaction.id)} className="mt-1 text-xs font-semibold text-[#D93025]">
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <EmptyState title="No transactions for this filter" body="Try another category or add a new expense." />
        )}
      </div>

      <div className="card p-5">
        <p className="eyebrow">Auto-categorization</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <AutoRule merchant="Swiggy" category="Food & Dining" />
          <AutoRule merchant="Uber" category="Transport" />
          <AutoRule merchant="Amazon" category="Shopping" />
        </div>
      </div>
    </section>
  );
}

function GoalsTab(props: {
  data: DashboardData;
  contribution: Record<string, string>;
  setContribution: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onAddMoney: (goal: Goal) => void;
  onPayDebt: (debt: Debt, amount?: number) => void;
  showGoalForm: boolean;
  setShowGoalForm: (value: boolean) => void;
  newGoalTitle: string;
  setNewGoalTitle: (value: string) => void;
  newGoalIcon: string;
  setNewGoalIcon: (value: string) => void;
  newGoalTarget: string;
  setNewGoalTarget: (value: string) => void;
  newGoalSaved: string;
  setNewGoalSaved: (value: string) => void;
  newGoalDeadline: string;
  setNewGoalDeadline: (value: string) => void;
  createGoal: () => void;
  showDebtForm: boolean;
  setShowDebtForm: (value: boolean) => void;
  debtName: string;
  setDebtName: (value: string) => void;
  debtAmount: string;
  setDebtAmount: (value: string) => void;
  debtEmi: string;
  setDebtEmi: (value: string) => void;
  debtPaid: string;
  setDebtPaid: (value: string) => void;
  createDebt: () => void;
}) {
  const {
    data,
    contribution,
    setContribution,
    onAddMoney,
    onPayDebt,
    showGoalForm,
    setShowGoalForm,
    newGoalTitle,
    setNewGoalTitle,
    newGoalIcon,
    setNewGoalIcon,
    newGoalTarget,
    setNewGoalTarget,
    newGoalSaved,
    setNewGoalSaved,
    newGoalDeadline,
    setNewGoalDeadline,
    createGoal,
    showDebtForm,
    setShowDebtForm,
    debtName,
    setDebtName,
    debtAmount,
    setDebtAmount,
    debtEmi,
    setDebtEmi,
    debtPaid,
    setDebtPaid,
    createDebt,
  } = props;

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="eyebrow">Goals</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Savings progress</h2>
            </div>
            <button onClick={() => setShowGoalForm(!showGoalForm)} className="btn-primary px-5 py-3 text-sm">
              {showGoalForm ? "Close form" : "New goal"}
            </button>
          </div>

          {showGoalForm ? (
            <div className="card mb-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Goal type</label>
                  <select
                    value={newGoalTitle}
                    onChange={(event) => {
                      const selected = GOAL_PRESETS.find((goal) => goal.title === event.target.value);
                      setNewGoalTitle(event.target.value);
                      setNewGoalIcon(selected?.icon || "??");
                    }}
                    className="input-field"
                  >
                    <option value="">Select a goal</option>
                    {GOAL_PRESETS.map((goal) => (
                      <option key={goal.title} value={goal.title}>
                        {goal.title}
                      </option>
                    ))}
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Icon</label>
                  <input value={newGoalIcon} onChange={(event) => setNewGoalIcon(event.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Target amount</label>
                  <input value={newGoalTarget} onChange={(event) => setNewGoalTarget(event.target.value)} className="input-field" type="number" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Already saved</label>
                  <input value={newGoalSaved} onChange={(event) => setNewGoalSaved(event.target.value)} className="input-field" type="number" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Deadline</label>
                  <input value={newGoalDeadline} onChange={(event) => setNewGoalDeadline(event.target.value)} className="input-field" type="month" />
                </div>
              </div>
              <button onClick={createGoal} className="btn-primary mt-5 px-5 py-3 text-sm">
                Save goal
              </button>
            </div>
          ) : null}

          <div className="space-y-4">
            {data.goals.length > 0 ? (
              data.goals.map((goal) => (
                <div key={goal.id} className="card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{goal.icon || "??"}</span>
                      <div>
                        <p className="text-lg font-extrabold text-slate-900">{goal.title}</p>
                        <p className="text-sm text-slate-500">{goal.deadline || "Flexible deadline"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-slate-900">{formatCurrency(goal.savedAmount)}</p>
                      <p className="text-sm text-slate-500">of {formatCurrency(goal.targetAmount || 0)}</p>
                    </div>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[#1A73E8]" style={{ width: `${goal.progress}%` }} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                    <span>{goal.progress}% complete</span>
                    <span>{formatCurrency(goal.remainingAmount || 0)} still needed</span>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">Rs</span>
                      <input
                        value={contribution[goal.id] || ""}
                        onChange={(event) => setContribution((current) => ({ ...current, [goal.id]: event.target.value }))}
                        placeholder="Add money"
                        type="number"
                        className="input-field pl-12"
                      />
                    </div>
                    <button onClick={() => onAddMoney(goal)} className="btn-primary px-5 py-3 text-sm">
                      Add
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="card p-6">
                <EmptyState title="No savings goals yet" body="Create your first goal to start building progress bars and contributions." />
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="eyebrow">Debts</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">EMI tracking</h2>
            </div>
            <button onClick={() => setShowDebtForm(!showDebtForm)} className="btn-secondary px-5 py-3 text-sm">
              {showDebtForm ? "Close form" : "Add debt"}
            </button>
          </div>

          {showDebtForm ? (
            <div className="card mb-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <input value={debtName} onChange={(event) => setDebtName(event.target.value)} placeholder="Debt name" className="input-field" />
                <input value={debtAmount} onChange={(event) => setDebtAmount(event.target.value)} placeholder="Total amount" type="number" className="input-field" />
                <input value={debtEmi} onChange={(event) => setDebtEmi(event.target.value)} placeholder="Monthly EMI" type="number" className="input-field" />
                <input value={debtPaid} onChange={(event) => setDebtPaid(event.target.value)} placeholder="Already paid" type="number" className="input-field" />
              </div>
              <button onClick={createDebt} className="btn-primary mt-5 px-5 py-3 text-sm">
                Save debt
              </button>
            </div>
          ) : null}

          <div className="card mb-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <MiniMetric label="Debt left" value={formatCurrency(data.overview.totalDebt)} helper="Outstanding balance" />
              <MiniMetric label="Monthly EMI" value={formatCurrency(data.overview.totalEMI)} helper="Current monthly outflow" />
            </div>
          </div>

          <div className="space-y-4">
            {data.debts.length > 0 ? (
              data.debts.map((debt) => (
                <div key={debt.id} className="card p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-extrabold text-slate-900">{debt.name}</p>
                      <p className="text-sm text-slate-500">EMI {formatCurrency(debt.monthlyEMI)} per month</p>
                    </div>
                    <div className="rounded-full bg-[#FFF3E0] px-3 py-1 text-xs font-bold text-[#F29900]">
                      {debt.progress}% paid
                    </div>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[#0F9D58]" style={{ width: `${debt.progress}%` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                    <span>Paid {formatCurrency(debt.paidAmount)}</span>
                    <span>{formatCurrency(debt.remaining)} remaining</span>
                  </div>
                  <button onClick={() => onPayDebt(debt)} className="btn-primary mt-4 w-full py-3 text-sm">
                    Mark EMI paid
                  </button>
                </div>
              ))
            ) : (
              <div className="card p-6">
                <EmptyState title="No debts tracked" body="Add loans or EMIs here to monitor payoff progress." />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: "red" | "green" | "blue" }) {
  const tones = {
    red: "bg-[#FDECEC] text-[#D93025]",
    green: "bg-[#E9F7EF] text-[#0F9D58]",
    blue: "bg-[#E8F0FE] text-[#1A73E8]",
  } as const;

  return (
    <div className={`rounded-[22px] p-4 ${tones[tone]}`}>
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-[22px] bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-extrabold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

function AutoRule({ merchant, category }: { merchant: string; category: string }) {
  return (
    <div className="rounded-[22px] bg-slate-50 p-4">
      <p className="text-sm font-bold text-slate-900">{merchant}</p>
      <p className="mt-1 text-sm text-slate-500">Auto-maps to {category}</p>
    </div>
  );
}

function TransactionRow({ transaction, compact = false }: { transaction: Transaction; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 border-b border-slate-100 px-5 ${compact ? "py-4" : "py-5"} last:border-b-0`}>
      <div
        className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
        style={{ backgroundColor: getCategoryBgColor(transaction.category) }}
      >
        {getCategoryIcon(transaction.category)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-slate-900">{transaction.title}</p>
        <p className="text-sm text-slate-500">{transaction.category} • {transaction.date}</p>
      </div>
      <p className="font-extrabold text-slate-900">-{formatCurrency(transaction.amount)}</p>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="p-6 text-center">
      <p className="text-lg font-extrabold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{body}</p>
    </div>
  );
}

function getAlertTone(type: AlertItem["type"]) {
  if (type === "danger") return "bg-[#FDECEC] text-[#D93025]";
  if (type === "warning") return "bg-[#FFF3E0] text-[#F29900]";
  if (type === "success") return "bg-[#E9F7EF] text-[#0F9D58]";
  return "bg-[#E8F0FE] text-[#1A73E8]";
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-[#FAFBFC] px-5 py-10">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="h-20 animate-pulse rounded-[28px] bg-white" />
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="h-72 animate-pulse rounded-[28px] bg-white lg:col-span-2" />
          <div className="h-72 animate-pulse rounded-[28px] bg-white" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-44 animate-pulse rounded-[28px] bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
}

