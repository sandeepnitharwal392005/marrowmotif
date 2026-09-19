import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/products", "/contact"],
      disallow: ["/dashboard/", "/login", "/register", "/setup-account", "/verify-otp"],
    },
    sitemap: "https://marrowmotif.vercel.app/sitemap.xml",
  };
}