'use client';
import { useEffect, useState } from 'react';
import { adminListCoupons, adminUpsertCoupon, adminDeleteCoupon } from '@/lib/supabase/queries';
import { Coupon } from '@/lib/supabase/types';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [editing, setEditing] = useState<Partial<Coupon> | null>(null);

  async function load() {
    try {
      const data = await adminListCoupons();
      setCoupons(data);
    } catch (e) { alert('Load failed'); }
  }
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!editing || !editing.code) return alert('Code is required');
    try {
      await adminUpsertCoupon(editing);
      setEditing(null);
      load();
    } catch (e: any) { alert('Save failed: ' + e.message); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return;
    try { await adminDeleteCoupon(id); load(); } catch (e) { alert('Delete failed'); }
  };

  const handleCreate = () => {
    setEditing({
      code: '',
      discount_percentage: 10,
      scope: 'global',
      active: true,
      min_order_amount: 0,
      stackable: false,
      used_count: 0,
      applies_to_product_ids: [],
      applies_to_collection_handles: []
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">クーポン管理</h1>
        <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> 新規作成
        </button>
      </div>

      {editing && (
        <div className="bg-white p-6 rounded shadow border border-blue-200 mb-8 max-w-2xl">
          <h3 className="font-bold mb-4">{editing.id ? 'クーポン編集' : '新規クーポン'}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-bold block mb-1">コード</label>
                  {/* Fixed: Added HTMLInputElement cast to access value */}
                  <input className="input-base" value={editing.code} onChange={e => setEditing({...editing, code: (e.target as HTMLInputElement).value.toUpperCase()})} />
               </div>
               <div>
                  <label className="text-xs font-bold block mb-1">割引率 (%)</label>
                  {/* Fixed: Added HTMLInputElement cast to access value */}
                  <input type="number" className="input-base" value={editing.discount_percentage} onChange={e => setEditing({...editing, discount_percentage: Number((e.target as HTMLInputElement).value)})} />
               </div>
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">スコープ</label>
              {/* Fixed: Added HTMLSelectElement cast to access value */}
              <select className="input-base" value={editing.scope} onChange={e => setEditing({...editing, scope: (e.target as HTMLSelectElement).value as any})}>
                <option value="global">全体 (Global)</option>
                <option value="product">特定商品 (Product)</option>
                <option value="collection">特定コレクション (Collection)</option>
              </select>
            </div>
            {editing.scope === 'product' && (
               <div>
                  <label className="text-xs font-bold block mb-1">商品ID (カンマ区切り)</label>
                  {/* Fixed: Added HTMLInputElement cast to access value */}
                  <input className="input-base" placeholder="1, 2, 3" value={editing.applies_to_product_ids?.join(', ')} onChange={e => setEditing({...editing, applies_to_product_ids: (e.target as HTMLInputElement).value.split(',').map(s=>Number(s.trim())).filter(n=>!isNaN(n))})} />
               </div>
            )}
            {editing.scope === 'collection' && (
               <div>
                  <label className="text-xs font-bold block mb-1">Collection Handles (カンマ区切り)</label>
                  {/* Fixed: Added HTMLInputElement cast to access value */}
                  <input className="input-base" placeholder="best-sellers, toys" value={editing.applies_to_collection_handles?.join(', ')} onChange={e => setEditing({...editing, applies_to_collection_handles: (e.target as HTMLInputElement).value.split(',').map(s=>s.trim()).filter(Boolean)})} />
               </div>
            )}
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-bold block mb-1">最低購入金額</label>
                  {/* Fixed: Added HTMLInputElement cast to access value */}
                  <input type="number" className="input-base" value={editing.min_order_amount} onChange={e => setEditing({...editing, min_order_amount: Number((e.target as HTMLInputElement).value)})} />
               </div>
               <div className="flex items-center mt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    {/* Fixed: Added HTMLInputElement cast to access checked */}
                    <input type="checkbox" checked={editing.active} onChange={e => setEditing({...editing, active: (e.target as HTMLInputElement).checked})} className="w-5 h-5 accent-primary" />
                    <span>有効にする</span>
                  </label>
               </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button onClick={() => setEditing(null)} className="btn-secondary">キャンセル</button>
              <button onClick={handleSave} className="btn-primary flex items-center gap-2"><Save size={16}/> 保存</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded shadow border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
            <tr>
              <th className="px-6 py-3">コード</th>
              <th className="px-6 py-3">割引</th>
              <th className="px-6 py-3">対象</th>
              <th className="px-6 py-3">最低金額</th>
              <th className="px-6 py-3">使用数</th>
              <th className="px-6 py-3">状態</th>
              <th className="px-6 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {coupons.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-mono font-bold">{c.code}</td>
                <td className="px-6 py-3">{c.discount_percentage}% OFF</td>
                <td className="px-6 py-3 capitalize">{c.scope}</td>
                <td className="px-6 py-3">¥{c.min_order_amount.toLocaleString()}</td>
                <td className="px-6 py-3">{c.used_count}</td>
                <td className="px-6 py-3">
                   <span className={`px-2 py-1 rounded text-xs ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.active ? 'Active' : 'Inactive'}</span>
                </td>
                <td className="px-6 py-3 text-right flex justify-end gap-2">
                   <button onClick={() => setEditing(c)} className="p-2 text-blue-500"><Edit size={16}/></button>
                   <button onClick={() => handleDelete(c.id)} className="p-2 text-red-500"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}