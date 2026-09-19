import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  metadataBase: new URL("https://marrowmotif.vercel.app"),
  title: {
    template: "%s | Marrowmotif",
    default: "Marrowmotif — Where Memory Meets Craft",
  },
  description:
    "Beautiful, heirloom-quality Picture Books crafted from your travel memories. Request yours today.",
  keywords: ["picture books", "memory books", "photo books", "travel memories", "keepsake"],
  openGraph: {
    type: "website",
    siteName: "Marrowmotif",
    title: "Marrowmotif — Where Memory Meets Craft",
    description:
      "Beautiful, heirloom-quality Picture Books crafted from your travel memories.",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Marrowmotif — Where Memory Meets Craft",
    description:
      "Beautiful, heirloom-quality Picture Books crafted from your travel memories.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
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
