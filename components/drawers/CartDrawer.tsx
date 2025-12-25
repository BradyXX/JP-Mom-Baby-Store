'use client';
import Link from 'next/link';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useCartStore } from '@/store/useCartStore';

export default function CartDrawer() {
  const { isCartOpen, closeCart } = useUIStore();
  const { items, removeItem, updateQuantity, getCartTotal } = useCartStore();

  return (
    <>
      {/* Overlay */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <h2 className="text-lg font-bold">ショッピングカート</h2>
            <button onClick={closeCart} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={20} />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                <p>カートは空です</p>
                <button 
                  onClick={closeCart}
                  className="text-primary border-b border-primary pb-0.5 text-sm hover:opacity-70"
                >
                  買い物を続ける
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={`${item.productId}-${item.variantId || 'novar'}`} className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden relative flex-shrink-0">
                     {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full bg-gray-200" />
                     )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-medium text-gray-800 line-clamp-2">{item.title}</h3>
                        {item.variantTitle && (
                          <p className="text-xs text-gray-500 mt-1">{item.variantTitle}</p>
                        )}
                      </div>
                      <button 
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <div className="flex items-center border border-gray-200 rounded">
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                          className="p-1 hover:bg-gray-50"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-xs w-8 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                          className="p-1 hover:bg-gray-50"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="text-sm font-bold">
                        ¥{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-gray-600">小計 (税込)</span>
                <span className="text-xl font-bold">¥{getCartTotal().toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-400 mb-4 text-center">送料と割引は決済画面で計算されます</p>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="btn-primary w-full flex justify-center py-4 text-base"
              >
                ご購入手続きへ
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
