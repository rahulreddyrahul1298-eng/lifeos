"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [savedAmount, setSavedAmount] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Animated counter
  useEffect(() => {
    const target = 15000;
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      setSavedAmount(Math.round(current));
    }, 16);
    return () => clearInterval(timer);
  }, []);

  const testimonials = [
    { name: "Priya K.", role: "Software Engineer", text: "Saved 18,000 in my first month. The predictions showed me I was overspending on food." },
    { name: "Rahul S.", role: "College Student", text: "My pocket money used to run out by 20th. Now it lasts the full month plus I save 2,000." },
    { name: "Sneha M.", role: "Marketing Manager", text: "The category budgets changed everything. I cut shopping by 40% without feeling restricted." },
    { name: "Arjun D.", role: "Freelancer", text: "Irregular income was hard to manage. LifeOS helps me plan every month perfectly." },
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => setActiveTestimonial((p) => (p + 1) % testimonials.length), 4000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-200 ${scrolled ? "bg-white border-b border-gray-200" : "bg-white/80 backdrop-blur-sm"}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Life<span className="text-indigo-500">OS</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2">
              Log in
            </Link>
            <Link href="/auth?mode=signup" className="btn-primary px-4 py-2 text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-medium text-indigo-500 mb-4">
                Personal finance, simplified
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold leading-[1.1] tracking-tight text-gray-900 mb-6">
                Spend &#8377;99.{" "}
                <span className="text-indigo-500">Save &#8377;15,000.</span>
              </h1>
              <p className="text-lg text-gray-500 mb-10 leading-relaxed max-w-lg">
                Most people don&apos;t know where their money goes. LifeOS shows you — then helps you save it. Track every rupee, build better habits, and watch your savings grow.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link href="/auth?mode=signup" className="btn-primary px-7 py-3 text-sm text-center">
                  Start Saving — It&apos;s Free
                </Link>
                <Link href="#how-it-works" className="btn-outline px-7 py-3 text-sm text-center">
                  How it works
                </Link>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <span>Free to start</span>
                <span>No credit card</span>
                <span>2 min setup</span>
              </div>
            </div>

            {/* Savings Counter */}
            <div className="flex justify-center">
              <div className="card p-8 w-full max-w-sm">
                <div className="text-center mb-8">
                  <p className="text-sm text-gray-400 mb-3">Users save on average</p>
                  <div className="text-5xl font-bold text-green-600 tabular-nums tracking-tight">
                    &#8377;{savedAmount.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-400 mt-2">per month</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg p-3 bg-gray-50">
                    <span className="text-sm text-gray-500">Per year</span>
                    <span className="text-sm font-semibold text-gray-900">&#8377;1,80,000</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg p-3 bg-gray-50">
                    <span className="text-sm text-gray-500">LifeOS Premium</span>
                    <span className="text-sm font-semibold text-indigo-500">&#8377;99/month</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg p-3 bg-gray-50">
                    <span className="text-sm text-gray-500">Return on investment</span>
                    <span className="text-sm font-semibold text-green-600">150x</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-8 px-6 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-12 text-center">
          {[
            { num: "10,000+", label: "Active Users" },
            { num: "₹15Cr+", label: "Money Saved" },
            { num: "4.8", label: "User Rating" },
            { num: "50,000+", label: "Habits Tracked" },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-lg font-semibold text-gray-900">{s.num}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6" id="how-it-works">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-indigo-500 mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Where does your money go?
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Most people lose ₹5,000–15,000 every month on things they don&apos;t even notice.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Track Everything", desc: "One tap to add any expense. Coffee, cab, groceries — track it all in 2 seconds." },
              { step: "02", title: "See The Truth", desc: "LifeOS shows where your money actually goes. Most people are surprised by the results." },
              { step: "03", title: "Start Saving", desc: "Set category budgets, get alerts before overspending, and watch your savings grow." },
            ].map((s, i) => (
              <div key={i} className="card p-6">
                <div className="text-xs font-semibold text-indigo-500 mb-4">{s.step}</div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Student vs Employee */}
      <section className="py-24 px-6 bg-gray-50/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-indigo-500 mb-3">For everyone</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Built for your life
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Student */}
            <div className="card p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">For Students</h3>
              <p className="text-sm text-gray-500 mb-6">Pocket money running out by mid-month? Not anymore.</p>
              <ul className="space-y-3 mb-6">
                {[
                  "Track hostel, food, and transport expenses",
                  "Set monthly pocket money budget",
                  "See if you can afford that movie this weekend",
                  "Build study habits with streak tracking",
                  "Split budget: Food ₹3K, Transport ₹1K, Fun ₹2K",
                  "Get warned before money runs out",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <span className="text-indigo-500 mt-0.5 flex-shrink-0">&#10003;</span>{item}
                  </li>
                ))}
              </ul>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Average student saves</p>
                <p className="text-base font-semibold text-gray-900">₹2,000 – ₹5,000/month</p>
              </div>
            </div>

            {/* Employee */}
            <div className="card p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">For Employees</h3>
              <p className="text-sm text-gray-500 mb-6">Salary comes, salary goes. Let&apos;s fix that.</p>
              <ul className="space-y-3 mb-6">
                {[
                  "Track salary, expenses, and savings in one place",
                  "Set budgets: Rent ₹10K, Food ₹8K, EMI ₹5K",
                  "See projected savings before month ends",
                  "Get alerts when budget is running low",
                  "Build gym, reading, meditation habits",
                  "Monthly reports: Am I saving more than last month?",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">&#10003;</span>{item}
                  </li>
                ))}
              </ul>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Average employee saves</p>
                <p className="text-base font-semibold text-gray-900">₹10,000 – ₹25,000/month</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-indigo-500 mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Powerful features, simple design
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "1-Tap Expense", desc: "Add expenses in 2 seconds. Pick category, enter amount, done.", tag: "FREE" },
              { title: "Category Budgets", desc: "Set limits for Food, Transport, Shopping. Get warned before overspending.", tag: "PRO" },
              { title: "Spending Predictions", desc: "Know when your budget runs out before it's too late.", tag: "PRO" },
              { title: "Habit Streaks", desc: "Build daily habits. See your consistency. Don't break the chain.", tag: "FREE" },
              { title: "Weekly Calendar", desc: "Visual view of your habits across the week. Spot patterns.", tag: "PRO" },
              { title: "Achievements", desc: "Unlock badges: Saver, Week Warrior, Goal Crusher. Stay motivated.", tag: "FREE" },
              { title: "Smart Insights", desc: "Personalized tips based on your spending patterns to save more.", tag: "PRO" },
              { title: "Goal Tracking", desc: "Set goals, track progress, celebrate wins.", tag: "FREE" },
              { title: "Life Score", desc: "One number that shows how well you're managing your life.", tag: "FREE" },
            ].map((f, i) => (
              <div key={i} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">{f.title}</h3>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${f.tag === "PRO" ? "bg-indigo-50 text-indigo-500" : "bg-gray-100 text-gray-500"}`}>
                    {f.tag}
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-gray-50/50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-indigo-500 mb-3">Testimonials</p>
            <h2 className="text-3xl font-bold text-gray-900">Real people, real savings</h2>
          </div>
          <div className="card p-8 text-center relative overflow-hidden" style={{ minHeight: "180px" }}>
            {testimonials.map((t, i) => (
              <div key={i} className={`transition-all duration-500 ${i === activeTestimonial ? "opacity-100" : "opacity-0 absolute inset-0 p-8"}`}>
                <p className="text-base text-gray-700 mb-6 leading-relaxed max-w-md mx-auto">
                  &ldquo;{t.text}&rdquo;
                </p>
                <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-400">{t.role}</p>
              </div>
            ))}
            <div className="flex items-center justify-center gap-1.5 mt-6">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setActiveTestimonial(i)}
                  className={`h-1.5 rounded-full transition-all ${i === activeTestimonial ? "bg-indigo-500 w-6" : "bg-gray-200 w-1.5"}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6" id="pricing">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-indigo-500 mb-3">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">The math is simple</h2>
            <p className="text-gray-500">Spend ₹99, save ₹15,000. That&apos;s a 150x return.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free */}
            <div className="card p-8">
              <p className="text-sm font-medium text-gray-400 mb-4">Free</p>
              <div className="text-4xl font-bold text-gray-900 mb-1">₹0</div>
              <p className="text-sm text-gray-400 mb-8">Get started, see where money goes</p>
              <ul className="space-y-3 mb-8">
                {["Expense tracking", "3 habits with streaks", "Life Score", "2 goals", "Achievements", "1 daily insight"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <span className="text-green-500 flex-shrink-0">&#10003;</span>{item}
                  </li>
                ))}
              </ul>
              <Link href="/auth?mode=signup" className="block text-center btn-outline py-3 text-sm">
                Start Free
              </Link>
            </div>

            {/* Premium */}
            <div className="card p-8 border-indigo-200 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-4 py-1 rounded-full text-xs font-medium">
                Most popular
              </div>
              <p className="text-sm font-medium text-indigo-500 mb-4">Premium</p>
              <div className="text-4xl font-bold text-gray-900 mb-1">
                ₹99<span className="text-lg font-normal text-gray-400">/mo</span>
              </div>
              <p className="text-sm text-gray-400 mb-8">₹3.3/day — less than a cup of tea</p>
              <ul className="space-y-3 mb-8">
                {[
                  "Everything in Free",
                  "Spending predictions",
                  "Category budgets & alerts",
                  "7-day spending charts",
                  "Weekly habit calendar",
                  "Unlimited smart insights",
                  "Unlimited habits & goals",
                  "Monthly savings report",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <span className="text-indigo-500 flex-shrink-0">&#10003;</span>{item}
                  </li>
                ))}
              </ul>
              <Link href="/auth?mode=signup" className="block text-center btn-primary py-3 text-sm">
                Start Premium — ₹99/mo
              </Link>
              <p className="text-xs text-gray-400 text-center mt-3">30-day money-back guarantee</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-indigo-500">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Your money is leaking. Let&apos;s fix it.
          </h2>
          <p className="text-indigo-200 text-lg mb-10 max-w-lg mx-auto">
            Every day you wait, you lose money you could be saving. Start tracking today — it takes 2 minutes.
          </p>
          <Link href="/auth?mode=signup"
            className="inline-block bg-white text-indigo-600 px-8 py-3.5 rounded-lg font-semibold text-sm hover:bg-indigo-50 transition-colors">
            Start Saving Now — Free
          </Link>
          <div className="flex items-center justify-center gap-8 mt-8 text-indigo-200 text-sm">
            <span>Free forever plan</span>
            <span>No credit card</span>
            <span>2 min setup</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            &copy; 2026 Life<span className="font-semibold text-gray-500">OS</span>. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/pricing" className="hover:text-gray-600 transition-colors">Pricing</Link>
            <a href="#how-it-works" className="hover:text-gray-600 transition-colors">How it works</a>
            <a href="mailto:support@lifeos.app" className="hover:text-gray-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
