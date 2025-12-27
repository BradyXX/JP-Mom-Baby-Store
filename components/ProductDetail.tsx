
'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingBag, Zap, Check, Truck, ShieldCheck, RotateCcw, Clock, Wallet, Flame, ImageIcon } from 'lucide-react';
import { Product, ProductVariant } from '@/lib/supabase/types';
import { useCartStore } from '@/store/useCartStore';
import { useUIStore } from '@/store/useUIStore';

interface ProductDetailProps {
  product: Product;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const router = useRouter();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore();
  const { openCart } = useUIStore();
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  // --- Variants Logic ---
  
  // 1. Ensure variants is an array
  const variants = (Array.isArray(product.variants) ? product.variants : []) as ProductVariant[];
  
  // 2. Select default variant (first one)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants.length > 0 ? variants[0] : null
  );

  // 3. Extract unique option keys (e.g., ["Size", "Color"])
  const optionKeys = Array.from(new Set(variants.flatMap(v => Object.keys(v.options || {}))));

  // 4. Handle Option Selection
  // When user clicks a chip (e.g. Size: M), find the matching variant
  const handleOptionSelect = (key: string, value: string) => {
    if (!selectedVariant) return;
    
    // Construct new desired options
    const currentOptions = { ...selectedVariant.options, [key]: value };
    
    // Find exact match
    const exactMatch = variants.find(v => {
       return Object.entries(currentOptions).every(([k, val]) => v.options[k] === val);
    });

    if (exactMatch) {
      setSelectedVariant(exactMatch);
      // Optional: Auto switch image if variant has one
      // if (exactMatch.image) setSelectedImageIndex(0); // We handle this via render logic now
    }
  };

  // --- Derived State ---
  
  // Display Image: Prefer Variant Image -> Then Gallery Index
  // If selectedVariant has an image, we override the gallery display OR treat it as a special "Index -1"
  // For simplicity, if variant has image, we show it. Otherwise show gallery[index].
  const variantImage = selectedVariant?.image;
  
  // Price: Always use parent price (per requirements)
  const displayPrice = product.price;
  const displayComparePrice = product.compare_at_price;
  
  // Stock: Dependent on variant
  const currentStockQty = selectedVariant ? selectedVariant.stock_qty : product.stock_qty;
  const isOutOfStock = selectedVariant ? !selectedVariant.in_stock : !product.in_stock;

  const discount = displayComparePrice 
  ? Math.round(((displayComparePrice - displayPrice) / displayComparePrice) * 100) 
  : 0;

  const shortDescription = product.short_desc_jp || product.description;

  // Cart Logic
  const getCartItemPayload = () => {
    // Generate Variant Title (e.g. "Size: M / Color: Red")
    const variantTitle = selectedVariant 
      ? Object.entries(selectedVariant.options).map(([k, v]) => `${v}`).join(' / ')
      : undefined;
      
    const variantId = selectedVariant?.sku;
    
    // Image: Use variant image if exists, else first gallery image
    const finalImage = variantImage || (product.images && product.images[0]) || '';

    return {
      productId: product.id,
      collectionHandles: product.collection_handles || [],
      slug: product.slug,
      title: product.title_jp,
      price: displayPrice,
      image: finalImage,
      quantity: quantity,
      maxStock: currentStockQty,
      variantId: variantId,
      variantTitle: variantTitle,
    };
  };

  const handleAddToCart = () => {
    addItem(getCartItemPayload());
    openCart(); 
  };

  const handleBuyNow = () => {
    addItem(getCartItemPayload());
    router.push('/checkout');
  };

  const handleMobileScroll = () => {
    if (mobileScrollRef.current) {
       const el = mobileScrollRef.current;
       const index = Math.round(el.scrollLeft / el.offsetWidth);
       setSelectedImageIndex(index);
    }
  };

  // Helper to render image safe
  const renderSafeImage = (src: string, alt: string, priority = false) => {
    const isValid = typeof src === 'string' && (src.startsWith('http') || src.startsWith('/'));
    const isInternal = isValid && src.includes('supabase.co');

    if (!isValid) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-300">
           <ImageIcon size={32} />
           <span className="text-xs mt-1">No Image</span>
        </div>
      );
    }
    return (
      <Image src={src} alt={alt} fill priority={priority} className="object-contain" unoptimized={!isInternal} />
    );
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 lg:gap-12 pb-4 md:pb-0">
      
      {/* Image Gallery */}
      <div className="space-y-4 -mx-4 md:mx-0">
        
        {/* Mobile: 1:1 Square */}
        <div className="md:hidden relative w-full aspect-square bg-white border-b border-gray-100">
          {/* Main Display Area (Mobile) */}
          <div className="w-full h-full relative">
             {/* If variant has specific image, prioritize showing it without carousel complexity, OR merge it.
                 Here: If variant has image, show it. Else show carousel.
             */}
             {variantImage ? (
                renderSafeImage(variantImage, product.title_jp, true)
             ) : (
               <div 
                  ref={mobileScrollRef}
                  onScroll={handleMobileScroll}
                  className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full h-full"
               >
                  {(product.images && product.images.length > 0) ? product.images.map((img, i) => (
                     <div key={i} className="w-full h-full flex-shrink-0 snap-center relative flex items-center justify-center p-4">
                        {renderSafeImage(img, `${product.title_jp} - ${i + 1}`, i === 0)}
                     </div>
                  )) : (
                     <div className="w-full h-full flex items-center justify-center">
                        {renderSafeImage('', product.title_jp)}
                     </div>
                  )}
               </div>
             )}
          </div>
          
          {/* Dots (Only if carousel active) */}
          {!variantImage && product.images && product.images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
               {product.images.map((_, i) => (
                 <div key={i} className={`h-1.5 rounded-full transition-all shadow-sm ${selectedImageIndex === i ? 'bg-gray-800 w-4' : 'bg-gray-300 w-1.5'}`} />
               ))}
            </div>
          )}
        </div>

        {/* Desktop: Standard Square */}
        <div className="hidden md:block relative aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
          {/* Logic: If variant has image, show it. Else show selected gallery image. */}
          {variantImage ? (
             renderSafeImage(variantImage, product.title_jp, true)
          ) : (
             (product.images && product.images[selectedImageIndex]) 
               ? renderSafeImage(product.images[selectedImageIndex], product.title_jp, true)
               : renderSafeImage('', product.title_jp)
          )}
        </div>

        {/* Thumbnail Strip (Desktop) */}
        <div className="hidden md:flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-4 md:px-0">
          {/* If variant image exists, show it as first thumbnail? Or just standard gallery? 
              Let's show standard gallery. Selecting thumbnail clears variant image override? 
              No, simpler: Thumbnail click sets index AND clears variant-specific image focus logic if we wanted complex state.
              For now, thumbnails just control the fallback gallery.
          */}
          {product.images && product.images.map((img, i) => (
            <button
              key={i}
              onClick={() => {
                setSelectedImageIndex(i);
                // Note: We don't clear variant selection, but the UI prioritizes variantImage.
                // If user clicks thumbnail, they might expect to see THAT image.
                // Improvement: If user clicks thumbnail, we could temporarily hide variantImage override?
                // For MVP simplicity: Variant Image always wins if present. 
                // User must select variant to change main image.
              }}
              className={`relative w-20 h-20 flex-shrink-0 bg-white rounded overflow-hidden border-2 transition-colors ${
                selectedImageIndex === i && !variantImage ? 'border-primary' : 'border-transparent'
              }`}
            >
              <div className="w-full h-full relative p-1">
                 {renderSafeImage(img, `thumb-${i}`)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Info & Actions */}
      <div className="px-5 md:px-0">
        
        {/* P2 - Social Proof */}
        <div className="flex items-center gap-2 mb-2">
           <span className="bg-amber-100 text-amber-700 text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Flame size={12} className="fill-amber-700" /> 人気商品
           </span>
           <span className="text-[10px] md:text-xs text-gray-500 font-medium">👶 ママに選ばれています</span>
        </div>

        <h1 className="text-lg md:text-2xl font-bold text-gray-900 mb-2 leading-relaxed tracking-tight">{product.title_jp}</h1>
        
        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
             {product.tags.map((tag, i) => (
                <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">
                   {tag}
                </span>
             ))}
          </div>
        )}

        <div className="flex items-end gap-3 pb-2 border-b border-gray-50">
          <span className="text-3xl font-bold text-red-600 leading-none tracking-tight">¥{displayPrice.toLocaleString()}</span>
          {displayComparePrice && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-400 line-through text-sm">¥{displayComparePrice.toLocaleString()}</span>
              <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
                -{discount}%
              </span>
            </div>
          )}
        </div>

        <div className="mt-2 mb-4">
           <p className="text-xs text-red-600 font-bold flex items-center gap-1">
               <Clock size={14} /> 
               <span>本日ご注文で<span className="underline decoration-red-300 decoration-2 underline-offset-2">最短3日以内</span>にお届け</span>
           </p>
        </div>

        {shortDescription && (
          <div className="mb-6">
             <p className="text-sm md:text-base text-gray-600 font-medium leading-relaxed line-clamp-4">
                {shortDescription}
             </p>
          </div>
        )}

        {/* Variants Selector */}
        {optionKeys.length > 0 && (
           <div className="space-y-4 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-100">
              {optionKeys.map((key) => {
                 // Get all unique values for this key across all variants
                 const values = Array.from(new Set(variants.map(v => v.options[key]).filter(Boolean)));
                 
                 return (
                    <div key={key}>
                       <span className="text-xs font-bold text-gray-500 block mb-2 uppercase tracking-wide">{key}</span>
                       <div className="flex flex-wrap gap-2">
                          {values.map(val => {
                             const isSelected = selectedVariant?.options[key] === val;
                             // Check if this option combination exists and has stock (advanced) - Skipping for simple selection
                             
                             return (
                                <button
                                  key={val}
                                  onClick={() => handleOptionSelect(key, val)}
                                  className={`px-4 py-2 text-sm border rounded-md min-w-[3rem] transition-all ${
                                     isSelected
                                     ? 'border-gray-900 bg-gray-900 text-white shadow-md ring-1 ring-gray-900'
                                     : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                                  }`}
                                >
                                  {val}
                                </button>
                             );
                          })}
                       </div>
                    </div>
                 );
              })}
              
              {/* Selected Variant Info */}
              {selectedVariant && (
                 <div className="text-xs text-gray-500 pt-2 border-t border-gray-200 mt-2 flex justify-between">
                    <span>SKU: {selectedVariant.sku}</span>
                    <span className={isOutOfStock ? "text-red-500 font-bold" : "text-green-600 font-bold"}>
                       {isOutOfStock ? "在庫切れ" : "在庫あり"}
                    </span>
                 </div>
              )}
           </div>
        )}

        {/* Desktop Actions */}
        <div className="hidden md:block border-t border-gray-100 pt-6 mt-6">
          {!isOutOfStock ? (
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
                      onClick={() => setQuantity(Math.min(currentStockQty, quantity + 1))}
                      className="p-2 hover:bg-gray-50 text-gray-600 active:bg-gray-100"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">残り {currentStockQty} 点</span>
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
            <button disabled className="w-full btn-secondary bg-gray-100 text-gray-400 border-none cursor-not-allowed py-4 font-bold">
              在庫切れ / 入荷待ち
            </button>
          )}
        </div>

        {/* Trust Module */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
             <div className="flex items-center gap-2.5 text-xs font-bold text-gray-700">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center border border-gray-200 text-primary shrink-0">
                  <Truck size={14} />
                </div>
                <span>全日本配送｜最短3日以内お届け</span>
             </div>
             <div className="flex items-center gap-2.5 text-xs font-bold text-gray-700">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center border border-gray-200 text-primary shrink-0">
                  <Wallet size={14} />
                </div>
                <span>代金引換対応（後払い）</span>
             </div>
             <div className="flex items-center gap-2.5 text-xs font-bold text-gray-700">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center border border-gray-200 text-primary shrink-0">
                  <ShieldCheck size={14} />
                </div>
                <span>安心の検品・品質チェック済み</span>
             </div>
             <div className="flex items-center gap-2.5 text-xs font-bold text-gray-700">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center border border-gray-200 text-primary shrink-0">
                  <RotateCcw size={14} />
                </div>
                <span>初期不良は返品・交換対応</span>
             </div>
        </div>

        {/* Mobile Sticky Footer */}
        {!isOutOfStock ? (
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
              在庫切れ / 入荷待ち
           </div>
        )}
      </div>
    </div>
  );
}
