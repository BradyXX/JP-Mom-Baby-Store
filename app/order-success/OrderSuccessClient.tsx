'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, MessageCircle, Copy, ArrowRight, ExternalLink, AlertTriangle, Check, X } from 'lucide-react';
import { Order } from '@/lib/supabase/types';
import { 
  formatLineMessage, 
  formatShortLineMessage, 
  getLineUniversalLink, 
  getLineSchemeLink,
  getLineAddFriendLink 
} from '@/lib/utils/line';
import Link from 'next/link';

export default function OrderSuccessClient() {
  const searchParams = useSearchParams();
  const orderNo = searchParams.get('order_no');
  const [order, setOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);
  const [showFallbackModal, setShowFallbackModal] = useState(false);

  useEffect(() => {
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
    const schemeLink = getLineSchemeLink(order.line_oa_handle, shortMsg);
    const universalLink = getLineUniversalLink(order.line_oa_handle, shortMsg);
    const addFriendLink = getLineAddFriendLink(order.line_oa_handle);
    return { fullMsg, shortMsg, schemeLink, universalLink, addFriendLink };
  }, [order]);

  const handleOpenLine = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!lineData) return;
    const start = Date.now();
    window.location.href = lineData.schemeLink;
    setTimeout(() => {
      window.location.href = lineData.universalLink;
      setTimeout(() => {
        if (Date.now() - start < 2500) setShowFallbackModal(true);
      }, 800);
    }, 500);
  };

  const handleCopy = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!lineData) return;
    navigator.clipboard.writeText(lineData.fullMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!order || !lineData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <p className="text-gray-400 mb-4">注文情報が見つかりません。</p>
        <Link href="/" className="text-primary underline">トップページに戻る</Link>
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
            <span className="font-bold text-lg">重要なお知らせ</span>
          </div>
          <p className="text-sm text-gray-600 mb-8 leading-relaxed text-center">
            配送手配を確定させるため、下のボタンから<br className="hidden md:block" />
            <b>LINEで注文メッセージを送信</b>してください。
          </p>
          <div className="w-full space-y-4">
            <button onClick={handleOpenLine} className="flex items-center justify-center gap-3 w-full bg-[#06C755] text-white py-5 rounded-2xl font-bold text-xl shadow-lg transition-transform active:scale-95">
              <MessageCircle size={24} fill="white" />
              LINEでメッセージを送る
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => handleCopy()} className={`flex items-center justify-center gap-2 py-4 px-4 rounded-xl text-sm font-bold border transition-colors ${copied ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-gray-600 border-gray-200'}`}>
                {copied ? <Check size={18}/> : <Copy size={18}/>}
                注文情報をコピー
              </button>
              <a href={lineData.addFriendLink} target="_blank" className="flex items-center justify-center gap-2 py-4 px-4 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold">
                公式LINEを追加
                <ExternalLink size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>

      <Link href="/" className="text-gray-400 hover:text-primary transition-colors flex items-center gap-1.5 text-sm font-medium">
        トップページに戻る <ArrowRight size={14} />
      </Link>

      {showFallbackModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in duration-200">
            <button onClick={() => setShowFallbackModal(false)} className="absolute top-4 right-4 p-2 text-gray-400"><X size={20}/></button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500"><AlertTriangle size={32}/></div>
              <h3 className="text-xl font-bold mb-2">LINEを起動できません</h3>
              <p className="text-sm text-gray-500">以下の手順で注文を完了してください。</p>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">STEP 1</p>
                <button onClick={() => handleCopy()} className="w-full py-3 px-4 bg-white border border-gray-200 rounded-xl flex items-center justify-between font-bold text-sm text-gray-700">
                  メッセージをコピー {copied ? <Check size={18} className="text-green-500"/> : <Copy size={18}/>}
                </button>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">STEP 2</p>
                <a href={lineData.addFriendLink} target="_blank" className="w-full py-3 px-4 bg-white border border-gray-200 rounded-xl flex items-center justify-between font-bold text-sm text-gray-700">
                  公式LINEを開いて貼り付け <ExternalLink size={18}/>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
