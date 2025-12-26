
import Link from 'next/link';
import Image from 'next/image';
import { Truck, Clock, ShieldCheck, Banknote } from 'lucide-react';
import { getSettings, listProductsByCollection } from "@/lib/supabase/queries";
import Newsletter from "@/components/Newsletter";
import Carousel from "@/components/Carousel";
import ProductCard from "@/components/ProductCard";

interface HeroSlide {
  image_url: string;
  link?: string;
  alt?: string;
}

// AUDIT FIX: 
// 1. revalidate = 0 ensures we don't serve stale cached hero images.
// 2. Fetch fresh data from DB on every request.
export const revalidate = 0;

export default async function Home() {
  const settings = await getSettings();

  const [bestSellers, newArrivals, toys] = await Promise.all([
    listProductsByCollection('best-sellers', { limit: 8, sort: 'popular' }),
    listProductsByCollection('new-arrivals', { limit: 8, sort: 'new' }),
    listProductsByCollection('toys', { limit: 8 })
  ]);

  // AUDIT FIX: Safely parse hero_slides from Jsonb to Array
  const slides = (Array.isArray(settings.hero_slides) 
    ? settings.hero_slides 
    : []) as unknown as HeroSlide[];

  return (
    <div className="space-y-12 pb-16">
      
      {/* Hero Section */}
      <section className="relative w-full h-[60vh] md:h-[80vh] bg-gray-100 overflow-hidden">
        {slides.length > 0 && slides[0].image_url ? (
          <div className="relative w-full h-full">
            <Image 
              src={slides[0].image_url} 
              alt={slides[0].alt || 'Hero Image'} 
              fill 
              className="object-cover" 
              priority
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-center">
              <div className="px-4 text-white">
                <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg tracking-tight">
                  {settings.banner_text || 'やさしさを、かたちに。'}
                </h1>
                {slides[0].link && (
                  <Link 
                    href={slides[0].link} 
                    className="inline-block bg-white text-primary px-10 py-4 rounded-full font-bold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
                  >
                    今すぐチェック
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Fallback if no hero slides are configured
          <div className="flex items-center justify-center h-full text-center px-4 bg-secondary">
             <div>
                <h1 className="text-3xl md:text-5xl font-bold mb-6 text-gray-800 tracking-tight">
                    {settings.shop_name}
                </h1>
                <Link href="/collections/all" className="btn-primary rounded-full px-8">
                    ショッピングを始める
                </Link>
             </div>
          </div>
        )}
      </section>

      {/* Trust Badges */}
      <section className="container-base">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-b border-gray-100">
          {[
            { icon: Truck, text: '全国送料無料' },
            { icon: Clock, text: '最短3日でお届け' },
            { icon: Banknote, text: '代金引換対応' },
            { icon: ShieldCheck, text: '安心の返品保証' },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center text-center gap-2 p-2">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-primary">
                <item.icon size={20} />
              </div>
              <span className="text-xs font-medium text-gray-700">{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {bestSellers.length > 0 && (
        <Carousel title="Best Sellers" moreLink="/collections/best-sellers">
          {bestSellers.map((p) => (
            <div key={p.id} className="w-40 md:w-56 flex-shrink-0 snap-start">
              <ProductCard product={p} />
            </div>
          ))}
        </Carousel>
      )}

      <Newsletter />
    </div>
  );
}
