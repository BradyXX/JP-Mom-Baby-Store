
'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, MessageCircle } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { createOrder, getSettings } from '@/lib/supabase/queries';
import { Coupon } from '@/lib/supabase/types';
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

  // Form State
  const [formData, setFormData] = useState({
    lastName: '', firstName: '', postalCode: '', prefecture: '', city: '',
    addressLine1: '', addressLine2: '', phone: '', notes: ''
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const subtotal = getCartTotal();
  const discountTotal = appliedCoupon ? calculateDiscountAmount(appliedCoupon, items, subtotal) : 0;
  const total = Math.max(0, subtotal - discountTotal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const settings = await getSettings();
      
      // LINE OA Round Robin
      let oaHandle = '';
      const enabledOAs = (settings.line_oas as any[] || []).filter(oa => oa.enabled && oa.handle);
      if (enabledOAs.length > 0) {
        const storedIdx = localStorage.getItem('line_rr_idx');
        let currentIdx = storedIdx ? parseInt(storedIdx, 10) : 0;
        oaHandle = enabledOAs[currentIdx % enabledOAs.length].handle;
        localStorage.setItem('line_rr_idx', (currentIdx + 1).toString());
      }

      const orderNo = `ORD-${new Date().getTime().toString().slice(-8)}`;

      const orderPayload: any = {
        order_no: orderNo,
        customer_name: `${formData.lastName} ${formData.firstName}`,
        phone: formData.phone,
        postal_code: formData.postalCode,
        prefecture: formData.prefecture,
        city: formData.city,
        address_line1: formData.addressLine1,
        address_line2: formData.addressLine2,
        notes: formData.notes,
        items: items.map(item => ({
          sku: item.slug, title: item.title, price: item.price, qty: item.quantity,
          image: item.image, variant: item.variantTitle
        })),
        subtotal, discount_total: discountTotal, total,
        coupon_code: appliedCoupon?.code,
        payment_method: 'COD', payment_status: 'pending', status: 'new',
        line_oa_handle: oaHandle,
        utm: getUtmParams(searchParams)
      };

      await createOrder(orderPayload);
      
      // Generate LINE link
      const lineMsg = formatLineMessage(orderPayload);
      const lineLink = getLineDeepLink(oaHandle, lineMsg);

      // Save for Success Page Fallback
      sessionStorage.setItem('last_order', JSON.stringify(orderPayload));
      clearCart();

      // IMMEDIATE REDIRECT
      window.location.href = lineLink;
      
      // Fallback Timer: If still on page after 2s, show modal
      setPendingLineUrl(lineLink);
      setTimeout(() => {
        setShowRedirectModal(true);
        setIsSubmitting(false);
      }, 2000);

    } catch (err: any) {
      setError('注文の作成に失敗しました。');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-base py-8 md:py-12 max-w-4xl">
      <h1 className="text-2xl font-bold mb-8">ご購入手続き</h1>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <section className="bg-white p-6 border rounded-lg shadow-sm">
             <h2 className="font-bold mb-4">配送先住所</h2>
             {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="姓" className="input-base" required onChange={e => setFormData({...formData, lastName: e.target.value})} />
                  <input placeholder="名" className="input-base" required onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <input placeholder="電話番号" className="input-base" required onChange={e => setFormData({...formData, phone: e.target.value})} />
                <input placeholder="郵便番号" className="input-base" required onChange={e => setFormData({...formData, postalCode: e.target.value})} />
                <input placeholder="都道府県" className="input-base" required onChange={e => setFormData({...formData, prefecture: e.target.value})} />
                <input placeholder="市区町村" className="input-base" required onChange={e => setFormData({...formData, city: e.target.value})} />
                <input placeholder="住所（番地以降）" className="input-base" required onChange={e => setFormData({...formData, addressLine1: e.target.value})} />
                <input placeholder="建物名・部屋番号" className="input-base" onChange={e => setFormData({...formData, addressLine2: e.target.value})} />
             </div>
          </section>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg h-fit sticky top-24">
          <h2 className="font-bold mb-6">注文内容</h2>
          <div className="space-y-3 mb-6">
             <div className="flex justify-between"><span>小計</span><span>¥{subtotal.toLocaleString()}</span></div>
             {discountTotal > 0 && <div className="flex justify-between text-red-500"><span>割引</span><span>-¥{discountTotal.toLocaleString()}</span></div>}
             <div className="flex justify-between font-bold text-lg border-t pt-3"><span>合計</span><span className="text-primary">¥{total.toLocaleString()}</span></div>
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="btn-primary w-full py-4 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <MessageCircle size={20} />}
            LINEで注文を確定する
          </button>
        </div>
      </form>

      {/* Redirect Fallback Modal */}
      {showRedirectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl animate-in zoom-in">
             <h3 className="text-xl font-bold mb-4">LINEを開いています...</h3>
             <p className="text-sm text-gray-500 mb-6">
               自動的にLINEが開かない場合は、下のボタンをタップしてメッセージを送信してください。
             </p>
             <a 
               href={pendingLineUrl} 
               className="btn-primary w-full bg-[#06C755] border-none mb-4 flex items-center justify-center gap-2"
             >
               <MessageCircle size={20} />
               LINEで送信
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
