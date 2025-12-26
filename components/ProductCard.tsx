
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/supabase/types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  // Calculate discount
  const discount = product.compare_at_price 
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100) 
    : 0;

  // Hibobi-style: 1:1 image, clean white look, strong price contrast
  return (
    <Link href={`/products/${product.slug}`} className="group block h-full flex flex-col bg-white rounded-lg overflow-hidden">
      
      {/* 1:1 Image Container */}
      <div className="relative aspect-square bg-gray-100 mb-2 overflow-hidden rounded-lg">
        {product.images && product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.title_jp}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No Image</div>
        )}

        {/* Badges */}
        <div className="absolute top-0 left-0 p-1.5 flex flex-col gap-1 w-full items-start">
            {!product.in_stock && (
              <span className="bg-gray-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm backdrop-blur-sm">
                  在庫切れ
              </span>
            )}
            {product.in_stock && discount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                  -{discount}%
              </span>
            )}
        </div>
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col px-0.5">
        {/* Price Row */}
        <div className="flex items-baseline gap-1.5 mb-1 flex-wrap">
            <span className="text-base md:text-lg font-bold text-red-600">
              ¥{product.price.toLocaleString()}
            </span>
            {product.compare_at_price && (
              <span className="text-xs text-gray-400 line-through">
                  ¥{product.compare_at_price.toLocaleString()}
              </span>
            )}
        </div>

        {/* Title (2 lines max) */}
        <h3 className="text-xs md:text-sm text-gray-700 leading-tight line-clamp-2 min-h-[2.5em] group-hover:text-primary transition-colors">
            {product.title_jp}
        </h3>
      </div>
    </Link>
  );
}
