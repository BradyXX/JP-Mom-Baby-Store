
'use client';
import { Headphones, ShieldCheck, Truck } from 'lucide-react';
import Link from 'next/link';

interface InfoCardsProps {
  lineUrl: string;
}

export default function InfoCards({ lineUrl }: InfoCardsProps) {
  return (
    <section className="container-base mt-6 md:mt-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        
        {/* Card 1: Support / LINE */}
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">
            <Headphones size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 mb-1 text-sm md:text-base">迅速対応</h3>
            <Link 
              href={lineUrl} 
              target="_blank" 
              className="text-xs md:text-sm font-bold text-green-600 hover:underline inline-flex items-center gap-1 mb-1"
            >
              LINE：公式サポート
            </Link>
            <p className="text-xs text-gray-500 leading-relaxed">
              育児中でもスキマ時間にご相談OK。スタッフが迅速に対応します。
            </p>
          </div>
        </div>

        {/* Card 2: Quality */}
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 flex-shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 mb-1 text-sm md:text-base">高品質へのこだわり</h3>
            <p className="text-xs text-gray-500 leading-relaxed mt-1">
              ママ目線で厳選。安心して使える品質をお届けします。
            </p>
          </div>
        </div>

        {/* Card 3: Delivery */}
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
            <Truck size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 mb-1 text-sm md:text-base">スピード配送</h3>
            <p className="text-xs text-gray-500 leading-relaxed mt-1">
              日本国内発送。ご注文から最短3日でお届けします。
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
