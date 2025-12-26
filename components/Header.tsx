'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, Menu, X, ChevronRight } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useCartStore } from '@/store/useCartStore';
import { SHOP_CATEGORIES } from '@/lib/categories';
import CategoryIcon from '@/components/CategoryIcon';

// 1. Unified Logistics Bar (Merged Content)
function LogisticsBar() {
  return (
    <div className="bg-gray-900 text-white text-[10px] font-medium py-2.5 relative z-50 border-b border-gray-800 transition-colors">
      <div className="container-base flex flex-wrap items-center justify-center md:justify-between gap-x-4 gap-y-1 px-4 leading-none">
         
         {/* Left: Primary Value Prop */}
         <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="font-bold tracking-wide">全品送料無料・日本国内発送</span>
         </div>

         {/* Right: Detailed Trust Badges */}
         <div className="flex flex-wrap items-center justify-center gap-3 text-gray-300 opacity-90">
            <span className="hidden sm:inline text-gray-700">|</span>
            <span>全日本配送</span>
            <span className="hidden sm:inline text-gray-700">|</span>
            <span>3日以内にお届け</span>
            <span className="hidden sm:inline text-gray-700">|</span>
            <span>代金引換OK</span>
            <span className="hidden sm:inline text-gray-700">|</span>
            <span className="text-yellow-500/90">10,000円以上で送料無料</span>
         </div>
      </div>
    </div>
  );
}

export default function Header() {
  const { openSearch, openCart } = useUIStore();
  const cartCount = useCartStore((state) => state.getCartCount());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Scroll detection for shrinking header
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* 
         Sticky Container Strategy:
         Both LogisticsBar and Header stay sticky at the top.
         The Header shrinks in height when scrolled to give more space to content.
      */}
      <div className="sticky top-0 z-40 bg-white shadow-sm transition-all duration-300">
        
        {/* 1. Logistics Bar (Always visible) */}
        <LogisticsBar />

        {/* 2. Main Navigation */}
        <header 
          className={`border-b border-gray-100 bg-white relative z-20 transition-all duration-300 ease-in-out ${
            isScrolled ? 'py-0' : 'py-2'
          }`}
        >
          <div className={`container-base flex items-center justify-between transition-all duration-300 ${
            isScrolled ? 'h-12' : 'h-14 md:h-16'
          }`}>
            
            {/* Left: Hamburger (Mobile) */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 hover:bg-gray-50 rounded-full lg:hidden text-gray-700"
              aria-label="Menu"
            >
              <Menu size={isScrolled ? 20 : 24} />
            </button>

            {/* Center/Left: Logo */}
            <Link href="/" className={`font-black tracking-tight text-primary flex-1 lg:flex-none text-center lg:text-left transition-all duration-300 ${
              isScrolled ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'
            }`}>
              MOM<span className="text-accent">&</span>BABY
            </Link>

            {/* Center: Desktop Nav */}
            <nav className={`hidden lg:flex items-center space-x-6 mx-8 transition-opacity duration-300 ${
              isScrolled ? 'opacity-90' : 'opacity-100'
            }`}>
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
                <Search size={isScrolled ? 20 : 22} strokeWidth={2} />
              </button>
              <button
                onClick={openCart}
                className="p-2 hover:bg-gray-50 rounded-full transition-colors relative text-gray-700"
                aria-label="Cart"
              >
                <ShoppingBag size={isScrolled ? 20 : 22} strokeWidth={2} />
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
            {/* Optimized Header Height */}
            <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                 <span className="font-black text-lg text-primary">MOM<span className="text-accent">&</span>BABY</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)} 
                className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 active:scale-95 transition-all"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pb-safe">
              <div className="py-2">
                {SHOP_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/collections/${cat.handle}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-5 py-4 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Unified Icon Style: Rounded Full, Light Background */}
                      <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${cat.color || 'bg-gray-100'}`}>
                          <CategoryIcon name={cat.iconName} size={18} className="opacity-80 group-hover:opacity-100" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-base text-gray-800">{cat.name}</span>
                        <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">{cat.subTitle}</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-primary" />
                  </Link>
                ))}
              </div>

              {/* Footer Links in Menu */}
              <div className="mt-4 p-5 bg-gray-50 border-t border-gray-100">
                 <div className="grid grid-cols-2 gap-3 mb-6">
                    <Link href="/collections/all" onClick={() => setMobileMenuOpen(false)} className="btn-secondary text-xs py-3 text-center bg-white shadow-sm border-transparent">全商品</Link>
                    <Link href="/collections/sale" onClick={() => setMobileMenuOpen(false)} className="btn-secondary text-xs py-3 text-center bg-white text-red-600 shadow-sm border-transparent">セール</Link>
                 </div>
                 <div className="space-y-3">
                    <Link href="#" className="flex items-center gap-3 text-sm text-gray-600 hover:text-primary">
                       <span>ご利用ガイド</span>
                    </Link>
                    <Link href="#" className="flex items-center gap-3 text-sm text-gray-600 hover:text-primary">
                       <span>お問い合わせ</span>
                    </Link>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}