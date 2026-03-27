"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => { fetch("/api/auth/me").then(r=>r.json()).then(d=>{if(d.isPremium)setIsPremium(true);}).catch(()=>{}); }, []);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/razorpay/order", { method: "POST" });
      const data = await res.json();
      if (data.error) { alert(data.error); setLoading(false); return; }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        const options = { key: data.keyId, amount: data.amount, currency: data.currency, name: "LifeOS", description: "Premium Plan — ₹99/month", order_id: data.orderId,
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            const verifyRes = await fetch("/api/razorpay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature, userId: data.userId }) });
            const result = await verifyRes.json();
            if (result.success) router.push("/dashboard?upgraded=true"); else alert("Payment verification failed.");
          },
          prefill: {}, theme: { color: "#6366F1" }, modal: { ondismiss: () => setLoading(false) },
        };
        const rzp = new (window as unknown as { Razorpay: new (opts: typeof options) => { open: () => void } }).Razorpay(options);
        rzp.open();
      };
      document.body.appendChild(script);
    } catch { alert("Something went wrong."); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-black text-ink-900">Life<span className="text-gradient">OS</span></Link>
          <Link href="/dashboard" className="text-sm text-ink-300 hover:text-ink-900 font-medium transition-colors">← Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-black text-ink-900 mb-3">Unlock Your Full Potential</h1>
          <p className="text-ink-500 text-lg">Start free. Upgrade when you&apos;re ready.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto mb-20">
          <div className="card p-8">
            <div className="text-sm font-bold text-ink-300 mb-2">Free</div>
            <div className="text-4xl font-black text-ink-900 mb-6">₹0</div>
            <div className="space-y-3 mb-8">{["Expense tracking","3 daily habits","Life Score","2 goals","1 AI insight/day","Achievements"].map((f,i)=>(
              <div key={i} className="flex items-center gap-3 text-sm text-ink-700"><span className="text-emerald-500 font-bold">✓</span>{f}</div>
            ))}</div>
            <button onClick={()=>router.push("/auth")} className="btn-secondary w-full py-3.5 text-sm">Start Free</button>
          </div>

          <div className="card p-8 ring-2 ring-brand-500/15 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-brand-500 to-purple-500 text-white text-[9px] font-black px-4 py-1.5 rounded-bl-3xl">BEST VALUE</div>
            <div className="text-sm font-bold text-brand-500 mb-2">Premium</div>
            <div className="text-4xl font-black text-ink-900 mb-1">₹99<span className="text-lg text-ink-300 font-normal">/mo</span></div>
            <p className="text-xs text-ink-300 mb-6">Save ₹15,000+/month</p>
            <div className="space-y-3 mb-8">{["Everything in Free","Unlimited habits & goals","Unlimited AI insights","Spending predictions","Category budgets","7-day spending charts","Weekly habit calendar","Monthly reports"].map((f,i)=>(
              <div key={i} className="flex items-center gap-3 text-sm text-ink-700"><span className="text-brand-500 font-bold">✓</span>{f}</div>
            ))}</div>
            {isPremium ? <div className="w-full py-3.5 text-center text-sm font-bold text-emerald-600 bg-emerald-50 rounded-2xl border border-emerald-100">✓ Active</div>
            : <button onClick={handleUpgrade} disabled={loading} className="btn-primary w-full py-3.5 text-sm disabled:opacity-50">{loading ? "Processing..." : "Upgrade Now →"}</button>}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-16">
          <h3 className="text-xl font-black text-center mb-8">FAQ</h3>
          <div className="space-y-3">{[
            {q:"Can I cancel anytime?",a:"Yes. Cancel anytime, no questions asked."},
            {q:"Is there a money-back guarantee?",a:"Yes! 30-day money-back guarantee."},
            {q:"Is my data safe?",a:"Absolutely. Encrypted and private."},
            {q:"What payment methods?",a:"UPI, cards, net banking via Razorpay."},
          ].map((f,i)=>(<div key={i} className="card p-5"><p className="text-sm font-bold text-ink-900 mb-1">{f.q}</p><p className="text-sm text-ink-300">{f.a}</p></div>))}</div>
        </div>

        {!isPremium && (
          <div className="text-center pb-10">
            <h3 className="text-2xl font-black text-ink-900 mb-4">Ready to transform?</h3>
            <button onClick={handleUpgrade} disabled={loading} className="btn-primary px-12 py-4 text-lg font-bold disabled:opacity-50">{loading ? "Processing..." : "Get Premium → ₹99/mo"}</button>
            <p className="text-xs text-ink-300 mt-3">30-day money-back guarantee</p>
          </div>
        )}
      </div>

      <footer className="border-t border-gray-100 py-8 bg-white"><div className="max-w-4xl mx-auto px-6 text-center text-xs text-ink-300">© 2024 LifeOS</div></footer>
    </div>
  );
}
