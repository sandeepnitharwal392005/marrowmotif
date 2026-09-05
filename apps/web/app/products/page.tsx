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
    <main className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#EAE6DF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="font-serif text-xl sm:text-2xl font-semibold text-[#1A1A1A] tracking-tight">
              Marrowmotif
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-medium text-[#666] hover:text-[#1A1A1A] transition-colors hidden sm:inline">
              Home
            </Link>
            <Link href="/login" className="btn-primary text-xs sm:text-sm px-3.5 sm:px-4 py-2">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <div className="mb-6 sm:mb-10">
          <Link href="/" className="text-xs sm:text-sm text-[#999] hover:text-[#1A1A1A] transition-colors mb-2 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-2xl sm:text-4xl font-serif font-normal text-[#1A1A1A] tracking-tight mb-2">
            Tours & Experiences
          </h1>
          <p className="text-[#666] text-sm sm:text-base">
            Discover our curated collection of premium travel experiences and memory packages.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-24 sm:py-32 bg-white rounded-2xl border border-[#EAE6DF] p-8 shadow-xs">
            <div className="text-5xl mb-4">🌍</div>
            <h3 className="text-lg font-serif font-medium text-[#1A1A1A] mb-1">No tours currently listed</h3>
            <p className="text-sm text-[#666] max-w-sm mx-auto mb-6">
              Check back soon as we curate new luxury travel experiences for our community.
            </p>
            <Link href="/" className="btn-primary text-sm px-6 py-2.5">
              Return Home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {products.map((product: any) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="card-hover bg-white rounded-xl overflow-hidden border border-[#EAE6DF] shadow-xs flex flex-col group transition-all"
              >
                <div className="relative h-48 sm:h-52 overflow-hidden bg-gray-100">
                  <Image
                    src={product.images?.[0] || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600"}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF9F6]/95 text-[#1A1A1A] border border-[#EAE6DF] shadow-xs">
                    ${Number(product.price).toLocaleString()} {product.currency}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-[#666] mb-2 flex items-center gap-2">
                      {product.duration && <span>📅 {product.duration}</span>}
                      {product.maxGuests && <span>· 👥 Max {product.maxGuests}</span>}
                    </div>
                    <h2 className="font-serif font-semibold text-lg text-[#1A1A1A] mb-2 group-hover:text-[#C9A84C] transition-colors leading-snug">
                      {product.title}
                    </h2>
                    <p className="text-[#666] text-sm line-clamp-2 mb-4 leading-relaxed font-light">
                      {product.description}
                    </p>
                  </div>
                  
                  {product.highlights && product.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#EAE6DF]">
                      {(product.highlights || []).slice(0, 3).map((h: string) => (
                        <span key={h} className="px-2 py-0.5 rounded text-[11px] bg-[#FAF9F6] text-[#666] border border-[#EAE6DF]">
                          {h}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
