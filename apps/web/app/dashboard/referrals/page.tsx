"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { usersApi } from "@/lib/api";
import { Pagination } from "@/components/ui/pagination";
import { Search, Plus, Users, CheckCircle2, Clock } from "lucide-react";

function UserRegistrationBadge({ passwordHash }: { passwordHash: string | null | undefined }) {
  if (passwordHash === "pending_setup") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3"/> Pending</span>;
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3"/> Registered</span>;
}

export default function ReferralsPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    usersApi.list(accessToken, page)
      .then((res: any) => {
        setUsers(res.data || []);
        setMeta(res.meta || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accessToken, page]);

  const filtered = users.filter((u) =>
    [u.name, u.email, u.whatsappNumber, u.phone].some(
      (v) => v && v.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[#1A1A1A] tracking-tight">
            Referrals
          </h1>
          <p className="text-[#666] text-sm mt-1">
            Manage your referred customers
          </p>
        </div>
        <Link href="/dashboard/referrals/new" className="bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors rounded-md px-5 py-2.5 flex items-center justify-center font-medium shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> 
          Refer Customer
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-[#999]" />
        </div>
        <input
          type="search"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 rounded-md bg-white border border-[#EAE6DF] text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors shadow-sm"
        />
      </div>

      <div className="bg-white border border-[#EAE6DF] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#EAE6DF] border-t-[#C9A84C] rounded-full animate-spin mb-4"></div>
            <div className="text-sm font-medium text-[#999] uppercase tracking-widest">Loading...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#FAF9F6] flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-[#CCC]" />
            </div>
            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">
              {search ? "No matches found" : "No referrals yet"}
            </h3>
            <p className="text-[#666] text-sm max-w-sm mb-6">
              {search ? `No items matched your search for "${search}".` : "Get started by referring a customer."}
            </p>
            {!search && (
              <Link href="/dashboard/referrals/new" className="bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors rounded-md px-5 py-2.5 flex items-center shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Get Started
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-[#EAE6DF]">
                    {["Customer Name", "Contact", "Registration Status", "Referred Date"].map((h) => (
                      <th key={h} className="text-left px-6 py-4 text-xs font-semibold text-[#666] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE6DF]">
                  {filtered.map((user) => (
                    <tr key={user.id} className="hover:bg-[#FAF9F6] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#1A1A1A]">{user.name}</div>
                        <div className="text-xs text-[#666] mt-0.5">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[#4A4A4A] font-medium">{user.whatsappNumber || user.phone || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4"><UserRegistrationBadge passwordHash={user.passwordHash} /></td>
                      <td className="px-6 py-4 text-xs font-medium text-[#666]">
                        {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {!loading && filtered.length > 0 && (
              <Pagination meta={meta} onPageChange={setPage} />
            )}
          </>
        )}
      </div>
    </div>
  );
}