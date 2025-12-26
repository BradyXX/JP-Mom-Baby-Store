
'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminListProducts, adminBatchUpsertProducts } from '@/lib/supabase/queries';
import { Product } from '@/lib/supabase/types';
import { Plus, Edit, FileUp, Loader2, ArrowUpDown } from 'lucide-react';
import { SHOP_CATEGORIES } from '@/lib/categories';

// Sorting options
const SORT_OPTIONS = [
  { label: 'ID 昇順', col: 'id', asc: true },
  { label: 'ID 降順', col: 'id', asc: false },
  { label: '価格 昇順', col: 'price', asc: true },
  { label: '価格 降順', col: 'price', asc: false },
  { label: '作成日 昇順', col: 'created_at', asc: true },
  { label: '作成日 降順', col: 'created_at', asc: false },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  // Filter & Sort State
  const [sortIndex, setSortIndex] = useState(0); // Default ID Asc
  const [filterCategory, setFilterCategory] = useState('all');

  async function load() {
    setLoading(true);
    try {
      const sortOpt = SORT_OPTIONS[sortIndex];
      const { data } = await adminListProducts(
        page, 
        50, 
        { column: sortOpt.col, ascending: sortOpt.asc },
        filterCategory
      );
      setProducts(data || []);
    } catch (e) {
      alert('Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  // Reload when filters change
  useEffect(() => { 
    setPage(1); // Reset page on filter change
    load(); 
  }, [sortIndex, filterCategory]);

  // Reload when page changes (skip if filter changed same tick)
  useEffect(() => {
    if (page > 1) load();
  }, [page]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!Array.isArray(data)) throw new Error('Invalid JSON: Must be an array');
      
      await adminBatchUpsertProducts(data);
      alert(`${data.length}件のアイテムをインポートしました`);
      load();
    } catch (err: any) {
      alert('Import failed: ' + err.message);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  // Helper to get category name
  const getCategoryName = (handle: string) => {
    const found = SHOP_CATEGORIES.find(c => c.handle === handle);
    return found ? found.name : handle;
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">商品管理</h1>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <label className="btn-secondary flex items-center gap-2 cursor-pointer text-xs md:text-sm py-2">
            {importing ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
            JSONインポート
            <input type="file" accept=".json" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <Link href="/admin/products/new" className="btn-primary flex items-center gap-2 text-xs md:text-sm py-2">
            <Plus size={16} /> 新規登録
          </Link>
        </div>
      </div>

      {/* Filters & Sort */}
      <div className="bg-white p-4 rounded shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-xs font-bold text-gray-500 whitespace-nowrap">カテゴリー:</label>
            <select 
               className="input-base py-2 text-sm"
               value={filterCategory}
               onChange={(e) => setFilterCategory(e.target.value)}
            >
               <option value="all">全て</option>
               {SHOP_CATEGORIES.map(cat => (
                 <option key={cat.id} value={cat.handle}>{cat.name}</option>
               ))}
            </select>
         </div>

         <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-xs font-bold text-gray-500 whitespace-nowrap flex items-center gap-1"><ArrowUpDown size={12}/> 並び替え:</label>
            <select 
               className="input-base py-2 text-sm"
               value={sortIndex}
               onChange={(e) => setSortIndex(Number(e.target.value))}
            >
               {SORT_OPTIONS.map((opt, i) => (
                 <option key={i} value={i}>{opt.label}</option>
               ))}
            </select>
         </div>
      </div>

      <div className="bg-white rounded shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr>
                <th className="px-6 py-3 w-16">ID</th>
                <th className="px-6 py-3 w-20">画像</th>
                <th className="px-6 py-3">商品名 (JP)</th>
                <th className="px-6 py-3">カテゴリー</th>
                <th className="px-6 py-3">価格</th>
                <th className="px-6 py-3">在庫</th>
                <th className="px-6 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="p-12 text-center text-gray-500"><Loader2 className="animate-spin inline mr-2"/>Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="p-12 text-center text-gray-500">商品が見つかりません</td></tr>
              ) : products.map((p) => {
                const isOutOfStock = p.stock_qty === 0;
                const isInactive = !p.active;
                
                return (
                  <tr key={p.id} className={`group hover:bg-blue-50/50 transition-colors ${isInactive ? 'opacity-60 bg-gray-50' : ''}`}>
                    <td className="px-6 py-3 font-mono text-gray-500">{p.id}</td>
                    <td className="px-6 py-3">
                      <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden border border-gray-200">
                         {p.images?.[0] ? (
                            <img src={p.images[0]} className="w-full h-full object-cover" alt="" />
                         ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-300">No Img</div>
                         )}
                      </div>
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-900">
                       {p.title_jp}
                       {isInactive && <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] rounded font-bold">非公開</span>}
                    </td>
                    <td className="px-6 py-3">
                       <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {p.collection_handles && p.collection_handles.length > 0 ? (
                             <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200">
                                {getCategoryName(p.collection_handles[0])}
                                {p.collection_handles.length > 1 && ` +${p.collection_handles.length - 1}`}
                             </span>
                          ) : (
                             <span className="text-gray-300 text-xs">-</span>
                          )}
                       </div>
                    </td>
                    <td className={`px-6 py-3 font-mono ${p.price === 0 ? 'text-red-500 font-bold' : ''}`}>
                       ¥{p.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                       {isOutOfStock ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-bold">在庫切れ</span>
                       ) : (
                          <span className="font-mono">{p.stock_qty}</span>
                       )}
                    </td>
                    <td className="px-6 py-3 text-right">
                       <Link href={`/admin/products/${p.id}`} className="btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1 group-hover:border-blue-300 group-hover:text-blue-600">
                          <Edit size={14} /> 編集
                       </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination Simple */}
      <div className="mt-6 flex justify-center gap-2">
         <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary py-1 px-3 text-xs">Prev</button>
         <span className="py-2 text-sm text-gray-500">Page {page}</span>
         <button onClick={() => setPage(page + 1)} className="btn-secondary py-1 px-3 text-xs">Next</button>
      </div>
    </div>
  );
}
