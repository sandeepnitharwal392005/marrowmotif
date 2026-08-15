"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { pictureBooksApi, settingsApi, apiFetch } from "@/lib/api";
import { ArrowLeft, UserPlus, Phone, Mail, BookOpen, CheckCircle2, Info, HardDrive, MessageSquare } from "lucide-react";

export default function NewPictureBookPage() {
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const isGuide = user?.role === "GUIDE";
  const isEndUser = user?.role === "END_USER";
  const isAdmin = user?.role === "ADMIN";

  // Guide needs to provide customer details. End User just provides book details.
  // Admin provides userId for an existing user.
  const [form, setForm] = useState({ 
    title: "", 
    customerName: "", 
    whatsappNumber: "", 
    email: "",
    deliveryPreference: "HOME_DELIVERY",
    departureDate: "",
    departureTime: "",
    flightNumber: "",
    departureAirport: "",
    userId: "", // For Admin selection
  });
  const [usersList, setUsersList] = useState<any[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [settings, setSettings] = useState<any>({ homeDelivery: true, beforeDepartureDelivery: true });
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      if (!accessToken) return;
      try {
        const data = await settingsApi.get(accessToken);
        setSettings(data);
        if (!data.homeDelivery && data.beforeDepartureDelivery) {
          setForm(f => ({ ...f, deliveryPreference: "BEFORE_DEPARTURE" }));
        } else if (!data.homeDelivery && !data.beforeDepartureDelivery) {
          setForm(f => ({ ...f, deliveryPreference: "" }));
        }
      } catch (err) {
        // Ignored, defaults to true
      } finally {
        setSettingsLoaded(true);
      }
    }
    loadSettings();
  }, [accessToken, isAdmin]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!isAdmin || !accessToken || searchQuery.trim().length < 2) {
      if (searchQuery.trim().length === 0) {
        setUsersList([]);
        setForm(f => ({ ...f, userId: "" }));
      }
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiFetch<any>(`/users/search?q=${encodeURIComponent(searchQuery)}&limit=10`, { 
          headers: { Authorization: `Bearer ${accessToken}` } 
        });
        setUsersList(res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setSearching(false);
      }
    }, 400); // 400ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, accessToken, isAdmin]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setStatus("loading");
    setErrorMessage("");
    
    try {
      const book = await pictureBooksApi.create(accessToken, form);
      setStatus("success");
      setTimeout(() => router.push(`/dashboard/clients/${book.id}`), 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      setStatus("error");
    }
  }

  return (
    <div className="p-6 sm:p-10 max-w-xl mx-auto flex flex-col min-h-[calc(100vh-8rem)] lg:min-h-0">
      <div className="mb-6 sm:mb-8">
        <Link href="/dashboard/clients" className="inline-flex items-center text-[#666] text-sm font-medium hover:text-[#1A1A1A] transition-colors mb-4 group">
          <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" />
          Back to list
        </Link>
        <h1 className="text-3xl font-serif text-[#1A1A1A] tracking-tight">
          {isGuide ? "Refer a Customer" : "Create Picture Book"}
        </h1>
        <p className="text-[#666] text-sm mt-2 leading-relaxed">
          {isAdmin 
            ? "Create a Picture Book project and assign it to an existing customer."
            : isGuide 
              ? "Enter your customer's details to set up their Picture Book project and send them an upload link." 
              : "Give your new Picture Book a title to generate a secure photo upload link."}
        </p>
      </div>

      <div className="bg-white border border-[#EAE6DF] rounded-xl p-6 sm:p-8 flex-1 sm:flex-none flex flex-col shadow-sm">
        {status === "success" ? (
          <div className="flex flex-col items-center justify-center py-12 text-center flex-1">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 border border-emerald-100">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-serif text-[#1A1A1A] mb-2">Project Created!</h2>
            <p className="text-[#666] text-sm mb-6 max-w-[280px]">Redirecting you to the project dashboard...</p>
            <div className="w-6 h-6 border-2 border-[#EAE6DF] border-t-[#C9A84C] rounded-full animate-spin"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col">
            <div className="space-y-5 flex-1">
              
              {/* Common: Book Title */}
              <div>
                <label htmlFor="book-title" className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Picture Book Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <BookOpen className="h-5 w-5 text-[#999]" />
                  </div>
                  <input
                    id="book-title"
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full pl-11 pr-4 py-3 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors"
                    placeholder={isGuide ? "e.g. The Smith Family Vacation" : "e.g. My Trip to Italy"}
                  />
                </div>
              </div>

              {/* Admin Only: Select Existing User */}
              {isAdmin && (
                <>
                  <div className="pt-2 pb-1">
                    <div className="h-px w-full bg-[#EAE6DF]"></div>
                  </div>
                  <div>
                    <label htmlFor="user-search" className="block text-sm font-medium text-[#1A1A1A] mb-2">
                      Assign to Customer <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <UserPlus className="h-5 w-5 text-[#999]" />
                      </div>
                      <input
                        id="user-search"
                        type="text"
                        required={!form.userId}
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setForm(f => ({ ...f, userId: "" })); // Clear selection if typing
                        }}
                        placeholder="Search by name, email, or phone..."
                        className="w-full pl-11 pr-4 py-3 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors"
                      />
                      {searching && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <div className="w-4 h-4 border-2 border-[#EAE6DF] border-t-[#C9A84C] rounded-full animate-spin"></div>
                        </div>
                      )}
                      
                      {/* Search Results Dropdown */}
                      {searchQuery.trim().length >= 2 && !form.userId && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-[#EAE6DF] rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {usersList.length === 0 && !searching ? (
                            <div className="p-3 text-sm text-[#666] text-center">No customers found</div>
                          ) : (
                            <ul className="py-1">
                              {usersList.map(u => (
                                <li 
                                  key={u.id}
                                  onClick={() => {
                                    setForm(f => ({ ...f, userId: u.id }));
                                    setSearchQuery(`${u.name} (${u.email})`);
                                  }}
                                  className="px-4 py-2 hover:bg-[#FAF9F6] cursor-pointer transition-colors"
                                >
                                  <div className="text-sm font-medium text-[#1A1A1A]">{u.name}</div>
                                  <div className="text-xs text-[#666]">{u.email} • {u.phone || 'No phone'}</div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                    {form.userId && (
                      <div className="mt-2 text-xs font-medium text-emerald-600 flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Customer selected successfully
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Guide Only: Customer Details */}
              {isGuide && (
                <>
                  <div className="pt-2 pb-1">
                    <div className="h-px w-full bg-[#EAE6DF]"></div>
                  </div>
                  
                  <div>
                    <label htmlFor="customer-name" className="block text-sm font-medium text-[#1A1A1A] mb-2">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <UserPlus className="h-5 w-5 text-[#999]" />
                      </div>
                      <input
                        id="customer-name"
                        type="text"
                        required
                        value={form.customerName}
                        onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                        className="w-full pl-11 pr-4 py-3 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors"
                        placeholder="Sarah Jenkins"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="customer-whatsapp" className="block text-sm font-medium text-[#1A1A1A] mb-2">
                      WhatsApp Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-[#999]" />
                      </div>
                      <input
                        id="customer-whatsapp"
                        type="tel"
                        required
                        pattern="^\+[1-9]\d{6,14}$"
                        value={form.whatsappNumber}
                        onChange={(e) => setForm((f) => ({ ...f, whatsappNumber: e.target.value }))}
                        className="w-full pl-11 pr-4 py-3 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors"
                        placeholder="+1234567890"
                      />
                    </div>
                    <p className="text-xs text-[#666] mt-2 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-70" />
                      Include country code (e.g. +1 for US/Canada, +44 for UK).
                    </p>
                  </div>

                  <div>
                    <label htmlFor="customer-email" className="block text-sm font-medium text-[#1A1A1A] mb-2">
                      Email Address <span className="text-[#999] font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-[#999]" />
                      </div>
                      <input
                        id="customer-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        className="w-full pl-11 pr-4 py-3 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors"
                        placeholder="sarah@example.com"
                      />
                    </div>
                  </div>
                </>
              )}

              {isEndUser && (
                <>
                  <div className="pt-2 pb-1">
                    <div className="h-px w-full bg-[#EAE6DF]"></div>
                  </div>

                  {(settings.homeDelivery || settings.beforeDepartureDelivery) && (
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] mb-3">
                        Delivery Preference
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {settings.homeDelivery && (
                          <label className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none ${form.deliveryPreference === 'HOME_DELIVERY' ? 'border-[#C9A84C] bg-[#FAF9F6] ring-1 ring-[#C9A84C]' : 'border-[#EAE6DF] bg-white hover:bg-gray-50'}`}>
                            <input type="radio" name="deliveryPreference" value="HOME_DELIVERY" className="sr-only" checked={form.deliveryPreference === 'HOME_DELIVERY'} onChange={() => setForm(f => ({ ...f, deliveryPreference: 'HOME_DELIVERY' }))} />
                            <span className="flex flex-col">
                              <span className="block text-sm font-medium text-[#1A1A1A]">Home Delivery</span>
                              <span className="mt-1 flex items-center text-xs text-[#666]">Deliver to my profile address</span>
                            </span>
                            <CheckCircle2 className={`absolute right-4 top-4 h-5 w-5 ${form.deliveryPreference === 'HOME_DELIVERY' ? 'text-[#C9A84C]' : 'invisible'}`} />
                          </label>
                        )}
                        {settings.beforeDepartureDelivery && (
                          <label className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none ${form.deliveryPreference === 'BEFORE_DEPARTURE' ? 'border-[#C9A84C] bg-[#FAF9F6] ring-1 ring-[#C9A84C]' : 'border-[#EAE6DF] bg-white hover:bg-gray-50'}`}>
                            <input type="radio" name="deliveryPreference" value="BEFORE_DEPARTURE" className="sr-only" checked={form.deliveryPreference === 'BEFORE_DEPARTURE'} onChange={() => setForm(f => ({ ...f, deliveryPreference: 'BEFORE_DEPARTURE' }))} />
                            <span className="flex flex-col">
                              <span className="block text-sm font-medium text-[#1A1A1A]">Deliver Before I Leave</span>
                              <span className="mt-1 flex items-center text-xs text-[#666]">Deliver to hotel/airport before flight</span>
                            </span>
                            <CheckCircle2 className={`absolute right-4 top-4 h-5 w-5 ${form.deliveryPreference === 'BEFORE_DEPARTURE' ? 'text-[#C9A84C]' : 'invisible'}`} />
                          </label>
                        )}
                      </div>
                    </div>
                  )}

                  {form.deliveryPreference === 'BEFORE_DEPARTURE' && (
                    <div className="bg-[#FAF9F6] p-4 rounded-lg border border-[#EAE6DF] space-y-4">
                      <h4 className="text-sm font-medium text-[#1A1A1A]">Departure Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-[#666] mb-1">Departure Date *</label>
                          <input type="date" required value={form.departureDate} onChange={e => setForm(f => ({ ...f, departureDate: e.target.value }))} className="w-full px-3 py-2 rounded-md bg-white border border-[#EAE6DF] text-sm text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#666] mb-1">Time (Optional)</label>
                          <input type="time" value={form.departureTime} onChange={e => setForm(f => ({ ...f, departureTime: e.target.value }))} className="w-full px-3 py-2 rounded-md bg-white border border-[#EAE6DF] text-sm text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#666] mb-1">Flight Number *</label>
                          <input type="text" required placeholder="e.g. 6E-1234" value={form.flightNumber} onChange={e => setForm(f => ({ ...f, flightNumber: e.target.value }))} className="w-full px-3 py-2 rounded-md bg-white border border-[#EAE6DF] text-sm text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#666] mb-1">Airport *</label>
                          <input type="text" required placeholder="e.g. DEL" value={form.departureAirport} onChange={e => setForm(f => ({ ...f, departureAirport: e.target.value }))} className="w-full px-3 py-2 rounded-md bg-white border border-[#EAE6DF] text-sm text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none" />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              
            </div>

            {status === "error" && (
              <div className="p-3 rounded-md bg-red-50 border border-red-100 text-red-600 text-sm">
                {errorMessage}
              </div>
            )}

            <div className="pt-4 sm:pt-6 mt-auto">
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-[#1A1A1A] hover:bg-[#333] text-white py-3.5 rounded-md font-medium transition-colors flex items-center justify-center shadow-sm"
              >
                {status === "loading" ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </span>
                ) : (
                  isAdmin ? "Create & Assign Picture Book" : isGuide ? "Refer Customer & Send Link" : "Create Picture Book"
                )}
              </button>
              
              <div className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-[#666]">
                <HardDrive className="w-3.5 h-3.5 text-[#C9A84C]" /> Secure Drive Folder
                {isGuide && (
                  <>
                    <span className="mx-1 text-[#EAE6DF]">•</span>
                    <MessageSquare className="w-3.5 h-3.5 text-[#10B981]" /> WhatsApp Message
                  </>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
