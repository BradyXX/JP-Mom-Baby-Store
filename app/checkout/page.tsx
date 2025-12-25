import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import CheckoutClient from './CheckoutClient';

export const dynamic = 'force-dynamic';

export default function CheckoutPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      }
    >
      <CheckoutClient />
    </Suspense>
  );
}