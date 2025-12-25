'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, MessageCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { getSettings } from '@/lib/supabase/queries';
import { supabase } from '@/lib/supabase/client';
import { AppSettings } from '@/lib/supabase/types';
import { getUtmParams } from '@/lib/utils/utm';
import { 
  formatShortLineMessage, 
  getLineUniversalLink, 
  getLineSchemeLink, 
  normalizeHandle 
} from '@/lib/utils/line';

const PREFECTURES = ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群马県", "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県", "三重県", "滋贺県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"];

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, getCartTotal, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSaved, setOrderSaved] = useState(false);
  const [orderNo, setOrderNo] = useState('');
  const [oaHandle, setOaHandle] = useState('');
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const [formData, setFormData] = useState({
    lastName: '', firstName: '', postalCode: '', prefecture: '', city: '',
    addressLine1: '', addressLine2: '', phone: '', notes: ''
  });

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const total = getCartTotal() + (settings ? (getCartTotal() >= settings.free_shipping_threshold ? 0 : 600) : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const currentSettings = await getSettings();
      let selectedOa = '';
      const enabledOAs = (currentSettings.line_oas as any[] || []).filter(oa => oa.enabled && oa.handle);
      if (enabledOAs.length > 0) {
        const idx = parseInt(localStorage.getItem('line_rr_idx') || '0', 10);
        selectedOa = enabledOAs[idx % enabledOAs.length].handle;
        localStorage.setItem('line_rr_idx', (idx + 1).toString());
      }
      setOaHandle(selectedOa);

      const newOrderNo = `ORD-${Date.now().toString().slice(-8)}`;
      setOrderNo(newOrderNo);

      const payload = {
        order_no: newOrderNo,
        customer_name: `${formData.lastName} ${formData.firstName}`.trim(),
        phone: formData.phone,
        postal_code: formData.postalCode,
        prefecture: formData.prefecture,
        city: formData.city,
        address_line1: formData.addressLine1,
        address_line2: formData.addressLine2 || null,
        notes: formData.notes || null,
        items: items.map(i => ({ sku: i.slug, title: i.title, price: i.price, qty: i.quantity, image: i.image, variant: i.variantTitle, productId: i.productId })),
        subtotal: getCartTotal(),
        shipping_fee: total - getCartTotal(),
        total,
        payment_method: 'COD',
        status: 'new',
        line_oa_handle: normalizeHandle(selectedOa),
        utm: getUtmParams(searchParams)
      };

      const { error: insErr } = await supabase.from('orders').insert(payload);
      if (insErr) throw insErr;

      sessionStorage.setItem('last_order', JSON.stringify(payload));
      clearCart();
      setOrderSaved(true);
      setIsSubmitting(false);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const handleLineRedirect = () => {
    const orderData = JSON.parse(sessionStorage.getItem('last_order') || '{}');
    const msg = formatShortLineMessage(orderData);
    const scheme = getLineSchemeLink(oaHandle, msg);
    const universal = getLineUniversalLink(oaHandle, msg);

    // 唤起逻辑：尝试原生 Scheme，不行再跳 Universal
    window.location.href = scheme;
    setTimeout(() => {
      window.location.href = universal;
      setTimeout(() => {
        router.push(`/order-success?order_no=${orderNo}`);
      }, 1000);
    }, 500);
  };

  if (orderSaved) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center animate-in zoom-in duration-300">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-xl font-bold mb-2">注文を保存しました</h2>
          <p className="text-sm text-gray-500 mb-8">
            最後の手続きとして、LINEで注文メッセージを送信してください。
          </p>
          <button onClick={handleLineRedirect} className="btn-primary w-full py-4 bg-[#06C755] hover:bg-[#05b64e] border-none flex items-center justify-center gap-2 text-lg">
            <MessageCircle size={24} />
            LINEで確定する
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-base py-8 md:py-12 max-w-4xl">
      <h1 className="text-2xl font-bold mb-8">ご購入手続き</h1>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <section className="bg-white p-6 border rounded-xl shadow-sm">
            <h2 className="font-bold mb-4 border-b pb-2">配送先住所</h2>
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 flex items-center gap-2 text-sm"><AlertCircle size={16}/>{error}</div>}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="姓" className="input-base" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                <input placeholder="名" className="input-base" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
              </div>
              <input placeholder="電話番号" className="input-base" required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <input placeholder="郵便番号" className="input-base" required value={formData.postalCode} onChange={e => setFormData({...formData, postalCode: e.target.value})} />
              <select className="input-base" required value={formData.prefecture} onChange={e => setFormData({...formData, prefecture: e.target.value})}>
                <option value="">都道府県を選択</option>
                {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
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
            <div className="flex justify-between text-sm"><span>小計</span><span>¥{getCartTotal().toLocaleString()}</span></div>
            <div className="flex justify-between font-bold text-lg border-t pt-3 mt-3"><span>合計 (税込)</span><span className="text-primary">¥{total.toLocaleString()}</span></div>
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-4 flex items-center justify-center gap-2 shadow-lg">
            {isSubmitting ? <Loader2 className="animate-spin" /> : <MessageCircle size={20} />}
            次へ進む
          </button>
        </div>
      </form>
    </div>
  );
}
