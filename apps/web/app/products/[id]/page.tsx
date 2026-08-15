import { productsApi } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  try {
    const product = await productsApi.get(id);
    return { title: product.title, description: product.description.slice(0, 160) };
  } catch {
    return { title: "Tour Not Found" };
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  let product: any;

  try {
    product = await productsApi.get(id);
  } catch {
    notFound();
  }

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
          <Link href="/products" className="text-sm text-white/60 hover:text-white transition-colors">
            ← All Tours
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Image gallery */}
        <div className="grid grid-cols-2 gap-3 mb-10 rounded-2xl overflow-hidden h-80">
          <div className="relative">
            <Image
              src={product.images?.[0] || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800"}
              alt={product.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="grid grid-rows-2 gap-3">
            {product.images?.slice(1, 3).map((img: string, i: number) => (
              <div key={i} className="relative">
                <Image src={img} alt={`${product.title} ${i + 2}`} fill className="object-cover" unoptimized />
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{product.title}</h1>
                <div className="flex gap-4 text-sm text-white/50">
                  {product.duration && <span>📅 {product.duration}</span>}
                  {product.maxGuests && <span>👥 Max {product.maxGuests} guests</span>}
                </div>
              </div>
            </div>

            <p className="text-white/70 leading-relaxed mb-8">{product.description}</p>

            {/* Highlights */}
            {product.highlights?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Tour Highlights</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {product.highlights.map((h: string) => (
                    <div key={h} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-yellow-400">✦</span>
                      <span className="text-white/70 text-sm">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Itinerary */}
            {Array.isArray(product.itinerary) && product.itinerary.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-6">Day-by-Day Itinerary</h2>
                <div className="space-y-4">
                  {product.itinerary.map((day: any) => (
                    <div key={day.day} className="flex gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ background: "linear-gradient(135deg, #C9A84C, #E4C97E)", color: "#0B1628" }}>
                        {day.day}
                      </div>
                      <div className="card flex-1 p-4">
                        <h3 className="font-semibold text-white mb-1">{day.title}</h3>
                        <p className="text-white/50 text-sm leading-relaxed">{day.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <div className="text-3xl font-bold text-white mb-1">
                ${Number(product.price).toLocaleString()}
                <span className="text-sm font-normal text-white/40 ml-1">{product.currency} / person</span>
              </div>
              <p className="text-white/40 text-sm mb-6">All-inclusive price</p>
              <Link href="/contact" className="btn-primary w-full mb-3 justify-center">
                Book This Tour
              </Link>
              <Link href="/contact" className="btn-secondary w-full justify-center">
                Ask a Question
              </Link>
              <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                {[
                  { icon: "✓", text: "Expert local guide included" },
                  { icon: "✓", text: "All accommodation included" },
                  { icon: "✓", text: "Small group guaranteed" },
                  { icon: "✓", text: "Free cancellation 30 days" },
                ].map((i) => (
                  <div key={i.text} className="flex items-center gap-3 text-sm text-white/50">
                    <span className="text-emerald-400 font-bold">{i.icon}</span>
                    {i.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
