import Link from 'next/link';

export const metadata = {
  title: 'Marrowotif — Where Memory Meets Craft',
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
    <div style={{ background: '#FAF9F6', minHeight: '100dvh', color: '#1A1A1A' }}>
      {/* ─── Navbar ──────────────────────────────────────────────── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(250, 249, 246, 0.9)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <nav className="container-pad" style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="font-serif" style={{ fontSize: '1.75rem', fontWeight: 600, color: '#1A1A1A', letterSpacing: '-0.02em' }}>Marrowotif</span>
          </Link>

          {/* Desktop nav */}
          <div style={{ display: 'none', gap: '1.5rem', alignItems: 'center' }} className="desktop-nav">
            <Link href="#how-it-works" style={{ color: '#4A4A4A', textDecoration: 'none', fontSize: '0.95rem', transition: 'color 0.2s' }}>How it Works</Link>
            <Link href="#products" style={{ color: '#4A4A4A', textDecoration: 'none', fontSize: '0.95rem', transition: 'color 0.2s' }}>Our Books</Link>
            <Link href="/contact" style={{ color: '#4A4A4A', textDecoration: 'none', fontSize: '0.95rem', transition: 'color 0.2s' }}>Contact</Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/login" className="btn-secondary btn-sm" style={{ borderColor: '#1A1A1A', color: '#1A1A1A', background: 'transparent' }}>
              Sign In
            </Link>
          </div>
        </nav>
      </header>

      {/* ─── Hero ────────────────────────────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center', paddingTop: '6rem', paddingBottom: '6rem' }}>
        <div className="container-pad animate-fadein" style={{ maxWidth: 800 }}>
          <h1 className="font-serif" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 400, lineHeight: 1.1, marginBottom: '1.5rem', color: '#1A1A1A', letterSpacing: '-0.03em' }}>
            Where Memory <br/> Meets Craft.
          </h1>
          <p style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)', color: '#4A4A4A', marginBottom: '2.5rem', lineHeight: 1.6, fontWeight: 300 }}>
            We create beautiful, heirloom-quality Picture Books from your travel memories. Because your stories deserve more than a screen.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <Link href="/login?register=true" className="btn-primary" style={{ fontSize: '1rem', padding: '1rem 2.5rem', background: '#1A1A1A', color: '#FFF', borderRadius: '4px' }}>
              Create Your Book
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Storytelling Image ────────────────────────────────────── */}
      <section style={{ maxWidth: 1440, margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ width: '100%', height: '50vh', position: 'relative', overflow: 'hidden', borderRadius: '8px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_IMAGE}
            alt="Photography"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────────── */}
      <section id="how-it-works" className="container-pad" style={{ maxWidth: 1000, margin: '0 auto', paddingTop: '6rem', paddingBottom: '6rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 className="font-serif" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 400, color: '#1A1A1A', marginBottom: '1rem' }}>
            The Journey to Print
          </h2>
          <p style={{ color: '#4A4A4A', fontSize: '1.1rem' }}>A seamless process from your camera roll to your coffee table.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem' }}>
          {[
            { step: '01', title: 'Request a Book', desc: 'Sign in and create a new Picture Book project. Tell us about your journey.' },
            { step: '02', title: 'Upload Photos', desc: 'Receive a secure, private upload link. Add your favorite moments straight from your device.' },
            { step: '03', title: 'We Craft', desc: 'Our artisans design, print, and bind your memories into a beautiful, lasting keepsake.' },
          ].map((item) => (
            <div key={item.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div className="font-serif" style={{ fontSize: '2.5rem', color: '#C9A84C', marginBottom: '1rem' }}>{item.step}</div>
              <h3 style={{ fontWeight: 500, color: '#1A1A1A', marginBottom: '0.75rem', fontSize: '1.25rem' }}>{item.title}</h3>
              <p style={{ fontSize: '1rem', color: '#666', lineHeight: 1.6, fontWeight: 300 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Products ─────────────────────────────────────────────── */}
      <section id="products" style={{ background: '#F5F3EC', paddingTop: '6rem', paddingBottom: '6rem' }}>
        <div className="container-pad" style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="font-serif" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 400, color: '#1A1A1A', marginBottom: '1rem' }}>
              Our Picture Books
            </h2>
            <p style={{ color: '#666', fontSize: '1.1rem' }}>Crafted with archival materials to last generations.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '2rem' }}>
            {PRODUCTS.map((product) => (
              <div key={product.id} className="card-hover" style={{ background: '#FFF', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image}
                    alt={product.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }}
                    loading="lazy"
                  />
                </div>
                <div style={{ padding: '2rem' }}>
                  <h3 className="font-serif" style={{ fontSize: '1.35rem', fontWeight: 500, color: '#1A1A1A', marginBottom: '0.5rem' }}>
                    {product.title}
                  </h3>
                  <div style={{ fontSize: '1.1rem', color: '#C9A84C', marginBottom: '1rem' }}>
                    ${product.price}
                  </div>
                  <p style={{ fontSize: '0.95rem', color: '#666', lineHeight: 1.6, fontWeight: 300 }}>
                    {product.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────── */}
      <section className="container-pad" style={{ maxWidth: 1280, margin: '0 auto', paddingTop: '8rem', paddingBottom: '8rem', textAlign: 'center' }}>
        <h2 className="font-serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, color: '#1A1A1A', marginBottom: '1.5rem' }}>
          Preserve your story.
        </h2>
        <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '2.5rem', maxWidth: 500, margin: '0 auto 2.5rem' }}>
          Join Marrowotif and start building your first Picture Book today.
        </p>
        <Link href="/login?register=true" className="btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 3rem', background: '#1A1A1A', color: '#FFF', borderRadius: '4px' }}>
          Get Started
        </Link>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(0,0,0,0.05)', padding: '3rem 0', background: '#FFF' }}>
        <div className="container-pad" style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="font-serif" style={{ color: '#1A1A1A', fontWeight: 600, fontSize: '1.25rem' }}>Marrowotif</span>
          </div>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <Link href="#how-it-works" style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem' }}>How it Works</Link>
            <Link href="/contact" style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem' }}>Contact</Link>
            <Link href="/login" style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem' }}>Sign In</Link>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#999' }}>
            © {new Date().getFullYear()} Marrowotif. Where Memory Meets Craft.
          </p>
        </div>
      </footer>

      <style>{`
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
        }
        .card-hover:hover img { transform: scale(1.03); }
        .btn-primary:hover { background: #333 !important; }
        .btn-secondary:hover { background: rgba(0,0,0,0.05) !important; }
      `}</style>
    </div>
  );
}
