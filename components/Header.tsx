'use client';
import Link from 'next/link';
import { Search, ShoppingBag, Menu } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useCartStore } from '@/store/useCartStore';

export default function Header() {
  const { openSearch, openCart } = useUIStore();
  const cartCount = useCartStore((state) => state.getCartCount());

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="container-base flex items-center justify-between h-16">
        {/* Mobile Menu Trigger (Placeholder) */}
        <button className="p-2 -ml-2 hover:bg-gray-50 rounded-full lg:hidden">
          <Menu size={24} className="text-gray-600" />
        </button>

        {/* Logo */}
        <Link href="/" className="text-xl font-bold tracking-widest text-primary uppercase">
          MOM&BABY
        </Link>

        {/* Desktop Nav Placeholder */}
        <nav className="hidden lg:flex items-center space-x-8 text-sm font-medium text-gray-600">
          <Link href="/collections/new" className="hover:text-primary transition-colors">新着商品</Link>
          <Link href="/collections/baby" className="hover:text-primary transition-colors">ベビー</Link>
          <Link href="/collections/maternity" className="hover:text-primary transition-colors">マタニティ</Link>
          <Link href="/collections/gifts" className="hover:text-primary transition-colors">ギフト</Link>
        </nav>

        {/* Icons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={openSearch}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
            aria-label="Search"
          >
            <Search size={22} className="text-gray-600" />
          </button>
          <button
            onClick={openCart}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors relative"
            aria-label="Cart"
          >
            <ShoppingBag size={22} className="text-gray-600" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-0 bg-accent text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
