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

const QC = [
  { icon: "☕", title: "Tea/Coffee", cat: "Food" }, { icon: "🍔", title: "Lunch", cat: "Food" },
  { icon: "🛒", title: "Groceries", cat: "Shopping" }, { icon: "🚗", title: "Auto/Cab", cat: "Transport" },
  { icon: "⛽", title: "Petrol", cat: "Transport" }, { icon: "📄", title: "Bills", cat: "Bills" },
  { icon: "🎬", title: "Movies", cat: "Entertainment" }, { icon: "💊", title: "Medical", cat: "Health" },
  { icon: "👕", title: "Shopping", cat: "Shopping" }, { icon: "📚", title: "Education", cat: "Education" },
  { icon: "🍕", title: "Snacks", cat: "Food" }, { icon: "📦", title: "Other", cat: "Other" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"home"|"money"|"habits"|"goals">("home");
  const [toast, setToast] = useState<{ message: string; icon: string } | null>(null);

  // Forms
  const [showExpForm, setShowExpForm] = useState(false);
  const [showHabForm, setShowHabForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [expTitle, setExpTitle] = useState(""); const [expAmt, setExpAmt] = useState(""); const [expCat, setExpCat] = useState("Food");
  const [newHab, setNewHab] = useState(""); const [newGoal, setNewGoal] = useState("");

  // Money
  const [openCat, setOpenCat] = useState<string|null>(null);
  const [showBudgetSetup, setShowBudgetSetup] = useState(false);
  const [budCat, setBudCat] = useState("Food"); const [budLim, setBudLim] = useState("");
  const [qTitle, setQTitle] = useState(""); const [qAmt, setQAmt] = useState(""); const [qCat, setQCat] = useState(""); const [showQAmt, setShowQAmt] = useState(false);

  // Home
  const [showAch, setShowAch] = useState(false);
  const [mood, setMood] = useState<string|null>(null);
  const [started, setStarted] = useState(false);

  const fetch_ = useCallback(async () => {
    try { const r = await fetch("/api/dashboard"); if (r.status === 401) { router.push("/auth"); return; } setData(await r.json()); }
    catch { console.error("Failed"); } finally { setLoading(false); }
  }, [router]);
  useEffect(() => { fetch_(); }, [fetch_]);

  // Actions
  const togHab = async (id: string) => {
    if (!data) return; const h = data.habits.find(x => x.id === id); const was = h?.completedToday;
    setData({ ...data, habits: data.habits.map(x => x.id === id ? { ...x, completedToday: !x.completedToday } : x) });
    await fetch("/api/habits/toggle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ habitId: id }) });
    const r = await fetch("/api/dashboard"); if (r.ok) { const nd = await r.json(); setData(nd);
      if (!was && h) { const ns = (h.streak||0)+1; if ([3,7,14,21,30].includes(ns)) setToast({ message: `${ns}-day streak! 🔥`, icon: "🔥" });
        if (nd.habitsCompleted === nd.totalHabits && nd.totalHabits > 0) setToast({ message: "Perfect day! All done! ⭐", icon: "⭐" }); } }
  };
  const addExp = async (e: React.FormEvent) => { e.preventDefault(); if (!expTitle||!expAmt) return; await fetch("/api/expenses", { method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:expTitle,amount:expAmt,category:expCat})}); setExpTitle(""); setExpAmt(""); setExpCat("Food"); setShowExpForm(false); fetch_(); };
  const delExp = async (id: string) => { await fetch(`/api/expenses?id=${id}`,{method:"DELETE"}); fetch_(); };
  const subQExp = async () => { if (!qAmt||parseFloat(qAmt)<=0) return; await fetch("/api/expenses",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:qTitle,amount:qAmt,category:qCat})}); setQTitle(""); setQAmt(""); setQCat(""); setShowQAmt(false); setToast({message:`₹${qAmt} added`,icon:"✅"}); fetch_(); };
  const addHab = async (e: React.FormEvent) => { e.preventDefault(); if(!newHab) return; const r=await fetch("/api/habits",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:newHab})}); if(r.status===403){const d=await r.json();alert(d.error);return;} setNewHab(""); setShowHabForm(false); fetch_(); };
  const delHab = async (id: string) => { await fetch(`/api/habits?id=${id}`,{method:"DELETE"}); fetch_(); };
  const addGoal_ = async (e: React.FormEvent) => { e.preventDefault(); if(!newGoal) return; if(!data?.user.isPremium&&data&&data.totalGoals>=2){alert("Free: 2 goals max. Upgrade!");return;} await fetch("/api/goals",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:newGoal})}); setNewGoal(""); setShowGoalForm(false); fetch_(); };
  const togGoal = async (id: string, c: boolean) => { await fetch("/api/goals",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,completed:!c})}); fetch_(); };
  const delGoal = async (id: string) => { await fetch(`/api/goals?id=${id}`,{method:"DELETE"}); fetch_(); };
  const saveBud = async () => { if(!budLim||parseFloat(budLim)<=0) return; await fetch("/api/category-budgets",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({category:budCat,limit:budLim})}); setBudLim(""); setShowBudgetSetup(false); fetch_(); };
  const logout = async () => { await fetch("/api/auth/logout",{method:"POST"}); router.push("/"); };

  if (loading) return <DashboardSkeleton />;
  if (!data) return null;

  const P = data.user.isPremium;
  const bp = data.user.budget > 0 ? Math.min(100,(data.totalSpent/data.user.budget)*100) : 0;
  const bColor = bp>90?"bg-red-500":bp>70?"bg-amber-500":"bg-green-500";
  const sav = data.user.income - data.totalSpent;
  const maxDay = Math.max(...data.spendingByDay.map(d=>d.total),1);
  const hr = new Date().getHours();
  const inc = data.habits.filter(h=>!h.completedToday);
  const today = new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short"});
  const hp = data.totalHabits>0?Math.round((data.habitsCompleted/data.totalHabits)*100):0;
  const track = Math.round((hp + (bp<=100?100-bp:0))/2);

  // Emotional message
  const emoMsg = () => {
    if (data.habitsCompleted === data.totalHabits && data.totalHabits > 0) return "You're becoming disciplined 🔥";
    if (data.habitsCompleted > 0) return "Keep going, you're building momentum 💪";
    if (hr >= 19) return "Don't let today go to waste ⚡";
    return "Today is yours. Make it count 🎯";
  };

  const iColor = (t: string) => t==="warning"?"border-l-red-500/50 bg-red-500/5":t==="success"?"border-l-green-500/50 bg-green-500/5":t==="tip"?"border-l-amber-500/50 bg-amber-500/5":"border-l-blue-500/50 bg-blue-500/5";
  const iText = (t: string) => t==="warning"?"text-red-400":t==="success"?"text-green-400":t==="tip"?"text-amber-400":"text-blue-400";

  return (
    <div className="min-h-screen bg-dark-bg pb-20">
      {toast && <Toast message={toast.message} icon={toast.icon} onClose={() => setToast(null)} />}

      <header className="sticky top-0 z-40 bg-dark-bg/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-lg mx-auto px-5 py-2.5 flex items-center justify-between">
          <span className="text-base font-black">Life<span className="text-gradient">OS</span></span>
          <div className="flex items-center gap-2">
            {P ? <span className="text-[8px] font-black text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded-lg tracking-wider">PRO</span>
              : <button onClick={()=>router.push("/pricing")} className="text-[10px] px-2.5 py-1 rounded-xl font-bold bg-gradient-primary text-white active:scale-95 transition-transform">Upgrade</button>}
            <button onClick={logout} className="text-[10px] text-white/20 hover:text-white/50 transition-colors">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-4 pb-2">

        {/* ═══ HOME ═══ */}
        {tab === "home" && (
          <div className="space-y-4 animate-fade-in">
            {/* HERO */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-primary to-accent-secondary p-6 text-white">
              <div className="relative z-10">
                <p className="text-white/60 text-xs font-medium">{today}</p>
                <h1 className="text-2xl font-black mt-1">{getGreeting()}, {data.user.name||"Friend"} 👋</h1>
                <p className="text-white/80 text-sm mt-1.5">{emoMsg()}</p>
                <p className="text-white/60 text-xs mt-2">You&apos;re <span className="font-black text-white">{track}%</span> on track today</p>
                <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                  <div className="bg-white h-2 rounded-full transition-all duration-1000" style={{width:`${track}%`}} />
                </div>
                {!started && inc.length > 0 && hr < 20 && (
                  <button onClick={()=>setStarted(true)} className="mt-4 bg-white text-indigo-600 font-black text-sm px-7 py-3 rounded-2xl active:scale-95 transition-transform shadow-lg">
                    Start Your Day →
                  </button>
                )}
              </div>
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full" />
              <div className="absolute -right-4 -bottom-10 w-28 h-28 bg-white/5 rounded-full" />
            </div>

            {/* LIFE SCORE */}
            <div className="glass p-4 flex items-center gap-4">
              <ProgressRing score={data.lifeScore} size={56} strokeWidth={5} />
              <div className="flex-1">
                <p className="text-sm font-bold">Life Score</p>
                <p className="text-xs text-white/40 mt-0.5">{data.lifeScore>=70?"Great! Keep it up":data.lifeScore>=40?"Room to improve":"Let's work on this"}</p>
              </div>
              <div className="text-right"><div className="text-xs font-black text-green-400">+{data.weeklyConsistency>50?"5":"2"}</div><div className="text-[8px] text-white/30">this week</div></div>
            </div>

            {/* AI INSIGHT */}
            {data.insights.length > 0 && (
              <div className={`glass border-l-[3px] p-4 ${iColor(data.insights[0].type)}`}>
                <div className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5">🤖</span>
                  <div className="flex-1"><p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">AI Insight</p><p className={`text-sm leading-relaxed ${iText(data.insights[0].type)}`}>{data.insights[0].message}</p></div>
                </div>
              </div>
            )}
            {P && data.insights.length > 1 && <div className={`glass border-l-[3px] p-4 ${iColor(data.insights[1].type)}`}><p className={`text-sm leading-relaxed ${iText(data.insights[1].type)}`}>{data.insights[1].message}</p></div>}
            {!P && data.insights.length > 1 && <button onClick={()=>router.push("/pricing")} className="glass p-3 w-full text-center hover:bg-white/[0.08] transition-all"><p className="text-xs font-bold">{data.insights.length-1} more AI insights</p><p className="text-[10px] text-white/30">Upgrade to unlock</p></button>}

            {/* TODAY TASKS */}
            {(started || data.habitsCompleted > 0) && data.habits.length > 0 && (
              <div className="glass p-4">
                <div className="flex items-center justify-between mb-3"><p className="text-sm font-bold">Today&apos;s Tasks</p><span className="text-[10px] font-black text-accent-primary">{data.habitsCompleted}/{data.totalHabits}</span></div>
                <div className="space-y-2">
                  {data.habits.slice(0,3).map(h => (
                    <button key={h.id} onClick={()=>togHab(h.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-[0.98] text-left ${
                        h.completedToday ? "bg-green-500/10 border border-green-500/20" : "bg-white/[0.03] border border-white/5 hover:border-white/10"}`}>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        h.completedToday ? "bg-green-500 border-green-500" : "border-white/20"}`}>
                        {h.completedToday && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className={`text-sm flex-1 ${h.completedToday?"text-white/40 line-through":"text-white font-medium"}`}>{h.name}</span>
                      {h.streak>0 && <span className="text-[9px] text-orange-400 font-black">🔥{h.streak}d</span>}
                    </button>
                  ))}
                  {data.habits.length>3 && <button onClick={()=>setTab("habits")} className="text-xs text-accent-primary font-semibold w-full text-center py-1">+{data.habits.length-3} more →</button>}
                </div>
              </div>
            )}

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-3 gap-2.5">
              {[{i:"💰",l:"Add Expense",t:"money"},{i:"✅",l:"Log Habit",t:"habits"},{i:"🎯",l:"View Goals",t:"goals"}].map((a,idx)=>(
                <button key={idx} onClick={()=>setTab(a.t as "money"|"habits"|"goals")} className="glass p-3.5 text-center active:scale-95 transition-transform hover:bg-white/[0.08]">
                  <span className="text-xl block">{a.i}</span><span className="text-[9px] font-semibold text-white/70 mt-1 block">{a.l}</span>
                </button>
              ))}
            </div>

            {/* STATS */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="glass p-3 text-center"><div className={`text-base font-black ${data.todaySpent>data.dailyBudgetRemaining?"text-red-400":"text-white"}`}>{formatCurrency(data.todaySpent)}</div><div className="text-[8px] text-white/30 mt-0.5">Spent Today</div></div>
              <div className="glass p-3 text-center"><div className={`text-base font-black ${data.dailyBudgetRemaining>0?"text-green-400":"text-red-400"}`}>{formatCurrency(data.dailyBudgetRemaining)}</div><div className="text-[8px] text-white/30 mt-0.5">Can Spend</div></div>
              <div className="glass p-3 text-center"><div className="text-base font-black text-orange-400">{data.maxStreak}d</div><div className="text-[8px] text-white/30 mt-0.5">Best Streak</div></div>
            </div>

            {/* EVENING */}
            {hr>=19 && data.habitsCompleted>0 && !mood && (
              <div className="glass p-4">
                <p className="text-sm font-bold mb-2">How was today?</p>
                <div className="flex gap-2">{[{e:"😊",l:"Great"},{e:"😐",l:"Okay"},{e:"😓",l:"Tough"}].map(m=>(
                  <button key={m.l} onClick={()=>{setMood(m.l);setToast({message:`Logged: ${m.l}`,icon:m.e});}} className="flex-1 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 text-center active:scale-95 transition-all">
                    <div className="text-2xl">{m.e}</div><div className="text-[9px] text-white/40 mt-1">{m.l}</div>
                  </button>
                ))}</div>
              </div>
            )}

            {/* PREDICTIONS */}
            {P && data.predictions && (
              <div className="glass p-4"><p className="text-sm font-bold mb-2.5">Predictions <span className="text-[8px] bg-accent-primary/20 text-accent-primary px-1.5 py-0.5 rounded font-black">PRO</span></p>
                <div className="grid grid-cols-2 gap-2">{[
                  {l:"Avg Daily",v:formatCurrency(data.predictions.avgDailySpend),c:"text-white"},
                  {l:"Month-End",v:formatCurrency(data.predictions.projectedMonthEnd),c:"text-white"},
                  {l:"Savings",v:formatCurrency(Math.abs(data.predictions.projectedSavings)),c:data.predictions.projectedSavings>=0?"text-green-400":"text-red-400"},
                  {l:"Status",v:data.predictions.budgetRunsOutDate||"On Track ✓",c:data.predictions.budgetRunsOutDate?"text-red-400":"text-green-400"},
                ].map((p,i)=><div key={i} className="bg-white/[0.03] rounded-2xl p-3"><div className="text-[8px] text-white/30">{p.l}</div><div className={`text-sm font-black ${p.c}`}>{p.v}</div></div>)}</div>
              </div>
            )}

            {/* ACHIEVEMENTS */}
            {data.achievements && (
              <div className="glass overflow-hidden">
                <button onClick={()=>setShowAch(!showAch)} className="w-full p-3.5 flex items-center justify-between text-left">
                  <div className="flex items-center gap-2"><span className="text-sm font-bold">Achievements</span><span className="text-[9px] text-white/30">{data.achievements.filter(a=>a.unlocked).length}/{data.achievements.length}</span></div>
                  <svg className={`w-4 h-4 text-white/30 transition-transform ${showAch?"rotate-180":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showAch && <div className="px-3.5 pb-3.5 grid grid-cols-4 gap-2 animate-fade-in">{data.achievements.map((a,i)=>(<div key={i} className={`rounded-2xl p-2 text-center ${a.unlocked?"bg-white/[0.03] border border-white/5":"bg-white/[0.02] opacity-25"}`}><div className={`text-xl ${!a.unlocked?"grayscale":""}`}>{a.icon}</div><div className="text-[7px] font-semibold text-white/50 mt-0.5">{a.title}</div></div>))}</div>}
              </div>
            )}

            {/* UPGRADE */}
            {!P && <button onClick={()=>router.push("/pricing")} className="glass w-full p-4 flex items-center justify-between hover:bg-white/[0.08] transition-all active:scale-[0.98] text-left"><div><p className="text-sm font-bold">Unlock Premium</p><p className="text-[10px] text-white/30">AI insights, charts, unlimited habits</p></div><span className="text-[10px] font-black text-white bg-gradient-primary px-3 py-1.5 rounded-xl">₹99/mo</span></button>}

            {P && sav > 0 && <div className="glass p-3.5 border-l-[3px] border-l-green-500/50 bg-green-500/5"><p className="text-sm font-semibold text-green-400">Saving {formatCurrency(sav)} this month</p><p className="text-[10px] text-green-400/50">= {formatCurrency(sav*12)}/year</p></div>}
          </div>
        )}

        {/* ═══ MONEY ═══ */}
        {tab === "money" && (
          <div className="space-y-4 animate-fade-in">
            {openCat ? (<>{(()=>{const c=data.categoryDetails?.find(x=>x.category===openCat); if(!c) return null; return (<>
              <div className="glass p-5">
                <button onClick={()=>setOpenCat(null)} className="text-xs text-accent-primary font-semibold mb-3 flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>Back</button>
                <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-xl">{getCategoryEmoji(c.category)}</div><div className="flex-1"><div className="font-bold">{c.category}</div><div className="text-[10px] text-white/30">{c.limit>0?`Budget: ${formatCurrency(c.limit)}`:"No budget"}</div></div><div className={`text-lg font-black ${c.exceeded?"text-red-400":"text-white"}`}>{formatCurrency(c.spent)}</div></div>
                {c.limit>0 && <><div className="w-full bg-white/5 rounded-full h-1.5"><div className={`h-1.5 rounded-full transition-all duration-700 ${c.exceeded?"bg-red-500":c.percent>70?"bg-amber-500":"bg-green-500"}`} style={{width:`${Math.min(c.percent,100)}%`}} /></div><div className="flex justify-between mt-1.5"><span className={`text-[10px] font-semibold ${c.exceeded?"text-red-400":"text-green-400"}`}>{c.exceeded?`Over ${formatCurrency(c.spent-c.limit)}`:`${formatCurrency(c.remaining)} left`}</span><span className="text-[10px] text-white/30">{c.percent}%</span></div></>}
              </div>
              <div className="glass p-4"><h3 className="font-bold text-sm mb-2.5">Expenses ({c.expenses.length})</h3>
                <div className="space-y-1.5">{c.expenses.length===0?<p className="text-center py-4 text-xs text-white/30">None yet</p>:c.expenses.map(e=>(
                  <div key={e.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.02] border border-white/5"><div><div className="text-sm font-medium">{e.title}</div><div className="text-[10px] text-white/30">{e.date}</div></div><div className="flex items-center gap-2"><span className="text-sm font-bold text-red-400">-{formatCurrency(e.amount)}</span><button onClick={()=>delExp(e.id)} className="text-white/20 hover:text-red-400 transition-colors"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div></div>
                ))}</div>
              </div>
              <div className="glass p-4"><h3 className="font-bold text-sm mb-2">Add {c.category} Expense</h3><div className="flex gap-2"><input type="text" value={expTitle} onChange={e=>setExpTitle(e.target.value)} placeholder="What?" className="input-field flex-1" /><div className="relative w-20"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 text-xs">₹</span><input type="number" value={expAmt} onChange={e=>setExpAmt(e.target.value)} placeholder="Amt" className="input-field pl-6" /></div><button onClick={async()=>{if(!expTitle||!expAmt)return;await fetch("/api/expenses",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:expTitle,amount:expAmt,category:c.category})});setExpTitle("");setExpAmt("");fetch_();}} className="btn-primary px-3 py-2 text-xs">Add</button></div></div>
            </>);})()}</>
            ) : (<>
              {/* Budget */}
              <div className="glass p-5">
                <div className="flex items-center justify-between mb-3"><h2 className="font-bold">Budget</h2><button onClick={()=>setShowBudgetSetup(!showBudgetSetup)} className="text-[10px] text-accent-primary font-semibold">Set Limits</button></div>
                <div className="flex justify-between text-sm mb-2"><span className="text-white/50">Spent: <b className="text-white">{formatCurrency(data.totalSpent)}</b></span><span className="text-white/50">of <b className="text-white">{formatCurrency(data.user.budget)}</b></span></div>
                <div className="w-full bg-white/5 rounded-full h-2.5"><div className={`${bColor} h-2.5 rounded-full transition-all duration-1000`} style={{width:`${Math.min(bp,100)}%`}} /></div>
                <div className="flex justify-between mt-2"><span className="text-[10px] text-white/30">{formatCurrency(Math.max(0,data.user.budget-data.totalSpent))} left</span><span className="text-[10px] text-white/30">{data.daysRemaining}d • {formatCurrency(data.dailyBudgetRemaining)}/day</span></div>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/5">
                  <div className="text-center"><div className="text-sm font-black">{formatCurrency(data.user.income)}</div><div className="text-[8px] text-white/30">Income</div></div>
                  <div className="text-center"><div className="text-sm font-black">{formatCurrency(data.dailyBudgetRemaining)}</div><div className="text-[8px] text-white/30">Per Day</div></div>
                  <div className="text-center"><div className={`text-sm font-black ${sav>=0?"text-green-400":"text-red-400"}`}>{formatCurrency(Math.abs(sav))}</div><div className="text-[8px] text-white/30">{sav>=0?"Saved":"Over"}</div></div>
                </div>
              </div>

              {showBudgetSetup && !P && <div className="glass p-5 text-center"><span className="text-2xl block mb-2">🔒</span><p className="text-sm font-bold mb-1">Category Budgets</p><p className="text-[10px] text-white/30 mb-3">Premium feature</p><button onClick={()=>router.push("/pricing")} className="btn-primary px-5 py-2 text-xs">Unlock</button></div>}
              {showBudgetSetup && P && <div className="glass p-4 space-y-2"><h3 className="font-bold text-sm">Set Budget</h3><div className="flex gap-2"><select value={budCat} onChange={e=>setBudCat(e.target.value)} className="input-field w-auto text-sm">{["Food","Transport","Shopping","Bills","Entertainment","Health","Education","Other"].map(c=><option key={c} value={c}>{getCategoryEmoji(c)} {c}</option>)}</select><div className="relative flex-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">₹</span><input type="number" value={budLim} onChange={e=>setBudLim(e.target.value)} placeholder="Limit" className="input-field pl-6" onKeyDown={e=>e.key==="Enter"&&saveBud()} /></div><button onClick={saveBud} className="btn-primary px-3 py-2 text-xs">Set</button></div></div>}

              {/* Categories */}
              <div className="glass p-4"><h3 className="font-bold text-sm mb-2.5">Categories</h3>
                <div className="space-y-1.5">{data.categoryDetails&&data.categoryDetails.length>0?data.categoryDetails.map((c,i)=>(
                  <button key={i} onClick={()=>P?setOpenCat(c.category):router.push("/pricing")} className="w-full text-left bg-white/[0.02] border border-white/5 rounded-2xl p-3 hover:bg-white/[0.05] transition-all active:scale-[0.99]">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-base">{getCategoryEmoji(c.category)}</span><div><div className="text-sm font-medium">{c.category}</div><div className="text-[9px] text-white/30">{c.expenses.length} item{c.expenses.length!==1?"s":""}</div></div></div><div className="text-right"><div className={`text-sm font-bold ${c.exceeded?"text-red-400":"text-white"}`}>{formatCurrency(c.spent)}</div>{c.limit>0&&<div className="text-[9px] text-white/30">of {formatCurrency(c.limit)}</div>}</div></div>
                    {c.limit>0&&<div className="w-full bg-white/5 rounded-full h-1 mt-2"><div className={`h-1 rounded-full ${c.exceeded?"bg-red-500":c.percent>70?"bg-amber-500":"bg-green-500"}`} style={{width:`${Math.min(c.percent,100)}%`}} /></div>}
                  </button>
                )):<p className="text-center py-6 text-xs text-white/30">No expenses yet</p>}</div>
              </div>

              {/* Quick Add */}
              <div className="glass p-4"><h3 className="font-bold text-sm mb-2.5">Add Expense</h3>
                {!showQAmt?(<>
                  <div className="grid grid-cols-4 gap-2 mb-2">{QC.map((q,i)=>(<button key={i} onClick={()=>{setQTitle(q.title);setQCat(q.cat);setQAmt("");setShowQAmt(true);}} className="bg-white/[0.03] border border-white/5 rounded-2xl p-2 text-center hover:border-white/10 transition-all active:scale-95"><div className="text-lg">{q.icon}</div><div className="text-[8px] font-medium text-white/40 mt-0.5">{q.title}</div></button>))}</div>
                  <button onClick={()=>setShowExpForm(!showExpForm)} className="w-full text-[10px] text-white/30 py-1">{showExpForm?"Close":"Enter manually"}</button>
                </>):(
                  <div className="space-y-3 animate-fade-in">
                    <div className="bg-white/[0.03] rounded-2xl p-3 text-center"><div className="text-[10px] text-white/40">Adding</div><div className="text-base font-black">{qTitle}</div></div>
                    <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-bold">₹</span><input type="number" value={qAmt} onChange={e=>setQAmt(e.target.value)} placeholder="0" className="input-field pl-8 text-2xl font-black text-center py-4" autoFocus onKeyDown={e=>e.key==="Enter"&&subQExp()} /></div>
                    <div className="flex gap-2"><button onClick={subQExp} disabled={!qAmt||parseFloat(qAmt)<=0} className="flex-1 btn-primary py-3 text-sm font-bold disabled:opacity-30 active:scale-[0.98]">Add Expense</button><button onClick={()=>{setShowQAmt(false);setQTitle("");setQAmt("");}} className="btn-outline px-4 py-3 text-sm">Back</button></div>
                  </div>
                )}
              </div>

              {showExpForm && !showQAmt && <form onSubmit={addExp} className="glass p-4 space-y-2.5 animate-fade-in"><input type="text" value={expTitle} onChange={e=>setExpTitle(e.target.value)} placeholder="What?" className="input-field" required autoFocus /><div className="flex gap-2"><div className="relative flex-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">₹</span><input type="number" value={expAmt} onChange={e=>setExpAmt(e.target.value)} placeholder="Amount" className="input-field pl-7" required /></div><select value={expCat} onChange={e=>setExpCat(e.target.value)} className="input-field w-auto">{["Food","Transport","Shopping","Bills","Entertainment","Health","Education","Other"].map(c=><option key={c} value={c}>{getCategoryEmoji(c)} {c}</option>)}</select></div><button type="submit" className="btn-primary w-full py-2.5 text-sm">Add</button></form>}

              {/* Chart */}
              <div className="glass p-4 relative"><h3 className="font-bold text-sm mb-3">Last 7 Days</h3>
                {!P&&<div className="absolute inset-0 z-10 bg-dark-bg/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center"><span className="text-xl mb-1">📊</span><p className="text-xs font-bold">Premium</p><button onClick={()=>router.push("/pricing")} className="btn-primary px-4 py-1.5 text-[10px] mt-2">Upgrade</button></div>}
                <div className={`flex items-end gap-1.5 h-24 ${!P?"blur-sm":""}`}>{data.spendingByDay.map((d,i)=>(<div key={i} className="flex-1 flex flex-col items-center gap-0.5"><span className="text-[7px] text-white/30">{d.total>0?`₹${d.total}`:""}</span><div className={`w-full rounded-lg transition-all duration-500 ${d.total>0?"bg-accent-primary":"bg-white/5"}`} style={{height:`${d.total>0?Math.max(6,(d.total/maxDay)*64):3}px`}} /><span className="text-[7px] text-white/30">{getDayName(d.date)}</span></div>))}</div>
              </div>

              {/* Recent */}
              <div className="glass p-4"><h3 className="font-bold text-sm mb-2.5">Recent</h3>
                <div className="space-y-1">{data.expenses.length===0?<p className="text-center py-6 text-xs text-white/30">No expenses</p>:data.expenses.slice(0,8).map(e=>(
                  <div key={e.id} className="flex items-center justify-between py-2 hover:bg-white/[0.02] rounded-xl px-2 transition-colors">
                    <div className="flex items-center gap-2"><span className="text-sm">{getCategoryEmoji(e.category)}</span><div><div className="text-sm font-medium">{e.title}</div><div className="text-[9px] text-white/20">{e.category} • {e.date}</div></div></div>
                    <div className="flex items-center gap-2"><span className="text-sm font-bold text-red-400">-{formatCurrency(e.amount)}</span><button onClick={()=>delExp(e.id)} className="text-white/15 hover:text-red-400 transition-colors"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
                  </div>
                ))}</div>
              </div>
            </>)}
          </div>
        )}

        {/* ═══ HABITS ═══ */}
        {tab === "habits" && (
          <div className="space-y-4 animate-fade-in">
            <div className="glass p-4">
              <div className="flex items-center justify-between mb-3"><h2 className="font-bold">Habits</h2><button onClick={()=>setShowHabForm(!showHabForm)} className="btn-primary text-[10px] px-3 py-1.5 active:scale-95 transition-transform">+ Add</button></div>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 flex-shrink-0"><svg className="-rotate-90" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.08)" strokeWidth="4" fill="none" /><circle cx="24" cy="24" r="20" stroke="#6366F1" strokeWidth="4" fill="none" strokeDasharray={`${data.totalHabits>0?(data.habitsCompleted/data.totalHabits)*125.6:0} 125.6`} strokeLinecap="round" style={{transition:"stroke-dashoffset 0.7s ease"}} /></svg><div className="absolute inset-0 flex items-center justify-center"><span className="text-[10px] font-black">{data.habitsCompleted}/{data.totalHabits}</span></div></div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 flex-1"><div><div className="text-sm font-black text-orange-400">{data.maxStreak}d</div><div className="text-[8px] text-white/30">Best Streak</div></div><div><div className="text-sm font-black">{data.weeklyConsistency}%</div><div className="text-[8px] text-white/30">This Week</div></div></div>
              </div>
              {!P&&data.totalHabits>=3&&<div className="flex items-center justify-between p-2.5 bg-white/[0.03] rounded-2xl mt-3"><div><p className="text-[10px] font-bold">Limit (3/3)</p><p className="text-[9px] text-white/30">Upgrade for unlimited</p></div><button onClick={()=>router.push("/pricing")} className="btn-primary px-2.5 py-1 text-[9px]">Upgrade</button></div>}
            </div>

            {showHabForm&&<form onSubmit={addHab} className="glass p-3.5 flex gap-2 animate-fade-in"><input type="text" value={newHab} onChange={e=>setNewHab(e.target.value)} placeholder="New habit..." className="input-field flex-1" required autoFocus /><button type="submit" className="btn-primary px-4 py-2 text-sm">Add</button></form>}

            {data.habitsCompleted===data.totalHabits&&data.totalHabits>0&&<div className="glass p-3.5 bg-green-500/5 border-green-500/20 text-center animate-fade-in"><span className="text-xl">⭐</span><p className="text-sm font-bold text-green-400 mt-0.5">Perfect Day!</p><p className="text-[10px] text-green-400/50">You&apos;re becoming disciplined 🔥</p></div>}

            <div className="space-y-2">{data.habits.length===0?<div className="glass p-8 text-center text-sm text-white/30">Add your first habit</div>:
              [...data.habits].sort((a,b)=>Number(a.completedToday)-Number(b.completedToday)).map(h=>(
                <div key={h.id} className="glass p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <button onClick={()=>togHab(h.id)} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${h.completedToday?"bg-green-500 border-green-500":"border-white/15 hover:border-accent-primary"}`}>
                        {h.completedToday&&<svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </button>
                      <div><span className={`text-sm font-medium ${h.completedToday?"text-white/30 line-through":"text-white"}`}>{h.name}</span>{h.streak>0&&<span className="ml-1.5 text-[9px] text-orange-400 font-black">🔥{h.streak}d</span>}</div>
                    </div>
                    <button onClick={()=>delHab(h.id)} className="text-white/15 hover:text-red-400 transition-colors p-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                  {P?<div className="flex gap-1">{h.weekCompletions.map((d,i)=>(<div key={i} className="flex-1 text-center"><div className={`w-full aspect-square rounded-xl flex items-center justify-center text-[10px] font-semibold ${d.done?"bg-green-500/10 text-green-400 border border-green-500/20":"bg-white/[0.03] text-white/15 border border-white/5"}`}>{d.done?"✓":"·"}</div><div className="text-[7px] text-white/20 mt-0.5">{getDayName(d.date)}</div></div>))}</div>
                  :<div className="relative"><div className="flex gap-1 blur-[3px] opacity-30">{h.weekCompletions.map((d,i)=>(<div key={i} className="flex-1 text-center"><div className="w-full aspect-square rounded-xl bg-white/5 border border-white/5" /><div className="text-[7px] text-white/20 mt-0.5">{getDayName(d.date)}</div></div>))}</div><div className="absolute inset-0 flex items-center justify-center"><button onClick={()=>router.push("/pricing")} className="glass px-3 py-1 text-[10px] font-semibold active:scale-95">Unlock Weekly View</button></div></div>}
                </div>
              ))}</div>
          </div>
        )}

        {/* ═══ GOALS ═══ */}
        {tab === "goals" && (
          <div className="space-y-4 animate-fade-in">
            <div className="glass p-4">
              <div className="flex items-center justify-between mb-3"><h2 className="font-bold">Goals</h2><button onClick={()=>setShowGoalForm(!showGoalForm)} className="btn-primary text-[10px] px-3 py-1.5 active:scale-95 transition-transform">+ Add</button></div>
              <div className="grid grid-cols-2 gap-2"><div className="text-center p-2.5 bg-green-500/5 rounded-2xl border border-green-500/10"><div className="text-lg font-black text-green-400">{data.goalsCompleted}/{data.totalGoals}</div><div className="text-[9px] text-green-400/50 font-semibold">Done</div></div><div className="text-center p-2.5 bg-white/[0.03] rounded-2xl border border-white/5"><div className="text-lg font-black">{data.totalGoals-data.goalsCompleted}</div><div className="text-[9px] text-white/30 font-semibold">In Progress</div></div></div>
              {!P&&data.totalGoals>=2&&<div className="flex items-center justify-between p-2.5 bg-white/[0.03] rounded-2xl mt-3"><div><p className="text-[10px] font-bold">Limit (2/2)</p><p className="text-[9px] text-white/30">Upgrade for unlimited</p></div><button onClick={()=>router.push("/pricing")} className="btn-primary px-2.5 py-1 text-[9px]">Upgrade</button></div>}
            </div>
            {showGoalForm&&<form onSubmit={addGoal_} className="glass p-3.5 flex gap-2 animate-fade-in"><input type="text" value={newGoal} onChange={e=>setNewGoal(e.target.value)} placeholder="e.g. Save ₹10,000" className="input-field flex-1" required autoFocus /><button type="submit" className="btn-primary px-4 py-2 text-sm">Add</button></form>}
            <div className="space-y-2">{data.goals.length===0?<div className="glass p-8 text-center text-sm text-white/30">What do you want to achieve?</div>:
              [...data.goals].sort((a,b)=>Number(a.completed)-Number(b.completed)).map(g=>(
                <div key={g.id} className="glass px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={()=>togGoal(g.id,g.completed)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${g.completed?"bg-green-500 border-green-500":"border-white/15 hover:border-accent-primary"}`}>{g.completed&&<svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}</button>
                    <span className={`text-sm ${g.completed?"text-white/30 line-through":"text-white font-medium"}`}>{g.title}</span>
                  </div>
                  <button onClick={()=>delGoal(g.id)} className="text-white/15 hover:text-red-400 transition-colors p-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
              ))}</div>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-dark-bg/95 backdrop-blur-xl border-t border-white/5 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-around py-1.5">
          {([
            {id:"home" as const,l:"Home",d:"M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"},
            {id:"money" as const,l:"Money",d:"M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"},
            {id:"habits" as const,l:"Habits",d:"M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"},
            {id:"goals" as const,l:"Goals",d:"M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"},
          ]).map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all active:scale-90 ${tab===t.id?"text-accent-primary":"text-white/30"}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={tab===t.id?2:1.5}><path strokeLinecap="round" strokeLinejoin="round" d={t.d} /></svg>
              <span className={`text-[9px] ${tab===t.id?"font-bold":"font-medium"}`}>{t.l}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
