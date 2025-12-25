'use client';
import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50 flex flex-col sm:flex-row items-center justify-between gap-4 container-base">
      <p className="text-xs text-gray-500 text-center sm:text-left">
        当サイトでは、サービスの向上とお客様に適したコンテンツを提供するためにCookieを使用しています。
      </p>
      <div className="flex gap-2">
        <button onClick={accept} className="btn-primary py-2 px-4 text-xs">
          同意する
        </button>
      </div>
    </div>
  );
}
