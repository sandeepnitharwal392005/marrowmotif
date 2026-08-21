"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, AlertTriangle, ShieldAlert } from "lucide-react";
import { ErrorState } from "@/components/ui/ErrorState";

export default function IncidentDetailPage() {
  const { accessToken, user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [incident, setIncident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [pageError, setPageError] = useState<any>(null);

  function load() {
    if (!accessToken || !id) return;
    setLoading(true);
    setPageError(null);
    
    // The backend now has GET /incidents/:id, which we added.
    apiFetch(`/incidents/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then((data) => {
        setIncident(data);
      })
      .catch((err) => {
        setPageError(err);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [id, accessToken]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!accessToken || !id) return;
    setUpdating(true);
    try {
      const updated = await apiFetch(`/incidents/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ status: newStatus }),
      });
      setIncident({ ...incident, status: newStatus });
      toast.success("Incident status updated");
    } catch (err: any) {
      toast.error("Failed to update status", { description: err.message });
    } finally {
      setUpdating(false);
    }
  };

  if (user?.role === "GUIDE") {
    return (
      <div className="p-10 flex flex-col items-center justify-center text-center">
        <ShieldAlert className="w-12 h-12 text-[#999] mb-4" />
        <h2 className="text-xl font-serif text-[#1A1A1A]">Access Denied</h2>
        <p className="text-[#666] text-sm mt-2">You do not have permission to view incident details.</p>
        <Link href="/dashboard/incidents" className="mt-6 text-[#C9A84C] hover:underline font-medium">Back to IT Support</Link>
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#EAE6DF] border-t-[#C9A84C] rounded-full animate-spin"></div>
    </div>
  );
  
  if (pageError) return (
    <ErrorState error={pageError} onRetry={load} />
  );

  if (!incident) return (
    <div className="p-8 text-center text-[#999]">Incident not found.</div>
  );

  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/incidents" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#666]" />
        </Link>
        <div>
          <h1 className="text-2xl font-serif text-[#1A1A1A] tracking-tight">Incident Details</h1>
          <p className="text-[#666] text-sm mt-1">Manage and resolve technical issue ticket #{incident.id.slice(-6)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-[#EAE6DF] rounded-xl shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">{incident.title}</h2>
            <div className="bg-[#FAF9F6] p-4 rounded-lg text-[#4A4A4A] whitespace-pre-wrap text-sm border border-[#EAE6DF]">
              {incident.description}
            </div>
          </div>
          
          {incident.pictureBook && (
            <div className="bg-white border border-[#EAE6DF] rounded-xl shadow-sm p-6">
              <h3 className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wider mb-4">Related Picture Book</h3>
              <div className="flex items-center justify-between p-4 border border-[#EAE6DF] rounded-lg">
                <div>
                  <div className="font-medium text-[#1A1A1A]">{incident.pictureBook.title}</div>
                  <div className="text-xs text-[#666] mt-1">Status: {incident.pictureBook.status}</div>
                </div>
                <Link href={`/dashboard/clients/${incident.pictureBook.id}`} className="text-sm font-medium text-[#C9A84C] hover:text-[#B08D38]">
                  View Book &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-[#EAE6DF] rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wider mb-4">Properties</h3>
            
            <div className="space-y-4">
              <div>
                <div className="text-xs text-[#666] mb-1">Reported By</div>
                <div className="font-medium text-[#1A1A1A]">{incident.user?.name}</div>
                <div className="text-sm text-[#666]">{incident.user?.email}</div>
              </div>
              
              <div>
                <div className="text-xs text-[#666] mb-1">Date</div>
                <div className="text-sm text-[#1A1A1A]">
                  {new Date(incident.createdAt).toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-xs text-[#666] mb-1">Priority</div>
                <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-800">
                  {incident.priority}
                </div>
              </div>

              {user?.role === "ADMIN" && (
                <div className="pt-4 border-t border-[#EAE6DF]">
                  <div className="text-xs font-semibold text-[#1A1A1A] uppercase mb-2">Update Status</div>
                  <select
                    disabled={updating}
                    value={incident.status}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-sm text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                  {updating && <div className="text-xs text-[#666] mt-2 animate-pulse">Updating...</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
