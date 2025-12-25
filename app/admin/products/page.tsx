'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminListProducts, adminDeleteProduct } from '@/lib/supabase/queries';
import { Product } from '@/lib/supabase/types';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await adminListProducts(page, 50);
      setProducts(data);
    } catch (e) {
      alert('Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page]);

  const handleDelete = async (id: number) => {
    if (!confirm('本当に削除しますか？')) return;
    try {
      await adminDeleteProduct(id);
      load();
    } catch (e) {
      alert('削除失敗');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">商品管理</h1>
        <Link href="/admin/products/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} /> 新規登録
        </Link>
      </div>

      <div className="bg-white rounded shadow border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">画像</th>
              <th className="px-6 py-3">商品名 (JP)</th>
              <th className="px-6 py-3">SKU</th>
              <th className="px-6 py-3">価格</th>
              <th className="px-6 py-3">在庫</th>
              <th className="px-6 py-3">状態</th>
              <th className="px-6 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="p-8 text-center text-gray-500">Loading...</td></tr>
            ) : products.length === 0 ? (
               <tr><td colSpan={8} className="p-8 text-center text-gray-500">商品がありません</td></tr>
            ) : products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">{p.id}</td>
                <td className="px-6 py-3">
                  <div className="w-10 h-10 bg-gray-100 rounded">
                    {p.images[0] && <img src={p.images[0]} className="w-full h-full object-cover rounded" />}
                  </div>
                </td>
                <td className="px-6 py-3 font-medium text-gray-800">{p.title_jp}</td>
                <td className="px-6 py-3 text-gray-500">{p.sku}</td>
                <td className="px-6 py-3">¥{p.price.toLocaleString()}</td>
                <td className="px-6 py-3">{p.stock_qty}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.active ? '公開中' : '非公開'}
                  </span>
                </td>
                <td className="px-6 py-3 text-right flex justify-end gap-2">
                   <Link href={`/products/${p.slug}`} target="_blank" className="p-2 text-gray-400 hover:text-gray-600"><Eye size={18} /></Link>
                   <Link href={`/admin/products/${p.id}`} className="p-2 text-blue-500 hover:text-blue-700"><Edit size={18} /></Link>
                   <button onClick={() => handleDelete(p.id)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex justify-center gap-2">
         <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="btn-secondary py-1 px-3">Prev</button>
         <span className="py-2 text-sm">Page {page}</span>
         <button onClick={() => setPage(p => p+1)} className="btn-secondary py-1 px-3">Next</button>
      </div>
    </div>
  );
}