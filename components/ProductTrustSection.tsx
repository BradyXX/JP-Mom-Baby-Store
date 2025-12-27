'use client';
import React from 'react';
import Accordion from '@/components/Accordion';
import { ShieldCheck, Truck, RefreshCw, Scale } from 'lucide-react';

export default function ProductTrustSection() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm mt-8">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <ShieldCheck className="text-green-600" size={20} />
        <h3 className="font-bold text-gray-800 text-sm md:text-base">安心サポート・規約</h3>
      </div>
      
      <div className="divide-y divide-gray-100 px-2">
        <Accordion title="🚚 配送について">
          <div className="text-xs md:text-sm text-gray-600 space-y-2 pb-2">
             <p>・<span className="font-bold">日本国内発送</span>：ご注文確定後、最短3日でお届けします（土日祝を除く）。</p>
             <p>・配送状況はLINEまたはメールにて通知いたします。</p>
             <p>・10,000円以上のご注文で<span className="text-red-500 font-bold">送料無料</span>となります。</p>
          </div>
        </Accordion>

        <Accordion title="↩️ 返品・交換について">
          <div className="text-xs md:text-sm text-gray-600 space-y-2 pb-2">
             <p>・万が一商品に不備があった場合、到着後7日以内にご連絡ください。</p>
             <p>・お客様都合（サイズが合わない等）による交換もLINE窓口にてご相談承ります。</p>
          </div>
        </Accordion>
        
        <Accordion title="⚖️ 特定商取引法に基づく表記">
          <div className="text-xs md:text-sm text-gray-600 space-y-2 pb-2">
             <p>・販売業者：MOM&BABY Japan</p>
             <p>・支払方法：代金引換（現金のみ）</p>
             <p>・引渡時期：注文確定後、通常3営業日以内に発送</p>
          </div>
        </Accordion>
      </div>
    </div>
  );
}