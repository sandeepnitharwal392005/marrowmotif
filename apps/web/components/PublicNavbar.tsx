"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";

export function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-black/5">
      <nav className="container-pad max-w-7xl mx-auto flex items-center justify-between h-16 sm:h-20">
        {/* Brand */}
        <Link 
          href="/" 
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2.5 text-decoration-none group"
        >
          <span className="font-serif text-xl sm:text-2xl font-semibold text-[#1A1A1A] tracking-tight group-hover:text-[#C9A84C] transition-colors">
            Marrowmotif
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#how-it-works" className="text-sm text-[#4A4A4A] hover:text-[#1A1A1A] transition-colors font-medium">
            How it Works
          </Link>
          <Link href="#products" className="text-sm text-[#4A4A4A] hover:text-[#1A1A1A] transition-colors font-medium">
            Our Books
          </Link>
          <Link href="/products" className="text-sm text-[#4A4A4A] hover:text-[#1A1A1A] transition-colors font-medium">
            Tours & Catalog
          </Link>
          <Link href="/contact" className="text-sm text-[#4A4A4A] hover:text-[#1A1A1A] transition-colors font-medium">
            Contact
          </Link>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link 
            href="/login" 
            className="text-sm font-medium text-[#1A1A1A] hover:text-[#C9A84C] px-3.5 py-2 transition-colors"
          >
            Sign In
          </Link>
          <Link 
            href="/login?register=true" 
            className="btn-primary text-sm px-4 py-2"
          >
            Create Your Book
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <Link 
            href="/login" 
            className="text-xs font-medium text-[#1A1A1A] px-2.5 py-1.5 rounded border border-[#EAE6DF] bg-white active:bg-gray-100 transition-colors"
          >
            Sign In
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="p-2 -mr-1 rounded-lg text-[#1A1A1A] hover:bg-black/5 active:bg-black/10 transition-colors focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer / Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[64px] bottom-0 z-40 bg-[#FAF9F6] border-t border-[#EAE6DF] flex flex-col justify-between p-6 overflow-y-auto animate-fadein">
          <div className="space-y-4 pt-2">
            <Link
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-3.5 border-b border-[#EAE6DF] text-lg font-serif text-[#1A1A1A] active:text-[#C9A84C]"
            >
              <span>How it Works</span>
              <ArrowRight className="w-4 h-4 text-[#999]" />
            </Link>
            <Link
              href="#products"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-3.5 border-b border-[#EAE6DF] text-lg font-serif text-[#1A1A1A] active:text-[#C9A84C]"
            >
              <span>Our Picture Books</span>
              <ArrowRight className="w-4 h-4 text-[#999]" />
            </Link>
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-3.5 border-b border-[#EAE6DF] text-lg font-serif text-[#1A1A1A] active:text-[#C9A84C]"
            >
              <span>Tours & Experiences</span>
              <ArrowRight className="w-4 h-4 text-[#999]" />
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-3.5 border-b border-[#EAE6DF] text-lg font-serif text-[#1A1A1A] active:text-[#C9A84C]"
            >
              <span>Contact Us</span>
              <ArrowRight className="w-4 h-4 text-[#999]" />
            </Link>
          </div>

          <div className="pt-6 pb-safe space-y-3">
            <Link
              href="/login?register=true"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full btn-primary text-center py-3.5 font-medium rounded-md shadow-sm block text-base"
            >
              Create Your Book
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full btn-secondary text-center py-3 font-medium rounded-md block text-base bg-white"
            >
              Sign In to Account
            </Link>
            <div className="text-center pt-2">
              <span className="text-xs text-[#999]">Marrowmotif • Where Memory Meets Craft</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
