'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, MessageCircle, AlertCircle } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { createOrder, getSettings } from '@/lib/supabase/queries';
import { Coupon, AppSettings } from '@/lib/supabase/types';
import { calculateDiscountAmount } from '@/lib/utils/coupons';
import { getUtmParams } from '@/lib/utils/utm';
import { formatLineMessage, getLineDeepLink } from '@/lib/utils/line';

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, getCartTotal, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [pendingLineUrl, setPendingLineUrl] = useState('');
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    lastName: '', firstName: '', postalCode: '', prefecture: '', city: '',
    addressLine1: '', addressLine2: '', phone: '', notes: ''
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  
  // Load settings for shipping calculation
  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const subtotal = getCartTotal();
  const discountTotal = appliedCoupon ? calculateDiscountAmount(appliedCoupon, items, subtotal) : 0;
  const shippingFee = settings ? (subtotal >= settings.free_shipping_threshold ? 0 : 600) : 0;
  const total = Math.max(0, subtotal - discountTotal + shippingFee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const currentSettings = await getSettings();
      
      // LINE OA Round Robin
      let oaHandle = '';
      const enabledOAs = (currentSettings.line_oas as any[] || []).filter(oa => oa.enabled && oa.handle);
      if (enabledOAs.length > 0) {
        const storedIdx = localStorage.getItem('line_rr_idx');
        let currentIdx = storedIdx ? parseInt(storedIdx, 10) : 0;
        oaHandle = enabledOAs[currentIdx % enabledOAs.length].handle;
        localStorage.setItem('line_rr_idx', (currentIdx + 1).toString());
      }

      const orderNo = `ORD-${new Date().getTime().toString().slice(-8)}`;

      // Construct payload that matches DB schema and OrderItem interface
      const orderPayload: any = {
        order_no: orderNo,
        customer_name: `${formData.lastName} ${formData.firstName}`,
        phone: formData.phone,
        postal_code: formData.postalCode,
        prefecture: formData.prefecture,
        city: formData.city,
        address_line1: formData.addressLine1,
        address_line2: formData.addressLine2 || null,
        notes: formData.notes || null,
        items: items.map(item => ({
          productId: item.productId,
          collectionHandles: item.collectionHandles,
          sku: item.slug, 
          title: item.title, 
          price: item.price, 
          qty: item.quantity,
          image: item.image, 
          variant: item.variantTitle || null
        })),
        subtotal, 
        discount_total: discountTotal, 
        shipping_fee: shippingFee,
        total,
        coupon_code: appliedCoupon?.code || null,
        payment_method: 'COD', 
        payment_status: 'pending', 
        status: 'new',
        line_oa_handle: oaHandle,
        line_confirmed: false,
        utm: getUtmParams(searchParams)
      };

      // 1. Insert to Supabase
      await createOrder(orderPayload);
      
      // 2. Generate LINE link and Success Data
      const lineMsg = formatLineMessage(orderPayload);
      const lineLink = getLineDeepLink(oaHandle, lineMsg);

      sessionStorage.setItem('last_order', JSON.stringify(orderPayload));
      clearCart();

      // 3. Trigger Redirect
      setPendingLineUrl(lineLink);
      window.location.href = lineLink;
      
      // Fallback Timer
      setTimeout(() => {
        setShowRedirectModal(true);
        setIsSubmitting(false);
      }, 1500);

    } catch (err: any) {
      console.error('Order Creation Error:', err);
      // Display detailed error from Supabase to identify RLS or Schema issues
      setError(`注文の作成に失敗しました: ${err.message || 'Unknown error'}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-base py-8 md:py-12 max-w-4xl">
      <h1 className="text-2xl font-bold mb-8">ご購入手続き</h1>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <section className="bg-white p-6 border rounded-lg shadow-sm">
             <h2 className="font-bold mb-4 border-b pb-2">配送先住所</h2>
             {error && (
               <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6 flex items-start gap-2">
                 <AlertCircle size={18} className="mt-0.5 shrink-0" />
                 <div className="text-sm">
                   <p className="font-bold">エラーが発生しました</p>
                   <p>{error}</p>
                 </div>
               </div>
             )}
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="姓" className="input-base" required onChange={e => setFormData({...formData, lastName: e.target.value})} />
                  <input placeholder="名" className="input-base" required onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <input placeholder="電話番号" className="input-base" required type="tel" onChange={e => setFormData({...formData, phone: e.target.value})} />
                <input placeholder="郵便番号" className="input-base" required onChange={e => setFormData({...formData, postalCode: e.target.value})} />
                <input placeholder="都道府県" className="input-base" required onChange={e => setFormData({...formData, prefecture: e.target.value})} />
                <input placeholder="市区町村" className="input-base" required onChange={e => setFormData({...formData, city: e.target.value})} />
                <input placeholder="住所（番地以降）" className="input-base" required onChange={e => setFormData({...formData, addressLine1: e.target.value})} />
                <input placeholder="建物名・部屋番号" className="input-base" onChange={e => setFormData({...formData, addressLine2: e.target.value})} />
                <textarea placeholder="備考（オプション）" className="input-base h-24" onChange={e => setFormData({...formData, notes: e.target.value})} />
             </div>
          </section>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg h-fit sticky top-24 border">
          <h2 className="font-bold mb-6 border-b pb-2">注文内容</h2>
          <div className="space-y-3 mb-6">
             <div className="flex justify-between text-sm">
               <span className="text-gray-600">小計</span>
               <span>¥{subtotal.toLocaleString()}</span>
             </div>
             {discountTotal > 0 && (
               <div className="flex justify-between text-sm text-red-500">
                 <span>割引</span>
                 <span>-¥{discountTotal.toLocaleString()}</span>
               </div>
             )}
             <div className="flex justify-between text-sm">
               <span className="text-gray-600">送料</span>
               <span>{shippingFee === 0 ? '無料' : `¥${shippingFee.toLocaleString()}`}</span>
             </div>
             <div className="flex justify-between font-bold text-lg border-t pt-3 mt-3">
               <span>合計 (税込)</span>
               <span className="text-primary">¥{total.toLocaleString()}</span>
             </div>
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="btn-primary w-full py-4 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <MessageCircle size={20} />}
            LINEで注文を確定する
          </button>
          <p className="text-[10px] text-gray-400 mt-4 text-center">
            ※注文確定後、LINEアプリが起動します。メッセージを送信することで注文が完了します。
          </p>
        </div>
      </form>

      {/* Redirect Fallback Modal */}
      {showRedirectModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-200">
             <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <MessageCircle size={32} className="text-green-600" />
             </div>
             <h3 className="text-xl font-bold mb-4">LINEで注文を完了</h3>
             <p className="text-sm text-gray-500 mb-6 leading-relaxed">
               注文情報を保存しました。配送手配を進めるため、LINEでメッセージを送信してください。
             </p>
             <a 
               href={pendingLineUrl} 
               className="btn-primary w-full bg-[#06C755] hover:bg-[#05b64e] border-none mb-4 py-4 flex items-center justify-center gap-2 text-lg"
             >
               <MessageCircle size={24} />
               LINEを開く
             </a>
             <button 
               onClick={() => router.push(`/order-success?order_no=${JSON.parse(sessionStorage.getItem('last_order') || '{}').order_no}`)}
               className="text-gray-400 text-xs hover:underline"
             >
               完了画面へ進む
             </button>
          </div>
        </div>
      )}
    </div>
  );
}