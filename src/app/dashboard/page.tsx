"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, getGreeting, getDayName, getCategoryEmoji } from "@/lib/utils";
import ProgressRing from "@/components/ui/ProgressRing";
import DashboardSkeleton from "@/components/ui/Skeleton";
import Toast from "@/components/ui/Toast";

interface WeekDay{date:string;done:boolean}
interface Habit{id:string;name:string;streak:number;completedToday:boolean;weekCompletions:WeekDay[]}
interface Expense{id:string;title:string;amount:number;category:string;date:string}
interface Goal{id:string;title:string;completed:boolean}
interface CatDetail{category:string;spent:number;limit:number;percent:number;exceeded:boolean;remaining:number;expenses:{id:string;title:string;amount:number;date:string}[]}
interface SpendDay{date:string;total:number}
interface Insight{type:"warning"|"success"|"info"|"tip";message:string}
interface Achievement{icon:string;title:string;unlocked:boolean;desc:string}
interface Preds{budgetRunsOutDate:string|null;projectedMonthEnd:number;projectedSavings:number;topSpendingDay:{date:string;total:number};avgDailySpend:number}
interface DData{user:{name:string;income:number;budget:number;isPremium:boolean};habits:Habit[];expenses:Expense[];goals:Goal[];totalSpent:number;todaySpent:number;dailyBudgetRemaining:number;daysRemaining:number;categoryBreakdown:{category:string;total:number;percent:number}[];categoryDetails:CatDetail[];spendingByDay:SpendDay[];habitsCompleted:number;totalHabits:number;maxStreak:number;weeklyConsistency:number;goalsCompleted:number;totalGoals:number;lifeScore:number;insights:Insight[];predictions:Preds|null;achievements:Achievement[]}

const QC=[{i:"☕",t:"Tea/Coffee",c:"Food"},{i:"🍔",t:"Lunch",c:"Food"},{i:"🛒",t:"Groceries",c:"Shopping"},{i:"🚗",t:"Auto/Cab",c:"Transport"},{i:"⛽",t:"Petrol",c:"Transport"},{i:"📄",t:"Bills",c:"Bills"},{i:"🎬",t:"Movies",c:"Entertainment"},{i:"💊",t:"Medical",c:"Health"},{i:"👕",t:"Shopping",c:"Shopping"},{i:"📚",t:"Education",c:"Education"},{i:"🍕",t:"Snacks",c:"Food"},{i:"📦",t:"Other",c:"Other"}];

