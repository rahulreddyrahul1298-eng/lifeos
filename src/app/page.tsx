"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  useEffect(() => { let c=0; const t=setInterval(()=>{c+=120;if(c>=15000){setCount(15000);clearInterval(t);}else setCount(Math.floor(c));},16); return()=>clearInterval(t); }, []);

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Subtle BG */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-brand-50/80 to-transparent rounded-full" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-purple-50/60 to-transparent rounded-full" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <span className="text-xl font-black text-ink-900">Life<span className="text-gradient">OS</span></span>
        <div className="flex items-center gap-4">
          <button onClick={()=>router.push("/auth")} className="text-sm text-ink-500 hover:text-ink-900 font-medium transition-colors">Log in</button>
          <button onClick={()=>router.push("/auth")} className="btn-primary px-5 py-2.5 text-sm">Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-brand-600">{count.toLocaleString()}+ people already improving</span>
        </div>

        <h1 className="text-5xl sm:text-7xl font-black text-ink-900 leading-[1.1] tracking-tight">
          Fix Your Life<br /><span className="text-gradient">in 30 Days</span>
        </h1>
        <p className="text-lg sm:text-xl text-ink-500 mt-6 max-w-xl mx-auto leading-relaxed">
          Money. Discipline. Habits. One system.<br />
          Track spending, build habits, and see real improvement.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <button onClick={()=>router.push("/auth")} className="btn-primary px-10 py-4 text-lg font-bold w-full sm:w-auto">
            Start Free Challenge →
          </button>
        </div>
        <p className="text-xs text-ink-300 mt-4">No credit card required • Free forever plan</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-20 max-w-md mx-auto">
          {[{v:"10K+",l:"Active Users"},{v:"₹15Cr",l:"Money Saved"},{v:"4.8★",l:"Rating"}].map((s,i)=>(
            <div key={i} className="card p-5 text-center"><div className="text-2xl font-black text-ink-900">{s.v}</div><div className="text-[11px] text-ink-300 mt-1 font-medium">{s.l}</div></div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 bg-surface-50 py-20 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-4">How It Works</h2>
          <p className="text-center text-ink-500 mb-14">Three steps to a better life</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {s:"01",i:"🎯",t:"Pick Your Goal",d:"Tell us what you want to fix — money, health, discipline, or focus."},
              {s:"02",i:"📋",t:"Get Your Plan",d:"We create a personalized plan with 3 daily tasks designed for you."},
              {s:"03",i:"🔥",t:"Build Streaks",d:"Complete tasks daily, build streaks, and watch your life transform."},
            ].map((item,idx)=>(
              <div key={idx} className="card p-8 text-center group hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300">
                <div className="text-5xl mb-5 group-hover:scale-110 transition-transform duration-300">{item.i}</div>
                <div className="text-xs font-bold text-brand-500 mb-3 tracking-wider">STEP {item.s}</div>
                <h3 className="text-lg font-bold text-ink-900 mb-2">{item.t}</h3>
                <p className="text-sm text-ink-500 leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-4">Everything You Need</h2>
          <p className="text-center text-ink-500 mb-14">One app to track money, habits, and progress</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              {i:"💰",t:"Expense Tracking",tag:"FREE"},{i:"🔄",t:"Habit Streaks",tag:"FREE"},{i:"🎯",t:"Goal Setting",tag:"FREE"},
              {i:"📊",t:"Life Score",tag:"FREE"},{i:"🤖",t:"AI Insights",tag:"PRO"},{i:"📈",t:"Predictions",tag:"PRO"},
              {i:"📅",t:"Weekly Reports",tag:"PRO"},{i:"🏆",t:"Achievements",tag:"FREE"},{i:"⚡",t:"Smart Alerts",tag:"PRO"},
            ].map((f,i)=>(
              <div key={i} className="card p-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{f.i}</span>
                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${f.tag==="PRO"?"bg-brand-50 text-brand-500":"bg-green-50 text-green-600"}`}>{f.tag}</span>
                </div>
                <div className="text-sm font-bold text-ink-900">{f.t}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 bg-surface-50 py-20 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-14">Real Results</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {n:"Priya K.",q:"Saved ₹8,000 in my first month. The spending insights are eye-opening.",r:"Marketing Executive"},
              {n:"Rahul S.",q:"21-day gym streak! LifeOS keeps me accountable every single day.",r:"Software Developer"},
              {n:"Sneha M.",q:"Finally broke my Swiggy addiction. My Life Score went from 35 to 78!",r:"Student"},
            ].map((t,i)=>(
              <div key={i} className="card p-6">
                <div className="flex items-center gap-1 mb-4">{[1,2,3,4,5].map(s=><span key={s} className="text-amber-400 text-sm">★</span>)}</div>
                <p className="text-sm text-ink-700 leading-relaxed mb-5">&ldquo;{t.q}&rdquo;</p>
                <div><div className="text-sm font-bold text-ink-900">{t.n}</div><div className="text-xs text-ink-300">{t.r}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-4">Simple Pricing</h2>
          <p className="text-center text-ink-500 mb-14">Start free. Upgrade when you&apos;re ready.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div className="card p-8">
              <div className="text-sm font-bold text-ink-300 mb-2">Free</div>
              <div className="text-4xl font-black text-ink-900 mb-6">₹0</div>
              <div className="space-y-3 mb-8">{["Expense tracking","3 habits","Life Score","2 goals","Achievements"].map((f,i)=>(<div key={i} className="flex items-center gap-3 text-sm text-ink-700"><span className="text-green-500 font-bold">✓</span>{f}</div>))}</div>
              <button onClick={()=>router.push("/auth")} className="btn-secondary w-full py-3.5 text-sm">Start Free</button>
            </div>
            <div className="card p-8 border-brand-500/20 relative overflow-hidden ring-2 ring-brand-500/10">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-brand-500 to-purple-500 text-white text-[9px] font-black px-4 py-1.5 rounded-bl-2xl">POPULAR</div>
              <div className="text-sm font-bold text-brand-500 mb-2">Premium</div>
              <div className="text-4xl font-black text-ink-900 mb-1">₹99<span className="text-lg text-ink-300 font-normal">/mo</span></div>
              <p className="text-xs text-ink-300 mb-6">Save ₹15,000+/month with insights</p>
              <div className="space-y-3 mb-8">{["Everything in Free","AI insights & predictions","Unlimited habits & goals","Spending charts","Weekly calendar","Monthly reports"].map((f,i)=>(<div key={i} className="flex items-center gap-3 text-sm text-ink-700"><span className="text-brand-500 font-bold">✓</span>{f}</div>))}</div>
              <button onClick={()=>router.push("/auth")} className="btn-primary w-full py-3.5 text-sm">Get Premium</button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-24 text-center bg-surface-50 border-t border-gray-100">
        <h2 className="text-3xl font-black text-ink-900 mb-4">Ready to fix your life?</h2>
        <p className="text-ink-500 mb-8">Join 10,000+ people who are already transforming their daily habits.</p>
        <button onClick={()=>router.push("/auth")} className="btn-primary px-12 py-4 text-lg font-bold">Start Free Challenge →</button>
      </section>

      <footer className="relative z-10 border-t border-gray-100 py-8 bg-white">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <span className="text-sm font-bold text-ink-900">Life<span className="text-gradient">OS</span></span>
          <span className="text-xs text-ink-300">© 2024 LifeOS. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
