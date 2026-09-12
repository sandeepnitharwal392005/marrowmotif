"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { settingsApi } from "@/lib/api";
import { toast } from "sonner";
import { Shield, Save, CheckCircle2, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  const { user, accessToken } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      if (!accessToken) return;
      try {
        if (user?.role === "ADMIN") {
          const data = await settingsApi.get(accessToken);
          setSettings(data);
        }
        if (user?.id) {
          const { apiFetch } = await import('@/lib/api');
          const userData = await apiFetch(`/users/${user.id}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          setProfile(userData);
        }
      } catch (err: any) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [accessToken, user?.id, user?.role]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !settings) return;
    setSaving(true);
    try {
      const updated = await settingsApi.update(accessToken, settings);
      setSettings(updated);
      toast.success("Settings saved successfully");
    } catch (err: any) {
      toast.error("Failed to save settings", { description: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !profile) return;
    setSavingProfile(true);
    try {
      const { apiFetch } = await import('@/lib/api');
      const updated = await apiFetch(`/users/${user?.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          whatsappNumber: profile.whatsappNumber,
          addressLine1: profile.addressLine1,
          addressLine2: profile.addressLine2,
          city: profile.city,
          state: profile.state,
          postalCode: profile.postalCode,
          country: profile.country,
        })
      });
      setProfile(updated);
      toast.success("Profile saved successfully");
    } catch (err: any) {
      toast.error("Failed to save profile", { description: err.message });
    } finally {
      setSavingProfile(false);
    }
  }

  function handleToggle(key: string) {
    setSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));
  }

  if (loading) {
    return (
      <div className="p-16 flex justify-center">
        <div className="w-8 h-8 border-2 border-[#EAE6DF] border-t-[#C9A84C] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-serif text-[#1A1A1A] tracking-tight">Settings</h1>
        <p className="text-[#666666] text-sm mt-1">Manage your account and platform configuration.</p>
      </div>

      <form onSubmit={handleProfileSave} className="bg-white border border-[#EAE6DF] rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="font-serif text-[#1A1A1A] text-xl mb-4">Account Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium text-[#999999] uppercase tracking-wider mb-1">Name</label>
            <input 
              type="text"
              value={profile?.name || ''}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-3 py-2 border border-[#EAE6DF] rounded-md text-sm focus:ring-[#C9A84C] focus:border-[#C9A84C]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#999999] uppercase tracking-wider mb-1">Email <span className="text-[10px] lowercase normal-case text-gray-400">(Read-only)</span></label>
            <input 
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-[#EAE6DF] rounded-md text-sm bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#999999] uppercase tracking-wider mb-1">Phone</label>
            <input 
              type="tel"
              value={profile?.phone || ''}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full px-3 py-2 border border-[#EAE6DF] rounded-md text-sm focus:ring-[#C9A84C] focus:border-[#C9A84C]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#999999] uppercase tracking-wider mb-1">WhatsApp Number</label>
            <input 
              type="tel"
              value={profile?.whatsappNumber || ''}
              onChange={(e) => setProfile({ ...profile, whatsappNumber: e.target.value })}
              className="w-full px-3 py-2 border border-[#EAE6DF] rounded-md text-sm focus:ring-[#C9A84C] focus:border-[#C9A84C]"
            />
          </div>
        </div>

        <h3 className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wider pt-4 border-t border-[#EAE6DF]">Address</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-[#999999] uppercase tracking-wider mb-1">Address Line 1</label>
            <input 
              type="text"
              value={profile?.addressLine1 || ''}
              onChange={(e) => setProfile({ ...profile, addressLine1: e.target.value })}
              className="w-full px-3 py-2 border border-[#EAE6DF] rounded-md text-sm focus:ring-[#C9A84C] focus:border-[#C9A84C]"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-[#999999] uppercase tracking-wider mb-1">Address Line 2</label>
            <input 
              type="text"
              value={profile?.addressLine2 || ''}
              onChange={(e) => setProfile({ ...profile, addressLine2: e.target.value })}
              className="w-full px-3 py-2 border border-[#EAE6DF] rounded-md text-sm focus:ring-[#C9A84C] focus:border-[#C9A84C]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#999999] uppercase tracking-wider mb-1">City</label>
            <input 
              type="text"
              value={profile?.city || ''}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              className="w-full px-3 py-2 border border-[#EAE6DF] rounded-md text-sm focus:ring-[#C9A84C] focus:border-[#C9A84C]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#999999] uppercase tracking-wider mb-1">State/Province</label>
            <input 
              type="text"
              value={profile?.state || ''}
              onChange={(e) => setProfile({ ...profile, state: e.target.value })}
              className="w-full px-3 py-2 border border-[#EAE6DF] rounded-md text-sm focus:ring-[#C9A84C] focus:border-[#C9A84C]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#999999] uppercase tracking-wider mb-1">Postal Code</label>
            <input 
              type="text"
              value={profile?.postalCode || ''}
              onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })}
              className="w-full px-3 py-2 border border-[#EAE6DF] rounded-md text-sm focus:ring-[#C9A84C] focus:border-[#C9A84C]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#999999] uppercase tracking-wider mb-1">Country</label>
            <input 
              type="text"
              value={profile?.country || ''}
              onChange={(e) => setProfile({ ...profile, country: e.target.value })}
              className="w-full px-3 py-2 border border-[#EAE6DF] rounded-md text-sm focus:ring-[#C9A84C] focus:border-[#C9A84C]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={savingProfile}
            className="bg-[#1A1A1A] hover:bg-[#333333] text-white px-6 py-2.5 rounded-md font-medium transition-colors flex items-center justify-center gap-2 min-w-[140px]"
          >
            {savingProfile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {savingProfile ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>

      {user?.role === "ADMIN" && settings && (
        <form onSubmit={handleSave} className="bg-white border border-[#EAE6DF] rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 sm:p-8 border-b border-[#EAE6DF]">
            <h2 className="font-serif text-[#1A1A1A] text-xl mb-1 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#C9A84C]" /> Business Configuration
            </h2>
            <p className="text-[#666666] text-sm">Enable or disable optional platform features globally.</p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[#1A1A1A] font-medium">Home Delivery</div>
                <div className="text-[#666666] text-sm mt-1">Allow customers to choose Home Delivery for their Picture Books.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.homeDelivery} onChange={() => handleToggle('homeDelivery')} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
              </label>
            </div>

            <div className="h-px bg-[#EAE6DF] w-full" />

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[#1A1A1A] font-medium">Before Departure Delivery</div>
                <div className="text-[#666666] text-sm mt-1">Allow customers to provide flight details and receive books before they travel.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.beforeDepartureDelivery} onChange={() => handleToggle('beforeDepartureDelivery')} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
              </label>
            </div>

            <div className="h-px bg-[#EAE6DF] w-full" />

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[#1A1A1A] font-medium">WhatsApp Notifications</div>
                <div className="text-[#666666] text-sm mt-1">Automatically send upload links to customers via WhatsApp.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.whatsappNotifications} onChange={() => handleToggle('whatsappNotifications')} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
              </label>
            </div>
            
            <div className="h-px bg-[#EAE6DF] w-full" />

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[#1A1A1A] font-medium">Google Drive Upload Links</div>
                <div className="text-[#666666] text-sm mt-1">Automatically provision Google Drive folders for new Picture Books.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.googleDriveUpload} onChange={() => handleToggle('googleDriveUpload')} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
              </label>
            </div>

          </div>

          <div className="bg-[#FAF9F6] p-6 sm:px-8 border-t border-[#EAE6DF] flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#1A1A1A] hover:bg-[#333333] text-white px-6 py-2.5 rounded-md font-medium transition-colors flex items-center justify-center gap-2 min-w-[140px]"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
