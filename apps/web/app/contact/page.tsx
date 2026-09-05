"use client";
import { useState } from "react";
import { contactApi } from "@/lib/api";
import { PublicNavbar } from "@/components/PublicNavbar";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      await contactApi.submit(form);
      setStatus("success");
      setForm({ name: "", email: "", message: "" });
    } catch (err: any) {
      setError(err.message || "Failed to send message. Please try again.");
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen" style={{ background: "#FAF9F6" }}>
      <PublicNavbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Info */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-serif text-[#1A1A1A] mb-4 font-bold tracking-tight">Get In Touch</h1>
            <p className="text-[#666666] text-base sm:text-lg mb-8 sm:mb-10 leading-relaxed">
              Have a question about your Picture Book or need help with a recent order? We're here to help.
            </p>
            <div className="space-y-6">
              {[
                { icon: "✉️", label: "Email", val: "support@marrowmotif.com" },
                { icon: "📞", label: "Phone", val: "+1 (800) 123-4567" },
                { icon: "🕐", label: "Hours", val: "Mon–Fri, 9am–6pm EST" },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#EAE6DF] flex items-center justify-center text-lg shadow-sm">
                    {c.icon}
                  </div>
                  <div>
                    <div className="text-xs text-[#999999] uppercase tracking-widest font-medium mb-0.5">{c.label}</div>
                    <div className="text-[#1A1A1A] font-medium">{c.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="bg-white border border-[#EAE6DF] rounded-xl p-5 sm:p-8 shadow-sm">
            {status === "success" ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 text-3xl">
                  ✓
                </div>
                <h3 className="text-xl font-serif text-[#1A1A1A] mb-2 font-semibold">Message Sent!</h3>
                <p className="text-[#666666] mb-6">We'll get back to you within 24 hours.</p>
                <button
                  onClick={() => setStatus("idle")}
                  className="btn-secondary text-sm"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2" htmlFor="contact-name">
                    Full Name *
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors"
                    placeholder="Sarah Jenkins"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2" htmlFor="contact-email">
                    Email Address *
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors"
                    placeholder="sarah@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2" htmlFor="contact-message">
                    Message *
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    className="w-full px-4 py-3 rounded-md bg-[#FAF9F6] border border-[#EAE6DF] text-[#1A1A1A] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] outline-none transition-colors resize-none"
                    placeholder="How can we help you?"
                  />
                </div>
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full bg-[#1A1A1A] hover:bg-[#333333] text-white py-3 rounded-md font-medium transition-colors mt-2"
                >
                  {status === "loading" ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
