'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Search as SearchIcon, Loader2 } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { searchProducts } from '@/lib/supabase/queries';
import { Product } from '@/lib/supabase/types';

export default function SearchDrawer() {
  const { isSearchOpen, closeSearch } = useUIStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  // Fetch results
  useEffect(() => {
    async function fetchResults() {
      if (debouncedQuery.trim().length === 0) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      const products = await searchProducts(debouncedQuery);
      setResults(products);
      setIsLoading(false);
    }
    fetchResults();
  }, [debouncedQuery]);

  // Reset on open/close
  useEffect(() => {
    if (!isSearchOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeSearch} />
      <div className="relative w-full bg-white h-full md:h-auto md:max-h-[80vh] animate-in slide-in-from-top duration-300 shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <span className="text-sm font-bold text-gray-500">検索</span>
          <button onClick={closeSearch} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Input */}
        <div className="p-6 flex-shrink-0">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="何をお探しですか？"
              className="w-full pl-10 pr-4 py-3 border-b-2 border-gray-200 focus:border-gray-800 outline-none text-lg placeholder:text-gray-300 bg-transparent"
              autoFocus
            />
            {isLoading ? (
              <Loader2 className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" size={20} />
            ) : (
              <SearchIcon className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            )}
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto px-6 pb-8">
          {query.trim() === '' ? (
            <div className="mt-4">
              <h4 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">人気キーワード</h4>
              <div className="flex flex-wrap gap-2">
                {['ベビー服', '出産祝い', 'おもちゃ', 'マタニティ', 'ベビーカー'].map((tag) => (
                  <button 
                    key={tag} 
                    onClick={() => setQuery(tag)}
                    className="px-3 py-1 bg-gray-50 rounded-full text-sm text-gray-600 hover:bg-gray-100"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {results.length === 0 && !isLoading && (
                <p className="text-center text-gray-500 text-sm py-8">該当する商品が見つかりませんでした。</p>
              )}
              {results.map((product) => (
                <Link 
                  key={product.id} 
                  href={`/products/${product.slug}`}
                  onClick={closeSearch}
                  className="flex items-center gap-4 p-2 hover:bg-gray-50 rounded-lg transition-colors group"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden relative flex-shrink-0">
                    {product.images?.[0] && (
                        // Use simple img here to avoid complexity inside drawer list
                       <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-800 group-hover:text-primary line-clamp-1">{product.title_jp}</h5>
                    <p className="text-xs text-gray-500">¥{product.price.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}