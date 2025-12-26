
'use client';
import { Headphones, ShieldCheck, Truck } from 'lucide-react';
import Link from 'next/link';

interface InfoCardsProps {
  lineUrl: string;
}

export default function InfoCards({ lineUrl }: InfoCardsProps) {
  return (
    <section className="container-base mt-6 md:mt-8">
      {/* 
        Layout Strategy:
        Mobile (< md): Flex row, overflow-x-auto (horizontal scroll), snap scrolling. 
                      Negative margins to allow full-width bleeding while keeping padding.
        Desktop (>= md): Grid layout, 3 columns, auto height.
      */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 scrollbar-hide md:grid md:grid-cols-3 md:gap-6 md:mx-0 md:px-0 md:pb-0">
        
        {/* Card 1: Support / LINE (Clickable) */}
        <Link 
           href={lineUrl}
           target="_blank"
           className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-start gap-4 hover:shadow-md transition-shadow min-w-[85vw] md:min-w-0 flex-shrink-0 snap-center h-full"
        >
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">
            <Headphones size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 text-base mb-1">迅速対応</h3>
            <span className="text-sm font-bold text-green-600 inline-flex items-center gap-1 mb-2">
              LINE：公式サポート
            </span>
            <p className="text-xs text-gray-500 leading-relaxed">
              育児中でもスキマ時間にご相談OK。<br/>スタッフが迅速に対応します。
            </p>
          </div>
        </Link>

        {/* Card 2: Quality (Static) */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-start gap-4 min-w-[85vw] md:min-w-0 flex-shrink-0 snap-center h-full">
          <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 flex-shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 text-base mb-1">高品質へのこだわり</h3>
            <div className="h-6 md:h-7 mb-1" /> {/* Spacer to align text if needed, or remove */}
            <p className="text-xs text-gray-500 leading-relaxed">
              ママ目線で厳選。<br/>安心して使える品質をお届けします。
            </p>
          </div>
        </div>

        {/* Card 3: Delivery (Static) */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-start gap-4 min-w-[85vw] md:min-w-0 flex-shrink-0 snap-center h-full">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
            <Truck size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 text-base mb-1">スピード配送</h3>
            <div className="h-6 md:h-7 mb-1" /> {/* Spacer */}
            <p className="text-xs text-gray-500 leading-relaxed">
              日本国内発送。<br/>ご注文から最短3日でお届けします。
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
