"use client";
import { useEffect, useState, use } from "react";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, User, Mail, Smartphone, MapPin, 
  HardDrive, ShieldAlert,
  Calendar, Plane, RefreshCw, Copy
} from "lucide-react";

function isStandardUpdateMessage(body: string | null | undefined, title: string) {
  const match = /^update\s+on\s+["“”'](.+?)["“”']\s*$/i.exec(body?.trim() || "");
  return Boolean(match && match[1].trim().localeCompare(title, undefined, { sensitivity: "accent" }) === 0);
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { accessToken, user } = useAuth();
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Modals state — removed WhatsApp modal (admin handles via WhatsApp directly)


  const loadCustomer = async () => {
    if (!accessToken) return;
    try {
      const data = await apiFetch(`/users/${resolvedParams.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setCustomer(data);
    } catch (err: any) {
      toast.error("Failed to load customer", { description: err.message });
      router.push("/dashboard/users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomer();
  }, [accessToken, resolvedParams.id, router]);

  // Poll for status updates if any picture book is in a transient state
  useEffect(() => {
    if (!customer?.pictureBooks) return;
    
    const hasPendingJobs = customer.pictureBooks.some(
      (pb: any) => pb.driveStatus === 'QUEUED' || pb.driveStatus === 'PROCESSING'
    );

    if (hasPendingJobs) {
      const interval = setInterval(() => {
        loadCustomer();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [customer]);

  async function updateStatus(pbId: string, newStatus: string) {
    if (!accessToken) return;
    setSubmittingId(`status-${pbId}`);
    try {
      await apiFetch(`/picture-books/${pbId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: newStatus })
      });
      toast.success("Status updated successfully");
      await loadCustomer();
    } catch (err: any) {
      toast.error("Failed to update status", { description: err.message });
    } finally {
      setSubmittingId(null);
    }
  }

  async function createDriveLink(pbId: string) {
    if (!accessToken) return;
    setSubmittingId(`drive-${pbId}`);
    try {
      await apiFetch(`/picture-books/${pbId}/drive`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast.success("Drive link creation queued");
      await loadCustomer();
    } catch (err: any) {
      toast.error("Failed to queue drive job", { description: err.message });
    } finally {
      setSubmittingId(null);
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

  if (loading || !customer) {
    return (
      <div className="p-16 flex justify-center">
        <div className="w-8 h-8 border-2 border-[#EAE6DF] border-t-[#C9A84C] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10 max-w-5xl mx-auto space-y-8 relative">
      <button 
        onClick={() => router.push("/dashboard/users")}
        className="flex items-center gap-2 text-sm font-medium text-[#666] hover:text-[#1A1A1A] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Search
      </button>

      {/* Profile Header */}
      <div className="bg-white border border-[#EAE6DF] rounded-xl p-8 shadow-sm flex flex-col sm:flex-row gap-8 items-start">
        <div className="w-20 h-20 bg-[#FAF9F6] border border-[#EAE6DF] rounded-full flex items-center justify-center shrink-0">
          <User className="w-8 h-8 text-[#999]" />
        </div>
        <div className="flex-1 space-y-4 w-full">
          <div>
            <h1 className="text-3xl font-serif text-[#1A1A1A] tracking-tight">{customer.name}</h1>
            <div className="flex flex-wrap gap-4 mt-2">
              <span className="inline-flex items-center gap-1.5 text-[#666] text-sm"><Mail className="w-4 h-4" /> {customer.email}</span>
              {(customer.phone || customer.whatsappNumber) && <span className="inline-flex items-center gap-1.5 text-[#666] text-sm"><Smartphone className="w-4 h-4" /> {customer.phone || customer.whatsappNumber}</span>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#EAE6DF]">
            <div>
              <span className="block text-xs font-medium text-[#999] uppercase tracking-wider mb-1">Address</span>
              {customer.addressLine1 ? (
                <div className="text-sm text-[#1A1A1A]">
                  {customer.addressLine1} {customer.addressLine2}<br/>
                  {customer.city}, {customer.state} {customer.postalCode}<br/>
                  {customer.country}
                </div>
              ) : <div className="text-sm text-[#999] italic">Not provided</div>}
            </div>
            <div>
              <span className="block text-xs font-medium text-[#999] uppercase tracking-wider mb-1">Role & Source</span>
              <div className="text-sm text-[#1A1A1A]">
                <span className="font-medium">{customer.role.replace('_', ' ')}</span>
                {customer.referredBy && <span className="text-[#666]"> • Referred by {customer.referredBy.name}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-serif text-[#1A1A1A] tracking-tight">Picture Books</h2>
        
        {(!customer.pictureBooks || customer.pictureBooks.length === 0) ? (
          <div className="bg-white border border-[#EAE6DF] rounded-xl p-10 text-center shadow-sm">
            <p className="text-[#666]">No Picture Books associated with this customer.</p>
          </div>
        ) : (
          customer.pictureBooks.map((pb: any) => (
            <div key={pb.id} className="bg-white border border-[#EAE6DF] rounded-xl overflow-hidden shadow-sm">
              <div className="p-6 sm:p-8 border-b border-[#EAE6DF] flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <h3 className="text-xl font-serif text-[#1A1A1A]">{pb.title}</h3>
                  <div className="text-sm text-[#666] mt-1 space-y-1">
                    <div>ID: <span className="font-mono text-xs">{pb.id}</span></div>
                    {pb.driveLink ? (
                      <div><a href={pb.driveLink} target="_blank" className="text-[#C9A84C] hover:underline font-medium inline-flex items-center gap-1"><HardDrive className="w-3.5 h-3.5" /> Drive Folder</a></div>
                    ) : (
                      <div className="text-[#999] italic">No Drive link generated</div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <select 
                    value={pb.status}
                    onChange={(e) => updateStatus(pb.id, e.target.value)}
                    disabled={submittingId === `status-${pb.id}`}
                    className="border border-[#EAE6DF] rounded-md px-3 py-2 text-sm font-medium focus:ring-[#C9A84C] focus:border-[#C9A84C] bg-[#FAF9F6]"
                  >
                    <option value="REQUESTED">Requested (New)</option>
                    <option value="UPLOAD_PENDING">Upload Pending</option>
                    <option value="PRODUCTION">Production</option>
                    <option value="READY">Ready</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#FAF9F6]">
                {/* Details Column */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3 uppercase tracking-wider">Delivery Details</h4>
                    <div className="bg-white p-4 rounded-lg border border-[#EAE6DF] space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-24 text-xs font-medium text-[#999] uppercase tracking-wider">Type</span>
                        <span className="text-sm font-medium text-[#1A1A1A]">{pb.deliveryPreference === 'BEFORE_DEPARTURE' ? 'Before Departure' : 'Home Delivery'}</span>
                      </div>
                      
                      {pb.deliveryPreference === 'BEFORE_DEPARTURE' && (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="w-24 text-xs font-medium text-[#999] uppercase tracking-wider">Flight</span>
                            <span className="text-sm text-[#1A1A1A] flex items-center gap-1.5"><Plane className="w-3.5 h-3.5 text-[#999]"/> {pb.flightNumber || 'Not provided'} • {pb.departureAirport}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-24 text-xs font-medium text-[#999] uppercase tracking-wider">Date</span>
                            <span className="text-sm text-[#1A1A1A] flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#999]"/> {pb.departureDate ? new Date(pb.departureDate).toLocaleDateString() : 'N/A'} {pb.departureTime}</span>
                          </div>
                        </>
                      )}
                      
                      <div className="flex items-start gap-2">
                        <span className="w-24 text-xs font-medium text-[#999] uppercase tracking-wider mt-0.5">Address</span>
                        <span className="text-sm text-[#1A1A1A] flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#999] mt-0.5 shrink-0"/> 
                          {pb.deliveryAddressLine1 ? (
                            <span>{pb.deliveryAddressLine1} {pb.deliveryAddressLine2}, {pb.deliveryCity}, {pb.deliveryCountry}</span>
                          ) : 'Not provided'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3 uppercase tracking-wider flex items-center justify-between">
                      Automation Status
                      <button onClick={loadCustomer} className="text-[#666] hover:text-[#1A1A1A] transition-colors" title="Refresh Status">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </h4>
                    <div className="bg-white p-4 rounded-lg border border-[#EAE6DF] space-y-4">
                      {/* Drive Link Status */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-[#1A1A1A] flex items-center gap-1.5"><HardDrive className="w-4 h-4 text-[#999]"/> Drive Link Generation</span>
                          {pb.driveStatus && (
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                              pb.driveStatus === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              pb.driveStatus === 'FAILED' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                              pb.driveStatus === 'PROCESSING' ? 'bg-blue-100 text-blue-800 border border-blue-200 animate-pulse' :
                              'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              Status: {pb.driveStatus}
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-1">
                          {!pb.driveStatus && (
                            <span className="text-sm text-[#666]">Not started</span>
                          )}
                          
                          {pb.driveStatus === 'QUEUED' && (
                            <span className="text-sm text-[#666]">Drive link generation queued</span>
                          )}
                          
                          {pb.driveStatus === 'PROCESSING' && (
                            <span className="text-sm text-blue-600 flex items-center gap-2">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating Drive link...
                            </span>
                          )}
                          
                          {pb.driveStatus === 'SUCCESS' && pb.driveLink && (
                            <div className="flex flex-col gap-2">
                              <span className="text-sm text-emerald-600 font-medium">Drive link generated</span>
                              <a 
                                href={pb.driveLink} 
                                target="_blank" 
                                className="inline-flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-md text-sm font-medium w-fit transition-colors"
                              >
                                <HardDrive className="w-3.5 h-3.5" /> Open Drive
                              </a>
                            </div>
                          )}
                          
                          {pb.driveStatus === 'FAILED' && (
                            <div className="flex flex-col gap-2">
                              <span className="text-sm text-rose-600 font-medium">Drive link generation failed</span>
                              <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-100 break-words">
                                {pb.driveError || 'Could not create the Drive folder.'}
                              </div>
                              <button 
                                onClick={() => createDriveLink(pb.id)}
                                disabled={submittingId === `drive-${pb.id}`}
                                className="inline-flex items-center justify-center gap-1.5 bg-white border border-[#EAE6DF] hover:border-[#C9A84C] text-[#1A1A1A] hover:text-[#C9A84C] px-3 py-1.5 rounded-md text-sm font-medium w-fit transition-colors disabled:opacity-50"
                              >
                                {submittingId === `drive-${pb.id}` ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                Retry
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {pb.messages?.some((message: any) => message.direction === "INBOUND" && !isStandardUpdateMessage(message.body, pb.title)) && (
                        <div>
                          <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3 uppercase tracking-wider">WhatsApp attention</h4>
                          <div className="bg-white p-4 rounded-lg border border-amber-200 space-y-3">
                            <p className="text-xs text-[#666]">The customer sent a message that needs a manual response in WhatsApp.</p>
                            {pb.messages.filter((message: any) => message.direction === "INBOUND" && !isStandardUpdateMessage(message.body, pb.title)).slice(0, 3).map((message: any) => (
                              <div key={message.id} className="text-sm text-[#1A1A1A] bg-[#FAF9F6] border border-[#EAE6DF] rounded-md p-3 whitespace-pre-wrap">{message.body}</div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>


              </div>
            </div>
          ))
        )}
      </div>




    </div>
  );
}
