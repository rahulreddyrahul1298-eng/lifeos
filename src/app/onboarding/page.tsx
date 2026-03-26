"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const PRESET_HABITS = ["Gym", "Study", "Reading", "Meditation", "Drink Water", "Running"];
const OCCUPATIONS = [
  { id: "student", label: "Student", desc: "College / School" },
  { id: "employee", label: "Employee", desc: "Salaried / Working" },
  { id: "freelancer", label: "Freelancer", desc: "Self-employed" },
  { id: "business", label: "Business Owner", desc: "Own business" },
];

const CATEGORY_SUGGESTIONS: Record<string, { category: string; studentDefault: number; employeeDefault: number }[]> = {
  student: [
    { category: "Food", studentDefault: 3000, employeeDefault: 5000 },
    { category: "Transport", studentDefault: 1000, employeeDefault: 3000 },
    { category: "Education", studentDefault: 2000, employeeDefault: 1000 },
    { category: "Entertainment", studentDefault: 1000, employeeDefault: 2000 },
    { category: "Shopping", studentDefault: 1500, employeeDefault: 3000 },
    { category: "Bills", studentDefault: 500, employeeDefault: 2000 },
    { category: "Health", studentDefault: 500, employeeDefault: 1000 },
    { category: "Other", studentDefault: 500, employeeDefault: 1000 },
  ],
  employee: [],
  freelancer: [],
  business: [],
};
CATEGORY_SUGGESTIONS.employee = CATEGORY_SUGGESTIONS.student;
CATEGORY_SUGGESTIONS.freelancer = CATEGORY_SUGGESTIONS.student;
CATEGORY_SUGGESTIONS.business = CATEGORY_SUGGESTIONS.student;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [occupation, setOccupation] = useState("");

  // Step 2
  const [income, setIncome] = useState("");
  const [budget, setBudget] = useState("");

  // Step 3
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>({});

  // Step 4
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [customHabit, setCustomHabit] = useState("");

  // Step 5
  const [goals, setGoals] = useState<string[]>([]);
  const [goalInput, setGoalInput] = useState("");

  const toggleHabit = (habit: string) => {
    setSelectedHabits((prev) => prev.includes(habit) ? prev.filter((h) => h !== habit) : [...prev, habit]);
  };
  const addCustomHabit = () => {
    if (customHabit.trim() && !selectedHabits.includes(customHabit.trim())) {
      setSelectedHabits((prev) => [...prev, customHabit.trim()]);
      setCustomHabit("");
    }
  };
  const addGoal = () => {
    if (goalInput.trim() && !goals.includes(goalInput.trim())) {
      setGoals((prev) => [...prev, goalInput.trim()]);
      setGoalInput("");
    }
  };
  const removeGoal = (goal: string) => setGoals((prev) => prev.filter((g) => g !== goal));

  const fillDefaults = (occ: string) => {
    setOccupation(occ);
    const suggestions = CATEGORY_SUGGESTIONS[occ] || CATEGORY_SUGGESTIONS.student;
    const defaults: Record<string, string> = {};
    suggestions.forEach((s) => {
      const val = occ === "student" ? s.studentDefault : s.employeeDefault;
      defaults[s.category] = String(val);
    });
    setCategoryBudgets(defaults);
  };

  const totalCategoryBudget = Object.values(categoryBudgets).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  const projectedSavings = (parseFloat(income) || 0) - (parseFloat(budget) || 0);

  const handleComplete = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          income: parseFloat(income) || 0,
          budget: parseFloat(budget) || 0,
          habits: selectedHabits,
          goals,
        }),
      });

      if (res.ok) {
        for (const [category, limit] of Object.entries(categoryBudgets)) {
          if (parseFloat(limit) > 0) {
            await fetch("/api/category-budgets", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ category, limit }),
            });
          }
        }
        router.push("/dashboard");
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const totalSteps = 6;
  const progress = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-xl font-bold text-gray-900">
            Life<span className="text-indigo-500">OS</span>
          </span>
          <div className="mt-6 w-full bg-gray-200 rounded-full h-1">
            <div
              className="bg-indigo-500 h-1 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">Step {step} of {totalSteps}</p>
        </div>

        <div className="card p-8">

          {/* Step 1: Occupation */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Tell us about yourself</h2>
                <p className="text-sm text-gray-500">This helps us personalize your experience.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {OCCUPATIONS.map((occ) => (
                  <button key={occ.id} onClick={() => fillDefaults(occ.id)}
                    className={`p-4 rounded-lg text-left transition-all border ${
                      occupation === occ.id
                        ? "bg-indigo-50 border-indigo-300"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}>
                    <div className="text-sm font-semibold text-gray-900">{occ.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{occ.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Income & Budget */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Your monthly finances</h2>
                <p className="text-sm text-gray-500">
                  {occupation === "student" ? "How much do you get monthly (pocket money, part-time, etc.)?" : "What's your monthly income and spending goal?"}
                </p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 font-medium mb-1.5">
                  {occupation === "student" ? "Monthly Money (₹)" : "Monthly Income (₹)"}
                </label>
                <input type="number" value={income} onChange={(e) => setIncome(e.target.value)}
                  placeholder={occupation === "student" ? "e.g. 10000" : "e.g. 50000"} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 font-medium mb-1.5">Monthly Spending Limit (₹)</label>
                <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)}
                  placeholder={occupation === "student" ? "e.g. 8000" : "e.g. 30000"} className="input-field" />
              </div>
              {income && budget && (
                <div className={`rounded-lg p-4 border text-sm ${projectedSavings >= 0 ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"}`}>
                  {projectedSavings >= 0
                    ? `You'll save ~₹${projectedSavings.toLocaleString()} per month. Great plan.`
                    : `Your spending goal is higher than your income. Consider reducing it.`}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Category Budgets */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Split your budget</h2>
                <p className="text-sm text-gray-500">How much will you spend on each category? Adjust the suggested amounts to fit your needs.</p>
              </div>
              <div className="space-y-3">
                {(CATEGORY_SUGGESTIONS[occupation] || CATEGORY_SUGGESTIONS.student).map((cat) => (
                  <div key={cat.category} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 w-28">{cat.category}</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                      <input type="number"
                        value={categoryBudgets[cat.category] || ""}
                        onChange={(e) => setCategoryBudgets({ ...categoryBudgets, [cat.category]: e.target.value })}
                        className="input-field pl-7 text-sm" placeholder="0" />
                    </div>
                  </div>
                ))}
              </div>
              <div className={`rounded-lg p-3 border text-sm text-center ${
                totalCategoryBudget <= (parseFloat(budget) || 0)
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-amber-50 border-amber-200 text-amber-700"
              }`}>
                Total: ₹{totalCategoryBudget.toLocaleString()} / ₹{(parseFloat(budget) || 0).toLocaleString()} budget
                {totalCategoryBudget > (parseFloat(budget) || 0) && " — Exceeds your budget"}
              </div>
            </div>
          )}

          {/* Step 4: Habits */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Daily habits</h2>
                <p className="text-sm text-gray-500">Pick habits you want to build. Start small — 2 or 3 is perfect.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {PRESET_HABITS.map((habit) => (
                  <button key={habit} onClick={() => toggleHabit(habit)}
                    className={`p-3 rounded-lg text-sm font-medium text-left transition-all border ${
                      selectedHabits.includes(habit)
                        ? "bg-indigo-50 border-indigo-300 text-indigo-600"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}>{habit}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={customHabit} onChange={(e) => setCustomHabit(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomHabit()}
                  placeholder="Add custom habit..." className="input-field flex-1" />
                <button onClick={addCustomHabit} className="btn-primary px-4 py-2.5 text-sm">Add</button>
              </div>
              {selectedHabits.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedHabits.filter(h => !PRESET_HABITS.includes(h)).map((h, i) => (
                    <span key={i} className="bg-indigo-50 text-indigo-600 text-xs px-3 py-1 rounded-full border border-indigo-200">
                      {h}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Goals */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Your goals</h2>
                <p className="text-sm text-gray-500">What do you want to achieve this month?</p>
              </div>
              <div className="flex gap-2">
                <input type="text" value={goalInput} onChange={(e) => setGoalInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addGoal()}
                  placeholder={occupation === "student" ? "e.g. Score 80%+ in exams" : "e.g. Save ₹10,000/month"} className="input-field flex-1" />
                <button onClick={addGoal} className="btn-primary px-4 py-2.5 text-sm">Add</button>
              </div>
              <div className="space-y-2">
                {goals.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Add goals to stay motivated</p>}
                {goals.map((goal, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                    <span className="text-sm text-gray-700">{goal}</span>
                    <button onClick={() => removeGoal(goal)} className="text-gray-400 hover:text-red-500 text-sm transition-colors">
                      &#10005;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Summary */}
          {step === 6 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Here&apos;s your plan</h2>
                <p className="text-sm text-gray-500">Review and start tracking.</p>
              </div>

              {/* Financial Summary */}
              <div className="rounded-lg p-4 border border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-400 font-medium mb-3">Financial Plan</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">₹{(parseFloat(income) || 0).toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400">Income</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">₹{(parseFloat(budget) || 0).toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400">Spending Limit</div>
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${projectedSavings >= 0 ? "text-green-600" : "text-red-500"}`}>
                      ₹{Math.abs(projectedSavings).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-gray-400">{projectedSavings >= 0 ? "Savings" : "Deficit"}</div>
                  </div>
                </div>
              </div>

              {/* Category Budgets */}
              <div className="rounded-lg p-4 border border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-400 font-medium mb-3">Category Limits</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(categoryBudgets).filter(([, v]) => parseFloat(v) > 0).map(([cat, val]) => (
                    <div key={cat} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2 border border-gray-100">
                      <span className="text-gray-700">{cat}</span>
                      <span className="text-indigo-500 font-semibold">₹{parseFloat(val).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Habits */}
              <div className="rounded-lg p-4 border border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-400 font-medium mb-3">Habits ({selectedHabits.length})</p>
                <div className="flex flex-wrap gap-2">
                  {selectedHabits.map((h, i) => (
                    <span key={i} className="bg-white text-gray-700 text-xs px-3 py-1.5 rounded-full border border-gray-200">{h}</span>
                  ))}
                  {selectedHabits.length === 0 && <span className="text-xs text-gray-400">None selected</span>}
                </div>
              </div>

              {/* Goals */}
              <div className="rounded-lg p-4 border border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-400 font-medium mb-3">Goals ({goals.length})</p>
                <div className="space-y-1">
                  {goals.map((g, i) => (<p key={i} className="text-xs text-gray-700">{g}</p>))}
                  {goals.length === 0 && <span className="text-xs text-gray-400">None set</span>}
                </div>
              </div>

              {/* Savings projection */}
              {projectedSavings > 0 && (
                <div className="rounded-lg p-4 border border-green-200 bg-green-50 text-center">
                  <p className="text-sm font-medium text-green-700">
                    If you stick to this plan, you&apos;ll save ₹{(projectedSavings * 12).toLocaleString()} this year.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">
                Back
              </button>
            ) : <div />}
            {step < 6 ? (
              <button onClick={() => setStep(step + 1)}
                disabled={step === 1 && !occupation}
                className="btn-primary px-6 py-2.5 text-sm disabled:opacity-40">
                Continue
              </button>
            ) : (
              <button onClick={handleComplete} disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                {loading ? "Setting up..." : "Start My Journey"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
