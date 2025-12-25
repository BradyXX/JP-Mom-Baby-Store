
'use client';
import React, { useRef } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface CarouselProps {
  title?: string;
  moreLink?: string;
  children: React.ReactNode;
}

export default function Carousel({ title, moreLink, children }: CarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="py-8 border-b border-gray-100 last:border-0">
      <div className="container-base mb-6 flex items-center justify-between">
        {title && <h2 className="text-xl font-bold text-gray-800">{title}</h2>}
        {moreLink && (
          <Link href={moreLink} className="text-xs text-gray-500 flex items-center hover:text-primary transition-colors">
            もっと見る <ChevronRight size={14} />
          </Link>
        )}
      </div>
      
      {/* Scroll Container */}
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-4 sm:px-6 lg:px-8 pb-4 scrollbar-hide -mx-4 sm:mx-0 sm:px-0"
      >
        {children}
        {/* Spacer for right padding on mobile */}
        <div className="w-1 flex-shrink-0" />
      </div>
    </div>
  );
}
