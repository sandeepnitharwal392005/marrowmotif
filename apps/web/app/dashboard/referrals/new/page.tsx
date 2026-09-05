"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { usersApi } from "@/lib/api";
import { ArrowLeft, UserPlus, Mail, CheckCircle2 } from "lucide-react";
import { PhoneNumberFields, normalizePhoneNumber } from "@/components/PhoneNumberFields";

export default function NewReferralPage() {
  const { accessToken } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ 
    customerName: "", 
    whatsappCountryCode: "+1",
    whatsappLocalNumber: "", 
    email: "",
  });
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setStatus("loading");
    setErrorMessage("");
    
    try {
      await usersApi.referCustomer(accessToken, { ...form, whatsappNumber: normalizePhoneNumber(form.whatsappCountryCode, form.whatsappLocalNumber) });
      setStatus("success");
      setTimeout(() => router.push(`/dashboard/referrals`), 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      setStatus("error");
    }
  }

  return (
    <div className="p-6 sm:p-10 max-w-xl mx-auto flex flex-col min-h-[calc(100vh-8rem)] lg:min-h-0">
      <div className="mb-6 sm:mb-8">
        <Link href="/dashboard/referrals" className="inline-flex items-center text-[#666] text-sm font-medium hover:text-[#1A1A1A] transition-colors mb-4 group">
          <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" />
          Back to list
        </Link>
        <h1 className="text-3xl font-serif text-[#1A1A1A] tracking-tight">Refer a Customer</h1>
        <p className="text-[#666] text-sm mt-2 leading-relaxed">
          Enter your customer's details to set up their Picture Book project and send them a registration link.
        </p>
      </div>

      <div className="bg-white border border-[#EAE6DF] rounded-xl p-6 sm:p-8 flex-1 sm:flex-none flex flex-col shadow-sm">
        {status === "success" ? (
          <div className="flex flex-col items-center justify-center py-12 text-center flex-1">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 border border-emerald-100">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-serif text-[#1A1A1A] mb-2">Referral Sent!</h2>
            <p className="text-[#666] text-sm mb-6 max-w-[280px]">Redirecting you back to referrals...</p>
            <div className="w-6 h-6 border-2 border-[#EAE6DF] border-t-[#C9A84C] rounded-full animate-spin"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col">
            <div className="space-y-5 flex-1">
              
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

              <PhoneNumberFields label="WhatsApp Number" countryCode={form.whatsappCountryCode} phoneNumber={form.whatsappLocalNumber} onCountryCodeChange={(value) => setForm((previous) => ({ ...previous, whatsappCountryCode: value }))} onPhoneNumberChange={(value) => setForm((previous) => ({ ...previous, whatsappLocalNumber: value }))} />

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
                  "Refer Customer & Send Link"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}