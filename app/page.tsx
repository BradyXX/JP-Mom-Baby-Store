
import Link from 'next/link';
import { getSettings, listProductsByCollection } from "@/lib/supabase/queries";
import { Product } from '@/lib/supabase/types';
import Newsletter from "@/components/Newsletter";
import { SHOP_CATEGORIES } from "@/lib/categories";
import HomeHero from '@/components/home/HomeHero'; // Updated Component
import CategorySection from '@/components/home/CategorySection';
import CategoryIcon from '@/components/CategoryIcon';
import InfoCards from '@/components/home/InfoCards'; // New Component
import FeaturedCategories from '@/components/home/FeaturedCategories'; // New Component
import { getLineAddFriendLink } from '@/lib/utils/line';

// IMPORTANT: Disable cache to ensure homepage is always fresh
export const revalidate = 0; 

// --- Helpers ---

function sortProductsByDiscount(products: Product[]): Product[] {
  if (!products) return [];
  
  return [...products].sort((a, b) => {
    const priceA = a.price || 0;
    const compareA = a.compare_at_price || 0;
    const discountPctA = compareA > priceA ? (compareA - priceA) / compareA : 0;

    const priceB = b.price || 0;
    const compareB = b.compare_at_price || 0;
    const discountPctB = compareB > priceB ? (compareB - priceB) / compareB : 0;
    
    if (Math.abs(discountPctB - discountPctA) > 0.01) {
      return discountPctB - discountPctA;
    }
    
    const rankA = a.sort_order ?? 9999;
    const rankB = b.sort_order ?? 9999;
    if (rankA !== rankB) return rankA - rankB;

    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return timeB - timeA;
  });
}

function FallbackHome({ message }: { message?: string }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center bg-gray-50 p-8">
      <h2 className="text-xl font-bold text-gray-700 mb-2">MOM & BABY</h2>
      <p className="text-gray-500 text-sm">現在メンテナンス中です。しばらくお待ちください。</p>
      {message && <p className="text-xs text-gray-300 mt-4">{message}</p>}
    </div>
  );
}

// --- Main Page ---

export default async function Home() {
  try {
    // 1. Fetch Global Settings
    const settings = await getSettings();

    // Prepare Slides Data (Safe parsing)
    const slides = (Array.isArray(settings.hero_slides) 
        ? settings.hero_slides 
        : []) as { image_url: string; link?: string; alt?: string }[];

    // Prepare LINE URL (Server-side random selection)
    const rawOas = (Array.isArray(settings.line_oas) ? settings.line_oas : []) as string[];
    // Use a simple random pick. In a real serverless edge case, math.random is fine per request.
    const randomOa = rawOas.length > 0 ? rawOas[Math.floor(Math.random() * rawOas.length)] : null;
    const lineUrl = getLineAddFriendLink(randomOa || null);


    // 2. Parallel Fetching for Floors
    const targetCategories = SHOP_CATEGORIES;

    const sectionsDataPromises = targetCategories.map(async (cat) => {
      try {
        const products = await listProductsByCollection(cat.handle, { 
          limit: 12, 
          inStockOnly: true 
        });
        return {
          category: cat,
          products: sortProductsByDiscount(products)
        };
      } catch (err) {
        console.error(`Error fetching category ${cat.handle}:`, err);
        return { category: cat, products: [] };
      }
    });

    const sectionsData = await Promise.all(sectionsDataPromises);

    return (
      <div className="bg-white pb-16 space-y-2">
        
        {/* 1. Hero Carousel (Rounded, Boxed) */}
        <HomeHero slides={slides} />

        {/* 2. Info Cards (3 Columns, LINE link) */}
        <InfoCards lineUrl={lineUrl} />

        {/* 3. Featured Categories (3 Large Blocks) */}
        <FeaturedCategories />

        {/* 4. Original Category Chips (Quick Nav) - Kept but styled simply */}
        <section className="container-base py-6 border-b border-gray-50 mt-4">
          <div className="flex items-center justify-between mb-3 px-1">
             <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">カテゴリー</h4>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide snap-x">
            {SHOP_CATEGORIES.map((cat) => (
              <Link 
                key={cat.id} 
                href={`/collections/${cat.handle}`}
                className="flex flex-col items-center gap-2 min-w-[72px] snap-start group cursor-pointer"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm border border-gray-100 group-hover:shadow-md group-hover:scale-105 transition-all ${cat.color || 'bg-gray-100 text-gray-600'}`}>
                  <CategoryIcon name={cat.iconName} size={24} strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-bold text-gray-600 text-center leading-tight line-clamp-1 w-full px-1 group-hover:text-primary">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* 5. Product Floors */}
        <div className="space-y-2 md:space-y-4">
          {sectionsData.map((section) => (
             <CategorySection 
               key={section.category.id} 
               category={section.category} 
               products={section.products} 
             />
          ))}
        </div>

        {/* 6. Empty State */}
        {sectionsData.every(s => s.products.length === 0) && (
           <div className="py-20 text-center text-gray-400">
              <p>商品準備中...</p>
           </div>
        )}

        {/* 7. Newsletter */}
        <div className="mt-12">
          <Newsletter />
        </div>
      </div>
    );
  } catch (e: any) {
    console.error("CRITICAL SSR ERROR IN HOME:", e);
    return <FallbackHome message={e.message} />;
  }
}
