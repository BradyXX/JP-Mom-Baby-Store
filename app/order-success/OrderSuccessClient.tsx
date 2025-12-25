'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, MessageCircle, Copy, ArrowRight } from 'lucide-react';
import { Order } from '@/lib/supabase/types';
import { formatLineMessage, getLineDeepLink } from '@/lib/utils/line';
import Link from 'next/link';

export default function OrderSuccessClient() {
  const searchParams = useSearchParams();
  const orderNo = searchParams.get('order_no');
  const [order, setOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('last_order');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.order_no === orderNo) setOrder(parsed);
    }
  }, [orderNo]);

  const lineMsg = order ? formatLineMessage(order) : '';
  const lineLink = order ? getLineDeepLink(order.line_oa_handle, lineMsg) : '#';

  const handleCopy = () => {
    navigator.clipboard.writeText(lineMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container-base py-16 flex flex-col items-center max-w-2xl text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
        <CheckCircle2 size={40} />
      </div>
      <h1 className="text-3xl font-bold mb-2">注文を承りました</h1>
      <p className="text-gray-500 mb-10">注文番号: <span className="font-mono text-gray-800">{orderNo}</span></p>

      <div className="w-full bg-blue-50 border border-blue-100 p-8 rounded-2xl mb-8">
        <h2 className="font-bold text-xl mb-4">⚠️ まだ完了していません！</h2>
        <p className="text-sm text-blue-700 mb-6 leading-relaxed">
          配送手配を開始するため、以下のボタンから<b>必ずLINEメッセージを送信</b>してください。
        </p>
        
        <a href={lineLink} className="block w-full bg-[#06C755] text-white py-4 rounded-full font-bold shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 mb-4">
          <MessageCircle size={22} />
          LINEで注文メッセージを送る
        </a>

        <button onClick={handleCopy} className="w-full bg-white border border-gray-200 text-gray-600 py-3 rounded-full text-sm flex items-center justify-center gap-2">
          {copied ? 'コピーしました！' : 'メッセージをコピー'}
          <Copy size={16} />
        </button>
      </div>

      <Link href="/" className="text-primary border-b border-primary flex items-center gap-1">
        トップページに戻る <ArrowRight size={14}/>
      </Link>
    </div>
  );
}