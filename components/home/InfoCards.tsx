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
           className="w-full h-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-3 hover:shadow-md transition-shadow active:scale-[0.98] group"
        >
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-1">
            <Headphones size={32} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg mb-1">迅速対応</h3>
            <span className="text-sm font-bold text-green-600 inline-block mb-2">
              LINE：公式サポート
            </span>
            <p className="text-xs text-gray-500 leading-relaxed px-2">
              育児中でもスキマ時間に相談OK。<br/>スタッフが迅速に対応します。
            </p>
          </div>
        </Link>
      );
    }
    if (type === 'quality') {
      return (
        <div className="w-full h-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 mb-1">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg mb-1">高品質へのこだわり</h3>
            <div className="h-4 md:mb-1" />
            <p className="text-xs text-gray-500 leading-relaxed px-2">
              ママ目線で厳選。<br/>安心して使える品質をお届けします。
            </p>
          </div>
        </div>
      );
    }
    // delivery
    return (
      <div className="w-full h-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-1">
          <Truck size={32} />
        </div>
        <div>
          <h3 className="font-bold text-gray-800 text-lg mb-1">スピード配送</h3>
          <div className="h-4 md:mb-1" />
          <p className="text-xs text-gray-500 leading-relaxed px-2">
            日本国内発送。<br/>ご注文から最短3日でお届けします。
          </p>
        </div>
      </div>
    );
  };

  return (
    <section className="container-base mt-6 md:mt-8">
      
      {/* Mobile: Horizontal Snap Carousel (1 Card View) */}
      <div className="md:hidden relative">
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 pb-4"
        >
          {/* Card 1 */}
          <div className="w-full flex-shrink-0 snap-center">
             <CardContent type="support" />
          </div>
          {/* Card 2 */}
          <div className="w-full flex-shrink-0 snap-center">
             <CardContent type="quality" />
          </div>
          {/* Card 3 */}
          <div className="w-full flex-shrink-0 snap-center">
             <CardContent type="delivery" />
          </div>
        </div>
        
        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mt-1">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              onClick={() => scrollTo(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeIndex === idx ? 'bg-primary w-6' : 'bg-gray-200 w-2'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Desktop: 3 Column Grid */}
      <div className="hidden md:grid md:grid-cols-3 gap-6">
        <CardContent type="support" />
        <CardContent type="quality" />
        <CardContent type="delivery" />
      </div>

    </section>
  );
}