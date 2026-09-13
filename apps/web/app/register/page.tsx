"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailConfirmed) {
      setError("Please confirm that you can access this email address. We need it for your Picture Book upload link and important updates.");
      return;
    }
    const normalizedEmail = formData.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address that you can access. We use it for account updates and your Picture Book upload link.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { apiFetch } = await import("@/lib/api");
      
      // If there's a referral code in URL, use it
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      
      const payload = ref ? { ...formData, email: normalizedEmail, referredById: ref } : { ...formData, email: normalizedEmail };

      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      router.push("/login?registered=true");
    } catch (err: any) {
      const { getUserFriendlyError } = await import("@/lib/api");
      setError(getUserFriendlyError(err, "We could not create your account. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-16" style={{ background: "#FAF9F6" }}>
      <div className="w-full max-w-lg">
        <div className="text-center mb-8 sm:mb-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-3">
            <span className="font-serif text-[#1A1A1A] text-2xl font-semibold tracking-tight">Marrowmotif</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#1A1A1A] mb-2 font-serif">Create an Account</h1>
          <p className="text-[#666666] text-sm">Join us to craft and follow your Picture Books</p>
        </div>

        <div className="p-6 sm:p-8 bg-white border border-[#EAE6DF] rounded-xl shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">Use an email address you can access</p>
              <p className="mt-1 leading-relaxed">
                Your upload folder link and important Picture Book updates will be connected to this email. A wrong email can prevent you from receiving access.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#4A4A4A] mb-1.5">Full Name *</label>
                <input 
                  name="name" 
                  required 
                  value={formData.name} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] text-base focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors" 
                  placeholder="John Doe" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4A4A4A] mb-1.5">Email Address *</label>
                <input 
                  type="email" 
                  name="email" 
                  required 
                  autoComplete="email"
                  value={formData.email} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] text-base focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors" 
                  placeholder="you@example.com" 
                />
                <p className="mt-2 text-xs leading-relaxed text-[#777]">
                  Check for spelling errors before creating your account.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4A4A4A] mb-1.5">Password (8+ characters) *</label>
                <input 
                  type="password" 
                  name="password" 
                  required 
                  minLength={8} 
                  autoComplete="new-password"
                  value={formData.password} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] text-base focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors" 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            <label className="flex items-start gap-3 text-sm text-[#4A4A4A] cursor-pointer">
              <input
                type="checkbox"
                checked={emailConfirmed}
                onChange={(e) => setEmailConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#C9A84C]"
              />
              <span>I confirm that I can access this email address and that it is spelled correctly.</span>
            </label>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A1A1A] hover:bg-[#333333] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-md font-medium transition-colors mt-2 text-base shadow-sm"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-[#666666]">
            Already have an account? <Link href="/login" className="text-[#C9A84C] font-medium hover:underline">Sign in here</Link>
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
