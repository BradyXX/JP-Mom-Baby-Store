'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DescriptionSection {
  type?: 'text' | 'image' | 'bullets'; // Optional now
  title?: string;
  content?: string;
  url?: string;
  items?: string[];
}

export default function ProductDescription({ sections }: { sections: DescriptionSection[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // RULE: If empty, show placeholder (Do NOT fallback to old description)
  if (!Array.isArray(sections) || sections.length === 0) {
     return (
       <div className="py-8 text-center bg-gray-50 rounded-lg border border-gray-100 border-dashed">
         <p className="text-gray-400 text-sm font-medium">詳細説明は準備中です。</p>
       </div>
     );
  }

  return (
    <div className="relative">
      <div 
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
           isExpanded ? 'max-h-[5000px]' : 'max-h-[500px]'
        }`}
      >
        <div className="space-y-8 pb-4">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-3">
              {/* Title Support */}
              {section.title && (
                <h3 className="font-bold text-gray-800 text-base md:text-lg border-l-4 border-primary pl-3 py-1 bg-gray-50/50">
                  {section.title}
                </h3>
              )}

              {/* Content / Text Type */}
              {(section.content || section.type === 'text') && (
                <p className="text-gray-700 leading-8 whitespace-pre-wrap text-sm md:text-base">
                  {section.content}
                </p>
              )}

              {/* Image Type */}
              {section.type === 'image' && section.url && (
                <div className="relative w-full aspect-auto rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                   <img src={section.url} alt="" className="w-full h-auto block" loading="lazy" />
                </div>
              )}

              {/* Bullets Type */}
              {section.type === 'bullets' && section.items && (
                <ul className="list-disc pl-5 space-y-2 text-gray-700 text-sm md:text-base bg-gray-50 p-5 rounded-lg border border-gray-100">
                  {section.items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Fade overlay when collapsed */}
      {!isExpanded && (
         <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />
      )}

      {/* Toggle Button */}
      <div className="mt-6 text-center relative z-20">
         <button 
           onClick={() => setIsExpanded(!isExpanded)}
           className="inline-flex items-center gap-2 px-8 py-3 bg-white border border-gray-300 rounded-full text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-all active:scale-95"
         >
            {isExpanded ? (
               <>閉じる <ChevronUp size={16} /></>
            ) : (
               <>もっと見る <ChevronDown size={16} /></>
            )}
         </button>
      </div>
    </div>
  );
}