export default function DashboardPage(){
  const router=useRouter();
  const[data,setData]=useState<DData|null>(null);
  const[loading,setLoading]=useState(true);
  const[tab,setTab]=useState<"home"|"money"|"habits"|"goals">("home");
  const[toast,setToast]=useState<{message:string;icon:string}|null>(null);
  const[showExpForm,setShowExpForm]=useState(false);
  const[showHabForm,setShowHabForm]=useState(false);
  const[showGoalForm,setShowGoalForm]=useState(false);
  const[expTitle,setExpTitle]=useState("");const[expAmt,setExpAmt]=useState("");const[expCat,setExpCat]=useState("Food");
  const[newHab,setNewHab]=useState("");const[newGoal,setNewGoal]=useState("");
  const[openCat,setOpenCat]=useState<string|null>(null);
  const[showBudSetup,setShowBudSetup]=useState(false);
  const[budCat,setBudCat]=useState("Food");const[budLim,setBudLim]=useState("");
  const[qT,setQT]=useState("");const[qA,setQA]=useState("");const[qC,setQC]=useState("");const[showQA,setShowQA]=useState(false);
  const[showAch,setShowAch]=useState(false);
  const[mood,setMood]=useState<string|null>(null);
  const[started,setStarted]=useState(false);

  const fd=useCallback(async()=>{try{const r=await fetch("/api/dashboard");if(r.status===401){router.push("/auth");return;}setData(await r.json());}catch{}finally{setLoading(false);}},[router]);
  useEffect(()=>{fd();},[fd]);

  const togHab=async(id:string)=>{if(!data)return;const h=data.habits.find(x=>x.id===id);const was=h?.completedToday;setData({...data,habits:data.habits.map(x=>x.id===id?{...x,completedToday:!x.completedToday}:x)});await fetch("/api/habits/toggle",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({habitId:id})});const r=await fetch("/api/dashboard");if(r.ok){const nd=await r.json();setData(nd);if(!was&&h){const ns=(h.streak||0)+1;if([3,7,14,21,30].includes(ns))setToast({message:`${ns}-day streak!`,icon:"🔥"});if(nd.habitsCompleted===nd.totalHabits&&nd.totalHabits>0)setToast({message:"Perfect day! All done!",icon:"⭐"});}}};
  const addExp=async(e:React.FormEvent)=>{e.preventDefault();if(!expTitle||!expAmt)return;await fetch("/api/expenses",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:expTitle,amount:expAmt,category:expCat})});setExpTitle("");setExpAmt("");setExpCat("Food");setShowExpForm(false);fd();};
  const delExp=async(id:string)=>{await fetch(`/api/expenses?id=${id}`,{method:"DELETE"});fd();};
  const subQE=async()=>{if(!qA||parseFloat(qA)<=0)return;await fetch("/api/expenses",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:qT,amount:qA,category:qC})});setQT("");setQA("");setQC("");setShowQA(false);setToast({message:`₹${qA} added`,icon:"✅"});fd();};
  const addHab=async(e:React.FormEvent)=>{e.preventDefault();if(!newHab)return;const r=await fetch("/api/habits",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:newHab})});if(r.status===403){const d=await r.json();alert(d.error);return;}setNewHab("");setShowHabForm(false);fd();};
  const delHab=async(id:string)=>{await fetch(`/api/habits?id=${id}`,{method:"DELETE"});fd();};
  const addGoal_=async(e:React.FormEvent)=>{e.preventDefault();if(!newGoal)return;if(!data?.user.isPremium&&data&&data.totalGoals>=2){alert("Free: 2 goals max.");return;}await fetch("/api/goals",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:newGoal})});setNewGoal("");setShowGoalForm(false);fd();};
  const togGoal=async(id:string,c:boolean)=>{await fetch("/api/goals",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,completed:!c})});fd();};
  const delGoal=async(id:string)=>{await fetch(`/api/goals?id=${id}`,{method:"DELETE"});fd();};
  const saveBud=async()=>{if(!budLim||parseFloat(budLim)<=0)return;await fetch("/api/category-budgets",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({category:budCat,limit:budLim})});setBudLim("");setShowBudSetup(false);fd();};
  const logout=async()=>{await fetch("/api/auth/logout",{method:"POST"});router.push("/");};

  if(loading)return<DashboardSkeleton/>;
  if(!data)return null;

  const P=data.user.isPremium;
  const bp=data.user.budget>0?Math.min(100,(data.totalSpent/data.user.budget)*100):0;
  const bCol=bp>90?"bg-red-500":bp>70?"bg-amber-500":"bg-emerald-500";
  const sav=data.user.income-data.totalSpent;
  const maxD=Math.max(...data.spendingByDay.map(d=>d.total),1);
  const hr=new Date().getHours();
  const inc=data.habits.filter(h=>!h.completedToday);
  const today=new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short"});
  const hp=data.totalHabits>0?Math.round((data.habitsCompleted/data.totalHabits)*100):0;
  const track=Math.round((hp+(bp<=100?100-bp:0))/2);

  const emo=()=>{
    if(data.habitsCompleted===data.totalHabits&&data.totalHabits>0)return"You're becoming disciplined 🔥";
    if(data.habitsCompleted>0)return"Keep going, building momentum 💪";
    if(hr>=19)return"Don't let today go to waste ⚡";
    return"Today is yours. Make it count 🎯";
  };

  const iC=(t:string)=>t==="warning"?"border-l-red-500 bg-red-50":t==="success"?"border-l-emerald-500 bg-emerald-50":t==="tip"?"border-l-amber-500 bg-amber-50":"border-l-blue-500 bg-blue-50";
  const iT=(t:string)=>t==="warning"?"text-red-700":t==="success"?"text-emerald-700":t==="tip"?"text-amber-700":"text-blue-700";

  return(
    <div className="min-h-screen bg-surface-50 pb-24">
      {toast&&<Toast message={toast.message} icon={toast.icon} onClose={()=>setToast(null)}/>}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100/80">
        <div className="max-w-lg mx-auto px-6 py-3 flex items-center justify-between">
          <span className="text-base font-black text-ink-900">Life<span className="text-gradient">OS</span></span>
          <div className="flex items-center gap-2.5">
            {P?<span className="badge-pro">PRO</span>:<button onClick={()=>router.push("/pricing")} className="btn-primary text-[10px] px-3 py-1.5">Upgrade</button>}
            <button onClick={logout} className="text-[10px] text-ink-300 hover:text-ink-500 transition-colors font-medium">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 pt-5 pb-2">

        {/* ═══ HOME ═══ */}
        {tab==="home"&&(
          <div className="space-y-5 animate-fade-in">
            {/* HERO */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-purple-500 to-brand-600 p-7 text-white shadow-glow-lg">
              <div className="relative z-10">
                <p className="text-white/60 text-xs font-medium">{today}</p>
                <h1 className="text-2xl font-black mt-1.5">{getGreeting()}, {data.user.name||"Friend"} 👋</h1>
                <p className="text-white/80 text-sm mt-2 leading-relaxed">{emo()}</p>
                <p className="text-white/60 text-xs mt-3">You&apos;re <span className="font-black text-white">{track}%</span> on track today</p>
                <div className="w-full bg-white/20 rounded-full h-2 mt-2.5">
                  <div className="bg-white h-2 rounded-full transition-all duration-1000" style={{width:`${track}%`}}/>
                </div>
                {!started&&inc.length>0&&hr<20&&(
                  <button onClick={()=>setStarted(true)} className="mt-5 bg-white text-brand-600 font-black text-sm px-8 py-3 rounded-2xl active:scale-95 transition-transform shadow-elevated">
                    Start Your Day →
                  </button>
                )}
              </div>
              <div className="absolute -right-10 -top-10 w-44 h-44 bg-white/10 rounded-full"/>
              <div className="absolute -right-4 -bottom-12 w-32 h-32 bg-white/5 rounded-full"/>
            </div>

            {/* LIFE SCORE */}
            <div className="card p-5 flex items-center gap-5">
              <ProgressRing score={data.lifeScore} size={60} strokeWidth={5}/>
              <div className="flex-1">
                <p className="text-sm font-bold text-ink-900">Life Score</p>
                <p className="text-xs text-ink-300 mt-0.5">{data.lifeScore>=70?"Great! Keep it up":data.lifeScore>=40?"Room to improve":"Let's work on this"}</p>
              </div>
              <div className="text-right"><div className="text-xs font-black text-emerald-500">+{data.weeklyConsistency>50?"5":"2"}</div><div className="text-[9px] text-ink-300">this week</div></div>
            </div>

            {/* AI INSIGHT */}
            {data.insights.length>0&&(
              <div className={`card border-l-[3px] p-5 ${iC(data.insights[0].type)}`}>
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">🤖</span>
                  <div className="flex-1"><p className="text-[9px] font-black text-ink-300 uppercase tracking-widest mb-1.5">AI Insight</p><p className={`text-sm leading-relaxed ${iT(data.insights[0].type)}`}>{data.insights[0].message}</p></div>
                </div>
              </div>
            )}
            {P&&data.insights.length>1&&<div className={`card border-l-[3px] p-5 ${iC(data.insights[1].type)}`}><p className={`text-sm leading-relaxed ${iT(data.insights[1].type)}`}>{data.insights[1].message}</p></div>}
            {!P&&data.insights.length>1&&<button onClick={()=>router.push("/pricing")} className="card p-4 w-full text-center hover:shadow-card-hover transition-all"><p className="text-xs font-bold text-ink-900">{data.insights.length-1} more AI insights</p><p className="text-[10px] text-ink-300">Upgrade to unlock</p></button>}

            {/* TODAY TASKS */}
            {(started||data.habitsCompleted>0)&&data.habits.length>0&&(
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4"><p className="text-sm font-black text-ink-900">Today&apos;s Tasks</p><span className="text-[10px] font-black text-brand-500">{data.habitsCompleted}/{data.totalHabits}</span></div>
                <div className="space-y-2.5">
                  {data.habits.slice(0,3).map(h=>(
                    <button key={h.id} onClick={()=>togHab(h.id)}
                      className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl transition-all active:scale-[0.98] text-left border ${
                        h.completedToday?"bg-emerald-50 border-emerald-100":"bg-surface-50 border-gray-100 hover:border-brand-200 hover:bg-brand-50/30"}`}>
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        h.completedToday?"bg-emerald-500 border-emerald-500":"border-gray-300"}`}>
                        {h.completedToday&&<svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                      </div>
                      <span className={`text-sm flex-1 ${h.completedToday?"text-ink-300 line-through":"text-ink-900 font-semibold"}`}>{h.name}</span>
                      {h.streak>0&&<span className="text-[9px] text-orange-500 font-black">🔥{h.streak}d</span>}
                    </button>
                  ))}
                  {data.habits.length>3&&<button onClick={()=>setTab("habits")} className="text-xs text-brand-500 font-semibold w-full text-center pt-1">+{data.habits.length-3} more →</button>}
                </div>
              </div>
            )}

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-3 gap-3">
              {[{i:"💰",l:"Add Expense",t:"money"},{i:"✅",l:"Log Habit",t:"habits"},{i:"🎯",l:"View Goals",t:"goals"}].map((a,idx)=>(
                <button key={idx} onClick={()=>setTab(a.t as "money"|"habits"|"goals")} className="card p-4 text-center active:scale-95 transition-all hover:shadow-card-hover">
                  <span className="text-2xl block">{a.i}</span><span className="text-[10px] font-semibold text-ink-500 mt-1.5 block">{a.l}</span>
                </button>
              ))}
            </div>

            {/* STATS */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-4 text-center"><div className={`text-lg font-black ${data.todaySpent>data.dailyBudgetRemaining?"text-red-500":"text-ink-900"}`}>{formatCurrency(data.todaySpent)}</div><div className="text-[9px] text-ink-300 mt-1">Spent Today</div></div>
              <div className="card p-4 text-center"><div className={`text-lg font-black ${data.dailyBudgetRemaining>0?"text-emerald-600":"text-red-500"}`}>{formatCurrency(data.dailyBudgetRemaining)}</div><div className="text-[9px] text-ink-300 mt-1">Can Spend</div></div>
              <div className="card p-4 text-center"><div className="text-lg font-black text-orange-500">{data.maxStreak}d</div><div className="text-[9px] text-ink-300 mt-1">Best Streak</div></div>
            </div>

            {/* EVENING */}
            {hr>=19&&data.habitsCompleted>0&&!mood&&(
              <div className="card p-5"><p className="text-sm font-bold text-ink-900 mb-3">How was today?</p>
                <div className="flex gap-3">{[{e:"😊",l:"Great"},{e:"😐",l:"Okay"},{e:"😓",l:"Tough"}].map(m=>(
                  <button key={m.l} onClick={()=>{setMood(m.l);setToast({message:`Logged: ${m.l}`,icon:m.e});}} className="flex-1 card p-3.5 text-center active:scale-95 transition-all hover:shadow-card-hover">
                    <div className="text-2xl">{m.e}</div><div className="text-[10px] text-ink-300 mt-1 font-medium">{m.l}</div>
                  </button>
                ))}</div>
              </div>
            )}

            {/* PREDICTIONS */}
            {P&&data.predictions&&(
              <div className="card p-5"><p className="text-sm font-black text-ink-900 mb-3">Predictions <span className="badge-pro ml-1">PRO</span></p>
                <div className="grid grid-cols-2 gap-3">{[
                  {l:"Avg Daily",v:formatCurrency(data.predictions.avgDailySpend),c:"text-ink-900"},
                  {l:"Month-End",v:formatCurrency(data.predictions.projectedMonthEnd),c:"text-ink-900"},
                  {l:"Savings",v:formatCurrency(Math.abs(data.predictions.projectedSavings)),c:data.predictions.projectedSavings>=0?"text-emerald-600":"text-red-500"},
                  {l:"Status",v:data.predictions.budgetRunsOutDate||"On Track ✓",c:data.predictions.budgetRunsOutDate?"text-red-500":"text-emerald-600"},
                ].map((p,i)=><div key={i} className="card-flat p-4"><div className="text-[9px] text-ink-300 font-medium">{p.l}</div><div className={`text-sm font-black mt-0.5 ${p.c}`}>{p.v}</div></div>)}</div>
              </div>
            )}

            {/* ACHIEVEMENTS */}
            {data.achievements&&(
              <div className="card overflow-hidden">
                <button onClick={()=>setShowAch(!showAch)} className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-50 transition-colors">
                  <div className="flex items-center gap-2"><span className="text-sm font-bold text-ink-900">Achievements</span><span className="text-[10px] text-ink-300">{data.achievements.filter(a=>a.unlocked).length}/{data.achievements.length}</span></div>
                  <svg className={`w-4 h-4 text-ink-300 transition-transform ${showAch?"rotate-180":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </button>
                {showAch&&<div className="px-4 pb-4 grid grid-cols-4 gap-2.5 animate-fade-in">{data.achievements.map((a,i)=>(<div key={i} className={`rounded-2xl p-3 text-center border ${a.unlocked?"bg-white border-gray-100 shadow-card":"bg-surface-50 border-gray-50 opacity-30"}`}><div className={`text-xl ${!a.unlocked?"grayscale":""}`}>{a.icon}</div><div className="text-[7px] font-bold text-ink-500 mt-1">{a.title}</div></div>))}</div>}
              </div>
            )}

            {/* UPGRADE */}
            {!P&&<button onClick={()=>router.push("/pricing")} className="card w-full p-5 flex items-center justify-between hover:shadow-card-hover active:scale-[0.99] transition-all text-left"><div><p className="text-sm font-bold text-ink-900">Unlock Premium</p><p className="text-[10px] text-ink-300 mt-0.5">AI insights, charts, unlimited habits</p></div><span className="btn-primary text-[10px] px-4 py-2">₹99/mo</span></button>}

            {P&&sav>0&&<div className="card p-5 border-l-[3px] border-l-emerald-500 bg-emerald-50"><p className="text-sm font-semibold text-emerald-700">Saving {formatCurrency(sav)} this month</p><p className="text-[10px] text-emerald-600/60">= {formatCurrency(sav*12)}/year</p></div>}
          </div>
        )}

        {/* ═══ MONEY ═══ */}
        {tab==="money"&&(
          <div className="space-y-5 animate-fade-in">
            {openCat?(<>{(()=>{const c=data.categoryDetails?.find(x=>x.category===openCat);if(!c)return null;return(<>
              <div className="card p-6">
                <button onClick={()=>setOpenCat(null)} className="text-xs text-brand-500 font-semibold mb-4 flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>Back</button>
                <div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-surface-50 flex items-center justify-center text-2xl border border-gray-100">{getCategoryEmoji(c.category)}</div><div className="flex-1"><div className="font-bold text-ink-900 text-lg">{c.category}</div><div className="text-xs text-ink-300">{c.limit>0?`Budget: ${formatCurrency(c.limit)}`:"No budget"}</div></div><div className={`text-xl font-black ${c.exceeded?"text-red-500":"text-ink-900"}`}>{formatCurrency(c.spent)}</div></div>
                {c.limit>0&&<><div className="w-full bg-gray-100 rounded-full h-2"><div className={`h-2 rounded-full transition-all duration-700 ${c.exceeded?"bg-red-500":c.percent>70?"bg-amber-500":"bg-emerald-500"}`} style={{width:`${Math.min(c.percent,100)}%`}}/></div><div className="flex justify-between mt-2"><span className={`text-xs font-semibold ${c.exceeded?"text-red-500":"text-emerald-600"}`}>{c.exceeded?`Over ${formatCurrency(c.spent-c.limit)}`:`${formatCurrency(c.remaining)} left`}</span><span className="text-xs text-ink-300">{c.percent}%</span></div></>}
              </div>
              <div className="card p-5"><h3 className="font-bold text-sm text-ink-900 mb-3">Expenses ({c.expenses.length})</h3><div className="space-y-2">{c.expenses.length===0?<p className="text-center py-6 text-sm text-ink-300">No expenses yet. Start tracking!</p>:c.expenses.map(e=>(<div key={e.id} className="flex items-center justify-between p-3 rounded-2xl bg-surface-50 border border-gray-100"><div><div className="text-sm font-medium text-ink-900">{e.title}</div><div className="text-[10px] text-ink-300">{e.date}</div></div><div className="flex items-center gap-2"><span className="text-sm font-bold text-red-500">-{formatCurrency(e.amount)}</span><button onClick={()=>delExp(e.id)} className="text-ink-100 hover:text-red-500 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button></div></div>))}</div></div>
              <div className="card p-5"><h3 className="font-bold text-sm text-ink-900 mb-3">Add {c.category} Expense</h3><div className="flex gap-2"><input type="text" value={expTitle} onChange={e=>setExpTitle(e.target.value)} placeholder="What?" className="input-field flex-1"/><div className="relative w-24"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300 text-xs">₹</span><input type="number" value={expAmt} onChange={e=>setExpAmt(e.target.value)} placeholder="Amt" className="input-field pl-6"/></div><button onClick={async()=>{if(!expTitle||!expAmt)return;await fetch("/api/expenses",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:expTitle,amount:expAmt,category:c.category})});setExpTitle("");setExpAmt("");fd();}} className="btn-primary px-4 py-2.5 text-xs">Add</button></div></div>
            </>)})()}</>
            ):(<>
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4"><h2 className="font-black text-ink-900 text-lg">Budget</h2><button onClick={()=>setShowBudSetup(!showBudSetup)} className="text-xs text-brand-500 font-semibold">Set Limits</button></div>
                <div className="flex justify-between text-sm mb-2.5"><span className="text-ink-500">Spent: <b className="text-ink-900">{formatCurrency(data.totalSpent)}</b></span><span className="text-ink-500">of <b className="text-ink-900">{formatCurrency(data.user.budget)}</b></span></div>
                <div className="w-full bg-gray-100 rounded-full h-3"><div className={`${bCol} h-3 rounded-full transition-all duration-1000`} style={{width:`${Math.min(bp,100)}%`}}/></div>
                <div className="flex justify-between mt-2"><span className="text-xs text-ink-300">{formatCurrency(Math.max(0,data.user.budget-data.totalSpent))} left</span><span className="text-xs text-ink-300">{data.daysRemaining}d • {formatCurrency(data.dailyBudgetRemaining)}/day</span></div>
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
                  <div className="text-center"><div className="text-sm font-black text-ink-900">{formatCurrency(data.user.income)}</div><div className="text-[9px] text-ink-300">Income</div></div>
                  <div className="text-center"><div className="text-sm font-black text-ink-900">{formatCurrency(data.dailyBudgetRemaining)}</div><div className="text-[9px] text-ink-300">Per Day</div></div>
                  <div className="text-center"><div className={`text-sm font-black ${sav>=0?"text-emerald-600":"text-red-500"}`}>{formatCurrency(Math.abs(sav))}</div><div className="text-[9px] text-ink-300">{sav>=0?"Saved":"Over"}</div></div>
                </div>
              </div>

              {showBudSetup&&!P&&<div className="card p-6 text-center"><span className="text-3xl block mb-3">🔒</span><p className="font-bold text-ink-900 mb-1">Category Budgets</p><p className="text-xs text-ink-300 mb-4">Set per-category limits</p><button onClick={()=>router.push("/pricing")} className="btn-primary px-6 py-2.5 text-sm">Unlock Premium</button></div>}
              {showBudSetup&&P&&<div className="card p-5 space-y-3"><h3 className="font-bold text-sm text-ink-900">Set Budget</h3><div className="flex gap-2"><select value={budCat} onChange={e=>setBudCat(e.target.value)} className="input-field w-auto text-sm">{["Food","Transport","Shopping","Bills","Entertainment","Health","Education","Other"].map(c=><option key={c} value={c}>{getCategoryEmoji(c)} {c}</option>)}</select><div className="relative flex-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300 text-xs">₹</span><input type="number" value={budLim} onChange={e=>setBudLim(e.target.value)} placeholder="Limit" className="input-field pl-6" onKeyDown={e=>e.key==="Enter"&&saveBud()}/></div><button onClick={saveBud} className="btn-primary px-4 py-2.5 text-xs">Set</button></div></div>}

              <div className="card p-5"><h3 className="font-bold text-sm text-ink-900 mb-3">Categories</h3>
                <div className="space-y-2">{data.categoryDetails&&data.categoryDetails.length>0?data.categoryDetails.map((c,i)=>(
                  <button key={i} onClick={()=>P?setOpenCat(c.category):router.push("/pricing")} className="w-full text-left card-flat border border-gray-100 rounded-2xl p-4 hover:shadow-card-hover hover:-translate-y-0.5 transition-all active:scale-[0.99]">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="text-lg">{getCategoryEmoji(c.category)}</span><div><div className="text-sm font-semibold text-ink-900">{c.category}</div><div className="text-[9px] text-ink-300">{c.expenses.length} item{c.expenses.length!==1?"s":""}</div></div></div><div className="text-right"><div className={`text-sm font-black ${c.exceeded?"text-red-500":"text-ink-900"}`}>{formatCurrency(c.spent)}</div>{c.limit>0&&<div className="text-[9px] text-ink-300">of {formatCurrency(c.limit)}</div>}</div></div>
                    {c.limit>0&&<div className="w-full bg-gray-100 rounded-full h-1.5 mt-2.5"><div className={`h-1.5 rounded-full ${c.exceeded?"bg-red-500":c.percent>70?"bg-amber-500":"bg-emerald-500"}`} style={{width:`${Math.min(c.percent,100)}%`}}/></div>}
                  </button>
                )):<p className="text-center py-8 text-sm text-ink-300">No expenses yet. Add your first one below! 👇</p>}</div>
              </div>

              <div className="card p-5"><h3 className="font-bold text-sm text-ink-900 mb-3">Add Expense</h3>
                {!showQA?(<>
                  <div className="grid grid-cols-4 gap-2.5 mb-3">{QC.map((q,i)=>(<button key={i} onClick={()=>{setQT(q.t);setQC(q.c);setQA("");setShowQA(true);}} className="card-flat border border-gray-100 rounded-2xl p-3 text-center hover:shadow-card hover:border-brand-200 hover:bg-brand-50/30 transition-all active:scale-95"><div className="text-xl">{q.i}</div><div className="text-[8px] font-semibold text-ink-300 mt-1">{q.t}</div></button>))}</div>
                  <button onClick={()=>setShowExpForm(!showExpForm)} className="w-full text-[10px] text-ink-300 py-1 font-medium">{showExpForm?"Close":"Enter manually"}</button>
                </>):(
                  <div className="space-y-3 animate-fade-in">
                    <div className="card-flat border border-gray-100 rounded-2xl p-4 text-center"><div className="text-[10px] text-ink-300">Adding</div><div className="text-lg font-black text-ink-900">{qT}</div></div>
                    <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300 font-bold text-lg">₹</span><input type="number" value={qA} onChange={e=>setQA(e.target.value)} placeholder="0" className="input-field pl-10 text-3xl font-black text-center py-5" autoFocus onKeyDown={e=>e.key==="Enter"&&subQE()}/></div>
                    <div className="flex gap-2.5"><button onClick={subQE} disabled={!qA||parseFloat(qA)<=0} className="flex-1 btn-primary py-3.5 text-sm font-bold disabled:opacity-30">Add Expense</button><button onClick={()=>{setShowQA(false);setQT("");setQA("");}} className="btn-secondary px-5 py-3.5 text-sm">Back</button></div>
                  </div>
                )}
              </div>

              {showExpForm&&!showQA&&<form onSubmit={addExp} className="card p-5 space-y-3 animate-fade-in"><input type="text" value={expTitle} onChange={e=>setExpTitle(e.target.value)} placeholder="What did you spend on?" className="input-field" required autoFocus/><div className="flex gap-2"><div className="relative flex-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300">₹</span><input type="number" value={expAmt} onChange={e=>setExpAmt(e.target.value)} placeholder="Amount" className="input-field pl-7" required/></div><select value={expCat} onChange={e=>setExpCat(e.target.value)} className="input-field w-auto">{["Food","Transport","Shopping","Bills","Entertainment","Health","Education","Other"].map(c=><option key={c} value={c}>{getCategoryEmoji(c)} {c}</option>)}</select></div><button type="submit" className="btn-primary w-full py-3 text-sm">Add Expense</button></form>}

              <div className="card p-5 relative"><h3 className="font-bold text-sm mb-3 text-ink-900">Last 7 Days</h3>
                {!P&&<div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center"><span className="text-2xl mb-2">📊</span><p className="text-xs font-bold text-ink-900">Premium Feature</p><button onClick={()=>router.push("/pricing")} className="btn-primary px-5 py-2 text-xs mt-2">Upgrade</button></div>}
                <div className={`flex items-end gap-2 h-28 ${!P?"blur-sm":""}`}>{data.spendingByDay.map((d,i)=>(<div key={i} className="flex-1 flex flex-col items-center gap-1"><span className="text-[8px] text-ink-300">{d.total>0?`₹${d.total}`:""}</span><div className={`w-full rounded-lg transition-all duration-500 ${d.total>0?"bg-brand-500":"bg-gray-100"}`} style={{height:`${d.total>0?Math.max(8,(d.total/maxD)*72):4}px`}}/><span className="text-[8px] text-ink-300">{getDayName(d.date)}</span></div>))}</div>
              </div>

              <div className="card p-5"><h3 className="font-bold text-sm mb-3 text-ink-900">Recent</h3>
                <div className="space-y-1">{data.expenses.length===0?<p className="text-center py-8 text-sm text-ink-300">No expenses yet. Start tracking! 📝</p>:data.expenses.slice(0,8).map(e=>(
                  <div key={e.id} className="flex items-center justify-between py-2.5 hover:bg-surface-50 rounded-xl px-2 transition-colors">
                    <div className="flex items-center gap-2.5"><span className="text-base">{getCategoryEmoji(e.category)}</span><div><div className="text-sm font-medium text-ink-900">{e.title}</div><div className="text-[9px] text-ink-300">{e.category} • {e.date}</div></div></div>
                    <div className="flex items-center gap-2"><span className="text-sm font-bold text-red-500">-{formatCurrency(e.amount)}</span><button onClick={()=>delExp(e.id)} className="text-ink-100 hover:text-red-500 transition-colors"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button></div>
                  </div>
                ))}</div>
              </div>
            </>)}
          </div>
        )}

        {/* ═══ HABITS ═══ */}
        {tab==="habits"&&(
          <div className="space-y-5 animate-fade-in">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4"><h2 className="font-black text-ink-900 text-lg">Habits</h2><button onClick={()=>setShowHabForm(!showHabForm)} className="btn-primary text-[10px] px-3.5 py-2 active:scale-95">+ Add Habit</button></div>
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 flex-shrink-0"><svg className="-rotate-90" width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="23" stroke="#F3F4F6" strokeWidth="5" fill="none"/><circle cx="28" cy="28" r="23" stroke="#6366F1" strokeWidth="5" fill="none" strokeDasharray={`${data.totalHabits>0?(data.habitsCompleted/data.totalHabits)*144.5:0} 144.5`} strokeLinecap="round" style={{transition:"stroke-dashoffset 0.7s ease"}}/></svg><div className="absolute inset-0 flex items-center justify-center"><span className="text-[10px] font-black text-ink-900">{data.habitsCompleted}/{data.totalHabits}</span></div></div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 flex-1"><div><div className="text-base font-black text-orange-500">{data.maxStreak}d</div><div className="text-[9px] text-ink-300">Best Streak</div></div><div><div className="text-base font-black text-ink-900">{data.weeklyConsistency}%</div><div className="text-[9px] text-ink-300">This Week</div></div></div>
              </div>
              {!P&&data.totalHabits>=3&&<div className="flex items-center justify-between p-3 bg-surface-50 rounded-2xl mt-4 border border-gray-100"><div><p className="text-xs font-bold text-ink-900">Limit reached (3/3)</p><p className="text-[9px] text-ink-300">Upgrade for unlimited</p></div><button onClick={()=>router.push("/pricing")} className="btn-primary px-3 py-1.5 text-[9px]">Upgrade</button></div>}
            </div>

            {showHabForm&&<form onSubmit={addHab} className="card p-4 flex gap-2 animate-fade-in"><input type="text" value={newHab} onChange={e=>setNewHab(e.target.value)} placeholder="New habit name..." className="input-field flex-1" required autoFocus/><button type="submit" className="btn-primary px-5 py-2.5 text-sm">Add</button></form>}

            {data.habitsCompleted===data.totalHabits&&data.totalHabits>0&&<div className="card p-5 bg-emerald-50 border-emerald-100 text-center animate-scale-in"><span className="text-3xl">⭐</span><p className="text-sm font-black text-emerald-700 mt-1">Perfect Day!</p><p className="text-[10px] text-emerald-600/60">You&apos;re becoming disciplined 🔥</p></div>}

            <div className="space-y-3">{data.habits.length===0?<div className="card p-10 text-center"><span className="text-4xl block mb-3">🌱</span><p className="text-sm text-ink-300">Add your first habit to start building streaks</p></div>:
              [...data.habits].sort((a,b)=>Number(a.completedToday)-Number(b.completedToday)).map(h=>(
                <div key={h.id} className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <button onClick={()=>togHab(h.id)} className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${h.completedToday?"bg-emerald-500 border-emerald-500":"border-gray-200 hover:border-brand-400"}`}>
                        {h.completedToday&&<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                      </button>
                      <div><span className={`text-sm font-semibold ${h.completedToday?"text-ink-300 line-through":"text-ink-900"}`}>{h.name}</span>{h.streak>0&&<span className="ml-2 text-[9px] text-orange-500 font-black">🔥 {h.streak}d</span>}</div>
                    </div>
                    <button onClick={()=>delHab(h.id)} className="text-ink-100 hover:text-red-500 transition-colors p-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
                  </div>
                  {P?<div className="flex gap-1.5">{h.weekCompletions.map((d,i)=>(<div key={i} className="flex-1 text-center"><div className={`w-full aspect-square rounded-xl flex items-center justify-center text-[10px] font-bold border ${d.done?"bg-emerald-50 text-emerald-600 border-emerald-200":"bg-surface-50 text-ink-100 border-gray-100"}`}>{d.done?"✓":"·"}</div><div className="text-[7px] text-ink-300 mt-1">{getDayName(d.date)}</div></div>))}</div>
                  :<div className="relative"><div className="flex gap-1.5 blur-[3px] opacity-30">{h.weekCompletions.map((d,i)=>(<div key={i} className="flex-1 text-center"><div className="w-full aspect-square rounded-xl bg-surface-50 border border-gray-100"/><div className="text-[7px] text-ink-300 mt-1">{getDayName(d.date)}</div></div>))}</div><div className="absolute inset-0 flex items-center justify-center"><button onClick={()=>router.push("/pricing")} className="card px-4 py-2 text-[10px] font-semibold shadow-card hover:shadow-card-hover active:scale-95 transition-all">Unlock Weekly View</button></div></div>}
                </div>
              ))}</div>
          </div>
        )}

        {/* ═══ GOALS ═══ */}
        {tab==="goals"&&(
          <div className="space-y-5 animate-fade-in">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4"><h2 className="font-black text-ink-900 text-lg">Goals</h2><button onClick={()=>setShowGoalForm(!showGoalForm)} className="btn-primary text-[10px] px-3.5 py-2 active:scale-95">+ Add Goal</button></div>
              <div className="grid grid-cols-2 gap-3"><div className="text-center p-3 bg-emerald-50 rounded-2xl border border-emerald-100"><div className="text-xl font-black text-emerald-600">{data.goalsCompleted}/{data.totalGoals}</div><div className="text-[9px] text-emerald-700/60 font-bold">Done</div></div><div className="text-center p-3 bg-surface-50 rounded-2xl border border-gray-100"><div className="text-xl font-black text-ink-900">{data.totalGoals-data.goalsCompleted}</div><div className="text-[9px] text-ink-300 font-bold">In Progress</div></div></div>
              {!P&&data.totalGoals>=2&&<div className="flex items-center justify-between p-3 bg-surface-50 rounded-2xl mt-3 border border-gray-100"><div><p className="text-xs font-bold text-ink-900">Limit (2/2)</p><p className="text-[9px] text-ink-300">Upgrade for unlimited</p></div><button onClick={()=>router.push("/pricing")} className="btn-primary px-3 py-1.5 text-[9px]">Upgrade</button></div>}
            </div>

            {showGoalForm&&<form onSubmit={addGoal_} className="card p-4 flex gap-2 animate-fade-in"><input type="text" value={newGoal} onChange={e=>setNewGoal(e.target.value)} placeholder="e.g. Save ₹10,000 this month" className="input-field flex-1" required autoFocus/><button type="submit" className="btn-primary px-5 py-2.5 text-sm">Add</button></form>}

            <div className="space-y-2.5">{data.goals.length===0?<div className="card p-10 text-center"><span className="text-4xl block mb-3">🎯</span><p className="text-sm text-ink-300">Set your first goal and start achieving!</p></div>:
              [...data.goals].sort((a,b)=>Number(a.completed)-Number(b.completed)).map(g=>(
                <div key={g.id} className="card px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={()=>togGoal(g.id,g.completed)} className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${g.completed?"bg-emerald-500 border-emerald-500":"border-gray-200 hover:border-brand-400"}`}>
                      {g.completed&&<svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                    </button>
                    <span className={`text-sm ${g.completed?"text-ink-300 line-through":"text-ink-900 font-semibold"}`}>{g.title}</span>
                  </div>
                  <button onClick={()=>delGoal(g.id)} className="text-ink-100 hover:text-red-500 transition-colors p-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
              ))}</div>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100/80 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
          {([
            {id:"home" as const,l:"Home",d:"M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"},
            {id:"money" as const,l:"Money",d:"M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"},
            {id:"habits" as const,l:"Habits",d:"M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"},
            {id:"goals" as const,l:"Goals",d:"M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"},
          ]).map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className={`flex flex-col items-center gap-0.5 px-5 py-2 rounded-2xl transition-all active:scale-90 ${tab===t.id?"text-brand-500":"text-ink-300 hover:text-ink-500"}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={tab===t.id?2.5:1.5}><path strokeLinecap="round" strokeLinejoin="round" d={t.d}/></svg>
              <span className={`text-[9px] ${tab===t.id?"font-black":"font-medium"}`}>{t.l}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
