"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BANKS,
  CATEGORIES,
  GOAL_PRESETS,
  OCCUPATIONS,
  formatCurrency,
  getSmartDefaults,
  normalizeAmount,
} from "@/lib/utils";

type GoalEntry = {
  title: string;
  icon: string;
  targetAmount: string;
  savedAmount: string;
  deadline: string;
};

type DebtEntry = {
  name: string;
  totalAmount: string;
  monthlyEMI: string;
  paidAmount: string;
};

type CategoryBudgetEntry = {
  name: string;
  limit: number;
};

const steps = [
  "Who are you?",
  "Income and bank",
  "Choose categories",
  "Set budgets",
  "Savings goals",
  "Debts",
  "Review",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [occupation, setOccupation] = useState("");
  const [income, setIncome] = useState("");
  const [bank, setBank] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudgetEntry[]>([]);
  const [goals, setGoals] = useState<GoalEntry[]>([]);
  const [debts, setDebts] = useState<DebtEntry[]>([]);

  const incomeValue = normalizeAmount(income);
  const totalBudget = categoryBudgets.reduce((sum, category) => sum + category.limit, 0);
  const unallocated = Math.max(0, incomeValue - totalBudget);
  const overAllocated = Math.max(0, totalBudget - incomeValue);
  const completion = Math.round((step / steps.length) * 100);

  const selectedOccupation = OCCUPATIONS.find((item) => item.value === occupation);

  const reviewGoals = goals.filter((goal) => goal.title.trim());
  const reviewDebts = debts.filter((debt) => debt.name.trim() && normalizeAmount(debt.totalAmount) > 0);

  const budgetHealthTone = overAllocated > 0 ? "bg-[#FDECEC] text-[#D93025]" : "bg-[#E9F7EF] text-[#0F9D58]";

  const budgetSummary = useMemo(() => {
    if (incomeValue <= 0) return 0;
    return Math.min(100, Math.round((totalBudget / incomeValue) * 100));
  }, [incomeValue, totalBudget]);

  function moveToBudgetStep() {
    const defaults = getSmartDefaults(incomeValue, occupation);
    setCategoryBudgets(
      selectedCategories.map((name) => ({
        name,
        limit: defaults[name] || 0,
      }))
    );
    setStep(4);
  }

  function toggleCategory(name: string) {
    setSelectedCategories((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name]
    );
  }

  function updateBudget(name: string, value: string) {
    const limit = Math.max(0, Math.round(normalizeAmount(value)));
    setCategoryBudgets((current) =>
      current.map((category) =>
        category.name === name ? { ...category, limit } : category
      )
    );
  }

  function toggleGoal(title: string, icon: string) {
    setGoals((current) => {
      const exists = current.some((goal) => goal.title === title);
      if (exists) return current.filter((goal) => goal.title !== title);
      return [
        ...current,
        { title, icon, targetAmount: "", savedAmount: "", deadline: "" },
      ];
    });
  }

  function updateGoal(title: string, field: keyof GoalEntry, value: string) {
    setGoals((current) =>
      current.map((goal) =>
        goal.title === title ? { ...goal, [field]: value } : goal
      )
    );
  }

  function addDebt() {
    setDebts((current) => [
      ...current,
      { name: "", totalAmount: "", monthlyEMI: "", paidAmount: "" },
    ]);
  }

  function updateDebt(index: number, field: keyof DebtEntry, value: string) {
    setDebts((current) =>
      current.map((debt, currentIndex) =>
        currentIndex === index ? { ...debt, [field]: value } : debt
      )
    );
  }

  function removeDebt(index: number) {
    setDebts((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  async function submitOnboarding() {
    setLoading(true);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occupation,
          bank,
          income: incomeValue,
          categories: categoryBudgets.map((category) => ({
            name: category.name,
            limit: category.limit,
          })),
          goals: reviewGoals.map((goal) => ({
            title: goal.title,
            icon: goal.icon,
            targetAmount: normalizeAmount(goal.targetAmount),
            savedAmount: normalizeAmount(goal.savedAmount),
            deadline: goal.deadline || null,
          })),
          debts: reviewDebts.map((debt) => ({
            name: debt.name,
            totalAmount: normalizeAmount(debt.totalAmount),
            monthlyEMI: normalizeAmount(debt.monthlyEMI),
            paidAmount: normalizeAmount(debt.paidAmount),
          })),
        }),
      });

      if (response.ok) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Onboarding failed", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-4">
          <div>
            <p className="eyebrow">LifeOS setup</p>
            <h1 className="mt-1 text-lg font-extrabold text-slate-900">{steps[step - 1]}</h1>
          </div>
          {step > 1 ? (
            <button
              onClick={() => setStep((current) => current - 1)}
              className="text-sm font-semibold text-[#1A73E8]"
            >
              Back
            </button>
          ) : (
            <span className="text-sm font-semibold text-slate-400">1 of 7</span>
          )}
        </div>
        <div className="mx-auto h-1 w-full max-w-2xl overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#1A73E8] to-[#4C9AFF] transition-all duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 pb-28">
        {step === 1 && (
          <section className="card p-6 sm:p-8">
            <p className="eyebrow">Step 1</p>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Who are you?</h2>
            <p className="mt-2 text-sm text-slate-500">
              We use this to prefill realistic budget ranges and savings suggestions.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {OCCUPATIONS.map((item) => {
                const active = item.value === occupation;
                return (
                  <button
                    key={item.value}
                    onClick={() => {
                      setOccupation(item.value);
                      setStep(2);
                    }}
                    className={`rounded-[22px] border p-5 text-left transition ${
                      active
                        ? "border-[#1A73E8] bg-[#E8F0FE]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{item.icon}</span>
                      <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-slate-500">
                        {item.label}
                      </span>
                    </div>
                    <p className="mt-4 text-lg font-bold text-slate-900">{item.label}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="card p-6 sm:p-8">
            <p className="eyebrow">Step 2</p>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Monthly income and bank</h2>
            <p className="mt-2 text-sm text-slate-500">
              {occupation === "freelancer" || occupation === "parttime"
                ? "Share your average monthly income so we can keep the budgets flexible."
                : "Share what comes in every month and where it usually lands."}
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Monthly income</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">Rs</span>
                  <input
                    type="number"
                    value={income}
                    onChange={(event) => setIncome(event.target.value)}
                    placeholder="50000"
                    className="input-field pl-14 text-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700">Primary bank</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {BANKS.map((item) => {
                    const active = bank === item;
                    return (
                      <button
                        key={item}
                        onClick={() => setBank(item)}
                        className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                          active
                            ? "border-[#1A73E8] bg-[#E8F0FE] text-[#1A73E8]"
                            : "border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={!income || !bank}
              className="btn-primary mt-8 w-full py-4 text-base"
            >
              Continue
            </button>
          </section>
        )}

        {step === 3 && (
          <section className="card p-6 sm:p-8">
            <p className="eyebrow">Step 3</p>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900">What do you spend on?</h2>
            <p className="mt-2 text-sm text-slate-500">
              Pick the categories that matter for your monthly budget.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {CATEGORIES.map((category) => {
                const active = selectedCategories.includes(category.name);
                return (
                  <button
                    key={category.name}
                    onClick={() => toggleCategory(category.name)}
                    className={`rounded-[22px] border p-4 text-left transition ${
                      active
                        ? "border-[#1A73E8] bg-[#E8F0FE]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                      style={{ backgroundColor: category.bgColor }}
                    >
                      {category.icon}
                    </div>
                    <p className="mt-4 text-base font-bold text-slate-900">{category.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {active ? "Included in your budget" : "Tap to add this category"}
                    </p>
                  </button>
                );
              })}
            </div>

            <button
              onClick={moveToBudgetStep}
              disabled={selectedCategories.length === 0}
              className="btn-primary mt-8 w-full py-4 text-base"
            >
              Continue with {selectedCategories.length} categories
            </button>
          </section>
        )}

        {step === 4 && (
          <section className="card p-6 sm:p-8">
            <p className="eyebrow">Step 4</p>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Set budget per category</h2>
            <p className="mt-2 text-sm text-slate-500">
              We prefilled smart defaults based on your profile. Adjust anything before you start.
            </p>

            <div className="card-soft mt-6 p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-500">Budget allocated</span>
                <span className="font-extrabold text-slate-900">{formatCurrency(totalBudget)}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full ${overAllocated > 0 ? "bg-[#D93025]" : "bg-[#0F9D58]"}`}
                  style={{ width: `${budgetSummary}%` }}
                />
              </div>
              <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${budgetHealthTone}`}>
                {overAllocated > 0
                  ? `${formatCurrency(overAllocated)} over your income`
                  : `${formatCurrency(unallocated)} stays free for saving or buffer`}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {categoryBudgets.map((category) => {
                const meta = CATEGORIES.find((item) => item.name === category.name);
                return (
                  <div key={category.name} className="rounded-[22px] border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-2xl text-xl"
                        style={{ backgroundColor: meta?.bgColor }}
                      >
                        {meta?.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">{category.name}</p>
                        <p className="text-sm text-slate-500">Monthly cap for this category</p>
                      </div>
                      <div className="relative w-32">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">Rs</span>
                        <input
                          type="number"
                          value={category.limit || ""}
                          onChange={(event) => updateBudget(category.name, event.target.value)}
                          className="input-field pl-12 text-right font-bold"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={() => setStep(5)} className="btn-primary mt-8 w-full py-4 text-base">
              Continue
            </button>
          </section>
        )}

        {step === 5 && (
          <section className="card p-6 sm:p-8">
            <p className="eyebrow">Step 5</p>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Savings goals</h2>
            <p className="mt-2 text-sm text-slate-500">
              Add the goals you want to actively save toward this year.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {GOAL_PRESETS.map((goal) => {
                const active = goals.some((item) => item.title === goal.title);
                return (
                  <button
                    key={goal.title}
                    onClick={() => toggleGoal(goal.title, goal.icon)}
                    className={`rounded-[22px] border p-4 text-left transition ${
                      active
                        ? "border-[#1A73E8] bg-[#E8F0FE]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="text-3xl">{goal.icon}</div>
                    <p className="mt-4 text-base font-bold text-slate-900">{goal.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {active ? "Included in your plan" : "Tap to track this goal"}
                    </p>
                  </button>
                );
              })}
            </div>

            {goals.length > 0 && (
              <div className="mt-6 space-y-4">
                {goals.map((goal) => (
                  <div key={goal.title} className="rounded-[22px] border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{goal.icon}</span>
                      <div>
                        <p className="font-bold text-slate-900">{goal.title}</p>
                        <p className="text-sm text-slate-500">Set target, saved amount, and timeline</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Target amount</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">Rs</span>
                          <input
                            type="number"
                            value={goal.targetAmount}
                            onChange={(event) => updateGoal(goal.title, "targetAmount", event.target.value)}
                            className="input-field pl-12"
                            placeholder="200000"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Already saved</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">Rs</span>
                          <input
                            type="number"
                            value={goal.savedAmount}
                            onChange={(event) => updateGoal(goal.title, "savedAmount", event.target.value)}
                            className="input-field pl-12"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Deadline</label>
                        <input
                          type="month"
                          value={goal.deadline}
                          onChange={(event) => updateGoal(goal.title, "deadline", event.target.value)}
                          className="input-field"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setStep(6)} className="btn-primary mt-8 w-full py-4 text-base">
              {goals.length > 0 ? "Continue" : "Skip for now"}
            </button>
          </section>
        )}

        {step === 6 && (
          <section className="card p-6 sm:p-8">
            <p className="eyebrow">Step 6</p>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Any debts?</h2>
            <p className="mt-2 text-sm text-slate-500">
              Add loans or debt balances so LifeOS can track EMIs and payoff progress.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDebts([])}
                className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-bold ${
                  debts.length === 0
                    ? "border-[#1A73E8] bg-[#E8F0FE] text-[#1A73E8]"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                No debt right now
              </button>
              <button
                onClick={() => {
                  if (debts.length === 0) addDebt();
                }}
                className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-bold ${
                  debts.length > 0
                    ? "border-[#1A73E8] bg-[#E8F0FE] text-[#1A73E8]"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                Yes, add debt
              </button>
            </div>

            {debts.length > 0 && (
              <div className="mt-6 space-y-4">
                {debts.map((debt, index) => (
                  <div key={`${index}-${debt.name}`} className="rounded-[22px] border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">Debt {index + 1}</p>
                      <button
                        onClick={() => removeDebt(index)}
                        className="text-sm font-semibold text-[#D93025]"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <input
                        value={debt.name}
                        onChange={(event) => updateDebt(index, "name", event.target.value)}
                        placeholder="Education loan"
                        className="input-field"
                      />
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">Rs</span>
                        <input
                          type="number"
                          value={debt.totalAmount}
                          onChange={(event) => updateDebt(index, "totalAmount", event.target.value)}
                          placeholder="Total amount"
                          className="input-field pl-12"
                        />
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">Rs</span>
                        <input
                          type="number"
                          value={debt.monthlyEMI}
                          onChange={(event) => updateDebt(index, "monthlyEMI", event.target.value)}
                          placeholder="Monthly EMI"
                          className="input-field pl-12"
                        />
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">Rs</span>
                        <input
                          type="number"
                          value={debt.paidAmount}
                          onChange={(event) => updateDebt(index, "paidAmount", event.target.value)}
                          placeholder="Already paid"
                          className="input-field pl-12"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button onClick={addDebt} className="btn-secondary w-full py-3 text-sm">
                  Add another debt
                </button>
              </div>
            )}

            <button onClick={() => setStep(7)} className="btn-primary mt-8 w-full py-4 text-base">
              Continue
            </button>
          </section>
        )}

        {step === 7 && (
          <section className="space-y-4">
            <div className="card p-6 sm:p-8">
              <p className="eyebrow">Step 7</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Review and start</h2>
              <p className="mt-2 text-sm text-slate-500">
                You can always update these later, but this gives you a strong finance baseline from day one.
              </p>
            </div>

            <div className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Profile</p>
                  <p className="mt-2 text-xl font-extrabold text-slate-900">
                    {selectedOccupation?.label || "Not selected"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Bank: {bank || "Not selected"}</p>
                </div>
                <div className="rounded-2xl bg-[#E8F0FE] px-4 py-3 text-right">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A73E8]">Income</p>
                  <p className="mt-1 text-xl font-extrabold text-slate-900">{formatCurrency(incomeValue)}</p>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between">
                <p className="eyebrow">Budget plan</p>
                <span className="text-sm font-bold text-slate-900">{formatCurrency(totalBudget)}</span>
              </div>
              <div className="mt-4 space-y-3">
                {categoryBudgets.map((category) => {
                  const meta = CATEGORIES.find((item) => item.name === category.name);
                  return (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-2xl"
                          style={{ backgroundColor: meta?.bgColor }}
                        >
                          {meta?.icon}
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{category.name}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(category.limit)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                {overAllocated > 0
                  ? `${formatCurrency(overAllocated)} is over your income. Consider trimming a category before you start.`
                  : `${formatCurrency(unallocated)} remains free for savings or surprise spends.`}
              </div>
            </div>

            {reviewGoals.length > 0 && (
              <div className="card p-5">
                <p className="eyebrow">Goals</p>
                <div className="mt-4 space-y-3">
                  {reviewGoals.map((goal) => (
                    <div key={goal.title} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{goal.icon}</span>
                        <div>
                          <p className="font-bold text-slate-900">{goal.title}</p>
                          <p className="text-sm text-slate-500">Deadline: {goal.deadline || "Flexible"}</p>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-bold text-slate-900">{formatCurrency(normalizeAmount(goal.targetAmount))}</p>
                        <p className="text-slate-500">Saved: {formatCurrency(normalizeAmount(goal.savedAmount))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reviewDebts.length > 0 && (
              <div className="card p-5">
                <p className="eyebrow">Debts</p>
                <div className="mt-4 space-y-3">
                  {reviewDebts.map((debt) => (
                    <div key={debt.name} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                      <div>
                        <p className="font-bold text-slate-900">{debt.name}</p>
                        <p className="text-sm text-slate-500">EMI: {formatCurrency(normalizeAmount(debt.monthlyEMI))}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-bold text-slate-900">{formatCurrency(normalizeAmount(debt.totalAmount))}</p>
                        <p className="text-slate-500">Paid: {formatCurrency(normalizeAmount(debt.paidAmount))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={submitOnboarding}
              disabled={loading}
              className="btn-primary w-full py-4 text-base"
            >
              {loading ? "Saving your finance setup..." : "Start with LifeOS"}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}

