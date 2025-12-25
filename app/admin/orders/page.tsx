'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminListOrders } from '@/lib/supabase/queries';
import { Order } from '@/lib/supabase/types';
import { CheckCircle2, Clock, XCircle, Search } from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  async function load() {
    setLoading(true);
    try {
      const { data } = await adminListOrders(page, 50, statusFilter || undefined);
      setOrders(data);
    } catch (e) {
      alert('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'new': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">新規</span>;
      case 'processing': return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">処理中</span>;
      case 'shipped': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">発送済</span>;
      case 'cancelled': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">キャンセル</span>;
      default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">{status}</span>;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">注文管理</h1>
        <select className="input-base w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">全ステータス</option>
          <option value="new">新規</option>
          <option value="processing">処理中</option>
          <option value="shipped">発送済</option>
          <option value="cancelled">キャンセル</option>
        </select>
      </div>

      <div className="bg-white rounded shadow border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
            <tr>
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
              <tr><td colSpan={8} className="p-8 text-center text-gray-500">Loading...</td></tr>
            ) : orders.length === 0 ? (
               <tr><td colSpan={8} className="p-8 text-center text-gray-500">注文がありません</td></tr>
            ) : orders.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-mono text-gray-600">{o.order_no}</td>
                <td className="px-6 py-3 text-xs text-gray-500">{new Date(o.created_at!).toLocaleString('ja-JP')}</td>
                <td className="px-6 py-3 font-medium">{o.customer_name}</td>
                <td className="px-6 py-3">¥{o.total.toLocaleString()}</td>
                <td className="px-6 py-3">{getStatusBadge(o.status)}</td>
                <td className="px-6 py-3">
                   {o.payment_status === 'paid' ? <CheckCircle2 size={16} className="text-green-500"/> : <Clock size={16} className="text-gray-400"/>}
                </td>
                <td className="px-6 py-3">
                   {o.line_confirmed ? <span className="text-green-600 text-xs">連携済</span> : <span className="text-gray-400 text-xs">-</span>}
                   {o.line_oa_handle && <span className="text-xs text-gray-400 block">{o.line_oa_handle}</span>}
                </td>
                <td className="px-6 py-3 text-right">
                   <Link href={`/admin/orders/${o.id}`} className="text-blue-500 hover:text-blue-700 font-medium text-xs border border-blue-200 px-3 py-1 rounded">詳細</Link>
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