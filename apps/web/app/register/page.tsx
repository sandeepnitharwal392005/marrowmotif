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
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { apiFetch } = await import("@/lib/api");
      
      // If there's a referral code in URL, use it
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      
      const payload = ref ? { ...formData, referredById: ref } : formData;

      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      router.push("/login?registered=true");
    } catch (err: any) {
      setError(
        err?.status >= 500
          ? "We couldn't create your account right now. Please try again. If the problem continues, contact support."
          : err.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#FAF9F6" }}>
      <div className="w-full max-w-xl">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <span className="font-serif text-[#1A1A1A] text-2xl font-semibold tracking-tight">Marrowmotif</span>
          </Link>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2 font-serif">Create an Account</h1>
          <p className="text-[#666666] text-sm">Join us to craft your memories</p>
        </div>

        <div className="p-8 bg-white border border-[#EAE6DF] rounded-xl shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[#4A4A4A] mb-2">Full Name *</label>
                <input name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-2.5 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4A4A4A] mb-2">Email Address *</label>
                <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-2.5 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4A4A4A] mb-2">Password *</label>
                <input type="password" name="password" required minLength={8} value={formData.password} onChange={handleChange} className="w-full px-4 py-2.5 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors" placeholder="••••••••" />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A1A1A] hover:bg-[#333333] text-white py-3 rounded-md font-medium transition-colors mt-2"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-[#666666]">
            Already have an account? <Link href="/login" className="text-[#C9A84C] font-medium hover:underline">Sign in here</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
