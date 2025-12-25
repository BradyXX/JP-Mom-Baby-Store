'use client';
import { useEffect, useState } from 'react';
import { adminGetOrder, adminUpdateOrder } from '@/lib/supabase/queries';
import { Order } from '@/lib/supabase/types';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await adminGetOrder(Number(params.id));
      setOrder(data);
    } catch (e) {
      alert('Order not found');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [params.id]);

  const updateOrder = async (patch: Partial<Order>) => {
    if (!order) return;
    if (!confirm('変更を保存しますか？')) return;
    try {
      await adminUpdateOrder(order.id!, patch);
      await load();
      alert('更新しました');
    } catch (e) {
      alert('更新失敗');
    }
  };

  if (loading || !order) return <Loader2 className="animate-spin" />;

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          注文詳細 <span className="text-base font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">{order.order_no}</span>
        </h1>
        <button onClick={() => router.back()} className="btn-secondary text-xs">戻る</button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Status Actions */}
        <div className="md:col-span-2 bg-white p-6 rounded shadow border border-gray-200">
          <h3 className="font-bold mb-4">ステータス管理</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">配送ステータス</label>
              <select 
                className="input-base" 
                value={order.status} 
                // Fixed: Added HTMLSelectElement cast to access value
                onChange={e => updateOrder({ status: (e.target as HTMLSelectElement).value as any })}
              >
                <option value="new">新規受付 (new)</option>
                <option value="processing">処理中 (processing)</option>
                <option value="shipped">発送済み (shipped)</option>
                <option value="delivered">配達済み (delivered)</option>
                <option value="cancelled">キャンセル (cancelled)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">支払ステータス</label>
              <select 
                className="input-base" 
                value={order.payment_status} 
                // Fixed: Added HTMLSelectElement cast to access value
                onChange={e => updateOrder({ payment_status: (e.target as HTMLSelectElement).value as any })}
              >
                <option value="pending">未払い (pending)</option>
                <option value="paid">支払い済み (paid)</option>
                <option value="failed">失敗 (failed)</option>
              </select>
            </div>
             <div className="flex items-center pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={order.line_confirmed} 
                        // Fixed: Added HTMLInputElement cast to access checked
                        onChange={e => updateOrder({ line_confirmed: (e.target as HTMLInputElement).checked })}
                        className="w-5 h-5 accent-green-500"
                    />
                    <span className="font-medium text-sm">LINE連携確認済み (Line Confirmed)</span>
                </label>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white p-6 rounded shadow border border-gray-200 text-sm">
          <h3 className="font-bold mb-4">顧客情報</h3>
          <p className="font-bold text-lg mb-1">{order.customer_name}</p>
          <p className="text-gray-600 mb-2">{order.phone}</p>
          <hr className="my-2" />
          <p>〒{order.postal_code}</p>
          <p>{order.prefecture} {order.city}</p>
          <p>{order.address_line1}</p>
          <p>{order.address_line2}</p>
          {order.notes && (
             <div className="mt-4 bg-yellow-50 p-2 rounded border border-yellow-100 text-yellow-800">
                <span className="font-bold text-xs block">備考:</span>
                {order.notes}
             </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded shadow border border-gray-200 overflow-hidden mb-8">
        <h3 className="font-bold p-6 border-b bg-gray-50">注文商品</h3>
        <table className="w-full text-sm">
           <thead className="text-gray-500 border-b">
              <tr>
                <th className="px-6 py-3 text-left">商品</th>
                <th className="px-6 py-3 text-right">単価</th>
                <th className="px-6 py-3 text-center">数量</th>
                <th className="px-6 py-3 text-right">小計</th>
              </tr>
           </thead>
           <tbody className="divide-y">
              {order.items.map((item, i) => (
                 <tr key={i}>
                    <td className="px-6 py-3">
                       <div className="flex items-center gap-3">
                          <img src={item.image} className="w-10 h-10 object-cover rounded bg-gray-100" />
                          <div>
                             <p className="font-medium">{item.title}</p>
                             <p className="text-xs text-gray-500">{item.sku} / {item.variant}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-3 text-right">¥{item.price.toLocaleString()}</td>
                    <td className="px-6 py-3 text-center">{item.qty}</td>
                    <td className="px-6 py-3 text-right">¥{(item.price * item.qty).toLocaleString()}</td>
                 </tr>
              ))}
           </tbody>
           <tfoot className="bg-gray-50 font-bold">
              <tr>
                 <td colSpan={3} className="px-6 py-2 text-right">小計</td>
                 <td className="px-6 py-2 text-right">¥{order.subtotal.toLocaleString()}</td>
              </tr>
              <tr>
                 <td colSpan={3} className="px-6 py-2 text-right text-red-500">割引 ({order.coupon_code})</td>
                 <td className="px-6 py-2 text-right text-red-500">-¥{order.discount_total.toLocaleString()}</td>
              </tr>
              <tr>
                 <td colSpan={3} className="px-6 py-2 text-right">送料</td>
                 <td className="px-6 py-2 text-right">¥{order.shipping_fee.toLocaleString()}</td>
              </tr>
              <tr className="text-lg border-t border-gray-300">
                 <td colSpan={3} className="px-6 py-4 text-right">合計</td>
                 <td className="px-6 py-4 text-right">¥{order.total.toLocaleString()}</td>
              </tr>
           </tfoot>
        </table>
      </div>
    </div>
  );
}