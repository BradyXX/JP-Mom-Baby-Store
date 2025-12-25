'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, MessageCircle, Copy, ArrowRight } from 'lucide-react';
import { Order } from '@/lib/supabase/types';
import { formatLineMessage, getLineDeepLink } from '@/lib/utils/line';
import Link from 'next/link';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderNo = searchParams.get('order_no');
  const [order, setOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Attempt to get order from storage first (rich data)
    const stored = sessionStorage.getItem('last_order');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.order_no === orderNo) {
          setOrder(parsed);
        }
      } catch (e) {
        console.error('Failed to parse order', e);
      }
    }
  }, [orderNo]);

  if (!orderNo) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-500">注文情報が見つかりません</p>
      </div>
    );
  }

  const lineMessage = order ? formatLineMessage(order) : '';
  const lineLink = order ? getLineDeepLink(order.line_oa_handle, lineMessage) : '#';

  const copyToClipboard = () => {
    if (!lineMessage) return;
    navigator.clipboard.writeText(lineMessage).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="container-base py-16 flex flex-col items-center max-w-2xl">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
        <CheckCircle2 size={40} />
      </div>
      
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-2">ご注文ありがとうございます</h1>
      <p className="text-gray-500 mb-8">注文番号: <span className="font-mono font-medium text-gray-800">{orderNo}</span></p>

      {order && (
        <div className="w-full bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8 animate-in slide-in-from-bottom-4 duration-700">
          <h2 className="font-bold text-lg mb-4 text-center">👇 重要：注文を確定してください</h2>
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6 text-sm text-blue-800">
             LINEでメッセージを送信して、注文完了となります。<br/>
             以下のボタンをタップするとLINEが起動します。
          </div>

          <a 
            href={lineLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-[#06C755] hover:bg-[#05b34c] text-white font-bold py-4 px-6 rounded-full text-center shadow-md transition-transform active:scale-95 mb-4 flex items-center justify-center gap-3"
          >
            <MessageCircle size={24} fill="white" />
            LINEで注文を確定する
          </a>

          <div className="text-center mb-6">
             <span className="text-xs text-gray-400">または</span>
          </div>

          <button 
            onClick={copyToClipboard}
            className="w-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 font-medium py-3 px-6 rounded-full text-center transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {copied ? <CheckCircle2 size={16} className="text-green-600"/> : <Copy size={16}/>}
            {copied ? 'コピーしました' : '注文メッセージをコピー'}
          </button>
        </div>
      )}

      {order && (
         <div className="w-full bg-gray-50 p-6 rounded-lg text-sm text-gray-600 space-y-2 mb-8">
            <div className="flex justify-between">
                <span>合計金額</span>
                <span className="font-bold text-lg text-gray-800">¥{order.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
                <span>お支払い方法</span>
                <span>代金引換 (COD)</span>
            </div>
         </div>
      )}

      <Link href="/" className="text-primary border-b border-primary pb-0.5 hover:opacity-70 flex items-center gap-1">
        ショッピングを続ける <ArrowRight size={14}/>
      </Link>
    </div>
  );
}
