'use client';
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { adminListProducts, adminBatchUpsertProducts } from '@/lib/supabase/queries';
import { Product } from '@/lib/supabase/types';
import { Plus, Edit, FileUp, Loader2, ArrowUpDown, TableProperties, Trash2, Image as ImageIcon, CheckCircle2, AlertTriangle, X, CloudLightning } from 'lucide-react';
import { SHOP_CATEGORIES } from '@/lib/categories';
import CsvImportModal from '@/components/admin/CsvImportModal';
import { deleteProducts } from '@/app/actions/admin-products';
import { migrateProductImages } from '@/app/actions/image-migration';

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
  
  // CSV Import State
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  // Filter & Sort State
  const [sortIndex, setSortIndex] = useState(0);
  const [filterCategory, setFilterCategory] = useState('all');

  // --- Multi-Selection State ---
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  
  // --- Batch Operation States ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [showMigrateModal, setShowMigrateModal] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStats, setMigrationStats] = useState({ total: 0, processed: 0, success: 0, failed: 0 });
  const [migrationLogs, setMigrationLogs] = useState<{id: number, title: string, status: 'ok'|'error', msg?: string}[]>([]);

  // Load Data
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
      setSelectedIds(new Set()); // Reset selection on page change/reload
    } catch (e) {
      alert('Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    setPage(1); 
    load(); 
  }, [sortIndex, filterCategory]);

  useEffect(() => {
    if (page > 1) load();
  }, [page]);

  // --- Selection Handlers ---
  const isAllSelected = products.length > 0 && products.every(p => selectedIds.has(p.id));
  const selectedCount = selectedIds.size;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const newSet = new Set(selectedIds);
      products.forEach(p => newSet.delete(p.id));
      setSelectedIds(newSet);
    } else {
      const newSet = new Set(selectedIds);
      products.forEach(p => newSet.add(p.id));
      setSelectedIds(newSet);
    }
  };

  const toggleSelectOne = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  // --- Batch Delete Logic ---
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      const res = await deleteProducts(ids);
      if (res.success) {
        setShowDeleteModal(false);
        await load(); // Reload table
      } else {
        alert('削除失敗: ' + res.message);
      }
    } catch (e) {
      alert('削除エラーが発生しました');
    } finally {
      setIsDeleting(false);
    }
  };

  // --- Batch Migrate Logic (Client Orchestration) ---
  const handleBatchMigrate = async () => {
    if (selectedIds.size === 0) return;
    
    setIsMigrating(true);
    setMigrationLogs([]);
    setMigrationStats({ total: selectedIds.size, processed: 0, success: 0, failed: 0 });

    const ids = Array.from(selectedIds);
    
    // Process one by one to avoid timeout and show progress
    for (const id of ids) {
      const product = products.find(p => p.id === id);
      if (!product) continue;

      try {
        // Call existing Server Action for single product
        const res = await migrateProductImages(product.id, product.slug, product.images);
        
        if (res.success) {
           setMigrationStats(prev => ({ ...prev, processed: prev.processed + 1, success: prev.success + 1 }));
           setMigrationLogs(prev => [...prev, { id, title: product.title_jp, status: 'ok' }]);
        } else {
           // Treated as success in flow but logged as no-change
           setMigrationStats(prev => ({ ...prev, processed: prev.processed + 1, success: prev.success + 1 }));
           setMigrationLogs(prev => [...prev, { id, title: product.title_jp, status: 'ok', msg: 'Skip/NoChange' }]);
        }
      } catch (e: any) {
        setMigrationStats(prev => ({ ...prev, processed: prev.processed + 1, failed: prev.failed + 1 }));
        setMigrationLogs(prev => [...prev, { id, title: product.title_jp, status: 'error', msg: e.message }]);
      }
    }

    setIsMigrating(false);
    await load(); // Refresh data to show new URLs
  };

  // Legacy JSON Import
  const handleJsonImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Invalid JSON');
      await adminBatchUpsertProducts(data);
      alert(`${data.length}件のアイテムをインポートしました`);
      load();
    } catch (err: any) { alert('Import failed: ' + err.message); } 
    finally { setImporting(false); e.target.value = ''; }
  };

  const getCategoryName = (handle: string) => {
    const found = SHOP_CATEGORIES.find(c => c.handle === handle);
    return found ? found.name : handle;
  };

  return (
    <div>
      {/* Title & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">商品管理</h1>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
             onClick={() => setIsCsvModalOpen(true)}
             className="btn-secondary flex items-center gap-2 text-xs md:text-sm py-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
          >
             <TableProperties size={16} /> CSVインポート
          </button>
          <label className="btn-secondary flex items-center gap-2 cursor-pointer text-xs md:text-sm py-2">
            {importing ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
            JSONインポート
            <input type="file" accept=".json" className="hidden" onChange={handleJsonImport} disabled={importing} />
          </label>
          <Link href="/admin/products/new" className="btn-primary flex items-center gap-2 text-xs md:text-sm py-2">
            <Plus size={16} /> 新規登録
          </Link>
        </div>
      </div>

      {/* --- Batch Toolbar (Visible when items selected) --- */}
      {selectedCount > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 p-3 rounded-lg flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-top-2">
           <div className="flex items-center gap-3">
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">{selectedCount}</span>
              <span className="text-sm font-bold text-blue-900">アイテム選択中</span>
           </div>
           <div className="flex gap-2">
              <button 
                onClick={() => setShowMigrateModal(true)}
                className="btn-secondary border-blue-200 text-blue-700 hover:bg-blue-100 flex items-center gap-2 text-xs"
              >
                <CloudLightning size={16} />
                画像一括移行
              </button>
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="btn-secondary bg-white text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2 text-xs"
              >
                <Trash2 size={16} />
                一括削除
              </button>
              <button onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-500 hover:underline px-2">
                解除
              </button>
           </div>
        </div>
      )}

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

      {/* Table */}
      <div className="bg-white rounded shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr>
                {/* Checkbox Column */}
                <th className="px-4 py-3 w-10 text-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
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
                <tr><td colSpan={8} className="p-12 text-center text-gray-500"><Loader2 className="animate-spin inline mr-2"/>Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={8} className="p-12 text-center text-gray-500">商品が見つかりません</td></tr>
              ) : products.map((p) => {
                const isOutOfStock = p.stock_qty === 0;
                const isInactive = !p.active;
                const isSelected = selectedIds.has(p.id);
                
                return (
                  <tr key={p.id} className={`group hover:bg-blue-50/30 transition-colors ${isInactive ? 'opacity-60 bg-gray-50' : ''} ${isSelected ? 'bg-blue-50/60' : ''}`}>
                    {/* Checkbox Cell */}
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                       <input 
                         type="checkbox"
                         className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" 
                         checked={isSelected}
                         onChange={() => toggleSelectOne(p.id)}
                       />
                    </td>
                    <td className="px-6 py-3 font-mono text-gray-500">{p.id}</td>
                    <td className="px-6 py-3">
                      <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden border border-gray-200 relative group-hover:border-blue-200">
                         {p.images?.[0] ? (
                            <img src={p.images[0]} className="w-full h-full object-cover" alt="" />
                         ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-300">No Img</div>
                         )}
                      </div>
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                       {p.title_jp}
                       {isInactive && <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] rounded font-bold">非公開</span>}
                    </td>
                    <td className="px-6 py-3">
                       <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {p.collection_handles && p.collection_handles.length > 0 ? (
                             <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200 truncate">
                                {getCategoryName(p.collection_handles[0])}
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
      
      {/* Pagination */}
      <div className="mt-6 flex justify-center gap-2">
         <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary py-1 px-3 text-xs">Prev</button>
         <span className="py-2 text-sm text-gray-500">Page {page}</span>
         <button onClick={() => setPage(page + 1)} className="btn-secondary py-1 px-3 text-xs">Next</button>
      </div>

      {/* Import Modal */}
      <CsvImportModal 
         isOpen={isCsvModalOpen} 
         onClose={() => setIsCsvModalOpen(false)} 
         onSuccess={() => { load(); }} 
      />

      {/* --- Batch Delete Modal --- */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isDeleting && setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">一括削除しますか？</h3>
              <p className="text-sm text-gray-500">
                選択した <span className="font-bold text-gray-800">{selectedCount}件</span> の商品を削除します。<br/>
                この操作は取り消せません。
              </p>
              <div className="flex gap-3 w-full mt-2">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 btn-secondary py-2"
                >
                  キャンセル
                </button>
                <button 
                  onClick={handleBatchDelete}
                  disabled={isDeleting}
                  className="flex-1 btn-primary bg-red-600 hover:bg-red-700 border-red-600 text-white py-2 flex items-center justify-center gap-2"
                >
                  {isDeleting && <Loader2 className="animate-spin" size={16} />}
                  削除する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Batch Migrate Modal --- */}
      {showMigrateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !isMigrating && setShowMigrateModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
             
             <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                   <CloudLightning size={20} className="text-blue-500"/> 画像一括移行
                </h3>
                {!isMigrating && <button onClick={() => setShowMigrateModal(false)}><X size={20}/></button>}
             </div>

             <div className="p-6 overflow-y-auto flex-1">
                {!isMigrating && migrationStats.processed === 0 ? (
                  // Initial State
                  <div className="space-y-4">
                     <p className="text-sm text-gray-600">
                        選択した <strong>{selectedCount}件</strong> の商品に含まれる外部画像（他社サーバー等のURL）をダウンロードし、Supabase Storageへ保存します。
                     </p>
                     <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-xs text-yellow-800 space-y-1">
                        <p>・Next.jsの画像最適化エラー(400)を防止します。</p>
                        <p>・画像の枚数によっては時間がかかる場合があります。</p>
                        <p>・処理中は画面を閉じないでください。</p>
                     </div>
                  </div>
                ) : (
                  // Processing/Result State
                  <div className="space-y-4">
                     <div className="flex justify-between text-sm font-bold mb-1">
                        <span>進捗状況</span>
                        <span>{Math.round((migrationStats.processed / migrationStats.total) * 100)}%</span>
                     </div>
                     <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div className="bg-blue-500 h-full transition-all duration-300" style={{width: `${(migrationStats.processed / migrationStats.total) * 100}%`}}></div>
                     </div>
                     <div className="flex gap-4 text-xs text-gray-500 justify-center">
                        <span className="text-green-600 font-bold">成功: {migrationStats.success}</span>
                        <span className="text-red-600 font-bold">失敗: {migrationStats.failed}</span>
                        <span>残り: {migrationStats.total - migrationStats.processed}</span>
                     </div>
                     
                     {/* Logs */}
                     <div className="mt-4 bg-gray-900 rounded p-3 h-40 overflow-y-auto font-mono text-xs text-gray-300">
                        {migrationLogs.map((log, i) => (
                           <div key={i} className={log.status === 'error' ? 'text-red-400' : 'text-green-400'}>
                              [{i+1}] {log.status === 'ok' ? 'OK' : 'ERR'}: {log.title} {log.msg ? `(${log.msg})` : ''}
                           </div>
                        ))}
                     </div>
                  </div>
                )}
             </div>

             <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                {!isMigrating ? (
                   <>
                     <button onClick={() => setShowMigrateModal(false)} className="btn-secondary">閉じる</button>
                     {migrationStats.processed === 0 && (
                        <button onClick={handleBatchMigrate} className="btn-primary flex items-center gap-2">
                           <CloudLightning size={16}/> 開始する
                        </button>
                     )}
                   </>
                ) : (
                   <button disabled className="btn-secondary opacity-50 cursor-not-allowed flex items-center gap-2">
                      <Loader2 className="animate-spin" size={16}/> 処理中...
                   </button>
                )}
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
