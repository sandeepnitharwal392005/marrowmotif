"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { pictureBooksApi, apiFetch } from "@/lib/api";
import { ArrowLeft, User, Mail, CheckCircle2, Clock, CheckCircle, Smartphone, HardDrive, RefreshCw, Copy, ExternalLink, XCircle, BookOpen } from "lucide-react";
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
  const { accessToken, user } = useAuth();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<any>(null);
  const [retrying, setRetrying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [generatingDrive, setGeneratingDrive] = useState(false);

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

  const isFailed = book.driveStatus === "FAILED";

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

          {user?.role === "ADMIN" && <div className="bg-white p-6 border border-[#EAE6DF] rounded-xl shadow-sm bg-gradient-to-b from-[#FAF9F6] to-white">
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
              <TimelineStep label="Website upload instructions" description={book.driveLink ? "Ready on this page" : "We'll show the link here when ready"} state={book.driveLink ? "completed" : book.driveStatus === 'FAILED' ? "failed" : "active"} />
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
          </div>}

        </div>

        {/* Right Column: Upload Link */}
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
                {user?.role === "ADMIN" && (
                  <div className="mt-4 p-4 rounded-lg border border-amber-200 bg-amber-50">
                    <div className="text-sm font-medium text-[#1A1A1A] mb-2">Prepared WhatsApp message</div>
                    <textarea
                      readOnly
                      rows={3}
                      value={`Your upload link for "${book.title}" is ready:\n${book.driveLink}`}
                      className="w-full px-3 py-2 rounded-md border border-amber-200 bg-white text-sm text-[#1A1A1A] resize-none"
                    />
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(`Your upload link for "${book.title}" is ready:\n${book.driveLink}`).then(() => toast.success("WhatsApp message copied"))}
                      className="mt-2 inline-flex items-center gap-2 border border-[#EAE6DF] bg-white hover:bg-[#FAF9F6] text-[#1A1A1A] px-3 py-2 rounded-md text-sm font-medium"
                    >
                      <Copy className="w-4 h-4" /> Copy message
                    </button>
                  </div>
                )}
                
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-dashed border-[#EAE6DF] bg-[#FAF9F6] flex flex-col items-center justify-center text-center">
                <HardDrive className="w-8 h-8 text-[#CCC] mb-3" />
                <p className="text-[#999] text-sm mb-4">{book.driveStatus === 'FAILED' ? "We couldn't prepare your upload folder yet. Please try again shortly. If the problem continues, our support team can help." : "Your photo upload folder is being prepared. We'll show the upload link here as soon as it's ready."}</p>
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

        </div>
      </div>

    </div>
  );
}
