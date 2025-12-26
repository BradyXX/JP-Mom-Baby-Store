
'use client';
import Link from 'next/link';
import { Home, List, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { usePathname } from 'next/navigation';

export default function MobileBottomNav() {
  const cartCount = useCartStore((state) => state.getCartCount());
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[49] lg:hidden pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {/* Home */}
        <Link 
          href="/" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
            isActive('/') ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Home size={24} strokeWidth={isActive('/') ? 2.5 : 2} />
          <span className="text-[10px] font-bold">ホーム</span>
        </Link>

        {/* Categories (Collections) */}
        <Link 
          href="/collections/all" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
            isActive('/collections/all') ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <List size={24} strokeWidth={isActive('/collections/all') ? 2.5 : 2} />
          <span className="text-[10px] font-bold">カテゴリ</span>
        </Link>

        {/* Cart */}
        <Link 
          href="/checkout" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${
            isActive('/checkout') ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="relative">
             <ShoppingBag size={24} strokeWidth={isActive('/checkout') ? 2.5 : 2} />
             {cartCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border border-white">
                   {cartCount}
                </span>
             )}
          </div>
          <span className="text-[10px] font-bold">カート</span>
        </Link>
      </div>
    </div>
  );
}
