"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: ""
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
      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      // Successful registration, go to login
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
            <span className="font-serif text-[#1A1A1A] text-2xl font-semibold tracking-tight">Morrowotif</span>
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
              <div>
                <label className="block text-sm font-medium text-[#4A4A4A] mb-2">WhatsApp / Phone *</label>
                <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="w-full px-4 py-2.5 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors" placeholder="+1234567890" />
              </div>
            </div>

            <div className="pt-4 border-t border-[#EAE6DF]">
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4">Delivery Address</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#4A4A4A] mb-2">Address Line 1</label>
                  <input name="addressLine1" value={formData.addressLine1} onChange={handleChange} className="w-full px-4 py-2.5 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors" placeholder="123 Main St" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4A4A4A] mb-2">Address Line 2</label>
                  <input name="addressLine2" value={formData.addressLine2} onChange={handleChange} className="w-full px-4 py-2.5 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors" placeholder="Apt 4B (Optional)" />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[#4A4A4A] mb-2">City</label>
                    <input name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2.5 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors" placeholder="New York" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4A4A4A] mb-2">State / Province</label>
                    <input name="state" value={formData.state} onChange={handleChange} className="w-full px-4 py-2.5 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors" placeholder="NY" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4A4A4A] mb-2">Postal Code</label>
                    <input name="postalCode" value={formData.postalCode} onChange={handleChange} className="w-full px-4 py-2.5 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors" placeholder="10001" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4A4A4A] mb-2">Country</label>
                    <input name="country" value={formData.country} onChange={handleChange} className="w-full px-4 py-2.5 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors" placeholder="USA" />
                  </div>
                </div>
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
