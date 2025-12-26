
import Link from 'next/link';
import { getSettings, listProductsByCollection } from "@/lib/supabase/queries";
import { Product } from '@/lib/supabase/types';
import Newsletter from "@/components/Newsletter";
import { SHOP_CATEGORIES, CategoryDef } from "@/lib/categories";
import HomeHero from '@/components/home/HomeHero';
import CategorySection from '@/components/home/CategorySection';

// IMPORTANT: Disable cache to ensure homepage is always fresh with inventory/settings
export const revalidate = 0; 

// Helper: Sort products by Discount amount (desc) -> then Sales (simulated by stock or sort_order) -> then Newest
function sortProductsByDiscount(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const discountA = a.compare_at_price ? (a.compare_at_price - a.price) : 0;
    const discountB = b.compare_at_price ? (b.compare_at_price - b.price) : 0;
    
    // 1. High discount first
    if (discountB !== discountA) return discountB - discountA;
    
    // 2. Then Sort Order (Simulate 'Popularity' or 'Featured')
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;

    // 3. Then Newest
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export default async function Home() {
  const settings = await getSettings();

  // Parallel Fetching: Get products for ALL categories defined in SHOP_CATEGORIES
  // We fetch slightly more (16) to allow for filtering/sorting, then slice to 12
  const sectionsDataPromises = SHOP_CATEGORIES.map(async (cat) => {
    const products = await listProductsByCollection(cat.handle, { 
      limit: 16, // Fetch a bit more to sort
      inStockOnly: true // Only show in-stock items on homepage
    });
    return {
      category: cat,
      products: sortProductsByDiscount(products).slice(0, 12)
    };
  });

  const sectionsData = await Promise.all(sectionsDataPromises);

  return (
    <div className="bg-white pb-16 space-y-2">
      
      {/* 1. Hero Section (Requirement C) */}
      <HomeHero settings={settings} />

      {/* 2. Category Chips (Quick Navigation) - Keeping this for Mobile UX */}
      <section className="container-base py-6">
        <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide snap-x">
          {SHOP_CATEGORIES.map((cat) => (
            <Link 
              key={cat.id} 
              href={`/collections/${cat.handle}`}
              className="flex flex-col items-center gap-2 min-w-[72px] snap-start group cursor-pointer"
            >
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-all ${cat.color || 'bg-gray-100 text-gray-600'}`}>
                {cat.icon && <cat.icon size={24} />}
              </div>
              <span className="text-[10px] md:text-xs font-bold text-gray-600 text-center leading-tight line-clamp-1 w-full px-1">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Multi-Category Sections (Requirement A) */}
      <div className="space-y-4 md:space-y-8">
        {sectionsData.map((section) => (
           <CategorySection 
             key={section.category.id} 
             category={section.category} 
             products={section.products} 
           />
        ))}
      </div>

      {/* 4. Newsletter */}
      <div className="mt-12">
        <Newsletter />
      </div>
    </div>
  );
}
