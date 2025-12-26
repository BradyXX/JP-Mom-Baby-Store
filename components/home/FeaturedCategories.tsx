
'use client';
import Link from 'next/link';
import { SHOP_CATEGORIES } from '@/lib/categories';
import CategoryIcon from '@/components/CategoryIcon';

export default function FeaturedCategories() {
  // Select the 3 specific categories as requested
  // Handles: 'newborn', 'baby-clothing', 'toys'
  const featuredHandles = ['newborn', 'baby-clothing', 'toys'];
  const featuredCats = featuredHandles
    .map(h => SHOP_CATEGORIES.find(c => c.handle === h))
    .filter((c): c is typeof SHOP_CATEGORIES[0] => !!c);

  return (
    <section className="container-base mt-6 md:mt-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {featuredCats.map((cat) => (
          <Link 
            key={cat.id} 
            href={`/collections/${cat.handle}`}
            className="group relative h-32 md:h-40 bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 hover:shadow-md hover:border-primary/20 transition-all flex items-center px-6 md:px-8"
          >
            {/* Background Decor (Subtle Circle) */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-20 group-hover:scale-125 transition-transform duration-500 ${cat.color?.split(' ')[0] || 'bg-gray-200'}`} />
            
            <div className="flex items-center gap-4 relative z-10 w-full">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm ${cat.color || 'bg-white text-gray-600'}`}>
                 <CategoryIcon name={cat.iconName} size={28} />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-800 group-hover:text-primary transition-colors">
                  {cat.name}
                </span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">
                  {cat.subTitle}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
