
import Link from 'next/link';
import Image from 'next/image';
import { Truck, Clock, ShieldCheck, Banknote, ChevronRight } from 'lucide-react';
import { getSettings, listProductsByCollection } from "@/lib/supabase/queries";
import Newsletter from "@/components/Newsletter";
import ProductCard from "@/components/ProductCard";
import { SHOP_CATEGORIES } from "@/lib/categories";

interface HeroSlide {
  image_url: string;
  link?: string;
  alt?: string;
}

// Ensure fresh data for settings
export const revalidate = 0;

export default async function Home() {
  const settings = await getSettings();

  // Fetch data in parallel
  const [bestSellers, newArrivals] = await Promise.all([
    listProductsByCollection('best-sellers', { limit: 8, sort: 'popular' }),
    listProductsByCollection('new-arrivals', { limit: 8, sort: 'new' }),
  ]);

  const slides = (Array.isArray(settings.hero_slides) 
    ? settings.hero_slides 
    : []) as unknown as HeroSlide[];

  const heroImage = slides.length > 0 && slides[0].image_url ? slides[0].image_url : null;

  return (
    <div className="bg-white pb-16 space-y-8 md:space-y-12">
      
      {/* 1. Hero Section (Requirement 1) */}
      <section className="relative w-full">
        {/* 
          Mobile: Aspect Ratio ~4:5 or Square-ish (h-[400px]) 
          Desktop: Wide banner (h-[500px])
          Using aspect-ratio utilities or fixed heights with object-cover 
        */}
        <div className="relative w-full h-[110vw] max-h-[420px] md:h-[500px] md:max-h-[520px] overflow-hidden bg-gray-200">
          {heroImage ? (
            <Image 
              src={heroImage} 
              alt={slides[0]?.alt || 'Hero Image'} 
              fill 
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
          ) : (
            // Fallback Hero
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                <p className="font-bold text-xl">MOM&BABY</p>
                <p className="text-sm">Default Hero Image</p>
            </div>
          )}
          
          {/* Overlay for Text Legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r md:from-black/50 md:via-transparent md:to-transparent flex items-end md:items-center justify-center md:justify-start pb-12 md:pb-0 md:pl-20">
            <div className="text-white text-center md:text-left px-6">
              <h1 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-md leading-tight">
                {settings.banner_text || '赤ちゃんとママの\n毎日を笑顔に'}
              </h1>
              {slides[0]?.link && (
                <Link 
                  href={slides[0].link} 
                  className="inline-block bg-white text-primary px-8 py-3 rounded-full font-bold text-sm md:text-base hover:bg-gray-100 transition-transform transform active:scale-95 shadow-lg"
                >
                  今すぐチェック
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. USP Icons (Requirement 3-B-2) */}
      <section className="container-base">
        <div className="grid grid-cols-4 gap-2 py-4 border-b border-gray-100">
          {[
            { icon: Truck, text: '送料無料', sub: '条件あり' },
            { icon: Clock, text: '最短3日', sub: 'スピード配送' },
            { icon: Banknote, text: '代引対応', sub: '現金払い' },
            { icon: ShieldCheck, text: '返品保証', sub: '安心サポート' },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center gap-1.5">
              <div className="text-primary opacity-80">
                <item.icon size={24} strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] md:text-xs font-bold text-gray-800 leading-tight">{item.text}</span>
                <span className="text-[9px] md:text-[10px] text-gray-500 hidden sm:block">{item.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Category Grid / Chips (Requirement 2 & 3-B-3) */}
      <section className="container-base">
        <h3 className="text-lg font-bold text-gray-800 mb-4 px-1">カテゴリーから探す</h3>
        {/* Mobile: Horizontal Scroll, Desktop: Grid */}
        <div className="flex overflow-x-auto gap-4 pb-4 md:grid md:grid-cols-8 md:gap-6 scrollbar-hide snap-x">
          {SHOP_CATEGORIES.map((cat) => (
            <Link 
              key={cat.id} 
              href={`/collections/${cat.handle}`}
              className="flex flex-col items-center gap-2 min-w-[72px] snap-start group"
            >
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-all ${cat.color || 'bg-gray-100 text-gray-600'}`}>
                {cat.icon && <cat.icon size={24} />}
              </div>
              <span className="text-[10px] md:text-xs font-medium text-gray-700 text-center leading-tight line-clamp-2 w-full px-1">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Best Sellers (Requirement 3-B-4) */}
      {bestSellers.length > 0 && (
        <section className="container-base">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-yellow-400 rounded-full inline-block"></span>
              ベストセラー
            </h2>
            <Link href="/collections/best-sellers" className="text-xs text-gray-500 flex items-center hover:text-primary">
              もっと見る <ChevronRight size={14} />
            </Link>
          </div>
          {/* Horizontal scroll on mobile, Grid on desktop */}
          <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 md:gap-6 scrollbar-hide">
            {bestSellers.map((p) => (
              <div key={p.id} className="w-36 md:w-auto flex-shrink-0">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. New Arrivals (Requirement 3-B-5) */}
      {newArrivals.length > 0 && (
        <section className="container-base">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-green-400 rounded-full inline-block"></span>
              新着アイテム
            </h2>
            <Link href="/collections/new-arrivals" className="text-xs text-gray-500 flex items-center hover:text-primary">
              もっと見る <ChevronRight size={14} />
            </Link>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 md:gap-6 scrollbar-hide">
            {newArrivals.map((p) => (
              <div key={p.id} className="w-36 md:w-auto flex-shrink-0">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Newsletter */}
      <Newsletter />
    </div>
  );
}
