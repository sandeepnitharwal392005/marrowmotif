"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth, AuthProvider } from "@/lib/auth";
import { Home, Users, PlusCircle, Map, Shield, MessageSquare, Settings, LogOut, User as UserIcon, BookOpen, UserPlus, ClipboardList } from "lucide-react";

function DashboardNav() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  let navItems: any[] = [];
  
  if (user?.role === "ADMIN") {
    navItems = [
      { href: "/dashboard", label: "Dashboard", icon: Home },
      { href: "/dashboard/clients", label: "Picture Books", icon: BookOpen },
      { href: "/dashboard/users", label: "Users", icon: Shield },
      { href: "/dashboard/products", label: "Products", icon: Map },
      { href: "/dashboard/contact", label: "Public Inquiries", icon: MessageSquare },
      { href: "/dashboard/incidents", label: "IT Support", icon: Shield },
      { href: "/dashboard/audit", label: "Audit Logs", icon: ClipboardList },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ];
  } else if (user?.role === "GUIDE") {
    navItems = [
      { href: "/dashboard", label: "Dashboard", icon: Home },
      { href: "/dashboard/referrals", label: "My Referrals", icon: Users },
      { href: "/dashboard/referrals/new", label: "Refer Customer", icon: UserPlus },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ];
  } else {
    // Customer (default role)
    navItems = [
      { href: "/dashboard", label: "Dashboard", icon: Home },
      { href: "/dashboard/clients", label: "My Picture Books", icon: BookOpen },
      { href: "/dashboard/clients/new", label: "Create Book", icon: PlusCircle },
      { href: "/dashboard/incidents", label: "IT Support", icon: Shield },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ];
  }

  return (
    <>
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <aside className="hidden lg:flex w-72 shrink-0 min-h-screen border-r border-[#EAE6DF] flex-col bg-white z-20 shadow-sm">
        <div className="p-6 border-b border-[#EAE6DF]">
          <Link href="/" className="flex items-center gap-3">
            <div>
              <div className="text-xl font-semibold text-[#1A1A1A] font-serif tracking-tight">Marrowmotif</div>
              <div className="text-xs text-[#666] font-medium mt-0.5">
                {user?.role === 'ADMIN' ? 'Admin Portal' : user?.role === 'GUIDE' ? 'Guide Portal' : 'User Portal'}
              </div>
            </div>
          </Link>
        </div>

        {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
          <div className="mx-6 mt-6 px-3 py-2 rounded-lg text-xs font-medium border border-amber-200 bg-[#F5F3EC] text-amber-700 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Demo Mode
          </div>
        )}

        <nav className="flex-1 px-4 space-y-1 mt-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-colors group ${
                  isActive 
                    ? "bg-[#FAF9F6] text-[#1A1A1A] font-semibold border border-[#EAE6DF]" 
                    : "text-[#666] hover:text-[#1A1A1A] hover:bg-[#FAF9F6] border border-transparent"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-[#C9A84C]" : "text-[#999] group-hover:text-[#666]"}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-[#EAE6DF]">
          <div className="flex items-center gap-3 px-3 py-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold bg-[#F5F3EC] text-[#1A1A1A] border border-[#EAE6DF]">
              <UserIcon className="w-5 h-5 text-[#666]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[#1A1A1A] truncate">{user?.name}</div>
              <div className="text-xs text-[#999] uppercase tracking-wider mt-0.5">
                {user?.role === 'ADMIN' ? 'Admin' : user?.role === 'GUIDE' ? 'Guide' : 'Customer'}
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-[#999] hover:text-[#1A1A1A] hover:bg-[#F5F3EC] rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top App Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-[#EAE6DF] z-40 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="text-lg font-serif font-semibold text-[#1A1A1A] tracking-tight">Marrowmotif</span>
        </Link>
        <button onClick={handleLogout} className="p-2 text-[#666] hover:text-[#1A1A1A] rounded-full bg-[#F5F3EC]">
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 sm:h-20 bg-white/95 backdrop-blur-xl border-t border-[#EAE6DF] z-40 flex items-center justify-around px-2 sm:px-6 pb-safe shadow-lg">
        {navItems.slice(0, 4).map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive ? "text-[#C9A84C]" : "text-[#999] hover:text-[#666]"
              }`}
            >
              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive ? "fill-gold/10" : ""}`} />
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#EAE6DF] border-t-[#C9A84C] rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>
        <div className="flex min-h-screen bg-[#FAF9F6] text-[#1A1A1A]">
          <DashboardNav />
          {/* Main content wrapper */}
          <main className="flex-1 w-full max-w-full overflow-x-hidden pt-16 pb-20 lg:pt-0 lg:pb-0 h-screen overflow-y-auto">
            {children}
          </main>
        </div>
      </AuthGuard>
    </AuthProvider>
  );
}
