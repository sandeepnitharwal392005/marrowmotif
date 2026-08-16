import { productsApi } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Tours & Experiences",
  description: "Browse our collection of premium guided travel experiences.",
};

async function getProducts() {
  try {
    const res = await productsApi.list();
    return res.data || [];
  } catch {
    return [];
  }
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <main className="min-h-screen" style={{ background: "var(--color-navy)" }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: "linear-gradient(135deg, #C9A84C, #E4C97E)", color: "#0B1628" }}>W</div>
            <span className="font-semibold text-white">Wanderlust Journeys</span>
          </Link>
          <Link href="/login" className="btn-primary text-sm px-4 py-2">Guide Login</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">All Tours</h1>
          <p className="text-white/50">Discover our curated collection of premium travel experiences</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-32 text-white/30">
            <div className="text-6xl mb-6">🌍</div>
            <p className="text-lg">No tours available — start the API server</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product: any) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="card group overflow-hidden hover:border-white/15 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={product.images?.[0] || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600"}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,22,40,0.8), transparent)" }} />
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: "linear-gradient(135deg, #C9A84C, #E4C97E)", color: "#0B1628" }}>
                    ${Number(product.price).toLocaleString()} {product.currency}
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-xs text-white/40 mb-2">
                    {product.duration && <span>📅 {product.duration}</span>}
                    {product.maxGuests && <span> · 👥 Max {product.maxGuests}</span>}
                  </div>
                  <h2 className="font-semibold text-white mb-2 group-hover:text-yellow-300 transition-colors">
                    {product.title}
                  </h2>
                  <p className="text-white/50 text-sm line-clamp-2 mb-4">{product.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(product.highlights || []).slice(0, 3).map((h: string) => (
                      <span key={h} className="px-2 py-0.5 rounded text-xs bg-white/5 text-white/40 border border-white/5">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
