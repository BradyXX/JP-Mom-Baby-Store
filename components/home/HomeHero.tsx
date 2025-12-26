
'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  image_url: string;        // Desktop
  mobile_image_url?: string; // Mobile
  link?: string;
  alt?: string;
}

interface HomeHeroProps {
  slides: Slide[];
}

export default function HomeHero({ slides }: HomeHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Fallback: Check if AT LEAST one image exists (desktop or mobile)
  const validSlides = slides.filter(s => 
    (s.image_url && s.image_url.trim() !== '') || 
    (s.mobile_image_url && s.mobile_image_url.trim() !== '')
  );

  // Auto-play logic
  useEffect(() => {
    if (validSlides.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [validSlides.length, isHovered]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + validSlides.length) % validSlides.length);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % validSlides.length);
  };

  // Render Fallback if absolutely no images
  if (validSlides.length === 0) {
    return (
      <section className="container-base mt-4 md:mt-6">
        <div className="w-full h-[40vh] md:h-[450px] bg-gray-100 rounded-3xl flex flex-col items-center justify-center text-center p-6 border border-gray-200">
           <h2 className="text-2xl font-black text-gray-300 tracking-widest uppercase">MOM & BABY</h2>
           <p className="text-gray-400 text-sm font-medium mt-2">Welcome to our store</p>
        </div>
      </section>
    );
  }

  return (
    <section className="container-base mt-4 md:mt-6">
      <div 
        className="relative w-full h-[50vh] md:h-[480px] bg-gray-100 rounded-3xl overflow-hidden shadow-sm group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Slides Container */}
        <div 
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {validSlides.map((slide, index) => {
             // Fallback logic: if mobile missing, use desktop. If desktop missing, use mobile.
             const desktopSrc = slide.image_url || slide.mobile_image_url || '';
             const mobileSrc = slide.mobile_image_url || slide.image_url || '';
             const altText = slide.alt || 'Banner';

             return (
              <div key={index} className="relative w-full h-full flex-shrink-0">
                 {/* Desktop Image (Hidden on Mobile) */}
                 <div className="hidden md:block w-full h-full relative">
                    <Image 
                      src={desktopSrc} 
                      alt={altText} 
                      fill 
                      priority={index === 0}
                      sizes="1200px"
                      className="object-cover object-center"
                    />
                 </div>
                 
                 {/* Mobile Image (Hidden on Desktop) */}
                 <div className="block md:hidden w-full h-full relative">
                    <Image 
                      src={mobileSrc} 
                      alt={altText} 
                      fill 
                      priority={index === 0}
                      sizes="100vw"
                      className="object-cover object-center"
                    />
                 </div>

                {/* Optional: Clickable Overlay */}
                {slide.link && (
                   <Link href={slide.link} className="absolute inset-0 z-10" aria-label={altText} />
                )}
              </div>
            );
          })}
        </div>

        {/* Controls (Only if > 1 slide) */}
        {validSlides.length > 1 && (
          <>
            {/* Arrows */}
            <button 
              onClick={(e) => { e.stopPropagation(); prevSlide(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-20"
              aria-label="Previous slide"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); nextSlide(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-20"
              aria-label="Next slide"
            >
              <ChevronRight size={20} />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {validSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    currentIndex === idx ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
