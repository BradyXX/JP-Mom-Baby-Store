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
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

  // Fix: Added HTMLButtonElement generic type to React.MouseEvent to resolve TargetedMouseEvent requirement
  const handleOpenLine = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!lineData) return;
    
    // Attempt robust redirection logic
    const start = Date.now();
    window.location.href = lineData.schemeLink;

    setTimeout(() => {
      // If after 500ms we're still here, try Universal Link
      window.location.href = lineData.universalLink;

      setTimeout(() => {
        // If after another 800ms we're still here, show manual fallback modal
        if (Date.now() - start < 2500) {
          setShowFallbackModal(true);
        }
      }, 800);
    }, 500);
  };

  // Fix: Added HTMLButtonElement generic type to React.MouseEvent to resolve TargetedMouseEvent requirement
  const handleCopy = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
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
      {/* Status Icon */}
      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-6 animate-in zoom-in duration-500">
        <CheckCircle2 size={44} strokeWidth={2.5} />
      </div>

      <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">注文を承りました</h1>
      <p className="text-gray-500 mb-10 text-sm md:text-base">
        注文番号: <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{orderNo}</span>
      </p>

      {/* Core Action Card */}
      <div className="w-full bg-white border border-gray-100 p-6 md:p-10 rounded-[2.5rem] mb-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#06C755]"></div>
        
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-amber-600 mb-4">
            <AlertTriangle size={20} className="shrink-0" />
            <span className="font-bold text-base md:text-lg">最後の手続きが必要です</span>
          </div>
          
          <p className="text-sm text-gray-600 mb-8 leading-relaxed text-center">
            配送手配を確定させるため、下のボタンから<br className="hidden md:block" />
            <b>LINEで注文メッセージを送信</b>してください。
          </p>
          
          <div className="w-full space-y-4">
            <button 
              onClick={handleOpenLine}
              className="flex items-center justify-center gap-3 w-full bg-[#06C755] text-white py-4 md:py-5 rounded-2xl font-bold text-lg md:text-xl shadow-lg hover:shadow-[#06C755]/30 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <MessageCircle size={24} fill="white" />
              LINEでメッセージを送る
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={(e) => handleCopy(e)}
                className={cn(
                  "flex items-center justify-center gap-2 py-4 px-4 rounded-xl text-sm font-bold transition-all border",
                  copied 
                    ? "bg-green-50 border-green-200 text-green-600" 
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'コピー完了' : '注文情報をコピー'}
              </button>

              <a 
                href={lineData.addFriendLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-4 px-4 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
              >
                公式LINEを開く
                <ExternalLink size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Nav */}
      <div className="flex flex-col items-center gap-6">
        <Link 
          href="/" 
          className="text-gray-400 hover:text-primary transition-colors flex items-center gap-1.5 text-sm font-medium group"
        >
          トップページに戻る 
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
        
        <p className="text-[11px] text-gray-300 max-w-xs text-center">
          ※LINEが起動しない場合は、「注文情報をコピー」してから公式LINEに貼り付けて送信してください。
        </p>
      </div>

      {/* Manual Fallback Modal */}
      {showFallbackModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in duration-200">
            <button 
              onClick={() => setShowFallbackModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">LINEを起動できませんでした</h3>
              <p className="text-sm text-gray-500">
                お使いの端末でLINE Appを直接開くことができませんでした。以下の手順で注文を完了してください。
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">手順 1</p>
                <button 
                  onClick={() => handleCopy()}
                  className={cn(
                    "w-full py-3 px-4 rounded-xl flex items-center justify-between font-bold text-sm transition-all",
                    copied ? "bg-green-500 text-white" : "bg-white border border-gray-200 text-gray-700"
                  )}
                >
                  注文メッセージをコピー
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">手順 2</p>
                <a 
                  href={lineData.addFriendLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-white border border-gray-200 rounded-xl flex items-center justify-between font-bold text-sm text-gray-700"
                >
                  公式LINEを開いて貼り付け
                  <ExternalLink size={18} />
                </a>
              </div>
              
              <button 
                onClick={() => setShowFallbackModal(false)}
                className="w-full py-3 text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}