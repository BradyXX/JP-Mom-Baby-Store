'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, MessageCircle, AlertCircle } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { getSettings } from '@/lib/supabase/queries';
import { supabase } from '@/lib/supabase/client';
import { Coupon, AppSettings } from '@/lib/supabase/types';
import { calculateDiscountAmount } from '@/lib/utils/coupons';
import { getUtmParams } from '@/lib/utils/utm';
import { formatLineMessage, formatShortLineMessage, getLineUniversalLink, getLineSchemeLink } from '@/lib/utils/line';

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群马県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, getCartTotal, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [pendingLineUrl, setPendingLineUrl] = useState('');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [orderNo, setOrderNo] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    lastName: '', firstName: '', postalCode: '', prefecture: '', city: '',
    addressLine1: '', addressLine2: '', phone: '', notes: ''
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  
  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const subtotal = getCartTotal();
  const discountTotal = appliedCoupon ? calculateDiscountAmount(appliedCoupon, items, subtotal) : 0;
  const shippingFee = settings ? (subtotal >= settings.free_shipping_threshold ? 0 : 600) : 0;
  const total = Math.max(0, subtotal - discountTotal + shippingFee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.prefecture) {
      setError('都道府県を選択してください');
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const currentSettings = await getSettings();
      
      let oaHandle = '';
      const enabledOAs = (currentSettings.line_oas as any[] || []).filter(oa => oa.enabled && oa.handle);
      if (enabledOAs.length > 0) {
        const storedIdx = localStorage.getItem('line_rr_idx');
        let currentIdx = storedIdx ? parseInt(storedIdx, 10) : 0;
        oaHandle = enabledOAs[currentIdx % enabledOAs.length].handle;
        localStorage.setItem('line_rr_idx', (currentIdx + 1).toString());
      }

      const newOrderNo = `ORD-${new Date().getTime().toString().slice(-8)}`;
      setOrderNo(newOrderNo);

      const orderPayload: any = {
        order_no: newOrderNo,
        customer_name: `${formData.lastName} ${formData.firstName}`.trim(),
        phone: formData.phone,
        postal_code: formData.postalCode,
        prefecture: formData.prefecture,
        city: formData.city,
        address_line1: formData.addressLine1,
        address_line2: formData.addressLine2 || null,
        notes: formData.notes || null,
        items: items.map(item => ({
          sku: item.slug, 
          title: item.title, 
          price: Number(item.price), 
          qty: Number(item.quantity),
          image: item.image, 
          variant: item.variantTitle || null,
          productId: item.productId
        })),
        subtotal: Number(subtotal), 
        discount_total: Number(discountTotal), 
        shipping_fee: Number(shippingFee),
        total: Number(total),
        coupon_code: appliedCoupon?.code || null,
        payment_method: 'COD', 
        payment_status: 'pending', 
        status: 'new',
        target_channel: "line",
        target_line: oaHandle || "",
        line_oa_handle: oaHandle || "",
        line_confirmed: false,
        utm: getUtmParams(searchParams) || {},
        notify_status: 'pending'
      };

      const { error: insertError } = await supabase
        .from('orders')
        .insert(orderPayload);

      if (insertError) {
        if (insertError.code === '42501') {
          throw new Error("注文の送信権限がありません。Supabaseで 'orders' 表の RLS Policy (INSERT) を設定してください。");
        }
        throw new Error(`[Order Error] ${insertError.message}`);
      }

      // Prepare LINE Redirection
      const shortMsg = formatShortLineMessage(orderPayload);
      const schemeUrl = getLineSchemeLink(oaHandle, shortMsg);
      const universalUrl = getLineUniversalLink(oaHandle, shortMsg);

      sessionStorage.setItem('last_order', JSON.stringify(orderPayload));
      clearCart();

      // Attempt robust redirection
      setPendingLineUrl(universalUrl);
      
      // Step 1: Try App Scheme
      window.location.href = schemeUrl;

      // Step 2: Fallback to Universal Link if still on page
      setTimeout(() => {
        window.location.href = universalUrl;
        
        // Step 3: If still here, show modal with manual instructions
        setTimeout(() => {
          setShowRedirectModal(true);
          setIsSubmitting(false);
        }, 1000);
      }, 500);

    } catch (err: any) {
      console.error('Submit error:', err);
      setError(err.message || '予期せぬエラーが発生しました');
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
                   <p className="break-all whitespace-pre-wrap">{error}</p>
                 </div>
               </div>
             )}
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="姓" className="input-base" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                  <input placeholder="名" className="input-base" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <input placeholder="電話番号" className="input-base" required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                <input placeholder="郵便番号" className="input-base" required value={formData.postalCode} onChange={e => setFormData({...formData, postalCode: e.target.value})} />
                
                <select 
                  className="input-base appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10" 
                  required 
                  value={formData.prefecture} 
                  onChange={e => setFormData({...formData, prefecture: e.target.value})}
                >
                  <option value="" disabled>都道府県を選択してください</option>
                  {PREFECTURES.map(pref => (
                    <option key={pref} value={pref}>{pref}</option>
                  ))}
                </select>

                <input placeholder="市区町村" className="input-base" required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                <input placeholder="住所（番地以降）" className="input-base" required value={formData.addressLine1} onChange={e => setFormData({...formData, addressLine1: e.target.value})} />
                <input placeholder="建物名・部屋番号" className="input-base" value={formData.addressLine2} onChange={e => setFormData({...formData, addressLine2: e.target.value})} />
                <textarea placeholder="備考（オプション）" className="input-base h-24" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
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
               <span>合计 (税込)</span>
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
        </div>
      </form>

      {showRedirectModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-200">
             <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <MessageCircle size={32} className="text-green-600" />
             </div>
             <h3 className="text-xl font-bold mb-4">LINEで注文を完了</h3>
             <p className="text-sm text-gray-500 mb-6 leading-relaxed">
               自動でLINEが開かない場合は、下のボタンを押してください。
             </p>
             <a href={pendingLineUrl} className="btn-primary w-full bg-[#06C755] hover:bg-[#05b64e] border-none mb-4 py-4 flex items-center justify-center gap-2 text-lg">
               <MessageCircle size={24} />
               LINEを開く
             </a>
             <button onClick={() => router.push(`/order-success?order_no=${orderNo}`)} className="text-gray-400 text-xs hover:underline">
               完了画面へ進む
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
