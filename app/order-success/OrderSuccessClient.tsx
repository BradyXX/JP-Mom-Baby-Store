'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, MessageCircle, Copy, ArrowRight, ExternalLink, AlertTriangle, Check } from 'lucide-react';
import { Order } from '@/lib/supabase/types';
import { 
  formatLineMessage, 
  formatShortLineMessage, 
  getLineDeepLink, 
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 检测是否为移动端
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    
    const stored = sessionStorage.getItem('last_order');
    if (stored) {
      const parsed = JSON.parse(stored) as Order;
      if (parsed.order_no === orderNo) {
        setOrder(parsed);
        // Debug 信息，仅在控制台显示
        console.log('Order Success Initialized:', {
          order_no: parsed.order_no,
          handle: parsed.line_oa_handle,
          items_count: parsed.items.length
        });
      }
    }
  }, [orderNo]);

  // 计算不同版本的链接和内容
  const lineData = useMemo(() => {
    if (!order) return null;
    
    const fullMsg = formatLineMessage(order);
    const shortMsg = formatShortLineMessage(order);
    
    // 手机端强制使用短消息以保证 DeepLink 稳定，PC端使用短消息或完整消息均可，这里统一使用短消息提升兼容性
    const deepLink = getLineDeepLink(order.line_oa_handle, shortMsg);
    const addFriendLink = getLineAddFriendLink(order.line_oa_handle);

    return { fullMsg, shortMsg, deepLink, addFriendLink };
  }, [order]);

  // Fix: Added HTMLButtonElement type argument to React.MouseEvent to resolve the "Generic type 'TargetedMouseEvent' requires 1 type argument(s)" error.
  const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
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
      {/* 状态图标 */}
      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-6 animate-in zoom-in duration-500">
        <CheckCircle2 size={44} strokeWidth={2.5} />
      </div>

      <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">注文を承りました</h1>
      <p className="text-gray-500 mb-10 text-sm md:text-base">
        注文番号: <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{orderNo}</span>
      </p>

      {/* 核心操作卡片 */}
      <div className="w-full bg-white border border-gray-100 p-6 md:p-10 rounded-[2.5rem] mb-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden">
        {/* 顶部指示条 */}
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
          
          {/* 独立按钮组 - 不允许父级 Link */}
          <div className="w-full space-y-4">
            {/* 1. LINE Deep Link 按钮 - 使用 <a> 标签以保证 hover 显示 URL */}
            <a 
              href={lineData.deepLink}
              className="flex items-center justify-center gap-3 w-full bg-[#06C755] text-white py-4 md:py-5 rounded-2xl font-bold text-lg md:text-xl shadow-lg hover:shadow-[#06C755]/30 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <MessageCircle size={24} fill="white" />
              LINEでメッセージを送る
            </a>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 2. 复制按钮 */}
              <button 
                onClick={handleCopy}
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

              {/* 3. OA 链接按钮 */}
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

        {/* 调试信息 (仅对开发人员可见，通过 console 或隐藏 div) */}
        <div className="hidden">
           <p>DeepLink Length: {lineData.deepLink.length}</p>
        </div>
      </div>

      {/* 底部导航 */}
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
    </div>
  );
}