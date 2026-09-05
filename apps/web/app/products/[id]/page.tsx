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
    <main className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#EAE6DF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="font-serif text-xl sm:text-2xl font-semibold text-[#1A1A1A] tracking-tight">
              Marrowmotif
            </span>
          </Link>
          <Link href="/products" className="text-xs sm:text-sm font-medium text-[#666] hover:text-[#1A1A1A] transition-colors">
            ← All Tours
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Image gallery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-6 sm:mb-10 rounded-xl sm:rounded-2xl overflow-hidden h-60 sm:h-80 border border-[#EAE6DF]">
          <div className="relative w-full h-full bg-gray-100">
            <Image
              src={product.images?.[0] || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800"}
              alt={product.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="hidden sm:grid grid-rows-2 gap-3">
            {product.images?.slice(1, 3).map((img: string, i: number) => (
              <div key={i} className="relative w-full h-full bg-gray-100">
                <Image src={img} alt={`${product.title} ${i + 2}`} fill className="object-cover" unoptimized />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 items-start">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            <div>
              <h1 className="font-serif text-2xl sm:text-4xl font-normal text-[#1A1A1A] mb-3 leading-tight break-words">
                {product.title}
              </h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs sm:text-sm text-[#666]">
                {product.duration && <span>📅 {product.duration}</span>}
                {product.maxGuests && <span>👥 Max {product.maxGuests} guests</span>}
              </div>
            </div>

            <p className="text-[#4A4A4A] leading-relaxed text-sm sm:text-base font-light">
              {product.description}
            </p>

            {/* Highlights */}
            {product.highlights?.length > 0 && (
              <div className="pt-2">
                <h2 className="font-serif text-lg sm:text-xl font-medium text-[#1A1A1A] mb-4">Tour Highlights</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.highlights.map((h: string) => (
                    <div key={h} className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-[#EAE6DF] shadow-xs">
                      <span className="text-[#C9A84C] text-sm">✦</span>
                      <span className="text-[#4A4A4A] text-xs sm:text-sm">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Itinerary */}
            {Array.isArray(product.itinerary) && product.itinerary.length > 0 && (
              <div className="pt-2">
                <h2 className="font-serif text-lg sm:text-xl font-medium text-[#1A1A1A] mb-6">Day-by-Day Itinerary</h2>
                <div className="space-y-4">
                  {product.itinerary.map((day: any) => (
                    <div key={day.day} className="flex gap-3 sm:gap-4">
                      <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold bg-[#FAF9F6] text-[#1A1A1A] border border-[#EAE6DF]">
                        {day.day}
                      </div>
                      <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#EAE6DF] shadow-xs flex-1">
                        <h3 className="font-serif font-semibold text-[#1A1A1A] mb-1.5 text-base">{day.title}</h3>
                        <p className="text-[#666] text-xs sm:text-sm leading-relaxed font-light">{day.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAE6DF] shadow-sm lg:sticky lg:top-24">
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="font-serif text-3xl sm:text-4xl font-semibold text-[#1A1A1A]">
                  ${Number(product.price).toLocaleString()}
                </span>
                <span className="text-xs text-[#999] font-normal">{product.currency} / person</span>
              </div>
              <p className="text-xs text-[#999] mb-6">Archival album and experience included</p>

              <div className="space-y-3">
                <Link href="/contact" className="btn-primary w-full py-3.5 justify-center text-sm shadow-sm">
                  Inquire About This Tour
                </Link>
                <Link href="/contact" className="btn-secondary w-full py-3 justify-center text-sm bg-white">
                  Ask a Question
                </Link>
              </div>

              <div className="mt-6 pt-6 border-t border-[#EAE6DF] space-y-3">
                {[
                  { icon: "✓", text: "Expert local guide included" },
                  { icon: "✓", text: "Archival memory keepsake book" },
                  { icon: "✓", text: "Small group guaranteed" },
                  { icon: "✓", text: "Free cancellation 30 days" },
                ].map((i) => (
                  <div key={i.text} className="flex items-center gap-2.5 text-xs sm:text-sm text-[#666]">
                    <span className="text-emerald-600 font-bold">{i.icon}</span>
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
