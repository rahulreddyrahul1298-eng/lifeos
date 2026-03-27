"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const IDENTITIES = [
  { id: "fit", icon: "💪", label: "Fit", desc: "Build strength & health" },
  { id: "wealthy", icon: "💰", label: "Wealthy", desc: "Grow your money" },
  { id: "focused", icon: "🎯", label: "Focused", desc: "Deep work & productivity" },
  { id: "disciplined", icon: "⚡", label: "Disciplined", desc: "Build daily systems" },
];

const STRUGGLES = [
  { id: "money", icon: "💸", label: "Money", desc: "Spending too much" },
  { id: "time", icon: "⏰", label: "Time", desc: "Not enough hours" },
  { id: "health", icon: "🏥", label: "Health", desc: "Fitness & wellness" },
  { id: "consistency", icon: "📉", label: "Consistency", desc: "Can't stick to habits" },
];

const SMART_DEFAULTS: Record<string, { income: number; budget: number; habits: string[]; goals: string[] }> = {
  fit: { income: 30000, budget: 20000, habits: ["Gym", "Drink Water", "Meditation"], goals: ["Exercise 4x/week", "Drink 3L water daily"] },
  wealthy: { income: 50000, budget: 30000, habits: ["Reading", "Study", "Meditation"], goals: ["Save 20% of salary", "No impulse purchases"] },
  focused: { income: 40000, budget: 25000, habits: ["Meditation", "Reading", "Study"], goals: ["2 hours deep work daily", "No social media before noon"] },
  disciplined: { income: 35000, budget: 22000, habits: ["Gym", "Reading", "Drink Water"], goals: ["Wake up at 6 AM", "Complete all habits daily"] },
};

const CATEGORY_DEFAULTS = [
  { category: "Food", amount: 5000 },
  { category: "Transport", amount: 2000 },
  { category: "Education", amount: 1500 },
  { category: "Entertainment", amount: 2000 },
  { category: "Shopping", amount: 3000 },
  { category: "Bills", amount: 2000 },
  { category: "Health", amount: 1000 },
  { category: "Other", amount: 1500 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [identity, setIdentity] = useState("");
  const [struggle, setStruggle] = useState("");

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const defaults = SMART_DEFAULTS[identity] || SMART_DEFAULTS.disciplined;

  const handleSelectIdentity = (id: string) => {
    setIdentity(id);
    setTimeout(() => setStep(2), 350);
  };

  const handleSelectStruggle = (id: string) => {
    setStruggle(id);
    setTimeout(() => setStep(3), 350);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          income: defaults.income,
          budget: defaults.budget,
          habits: defaults.habits,
          goals: defaults.goals,
        }),
      });
      if (res.ok) {
        for (const cat of CATEGORY_DEFAULTS) {
          await fetch("/api/category-budgets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: cat.category, limit: cat.amount }),
          });
        }
        router.push("/dashboard");
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Progress bar */}
      <div className="w-full bg-gray-100 h-1 sticky top-0 z-50">
        <div className="bg-indigo-500 h-1 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm" key={step}>
          <div className="animate-slide-up">

            {/* ── Screen 1: Welcome ── */}
            {step === 1 && (
              <div className="text-center space-y-8">
                <div>
                  <div className="text-5xl mb-4">🚀</div>
                  <h1 className="text-2xl font-bold text-gray-900 leading-tight">Take Control of<br />Your Life</h1>
                  <p className="text-sm text-gray-400 mt-3 leading-relaxed">Track money, build habits, and see<br />real improvement — every single day.</p>
                </div>

                <div className="space-y-6">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Who do you want to become?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {IDENTITIES.map(item => (
                      <button key={item.id} onClick={() => handleSelectIdentity(item.id)}
                        className={`p-5 rounded-2xl text-center transition-all duration-200 active:scale-95 border-2 ${
                          identity === item.id
                            ? "bg-indigo-50 border-indigo-400 shadow-lg shadow-indigo-100"
                            : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-md"
                        }`}>
                        <div className="text-3xl mb-2">{item.icon}</div>
                        <div className="text-sm font-bold text-gray-900">{item.label}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Screen 2: Struggle ── */}
            {step === 2 && (
              <div className="text-center space-y-8">
                <div>
                  <div className="text-5xl mb-4">🎯</div>
                  <h1 className="text-2xl font-bold text-gray-900 leading-tight">What&apos;s your biggest<br />struggle?</h1>
                  <p className="text-sm text-gray-400 mt-3">We&apos;ll customize your experience to fix this first.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {STRUGGLES.map(item => (
                    <button key={item.id} onClick={() => handleSelectStruggle(item.id)}
                      className={`p-5 rounded-2xl text-center transition-all duration-200 active:scale-95 border-2 ${
                        struggle === item.id
                          ? "bg-indigo-50 border-indigo-400 shadow-lg shadow-indigo-100"
                          : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-md"
                      }`}>
                      <div className="text-3xl mb-2">{item.icon}</div>
                      <div className="text-sm font-bold text-gray-900">{item.label}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Screen 3: Your Plan ── */}
            {step === 3 && (
              <div className="text-center space-y-6">
                <div>
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">✨</span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">Your system is ready</h1>
                  <p className="text-sm text-gray-400 mt-2">Personalized for you. Here&apos;s what we set up:</p>
                </div>

                <div className="space-y-3 text-left">
                  <div className="card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-lg">💰</div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">Budget: ₹{defaults.budget.toLocaleString()}/mo</div>
                      <div className="text-[10px] text-gray-400">Auto-categorized spending limits</div>
                    </div>
                    <span className="text-green-500 text-sm">✓</span>
                  </div>

                  <div className="card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-lg">🔄</div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">{defaults.habits.length} Daily Habits</div>
                      <div className="text-[10px] text-gray-400">{defaults.habits.join(", ")}</div>
                    </div>
                    <span className="text-green-500 text-sm">✓</span>
                  </div>

                  <div className="card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-lg">🎯</div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">{defaults.goals.length} Goals Set</div>
                      <div className="text-[10px] text-gray-400">{defaults.goals.join(", ")}</div>
                    </div>
                    <span className="text-green-500 text-sm">✓</span>
                  </div>

                  <div className="card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-lg">🤖</div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">AI Insights Active</div>
                      <div className="text-[10px] text-gray-400">Personalized tips every day</div>
                    </div>
                    <span className="text-green-500 text-sm">✓</span>
                  </div>
                </div>

                <button onClick={() => setStep(4)}
                  className="w-full btn-primary py-4 text-base font-bold active:scale-[0.98] transition-transform">
                  Go to Dashboard →
                </button>

                <button onClick={() => setStep(2)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  ← Go back and change
                </button>
              </div>
            )}

            {/* ── Screen 4: Loading/Setup ── */}
            {step === 4 && (
              <div className="text-center space-y-6 py-10">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Setting up your system...</h2>
                  <p className="text-sm text-gray-400 mt-2">This takes just a moment</p>
                </div>
                {/* Auto-complete */}
                <div className="hidden">{!loading && setTimeout(() => handleComplete(), 500) && null}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skip */}
      {step < 3 && (
        <div className="text-center pb-6">
          <button onClick={() => router.push("/dashboard")} className="text-xs text-gray-300 hover:text-gray-500 transition-colors">
            Skip for now
          </button>
        </div>
      )}
    </div>
  );
}
