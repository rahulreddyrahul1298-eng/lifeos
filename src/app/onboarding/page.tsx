"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const IDENTITIES = [
  { id: "fit", icon: "💪", label: "Get Fit", desc: "Build strength & health" },
  { id: "wealthy", icon: "💰", label: "Get Wealthy", desc: "Grow your money" },
  { id: "focused", icon: "🎯", label: "Stay Focused", desc: "Deep work & productivity" },
  { id: "disciplined", icon: "⚡", label: "Be Disciplined", desc: "Build daily systems" },
];

const STRUGGLES = [
  { id: "money", icon: "💸", label: "I waste money", desc: "Spending too much" },
  { id: "time", icon: "⏰", label: "I lack time", desc: "Not enough hours" },
  { id: "health", icon: "🏥", label: "I want health", desc: "Fitness & wellness" },
  { id: "consistency", icon: "📉", label: "I'm inconsistent", desc: "Can't stick to habits" },
];

const DEFAULTS: Record<string, { income: number; budget: number; habits: string[]; goals: string[] }> = {
  fit: { income: 30000, budget: 20000, habits: ["Gym", "Drink Water", "Meditation"], goals: ["Exercise 4x/week", "Drink 3L water daily"] },
  wealthy: { income: 50000, budget: 30000, habits: ["Reading", "Study", "Meditation"], goals: ["Save 20% of salary", "No impulse purchases"] },
  focused: { income: 40000, budget: 25000, habits: ["Meditation", "Reading", "Study"], goals: ["2 hours deep work daily", "No social media before noon"] },
  disciplined: { income: 35000, budget: 22000, habits: ["Gym", "Reading", "Drink Water"], goals: ["Wake up at 6 AM", "Complete all habits daily"] },
};

const CATS = [
  { category: "Food", amount: 5000 }, { category: "Transport", amount: 2000 }, { category: "Education", amount: 1500 },
  { category: "Entertainment", amount: 2000 }, { category: "Shopping", amount: 3000 }, { category: "Bills", amount: 2000 },
  { category: "Health", amount: 1000 }, { category: "Other", amount: 1500 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [identity, setIdentity] = useState("");
  const [struggle, setStruggle] = useState("");

  const d = DEFAULTS[identity] || DEFAULTS.disciplined;
  const progress = (step / 4) * 100;

  const selectId = (id: string) => { setIdentity(id); setTimeout(() => setStep(2), 350); };
  const selectSt = (id: string) => { setStruggle(id); setTimeout(() => setStep(3), 350); };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ income: d.income, budget: d.budget, habits: d.habits, goals: d.goals }) });
      if (res.ok) {
        for (const c of CATS) await fetch("/api/category-budgets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: c.category, limit: c.amount }) });
        router.push("/dashboard");
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Progress */}
      <div className="w-full bg-gray-100 h-1 sticky top-0 z-50">
        <div className="bg-gradient-to-r from-brand-500 to-purple-500 h-1 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm" key={step}>
          <div className="animate-slide-up">

            {/* Step 1: Identity */}
            {step === 1 && (
              <div className="text-center space-y-8">
                <div>
                  <h1 className="text-3xl font-black text-ink-900 leading-tight">What do you want<br />to become?</h1>
                  <p className="text-sm text-ink-300 mt-3">Tap to select. We&apos;ll build your system.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {IDENTITIES.map(item => (
                    <button key={item.id} onClick={() => selectId(item.id)}
                      className={`card p-6 text-center active:scale-95 transition-all duration-200 ${
                        identity === item.id ? "ring-2 ring-brand-500 shadow-glow bg-brand-50/50" : "hover:shadow-card-hover hover:-translate-y-0.5"}`}>
                      <div className="text-4xl mb-3">{item.icon}</div>
                      <div className="text-sm font-bold text-ink-900">{item.label}</div>
                      <div className="text-[10px] text-ink-300 mt-1">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Struggle */}
            {step === 2 && (
              <div className="text-center space-y-8">
                <div>
                  <h1 className="text-3xl font-black text-ink-900 leading-tight">What&apos;s your biggest<br />struggle?</h1>
                  <p className="text-sm text-ink-300 mt-3">We&apos;ll fix this first.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {STRUGGLES.map(item => (
                    <button key={item.id} onClick={() => selectSt(item.id)}
                      className={`card p-6 text-center active:scale-95 transition-all duration-200 ${
                        struggle === item.id ? "ring-2 ring-brand-500 shadow-glow bg-brand-50/50" : "hover:shadow-card-hover hover:-translate-y-0.5"}`}>
                      <div className="text-4xl mb-3">{item.icon}</div>
                      <div className="text-sm font-bold text-ink-900">{item.label}</div>
                      <div className="text-[10px] text-ink-300 mt-1">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Your Plan */}
            {step === 3 && (
              <div className="text-center space-y-6">
                <div>
                  <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-5">
                    <span className="text-3xl">✨</span>
                  </div>
                  <h1 className="text-2xl font-black text-ink-900">Your system is ready</h1>
                  <p className="text-sm text-ink-300 mt-2">Personalized for you</p>
                </div>

                <div className="space-y-3 text-left">
                  {[
                    { icon: "💰", title: `Budget: ₹${d.budget.toLocaleString()}/mo`, sub: "Auto-categorized limits", color: "bg-blue-50 border-blue-100" },
                    { icon: "🔄", title: `${d.habits.length} Daily Habits`, sub: d.habits.join(", "), color: "bg-green-50 border-green-100" },
                    { icon: "🎯", title: `${d.goals.length} Goals Set`, sub: d.goals.join(", "), color: "bg-amber-50 border-amber-100" },
                    { icon: "🤖", title: "AI Insights Active", sub: "Personalized tips every day", color: "bg-purple-50 border-purple-100" },
                  ].map((item, i) => (
                    <div key={i} className={`card p-4 flex items-center gap-4 border ${item.color}`}>
                      <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center text-xl shadow-sm flex-shrink-0">{item.icon}</div>
                      <div className="flex-1 min-w-0"><div className="text-sm font-bold text-ink-900">{item.title}</div><div className="text-[10px] text-ink-300 truncate">{item.sub}</div></div>
                      <span className="text-green-500 text-sm font-bold flex-shrink-0">✓</span>
                    </div>
                  ))}
                </div>

                <button onClick={() => { setStep(4); setTimeout(handleComplete, 600); }}
                  className="w-full btn-primary py-4 text-base font-bold active:scale-[0.98] transition-transform">
                  Go to Dashboard →
                </button>
                <button onClick={() => setStep(2)} className="text-xs text-ink-300 hover:text-ink-500 transition-colors">← Change selections</button>
              </div>
            )}

            {/* Step 4: Loading */}
            {step === 4 && (
              <div className="text-center space-y-6 py-10">
                <div className="w-16 h-16 border-4 border-gray-100 border-t-brand-500 rounded-full animate-spin mx-auto" />
                <div>
                  <h2 className="text-lg font-bold text-ink-900">Setting up your system...</h2>
                  <p className="text-sm text-ink-300 mt-2">This takes just a moment</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {step < 3 && (
        <div className="text-center pb-8">
          <button onClick={() => router.push("/dashboard")} className="text-xs text-ink-300 hover:text-ink-500 transition-colors">Skip for now</button>
        </div>
      )}
    </div>
  );
}
