'use client';
import { useState } from 'react';
import { X } from 'lucide-react';

export default function TopBar() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-primary text-white text-xs py-2 px-4 relative transition-all">
      <div className="container-base text-center">
        <span>全品送料無料・日本国内発送</span>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full"
      >
        <X size={14} />
      </button>
    </div>
  );
}
