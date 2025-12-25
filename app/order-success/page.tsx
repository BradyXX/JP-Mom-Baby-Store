import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import OrderSuccessClient from './OrderSuccessClient';

export const dynamic = 'force-dynamic';

export default function OrderSuccessPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      }
    >
      <OrderSuccessClient />
    </Suspense>
  );
}