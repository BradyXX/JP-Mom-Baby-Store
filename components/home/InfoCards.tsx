
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
        Layout:
        Mobile (< md): Vertical Grid (Stacked), 1 column. NO Swipe.
        Desktop (>= md): Grid, 3 columns.
      */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        
        {/* Card 1: Support / LINE (Clickable) */}
        <Link 
           href={lineUrl}
           target="_blank"
           className="bg-white p-5 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 flex items-center md:items-start gap-4 hover:shadow-md transition-shadow active:scale-[0.98] md:active:scale-100 md:flex-col md:text-center group"
        >
          <div className="w-12 h-12 md:w-16 md:h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 flex-shrink-0 md:mx-auto">
            <Headphones size={24} className="md:w-8 md:h-8" />
          </div>
          <div className="flex-1 md:w-full">
            <h3 className="font-bold text-gray-800 text-sm md:text-lg mb-0.5 md:mb-2">迅速対応</h3>
            <span className="text-xs md:text-sm font-bold text-green-600 flex md:justify-center items-center gap-1 mb-1 md:mb-3">
              LINE：公式サポート
            </span>
            <p className="text-xs text-gray-500 leading-relaxed md:px-2">
              育児中でもスキマ時間に相談OK。<br className="hidden md:block"/>スタッフが迅速に対応します。
            </p>
          </div>
        </Link>

        {/* Card 2: Quality (Non-clickable link, just visual card) */}
        <div className="bg-white p-5 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 flex items-center md:items-start gap-4 md:flex-col md:text-center">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 flex-shrink-0 md:mx-auto">
            <ShieldCheck size={24} className="md:w-8 md:h-8" />
          </div>
          <div className="flex-1 md:w-full">
            <h3 className="font-bold text-gray-800 text-sm md:text-lg mb-0.5 md:mb-2">高品質へのこだわり</h3>
            {/* Spacer/Subtitle equivalent for alignment */}
            <div className="hidden md:block h-3 mb-3" />
            
            <p className="text-xs text-gray-500 leading-relaxed md:px-2">
              ママ目線で厳選。<br className="hidden md:block"/>安心して使える品質をお届けします。
            </p>
          </div>
        </div>

        {/* Card 3: Delivery */}
        <div className="bg-white p-5 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 flex items-center md:items-start gap-4 md:flex-col md:text-center">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0 md:mx-auto">
            <Truck size={24} className="md:w-8 md:h-8" />
          </div>
          <div className="flex-1 md:w-full">
            <h3 className="font-bold text-gray-800 text-sm md:text-lg mb-0.5 md:mb-2">スピード配送</h3>
            {/* Spacer/Subtitle equivalent for alignment */}
            <div className="hidden md:block h-3 mb-3" />

            <p className="text-xs text-gray-500 leading-relaxed md:px-2">
              日本国内発送。<br className="hidden md:block"/>ご注文から最短3日でお届けします。
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
