'use client';
import Link from 'next/link';
import { X, ChevronRight } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { SHOP_CATEGORIES } from '@/lib/categories';
import CategoryIcon from '@/components/CategoryIcon';

export default function CategoryDrawer() {
  const { isCategoryOpen, closeCategory } = useUIStore();

  return (
    <>
      {/* Overlay */}
      {isCategoryOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
          onClick={closeCategory}
        />
      )}

      {/* Drawer - Slide from Left (Standard Mobile Menu feel) or Bottom (Sheet)
          Let's use Bottom Sheet style as per request for "Category Panel"
      */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 w-full bg-white shadow-2xl rounded-t-2xl transform transition-transform duration-300 ease-out flex flex-col max-h-[85vh] ${
          isCategoryOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-2xl relative">
          <div className="w-10" /> {/* Spacer for centering */}
          <h2 className="text-lg font-bold">カテゴリー</h2>
          <button onClick={closeCategory} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-2 pb-safe">
          <div className="grid grid-cols-1">
             {SHOP_CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/collections/${cat.handle}`}
                  onClick={closeCategory}
                  className="flex items-center justify-between px-4 py-4 border-b border-gray-50 active:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cat.color || 'bg-gray-100'}`}>
                          <CategoryIcon name={cat.iconName} size={18} />
                      </div>
                      <div className="flex flex-col">
                         <span className="font-bold text-gray-800 text-sm">{cat.name}</span>
                         <span className="text-[10px] text-gray-400 uppercase tracking-wider">{cat.subTitle}</span>
                      </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </Link>
             ))}
          </div>
          
          {/* Quick Links Footer */}
          <div className="mt-4 p-4 grid grid-cols-2 gap-3">
             <Link href="/collections/all" onClick={closeCategory} className="bg-gray-50 py-3 rounded-lg text-center text-xs font-bold text-gray-600 border border-gray-100">
                全ての商品
             </Link>
             <Link href="/collections/sale" onClick={closeCategory} className="bg-red-50 py-3 rounded-lg text-center text-xs font-bold text-red-600 border border-red-100">
                セール会場
             </Link>
          </div>
        </div>
      </div>
    </>
  );
}