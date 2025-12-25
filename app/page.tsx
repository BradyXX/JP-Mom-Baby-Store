import Link from 'next/link';
import Image from 'next/image';
import { Truck, Clock, ShieldCheck, Banknote } from 'lucide-react';
import { getSettings, listProductsByCollection } from "@/lib/supabase/queries";
import Newsletter from "@/components/Newsletter";
import Carousel from "@/components/Carousel";
import ProductCard from "@/components/ProductCard";

// Categories mapping for the scrollable tab list
const HOME_CATEGORIES = [
  { handle: 'best-sellers', label: '人気商品' },
  { handle: 'new-arrivals', label: '新着アイテム' },
  { handle: 'newborn', label: '新生児' },
  { handle: 'baby-clothing', label: 'ベビー服' },
  { handle: 'kids-clothing', label: 'キッズ服' },
  { handle: 'toys', label: 'おもちゃ' },
  { handle: 'maternity', label: 'マタニティ' },
  { handle: 'gift', label: 'ギフト' },
];

export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
  // Fetch Settings
  const settings = await getSettings();

  // Fetch Product Collections for Carousels
  const [bestSellers, newArrivals, toys] = await Promise.all([
    listProductsByCollection('best-sellers', { limit: 8, sort: 'popular' }),
    listProductsByCollection('new-arrivals', { limit: 8, sort: 'new' }),
    listProductsByCollection('toys', { limit: 8 })
  ]);

  // Parse Hero Slides
  const slides = Array.isArray(settings.hero_slides) 
    ? settings.hero_slides as any[] 
    : [];

  return (
    <div className="space-y-12 pb-16">
      
      {/* Hero Section */}
      <section className="relative w-full h-[60vh] md:h-[70vh] bg-gray-100 overflow-hidden">
        {slides.length > 0 ? (
          // Simplified single slide for MVP. Real carousel needs client logic.
          <div className="relative w-full h-full">
            <Image 
              src={slides[0].image_url} 
              alt={slides[0].alt || 'Hero'} 
              fill 
              className="object-cover" 
              priority
            />
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center text-center">
              <div className="px-4 animate-in fade-in-20 slide-in-from-bottom-4 duration-700">
                <h1 className="text-3xl md:text-5xl font-bold mb-6 text-white drop-shadow-md tracking-tight">
                  {settings.banner_text || 'やさしさを、かたちに。'}
                </h1>
                {slides[0].link && (
                  <Link href={slides[0].link} className="bg-white text-primary px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors">
                    詳細を見る
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center px-4 bg-secondary">
             <div>
                <h1 className="text-3xl md:text-5xl font-bold mb-6 text-gray-800 tracking-tight">
                    {settings.shop_name}
                </h1>
                <p className="text-gray-600 mb-8">日本製の安心と安全をお届けします</p>
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

      {/* Category Tabs (Scrollable) */}
      <section className="border-b border-gray-100 sticky top-16 bg-white/95 backdrop-blur z-30">
        <div className="container-base overflow-x-auto scrollbar-hide">
          <div className="flex whitespace-nowrap gap-8 px-2">
            {HOME_CATEGORIES.map((cat) => (
              <Link 
                key={cat.handle} 
                href={`/collections/${cat.handle}`}
                className="py-4 text-sm font-medium text-gray-500 hover:text-primary hover:border-b-2 hover:border-primary transition-all"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Carousels */}
      {bestSellers.length > 0 && (
        <Carousel title="Best Sellers" moreLink="/collections/best-sellers">
          {bestSellers.map((p) => (
            <div key={p.id} className="w-40 md:w-56 flex-shrink-0 snap-start">
              <ProductCard product={p} />
            </div>
          ))}
        </Carousel>
      )}

      {newArrivals.length > 0 && (
        <Carousel title="New Arrivals" moreLink="/collections/new-arrivals">
          {newArrivals.map((p) => (
            <div key={p.id} className="w-40 md:w-56 flex-shrink-0 snap-start">
              <ProductCard product={p} />
            </div>
          ))}
        </Carousel>
      )}

      {toys.length > 0 && (
        <Carousel title="おもちゃ・トイ" moreLink="/collections/toys">
          {toys.map((p) => (
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