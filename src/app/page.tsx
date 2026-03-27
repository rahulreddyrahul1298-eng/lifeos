"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const target = 15000;
    const dur = 2000;
    const step = target / (dur / 16);
    let c = 0;
    const t = setInterval(() => { c += step; if (c >= target) { setCount(target); clearInterval(t); } else setCount(Math.floor(c)); }, 16);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-dark-bg relative overflow-hidden">
      {/* Animated BG */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent-primary/10 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-secondary/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: "3s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-primary/5 rounded-full blur-[150px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <span className="text-xl font-black">Life<span className="text-gradient">OS</span></span>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/auth")} className="text-sm text-white/50 hover:text-white transition-colors">Log in</button>
          <button onClick={() => router.push("/auth")} className="btn-primary px-5 py-2.5 text-sm">Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-16 pb-20 text-center">
        <div className="inline-block mb-6">
          <span className="glass px-4 py-1.5 text-xs font-semibold text-accent-primary inline-block">
            ✨ Join {count.toLocaleString()}+ people fixing their life
          </span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black leading-tight tracking-tight">Fix Your Life<br /><span className="text-gradient">in 30 Days</span></h1>
        <p className="text-lg text-white/50 mt-6 max-w-xl mx-auto leading-relaxed">Money. Discipline. Habits. One system.<br />Track spending, build habits, and see real improvement — every single day.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <button onClick={() => router.push("/auth")} className="btn-primary px-10 py-4 text-lg font-bold shadow-glow-lg hover:shadow-glow active:scale-95 transition-all w-full sm:w-auto">Start Free Challenge →</button>
          <span className="text-sm text-white/30">No credit card required</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-16 max-w-lg mx-auto">
          {[{ v: "10K+", l: "Active Users" }, { v: "₹15Cr", l: "Money Saved" }, { v: "4.8★", l: "Rating" }].map((s, i) => (
            <div key={i} className="glass p-4 text-center"><div className="text-xl font-black text-white">{s.v}</div><div className="text-[10px] text-white/40 mt-1 font-medium">{s.l}</div></div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-black text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { s: "01", i: "🎯", t: "Pick Your Goal", d: "Tell us what you want to fix — money, health, discipline, or focus." },
            { s: "02", i: "📋", t: "Get Your Plan", d: "We create a personalized 30-day plan with 3 daily tasks." },
            { s: "03", i: "🔥", t: "Build Streaks", d: "Complete tasks daily, build streaks, and watch your life transform." },
          ].map((item, idx) => (
            <div key={idx} className="glass p-6 text-center hover:bg-white/[0.08] transition-all group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{item.i}</div>
              <div className="text-xs font-bold text-accent-primary mb-2">STEP {item.s}</div>
              <h3 className="text-lg font-bold mb-2">{item.t}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-black text-center mb-4">Everything You Need</h2>
        <p className="text-center text-white/40 mb-12">One app to track money, habits, and progress</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { i: "💰", t: "Expense Tracking", tag: "FREE" }, { i: "🔄", t: "Habit Streaks", tag: "FREE" }, { i: "🎯", t: "Goal Setting", tag: "FREE" },
            { i: "📊", t: "Life Score", tag: "FREE" }, { i: "🤖", t: "AI Insights", tag: "PRO" }, { i: "📈", t: "Predictions", tag: "PRO" },
            { i: "📅", t: "Weekly Reports", tag: "PRO" }, { i: "🏆", t: "Achievements", tag: "FREE" }, { i: "⚡", t: "Smart Alerts", tag: "PRO" },
          ].map((f, idx) => (
            <div key={idx} className="glass p-4 hover:bg-white/[0.08] transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{f.i}</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${f.tag === "PRO" ? "bg-accent-primary/20 text-accent-primary" : "bg-green-500/20 text-green-400"}`}>{f.tag}</span>
              </div>
              <div className="text-sm font-bold">{f.t}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-black text-center mb-12">Real Results</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { n: "Priya K.", q: "Saved ₹8,000 in my first month. The spending insights are eye-opening.", r: "Marketing Executive" },
            { n: "Rahul S.", q: "21-day gym streak! LifeOS keeps me accountable every single day.", r: "Software Developer" },
            { n: "Sneha M.", q: "Finally broke my Swiggy addiction. My Life Score went from 35 to 78!", r: "Student" },
          ].map((t, idx) => (
            <div key={idx} className="glass p-5">
              <div className="flex items-center gap-1 mb-3">{[1,2,3,4,5].map(s => <span key={s} className="text-amber-400 text-sm">★</span>)}</div>
              <p className="text-sm text-white/70 leading-relaxed mb-4">&ldquo;{t.q}&rdquo;</p>
              <div><div className="text-sm font-bold">{t.n}</div><div className="text-[10px] text-white/30">{t.r}</div></div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-black text-center mb-4">Simple Pricing</h2>
        <p className="text-center text-white/40 mb-12">Start free. Upgrade when ready.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="glass p-6">
            <div className="text-sm font-bold text-white/50 mb-1">Free</div>
            <div className="text-3xl font-black mb-4">₹0</div>
            <div className="space-y-2 mb-6">{["Expense tracking", "3 habits", "Life Score", "2 goals", "Achievements"].map((f, i) => (<div key={i} className="flex items-center gap-2 text-sm text-white/60"><span className="text-green-400">✓</span>{f}</div>))}</div>
            <button onClick={() => router.push("/auth")} className="btn-outline w-full py-3 text-sm">Start Free</button>
          </div>
          <div className="glass p-6 border-accent-primary/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-primary text-white text-[9px] font-black px-3 py-1 rounded-bl-xl">POPULAR</div>
            <div className="text-sm font-bold text-accent-primary mb-1">Premium</div>
            <div className="text-3xl font-black mb-1">₹99<span className="text-lg text-white/40 font-normal">/mo</span></div>
            <div className="text-xs text-white/30 mb-4">Save ₹15,000+/month</div>
            <div className="space-y-2 mb-6">{["Everything in Free", "AI insights & predictions", "Unlimited habits & goals", "Spending charts", "Weekly calendar", "Monthly reports"].map((f, i) => (<div key={i} className="flex items-center gap-2 text-sm text-white/60"><span className="text-accent-primary">✓</span>{f}</div>))}</div>
            <button onClick={() => router.push("/auth")} className="btn-primary w-full py-3 text-sm shadow-glow">Get Premium</button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-black mb-4">Ready to fix your life?</h2>
        <p className="text-white/40 mb-8">Join 10,000+ people transforming their daily habits.</p>
        <button onClick={() => router.push("/auth")} className="btn-primary px-12 py-4 text-lg font-bold shadow-glow-lg active:scale-95 transition-all">Start Free Challenge →</button>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <span className="text-sm font-bold">Life<span className="text-gradient">OS</span></span>
          <span className="text-xs text-white/20">© 2024 LifeOS. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
