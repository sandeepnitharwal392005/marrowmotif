"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { MessageSquare, Mail, Calendar, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";

export default function ContactMessagesPage() {
  const { accessToken, user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  async function loadMessages(currentPage: number) {
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await apiFetch<any>(`/contact?page=${currentPage}&limit=20`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setMessages(response.data || []);
      setMeta(response.meta || null);
    } catch (err: any) {
      toast.error("Failed to load messages", { description: err.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role === "ADMIN") {
      loadMessages(page);
    } else {
      setLoading(false);
    }
  }, [accessToken, user, page]);

  async function markAsRead(id: string) {
    try {
      await apiFetch(`/api/contact/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setMessages(messages.map(m => m.id === id ? { ...m, isRead: true } : m));
      toast.success("Message marked as read");
    } catch (err: any) {
      toast.error("Failed to update message", { description: err.message });
    }
  }

  if (user?.role !== "ADMIN") {
    return (
      <div className="p-10 flex flex-col items-center justify-center text-center">
        <MessageSquare className="w-12 h-12 text-[#999] mb-4" />
        <h2 className="text-xl font-serif text-[#1A1A1A]">Access Denied</h2>
        <p className="text-[#666] text-sm mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-serif text-[#1A1A1A] tracking-tight">Public Inquiries</h1>
        <p className="text-[#666] text-sm mt-1">Review and manage inquiries from the public website.</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center bg-white border border-[#EAE6DF] rounded-xl">
            <div className="w-8 h-8 border-2 border-[#EAE6DF] border-t-[#C9A84C] rounded-full animate-spin mb-4"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-16 text-center text-[#666] bg-white border border-[#EAE6DF] rounded-xl">No messages found.</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`p-6 rounded-xl border transition-colors ${msg.isRead ? 'bg-white border-[#EAE6DF]' : 'bg-[#FAF9F6] border-[#C9A84C]/30 shadow-sm'}`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[#1A1A1A] text-lg">{msg.name}</h3>
                    {!msg.isRead && (
                      <span className="bg-[#C9A84C]/10 text-[#C9A84C] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">New</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#666]">
                    <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5"/> {msg.email}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> {new Date(msg.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                {!msg.isRead && (
                  <button 
                    onClick={() => markAsRead(msg.id)}
                    className="shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 bg-white border border-[#EAE6DF] hover:bg-[#FAF9F6] text-[#1A1A1A] text-xs font-medium rounded-lg transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark Read
                  </button>
                )}
              </div>
              <div className="mt-4 text-sm text-[#333] leading-relaxed whitespace-pre-wrap">
                {msg.message}
              </div>
            </div>
          ))
        )}
        {!loading && messages.length > 0 && (
          <Pagination meta={meta} onPageChange={setPage} />
        )}
      </div>
    </div>
  );
}
