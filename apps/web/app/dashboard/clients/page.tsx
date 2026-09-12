"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { pictureBooksApi } from "@/lib/api";
import { Pagination } from "@/components/ui/pagination";
import { Search, Plus, Users, ChevronRight, CheckCircle2, Clock, XCircle, Smartphone, HardDrive, BookOpen, SlidersHorizontal } from "lucide-react";

const statusOptions = [
  { value: "ALL", label: "All statuses" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ATTENTION", label: "Need Attention" },
];

function StatusBadge({ status }: { status: string }) {
  if (["READY", "COMPLETED"].includes(status)) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3"/> Completed</span>;
  if (["REQUESTED", "UPLOAD_PENDING"].includes(status)) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3"/> Need attention</span>;
  if (["PHOTOS_UPLOADED", "UNDER_REVIEW", "IN_PRODUCTION"].includes(status)) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200"><Clock className="w-3 h-3"/> In progress</span>;
  if (status === "CANCELLED") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"><XCircle className="w-3 h-3"/> Need attention</span>;
  return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gray-50 text-gray-700 border border-gray-200">{status}</span>;
}

export default function PictureBooksPage() {
  const { user, accessToken } = useAuth();
  const [books, setBooks] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    pictureBooksApi.list(accessToken, page, 20, { q: search, status: statusFilter })
      .then((res: any) => {
        setBooks(res.data || []);
        setMeta(res.meta || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accessToken, page, search, statusFilter]);

  const isEndUser = user?.role === "END_USER";

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#1A1A1A] tracking-tight">
            Picture Books
          </h1>
          <p className="text-[#666] text-xs sm:text-sm mt-1">
            {isEndUser ? "View your Picture Books" : "Manage your Picture Books"}
          </p>
        </div>
        <Link href="/dashboard/clients/new" className="w-full sm:w-auto bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors rounded-md px-5 py-3 sm:py-2.5 flex items-center justify-center font-medium shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> 
          {isEndUser ? "Create Picture Book" : "Add Picture Book"}
        </Link>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Search className="h-5 w-5 text-[#999]" /></div>
          <input type="search" placeholder="Search picture books..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-11 pr-4 py-2.5 rounded-md bg-white border border-[#EAE6DF] text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors shadow-sm" />
        </div>
        <label className="relative flex items-center min-w-0 sm:w-52">
          <SlidersHorizontal className="absolute left-3 w-4 h-4 text-[#999] pointer-events-none" />
          <span className="sr-only">Filter picture books by status</span>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-full appearance-none pl-9 pr-8 py-2.5 rounded-md bg-white border border-[#EAE6DF] text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none shadow-sm">
            {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>

      <div className="bg-white border border-[#EAE6DF] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#EAE6DF] border-t-[#C9A84C] rounded-full animate-spin mb-4"></div>
            <div className="text-sm font-medium text-[#999] uppercase tracking-widest">Loading...</div>
          </div>
        ) : books.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#FAF9F6] flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-[#CCC]" />
            </div>
            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">
              {search || statusFilter !== "ALL" ? "No matches found" : "No items yet"}
            </h3>
            <p className="text-[#666] text-sm max-w-sm mb-6">
              {search || statusFilter !== "ALL" ? "Try a different search or status filter." : "Get started by adding a new item."}
            </p>
            {!search && statusFilter === "ALL" && (
              <Link href="/dashboard/clients/new" className="bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors rounded-md px-5 py-2.5 flex items-center shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Get Started
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-[#EAE6DF]">
                    {["Title / Customer", "Contact", "Status", "Drive", "Added", ""].map((h) => (
                      <th key={h} className="text-left px-6 py-4 text-xs font-semibold text-[#666] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE6DF]">
                  {books.map((book) => (
                    <tr key={book.id} className="hover:bg-[#FAF9F6] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#1A1A1A]">{book.title}</div>
                        {book.user && <div className="text-xs text-[#666] mt-0.5">{book.user.name} ({book.user.email})</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[#4A4A4A] font-medium">{book.user?.whatsappNumber || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={book.status} /></td>
                      <td className="px-6 py-4">
                        {book.driveLink ? (
                          <a href={book.driveLink} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-500 transition-colors">
                            <HardDrive className="w-3.5 h-3.5" /> Open
                          </a>
                        ) : (
                          <span className="text-[#999] text-xs flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-[#666]">
                        {new Date(book.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/dashboard/clients/${book.id}`}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-[#999] hover:text-[#1A1A1A] hover:bg-[#EAE6DF] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col divide-y divide-[#EAE6DF]">
              {books.map((book) => (
                <Link href={`/dashboard/clients/${book.id}`} key={book.id} className="p-4 hover:bg-[#FAF9F6] transition-colors active:bg-[#F5F3EC]">
                  <div className="flex justify-between items-start mb-2.5">
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-[#1A1A1A] text-base leading-snug break-words">{book.title}</div>
                      {book.user && !isEndUser && (
                        <div className="text-xs text-[#666] mt-0.5 truncate">{book.user.name}</div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#999] shrink-0 mt-0.5" />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={book.status} />
                      {book.driveLink && (
                        <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          <HardDrive className="w-3 h-3" /> Ready
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#888]">
                      {new Date(book.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            
            {!loading && books.length > 0 && (
              <Pagination meta={meta} onPageChange={setPage} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
