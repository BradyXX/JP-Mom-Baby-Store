
'use client';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Product } from '@/lib/supabase/types';
import ProductCard from '@/components/ProductCard';
import { CategoryDef } from '@/lib/categories';

interface CategorySectionProps {
  category: CategoryDef;
  products: Product[];
}

export default function CategorySection({ category, products }: CategorySectionProps) {
  // Prevent rendering empty sections to keep homepage clean
  if (!products || products.length === 0) return null;

  return (
    <section className="py-6 md:py-8 border-b border-gray-100 last:border-0 bg-white">
      <div className="container-base">
        {/* Header Row */}
        <div className="flex items-end justify-between mb-4 md:mb-6 px-1">
          <div>
            <h3 className="text-lg md:text-2xl font-black text-gray-900 leading-none flex items-center gap-2">
              {category.name}
            </h3>
            {category.subTitle && (
              <p className="text-[10px] md:text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">
                {category.subTitle}
              </p>
            )}
          </div>
          
          <Link 
            href={`/collections/${category.handle}`}
            className="group flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-primary transition-colors bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100"
          >
            すべて見る 
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform"/>
          </Link>
        </div>

        {/* 
           Product Carousel 
           - Horizontal Scroll with Snap
           - Hide Scrollbar
        */}
        <div className="flex overflow-x-auto gap-3 md:gap-5 pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide snap-x snap-mandatory">
          {products.map((product) => (
            <div key={product.id} className="w-[140px] md:w-[200px] flex-shrink-0 snap-start">
              <ProductCard product={product} />
            </div>
          ))}
          
          {/* "See All" Card at the end */}
          <Link 
             href={`/collections/${category.handle}`}
             className="w-[100px] md:w-[160px] flex-shrink-0 snap-start flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-100 text-gray-400 hover:bg-gray-100 hover:text-primary hover:border-primary/30 transition-all group"
          >
             <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform">
                <ChevronRight size={20} />
             </div>
             <span className="text-xs font-bold">もっと見る</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
