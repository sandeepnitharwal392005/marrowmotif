import Link from 'next/link';
import { PublicNavbar } from '@/components/PublicNavbar';
import { ArrowRight, BookOpen, UploadCloud, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Marrowmotif — Where Memory Meets Craft',
  description: 'We create beautiful Picture Books from your travel memories.',
};

const HERO_IMAGE = 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1600&q=85';

const PRODUCTS = [
  {
    id: 'classic-book',
    title: 'The Classic Picture Book',
    description: 'A timeless collection of your favorite moments, elegantly bound in premium linen.',
    price: 95,
    image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80',
  },
  {
    id: 'premium-book',
    title: 'The Premium Picture Book',
    description: 'Our most popular choice. Hardcover, lay-flat pages, and archival-quality paper for stunning color depth.',
    price: 145,
    image: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=800&q=80',
  },
  {
    id: 'deluxe-book',
    title: 'The Deluxe Edition',
    description: 'The ultimate keepsake. Hand-crafted leather binding, embossed title, and premium protective slipcase.',
    price: 210,
    image: 'https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?w=800&q=80',
  },
];

export default function HomePage() {
  return (
    <div className="bg-[#FAF9F6] min-h-screen text-[#1A1A1A] flex flex-col">
      {/* ─── Navbar with Mobile Drawer ─────────────────────────── */}
      <PublicNavbar />

      {/* ─── Hero ────────────────────────────────────────────────── */}
      <section className="marketing-hero flex flex-col items-center justify-center text-center py-12 sm:py-24 px-4 sm:px-6 flex-1">
        <div className="container-pad max-w-3xl animate-fadein">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-black/5 text-[#4A4A4A] mb-6 border border-black/5">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A84C]" />
            <span>Preserve Your Finest Memories</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-normal leading-[1.15] mb-4 sm:mb-6 text-[#1A1A1A] tracking-tight">
            Where Memory <br className="hidden sm:inline" /> Meets Craft.
          </h1>
          <p className="text-base sm:text-xl text-[#4A4A4A] mb-8 sm:mb-10 leading-relaxed font-light max-w-2xl mx-auto">
            We create beautiful, heirloom-quality Picture Books from your travel memories. Because your stories deserve more than a screen.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
            <Link 
              href="/login?register=true" 
              className="btn-primary w-full sm:w-auto text-base px-8 py-3.5 rounded-md shadow-sm flex items-center justify-center gap-2"
            >
              <span>Create Your Book</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="#how-it-works" 
              className="btn-secondary w-full sm:w-auto text-base px-6 py-3.5 rounded-md flex items-center justify-center bg-white/60"
            >
              How it Works
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Storytelling Image ────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 w-full mb-12 sm:mb-20">
        <div className="marketing-image w-full h-[32vh] sm:h-[48vh] min-h-[14rem] sm:min-h-[22rem] relative overflow-hidden rounded-xl sm:rounded-2xl shadow-sm border border-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_IMAGE}
            alt="Artisanal Memory Album"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────────── */}
      <section id="how-it-works" className="container-pad marketing-section max-w-5xl mx-auto py-12 sm:py-24 w-full">
        <div className="marketing-heading text-center mb-10 sm:mb-16">
          <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#1A1A1A] mb-2 sm:mb-3">
            The Journey to Print
          </h2>
          <p className="text-[#666] text-sm sm:text-base max-w-md mx-auto">
            A seamless process from your camera roll to your coffee table.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10">
          {[
            { step: '01', icon: BookOpen, title: 'Request a Book', desc: 'Sign in and create a new Picture Book project. Tell us about your journey.' },
            { step: '02', icon: UploadCloud, title: 'Upload Photos', desc: 'Receive a secure, private upload link. Add your favorite moments straight from your device.' },
            { step: '03', icon: Sparkles, title: 'We Craft', desc: 'Our artisans design, print, and bind your memories into a beautiful, lasting keepsake.' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="p-6 rounded-xl bg-white border border-[#EAE6DF] shadow-xs flex flex-col items-start card-hover">
                <div className="flex items-center justify-between w-full mb-4">
                  <span className="font-serif text-3xl font-bold text-[#C9A84C]">{item.step}</span>
                  <div className="w-9 h-9 rounded-full bg-[#FAF9F6] border border-[#EAE6DF] flex items-center justify-center text-[#666]">
                    <Icon className="w-4 h-4 text-[#C9A84C]" />
                  </div>
                </div>
                <h3 className="font-serif font-semibold text-[#1A1A1A] mb-2 text-lg">{item.title}</h3>
                <p className="text-sm text-[#666] leading-relaxed font-light">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Products ─────────────────────────────────────────────── */}
      <section id="products" className="marketing-section bg-[#F5F3EC] py-12 sm:py-24 border-y border-[#EAE6DF] w-full">
        <div className="container-pad max-w-6xl mx-auto">
          <div className="marketing-heading text-center mb-10 sm:mb-16">
            <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#1A1A1A] mb-2 sm:mb-3">
              Our Picture Books
            </h2>
            <p className="text-[#666] text-sm sm:text-base">
              Crafted with archival materials to last generations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {PRODUCTS.map((product) => (
              <div key={product.id} className="card-hover bg-white rounded-xl overflow-hidden border border-[#EAE6DF] shadow-xs flex flex-col">
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="marketing-card-content p-5 sm:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-baseline justify-between gap-2 mb-1.5">
                      <h3 className="font-serif text-lg sm:text-xl font-medium text-[#1A1A1A]">
                        {product.title}
                      </h3>
                      <div className="text-base font-semibold text-[#C9A84C] shrink-0">
                        ${product.price}
                      </div>
                    </div>
                    <p className="text-sm text-[#666] leading-relaxed font-light mb-4">
                      {product.description}
                    </p>
                  </div>
                  <Link 
                    href="/login?register=true" 
                    className="btn-secondary w-full text-center text-xs py-2.5 rounded-md hover:bg-[#FAF9F6] border-[#EAE6DF]"
                  >
                    Select Edition
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────── */}
      <section className="container-pad marketing-section max-w-4xl mx-auto py-16 sm:py-28 text-center w-full">
        <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#1A1A1A] mb-3 sm:mb-4">
          Preserve your story.
        </h2>
        <p className="text-[#666] text-sm sm:text-base mb-8 max-w-md mx-auto">
          Join Marrowmotif and start building your first heirloom Picture Book today.
        </p>
        <Link 
          href="/login?register=true" 
          className="btn-primary w-full sm:w-auto text-base px-10 py-3.5 rounded-md shadow-sm inline-flex items-center justify-center gap-2"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-[#EAE6DF] py-8 sm:py-12 bg-white mt-auto">
        <div className="container-pad max-w-6xl mx-auto flex flex-col sm:flex-row gap-6 justify-between items-center text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg font-semibold text-[#1A1A1A]">Marrowmotif</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-[#666]">
            <Link href="#how-it-works" className="hover:text-[#1A1A1A] transition-colors py-1">How it Works</Link>
            <Link href="#products" className="hover:text-[#1A1A1A] transition-colors py-1">Our Books</Link>
            <Link href="/products" className="hover:text-[#1A1A1A] transition-colors py-1">Tours</Link>
            <Link href="/contact" className="hover:text-[#1A1A1A] transition-colors py-1">Contact</Link>
            <Link href="/login" className="hover:text-[#1A1A1A] transition-colors py-1">Sign In</Link>
          </div>
          <p className="text-xs text-[#999]">
            © {new Date().getFullYear()} Marrowmotif. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
