'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, X, Check } from 'lucide-react';

interface CollectionFiltersProps {
  availableTags: string[];
}

export default function CollectionFilters({ availableTags }: CollectionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  // Read current state
  const currentSort = searchParams.get('sort') || 'new';
  const currentInStock = searchParams.get('inStock') === 'true';
  const currentTags = searchParams.get('tags')?.split(',') || [];
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const applyFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Reset page on filter change
    params.delete('page');

    router.push(`?${params.toString()}`);
  };

  const toggleTag = (tag: string) => {
    let newTags = [...currentTags];
    if (newTags.includes(tag)) {
      newTags = newTags.filter(t => t !== tag);
    } else {
      newTags.push(tag);
    }
    applyFilters({ tags: newTags.length ? newTags.join(',') : null });
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          絞り込み・並び替え
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm font-medium border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50"
        >
          <Filter size={14} />
          {isOpen ? '閉じる' : 'フィルター'}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2">
          
          {/* Sort */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">並び替え</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { val: 'new', label: '新着順' },
                { val: 'popular', label: '人気順' },
                { val: 'price_asc', label: '価格が安い順' },
                { val: 'price_desc', label: '価格が高い順' },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => applyFilters({ sort: opt.val })}
                  className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                    currentSort === opt.val 
                    ? 'bg-primary text-white border-primary' 
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stock */}
          <div className="mb-6">
             <label className="flex items-center gap-2 cursor-pointer">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${currentInStock ? 'bg-primary border-primary' : 'bg-white border-gray-300'}`}>
                    {currentInStock && <Check size={10} className="text-white" />}
                </div>
                <input 
                    type="checkbox" 
                    className="hidden"
                    checked={currentInStock}
                    onChange={(e) => applyFilters({ inStock: e.target.checked ? 'true' : null })}
                />
                <span className="text-sm">在庫ありのみ表示</span>
             </label>
          </div>

          {/* Price */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">価格帯</h4>
            <div className="flex items-center gap-2">
                <input 
                    type="number" 
                    placeholder="Min" 
                    className="w-24 p-2 text-sm border border-gray-300 rounded"
                    value={minPrice}
                    onChange={(e) => applyFilters({ minPrice: e.target.value })}
                />
                <span className="text-gray-400">~</span>
                <input 
                    type="number" 
                    placeholder="Max" 
                    className="w-24 p-2 text-sm border border-gray-300 rounded"
                    value={maxPrice}
                    onChange={(e) => applyFilters({ maxPrice: e.target.value })}
                />
            </div>
          </div>

          {/* Tags */}
          {availableTags.length > 0 && (
            <div>
               <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">タグ</h4>
               <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                            currentTags.includes(tag)
                            ? 'bg-gray-800 text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {tag}
                      </button>
                  ))}
               </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}