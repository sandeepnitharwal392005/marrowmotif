"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const demoLoginHint = process.env.NEXT_PUBLIC_DEMO_LOGIN_HINT;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const [expiredMessage, setExpiredMessage] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("reason") === "expired") {
        setExpiredMessage("Your session has expired. Please log in again to continue.");
        // Clean up the URL to prevent showing the message if they refresh
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err?.status >= 500
          ? "We couldn't complete the sign-in request right now. Please try again. If the problem continues, contact support."
          : err.message || "Invalid credentials. Please try again.",
      );
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "#FAF9F6" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <span className="font-serif text-[#1A1A1A] text-2xl font-semibold tracking-tight">Morrowotif</span>
          </Link>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2 font-serif">Welcome Back</h1>
          <p className="text-[#666666] text-sm">Sign in to manage your Picture Books</p>
        </div>

        {expiredMessage && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-50 text-rose-700 text-sm flex flex-col items-center text-center">
            <div className="font-medium mb-1">Session Expired</div>
            <div className="text-rose-600/80 text-xs">
              {expiredMessage}
            </div>
          </div>
        )}

        {isDemoMode && demoLoginHint && (
          <div className="mb-6 p-4 rounded-xl border border-amber-500/20 bg-[#F5F3EC] text-amber-600 text-sm">
            <div className="font-medium mb-1">Demo environment</div>
            <div className="text-amber-600/80 text-xs">
              {demoLoginHint}
            </div>
          </div>
        )}

        {/* Card */}
        <div className="p-8 bg-white border border-[#EAE6DF] rounded-xl shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-[#4A4A4A] mb-2">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-[#4A4A4A] mb-2">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A1A1A] hover:bg-[#333333] text-white py-3 rounded-md font-medium transition-colors"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-[#666666]">
            Don't have an account? <Link href="/register" className="text-[#C9A84C] font-medium hover:underline">Register here</Link>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-[#999999] text-sm hover:text-[#666666] transition-colors">
            ← Back to website
          </Link>
        </div>
      </div>
    </main>
  );
}
