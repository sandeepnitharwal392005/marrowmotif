"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { Package, PlusCircle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";
import { ErrorState } from "@/components/ui/ErrorState";

export default function ProductsPage() {
  const { accessToken, user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<any>(null);
  const [page, setPage] = useState(1);

  async function loadProducts(currentPage: number) {
    if (!accessToken) return;
    setLoading(true);
    setPageError(null);
    try {
      const response = await apiFetch<any>(`/products?page=${currentPage}&limit=20`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setProducts(response.data || []);
      setMeta(response.meta || null);
    } catch (err: any) {
      setPageError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role === "ADMIN") {
      loadProducts(page);
    } else {
      setLoading(false);
    }
  }, [accessToken, user, page]);

  if (user?.role !== "ADMIN") {
    return (
      <div className="p-10 flex flex-col items-center justify-center text-center">
        <Package className="w-12 h-12 text-[#999] mb-4" />
        <h2 className="text-xl font-serif text-[#1A1A1A]">Access Denied</h2>
        <p className="text-[#666] text-sm mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  if (pageError) return (
    <ErrorState error={pageError} onRetry={() => loadProducts(page)} />
  );

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[#1A1A1A] tracking-tight">Products</h1>
          <p className="text-[#666] text-sm mt-1">Manage physical Picture Books and digital offerings.</p>
        </div>
        <Link href="/dashboard/products/new" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#333] transition-colors shadow-sm">
          <PlusCircle className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      <div className="bg-white border border-[#EAE6DF] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#EAE6DF] border-t-[#C9A84C] rounded-full animate-spin mb-4"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center text-[#666]">No products found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#EAE6DF]">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#666] uppercase tracking-wider">Product</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#666] uppercase tracking-wider">Price</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#666] uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#666] uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE6DF]">
                {products.map((p) => (
                  <tr 
                    key={p.id} 
                    onClick={() => router.push(`/dashboard/products/${p.id}`)}
                    className="hover:bg-[#FAF9F6] transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[#1A1A1A]">{p.title}</div>
                      <div className="text-xs text-[#999] mt-0.5 max-w-sm truncate">{p.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-[#1A1A1A]">{p.currency} {Number(p.price).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {p.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5"/> Active</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600"><XCircle className="w-3.5 h-3.5"/> Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-[#999]">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && products.length > 0 && (
          <Pagination meta={meta} onPageChange={setPage} />
        )}
      </div>
    </div>
  );
}
