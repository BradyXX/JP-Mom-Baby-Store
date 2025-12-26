'use client';
import { Headphones, ShieldCheck, Truck } from 'lucide-react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

interface InfoCardsProps {
  lineUrl: string;
}

export default function InfoCards({ lineUrl }: InfoCardsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll listener to update active dot
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const index = Math.round(el.scrollLeft / el.offsetWidth);
      setActiveIndex(index);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (index: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: index * scrollRef.current.offsetWidth,
        behavior: 'smooth'
      });
    }
  };

  const CardContent = ({ type }: { type: 'support' | 'quality' | 'delivery' }) => {
    if (type === 'support') {
      return (
        <Link 
           href={lineUrl}
           target="_blank"
           className="w-full h-full bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-2 md:gap-3 hover:shadow-md transition-shadow active:scale-[0.98] group"
        >
          {/* Reduced icon size for mobile */}
          <div className="w-10 h-10 md:w-16 md:h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-1">
            <Headphones size={20} className="md:hidden" />
            <Headphones size={32} className="hidden md:block" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm md:text-lg mb-0.5 md:mb-1">迅速対応</h3>
            <span className="text-xs md:text-sm font-bold text-green-600 inline-block mb-1 md:mb-2">
              LINE：公式サポート
            </span>
            <p className="text-[10px] md:text-xs text-gray-500 leading-tight md:leading-relaxed px-1">
              育児中でもスキマ時間に相談OK。<br className="hidden md:block"/>スタッフが迅速に対応します。
            </p>
          </div>
        </Link>
      );
    }
    if (type === 'quality') {
      return (
        <div className="w-full h-full bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-2 md:gap-3">
          <div className="w-10 h-10 md:w-16 md:h-16 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 mb-1">
            <ShieldCheck size={20} className="md:hidden" />
            <ShieldCheck size={32} className="hidden md:block" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm md:text-lg mb-0.5 md:mb-1">品質へのこだわり</h3>
            <p className="text-[10px] md:text-xs text-gray-500 leading-tight md:leading-relaxed px-1 mt-1">
              ママ目線で厳選。<br className="hidden md:block"/>安心して使える品質をお届けします。
            </p>
          </div>
        </div>
      );
    }
    // delivery
    return (
      <div className="w-full h-full bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-2 md:gap-3">
        <div className="w-10 h-10 md:w-16 md:h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-1">
          <Truck size={20} className="md:hidden" />
          <Truck size={32} className="hidden md:block" />
        </div>
        <div>
          <h3 className="font-bold text-gray-800 text-sm md:text-lg mb-0.5 md:mb-1">スピード配送</h3>
          <p className="text-[10px] md:text-xs text-gray-500 leading-tight md:leading-relaxed px-1 mt-1">
            日本国内発送。<br className="hidden md:block"/>ご注文から最短3日でお届け。
          </p>
        </div>
      </div>
    );
  };

  return (
    <section className="container-base mt-4 md:mt-8">
      
      {/* Mobile: Horizontal Snap Carousel (1 Card View, Compact Height) */}
      <div className="md:hidden relative">
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-0"
        >
          {/* Card 1 */}
          <div className="w-full flex-shrink-0 snap-center px-1">
             <div className="h-[140px]">
                <CardContent type="support" />
             </div>
          </div>
          {/* Card 2 */}
          <div className="w-full flex-shrink-0 snap-center px-1">
             <div className="h-[140px]">
                <CardContent type="quality" />
             </div>
          </div>
          {/* Card 3 */}
          <div className="w-full flex-shrink-0 snap-center px-1">
             <div className="h-[140px]">
                <CardContent type="delivery" />
             </div>
          </div>
        </div>
        
        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mt-3">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              onClick={() => scrollTo(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeIndex === idx ? 'bg-primary w-4' : 'bg-gray-200 w-1.5'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Desktop: 3 Column Grid (Unchanged) */}
      <div className="hidden md:grid md:grid-cols-3 gap-6">
        <CardContent type="support" />
        <CardContent type="quality" />
        <CardContent type="delivery" />
      </div>

    </section>
  );
}