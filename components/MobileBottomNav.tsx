'use client';
import Link from 'next/link';
import { Home, List, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useUIStore } from '@/store/useUIStore';
import { usePathname } from 'next/navigation';

export default function MobileBottomNav() {
  const cartCount = useCartStore((state) => state.getCartCount());
  const { openCart, openCategory } = useUIStore();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[49] lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {/* Home - Direct Link */}
        <Link 
          href="/" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 active:bg-gray-50 ${
            isActive('/') ? 'text-primary' : 'text-gray-400'
          }`}
        >
          <Home size={22} strokeWidth={isActive('/') ? 2.5 : 2} />
          <span className="text-[10px] font-bold">ホーム</span>
        </Link>

        {/* Categories - Open Drawer */}
        <button 
          onClick={openCategory}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 active:bg-gray-50 text-gray-400`}
        >
          <List size={22} strokeWidth={2} />
          <span className="text-[10px] font-bold">カテゴリ</span>
        </button>

        {/* Cart - Open Drawer */}
        <button 
          onClick={openCart}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative active:bg-gray-50 text-gray-400`}
        >
          <div className="relative">
             <ShoppingBag size={22} strokeWidth={2} />
             {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border border-white">
                   {cartCount}
                </span>
             )}
          </div>
          <span className="text-[10px] font-bold">カート</span>
        </button>
      </div>
    </div>
  );
}