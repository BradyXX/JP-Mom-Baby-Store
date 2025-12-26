
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { AppSettings } from '@/lib/supabase/types';

interface HomeHeroProps {
  settings: AppSettings;
}

export default function HomeHero({ settings }: HomeHeroProps) {
  // Safe cast for JSONB
  const slides = (Array.isArray(settings.hero_slides) 
    ? settings.hero_slides 
    : []) as { image_url: string; link?: string; alt?: string }[];

  const hasSlides = slides.length > 0 && slides[0].image_url;
  const heroImage = hasSlides ? slides[0].image_url : null;

  // Fallback UI if no slides
  if (!heroImage) {
    return (
        <section className="relative w-full h-[55vh] max-h-[400px] bg-gray-100 flex flex-col items-center justify-center text-center p-6">
            <h2 className="text-2xl font-bold text-gray-400 mb-2">MOM & BABY</h2>
            <p className="text-gray-400 text-sm">Welcome to our store</p>
        </section>
    );
  }

  return (
    <section className="relative w-full overflow-hidden">
      {/* 
         Aspect Ratio Strategy:
         Mobile: h-[58vh] (approx 4:5 ratio feel) to show big visual
         Desktop: h-[480px] to h-[560px] (widescreen banner feel)
      */}
      <div className="relative w-full h-[58vh] max-h-[500px] md:h-[480px] lg:h-[520px] bg-gray-200">
        <Image 
          src={heroImage} 
          alt={slides[0]?.alt || 'Hero Image'} 
          fill 
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        
        {/* Text Overlay - Bottom Left aligned like fashion brands */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end">
           <div className="container-base w-full pb-12 md:pb-16 pl-6 md:pl-12">
              <div className="max-w-lg text-white drop-shadow-md">
                <h2 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight whitespace-pre-line">
                  {settings.banner_text || '赤ちゃんとママの\n毎日を笑顔に'}
                </h2>
                {slides[0]?.link && (
                  <Link 
                    href={slides[0].link} 
                    className="inline-block bg-white text-gray-900 px-8 py-3.5 rounded-full font-bold text-sm hover:bg-gray-100 transition-transform active:scale-95"
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
