import Link from 'next/link';
import { ShieldCheck, Mail, HelpCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 pt-12 pb-24 md:pb-8">
      <div className="container-base grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="space-y-4">
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
        
        <div>
          <h5 className="font-bold text-gray-800 mb-4 text-sm">ショップ</h5>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/collections/all" className="hover:text-primary transition-colors">全商品一覧</Link></li>
            <li><Link href="/collections/new" className="hover:text-primary transition-colors">新着アイテム</Link></li>
            <li><Link href="/collections/sale" className="hover:text-primary transition-colors text-red-600">セール会場</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-gray-800 mb-4 text-sm">サポート・ヘルプ</h5>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="#" className="hover:text-primary transition-colors flex items-center gap-2">お問い合わせ (LINE)</Link></li>
            <li><Link href="#" className="hover:text-primary transition-colors">配送・送料について</Link></li>
            <li><Link href="#" className="hover:text-primary transition-colors">返品・交換ポリシー</Link></li>
            <li><Link href="#" className="hover:text-primary transition-colors">特定商取引法に基づく表記</Link></li>
            <li><Link href="#" className="hover:text-primary transition-colors">プライバシーポリシー</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-gray-800 mb-4 text-sm">お支払い方法</h5>
          <div className="space-y-3">
             <div className="flex items-center gap-2 text-sm text-gray-600 bg-white p-2 rounded border border-gray-100 shadow-sm">
                <span className="font-bold border border-gray-300 rounded px-1 text-xs">現金</span>
                代金引換対応
             </div>
             <p className="text-xs text-gray-400 leading-tight">
               商品受け取り時に配達員にお支払いください。<br/>
               安心・安全な決済方法です。
             </p>
          </div>
        </div>
      </div>
      
      <div className="container-base border-t border-gray-200 pt-8 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} MOM&BABY Japan. All rights reserved.
      </div>
    </footer>
  );
}