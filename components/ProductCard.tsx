
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/supabase/types';
import { ImageIcon } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  // Safety check for pricing
  const price = product.price || 0;
  const comparePrice = product.compare_at_price;
  
  // Calculate discount
  const discount = comparePrice && comparePrice > price
    ? Math.round(((comparePrice - price) / comparePrice) * 100) 
    : 0;

  // Safety check for images
  // Must check if images exists, is array, and first item is valid string
  const rawImage = product.images && Array.isArray(product.images) ? product.images[0] : null;
  const hasValidImage = typeof rawImage === 'string' && rawImage.length > 0;

  return (
    <Link href={`/products/${product.slug}`} className="group block h-full flex flex-col bg-white rounded-lg overflow-hidden relative">
      
      {/* 1:1 Image Container */}
      <div className="relative aspect-square bg-gray-100 mb-2 overflow-hidden rounded-lg border border-gray-100/50">
        {hasValidImage ? (
          <Image
            src={rawImage}
            alt={product.title_jp || 'Product'}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50">
             <ImageIcon size={24} className="mb-1 opacity-50"/>
             <span className="text-[10px]">No Image</span>
          </div>
        )}

        {/* Badges (Over Image) */}
        <div className="absolute top-0 left-0 p-1.5 flex flex-col gap-1 w-full items-start z-10">
            {!product.in_stock && (
              <span className="bg-gray-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm backdrop-blur-sm">
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
              ¥{price.toLocaleString()}
            </span>
            {discount > 0 && comparePrice && (
              <span className="text-xs text-gray-400 line-through decoration-gray-300">
                  ¥{comparePrice.toLocaleString()}
              </span>
            )}
        </div>

        {/* Title (2 lines max) */}
        <h3 className="text-xs md:text-sm text-gray-700 leading-tight line-clamp-2 min-h-[2.5em] group-hover:text-primary transition-colors">
            {product.title_jp || 'Untitled Product'}
        </h3>
      </div>
    </Link>
  );
}
