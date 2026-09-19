import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact Marrowmotif about Picture Books, orders, and customer support.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    url: "https://marrowmotif.vercel.app/contact",
    title: "Contact Us | Marrowmotif",
    description: "Contact Marrowmotif about Picture Books, orders, and customer support.",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}