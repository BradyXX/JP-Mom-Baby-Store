
import React from 'react';
import Link from 'next/link';
import { getSettings, listProductsByCollection } from "@/lib/supabase/queries";
import { Product } from '@/lib/supabase/types';
import Newsletter from "@/components/Newsletter";
import { SHOP_CATEGORIES } from "@/lib/categories";
import HomeHero from '@/components/home/HomeHero'; 
import CategorySection from '@/components/home/CategorySection';
import InfoCards from '@/components/home/InfoCards'; 
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

    // Prepare Slides Data
    const slides = (Array.isArray(settings.hero_slides) 
        ? settings.hero_slides 
        : []) as { image_url: string; mobile_image_url?: string; link?: string; alt?: string }[];

    // Prepare LINE URL
    const rawOas = (Array.isArray(settings.line_oas) ? settings.line_oas : []) as string[];
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
      <div className="bg-white pb-24 md:pb-16 space-y-2">
        
        {/* 1. Hero Carousel (Desktop/Mobile Adaptive) */}
        <HomeHero slides={slides} />

        {/* 2. Info Cards (Stacked on Mobile, Grid on Desktop) */}
        <InfoCards lineUrl={lineUrl} />

        {/* 3. Product Floors */}
        <div className="space-y-2 md:space-y-4 mt-6">
          {sectionsData.map((section) => (
             <CategorySection 
               key={section.category.id} 
               category={section.category} 
               products={section.products} 
             />
          ))}
        </div>

        {/* 4. Empty State */}
        {sectionsData.every(s => s.products.length === 0) && (
           <div className="py-20 text-center text-gray-400">
              <p>商品準備中...</p>
           </div>
        )}

        {/* 5. Newsletter */}
        <div className="mt-12 mb-8">
          <Newsletter />
        </div>
      </div>
    );
  } catch (e: any) {
    console.error("CRITICAL SSR ERROR IN HOME:", e);
    return <FallbackHome message={e.message} />;
  }
}