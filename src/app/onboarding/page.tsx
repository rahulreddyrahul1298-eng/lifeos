"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const PRESET_HABITS = ["Gym", "Study", "Reading", "Meditation", "Drink Water", "Running"];
const OCCUPATIONS = [
  { id: "student", label: "Student", desc: "College / School", icon: "🎓", defaultHabits: ["Study", "Reading", "Drink Water"] },
  { id: "employee", label: "Employee", desc: "Salaried / Working", icon: "💼", defaultHabits: ["Gym", "Reading", "Meditation"] },
  { id: "freelancer", label: "Freelancer", desc: "Self-employed", icon: "🚀", defaultHabits: ["Gym", "Study", "Meditation"] },
  { id: "business", label: "Business Owner", desc: "Own business", icon: "🏢", defaultHabits: ["Gym", "Reading", "Meditation"] },
];

const GOAL_SUGGESTIONS: Record<string, string[]> = {
  student: ["Score 80%+ in exams", "Save pocket money", "Read 1 book/month"],
  employee: ["Save 20% of salary", "Gym 4x/week", "No impulse purchases"],
  freelancer: ["Save 30% of income", "Build a side project", "Network weekly"],
  business: ["Increase revenue 10%", "Read 2 books/month", "Exercise daily"],
};

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
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  // Step 1
  const [occupation, setOccupation] = useState("");

  // Step 2
  const [income, setIncome] = useState("");
  const [budget, setBudget] = useState("");
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>({});

  // Step 3
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [customHabit, setCustomHabit] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [goalInput, setGoalInput] = useState("");

  const fillDefaults = (occ: string) => {
    setOccupation(occ);
    const occData = OCCUPATIONS.find(o => o.id === occ);
    if (occData) setSelectedHabits(occData.defaultHabits);

    const suggestions = CATEGORY_SUGGESTIONS.student;
    const defaults: Record<string, string> = {};
    suggestions.forEach(s => {
      defaults[s.category] = String(occ === "student" ? s.studentDefault : s.employeeDefault);
    });
    setCategoryBudgets(defaults);

    // Auto-advance after selection
    setTimeout(() => { setDirection(1); setStep(2); }, 400);
  };

  const toggleHabit = (habit: string) => {
    setSelectedHabits(prev => prev.includes(habit) ? prev.filter(h => h !== habit) : [...prev, habit]);
  };

  const addCustomHabit = () => {
    if (customHabit.trim() && !selectedHabits.includes(customHabit.trim())) {
      setSelectedHabits(prev => [...prev, customHabit.trim()]);
      setCustomHabit("");
    }
  };

  const toggleGoalSuggestion = (goal: string) => {
    setGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
  };

  const addGoal = () => {
    if (goalInput.trim() && !goals.includes(goalInput.trim())) {
      setGoals(prev => [...prev, goalInput.trim()]);
      setGoalInput("");
    }
  };

  const totalCategoryBudget = Object.values(categoryBudgets).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  const projectedSavings = (parseFloat(income) || 0) - (parseFloat(budget) || 0);

  const goNext = () => { setDirection(1); setStep(s => Math.min(4, s + 1)); };
  const goBack = () => { setDirection(-1); setStep(s => Math.max(1, s - 1)); };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ income: parseFloat(income) || 0, budget: parseFloat(budget) || 0, habits: selectedHabits, goals }),
      });
      if (res.ok) {
        for (const [category, limit] of Object.entries(categoryBudgets)) {
          if (parseFloat(limit) > 0) {
            await fetch("/api/category-budgets", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ category, limit }),
            });
          }
        }
        router.push("/dashboard");
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const totalSteps = 4;
  const stepLabels = ["Identity", "Finances", "Habits & Goals", "Review"];

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-5 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-xl font-bold text-gray-900">Life<span className="text-indigo-500">OS</span></span>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  i + 1 < step ? "bg-green-500 text-white" :
                  i + 1 === step ? "bg-indigo-500 text-white scale-110" :
                  "bg-gray-100 text-gray-400"
                }`}>
                  {i + 1 < step ? "✓" : i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div className={`w-6 h-0.5 rounded transition-all duration-500 ${i + 1 < step ? "bg-green-400" : "bg-gray-100"}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">{stepLabels[step - 1]}</p>
        </div>

        <div className={`${direction > 0 ? "animate-slide-up" : "animate-fade-in"}`} key={step}>
          <div className="card p-6 sm:p-8">

            {/* ── Step 1: Identity ── */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="text-center">
                  <h2 className="text-lg font-bold text-gray-900">Who are you?</h2>
                  <p className="text-sm text-gray-400 mt-1">Tap to select. We&apos;ll customize everything for you.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {OCCUPATIONS.map(occ => (
                    <button key={occ.id} onClick={() => fillDefaults(occ.id)}
                      className={`p-4 rounded-2xl text-center transition-all border-2 active:scale-95 ${
                        occupation === occ.id
                          ? "bg-indigo-50 border-indigo-400 shadow-soft"
                          : "bg-white border-gray-100 hover:border-gray-200"
                      }`}>
                      <div className="text-3xl mb-2">{occ.icon}</div>
                      <div className="text-sm font-semibold text-gray-900">{occ.label}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{occ.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 2: Financial Setup ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Financial setup</h2>
                  <p className="text-sm text-gray-400 mt-1">We&apos;ve pre-filled based on your profile. Adjust as needed.</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1.5">
                      {occupation === "student" ? "Monthly Money (₹)" : "Monthly Income (₹)"}
                    </label>
                    <input type="number" value={income} onChange={e => setIncome(e.target.value)}
                      placeholder={occupation === "student" ? "e.g. 10000" : "e.g. 50000"} className="input-field text-lg font-semibold" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1.5">Spending Limit (₹)</label>
                    <input type="number" value={budget} onChange={e => setBudget(e.target.value)}
                      placeholder={occupation === "student" ? "e.g. 8000" : "e.g. 30000"} className="input-field text-lg font-semibold" />
                  </div>
                </div>

                {income && budget && (
                  <div className={`rounded-xl p-3 text-center text-sm font-medium ${
                    projectedSavings >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                  }`}>
                    {projectedSavings >= 0 ? `You'll save ~₹${projectedSavings.toLocaleString()}/month 🎉` : "Spending exceeds income. Adjust?"}
                  </div>
                )}

                {/* Category budgets (collapsed) */}
                <details className="group">
                  <summary className="text-xs text-indigo-500 font-medium cursor-pointer hover:underline">
                    Customize category budgets →
                  </summary>
                  <div className="mt-3 space-y-2">
                    {CATEGORY_SUGGESTIONS.student.map(cat => (
                      <div key={cat.category} className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-600 w-24">{cat.category}</span>
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                          <input type="number"
                            value={categoryBudgets[cat.category] || ""}
                            onChange={e => setCategoryBudgets({ ...categoryBudgets, [cat.category]: e.target.value })}
                            className="input-field pl-6 text-xs py-2" placeholder="0" />
                        </div>
                      </div>
                    ))}
                    <div className={`text-xs text-center p-2 rounded-lg ${
                      totalCategoryBudget <= (parseFloat(budget) || 0) ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50"
                    }`}>
                      Total: ₹{totalCategoryBudget.toLocaleString()} / ₹{(parseFloat(budget) || 0).toLocaleString()}
                    </div>
                  </div>
                </details>
              </div>
            )}

            {/* ── Step 3: Habits + Goals ── */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Habits & Goals</h2>
                  <p className="text-sm text-gray-400 mt-1">Tap to select. We&apos;ve picked some for you.</p>
                </div>

                {/* Habits */}
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wider">Daily Habits</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_HABITS.map(habit => (
                      <button key={habit} onClick={() => toggleHabit(habit)}
                        className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${
                          selectedHabits.includes(habit)
                            ? "bg-indigo-500 text-white shadow-soft"
                            : "bg-gray-50 text-gray-600 border border-gray-100 hover:border-gray-200"
                        }`}>{habit}</button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input type="text" value={customHabit} onChange={e => setCustomHabit(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addCustomHabit()}
                      placeholder="Custom habit..." className="input-field flex-1 text-sm py-2" />
                    <button onClick={addCustomHabit} className="btn-primary px-3 py-2 text-xs">Add</button>
                  </div>
                  {selectedHabits.filter(h => !PRESET_HABITS.includes(h)).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {selectedHabits.filter(h => !PRESET_HABITS.includes(h)).map((h, i) => (
                        <span key={i} className="bg-indigo-50 text-indigo-600 text-xs px-2.5 py-1 rounded-full border border-indigo-200">{h}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Goals */}
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wider">Goals</p>
                  <div className="space-y-1.5">
                    {(GOAL_SUGGESTIONS[occupation] || GOAL_SUGGESTIONS.student).map(goal => (
                      <button key={goal} onClick={() => toggleGoalSuggestion(goal)}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-all active:scale-[0.98] ${
                          goals.includes(goal)
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium"
                            : "bg-gray-50 text-gray-600 border border-gray-100 hover:border-gray-200"
                        }`}>
                        <span className="mr-2">{goals.includes(goal) ? "✓" : "○"}</span>{goal}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input type="text" value={goalInput} onChange={e => setGoalInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addGoal()}
                      placeholder="Custom goal..." className="input-field flex-1 text-sm py-2" />
                    <button onClick={addGoal} className="btn-primary px-3 py-2 text-xs">Add</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 4: Review & Start ── */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-lg font-bold text-gray-900">Here&apos;s your plan</h2>
                  <p className="text-sm text-gray-400 mt-1">Everything looks good? Let&apos;s go!</p>
                </div>

                <div className="rounded-2xl p-4 bg-gray-50 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-sm font-bold text-gray-900">₹{(parseFloat(income) || 0).toLocaleString()}</div>
                      <div className="text-[10px] text-gray-400">Income</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">₹{(parseFloat(budget) || 0).toLocaleString()}</div>
                      <div className="text-[10px] text-gray-400">Limit</div>
                    </div>
                    <div>
                      <div className={`text-sm font-bold ${projectedSavings >= 0 ? "text-green-600" : "text-red-500"}`}>
                        ₹{Math.abs(projectedSavings).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-gray-400">{projectedSavings >= 0 ? "Savings" : "Deficit"}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl p-4 bg-gray-50">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Habits ({selectedHabits.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedHabits.map((h, i) => (
                      <span key={i} className="bg-white text-gray-700 text-xs px-2.5 py-1 rounded-full border border-gray-200">{h}</span>
                    ))}
                    {selectedHabits.length === 0 && <span className="text-xs text-gray-400">None</span>}
                  </div>
                </div>

                <div className="rounded-2xl p-4 bg-gray-50">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Goals ({goals.length})</p>
                  <div className="space-y-1">
                    {goals.map((g, i) => <p key={i} className="text-xs text-gray-700 flex items-center gap-1.5"><span className="text-green-500">✓</span> {g}</p>)}
                    {goals.length === 0 && <span className="text-xs text-gray-400">None</span>}
                  </div>
                </div>

                {projectedSavings > 0 && (
                  <div className="rounded-2xl p-4 bg-green-50 text-center">
                    <p className="text-sm font-semibold text-green-700">
                      ₹{(projectedSavings * 12).toLocaleString()}/year in savings 🎉
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-50">
              <div>
                {step > 1 ? (
                  <button onClick={goBack} className="text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors">← Back</button>
                ) : (
                  <button onClick={() => router.push("/dashboard")} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Skip</button>
                )}
              </div>
              {step < 4 ? (
                <button onClick={goNext}
                  disabled={step === 1 && !occupation}
                  className="btn-primary px-6 py-2.5 text-sm disabled:opacity-30 active:scale-95 transition-transform">
                  Continue
                </button>
              ) : (
                <button onClick={handleComplete} disabled={loading}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50">
                  {loading ? "Setting up..." : "Start My Journey →"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
