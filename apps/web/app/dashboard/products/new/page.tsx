"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { productsApi } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

export default function NewProductPage() {
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    currency: "USD",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;

    if (!form.title.trim() || !form.description.trim() || !form.price.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      await productsApi.create(accessToken, {
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        currency: form.currency,
        images: [],
      });
      toast.success("Product created successfully");
      router.push("/dashboard/products");
    } catch (err: any) {
      toast.error("Failed to create product", { description: err.message });
      setSubmitting(false);
    }
  }

  if (user?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="p-6 sm:p-10 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#666]" />
        </Link>
        <div>
          <h1 className="text-2xl font-serif text-[#1A1A1A] tracking-tight">Add Product</h1>
          <p className="text-[#666] text-sm mt-1">Create a new Picture Book offering or package.</p>
        </div>
      </div>

      <div className="bg-white border border-[#EAE6DF] rounded-xl shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                Product Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                minLength={3}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Premium Layflat Album"
                className="w-full px-4 py-2.5 rounded-lg border border-[#EAE6DF] bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20 focus:border-[#C9A84C] transition-all text-[#1A1A1A]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                minLength={10}
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the product offering..."
                className="w-full px-4 py-2.5 rounded-lg border border-[#EAE6DF] bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20 focus:border-[#C9A84C] transition-all text-[#1A1A1A] resize-y"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Price <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 rounded-lg border border-[#EAE6DF] bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20 focus:border-[#C9A84C] transition-all text-[#1A1A1A]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Currency
                </label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#EAE6DF] bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20 focus:border-[#C9A84C] transition-all text-[#1A1A1A]"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end border-t border-[#EAE6DF] gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 text-sm font-medium text-[#666] hover:text-[#1A1A1A] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#333] transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
