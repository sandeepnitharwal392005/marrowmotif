"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { productsApi } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Save, ShieldAlert } from "lucide-react";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    currency: "USD",
    isActive: true,
  });

  useEffect(() => {
    async function loadProduct() {
      if (!accessToken || user?.role !== "ADMIN") return;
      try {
        const data = await productsApi.get(resolvedParams.id);
        setForm({
          title: data.title,
          description: data.description,
          price: data.price.toString(),
          currency: data.currency,
          isActive: data.isActive,
        });
      } catch (err: any) {
        toast.error("Failed to load product", { description: err.message });
        router.push("/dashboard/products");
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [accessToken, user, resolvedParams.id, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;

    if (!form.title.trim() || !form.description.trim() || !form.price.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      await productsApi.update(accessToken, resolvedParams.id, {
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        currency: form.currency,
        isActive: form.isActive,
        images: [],
      });
      toast.success("Product updated successfully");
      router.push("/dashboard/products");
    } catch (err: any) {
      toast.error("Failed to update product", { description: err.message });
      setSubmitting(false);
    }
  }

  if (user?.role !== "ADMIN") {
    return (
      <div className="p-10 flex flex-col items-center justify-center text-center">
        <ShieldAlert className="w-12 h-12 text-[#999] mb-4" />
        <h2 className="text-xl font-serif text-[#1A1A1A]">Access Denied</h2>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-16 flex justify-center">
        <div className="w-8 h-8 border-2 border-[#EAE6DF] border-t-[#C9A84C] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#666]" />
        </Link>
        <div>
          <h1 className="text-2xl font-serif text-[#1A1A1A] tracking-tight">Edit Product</h1>
          <p className="text-[#666] text-sm mt-1">Update Picture Book offering details.</p>
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

            <div className="pt-4 flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 text-[#C9A84C] focus:ring-[#C9A84C] border-[#EAE6DF] rounded"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-[#1A1A1A]">
                Product is active and visible
              </label>
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
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
