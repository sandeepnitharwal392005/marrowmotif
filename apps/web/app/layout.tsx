import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: {
    template: "%s | Wanderlust Journeys",
    default: "Wanderlust Journeys — Premium Travel Experiences",
  },
  description:
    "Discover extraordinary travel experiences. Expert-guided tours to the world's most breathtaking destinations.",
  keywords: ["travel", "tours", "adventure", "guided tours"],
};

import { Toaster } from "sonner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">
        <AuthProvider>
          {children}
          <Toaster position="bottom-right" theme="dark" toastOptions={{ className: 'rounded-xl border-white/10 !bg-[#1E293B] !text-white font-medium' }} />
        </AuthProvider>
      </body>
    </html>
  );
}
