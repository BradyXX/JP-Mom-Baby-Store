
'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminListProducts, adminBatchUpsertProducts } from '@/lib/supabase/queries';
import { Product } from '@/lib/supabase/types';
import { Plus, Edit, FileUp, Loader2 } from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await adminListProducts(page, 50);
      setProducts(data || []);
    } catch (e) {
      alert('Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page]);

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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">商品管理</h1>
        <div className="flex gap-2">
          <label className="btn-secondary flex items-center gap-2 cursor-pointer">
            {importing ? <Loader2 size={18} className="animate-spin" /> : <FileUp size={18} />}
            JSONインポート
            <input type="file" accept=".json" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <Link href="/admin/products/new" className="btn-primary flex items-center gap-2">
            <Plus size={18} /> 新規登録
          </Link>
        </div>
      </div>

      <div className="bg-white rounded shadow border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">画像</th>
              <th className="px-6 py-3">商品名 (JP)</th>
              <th className="px-6 py-3">价格</th>
              <th className="px-6 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading...</td></tr>
            ) : products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">{p.id}</td>
                <td className="px-6 py-3">
                  <img src={p.images[0]} className="w-10 h-10 object-cover rounded bg-gray-100" />
                </td>
                <td className="px-6 py-3">{p.title_jp}</td>
                <td className="px-6 py-3">¥{p.price.toLocaleString()}</td>
                <td className="px-6 py-3 text-right">
                   <Link href={`/admin/products/${p.id}`} className="text-blue-500 hover:text-blue-700 inline-block p-2"><Edit size={18} /></Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
