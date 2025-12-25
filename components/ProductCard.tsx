import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/supabase/types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  // Calculate discount percentage if compare_at_price exists
  const discount = product.compare_at_price 
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100) 
    : 0;

  return (
    <Link href={`/products/${product.slug}`} className="group block h-full flex flex-col">
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
        {product.images && product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.title_jp}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
            {!product.in_stock && (
            <span className="bg-gray-800 text-white text-[10px] font-medium px-2 py-1 rounded-sm shadow-sm">
                SOLD OUT
            </span>
            )}
            {product.in_stock && discount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-medium px-2 py-1 rounded-sm shadow-sm">
                -{discount}%
            </span>
            )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <h3 className="text-sm text-gray-800 mb-1 leading-snug group-hover:underline decoration-gray-300 underline-offset-4 line-clamp-2">
            {product.title_jp}
        </h3>
        
        <div className="mt-auto flex items-baseline gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-900">
            ¥{product.price.toLocaleString()}
            </span>
            {product.compare_at_price && (
            <span className="text-xs text-gray-400 line-through">
                ¥{product.compare_at_price.toLocaleString()}
            </span>
            )}
        </div>
      </div>
    </Link>
  );
}