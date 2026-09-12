"use client";

type PhoneNumberFieldsProps = {
  countryCode: string;
  phoneNumber: string;
  onCountryCodeChange: (value: string) => void;
  onPhoneNumberChange: (value: string) => void;
  required?: boolean;
  label?: string;
};

export function PhoneNumberFields({
  countryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
  required = true,
  label = "WhatsApp Number",
}: PhoneNumberFieldsProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">{label} *</label>
      <div className="grid grid-cols-[7rem_1fr] gap-2">
        <input
          type="text"
          inputMode="tel"
          name="whatsappCountryCode"
          aria-label="Country code"
          value={countryCode}
          onChange={(event) => onCountryCodeChange(event.target.value.replace(/[^+0-9]/g, ""))}
          placeholder="+91"
          pattern="^\\+[1-9]\\d{0,3}$"
          required={required}
          className="w-full px-3 py-2.5 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none"
        />
        <input
          type="tel"
          name="whatsappNumber"
          aria-label="Phone number"
          value={phoneNumber}
          onChange={(event) => onPhoneNumberChange(event.target.value.replace(/[^0-9]/g, ""))}
          placeholder="9876543210"
          inputMode="numeric"
          pattern="^[0-9]{6,14}$"
          required={required}
          className="w-full px-3 py-2.5 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none"
        />
      </div>
      <p className="text-xs text-[#666] mt-2">Country code and phone number are stored as one international number.</p>
    </div>
  );
}

export function normalizePhoneNumber(countryCode: string, phoneNumber: string) {
  return `${countryCode.replace(/[^0-9]/g, "")}${phoneNumber.replace(/[^0-9]/g, "")}`;
}
