"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { pictureBooksApi, apiFetch } from "@/lib/api";
import { ArrowLeft, User, Mail, CheckCircle2, Clock, CheckCircle, Smartphone, HardDrive, RefreshCw, Copy, ExternalLink, XCircle, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { PhoneNumberFields, normalizePhoneNumber } from "@/components/PhoneNumberFields";

import { ErrorState } from "@/components/ui/ErrorState";

const PHONE_COUNTRY_CODES = [
  "1", "20", "27", "30", "31", "32", "33", "34", "36", "39", "40", "41", "43", "44", "45", "46", "47", "48", "49",
  "51", "52", "53", "54", "55", "56", "57", "58", "60", "61", "62", "63", "64", "65", "66", "81", "82", "84", "86", "90", "91", "92", "93", "94", "95", "98",
  "211", "212", "213", "216", "218", "220", "221", "222", "223", "224", "225", "226", "227", "228", "229", "230", "231", "232", "233", "234", "235", "236", "237", "238", "239", "240", "241", "242", "243", "244", "245", "246", "248", "249", "250", "251", "252", "253", "254", "255", "256", "257", "258", "260", "261", "262", "263", "264", "265", "266", "267", "268", "269", "290", "291", "297", "298", "299", "350", "351", "352", "353", "354", "355", "356", "357", "358", "359", "370", "371", "372", "373", "374", "375", "376", "377", "378", "379", "380", "381", "382", "383", "385", "386", "387", "389", "420", "421", "423", "500", "501", "502", "503", "504", "505", "506", "507", "508", "509", "590", "591", "592", "593", "594", "595", "596", "597", "598", "599", "670", "672", "673", "674", "675", "676", "677", "678", "679", "680", "681", "682", "683", "685", "686", "687", "688", "689", "690", "691", "692", "693", "694", "695", "696", "697", "698", "699", "850", "852", "853", "855", "856", "880", "886", "960", "961", "962", "963", "964", "965", "966", "967", "968", "970", "971", "972", "973", "974", "975", "976", "977", "992", "993", "994", "995", "996", "998",
].filter((code) => /^\d+$/.test(code)).sort((a, b) => b.length - a.length);

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
  const [manualDriveLink, setManualDriveLink] = useState("");
  const [savingManualDriveLink, setSavingManualDriveLink] = useState(false);
  const [isEditingDriveLink, setIsEditingDriveLink] = useState(false);
  
  // WhatsApp Modal State
  const [showWaModal, setShowWaModal] = useState(false);
  const [waCountryCode, setWaCountryCode] = useState("+1");
  const [waLocalNumber, setWaLocalNumber] = useState("");
  const [waLink, setWaLink] = useState("");
  const [sendingWa, setSendingWa] = useState(false);
  const waModalInitialized = useRef(false);

  function setWhatsAppFields(value: string) {
    const digits = value.replace(/[^0-9]/g, "");
    const countryCodeDigits = PHONE_COUNTRY_CODES.find((code) => digits.startsWith(code)) || "1";
    const countryCode = `+${countryCodeDigits}`;
    const localNumber = digits.slice(countryCodeDigits.length);
    setWaCountryCode(countryCode);
    setWaLocalNumber(localNumber);
  }

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
    if (searchParams.get("whatsapp") === "1" && book && user?.role === "END_USER" && !waModalInitialized.current) {
      waModalInitialized.current = true;
      void handleWhatsappOptIn();
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

  async function handleSaveManualDriveLink() {
    if (!accessToken || !id || !manualDriveLink.trim()) return;
    setSavingManualDriveLink(true);
    try {
      await pictureBooksApi.setDriveLink(accessToken, id, manualDriveLink.trim());
      toast.success("Manual Drive link saved successfully");
      setManualDriveLink("");
      setIsEditingDriveLink(false);
      await load();
    } catch (err: any) {
      toast.error("Could not save Drive link", { description: err.message });
    } finally {
      setSavingManualDriveLink(false);
    }
  }

  async function handleWhatsappOptIn(numberOverride?: string) {
    if (!accessToken || !id) return;
    setSendingWa(true);
    try {
      const number = numberOverride || normalizePhoneNumber(waCountryCode, waLocalNumber);
      const result = await pictureBooksApi.whatsappOptIn(accessToken, id, number || undefined);
      window.location.assign(result.link);
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

  function handleGetUpdatesClick() {
    void handleWhatsappOptIn();
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
  const isEndUser = user?.role === "END_USER";

  return (
    <div className="p-6 sm:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link href="/dashboard/clients" className="inline-flex items-center text-[#666] text-sm font-medium hover:text-[#1A1A1A] transition-colors mb-4 group">
          <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" />
          Back to list
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#1A1A1A] tracking-tight">{book.title}</h1>
            <p className="text-[#666] text-sm mt-1">
              Created on {new Date(book.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          {user?.role === "ADMIN" ? (
            <div className="flex items-center gap-2">
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
                    ? "Upload folder linked" 
                    : book.driveStatus === 'PROCESSING'
                    ? "Generating secure folder..."
                    : book.driveStatus === 'QUEUED'
                    ? "Queued for generation..."
                    : book.driveStatus === 'FAILED'
                    ? (book.driveError || "Failed to generate folder")
                    : "Awaiting manual Drive link"
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

        {/* Right Column: Upload Link & Logs */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white p-6 border border-[#EAE6DF] rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-[#1A1A1A] text-lg flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-[#C9A84C]" /> Document Upload Link
              </h2>
              {user?.role === "ADMIN" && book.driveLink && !isEditingDriveLink && (
                <button
                  type="button"
                  onClick={() => {
                    setManualDriveLink(book.driveLink || "");
                    setIsEditingDriveLink(true);
                  }}
                  className="text-xs font-medium text-[#C9A84C] hover:text-[#B3933B] transition-colors border border-[#EAE6DF] hover:border-[#C9A84C] px-3 py-1.5 rounded-md"
                >
                  Update link
                </button>
              )}
            </div>
            
            {book.driveLink && !isEditingDriveLink ? (
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
                      className="flex-1 sm:flex-none border border-[#EAE6DF] hover:bg-[#FAF9F6] text-[#1A1A1A] h-12 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Copy className="w-4 h-4" /> <span className="hidden sm:inline">Copy</span>
                    </button>
                    <a 
                      href={book.driveLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none bg-[#1A1A1A] hover:bg-[#333] text-white h-12 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" /> <span className="hidden sm:inline">Open</span>
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
            ) : user?.role === "ADMIN" ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50/70 border border-amber-200">
                  <HardDrive className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-[#1A1A1A]">
                      {book.driveLink ? "Update Google Drive Upload Folder" : "Assign Google Drive Upload Folder"}
                    </div>
                    <p className="text-xs text-[#666] mt-1 leading-relaxed">
                      Automated Drive generation is paused. Please paste a manually created Google Drive folder URL below. Once saved, the customer will see the upload folder link to submit their photos.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#999]">
                    Google Drive Folder URL
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={manualDriveLink}
                      onChange={(e) => setManualDriveLink(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/..."
                      className="flex-1 px-4 py-2.5 rounded-md border border-[#EAE6DF] bg-[#FAF9F6] text-sm text-[#1A1A1A] outline-none focus:border-[#C9A84C] focus:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleSaveManualDriveLink}
                      disabled={savingManualDriveLink || !manualDriveLink.trim()}
                      className="bg-[#1A1A1A] hover:bg-[#333] disabled:opacity-50 text-white px-5 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 shrink-0"
                    >
                      {savingManualDriveLink ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {savingManualDriveLink ? "Saving..." : "Save Drive Link"}
                    </button>
                    {isEditingDriveLink && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingDriveLink(false);
                          setManualDriveLink("");
                        }}
                        className="border border-[#EAE6DF] hover:bg-[#FAF9F6] text-[#666] px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[#999]">
                    Must start with https://drive.google.com/. Saving will set the project status to &ldquo;Upload Pending&rdquo;.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-dashed border-[#EAE6DF] bg-[#FAF9F6] flex flex-col items-center justify-center text-center">
                <HardDrive className="w-8 h-8 text-[#CCC] mb-3" />
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Your photo upload folder is being prepared</h3>
                <p className="text-[#666] text-xs max-w-sm">
                  Our team is setting up your personal Google Drive upload folder. As soon as it is linked, your upload instructions will appear here.
                </p>
              </div>
            )}
          </div>

          {isEndUser && (
            <div className="bg-white p-6 border border-[#EAE6DF] rounded-xl shadow-sm">
              <h2 className="font-serif text-[#1A1A1A] text-lg mb-2 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#C9A84C]" /> Want updates on WhatsApp?
              </h2>
              <p className="text-sm text-[#666] mt-1">WhatsApp notifications are optional. Everything continues here on the website.</p>
                <button onClick={handleGetUpdatesClick} className="mt-3 bg-[#1A1A1A] text-white px-4 py-2 rounded-md text-sm font-medium">
                Get updates on WhatsApp
              </button>
            </div>
          )}

          {user?.role === "ADMIN" && <div className="bg-white p-6 border border-[#EAE6DF] rounded-xl shadow-sm">
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
          </div>}

        </div>
      </div>

      {/* WhatsApp Message Modal */}
      {showWaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-[#EAE6DF]">
            <div className="flex justify-between items-center p-5 border-b border-[#EAE6DF] bg-[#FAF9F6]">
              <h3 className="font-serif text-xl text-[#1A1A1A] font-semibold flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#C9A84C]" /> Get Updates on WhatsApp
              </h3>
              <button onClick={() => setShowWaModal(false)} className="text-[#999] hover:text-[#1A1A1A] p-1 rounded-full hover:bg-[#EAE6DF] transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            {isEndUser && (
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
                    <div className="mt-6">
                      <PhoneNumberFields
                        countryCode={waCountryCode}
                        phoneNumber={waLocalNumber}
                        onCountryCodeChange={setWaCountryCode}
                        onPhoneNumberChange={setWaLocalNumber}
                      />
                    </div>
                  </>
                ) : (
                  <p className="mt-6 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] p-3 text-sm text-[#666]">Your WhatsApp link is ready. Open WhatsApp and press Send there.</p>
                )}
                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-[#EAE6DF]">
                  <button type="button" onClick={handleWhatsappDecline} className="px-5 py-2.5 rounded-md text-sm font-medium text-[#666]">Not now</button>
                  {!waLink ? (
                    <button type="button" onClick={() => handleWhatsappOptIn()} disabled={sendingWa || !waCountryCode || !waLocalNumber} className="px-5 py-2.5 rounded-md text-sm font-medium bg-[#1A1A1A] text-white disabled:opacity-50">{sendingWa ? "Preparing..." : "Continue"}</button>
                  ) : (
                    <a href={waLink} target="_blank" rel="noopener noreferrer" onClick={() => setShowWaModal(false)} className="px-5 py-2.5 rounded-md text-sm font-medium bg-[#1A1A1A] text-white">Continue to WhatsApp</a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
