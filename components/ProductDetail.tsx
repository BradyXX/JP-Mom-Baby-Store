'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingBag, Zap, Check } from 'lucide-react';
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
  const router = useRouter();
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

  // Helper to prepare cart item
  const getCartItemPayload = () => {
    const variantTitle = Object.values(selections).join(' / ');
    const variantId = Object.values(selections).join('-');
    return {
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
    };
  };

  const handleAddToCart = () => {
    addItem(getCartItemPayload());
    openCart(); // Just open drawer
  };

  const handleBuyNow = () => {
    addItem(getCartItemPayload());
    router.push('/checkout'); // Direct redirect
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
    <div className="grid md:grid-cols-2 gap-8 lg:gap-12 pb-4 md:pb-0">
      
      {/* Image Gallery */}
      <div className="space-y-4 -mx-4 md:mx-0">
        
        {/* Mobile: Tighter Constraint (max-h-[420px] or 55vh) */}
        <div className="md:hidden relative w-full h-[55vh] max-h-[420px] bg-white border-b border-gray-100">
          <div 
             ref={mobileScrollRef}
             onScroll={handleMobileScroll}
             className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full h-full"
          >
             {product.images.map((img, i) => (
                <div key={i} className="w-full h-full flex-shrink-0 snap-center relative flex items-center justify-center p-4">
                   <Image
                    src={img}
                    alt={`${product.title_jp} - ${i + 1}`}
                    fill
                    priority={i === 0}
                    className="object-contain" 
                   />
                </div>
             ))}
          </div>
          {/* Mobile Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
             {product.images.map((_, i) => (
               <div 
                 key={i} 
                 className={`h-1.5 rounded-full transition-all shadow-sm ${selectedImageIndex === i ? 'bg-gray-800 w-4' : 'bg-gray-300 w-1.5'}`} 
               />
             ))}
          </div>
        </div>

        {/* Desktop: Standard Square */}
        <div className="hidden md:block relative aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
          {product.images[selectedImageIndex] && (
            <Image
              src={product.images[selectedImageIndex]}
              alt={product.title_jp}
              fill
              priority
              className="object-contain p-4"
            />
          )}
        </div>

        {/* Thumbnail Strip (Both, but synced) */}
        <div className="hidden md:flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-4 md:px-0">
          {product.images.map((img, i) => (
            <button
              key={i}
              onClick={() => {
                setSelectedImageIndex(i);
              }}
              className={`relative w-20 h-20 flex-shrink-0 bg-white rounded overflow-hidden border-2 transition-colors ${
                selectedImageIndex === i ? 'border-primary' : 'border-transparent'
              }`}
            >
              <Image src={img} alt="" fill className="object-contain p-1" />
            </button>
          ))}
        </div>
      </div>

      {/* Info & Actions */}
      <div className="px-4 md:px-0">
        {/* Title */}
        <h1 className="text-lg md:text-2xl font-bold text-gray-900 mb-2 leading-snug">{product.title_jp}</h1>
        
        {/* Price Row */}
        <div className="flex items-end gap-3 mb-4 pb-2 border-b border-gray-100 md:border-none">
          <span className="text-2xl font-bold text-red-600 leading-none">¥{product.price.toLocaleString()}</span>
          {product.compare_at_price && (
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-gray-400 line-through text-sm">¥{product.compare_at_price.toLocaleString()}</span>
              <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
                -{discount}%
              </span>
            </div>
          )}
        </div>

        {/* Short Description (Key Selling Points) */}
        {product.short_desc_jp && (
          <div className="bg-gray-50/50 p-3 rounded-md mb-6 border border-gray-100/50">
             <p className="text-gray-700 text-sm leading-relaxed font-medium">
                {product.short_desc_jp}
             </p>
          </div>
        )}

        {/* Variants Selector */}
        {variantDef.map((v) => (
          <div key={v.name} className="mb-5">
            <span className="text-xs font-bold text-gray-500 block mb-2 uppercase tracking-wide">{v.name}</span>
            <div className="flex flex-wrap gap-2">
              {v.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSelections(prev => ({ ...prev, [v.name]: opt }))}
                  className={`px-4 py-2 text-sm border rounded-md min-w-[3rem] transition-all ${
                    selections[v.name] === opt
                      ? 'border-gray-900 bg-gray-900 text-white shadow-md ring-1 ring-gray-900'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Desktop Quantity & Actions */}
        <div className="hidden md:block border-t border-gray-100 pt-6 mt-6">
          {product.in_stock ? (
            <div className="flex flex-col gap-4">
               <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-gray-700">数量</span>
                  <div className="flex items-center border border-gray-300 rounded-md bg-white">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 hover:bg-gray-50 text-gray-600 active:bg-gray-100"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(Math.min(product.stock_qty, quantity + 1))}
                      className="p-2 hover:bg-gray-50 text-gray-600 active:bg-gray-100"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
               </div>
               
               <div className="flex gap-4 mt-2">
                  <button 
                    onClick={handleAddToCart}
                    className="flex-1 btn-secondary border-gray-300 flex items-center justify-center gap-2 py-4"
                  >
                    <ShoppingBag size={20} />
                    カートに入れる
                  </button>
                  <button 
                    onClick={handleBuyNow}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 py-4 shadow-lg hover:shadow-xl transition-shadow bg-red-600 hover:bg-red-700 border-red-600"
                  >
                    <Zap size={20} fill="currentColor" />
                    今すぐ購入
                  </button>
               </div>
            </div>
          ) : (
            <button disabled className="w-full btn-secondary bg-gray-100 text-gray-400 border-none cursor-not-allowed py-4">
              在庫切れ
            </button>
          )}
        </div>

        {/* Mobile Sticky Footer (Replaces standard add to cart) */}
        {product.in_stock ? (
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-3 pb-[calc(env(safe-area-inset-bottom)+12px)] shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
             <div className="flex gap-2 max-w-md mx-auto">
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 bg-white border border-gray-300 text-gray-800 font-bold py-3 rounded-lg text-xs flex flex-col items-center justify-center leading-none gap-1 active:bg-gray-50"
                >
                  <ShoppingBag size={18} />
                  <span>カート</span>
                </button>
                <button 
                  onClick={handleBuyNow}
                  className="flex-[2] bg-red-600 text-white font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform"
                >
                  <span className="text-base">今すぐ購入</span>
                  <Zap size={18} fill="currentColor" />
                </button>
             </div>
          </div>
        ) : (
           <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-100 border-t border-gray-200 p-4 pb-[calc(env(safe-area-inset-bottom)+16px)] text-center text-gray-400 font-bold">
              在庫切れ
           </div>
        )}

        {/* Shipping Note */}
        <div className="mt-6 md:mt-8 p-4 bg-blue-50/50 rounded-lg text-xs text-gray-600 space-y-2 border border-blue-100">
           <div className="flex items-center gap-2">
             <Check size={14} className="text-blue-500" />
             <span>日本国内から最短3日でお届け</span>
           </div>
           <div className="flex items-center gap-2">
             <Check size={14} className="text-blue-500" />
             <span>10,000円以上で送料無料</span>
           </div>
           <div className="flex items-center gap-2">
             <Check size={14} className="text-blue-500" />
             <span>代金引換対応</span>
           </div>
        </div>
      </div>
    </div>
  );
}