'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DescriptionSection {
  type: 'text' | 'image' | 'bullets';
  content?: string;
  url?: string;
  items?: string[];
}

export default function ProductDescription({ sections }: { sections: DescriptionSection[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sections || sections.length === 0) {
     return <p className="text-gray-500 text-sm py-4">詳細情報はありません。</p>;
  }

  // Preview shows only the first 2 sections or limited height
  // We'll use a CSS max-height transition strategy
  
  return (
    <div className="relative">
      <div 
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
           isExpanded ? 'max-h-[3000px]' : 'max-h-[400px]'
        }`}
      >
        <div className="space-y-6 pb-4">
          {sections.map((section, idx) => {
            if (section.type === 'text') {
              return <p key={idx} className="text-gray-700 leading-7 whitespace-pre-wrap text-sm md:text-base">{section.content}</p>;
            }
            if (section.type === 'image' && section.url) {
              return (
                <div key={idx} className="relative w-full aspect-auto rounded-lg overflow-hidden bg-gray-50">
                   <img src={section.url} alt="" className="w-full h-auto block" loading="lazy" />
                </div>
              );
            }
            if (section.type === 'bullets' && section.items) {
              return (
                <ul key={idx} className="list-disc pl-5 space-y-2 text-gray-700 text-sm md:text-base bg-gray-50 p-4 rounded-lg">
                  {section.items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              );
            }
            return null;
          })}
        </div>
      </div>

      {/* Fade overlay when collapsed */}
      {!isExpanded && (
         <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      )}

      {/* Toggle Button */}
      <div className="mt-4 text-center relative z-10">
         <button 
           onClick={() => setIsExpanded(!isExpanded)}
           className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 rounded-full text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all active:scale-95"
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