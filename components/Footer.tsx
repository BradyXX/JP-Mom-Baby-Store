'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Mail, ChevronDown } from 'lucide-react';

// Reusable Accordion Wrapper for Footer Columns (Mobile Only)
function FooterColumn({ title, children }: { title: string, children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 md:border-none last:border-0 md:last:border-0">
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex md:hidden items-center justify-between w-full py-4 text-left group"
      >
        <h5 className="font-bold text-gray-800 text-sm">{title}</h5>
        <ChevronDown 
           size={16} 
           className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Desktop Header */}
      <h5 className="hidden md:block font-bold text-gray-800 mb-4 text-sm">{title}</h5>

      {/* Content */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out md:max-h-none md:opacity-100 md:mb-0 ${
        isOpen ? 'max-h-60 opacity-100 mb-4' : 'max-h-0 opacity-0 md:h-auto'
      }`}>
        {children}
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 pt-8 md:pt-12 pb-24 md:pb-8">
      <div className="container-base grid grid-cols-1 md:grid-cols-4 gap-0 md:gap-8 mb-8 md:mb-12">
        
        {/* Brand Section (Always Visible) */}
        <div className="space-y-4 py-4 md:py-0 border-b border-gray-100 md:border-none">
          <h4 className="font-bold text-gray-900 text-lg tracking-tight">MOM<span className="text-accent">&</span>BABY</h4>
          <p className="text-sm text-gray-500 leading-relaxed">
            日本のお母さんと赤ちゃんのために、<br />
            安心・安全な商品をお届けします。
          </p>
          <div className="flex gap-2 pt-2">
             <div className="flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded text-xs text-gray-600">
                <ShieldCheck size={14} className="text-green-600"/> 安心検品
             </div>
             <div className="flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded text-xs text-gray-600">
                <Mail size={14} className="text-blue-600"/> 国内対応
             </div>
          </div>
        </div>
        
        {/* Collapsible Sections on Mobile */}
        <FooterColumn title="ショップ">
          <ul className="space-y-3 text-sm text-gray-600 pl-1 md:pl-0">
            <li><Link href="/collections/all" className="hover:text-primary transition-colors">全商品一覧</Link></li>
            <li><Link href="/collections/new" className="hover:text-primary transition-colors">新着アイテム</Link></li>
            <li><Link href="/collections/sale" className="hover:text-primary transition-colors text-red-600 font-bold">セール会場</Link></li>
          </ul>
        </FooterColumn>

        <FooterColumn title="サポート・ヘルプ">
          <ul className="space-y-3 text-sm text-gray-600 pl-1 md:pl-0">
            <li><Link href="#" className="hover:text-primary transition-colors flex items-center gap-2">お問い合わせ (LINE)</Link></li>
            <li><Link href="#" className="hover:text-primary transition-colors">配送・送料について</Link></li>
            <li><Link href="#" className="hover:text-primary transition-colors">返品・交換ポリシー</Link></li>
            <li><Link href="#" className="hover:text-primary transition-colors">特定商取引法に基づく表記</Link></li>
            <li><Link href="#" className="hover:text-primary transition-colors">プライバシーポリシー</Link></li>
          </ul>
        </FooterColumn>

        <FooterColumn title="お支払い方法">
          <div className="space-y-3 pl-1 md:pl-0">
             <div className="flex items-center gap-2 text-sm text-gray-600 bg-white p-2 rounded border border-gray-100 shadow-sm w-fit">
                <span className="font-bold border border-gray-300 rounded px-1 text-xs">現金</span>
                代金引換対応
             </div>
             <p className="text-xs text-gray-400 leading-tight">
               商品受け取り時に配達員にお支払いください。<br/>
               安心・安全な決済方法です。
             </p>
          </div>
        </FooterColumn>

      </div>
      
      <div className="container-base border-t border-gray-200 pt-8 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} MOM&BABY Japan. All rights reserved.
      </div>
    </footer>
  );
}