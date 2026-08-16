"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SetupAccountForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { apiFetch } = await import("@/lib/api");
      await apiFetch("/users/setup", {
        method: "POST",
        body: JSON.stringify({ token, password })
      });
      setSuccess("Account set up successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login?setup=true");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to set up account.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) return null;

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-10">
        <Link href="/" className="inline-flex items-center gap-3 mb-4">
          <span className="font-serif text-[#1A1A1A] text-2xl font-semibold tracking-tight">Marrowotif</span>
        </Link>
        <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2 font-serif">Set Up Your Account</h1>
        <p className="text-[#666666] text-sm">Please set a password for your new Guide account.</p>
      </div>

      <div className="p-8 bg-white border border-[#EAE6DF] rounded-xl shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#4A4A4A] mb-2">New Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#4A4A4A] mb-2">Confirm Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-100 text-green-600 text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1A1A1A] hover:bg-[#333333] text-white py-3 rounded-md font-medium transition-colors mt-2"
          >
            {loading ? "Saving..." : "Set Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SetupAccountPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#FAF9F6" }}>
      <Suspense fallback={<div>Loading...</div>}>
        <SetupAccountForm />
      </Suspense>
    </main>
  );
}
