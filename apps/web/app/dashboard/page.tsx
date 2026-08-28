"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { pictureBooksApi, usersApi } from "@/lib/api";
import { Plus, ChevronRight, CheckCircle2, Clock, XCircle, FileText, Send, Smartphone, BookOpen, Users } from "lucide-react";

function StatCard({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: any }) {
  return (
    <div className="bg-white p-6 border border-[#EAE6DF] rounded-xl relative overflow-hidden group shadow-sm transition-shadow hover:shadow-md">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-16 h-16" style={{ color }} />
      </div>
      <div className="relative z-10">
        <div className="text-3xl font-bold mb-1 tracking-tight" style={{ color }}>{value}</div>
        <div className="text-sm font-medium text-[#666] uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (["READY", "COMPLETED"].includes(status)) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5"/> {status === "READY" ? "Ready" : "Completed"}</span>;
  if (status === "CANCELLED") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"><XCircle className="w-3.5 h-3.5"/> Cancelled</span>;
  if (status === "UPLOAD_PENDING") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3.5 h-3.5"/> Photos needed</span>;
  if (status === "REQUESTED") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3.5 h-3.5"/> Getting started</span>;
  if (["PHOTOS_UPLOADED", "UNDER_REVIEW", "IN_PRODUCTION"].includes(status)) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"><Clock className="w-3.5 h-3.5"/> In progress</span>;
  return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">{status}</span>;
}

function UserRegistrationBadge({ passwordHash }: { passwordHash: string | null | undefined }) {
  if (passwordHash === "pending_setup") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3.5 h-3.5"/> Pending</span>;
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5"/> Registered</span>;
}

export default function DashboardPage() {
  const { user, accessToken } = useAuth();
  
  // General State
  const [loading, setLoading] = useState(true);
  
  // Book States
  const [stats, setStats] = useState({ totalBooks: 0, activeBooks: 0, pendingBooks: 0, failedBooks: 0 });
  const [books, setBooks] = useState<any[]>([]);

  // Referral States
  const [referralStats, setReferralStats] = useState({ totalReferred: 0, pendingRegistration: 0, registered: 0 });
  const [referrals, setReferrals] = useState<any[]>([]);

  useEffect(() => {
    if (!accessToken || !user) return;
    
    if (user.role === "GUIDE") {
      Promise.all([
        usersApi.stats(accessToken).catch(() => ({ totalReferred: 0, pendingRegistration: 0, registered: 0 })),
        usersApi.list(accessToken).catch(() => []),
      ])
        .then(([s, r]) => {
          setReferralStats(s);
          const refsArray = Array.isArray(r) ? r : (r.data || []);
          setReferrals(refsArray.slice(0, 5));
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      Promise.all([
        pictureBooksApi.stats(accessToken).catch(() => ({ totalBooks: 0, activeBooks: 0, pendingBooks: 0, failedBooks: 0 })),
        pictureBooksApi.list(accessToken).catch(() => []),
      ])
        .then(([s, b]) => {
          setStats({
            totalBooks: s.totalPictureBooks || 0,
            activeBooks: s.readyPictureBooks || 0,
            pendingBooks: s.requestedPictureBooks || 0,
            failedBooks: s.cancelledPictureBooks || 0,
          });
          const booksArray = Array.isArray(b) ? b : (b.data || []);
          setBooks(booksArray.slice(0, 5));
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [accessToken, user]);

  const isGuide = user?.role === "GUIDE";
  const isAdmin = user?.role === "ADMIN";
  const isEndUser = user?.role === "END_USER";
  const firstName = user?.name?.trim().split(/\s+/)[0];

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[#1A1A1A] tracking-tight">
            {isEndUser && firstName ? `Welcome back, ${firstName}` : "Dashboard"}
          </h1>
          <p className="text-[#666] text-sm mt-1">
            {isGuide ? "Your customer referrals overview" : isEndUser ? "Everything you need to create and follow your Picture Books." : "Platform overview"}
          </p>
        </div>
        <Link href={isGuide ? "/dashboard/referrals/new" : "/dashboard/clients/new"} className="bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors rounded-md px-5 py-2.5 flex items-center justify-center font-medium shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> 
          {isGuide ? "Refer Customer" : isEndUser ? "Create Picture Book" : "Add Picture Book"}
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isGuide ? (
          <>
            <StatCard label="Total Referrals" value={referralStats.totalReferred} color="#C9A84C" icon={Users} />
            <StatCard label="Registered" value={referralStats.registered} color="#10B981" icon={CheckCircle2} />
            <StatCard label="Pending Registration" value={referralStats.pendingRegistration} color="#F59E0B" icon={Clock} />
          </>
        ) : (
          <>
            <StatCard label={isEndUser ? "My Picture Books" : "Total Books"} value={stats.totalBooks} color="#C9A84C" icon={BookOpen} />
            <StatCard label={isEndUser ? "In progress" : "Active"} value={stats.activeBooks} color="#10B981" icon={CheckCircle2} />
            <StatCard label={isEndUser ? "Getting started" : "Pending"} value={stats.pendingBooks} color="#F59E0B" icon={Clock} />
            <StatCard label={isEndUser ? "Need attention" : "Failed"} value={stats.failedBooks} color="#EF4444" icon={XCircle} />
          </>
        )}
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white border border-[#EAE6DF] rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#EAE6DF] flex items-center justify-between">
            <h2 className="text-xl font-serif text-[#1A1A1A] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#C9A84C]" />
            {isEndUser ? "Your Picture Books" : `Recent ${isGuide ? "Referrals" : "Picture Books"}`}
          </h2>
          <Link href={isGuide ? "/dashboard/referrals" : "/dashboard/clients"} className="text-sm font-medium text-[#C9A84C] hover:text-[#B08D38] transition-colors flex items-center">
            View all <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#EAE6DF] border-t-[#C9A84C] rounded-full animate-spin mb-4"></div>
            <div className="text-sm font-medium text-[#999] uppercase tracking-widest">Loading...</div>
          </div>
        ) : isGuide ? (
          referrals.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#FAF9F6] flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-[#CCC]" />
              </div>
              <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">No referrals yet</h3>
              <p className="text-[#666] text-sm max-w-sm mb-6">
                Refer your first customer to get started.
              </p>
              <Link href="/dashboard/referrals/new" className="bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors rounded-md px-5 py-2.5 flex items-center shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Get Started
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-[#EAE6DF]">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#666] uppercase tracking-wider">Name</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#666] uppercase tracking-wider">WhatsApp</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#666] uppercase tracking-wider">Registration Status</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#666] uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE6DF]">
                  {referrals.map((ref: any) => (
                    <tr key={ref.id} className="hover:bg-[#FAF9F6] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#1A1A1A]">{ref.name || "Customer"}</div>
                        <div className="text-xs text-[#666] mt-0.5">{ref.email}</div>
                      </td>
                      <td className="px-6 py-4 text-[#4A4A4A] font-medium">{ref.whatsappNumber || ref.phone || "N/A"}</td>
                      <td className="px-6 py-4"><UserRegistrationBadge passwordHash={ref.passwordHash} /></td>
                      <td className="px-6 py-4 text-xs font-medium text-[#666]">{new Date(ref.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : books.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#FAF9F6] flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-[#CCC]" />
            </div>
            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">{isEndUser ? "Your story starts here" : "No items yet"}</h3>
            <p className="text-[#666] text-sm max-w-sm mb-6">
              {isEndUser ? "Create a Picture Book, upload your favourite photos, and follow every step in one place." : "No picture books in the system yet."}
            </p>
            <Link href="/dashboard/clients/new" className="bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors rounded-md px-5 py-2.5 flex items-center shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Get Started
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#EAE6DF]">
                  {(isEndUser
                    ? ["Title", "Status", "Drive Link", "Created", ""]
                    : ["Name", "WhatsApp", "Status", "Drive Link", "Created", ""]
                  ).map((h) => (
                    <th key={h} className="text-left px-6 py-4 text-xs font-semibold text-[#666] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE6DF]">
                {books.map((book: any) => (
                  <tr key={book.id} className="hover:bg-[#FAF9F6] transition-colors group">
                    {isEndUser ? (
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#1A1A1A]">{book.title}</div>
                      </td>
                    ) : (
                      <>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-[#1A1A1A]">{book.user?.name || "Customer"}</div>
                          <div className="text-xs text-[#666] mt-0.5">{book.title}</div>
                        </td>
                        <td className="px-6 py-4 text-[#4A4A4A] font-medium">
                          {book.user?.whatsappNumber || "N/A"}
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4">
                      <StatusBadge status={book.status} />
                    </td>
                    <td className="px-6 py-4">
                      {book.driveLink ? (
                        <a href={book.driveLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                          Open Drive Link
                        </a>
                      ) : (
                        <span className="text-[#999] italic">Pending...</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-[#666]">
                      {new Date(book.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/clients/${book.id}`}
                        className="inline-flex items-center justify-center p-2 rounded-lg text-[#999] hover:text-[#1A1A1A] hover:bg-[#EAE6DF] transition-colors opacity-0 group-hover:opacity-100">
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
