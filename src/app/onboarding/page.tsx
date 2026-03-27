"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  OCCUPATIONS,
  BANKS,
  CATEGORIES,
  GOAL_PRESETS,
  getSmartDefaults,
} from "@/lib/utils";

type GoalEntry = {
  title: string;
  icon: string;
  targetAmount: string;
  deadline: string;
};

type DebtEntry = {
  name: string;
  totalAmount: string;
  monthlyEMI: string;
};

type CategoryEntry = {
  name: string;
  limit: number;
  icon: string;
  color: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [occupation, setOccupation] = useState("");
  // Step 2
  const [income, setIncome] = useState("");
  const [bank, setBank] = useState("");
  // Step 3
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  // Step 4
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryEntry[]>([]);
  // Step 5
  const [goals, setGoals] = useState<GoalEntry[]>([]);
  // Step 6
  const [hasDebts, setHasDebts] = useState(false);
  const [debts, setDebts] = useState<DebtEntry[]>([]);

  const totalSteps = 7;
  const progressPct = Math.round((step / totalSteps) * 100);

  function toggleCategory(name: string) {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  }

  function toggleGoal(preset: typeof GOAL_PRESETS[number]) {
    setGoals((prev) => {
      const exists = prev.find((g) => g.title === preset.title);
      if (exists) return prev.filter((g) => g.title !== preset.title);
      return [...prev, { title: preset.title, icon: preset.icon, targetAmount: "", deadline: "" }];
    });
  }

  function goToStep4() {
    const inc = parseFloat(income) || 0;
    const defaults = getSmartDefaults(inc, occupation);
    const budgets: CategoryEntry[] = selectedCategories.map((name) => {
      const cat = CATEGORIES.find((c) => c.name === name);
      return {
        name,
        limit: defaults[name] || Math.round(inc * 0.05 / 100) * 100 || 1000,
        icon: cat?.icon || "📦",
        color: cat?.color || "#636E72",
      };
    });
    setCategoryBudgets(budgets);
    setStep(4);
  }

  function updateBudget(name: string, val: string) {
    setCategoryBudgets((prev) =>
      prev.map((c) => (c.name === name ? { ...c, limit: parseInt(val) || 0 } : c))
    );
  }

  function updateGoalField(title: string, field: "targetAmount" | "deadline", val: string) {
    setGoals((prev) =>
      prev.map((g) => (g.title === title ? { ...g, [field]: val } : g))
    );
  }

  function addDebt() {
    setDebts((prev) => [...prev, { name: "", totalAmount: "", monthlyEMI: "" }]);
  }

  function updateDebt(idx: number, field: keyof DebtEntry, val: string) {
    setDebts((prev) => prev.map((d, i) => (i === idx ? { ...d, [field]: val } : d)));
  }

  function removeDebt(idx: number) {
    setDebts((prev) => prev.filter((_, i) => i !== idx));
  }

  const totalBudget = categoryBudgets.reduce((s, c) => s + c.limit, 0);
  const incomeNum = parseFloat(income) || 0;
  const unallocated = incomeNum - totalBudget;

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occupation,
          bank,
          income: incomeNum,
          categories: categoryBudgets.map((c) => ({ name: c.name, limit: c.limit })),
          goals: goals
            .filter((g) => g.targetAmount)
            .map((g) => ({
              title: g.title,
              icon: g.icon,
              targetAmount: parseFloat(g.targetAmount) || 0,
              deadline: g.deadline || null,
            })),
          debts: debts
            .filter((d) => d.name && d.totalAmount)
            .map((d) => ({
              name: d.name,
              totalAmount: parseFloat(d.totalAmount) || 0,
              monthlyEMI: parseFloat(d.monthlyEMI) || 0,
            })),
        }),
      });
      if (res.ok) {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Onboarding failed:", err);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="max-w-lg mx-auto px-6 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Step {step} of {totalSteps}</span>
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="text-sm font-medium text-indigo-600"
            >
              Back
            </button>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 pt-24 pb-32">
        {/* STEP 1: Occupation */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Who are you?</h1>
            <p className="text-gray-500 mb-8">This helps us personalize your budget</p>
            <div className="grid grid-cols-2 gap-3">
              {OCCUPATIONS.map((occ) => (
                <button
                  key={occ.value}
                  onClick={() => { setOccupation(occ.value); setStep(2); }}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    occupation === occ.value
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  }`}
                >
                  <span className="text-2xl">{occ.icon}</span>
                  <p className="font-semibold text-gray-900 mt-2 text-sm">{occ.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{occ.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Income & Bank */}
        {step === 2 && (
          <div className="animate-fadeIn">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Income</h1>
            <p className="text-gray-500 mb-8">
              {occupation === "parttime" || occupation === "freelancer"
                ? "Enter your average monthly income"
                : "How much do you earn per month?"}
            </p>

            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Monthly Income
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  placeholder="50000"
                  className="input-field pl-8 text-lg font-semibold"
                />
              </div>
            </div>

            <div className="mb-8">
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Primary Bank
              </label>
              <div className="grid grid-cols-3 gap-2">
                {BANKS.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBank(b)}
                    className={`p-2.5 rounded-xl text-sm font-medium transition-all ${
                      bank === b
                        ? "bg-indigo-500 text-white"
                        : "bg-white border border-gray-100 text-gray-700 hover:border-gray-200"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={!income}
              className="btn-primary w-full py-3.5 text-base disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        )}

        {/* STEP 3: Categories */}
        {step === 3 && (
          <div className="animate-fadeIn">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">What do you spend on?</h1>
            <p className="text-gray-500 mb-8">Select your spending categories</p>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => {
                const selected = selectedCategories.includes(cat.name);
                return (
                  <button
                    key={cat.name}
                    onClick={() => toggleCategory(cat.name)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      selected
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-100 bg-white hover:border-gray-200"
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ backgroundColor: cat.bgColor }}
                    >
                      {cat.icon}
                    </div>
                    <p className="font-medium text-gray-900 mt-2 text-sm">{cat.name}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-6">
              <button
                onClick={goToStep4}
                disabled={selectedCategories.length === 0}
                className="btn-primary w-full py-3.5 text-base disabled:opacity-40"
              >
                Continue ({selectedCategories.length} selected)
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Set Budgets */}
        {step === 4 && (
          <div className="animate-fadeIn">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Set Your Budget</h1>
            <p className="text-gray-500 mb-6">We pre-filled smart defaults. Adjust as needed.</p>

            <div className="card p-4 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Allocated</span>
                <span className={`font-semibold ${unallocated < 0 ? "text-red-500" : "text-green-600"}`}>
                  ₹{totalBudget.toLocaleString()} / ₹{incomeNum.toLocaleString()}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    unallocated < 0 ? "bg-red-500" : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(100, (totalBudget / Math.max(1, incomeNum)) * 100)}%` }}
                />
              </div>
              <p className="text-xs mt-1.5 text-gray-400">
                {unallocated >= 0
                  ? `₹${unallocated.toLocaleString()} unallocated (savings)`
                  : `₹${Math.abs(unallocated).toLocaleString()} over budget!`}
              </p>
            </div>

            <div className="space-y-3">
              {categoryBudgets.map((cat) => (
                <div key={cat.name} className="card p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                    </div>
                    <div className="relative w-28">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                      <input
                        type="number"
                        value={cat.limit || ""}
                        onChange={(e) => updateBudget(cat.name, e.target.value)}
                        className="input-field pl-7 text-right text-sm font-semibold py-2"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(5)}
              className="btn-primary w-full py-3.5 text-base mt-6"
            >
              Continue
            </button>
          </div>
        )}

        {/* STEP 5: Goals */}
        {step === 5 && (
          <div className="animate-fadeIn">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Savings Goals</h1>
            <p className="text-gray-500 mb-8">What are you saving for?</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {GOAL_PRESETS.map((preset) => {
                const selected = goals.some((g) => g.title === preset.title);
                return (
                  <button
                    key={preset.title}
                    onClick={() => toggleGoal(preset)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      selected
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-100 bg-white hover:border-gray-200"
                    }`}
                  >
                    <span className="text-2xl">{preset.icon}</span>
                    <p className="font-medium text-gray-900 mt-2 text-sm">{preset.title}</p>
                  </button>
                );
              })}
            </div>

            {goals.length > 0 && (
              <div className="space-y-3 mb-6">
                {goals.map((g) => (
                  <div key={g.title} className="card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span>{g.icon}</span>
                      <span className="font-medium text-sm text-gray-900">{g.title}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Target Amount</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                          <input
                            type="number"
                            value={g.targetAmount}
                            onChange={(e) => updateGoalField(g.title, "targetAmount", e.target.value)}
                            placeholder="200000"
                            className="input-field pl-7 text-sm py-2"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">By When</label>
                        <input
                          type="month"
                          value={g.deadline}
                          onChange={(e) => updateGoalField(g.title, "deadline", e.target.value)}
                          className="input-field text-sm py-2"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setStep(6)}
              className="btn-primary w-full py-3.5 text-base"
            >
              {goals.length > 0 ? "Continue" : "Skip for now"}
            </button>
          </div>
        )}

        {/* STEP 6: Debts */}
        {step === 6 && (
          <div className="animate-fadeIn">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Any Debts or Loans?</h1>
            <p className="text-gray-500 mb-8">This is optional. Helps track your repayments.</p>

            <div className="flex gap-3 mb-6">
              <button
                onClick={() => { setHasDebts(false); setDebts([]); }}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  !hasDebts ? "bg-green-500 text-white" : "bg-white border border-gray-200 text-gray-700"
                }`}
              >
                No Debts
              </button>
              <button
                onClick={() => { setHasDebts(true); if (debts.length === 0) addDebt(); }}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  hasDebts ? "bg-red-500 text-white" : "bg-white border border-gray-200 text-gray-700"
                }`}
              >
                Yes, I have
              </button>
            </div>

            {hasDebts && (
              <div className="space-y-3 mb-6">
                {debts.map((d, idx) => (
                  <div key={idx} className="card p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-900">Debt {idx + 1}</span>
                      <button onClick={() => removeDebt(idx)} className="text-red-400 text-sm">Remove</button>
                    </div>
                    <input
                      type="text"
                      value={d.name}
                      onChange={(e) => updateDebt(idx, "name", e.target.value)}
                      placeholder="e.g., Education Loan"
                      className="input-field text-sm py-2 mb-2"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                        <input
                          type="number"
                          value={d.totalAmount}
                          onChange={(e) => updateDebt(idx, "totalAmount", e.target.value)}
                          placeholder="Total amount"
                          className="input-field pl-7 text-sm py-2"
                        />
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                        <input
                          type="number"
                          value={d.monthlyEMI}
                          onChange={(e) => updateDebt(idx, "monthlyEMI", e.target.value)}
                          placeholder="Monthly EMI"
                          className="input-field pl-7 text-sm py-2"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addDebt}
                  className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 font-medium"
                >
                  + Add Another Debt
                </button>
              </div>
            )}

            <button
              onClick={() => setStep(7)}
              className="btn-primary w-full py-3.5 text-base"
            >
              Continue
            </button>
          </div>
        )}

        {/* STEP 7: Review */}
        {step === 7 && (
          <div className="animate-fadeIn">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Review & Start</h1>
            <p className="text-gray-500 mb-8">Here&apos;s your financial setup</p>

            <div className="card p-4 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Profile</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {OCCUPATIONS.find((o) => o.value === occupation)?.label}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Income</p>
                  <p className="font-bold text-lg text-gray-900">₹{incomeNum.toLocaleString()}</p>
                </div>
              </div>
              {bank && <p className="text-sm text-gray-500 mt-2">Bank: {bank}</p>}
            </div>

            <div className="card p-4 mb-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Monthly Budget</p>
              <div className="space-y-2">
                {categoryBudgets.map((c) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{c.icon}</span>
                      <span className="text-sm text-gray-700">{c.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">₹{c.limit.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between">
                <span className="text-sm font-medium text-gray-500">Total Allocated</span>
                <span className="text-sm font-bold text-gray-900">₹{totalBudget.toLocaleString()}</span>
              </div>
            </div>

            {goals.length > 0 && (
              <div className="card p-4 mb-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Savings Goals</p>
                {goals.map((g) => (
                  <div key={g.title} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <span>{g.icon}</span>
                      <span className="text-sm text-gray-700">{g.title}</span>
                    </div>
                    {g.targetAmount && (
                      <span className="text-sm font-semibold text-gray-900">
                        ₹{parseInt(g.targetAmount).toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {debts.length > 0 && debts[0].name && (
              <div className="card p-4 mb-6">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Debts</p>
                {debts.filter((d) => d.name).map((d, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-gray-700">{d.name}</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        ₹{parseInt(d.totalAmount || "0").toLocaleString()}
                      </span>
                      {d.monthlyEMI && (
                        <p className="text-xs text-gray-400">EMI: ₹{parseInt(d.monthlyEMI).toLocaleString()}/mo</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary w-full py-4 text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Setting up...
                </span>
              ) : (
                "Start Managing My Money"
              )}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
