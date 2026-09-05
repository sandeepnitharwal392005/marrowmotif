"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { pictureBooksApi, apiFetch } from "@/lib/api";
import { ArrowLeft, User, Mail, CheckCircle2, Clock, CheckCircle, Smartphone, HardDrive, RefreshCw, Copy, ExternalLink, XCircle, Send, BookOpen } from "lucide-react";
import { toast } from "sonner";

import { ErrorState } from "@/components/ui/ErrorState";

function TimelineStep({ label, description, state }: { label: string; description?: string; state: "pending" | "active" | "completed" | "failed" }) {
  const getIcon = () => {
    if (state === "completed") return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    if (state === "failed") return <XCircle className="w-5 h-5 text-rose-600" />;
    if (state === "active") return <div className="w-5 h-5 rounded-full border-2 border-[#C9A84C]/30 border-t-[#C9A84C] animate-spin" />;
    return <div className="w-3 h-3 rounded-full bg-[#EAE6DF]" />;
  };

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          state === "completed" ? "bg-emerald-50 border border-emerald-100" :
          state === "failed" ? "bg-rose-50 border border-rose-100" :
          state === "active" ? "bg-[#FAF9F6] border border-[#C9A84C]/20" :
          "bg-[#FAF9F6] border border-[#EAE6DF]"
        }`}>
          {getIcon()}
        </div>
        <div className={`w-0.5 h-full min-h-[2rem] my-2 ${state === "completed" ? "bg-emerald-200" : "bg-[#EAE6DF]"}`} />
      </div>
      <div className="pt-1 pb-6">
        <div className={`font-semibold text-sm ${
          state === "completed" ? "text-emerald-700" :
          state === "failed" ? "text-rose-700" :
          state === "active" ? "text-[#C9A84C]" :
          "text-[#999]"
        }`}>{label}</div>
        {description && <div className="text-xs text-[#666] mt-1 max-w-[250px] leading-relaxed">{description}</div>}
      </div>
    </div>
  );
}

export default function PictureBookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { accessToken, user } = useAuth();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<any>(null);
  const [retrying, setRetrying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [generatingDrive, setGeneratingDrive] = useState(false);
  
  // WhatsApp Modal State
  const [showWaModal, setShowWaModal] = useState(false);
  const [waNumber, setWaNumber] = useState("");
  const [waLink, setWaLink] = useState("");
  // Admin messages are always free-form messages.  Starting in DEFAULT meant
  // the form could report success without ever calling the send endpoint.
  const [waType, setWaType] = useState<"CUSTOM">("CUSTOM");
  const [customMsg, setCustomMsg] = useState("");
  const [sendingWa, setSendingWa] = useState(false);

  async function load() {
    if (!accessToken || !id) return;
    setPageError(null);
    try {
      const data = await pictureBooksApi.get(accessToken, id);
      setBook(data);
    } catch (err: any) {
      setPageError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [accessToken, id]);

  useEffect(() => {
    if (searchParams.get("whatsapp") === "1" && book && user?.role === "END_USER") {
      setWaNumber(book.user?.whatsappNumber || "");
      setShowWaModal(true);
    }
  }, [searchParams, book, user?.role]);

  // Poll for status changes if pending
  useEffect(() => {
    if (!book || book.status !== "REQUESTED") return;
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [book?.status]);

  async function handleRetry() {
    if (!accessToken || !id) return;
    setRetrying(true);
    try {
      await pictureBooksApi.resend(accessToken, id);
      toast.success("Retry queued", { description: "Automation will be attempted again shortly." });
      setTimeout(load, 2000);
    } catch (err: any) {
      toast.error("Retry failed", { description: err.message });
    } finally {
      setRetrying(false);
    }
  }

  async function handleCopyLink() {
    if (!book?.driveLink) return;
    try {
      await navigator.clipboard.writeText(book.driveLink);
      toast.success("Link copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  }

  async function updateStatus(newStatus: string) {
    if (!accessToken || !id) return;
    setUpdatingStatus(true);
    try {
      await apiFetch(`/picture-books/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: newStatus })
      });
      toast.success("Status updated successfully");
      await load();
    } catch (err: any) {
      toast.error("Failed to update status", { description: err.message });
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleCreateDrive() {
    if (!accessToken || !id) return;
    setGeneratingDrive(true);
    try {
      await apiFetch(`/picture-books/${id}/drive`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast.success("Drive folder generation queued");
      setTimeout(load, 2000);
    } catch (err: any) {
      toast.error("Failed to generate drive link", { description: err.message });
    } finally {
      setGeneratingDrive(false);
    }
  }

  async function handleSendWa(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !id) return;
    setSendingWa(true);
    try {
      await apiFetch(`/whatsapp/send-custom/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ message: customMsg.trim() })
      });
      toast.success("WhatsApp message queued");
      setShowWaModal(false);
      setCustomMsg("");
      setTimeout(load, 1500);
    } catch (err: any) {
      toast.error("Failed to queue message", { description: err.message });
    } finally {
      setSendingWa(false);
    }
  }

  async function handleWhatsappOptIn() {
    if (!accessToken || !id) return;
    setSendingWa(true);
    try {
      const result = await pictureBooksApi.whatsappOptIn(accessToken, id, waNumber || undefined);
      setWaLink(result.link);
      await load();
    } catch (err: any) {
      toast.error("WhatsApp updates are unavailable", { description: err.message });
    } finally {
      setSendingWa(false);
    }
  }

  async function handleWhatsappDecline() {
    if (!accessToken || !id) return;
    try {
      await pictureBooksApi.whatsappDecline(accessToken, id);
      setShowWaModal(false);
      await load();
    } catch (err: any) {
      toast.error("Could not update your preference", { description: err.message });
    }
  }

  if (loading) return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#EAE6DF] border-t-[#C9A84C] rounded-full animate-spin"></div>
    </div>
  );
  
  if (pageError) return (
    <ErrorState error={pageError} onRetry={load} />
  );

  if (!book) return (
    <div className="p-8 text-center text-[#999]">Picture Book not found.</div>
  );

  // The API relation is named `messages`; the old `whatsappMessages` name
  // silently evaluated to undefined and left the Communication Log blank.
  const whatsappMessages = [...(book.messages || [])].sort(
    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const isFailed = book.driveStatus === "FAILED";
  const isEndUser = user?.role === "END_USER";

  return (
    <div className="p-4 sm:p-10 max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <Link href="/dashboard/clients" className="inline-flex items-center text-[#666] text-sm font-medium hover:text-[#1A1A1A] transition-colors mb-3 group">
          <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" />
          Back to list
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1A1A] tracking-tight break-words">{book.title}</h1>
            <p className="text-[#666] text-xs sm:text-sm mt-1">
              Created on {new Date(book.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          {user?.role === "ADMIN" ? (
              <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-[#666]">Status:</span>
              <select 
                value={book.status}
                onChange={(e) => updateStatus(e.target.value)}
                disabled={updatingStatus}
                className="border border-[#EAE6DF] rounded-md px-3 py-2 text-sm font-medium focus:ring-[#C9A84C] focus:border-[#C9A84C] bg-[#FAF9F6] outline-none"
              >
                <option value="REQUESTED">Requested (New)</option>
                <option value="UPLOAD_PENDING">Upload Pending</option>
                <option value="PHOTOS_UPLOADED">Photos Uploaded</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="IN_PRODUCTION">In Production</option>
                <option value="READY">Ready</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              {updatingStatus && <RefreshCw className="w-4 h-4 animate-spin text-[#999]" />}
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FAF9F6] text-[#1A1A1A] border border-[#EAE6DF]">
              {book.status.replace("_", " ")}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Automation Status */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white p-6 border border-[#EAE6DF] rounded-xl shadow-sm">
            <h2 className="font-serif text-[#1A1A1A] text-lg mb-5 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#C9A84C]" /> Project Details
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-[#999] mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-[#999] mb-0.5 font-medium uppercase tracking-wider">Customer</div>
                  <div className="text-sm font-medium text-[#1A1A1A]">{book.user?.name || "N/A"}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Smartphone className="w-4 h-4 text-[#999] mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-[#999] mb-0.5 font-medium uppercase tracking-wider">WhatsApp</div>
                  <div className="text-sm font-medium text-[#1A1A1A]">{book.user?.whatsappNumber || "Not added"}</div>
                </div>
              </div>
              {book.endUser?.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#999] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-[#999] mb-0.5 font-medium uppercase tracking-wider">Email</div>
                    <div className="text-sm font-medium text-[#1A1A1A]">{book.endUser.email}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 border border-[#EAE6DF] rounded-xl shadow-sm">
            <h2 className="font-serif text-[#1A1A1A] text-lg mb-5 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#C9A84C]" /> Delivery Details
            </h2>
            <div className="space-y-4">
              {!book.deliveryPreference ? (
                <div className="text-sm text-[#999]">No delivery preference selected.</div>
              ) : book.deliveryPreference === "HOME_DELIVERY" ? (
                <div>
                  <div className="text-xs text-[#999] mb-1 font-medium uppercase tracking-wider">Method</div>
                  <div className="text-sm font-medium text-[#1A1A1A] mb-3">Home Delivery</div>
                  <div className="text-xs text-[#999] mb-1 font-medium uppercase tracking-wider">Address</div>
                  <div className="text-sm text-[#1A1A1A] leading-relaxed">
                    {book.deliveryAddressLine1 || book.endUser?.addressLine1 || "Address not provided"}
                    {(book.deliveryAddressLine2 || book.endUser?.addressLine2) && <br/>}
                    {book.deliveryAddressLine2 || book.endUser?.addressLine2}
                    <br/>
                    {[book.deliveryCity || book.endUser?.city, book.deliveryState || book.endUser?.state, book.deliveryPostalCode || book.endUser?.postalCode].filter(Boolean).join(", ")}
                    <br/>
                    {book.deliveryCountry || book.endUser?.country}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-xs text-[#999] mb-1 font-medium uppercase tracking-wider">Method</div>
                  <div className="text-sm font-medium text-[#1A1A1A] mb-3">Deliver Before Departure</div>
                  
                  <div className="grid grid-cols-2 gap-y-3">
                    <div>
                      <div className="text-xs text-[#999] mb-0.5 font-medium uppercase tracking-wider">Date</div>
                      <div className="text-sm font-medium text-[#1A1A1A]">{book.departureDate ? new Date(book.departureDate).toLocaleDateString() : "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#999] mb-0.5 font-medium uppercase tracking-wider">Time</div>
                      <div className="text-sm font-medium text-[#1A1A1A]">{book.departureTime || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#999] mb-0.5 font-medium uppercase tracking-wider">Airport</div>
                      <div className="text-sm font-medium text-[#1A1A1A] uppercase">{book.departureAirport || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#999] mb-0.5 font-medium uppercase tracking-wider">Flight</div>
                      <div className="text-sm font-medium text-[#1A1A1A] uppercase">{book.flightNumber || "N/A"}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 border border-[#EAE6DF] rounded-xl shadow-sm bg-gradient-to-b from-[#FAF9F6] to-white">
            <h2 className="font-serif text-[#1A1A1A] text-lg mb-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#C9A84C]" /> Automation Status
            </h2>
            
            <div className="ml-2">
              <TimelineStep 
                label="Project Created" 
                state="completed" 
              />
              <TimelineStep 
                label="Google Drive Folder" 
                description={
                  book.driveStatus === 'SUCCESS' || book.driveLink 
                    ? "Secure upload folder generated" 
                    : book.driveStatus === 'PROCESSING'
                    ? "Generating secure folder..."
                    : book.driveStatus === 'QUEUED'
                    ? "Queued for generation..."
                    : book.driveStatus === 'FAILED'
                    ? (book.driveError || "Failed to generate folder")
                    : "Not generated yet"
                }
                state={
                  book.driveStatus === 'SUCCESS' || book.driveLink 
                    ? "completed" 
                    : book.driveStatus === 'FAILED'
                    ? "failed"
                    : book.driveStatus === 'PROCESSING' || book.driveStatus === 'QUEUED'
                    ? "active"
                    : "pending"
                } 
              />
              <TimelineStep label="Website upload instructions" description={book.driveLink ? "Ready on this page" : "We’ll show the link here when ready"} state={book.driveLink ? "completed" : book.driveStatus === 'FAILED' ? "failed" : "active"} />
            </div>

            {isFailed && (
              <div className="mt-4 p-4 rounded-lg border border-rose-200 bg-rose-50">
                <p className="text-xs text-rose-600 mb-3">The automation process encountered an error.</p>
                <button
                  onClick={handleRetry}
                  disabled={retrying}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm py-2.5 rounded-md flex items-center justify-center transition-colors"
                >
                  {retrying ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  {retrying ? "Retrying..." : "Retry Automation"}
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Upload Link & Logs */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white p-6 border border-[#EAE6DF] rounded-xl shadow-sm">
            <h2 className="font-serif text-[#1A1A1A] text-lg mb-4 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-[#C9A84C]" /> Document Upload Link
            </h2>
            
            {book.driveLink ? (
              <div className="space-y-4">
                <p className="text-sm text-[#666] leading-relaxed">
                  Your photo upload folder is ready. Please upload your photos to this Google Drive folder to create your picture book.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      readOnly 
                      value={book.driveLink} 
                      className="w-full pl-4 pr-4 h-12 bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] rounded-md outline-none"
                    />
                  </div>
                <div className="flex gap-2">
                    <button 
                      onClick={() => navigator.clipboard.writeText(book.driveLink)}
                      className="flex-1 sm:flex-none border border-[#EAE6DF] hover:bg-[#FAF9F6] active:bg-[#F5F3EC] text-[#1A1A1A] h-12 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Copy className="w-4 h-4 text-[#666]" /> <span className="text-xs sm:text-sm">Copy Link</span>
                    </button>
                    <a 
                      href={book.driveLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none bg-[#1A1A1A] hover:bg-[#333] active:bg-black text-white h-12 px-5 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" /> <span className="text-xs sm:text-sm">Open Folder</span>
                    </a>
                  </div>
                </div>
                
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-dashed border-[#EAE6DF] bg-[#FAF9F6] flex flex-col items-center justify-center text-center">
                <HardDrive className="w-8 h-8 text-[#CCC] mb-3" />
                <p className="text-[#999] text-sm mb-4">{book.driveStatus === 'FAILED' ? "We couldn’t prepare your upload folder yet. Please try again shortly. If the problem continues, our support team can help." : "Your photo upload folder is being prepared. We’ll show the upload link here as soon as it’s ready."}</p>
                {user?.role === "ADMIN" && (
                  <button 
                    onClick={handleCreateDrive}
                    disabled={generatingDrive}
                    className="bg-[#1A1A1A] hover:bg-[#333] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {generatingDrive ? <RefreshCw className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
                    {generatingDrive ? "Generating..." : "Create Drive Link"}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="bg-white p-6 border border-[#EAE6DF] rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-[#1A1A1A] text-lg flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#C9A84C]" /> Communication Log
              </h2>
              {user?.role === "ADMIN" && (
                <button 
                  onClick={() => setShowWaModal(true)}
                  className="bg-[#FAF9F6] border border-[#EAE6DF] hover:bg-gray-50 text-[#1A1A1A] text-sm font-medium px-3 py-1.5 rounded-md transition-colors flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5 text-[#C9A84C]" /> Send Message
                </button>
              )}
            {isEndUser && (
              <div className="mt-6 border-t border-[#EAE6DF] pt-5">
                <h3 className="text-sm font-semibold text-[#1A1A1A]">Want updates on WhatsApp?</h3>
                <p className="text-sm text-[#666] mt-1">WhatsApp notifications are optional. Everything continues here on the website.</p>
                <button onClick={() => { setWaNumber(book.user?.whatsappNumber || ""); setWaLink(""); setShowWaModal(true); }} className="mt-3 bg-[#1A1A1A] text-white px-4 py-2 rounded-md text-sm font-medium">{book.whatsappStatus === 'LINK_GENERATED' ? "View WhatsApp instructions" : "Get updates on WhatsApp"}</button>
              </div>
            )}
            </div>
            
            {whatsappMessages.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-[#EAE6DF] bg-[#FAF9F6] flex flex-col items-center justify-center text-center">
                <Smartphone className="w-8 h-8 text-[#CCC] mb-3" />
                <p className="text-[#999] text-sm">No messages have been logged yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {whatsappMessages.map((msg: any) => (
                  <div key={msg.id} className="p-4 rounded-lg bg-[#FAF9F6] border border-[#EAE6DF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        msg.status === "DELIVERED" || msg.status === "READ" ? "bg-emerald-50 text-emerald-600" :
                        msg.status === "FAILED" ? "bg-rose-50 text-rose-600" :
                        "bg-blue-50 text-blue-600"
                      }`}>
                        {msg.status === "FAILED" ? <XCircle className="w-4 h-4" /> : 
                         msg.status === "DELIVERED" || msg.status === "READ" ? <CheckCircle2 className="w-4 h-4" /> :
                         <Send className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#1A1A1A]">
                          {msg.direction === 'INBOUND' ? 'Received' : 'Sent'}: {msg.status.toLowerCase()}
                        </div>
                        <div className="text-xs text-[#999] flex items-center gap-1.5 mt-0.5">
                          <span>{new Date(msg.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          {msg.attempts > 1 && (
                            <>
                              <span className="opacity-50">•</span>
                              <span>{msg.attempts} attempts</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {msg.body && !msg.errorMessage && (
                      <div className="text-xs text-[#666] max-w-xs break-words">{msg.body}</div>
                    )}
                    {msg.errorMessage && (
                      <div className="text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg max-w-xs break-words border border-rose-100">
                        {msg.errorMessage}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 border border-[#EAE6DF] rounded-xl shadow-sm">
            <h2 className="font-serif text-[#1A1A1A] text-lg mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#C9A84C]" /> Execution History
            </h2>
            
            {(!book.automationJobs || book.automationJobs.length === 0) ? (
              <div className="p-8 rounded-xl border border-dashed border-[#EAE6DF] bg-[#FAF9F6] flex flex-col items-center justify-center text-center">
                <Clock className="w-8 h-8 text-[#CCC] mb-3" />
                <p className="text-[#999] text-sm">No automation jobs logged yet.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {book.automationJobs.map((job: any) => (
                  <div key={job.id} className="p-4 rounded-lg bg-[#FAF9F6] border border-[#EAE6DF] flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          job.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' :
                          job.status === 'FAILED' ? 'bg-rose-50 text-rose-600' :
                          job.status === 'PROCESSING' ? 'bg-[#FAF9F6] border border-[#C9A84C]/20 text-[#C9A84C]' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {job.status === 'FAILED' ? <XCircle className="w-4 h-4" /> : 
                           job.status === 'SUCCESS' ? <CheckCircle2 className="w-4 h-4" /> :
                           job.status === 'PROCESSING' ? <RefreshCw className="w-4 h-4 animate-spin" /> :
                           <Clock className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-[#1A1A1A] capitalize">{job.automationType.replace(/_/g, ' ').toLowerCase()}</div>
                          <div className="text-xs text-[#999] flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{job.jobId || 'N/A'}</span>
                            <span className="opacity-50">•</span>
                            <span>{new Date(job.requestedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                        job.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' :
                        job.status === 'FAILED' ? 'bg-rose-100 text-rose-700' :
                        job.status === 'PROCESSING' ? 'bg-[#C9A84C]/10 text-[#C9A84C]' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {job.status}
                      </div>
                    </div>

                    <div className="pl-11 grid grid-cols-2 gap-x-4 gap-y-2">
                      {job.startedAt && (
                        <div>
                          <div className="text-[10px] uppercase text-[#999] font-medium">Started</div>
                          <div className="text-xs text-[#1A1A1A]">{new Date(job.startedAt).toLocaleTimeString()}</div>
                        </div>
                      )}
                      {job.completedAt && (
                        <div>
                          <div className="text-[10px] uppercase text-[#999] font-medium">Completed</div>
                          <div className="text-xs text-[#1A1A1A]">{new Date(job.completedAt).toLocaleTimeString()}</div>
                        </div>
                      )}
                      {job.durationMs !== null && (
                        <div>
                          <div className="text-[10px] uppercase text-[#999] font-medium">Duration</div>
                          <div className="text-xs text-[#1A1A1A]">{(job.durationMs / 1000).toFixed(2)}s</div>
                        </div>
                      )}
                      {job.attemptNumber > 0 && (
                        <div>
                          <div className="text-[10px] uppercase text-[#999] font-medium">Attempt</div>
                          <div className="text-xs text-[#1A1A1A]">{job.attemptNumber}</div>
                        </div>
                      )}
                    </div>

                    {job.failureReason && (
                      <div className="ml-11 mt-1 text-xs text-rose-700 bg-rose-50 px-3 py-2 rounded-lg break-words border border-rose-100">
                        <span className="font-semibold block mb-1">Failure Reason:</span>
                        {job.failureReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* WhatsApp Message Modal */}
      {showWaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-[#EAE6DF]">
            <div className="flex justify-between items-center p-5 border-b border-[#EAE6DF] bg-[#FAF9F6]">
              <h3 className="font-serif text-xl text-[#1A1A1A] font-semibold flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#C9A84C]" /> Send WhatsApp Message
              </h3>
              <button onClick={() => setShowWaModal(false)} className="text-[#999] hover:text-[#1A1A1A] p-1 rounded-full hover:bg-[#EAE6DF] transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            {isEndUser ? (
              <div className="p-6">
                <p className="text-sm text-[#666] leading-relaxed">
                  We’ll send relevant Picture Book updates on WhatsApp. The website will continue working normally even if you do not send the message.
                </p>
                <ol className="mt-5 space-y-3 text-sm text-[#1A1A1A] list-decimal list-inside">
                  <li>Enter or confirm your WhatsApp number.</li>
                  <li>Click “Continue to WhatsApp”.</li>
                  <li>WhatsApp will open with a pre-filled message.</li>
                  <li>Press “Send” in WhatsApp to start receiving updates.</li>
                </ol>
                {!waLink ? (
                  <>
                    <label className="block text-sm font-medium text-[#1A1A1A] mt-6 mb-2" htmlFor="whatsapp-number">WhatsApp number</label>
                    <input id="whatsapp-number" type="tel" value={waNumber} onChange={(e) => setWaNumber(e.target.value)} placeholder="+1234567890" className="w-full px-4 py-3 rounded-md border border-[#EAE6DF] bg-white text-sm outline-none focus:border-[#C9A84C]" />
                  </>
                ) : (
                  <p className="mt-6 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] p-3 text-sm text-[#666]">Your WhatsApp link is ready. Open WhatsApp and press Send there.</p>
                )}
            <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-[#EAE6DF]">
                  <button type="button" onClick={handleWhatsappDecline} className="px-5 py-2.5 rounded-md text-sm font-medium text-[#666]">Not now</button>
                  {!waLink ? (
                    <button type="button" onClick={handleWhatsappOptIn} disabled={sendingWa || !waNumber.trim()} className="px-5 py-2.5 rounded-md text-sm font-medium bg-[#1A1A1A] text-white disabled:opacity-50">{sendingWa ? "Preparing..." : "Continue"}</button>
                  ) : (
                    <a href={waLink} target="_blank" rel="noopener noreferrer" onClick={() => setShowWaModal(false)} className="px-5 py-2.5 rounded-md text-sm font-medium bg-[#1A1A1A] text-white">Continue to WhatsApp</a>
                  )}
                </div>
              </div>
            ) : (
            <form onSubmit={handleSendWa} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-3">Message Type</label>
                  <div>
                    <button
                      type="button"
                      onClick={() => setWaType("CUSTOM")}
                      className="py-2.5 px-4 rounded-lg border border-[#C9A84C] bg-[#FAF9F6] text-[#C9A84C] text-sm font-medium"
                    >
                      Custom free-form message
                    </button>
                  </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Custom Message Content</label>
                    <textarea 
                      required
                      rows={5}
                      value={customMsg}
                      onChange={(e) => setCustomMsg(e.target.value)}
                      placeholder="Hi Rahul, please upload the remaining 5 photos..."
                      className="w-full px-4 py-3 rounded-lg border border-[#EAE6DF] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none text-sm text-[#1A1A1A] resize-y bg-white"
                    />
                    <p className="text-xs text-[#999] mt-2">
                      This will be sent exactly as typed to {book.user?.whatsappNumber || "the customer"}.
                    </p>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-[#EAE6DF]">
                <button
                  type="button"
                  onClick={() => setShowWaModal(false)}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#666] hover:text-[#1A1A1A] hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingWa || (waType === "CUSTOM" && !customMsg.trim())}
                  className="px-6 py-2.5 rounded-lg text-sm font-medium bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {sendingWa ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sendingWa ? "Queuing..." : "Queue Message"}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
