"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("mode") === "signup") setIsSignup(true);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const body = isSignup ? { email, password, name } : { email, password };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); return; }
      router.push(data.onboarded ? "/dashboard" : "/onboarding");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/guest", { method: "POST" });
      const data = await res.json();
      if (data.success) router.push("/onboarding");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center mb-10">
          <span className="text-xl font-bold text-gray-900">
            Life<span className="text-indigo-500">OS</span>
          </span>
        </Link>

        <div className="card p-8">
          <h1 className="text-xl font-semibold text-center mb-1 text-gray-900">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-sm text-gray-400 text-center mb-8">
            {isSignup ? "Start your journey to a better life" : "Continue where you left off"}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-sm text-gray-600 font-medium mb-1.5">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="input-field" placeholder="Your name" />
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-600 font-medium mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required className="input-field" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 font-medium mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required minLength={6} className="input-field" placeholder="Min 6 characters" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full btn-primary py-2.5 text-sm disabled:opacity-50 mt-2">
              {loading ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button onClick={handleGuest} disabled={loading}
            className="w-full btn-outline py-2.5 text-sm disabled:opacity-50">
            Continue as Guest
          </button>

          <p className="text-center text-sm text-gray-500 mt-6">
            {isSignup ? (
              <>Already have an account?{" "}
                <button onClick={() => setIsSignup(false)} className="text-indigo-500 font-medium hover:underline">Sign in</button>
              </>
            ) : (
              <>Don&apos;t have an account?{" "}
                <button onClick={() => setIsSignup(true)} className="text-indigo-500 font-medium hover:underline">Sign up</button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
