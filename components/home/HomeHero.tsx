
'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

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

  // Fallback: Check if AT LEAST one image exists
  const validSlides = slides.filter(s => 
    (s.image_url && s.image_url.trim() !== '') || 
    (s.mobile_image_url && s.mobile_image_url.trim() !== '')
  );

  // Auto-play logic
  useEffect(() => {
    if (validSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [validSlides.length]);

  // Render Fallback if absolutely no images
  if (validSlides.length === 0) {
    return (
      <section className="container-base mt-4 md:mt-6">
        <div className="w-full h-[200px] md:h-[450px] bg-gray-100 rounded-3xl flex flex-col items-center justify-center text-center p-6 border border-gray-200">
           <h2 className="text-xl md:text-2xl font-black text-gray-300 tracking-widest uppercase">MOM & BABY</h2>
           <p className="text-gray-400 text-xs md:text-sm font-medium mt-2">Welcome to our store</p>
        </div>
      </section>
    );
  }

  return (
    <section className="container-base mt-4 md:mt-6">
      <div className="relative w-full rounded-3xl overflow-hidden shadow-sm bg-gray-100">
        
        {/* Aspect Ratio Container: 
            Mobile: Typically 4:3 or 1:1 depending on content, here we use h-auto with min-height or aspect ratio control.
            Desktop: Fixed height or 21:9 ratio.
        */}
        <div className="relative w-full h-[55vw] min-h-[200px] md:h-[480px] md:min-h-[400px]">
          {validSlides.map((slide, index) => {
             // Logic: Prefer mobile img on mobile, desktop img on desktop. Fallback to each other.
             const desktopSrc = slide.image_url || slide.mobile_image_url || '';
             const mobileSrc = slide.mobile_image_url || slide.image_url || '';
             const altText = slide.alt || 'Banner';
             
             const isActive = index === currentIndex;

             return (
              <div 
                key={index} 
                className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
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

                {/* Clickable Overlay */}
                {slide.link && (
                   <Link href={slide.link} className="absolute inset-0 z-20" aria-label={altText} />
                )}
              </div>
            );
          })}
        </div>

        {/* Indicators (Dots) */}
        {validSlides.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
            {validSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentIndex === idx ? 'bg-white w-6' : 'bg-white/60 w-1.5'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
