'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, MessageCircle, Copy, ArrowRight, ExternalLink, AlertTriangle, Check } from 'lucide-react';
import { Order } from '@/lib/supabase/types';
import { 
  formatLineMessage, 
  formatShortLineMessage, 
  getLineOrderLink,
  getLineAddFriendLink 
} from '@/lib/utils/line';
import Link from 'next/link';

export default function OrderSuccessClient() {
  const searchParams = useSearchParams();
  const orderNo = searchParams.get('order_no');
  const [order, setOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // 从 SessionStorage 恢复订单数据
    // 这里的 order 对象中包含了 checkout 时已经确定并保存的 line_oa_handle
    const stored = sessionStorage.getItem('last_order');
    if (stored) {
      const parsed = JSON.parse(stored) as Order;
      if (parsed.order_no === orderNo) {
        setOrder(parsed);
      }
    }
  }, [orderNo]);

  const lineData = useMemo(() => {
    if (!order) return null;
    const fullMsg = formatLineMessage(order);
    const shortMsg = formatShortLineMessage(order);
    
    // 这里的 order.line_oa_handle 已经在 checkout 阶段被 normalizeHandle 处理过了
    // 但为了双重保险，getLineOrderLink 内部会再次 normalize
    return {
      fullMsg,
      orderLink: getLineOrderLink(order.line_oa_handle, shortMsg),
      friendLink: getLineAddFriendLink(order.line_oa_handle)
    };
  }, [order]);

  const handleLineClick = () => {
    if (lineData) {
      window.location.href = lineData.orderLink;
    }
  };

  const handleCopy = () => {
    if (!lineData) return;
    navigator.clipboard.writeText(lineData.fullMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!order || !lineData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <p className="text-gray-400 mb-4">注文情報が見つかりません。</p>
        <Link href="/" className="text-primary underline text-sm">トップページに戻る</Link>
      </div>
    );
  }

  return (
    <div className="container-base py-8 md:py-20 flex flex-col items-center px-4 max-w-2xl mx-auto">
      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-6">
        <CheckCircle2 size={44} strokeWidth={2.5} />
      </div>

      <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900 text-center">注文を承りました</h1>
      <p className="text-gray-500 mb-10 text-sm">
        注文番号: <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{orderNo}</span>
      </p>

      <div className="w-full bg-white border border-gray-100 p-6 md:p-10 rounded-3xl mb-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#06C755]"></div>
        
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-amber-600 mb-4">
            <AlertTriangle size={20} />
            <span className="font-bold text-lg">重要なお願い</span>
          </div>
          <p className="text-sm text-gray-600 mb-8 leading-relaxed text-center font-medium">
            配送手配を確定させるため、以下のボタンから<br />
            <b>LINEで注文メッセージを送信</b>してください。
          </p>
          
          <div className="w-full space-y-4">
            {/* 主跳转按钮: 严格执行 Universal Link 跳转 */}
            <button 
              onClick={handleLineClick}
              className="flex items-center justify-center gap-3 w-full bg-[#06C755] text-white py-5 rounded-2xl font-bold text-xl shadow-lg active:scale-95 transition-transform"
            >
              <MessageCircle size={24} fill="white" />
              LINEでメッセージを送る
            </button>

            {/* 辅助操作栏 */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleCopy}
                className={`flex items-center justify-center gap-2 py-4 px-4 rounded-xl text-sm font-bold border transition-colors ${
                  copied ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {copied ? <Check size={18}/> : <Copy size={18}/>}
                情報をコピー
              </button>
              <a 
                href={lineData.friendLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-4 px-4 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold"
              >
                公式LINE
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>

      <Link href="/" className="text-gray-400 hover:text-primary flex items-center gap-1.5 text-sm transition-colors">
        トップページに戻る <ArrowRight size={14} />
      </Link>
    </div>
  );
}
