
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, Menu, X } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useCartStore } from '@/store/useCartStore';
import { SHOP_CATEGORIES } from '@/lib/categories';
import CategoryIcon from '@/components/CategoryIcon';

// 1. Logistics Bar (Topmost)
function LogisticsBar() {
  return (
    <div className="bg-gray-900 text-white text-[10px] md:text-xs py-2.5 overflow-hidden relative border-b border-gray-800">
      <div className="container-base flex items-center justify-between px-4">
         <div className="flex items-center gap-4 overflow-x-auto whitespace-nowrap scrollbar-hide flex-1">
            <span className="flex items-center gap-1.5"><span className="text-green-400">●</span> 全日本配送</span>
            <span className="flex items-center gap-1.5"><span className="text-green-400">●</span> 3日以内にお届け</span>
            <span className="hidden md:flex items-center gap-1.5"><span className="text-green-400">●</span> 代金引換OK</span>
         </div>
         <div className="hidden md:block text-gray-400 text-[10px]">
            10,000円以上で送料無料
         </div>
      </div>
    </div>
  );
}

export default function Header() {
  const { openSearch, openCart } = useUIStore();
  const cartCount = useCartStore((state) => state.getCartCount());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* 
         Sticky Container Strategy:
         We make the entire wrapper sticky. 
         The LogisticsBar sits on top, followed by the Header.
         This ensures the LogisticsBar stays visible as requested.
      */}
      <div className="sticky top-0 z-40 bg-white shadow-sm transition-all duration-300">
        
        {/* 1. Logistics Bar (Always visible in this layout) */}
        <LogisticsBar />

        {/* 2. Main Navigation */}
        <header className="border-b border-gray-100 bg-white relative z-20">
          <div className="container-base flex items-center justify-between h-14 md:h-16">
            
            {/* Left: Hamburger (Mobile) */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 hover:bg-gray-50 rounded-full lg:hidden text-gray-700"
              aria-label="Menu"
            >
              <Menu size={24} />
            </button>

            {/* Center/Left: Logo */}
            <Link href="/" className="text-xl md:text-2xl font-black tracking-tight text-primary flex-1 lg:flex-none text-center lg:text-left">
              MOM<span className="text-accent">&</span>BABY
            </Link>

            {/* Center: Desktop Nav */}
            <nav className="hidden lg:flex items-center space-x-6 mx-8">
              {SHOP_CATEGORIES.slice(0, 7).map((cat) => (
                <Link 
                  key={cat.id} 
                  href={`/collections/${cat.handle}`}
                  className="text-sm font-bold text-gray-600 hover:text-primary transition-colors py-2 border-b-2 border-transparent hover:border-primary"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>

            {/* Right: Icons */}
            <div className="flex items-center space-x-1 md:space-x-3">
              <button
                onClick={openSearch}
                className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-700"
                aria-label="Search"
              >
                <Search size={22} strokeWidth={2} />
              </button>
              <button
                onClick={openCart}
                className="p-2 hover:bg-gray-50 rounded-full transition-colors relative text-gray-700"
                aria-label="Cart"
              >
                <ShoppingBag size={22} strokeWidth={2} />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 animate-in zoom-in">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in" 
            onClick={() => setMobileMenuOpen(false)}
          />
          
          <div className="relative w-[85%] max-w-sm bg-white h-full shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <span className="font-bold text-lg text-gray-800">メニュー</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-white rounded-full shadow-sm">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-2">
              {SHOP_CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/collections/${cat.handle}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 active:bg-gray-50"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cat.color || 'bg-gray-100'}`}>
                      <CategoryIcon name={cat.iconName} size={16} />
                  </div>
                  <span className="font-medium text-gray-700">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
