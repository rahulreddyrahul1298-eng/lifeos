"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);

  useEffect(() => { if (searchParams.get("mode") === "signup") setIsSignup(true); }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const ep = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const body = isSignup ? { email, password, name } : { email, password };
      const res = await fetch(ep, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); return; }
      router.push(data.onboarded ? "/dashboard" : "/onboarding");
    } catch { setError("Network error."); } finally { setLoading(false); }
  };

  const handleGuest = async () => {
    setLoading(true);
    try { const res = await fetch("/api/auth/guest", { method: "POST" }); const data = await res.json(); if (data.success) router.push("/onboarding"); }
    catch { setError("Something went wrong"); } finally { setLoading(false); }
  };

  return (
    <div className="card p-8 sm:p-10">
      <h1 className="text-2xl font-black text-center mb-1 text-ink-900">{isSignup ? "Create your account" : "Welcome back"}</h1>
      <p className="text-sm text-ink-300 text-center mb-8">{isSignup ? "Start your 30-day transformation" : "Continue your journey"}</p>

      {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl p-4 mb-6">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignup && <div><label className="block text-sm text-ink-500 font-semibold mb-2">Name</label><input type="text" value={name} onChange={e=>setName(e.target.value)} className="input-field" placeholder="Your name" /></div>}
        <div><label className="block text-sm text-ink-500 font-semibold mb-2">Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="input-field" placeholder="you@example.com" /></div>
        <div><label className="block text-sm text-ink-500 font-semibold mb-2">Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} className="input-field" placeholder="Min 6 characters" /></div>
        <button type="submit" disabled={loading} className="w-full btn-primary py-3.5 text-sm disabled:opacity-50 mt-2">{loading ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}</button>
      </form>

      <div className="flex items-center gap-3 my-7"><div className="flex-1 h-px bg-gray-100" /><span className="text-xs text-ink-300">or</span><div className="flex-1 h-px bg-gray-100" /></div>

      <button onClick={handleGuest} disabled={loading} className="w-full btn-secondary py-3.5 text-sm disabled:opacity-50">Continue as Guest</button>

      <p className="text-center text-sm text-ink-300 mt-7">
        {isSignup ? (<>Already have an account? <button onClick={()=>setIsSignup(false)} className="text-brand-500 font-semibold hover:underline">Sign in</button></>)
        : (<>Don&apos;t have an account? <button onClick={()=>setIsSignup(true)} className="text-brand-500 font-semibold hover:underline">Sign up</button></>)}
      </p>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center mb-10"><span className="text-2xl font-black text-ink-900">Life<span className="text-gradient">OS</span></span></Link>
        <Suspense fallback={<div className="card p-10 text-center text-ink-300 text-sm">Loading...</div>}><AuthForm /></Suspense>
      </div>
    </div>
  );
}
