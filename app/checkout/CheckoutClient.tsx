'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, MessageCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { getSettings } from '@/lib/supabase/queries';
import { supabase } from '@/lib/supabase/client';
import { Coupon, AppSettings } from '@/lib/supabase/types';
import { calculateDiscountAmount } from '@/lib/utils/coupons';
import { getUtmParams } from '@/lib/utils/utm';
import { 
  formatShortLineMessage, 
  getLineUniversalLink, 
  getLineSchemeLink, 
  getLineAddFriendLink 
} from '@/lib/utils/line';

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群马県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋贺県", "京都府", "大阪府", "兵庫県",
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
  const [pendingLinks, setPendingLinks] = useState({ universal: '', addFriend: '' });
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [orderNo, setOrderNo] = useState<string>('');

  const [formData, setFormData] = useState({
    lastName: '', firstName: '', postalCode: '', prefecture: '', city: '',
    addressLine1: '', addressLine2: '', phone: '', notes: ''
  });

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const subtotal = getCartTotal();
  const shippingFee = settings ? (subtotal >= settings.free_shipping_threshold ? 0 : 600) : 0;
  const total = subtotal + shippingFee;

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
        discount_total: 0, 
        shipping_fee: Number(shippingFee),
        total: Number(total),
        payment_method: 'COD', 
        status: 'new',
        line_oa_handle: oaHandle || "",
        utm: getUtmParams(searchParams) || {},
      };

      const { error: insertError } = await supabase.from('orders').insert(orderPayload);
      if (insertError) throw new Error(insertError.message);

      const shortMsg = formatShortLineMessage(orderPayload);
      const schemeUrl = getLineSchemeLink(oaHandle, shortMsg);
      const universalUrl = getLineUniversalLink(oaHandle, shortMsg);
      const addFriendUrl = getLineAddFriendLink(oaHandle);

      setPendingLinks({ universal: universalUrl, addFriend: addFriendUrl });
      sessionStorage.setItem('last_order', JSON.stringify(orderPayload));
      clearCart();

      // Step 1: Try App Scheme
      window.location.href = schemeUrl;

      // Step 2: Fallback to Universal Link if no jump after 500ms
      setTimeout(() => {
        window.location.href = universalUrl;
        
        // Step 3: If still in browser after another 800ms, show manual modal
        setTimeout(() => {
          setShowRedirectModal(true);
          setIsSubmitting(false);
        }, 800);
      }, 500);

    } catch (err: any) {
      setError(err.message || '予期せぬエラーが発生しました');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-base py-8 md:py-12 max-w-4xl">
      <h1 className="text-2xl font-bold mb-8">ご購入手続き</h1>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <section className="bg-white p-6 border rounded-xl shadow-sm">
             <h2 className="font-bold mb-4 border-b pb-2">配送先住所</h2>
             {error && (
               <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6 flex items-start gap-2">
                 <AlertCircle size={18} className="mt-0.5 shrink-0" />
                 <p className="text-sm">{error}</p>
               </div>
             )}
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="姓" className="input-base" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                  <input placeholder="名" className="input-base" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <input placeholder="電話番号" className="input-base" required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                <input placeholder="郵便番号" className="input-base" required value={formData.postalCode} onChange={e => setFormData({...formData, postalCode: e.target.value})} />
                
                <select className="input-base" required value={formData.prefecture} onChange={e => setFormData({...formData, prefecture: e.target.value})}>
                  <option value="" disabled>都道府県を選択</option>
                  {PREFECTURES.map(pref => <option key={pref} value={pref}>{pref}</option>)}
                </select>

                <input placeholder="市区町村" className="input-base" required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                <input placeholder="住所（番地以降）" className="input-base" required value={formData.addressLine1} onChange={e => setFormData({...formData, addressLine1: e.target.value})} />
                <input placeholder="建物名・部屋番号" className="input-base" value={formData.addressLine2} onChange={e => setFormData({...formData, addressLine2: e.target.value})} />
                <textarea placeholder="備考（オプション）" className="input-base h-24" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
             </div>
          </section>
        </div>

        <div className="bg-gray-50 p-6 rounded-xl h-fit border">
          <h2 className="font-bold mb-6 border-b pb-2">注文内容</h2>
          <div className="space-y-3 mb-6">
             <div className="flex justify-between text-sm">
               <span className="text-gray-600">小計</span>
               <span>¥{subtotal.toLocaleString()}</span>
             </div>
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
            className="btn-primary w-full py-4 flex items-center justify-center gap-2 shadow-lg"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <MessageCircle size={20} />}
            LINEで注文を確定する
          </button>
        </div>
      </form>

      {showRedirectModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl">
             <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <MessageCircle size={32} className="text-green-600" />
             </div>
             <h3 className="text-xl font-bold mb-2">LINEを開いています...</h3>
             <p className="text-sm text-gray-500 mb-8">
               自動でLINEが開かない場合は、下のボタンを押してください。
             </p>
             <div className="space-y-3">
               <a href={pendingLinks.universal} className="btn-primary w-full bg-[#06C755] border-none py-4 flex items-center justify-center gap-2 text-lg">
                 <MessageCircle size={24} />
                 LINEを開く
               </a>
               <a href={pendingLinks.addFriend} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600 py-2">
                 <ExternalLink size={16} />
                 公式LINEを登録して連絡
               </a>
             </div>
             <button onClick={() => router.push(`/order-success?order_no=${orderNo}`)} className="mt-6 text-gray-400 text-xs hover:underline">
               完了画面へ進む
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
