"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { ClipboardList, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";

export default function AuditLogsPage() {
  const { accessToken, user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function loadLogs(currentPage: number) {
      if (!accessToken || user?.role !== "ADMIN") {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await apiFetch<any>(`/audit-logs?page=${currentPage}&limit=20`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setLogs(response.data || []);
        setMeta(response.meta || null);
      } catch (err: any) {
        toast.error("Failed to load audit logs", { description: err.message });
      } finally {
        setLoading(false);
      }
    }
    loadLogs(page);
  }, [accessToken, user, page]);

  if (user?.role !== "ADMIN") {
    return (
      <div className="p-10 flex flex-col items-center justify-center text-center">
        <ShieldAlert className="w-12 h-12 text-[#999] mb-4" />
        <h2 className="text-xl font-serif text-[#1A1A1A]">Access Denied</h2>
        <p className="text-[#666] text-sm mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-serif text-[#1A1A1A] tracking-tight">Audit Logs</h1>
        <p className="text-[#666] text-sm mt-1">Review system activities, automated tasks, and user actions.</p>
      </div>

      <div className="bg-white border border-[#EAE6DF] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 flex justify-center">
            <div className="w-8 h-8 border-2 border-[#EAE6DF] border-t-[#C9A84C] rounded-full animate-spin"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-[#666]">No audit logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#EAE6DF]">
                  <th className="px-6 py-4 text-xs font-semibold text-[#666] uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#666] uppercase tracking-wider">User / System</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#666] uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#666] uppercase tracking-wider">Resource</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#666] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE6DF]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAF9F6] transition-colors">
                    <td className="px-6 py-4 text-xs text-[#999] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-[#1A1A1A]">
                      {log.userId ? log.userId : "System"}
                    </td>
                    <td className="px-6 py-4 text-[#1A1A1A] max-w-xs truncate" title={log.action}>
                      {log.action}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className="font-semibold text-[#666]">{log.resourceType}</span>
                      {log.resourceId && <span className="block font-mono text-[10px] text-[#999] mt-0.5">{log.resourceId}</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                        log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                        log.status === 'FAILED' ? 'bg-rose-100 text-rose-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && logs.length > 0 && (
          <Pagination meta={meta} onPageChange={setPage} />
        )}
      </div>
    </div>
  );
}
