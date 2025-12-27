
'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminListOrders, adminDeleteOrders } from '@/lib/supabase/queries';
import { Order } from '@/lib/supabase/types';
import { CheckCircle2, Clock, Trash2, AlertTriangle, Loader2 } from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await adminListOrders(page, 50, statusFilter || undefined);
      setOrders(data || []);
      setSelectedIds(new Set()); // Reset selection on reload
    } catch (e) {
      alert('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, statusFilter]);

  // Selection Handlers
  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if ((e.target as HTMLInputElement).checked) {
      // Select all currently visible orders (that have valid IDs)
      const allIds = orders.map(o => o.id).filter((id): id is number => id !== undefined);
      setSelectedIds(new Set(allIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelectOne = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);
    try {
      await adminDeleteOrders(Array.from(selectedIds));
      await load(); // Reload list
      setShowDeleteModal(false);
      // alert(`${selectedIds.size}件の注文を削除しました`); // Optional Toast
    } catch (e) {
      alert('削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'new': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">新規</span>;
      case 'processing': return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">処理中</span>;
      case 'shipped': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">発送済</span>;
      case 'cancelled': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">キャンセル</span>;
      default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div>
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">注文管理</h1>
        <div className="flex gap-3 w-full md:w-auto">
          <select 
            className="input-base w-full md:w-48" 
            value={statusFilter} 
            onChange={e => setStatusFilter((e.target as HTMLSelectElement).value)}
          >
            <option value="">全ステータス</option>
            <option value="new">新規</option>
            <option value="processing">処理中</option>
            <option value="shipped">発送済</option>
            <option value="cancelled">キャンセル</option>
          </select>
          
          {selectedIds.size > 0 && (
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="btn-primary bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 whitespace-nowrap"
            >
              <Trash2 size={16} />
              <span>削除 ({selectedIds.size})</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
              <tr>
                <th className="px-4 py-3 w-10 text-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={orders.length > 0 && selectedIds.size === orders.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-3">注文番号</th>
                <th className="px-6 py-3">日時</th>
                <th className="px-6 py-3">顧客名</th>
                <th className="px-6 py-3">合計</th>
                <th className="px-6 py-3">ステータス</th>
                <th className="px-6 py-3">支払</th>
                <th className="px-6 py-3">LINE連携</th>
                <th className="px-6 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={9} className="p-12 text-center text-gray-500"><Loader2 className="animate-spin inline mr-2"/>Loading...</td></tr>
              ) : orders.length === 0 ? (
                 <tr><td colSpan={9} className="p-12 text-center text-gray-500">注文がありません</td></tr>
              ) : orders.map((o) => (
                <tr key={o.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(o.id!) ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-4 py-3 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={o.id ? selectedIds.has(o.id) : false}
                      onChange={() => o.id && toggleSelectOne(o.id)}
                    />
                  </td>
                  <td className="px-6 py-3 font-mono text-gray-700 font-medium">{o.order_no}</td>
                  <td className="px-6 py-3 text-xs text-gray-500">{new Date(o.created_at!).toLocaleString('ja-JP')}</td>
                  <td className="px-6 py-3 font-medium text-gray-900">{o.customer_name}</td>
                  <td className="px-6 py-3">¥{o.total.toLocaleString()}</td>
                  <td className="px-6 py-3">{getStatusBadge(o.status)}</td>
                  <td className="px-6 py-3 text-gray-500">
                     {o.payment_status === 'paid' ? <CheckCircle2 size={18} className="text-green-500"/> : <Clock size={18} />}
                  </td>
                  <td className="px-6 py-3">
                     {o.line_confirmed ? <span className="text-green-600 text-xs font-bold">連携済</span> : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-6 py-3 text-right">
                     <Link 
                       href={`/admin/orders/${o.id}`} 
                       className="text-primary hover:text-black font-medium text-xs border border-gray-200 hover:border-gray-400 px-3 py-1.5 rounded bg-white transition-all"
                     >
                       詳細
                     </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination */}
       <div className="mt-6 flex justify-center gap-2">
         <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="btn-secondary py-1 px-3 text-xs">Prev</button>
         <span className="py-2 text-sm text-gray-500">Page {page}</span>
         <button onClick={() => setPage(p => p+1)} className="btn-secondary py-1 px-3 text-xs">Next</button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">本当に削除しますか？</h3>
              <p className="text-sm text-gray-500">
                選択した <span className="font-bold text-gray-800">{selectedIds.size}件</span> の注文を削除します。<br/>
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
    </div>
  );
}