
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
  if (products.length === 0) return null;

  return (
    <section className="py-8 border-b border-gray-100 last:border-0">
      <div className="container-base">
        {/* Header Row */}
        <div className="flex items-end justify-between mb-5 px-1">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-none">
              {category.name}
            </h3>
            {category.subTitle && (
              <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-wider">
                {category.subTitle}
              </p>
            )}
          </div>
          
          <Link 
            href={`/collections/${category.handle}`}
            className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-primary transition-colors bg-gray-100 px-3 py-1.5 rounded-full"
          >
            すべて見る <ChevronRight size={14} />
          </Link>
        </div>

        {/* 
           Product Carousel 
           - Mobile: Horizontal Scroll with Snap
           - Desktop: Grid or Scroll (kept scroll for consistency with 'carousel' request)
        */}
        <div className="flex overflow-x-auto gap-3 md:gap-5 pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide snap-x snap-mandatory">
          {products.map((product) => (
            <div key={product.id} className="w-[150px] md:w-[220px] flex-shrink-0 snap-start">
              <ProductCard product={product} />
            </div>
          ))}
          
          {/* "See All" Card at the end */}
          <Link 
             href={`/collections/${category.handle}`}
             className="w-[120px] md:w-[180px] flex-shrink-0 snap-start flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-100 text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors"
          >
             <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm mb-2">
                <ChevronRight size={20} />
             </div>
             <span className="text-xs font-bold">もっと見る</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
