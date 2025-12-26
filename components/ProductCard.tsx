'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/supabase/types';
import { ImageIcon, ShoppingBag, Check } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useUIStore } from '@/store/useUIStore';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { openCart } = useUIStore();
  const [isAdded, setIsAdded] = useState(false);

  // Safety check for pricing
  const price = product.price || 0;
  const comparePrice = product.compare_at_price;
  
  // Calculate discount
  const discount = comparePrice && comparePrice > price
    ? Math.round(((comparePrice - price) / comparePrice) * 100) 
    : 0;

  // Safety check for images
  const rawImage = product.images && Array.isArray(product.images) ? product.images[0] : null;
  const hasValidImage = typeof rawImage === 'string' && rawImage.length > 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();

    addItem({
      productId: product.id,
      collectionHandles: product.collection_handles || [],
      slug: product.slug,
      title: product.title_jp,
      price: product.price,
      image: product.images[0],
      quantity: 1,
      maxStock: product.stock_qty,
      variantId: undefined, 
      variantTitle: undefined,
    });

    setIsAdded(true);
    // Optional: Open cart drawer automatically
    // openCart(); 
    
    // Reset "Added" state after 2 seconds
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <Link href={`/products/${product.slug}`} className="group block h-full flex flex-col bg-white rounded-lg overflow-hidden relative">
      
      {/* Image Container: 4:5 Aspect Ratio for Mobile Appeal */}
      <div className="relative aspect-[4/5] bg-gray-100 mb-2 overflow-hidden rounded-lg border border-gray-100/50">
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
              <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                  -{discount}% OFF
              </span>
            )}
        </div>

        {/* Quick Add Button (Mobile/Desktop) */}
        {product.in_stock && (
          <button
            onClick={handleQuickAdd}
            className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all z-20 active:scale-95 ${
              isAdded ? 'bg-green-500 text-white' : 'bg-white text-gray-800 hover:bg-primary hover:text-white'
            }`}
            title="カートに追加"
          >
            {isAdded ? <Check size={16} /> : <ShoppingBag size={16} />}
          </button>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col px-0.5 pb-2">
        {/* Title (2 lines max) */}
        <h3 className="text-xs md:text-sm text-gray-800 font-medium leading-[1.4] line-clamp-2 min-h-[2.8em] mb-1.5 group-hover:text-primary transition-colors">
            {product.title_jp || 'Untitled Product'}
        </h3>

        {/* Price Row */}
        <div className="mt-auto flex items-baseline gap-2 flex-wrap">
            <span className="text-sm md:text-base font-bold text-gray-900">
              ¥{price.toLocaleString()}
            </span>
            {comparePrice && comparePrice > price && (
              <span className="text-[10px] md:text-xs text-gray-400 line-through decoration-gray-300">
                  ¥{comparePrice.toLocaleString()}
              </span>
            )}
        </div>
      </div>
    </Link>
  );
}