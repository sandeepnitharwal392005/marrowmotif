"use client";
import { useEffect, useState, use } from "react";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, User, Mail, Smartphone, MapPin, 
  MessageSquare, HardDrive, ShieldAlert,
  Calendar, Plane, RefreshCw, Send, CheckCircle2, AlertCircle
} from "lucide-react";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { accessToken, user } = useAuth();
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Modals state
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [selectedPbId, setSelectedPbId] = useState<string | null>(null);
  const [waType, setWaType] = useState<"default" | "custom">("default");
  const [customMsg, setCustomMsg] = useState("");

  useEffect(() => {
    async function loadCustomer() {
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
    }
    loadCustomer();
  }, [accessToken, resolvedParams.id, router]);

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
      
      // We don't want to reload the entire user, let's just update the local state for speed.
      // But actually, reloading the user is safer to get the new activity log.
      const data = await apiFetch(`/users/${resolvedParams.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setCustomer(data);
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
    } catch (err: any) {
      toast.error("Failed to queue drive job", { description: err.message });
    } finally {
      setSubmittingId(null);
    }
  }

  async function sendWhatsApp() {
    if (!accessToken || !selectedPbId) return;
    setSubmittingId(`wa-${selectedPbId}`);
    try {
      if (waType === "default") {
        await apiFetch(`/whatsapp/send-default/${selectedPbId}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } else {
        await apiFetch(`/whatsapp/send-custom/${selectedPbId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}` 
          },
          body: JSON.stringify({ message: customMsg })
        });
      }
      toast.success("WhatsApp message queued");
      setWaModalOpen(false);
    } catch (err: any) {
      toast.error("Failed to queue WhatsApp message", { description: err.message });
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
                    <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3 uppercase tracking-wider">Admin Actions</h4>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => createDriveLink(pb.id)}
                        disabled={submittingId === `drive-${pb.id}`}
                        className="bg-white border border-[#EAE6DF] hover:border-[#C9A84C] text-[#1A1A1A] hover:text-[#C9A84C] px-4 py-2 rounded-md font-medium text-sm transition-all flex items-center justify-center gap-2"
                      >
                        {submittingId === `drive-${pb.id}` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
                        Manually Generate Drive Link
                      </button>
                      
                      <button 
                        onClick={() => { setSelectedPbId(pb.id); setWaModalOpen(true); }}
                        className="bg-[#1A1A1A] hover:bg-[#333] text-white px-4 py-2 rounded-md font-medium text-sm transition-all flex items-center justify-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Send WhatsApp Message
                      </button>
                    </div>
                  </div>
                </div>

                {/* Activity Column */}
                <div>
                  <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3 uppercase tracking-wider">Activity & Automation</h4>
                  <div className="bg-white p-4 rounded-lg border border-[#EAE6DF] h-64 overflow-y-auto space-y-4">
                    {/* Combine Activity Logs and WhatsApp Messages into a single timeline for the UI, sorted by date */}
                    {[...(pb.activityLogs || []).map((l: any) => ({ ...l, _type: 'log', _date: new Date(l.createdAt) })), ...(pb.messages || []).map((m: any) => ({ ...m, _type: 'wa', _date: new Date(m.createdAt) }))]
                      .sort((a, b) => b._date.getTime() - a._date.getTime())
                      .map((item, i) => (
                        <div key={i} className="flex gap-3 text-sm">
                          {item._type === 'wa' ? (
                            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                              <MessageSquare className="w-4 h-4 text-emerald-600" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                              <RefreshCw className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <div className="text-[#1A1A1A] font-medium">
                              {item._type === 'wa' ? `WhatsApp: ${item.status}` : item.action}
                            </div>
                            <div className="text-[#666] text-xs mt-0.5">
                              {item._type === 'wa' ? (item.errorMessage ? <span className="text-rose-600">Error: {item.errorMessage}</span> : `Attempts: ${item.attempts}`) : item.details}
                            </div>
                            <div className="text-[#999] text-xs mt-1">
                              {item._date.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {((pb.activityLogs?.length || 0) + (pb.messages?.length || 0)) === 0 && (
                        <div className="text-center text-[#999] italic mt-8">No activity recorded yet</div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* WhatsApp Modal */}
      {waModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[#EAE6DF] flex justify-between items-center bg-[#FAF9F6]">
              <h3 className="font-serif text-[#1A1A1A] text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#C9A84C]" />
                Send WhatsApp
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Message Type</label>
                <div className="flex rounded-md shadow-sm">
                  <button
                    onClick={() => setWaType("default")}
                    className={`flex-1 py-2 text-sm font-medium border ${waType === 'default' ? 'bg-[#FAF9F6] border-[#C9A84C] text-[#C9A84C] z-10' : 'bg-white border-[#EAE6DF] text-[#666]'} rounded-l-md transition-colors`}
                  >
                    Default Template
                  </button>
                  <button
                    onClick={() => setWaType("custom")}
                    className={`flex-1 py-2 text-sm font-medium border-y border-r ${waType === 'custom' ? 'bg-[#FAF9F6] border-l border-[#C9A84C] border-y-[#C9A84C] border-r-[#C9A84C] text-[#C9A84C] z-10' : 'bg-white border-[#EAE6DF] text-[#666]'} rounded-r-md transition-colors`}
                  >
                    Custom Text
                  </button>
                </div>
              </div>

              {waType === "default" ? (
                <div className="bg-blue-50 text-blue-800 p-4 rounded-md text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>This will send the Default WhatsApp Message Template defined in Settings, and automatically substitute the customer's name, book title, status, and Google Drive link.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#1A1A1A]">Custom Message</label>
                  <textarea 
                    value={customMsg}
                    onChange={(e) => setCustomMsg(e.target.value)}
                    className="w-full border border-[#EAE6DF] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20 focus:border-[#C9A84C] min-h-[100px] resize-y"
                    placeholder="Type your message here..."
                  />
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-[#EAE6DF] bg-[#FAF9F6] flex justify-end gap-3">
              <button 
                onClick={() => setWaModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-[#666] hover:text-[#1A1A1A] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={sendWhatsApp}
                disabled={submittingId === `wa-${selectedPbId}` || (waType === "custom" && !customMsg.trim())}
                className="bg-[#1A1A1A] hover:bg-[#333] text-white px-4 py-2 rounded-md font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submittingId === `wa-${selectedPbId}` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
