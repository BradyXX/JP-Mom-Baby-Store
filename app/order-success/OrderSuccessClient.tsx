
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, MessageCircle, Copy, ArrowRight, ExternalLink, AlertTriangle, Check, X } from 'lucide-react';
import { Order } from '@/lib/supabase/types';
import { 
  formatLineMessage, 
  formatShortLineMessage, 
  getLineAddFriendLink,
  openLineDual,
  normalizeHandle
} from '@/lib/utils/line';
import Link from 'next/link';

export default function OrderSuccessClient() {
  const searchParams = useSearchParams();
  const orderNo = searchParams.get('order_no');
  const [order, setOrder] = useState<Order | null>(null);
  
  // States for Fallback Modal
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // 优先从 SessionStorage 读取，避免重复请求
    const stored = sessionStorage.getItem('last_order');
    if (stored) {
      const parsed = JSON.parse(stored) as Order;
      // 简单校验一下 ID 是否匹配，防止串单
      if (parsed.order_no === orderNo) {
        setOrder(parsed);
      }
    }
  }, [orderNo]);

  // Memoize data to avoid recalculations
  const lineData = useMemo(() => {
    if (!order) return null;
    
    // 确保 handle 格式正确
    const handle = normalizeHandle(order.line_oa_handle);
    const fullMsg = formatLineMessage(order);
    const shortMsg = formatShortLineMessage(order);
    const friendLink = getLineAddFriendLink(handle);

    return {
      handle,
      fullMsg,
      shortMsg,
      friendLink
    };
  }, [order]);

  // 核心点击事件：双线唤起
  const handleLineClick = () => {
    if (!lineData) return;

    // 尝试唤起 LINE，如果失败或超时，则显示 Modal
    openLineDual(
      lineData.handle,
      lineData.shortMsg,
      () => setShowModal(true) // Fallback callback
    );
  };

  const handleCopy = () => {
    if (!lineData) return;
    navigator.clipboard.writeText(lineData.fullMsg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      alert("コピーに失敗しました。手動でコピーしてください。");
    });
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
      {/* Success Icon */}
      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-6 animate-in zoom-in duration-300">
        <CheckCircle2 size={44} strokeWidth={2.5} />
      </div>

      <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900 text-center">注文を承りました</h1>
      <p className="text-gray-500 mb-10 text-sm">
        注文番号: <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{orderNo}</span>
      </p>

      {/* Main Action Card */}
      <div className="w-full bg-white border border-gray-100 p-6 md:p-10 rounded-3xl mb-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#06C755]"></div>
        
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-amber-600 mb-4 bg-amber-50 px-4 py-2 rounded-full">
            <AlertTriangle size={18} />
            <span className="font-bold text-sm">重要なお願い</span>
          </div>
          <p className="text-sm text-gray-600 mb-8 leading-relaxed text-center font-medium">
            配送手配を確定させるため、以下のボタンから<br />
            <span className="text-gray-900 font-bold">LINEで注文メッセージを送信</span>してください。
          </p>
          
          <div className="w-full space-y-4">
            {/* Primary Button */}
            <button 
              onClick={handleLineClick}
              className="group flex items-center justify-center gap-3 w-full bg-[#06C755] hover:bg-[#05b54c] text-white py-5 rounded-2xl font-bold text-xl shadow-lg active:scale-95 transition-all"
            >
              <MessageCircle size={28} fill="white" className="group-hover:scale-110 transition-transform"/>
              LINEでメッセージを送る
            </button>
            <p className="text-xs text-center text-gray-400">
              ※LINEアプリが自動的に開きます
            </p>
          </div>
        </div>
      </div>

      {/* Manual Actions (Small) */}
      <div className="flex gap-4 mb-8">
        <button 
           onClick={() => setShowModal(true)}
           className="text-sm text-gray-400 hover:text-gray-600 underline"
        >
           LINEが開かない場合
        </button>
      </div>

      <Link href="/" className="text-gray-400 hover:text-primary flex items-center gap-1.5 text-sm transition-colors">
        トップページに戻る <ArrowRight size={14} />
      </Link>

      {/* ==================== Fallback Modal ==================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
             <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
               <X size={20} />
             </button>
             
             <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">LINEが開かない場合</h3>
             <p className="text-sm text-gray-500 mb-6 text-center leading-relaxed">
               以下の手順で注文を完了させてください。
             </p>

             <div className="space-y-4">
               {/* Step 1: Copy */}
               <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-xs font-bold text-gray-400 uppercase">Step 1</span>
                     <span className="text-xs text-gray-400">注文情報をコピー</span>
                  </div>
                  <button 
                    onClick={handleCopy}
                    className={`w-full py-3 rounded-lg border flex items-center justify-center gap-2 text-sm font-bold transition-all ${
                      copied 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {copied ? <Check size={16}/> : <Copy size={16}/>}
                    {copied ? 'コピーしました！' : 'メッセージをコピー'}
                  </button>
               </div>

               {/* Step 2: Open Friend Link */}
               <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-xs font-bold text-gray-400 uppercase">Step 2</span>
                     <span className="text-xs text-gray-400">LINEを開いてペースト</span>
                  </div>
                  <a 
                    href={lineData.friendLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-[#06C755] text-white rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
                  >
                    公式LINEを開く
                    <ExternalLink size={16} />
                  </a>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
