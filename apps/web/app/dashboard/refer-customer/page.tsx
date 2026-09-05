"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { PhoneNumberFields, normalizePhoneNumber } from "@/components/PhoneNumberFields";

export default function ReferCustomerPage() {
  const [formData, setFormData] = useState({
    name: "",
    whatsappCountryCode: "+1",
    whatsappLocalNumber: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  if (user?.role !== "GUIDE") return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { apiFetch } = await import("@/lib/api");
      await apiFetch("/users/referrals", {
        method: "POST",
        body: JSON.stringify({ ...formData, whatsappNumber: normalizePhoneNumber(formData.whatsappCountryCode, formData.whatsappLocalNumber) })
      });
      setSuccess("Referral invitation sent to customer successfully.");
      setFormData({ name: "", whatsappCountryCode: "+1", whatsappLocalNumber: "" });
    } catch (err: any) {
      setError(err.message || "Failed to send referral.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-serif font-semibold text-[#1A1A1A]">Refer a Customer</h1>
      <p className="text-[#666666] text-sm">Send a WhatsApp invitation for your customer to create their Picture Book.</p>
      
      <div className="bg-white border border-[#EAE6DF] rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#4A4A4A] mb-2">Customer Name *</label>
            <input name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-2.5 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none" placeholder="John Doe" />
          </div>
          <PhoneNumberFields label="Customer WhatsApp Number" countryCode={formData.whatsappCountryCode} phoneNumber={formData.whatsappLocalNumber} onCountryCodeChange={(value) => setFormData((previous) => ({ ...previous, whatsappCountryCode: value }))} onPhoneNumberChange={(value) => setFormData((previous) => ({ ...previous, whatsappLocalNumber: value }))} />

          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
          {success && <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg border border-green-100">{success}</div>}

          <div className="flex justify-end gap-3 pt-4 border-t border-[#EAE6DF]">
            <button type="submit" disabled={loading} className="px-4 py-2 bg-[#1A1A1A] text-white text-sm font-medium rounded-md hover:bg-[#333333] transition-colors disabled:opacity-50">
              {loading ? "Sending Invitation..." : "Send Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
