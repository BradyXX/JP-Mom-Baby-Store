import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8">
      <div className="container-base grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="space-y-4">
          <h4 className="font-bold text-gray-800">MOM&BABY</h4>
          <p className="text-sm text-gray-500 leading-relaxed">
            日本のお母さんと赤ちゃんのために、<br />
            安心・安全な商品をお届けします。
          </p>
        </div>
        
        <div>
          <h5 className="font-bold text-gray-800 mb-4 text-sm">ショップ</h5>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/collections/all" className="hover:text-primary">全商品</Link></li>
            <li><Link href="/collections/new" className="hover:text-primary">新着</Link></li>
            <li><Link href="/collections/sale" className="hover:text-primary">セール</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-gray-800 mb-4 text-sm">サポート</h5>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="#" className="hover:text-primary">お問い合わせ</Link></li>
            <li><Link href="#" className="hover:text-primary">配送について</Link></li>
            <li><Link href="#" className="hover:text-primary">返品・交換</Link></li>
            <li><Link href="#" className="hover:text-primary">プライバシーポリシー</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-gray-800 mb-4 text-sm">お支払い方法</h5>
          <div className="flex gap-2 text-gray-400 text-xs">
            <div className="border border-gray-200 rounded px-2 py-1">代金引換</div>
            <div className="border border-gray-200 rounded px-2 py-1">現金</div>
          </div>
        </div>
      </div>
      
      <div className="container-base border-t border-gray-200 pt-8 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} MOM&BABY Japan. All rights reserved.
      </div>
    </footer>
  );
}
