"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { AlertTriangle, Plus, CheckCircle2, Clock, XCircle, FileText, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";

function StatusBadge({ status }: { status: string }) {
  if (status === "RESOLVED") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3"/> Resolved</span>;
  if (status === "OPEN") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"><AlertTriangle className="w-3 h-3"/> Open</span>;
  if (status === "IN_PROGRESS") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3"/> In Progress</span>;
  return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gray-50 text-gray-700 border border-gray-200">{status}</span>;
}

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === "HIGH") return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">HIGH</span>;
  if (priority === "MEDIUM") return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">MED</span>;
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800">LOW</span>;
}

export default function IncidentsPage() {
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    apiFetch(`/incidents?page=${page}&limit=20`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res: any) => {
        setIncidents(res.data || []);
        setMeta(res.meta || null);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load incidents");
      })
      .finally(() => setLoading(false));
  }, [accessToken, page]);

  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[#1A1A1A] tracking-tight">IT Support</h1>
          <p className="text-[#666] text-sm mt-1">
            {isAdmin ? "Manage and resolve customer support tickets." : "Report an issue or check the status of your support tickets."}
          </p>
        </div>
        {!isAdmin && (
          <Link href="/dashboard/incidents/new" className="bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors rounded-md px-5 py-2.5 flex items-center justify-center font-medium shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> 
            Report Issue
          </Link>
        )}
      </div>

      <div className="bg-white border border-[#EAE6DF] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#EAE6DF] border-t-[#C9A84C] rounded-full animate-spin mb-4"></div>
            <div className="text-sm font-medium text-[#999] uppercase tracking-widest">Loading...</div>
          </div>
        ) : incidents.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#FAF9F6] flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-[#CCC]" />
            </div>
            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">No incidents reported</h3>
            <p className="text-[#666] text-sm max-w-sm mb-6">
              {isAdmin ? "There are no support tickets in the system." : "You haven't reported any issues yet."}
            </p>
            {!isAdmin && (
              <Link href="/dashboard/incidents/new" className="bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors rounded-md px-5 py-2.5 flex items-center shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Report Issue
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-[#EAE6DF]">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#666] uppercase tracking-wider">Title</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#666] uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#666] uppercase tracking-wider">Priority</th>
                    {isAdmin && <th className="text-left px-6 py-4 text-xs font-semibold text-[#666] uppercase tracking-wider">Reported By</th>}
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#666] uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE6DF]">
                  {incidents.map((incident) => (
                    <tr 
                      key={incident.id} 
                      onClick={() => isAdmin ? router.push(`/dashboard/incidents/${incident.id}`) : null}
                      className={`hover:bg-[#FAF9F6] transition-colors group ${isAdmin ? 'cursor-pointer' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#1A1A1A]">{incident.title}</div>
                        {incident.pictureBook && (
                          <div className="text-xs text-[#666] mt-0.5 flex items-center gap-1">
                            <span className="font-medium">Book:</span> {incident.pictureBook.title}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={incident.status} /></td>
                      <td className="px-6 py-4"><PriorityBadge priority={incident.priority} /></td>
                      {isAdmin && (
                        <td className="px-6 py-4">
                          <div className="text-[#1A1A1A] font-medium">{incident.user?.name}</div>
                          <div className="text-[#666] text-xs">{incident.user?.email}</div>
                        </td>
                      )}
                      <td className="px-6 py-4 text-xs font-medium text-[#666]">
                        {new Date(incident.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <Pagination meta={meta} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
