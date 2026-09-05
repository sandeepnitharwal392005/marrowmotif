"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { apiFetch, pictureBooksApi } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, AlertTriangle } from "lucide-react";

export default function NewIncidentPage() {
  const { accessToken, user } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    pictureBookId: "",
  });

  useEffect(() => {
    if (!accessToken) return;
    // Load End User's picture books so they can attach an incident to a specific book
    pictureBooksApi.list(accessToken)
      .then((res: any) => {
        // PictureBooks list returns { data, meta }
        setBooks(res.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/incidents", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          pictureBookId: formData.pictureBookId || undefined,
        }),
      });
      toast.success("Support ticket created successfully");
      router.push("/dashboard/incidents");
    } catch (err: any) {
      toast.error("Failed to submit ticket", { description: err.message });
      setSubmitting(false);
    }
  };

  if (user?.role === "ADMIN") {
    // Admins usually don't report incidents for themselves, but let's allow it just in case or redirect.
    // We will let them stay.
  }

  return (
    <div className="p-6 sm:p-10 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/incidents" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#666]" />
        </Link>
        <div>
          <h1 className="text-2xl font-serif text-[#1A1A1A] tracking-tight">Report an Issue</h1>
          <p className="text-[#666] text-sm mt-1">Submit a support ticket to our IT team.</p>
        </div>
      </div>

      <div className="bg-white border border-[#EAE6DF] rounded-xl shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                Issue Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Cannot access Google Drive link"
                className="w-full px-4 py-2.5 rounded-lg border border-[#EAE6DF] bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20 focus:border-[#C9A84C] transition-all text-[#1A1A1A]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Please describe the issue in detail..."
                className="w-full px-4 py-2.5 rounded-lg border border-[#EAE6DF] bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20 focus:border-[#C9A84C] transition-all text-[#1A1A1A] resize-y"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#EAE6DF] bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20 focus:border-[#C9A84C] transition-all text-[#1A1A1A]"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              {!loading && books.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                    Related Picture Book (Optional)
                  </label>
                  <select
                    value={formData.pictureBookId}
                    onChange={(e) => setFormData({ ...formData, pictureBookId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#EAE6DF] bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20 focus:border-[#C9A84C] transition-all text-[#1A1A1A]"
                  >
                    <option value="">None</option>
                    {books.map(b => (
                      <option key={b.id} value={b.id}>{b.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end border-t border-[#EAE6DF] gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full sm:w-auto px-5 py-3 sm:py-2.5 text-sm font-medium text-[#666] hover:text-[#1A1A1A] transition-colors border border-[#EAE6DF] rounded-lg bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#333] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Submit Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
