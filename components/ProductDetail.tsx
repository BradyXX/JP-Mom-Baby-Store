'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { Product } from '@/lib/supabase/types';
import { useCartStore } from '@/store/useCartStore';
import { useUIStore } from '@/store/useUIStore';

interface ProductDetailProps {
  product: Product;
}

interface VariantOption {
  name: string;
  options: string[];
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore();
  const { openCart } = useUIStore();
  
  // Ref for mobile scroll container
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  // Parse Variants
  const variantDef = Array.isArray(product.variants) 
    ? (product.variants as unknown as VariantOption[]) 
    : [];
  
  // State for selections
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    variantDef.forEach(v => {
      if (v.options.length > 0) initial[v.name] = v.options[0];
    });
    return initial;
  });

  const handleAddToCart = () => {
    // Construct variant title ID
    const variantTitle = Object.values(selections).join(' / ');
    const variantId = Object.values(selections).join('-');

    addItem({
      productId: product.id,
      collectionHandles: product.collection_handles || [],
      slug: product.slug,
      title: product.title_jp,
      price: product.price,
      image: product.images[0],
      quantity: quantity,
      maxStock: product.stock_qty,
      variantId: variantDef.length > 0 ? variantId : undefined,
      variantTitle: variantDef.length > 0 ? variantTitle : undefined,
    });
    openCart();
  };

  const handleMobileScroll = () => {
    if (mobileScrollRef.current) {
       const el = mobileScrollRef.current;
       const index = Math.round(el.scrollLeft / el.offsetWidth);
       setSelectedImageIndex(index);
    }
  };

  const discount = product.compare_at_price 
  ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100) 
  : 0;

  return (
    // Added pb-20 to ensure content is not hidden behind fixed bottom bar on mobile
    <div className="grid md:grid-cols-2 gap-8 lg:gap-12 pb-24 md:pb-0">
      
      {/* Image Gallery */}
      <div className="space-y-4">
        
        {/* Mobile: Horizontal Swipe Gallery (Scroll Snap) */}
        <div className="md:hidden relative w-full aspect-square bg-gray-100 overflow-hidden">
          <div 
             ref={mobileScrollRef}
             onScroll={handleMobileScroll}
             className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full h-full"
          >
             {product.images.map((img, i) => (
                <div key={i} className="w-full h-full flex-shrink-0 snap-center relative">
                   <Image
                    src={img}
                    alt={`${product.title_jp} - ${i + 1}`}
                    fill
                    priority={i === 0}
                    className="object-cover"
                   />
                </div>
             ))}
          </div>
          {/* Mobile Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
             {product.images.map((_, i) => (
               <div 
                 key={i} 
                 className={`h-1.5 rounded-full transition-all ${selectedImageIndex === i ? 'bg-primary w-4' : 'bg-black/20 w-1.5'}`} 
               />
             ))}
          </div>
        </div>

        {/* Desktop: Single Main Image */}
        <div className="hidden md:block relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
          {product.images[selectedImageIndex] && (
            <Image
              src={product.images[selectedImageIndex]}
              alt={product.title_jp}
              fill
              priority
              className="object-cover"
            />
          )}
        </div>

        {/* Thumbnail Strip (Both, but synced) */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {product.images.map((img, i) => (
            <button
              key={i}
              onClick={() => {
                setSelectedImageIndex(i);
                // Also scroll mobile view if ref exists
                if(mobileScrollRef.current) {
                  mobileScrollRef.current.scrollTo({ left: i * mobileScrollRef.current.offsetWidth, behavior: 'smooth' });
                }
              }}
              className={`relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden border-2 transition-colors ${
                selectedImageIndex === i ? 'border-primary' : 'border-transparent'
              }`}
            >
              <Image src={img} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Info & Actions */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{product.title_jp}</h1>
        
        {/* Price */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl font-bold">¥{product.price.toLocaleString()}</span>
          {product.compare_at_price && (
            <>
              <span className="text-gray-400 line-through">¥{product.compare_at_price.toLocaleString()}</span>
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                {discount}% OFF
              </span>
            </>
          )}
        </div>

        {product.short_desc_jp && (
          <p className="text-gray-600 text-sm mb-8 leading-relaxed">
            {product.short_desc_jp}
          </p>
        )}

        {/* Variants Selector */}
        {variantDef.map((v) => (
          <div key={v.name} className="mb-6">
            <span className="text-sm font-bold text-gray-800 block mb-2">{v.name}</span>
            <div className="flex flex-wrap gap-2">
              {v.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSelections(prev => ({ ...prev, [v.name]: opt }))}
                  className={`px-4 py-2 text-sm border rounded-md min-w-[3rem] transition-all ${
                    selections[v.name] === opt
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Quantity & Add to Cart */}
        <div className="border-t border-gray-100 pt-6 mt-6">
          {product.in_stock ? (
            <div className="flex gap-4">
              <div className="flex items-center border border-gray-300 rounded-md bg-white">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-gray-50 text-gray-600"
                >
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(product.stock_qty, quantity + 1))}
                  className="p-3 hover:bg-gray-50 text-gray-600"
                >
                  <Plus size={16} />
                </button>
              </div>
              <button 
                onClick={handleAddToCart}
                className="flex-1 btn-primary flex items-center justify-center gap-2 text-base shadow-md active:scale-95 transition-transform"
              >
                <ShoppingBag size={20} />
                カートに入れる
              </button>
            </div>
          ) : (
            <button disabled className="w-full btn-secondary bg-gray-100 text-gray-400 border-none cursor-not-allowed">
              在庫切れ
            </button>
          )}
        </div>

        {/* Shipping Note */}
        <div className="mt-8 p-4 bg-gray-50 rounded text-xs text-gray-600 space-y-2">
          <p>🚚 全国送料無料（10,000円以上）</p>
          <p>💳 代金引換 / クレジットカード対応</p>
          <p>📦 14時までのご注文で当日発送</p>
        </div>
      </div>
    </div>
  );
}