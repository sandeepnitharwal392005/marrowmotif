"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyOtpForm() {
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  useEffect(() => {
    if (!email) {
      router.push("/login");
    }
  }, [email, router]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { apiFetch } = await import("@/lib/api");
      await apiFetch("/users/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otpCode })
      });
      setSuccess("Account verified successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login?verified=true");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { apiFetch } = await import("@/lib/api");
      await apiFetch("/users/resend-otp", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      setSuccess("A new verification code has been sent to your WhatsApp.");
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  }

  if (!email) return null;

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-10">
        <Link href="/" className="inline-flex items-center gap-3 mb-4">
          <span className="font-serif text-[#1A1A1A] text-2xl font-semibold tracking-tight">Marrowmotif</span>
        </Link>
        <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2 font-serif">Verify Your Account</h1>
        <p className="text-[#666666] text-sm">We've sent a verification code to your WhatsApp number.</p>
      </div>

      <div className="p-8 bg-white border border-[#EAE6DF] rounded-xl shadow-sm">
        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#4A4A4A] mb-2">Verification Code</label>
            <input
              type="text"
              required
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="w-full px-4 py-2.5 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors text-center text-lg tracking-widest font-mono"
              placeholder="000000"
              maxLength={6}
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
            {loading ? "Verifying..." : "Verify Code"}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-[#666666]">
          Didn't receive the code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="text-[#C9A84C] font-medium hover:underline disabled:opacity-50"
          >
            Resend Code
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#FAF9F6" }}>
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyOtpForm />
      </Suspense>
    </main>
  );
}
