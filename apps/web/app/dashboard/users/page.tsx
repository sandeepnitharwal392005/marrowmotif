"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Shield, User, Smartphone, Mail, CheckCircle2, XCircle, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pagination } from "@/components/ui/pagination";

export default function UsersPage() {
  const { accessToken, user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const router = useRouter();

  const loadUsers = useCallback(async (searchQuery: string = "", currentPage: number = 1) => {
    if (!accessToken) return;
    try {
      const endpoint = searchQuery.trim() 
        ? `/users/search?q=${encodeURIComponent(searchQuery)}&page=${currentPage}&limit=20` 
        : `/users?page=${currentPage}&limit=20`;
      const response = await apiFetch<any>(endpoint, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setUsers(response.data || []);
      setMeta(response.meta || null);
    } catch (err: any) {
      toast.error("Failed to load users", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      const timeoutId = setTimeout(() => {
        setPage(1); // Reset to page 1 on new search
        loadUsers(query, 1);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setLoading(false);
    }
  }, [query, user]);

  useEffect(() => {
    if (user?.role === "ADMIN" && page > 1) {
      loadUsers(query, page);
    }
  }, [page, user, loadUsers]);

  if (user?.role !== "ADMIN") {
    return (
      <div className="p-10 flex flex-col items-center justify-center text-center">
        <Shield className="w-12 h-12 text-[#999] mb-4" />
        <h2 className="text-xl font-serif text-[#1A1A1A]">Access Denied</h2>
        <p className="text-[#666] text-sm mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[#1A1A1A] tracking-tight">Customers & Users</h1>
          <p className="text-[#666] text-sm mt-1">Manage platform users, guides, and customer operations.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[#999]" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-[#EAE6DF] rounded-md leading-5 bg-white placeholder-[#999] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#C9A84C]/20 focus:border-[#C9A84C] sm:text-sm transition-colors"
            />
          </div>
          <Link href="/dashboard/guides/new" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#333] transition-colors shadow-sm whitespace-nowrap w-full sm:w-auto">
            <UserPlus className="w-4 h-4" />
            Invite Guide
          </Link>
        </div>
      </div>

      <div className="bg-white border border-[#EAE6DF] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#EAE6DF] border-t-[#C9A84C] rounded-full animate-spin mb-4"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center text-[#666]">No users found matching your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#EAE6DF]">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#666] uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#666] uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#666] uppercase tracking-wider">Contact</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#666] uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#666] uppercase tracking-wider">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE6DF]">
                {users.map((u) => (
                  <tr 
                    key={u.id} 
                    onClick={() => router.push(`/dashboard/customers/${u.id}`)}
                    className="hover:bg-[#FAF9F6] transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[#1A1A1A] group-hover:text-[#C9A84C] transition-colors">{u.name}</div>
                      {u.referredBy && (
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-[#C9A84C] mt-1">
                          Ref: {u.referredBy.name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                        u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        u.role === 'GUIDE' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-[#666]">
                        {u.email && <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {u.email}</div>}
                        {(u.phone || u.whatsappNumber) && <div className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> {u.phone || u.whatsappNumber}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5"/> Active</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600"><XCircle className="w-3.5 h-3.5"/> Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-[#999]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && users.length > 0 && (
          <Pagination meta={meta} onPageChange={setPage} />
        )}
      </div>
    </div>
  );
}
