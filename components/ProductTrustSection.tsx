'use client';
import Accordion from '@/components/Accordion';
import { ShieldCheck, Truck, RefreshCw, CreditCard } from 'lucide-react';

export default function ProductTrustSection() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm mt-8">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <ShieldCheck className="text-green-600" size={20} />
        <h3 className="font-bold text-gray-800 text-sm md:text-base">MOM&BABY 安心サポート</h3>
      </div>
      
      <div className="divide-y divide-gray-100 px-2">
        <Accordion title="🚚 配送について">
          <div className="text-xs md:text-sm text-gray-600 space-y-2 pb-2">
             <p>・<span className="font-bold">日本国内発送</span>：ご注文確定後、最短3日でお届けします（土日祝を除く）。</p>
             <p>・配送状況はLINEまたはメールにて通知いたします。</p>
             <p>・10,000円以上のご注文で<span className="text-red-500 font-bold">送料無料</span>となります。</p>
          </div>
        </Accordion>

        <Accordion title="💳 お支払いについて">
          <div className="text-xs md:text-sm text-gray-600 space-y-2 pb-2">
             <p>・<span className="font-bold">代金引換（現金）</span>に対応しています。商品受け取り時に配達員にお支払いください。</p>
             <p>・手数料は決済画面でご確認いただけます。</p>
          </div>
        </Accordion>

        <Accordion title="↩️ 返品・交換について">
          <div className="text-xs md:text-sm text-gray-600 space-y-2 pb-2">
             <p>・万が一商品に不備があった場合、到着後7日以内にご連絡ください。</p>
             <p>・サイズ交換などのご相談もLINE窓口にて承っております。</p>
          </div>
        </Accordion>
        
        <Accordion title="✨ 品質・検品体制">
          <div className="text-xs md:text-sm text-gray-600 space-y-2 pb-2">
             <p>・ママスタッフが1点ずつ丁寧に検品してから発送しております。</p>
             <p>・赤ちゃんのお肌に触れるものだからこそ、安心・安全を最優先に管理しています。</p>
          </div>
        </Accordion>
      </div>
    </div>
  );
}