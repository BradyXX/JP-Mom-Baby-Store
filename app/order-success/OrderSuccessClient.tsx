'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, MessageCircle, Copy, ArrowRight, X, ExternalLink, AlertTriangle } from 'lucide-react';
import { Order } from '@/lib/supabase/types';
import { formatLineMessage, formatShortLineMessage, getLineDeepLink, getLineAddFriendLink, getLineTextScheme } from '@/lib/utils/line';
import Link from 'next/link';

export default function OrderSuccessClient() {
  const searchParams = useSearchParams();
  const orderNo = searchParams.get('order_no');
  const [order, setOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [links, setLinks] = useState({
    primary: '#',
    fallback: '#',
    addFriend: '#',
    fullText: ''
  });

  useEffect(() => {
    const stored = sessionStorage.getItem('last_order');
    if (stored) {
      const parsed = JSON.parse(stored) as Order;
      if (parsed.order_no === orderNo) {
        setOrder(parsed);
        
        const fullMsg = formatLineMessage(parsed);
        const shortMsg = formatShortLineMessage(parsed);
        
        setLinks({
          primary: getLineDeepLink(parsed.line_oa_handle, shortMsg),
          fallback: getLineTextScheme(shortMsg),
          addFriend: getLineAddFriendLink(parsed.line_oa_handle),
          fullText: fullMsg
        });
      }
    }
  }, [orderNo]);

  const handleCopy = () => {
    navigator.clipboard.writeText(links.fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Fixed: Generic type 'React.MouseEvent' requires 1 type argument(s).
  const handleLineClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Immediate redirect attempt
    window.location.href = links.primary;
    
    // Show fallback modal after a short delay if nothing happened
    setTimeout(() => {
      setShowModal(true);
    }, 2000);
  };

  if (!order) return (
    <div className="container-base py-32 text-center text-gray-400">
      注文情報が見つかりません。
    </div>
  );

  return (
    <div className="container-base py-12 md:py-20 flex flex-col items-center max-w-2xl text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 animate-in zoom-in duration-500">
        <CheckCircle2 size={40} />
      </div>
      <h1 className="text-3xl font-bold mb-2">注文を承りました</h1>
      <p className="text-gray-500 mb-10">
        注文番号: <span className="font-mono text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{orderNo}</span>
      </p>

      {/* Main Action Area */}
      <div className="w-full bg-white border-2 border-green-500 p-6 md:p-8 rounded-3xl mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
        <h2 className="font-bold text-xl mb-4 flex items-center justify-center gap-2">
          <AlertTriangle className="text-amber-500" size={24} />
          <span>最後の手続きが必要です</span>
        </h2>
        <p className="text-sm text-gray-600 mb-8 leading-relaxed">
          配送手配を確定させるため、下のボタンから<br className="hidden sm:block" />
          <b>LINEで注文メッセージを送信</b>してください。
        </p>
        
        <button 
          onClick={handleLineClick}
          className="block w-full bg-[#06C755] text-white py-4 rounded-full font-bold shadow-lg hover:bg-[#05b14c] transition-all flex items-center justify-center gap-3 mb-6 text-lg active:scale-95"
        >
          <MessageCircle size={24} />
          LINEでメッセージを送る
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button 
            onClick={handleCopy} 
            className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-sm font-medium transition-colors border border-gray-200"
          >
            {copied ? 'コピーしました！' : '注文情報をコピー'}
            <Copy size={16} />
          </button>
          <a 
            href={links.addFriend}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-sm font-medium transition-colors border border-gray-200"
          >
            公式LINEを開く
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      <Link href="/" className="text-gray-400 hover:text-primary transition-colors flex items-center gap-1 text-sm">
        トップページに戻る <ArrowRight size={14}/>
      </Link>

      {/* Manual Fallback Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-6 text-center">
              <div className="flex justify-end mb-2">
                <button onClick={() => setShowModal(false)} className="text-gray-400 p-1 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={32} />
              </div>
              
              <h3 className="text-lg font-bold mb-3">LINEが開けませんか？</h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                自動的にLINEが起動しない場合は、下記の手順で注文を完了させてください。
              </p>
              
              <div className="space-y-4">
                <div className="text-left text-xs bg-gray-50 p-4 rounded-xl space-y-3">
                  <div className="flex gap-3">
                    <span className="w-5 h-5 bg-primary text-white flex items-center justify-center rounded-full shrink-0 font-bold">1</span>
                    <p>下のボタンで<b>注文情報をコピー</b>します</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-5 h-5 bg-primary text-white flex items-center justify-center rounded-full shrink-0 font-bold">2</span>
                    <p>「LINEを開く」からチャット画面へ移動します</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-5 h-5 bg-primary text-white flex items-center justify-center rounded-full shrink-0 font-bold">3</span>
                    <p>コピーした内容を<b>貼り付けて送信</b>します</p>
                  </div>
                </div>

                <button 
                  onClick={handleCopy}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Copy size={20} />
                  {copied ? 'コピー完了！' : '注文情報をコピー'}
                </button>

                <a 
                  href={links.addFriend}
                  className="w-full py-4 bg-[#06C755] text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-md"
                >
                  <MessageCircle size={20} />
                  LINEを開く
                </a>
              </div>
            </div>
            
            <button 
              onClick={() => setShowModal(false)}
              className="w-full py-4 bg-gray-50 text-gray-400 text-sm border-t font-medium hover:bg-gray-100"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}