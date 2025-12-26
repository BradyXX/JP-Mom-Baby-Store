
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, MessageCircle, AlertCircle } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { getSettings } from '@/lib/supabase/queries';
import { supabase } from '@/lib/supabase/client';
import { AppSettings } from '@/lib/supabase/types';
import { getUtmParams } from '@/lib/utils/utm';
import { getRotatedLineOA, normalizeHandle } from '@/lib/utils/line';

const PREFECTURES = ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群马県", "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県", "三重県", "滋贺県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"];

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, getCartTotal, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<AppSettings | null>(null);

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
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. 获取最新设置
      const currentSettings = await getSettings();
      
      // 2. 使用轮询函数选择 OA (Raw String)
      // currentSettings.line_oas is Json, assume it matches DB string[] format
      const rawHandle = getRotatedLineOA(currentSettings.line_oas as unknown as string[]);
      
      // 3. 规范化 Handle (确保有 @)
      const finalHandle = normalizeHandle(rawHandle);

      if (!finalHandle && currentSettings.line_enabled) {
        console.warn("No active LINE OA found, check Admin Settings.");
      }

      const newOrderNo = `ORD-${Date.now().toString().slice(-8)}`;

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
        subtotal,
        shipping_fee: shippingFee,
        total,
        payment_method: 'COD' as const,
        status: 'new' as const,
        line_oa_handle: finalHandle, // 保存选定的 Handle
        utm: getUtmParams(searchParams),
        line_confirmed: false
      };

      // 4. 写入数据库
      const { error: insErr } = await supabase.from('orders').insert(payload);
      if (insErr) throw insErr;

      // 5. 保存 SessionStorage (用于 Success 页面快速读取)
      sessionStorage.setItem('last_order', JSON.stringify(payload));
      
      // 6. 清空购物车并跳转
      clearCart();
      router.push(`/order-success?order_no=${newOrderNo}`);
      
    } catch (err: any) {
      setError(err.message || "注文の保存に失敗しました。");
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
            <div className="flex justify-between text-sm"><span>小計</span><span>¥{subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm"><span>送料</span><span>¥{shippingFee.toLocaleString()}</span></div>
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
