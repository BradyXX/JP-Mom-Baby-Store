
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { AppSettings } from '@/lib/supabase/types';

interface HomeHeroProps {
  settings: AppSettings;
}

export default function HomeHero({ settings }: HomeHeroProps) {
  // 1. Safe extraction of slides
  const slides = (Array.isArray(settings.hero_slides) 
    ? settings.hero_slides 
    : []) as { image_url: string; link?: string; alt?: string }[];

  // 2. Strict validation: Must be string AND not empty
  const rawImage = slides[0]?.image_url;
  const isValidImage = typeof rawImage === 'string' && rawImage.trim().length > 0;

  // 3. Fallback UI (No next/image) to prevent Server Exception
  if (!isValidImage) {
    return (
        <section className="relative w-full h-[60vh] max-h-[500px] bg-gray-100 flex flex-col items-center justify-center text-center p-6 border-b border-gray-200">
            <h2 className="text-3xl font-black text-gray-300 mb-2 tracking-widest uppercase">
              {settings.shop_name || 'MOM & BABY'}
            </h2>
            <p className="text-gray-400 text-sm font-medium">Welcome to our store</p>
        </section>
    );
  }

  // 4. Safe Render with Correct Aspect Ratios
  return (
    <section className="relative w-full overflow-hidden">
      {/* 
         Requirement: Mobile ~60vh (4:5 feel), Desktop ~70vh
      */}
      <div className="relative w-full h-[60vh] md:h-[70vh] max-h-[800px] bg-gray-200">
        <Image 
          src={rawImage} 
          alt={slides[0]?.alt || 'Hero Image'} 
          fill 
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        
        {/* Text Overlay - Bottom Left aligned */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end">
           <div className="container-base w-full pb-16 md:pb-24 pl-6 md:pl-12">
              <div className="max-w-lg text-white drop-shadow-lg animate-in slide-in-from-bottom-4 duration-700">
                <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight whitespace-pre-line">
                  {settings.banner_text || '赤ちゃんとママの\n毎日を笑顔に'}
                </h2>
                {slides[0]?.link && (
                  <Link 
                    href={slides[0].link} 
                    className="inline-block bg-white text-gray-900 px-8 py-4 rounded-full font-bold text-sm md:text-base hover:bg-gray-100 transition-transform active:scale-95 shadow-md"
                  >
                    今すぐチェック
                  </Link>
                )}
              </div>
           </div>
        </div>
      </div>
    </section>
  );
}
