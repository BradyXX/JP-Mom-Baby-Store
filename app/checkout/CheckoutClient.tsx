'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, MessageCircle, AlertCircle, ShieldCheck, MapPin, ChevronRight, Lock } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { getSettings } from '@/lib/supabase/queries';
import { supabase } from '@/lib/supabase/client';
import { AppSettings } from '@/lib/supabase/types';
import { getUtmParams } from '@/lib/utils/utm';
import { getRotatedLineOA, normalizeHandle } from '@/lib/utils/line';
import { getAddressByZip } from '@/app/actions/getAddress'; // Server Action import

const PREFECTURES = ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"];

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, getCartTotal, clearCart } = useCartStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Address Auto-complete states
  const [zipLoading, setZipLoading] = useState(false);
  const [zipError, setZipError] = useState('');

  const [formData, setFormData] = useState({
    lastName: '', firstName: '', 
    phone: '', 
    postalCode: '', 
    prefecture: '', city: '', addressLine1: '', addressLine2: '', 
    notes: ''
  });

  // Ref for programmatically submitting form from sticky footer
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const subtotal = getCartTotal();
  const shippingFee = settings ? (subtotal >= settings.free_shipping_threshold ? 0 : 600) : 0;
  const total = subtotal + shippingFee;

  // --- Postal Code Logic ---
  const handleZipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Format: Half-width numbers only, auto-insert hyphen
    val = val.replace(/[^\d-]/g, '');
    
    // Auto-hyphenation (e.g., 1234567 -> 123-4567)
    const nums = val.replace(/-/g, '');
    if (nums.length > 3) {
      val = nums.slice(0, 3) + '-' + nums.slice(3, 7);
    } else {
      val = nums;
    }

    setFormData(prev => ({ ...prev, postalCode: val }));
    setZipError('');

    // Trigger fetch when 7 digits are entered
    if (nums.length === 7) {
      setZipLoading(true);
      const result = await getAddressByZip(nums);
      setZipLoading(false);

      if (result && !result.error) {
        setFormData(prev => ({
          ...prev,
          prefecture: result.prefecture,
          city: result.city,
          addressLine1: result.address, // Populate town area
        }));
      } else {
        setZipError('郵便番号から住所を取得できませんでした。手動で入力してください。');
      }
    }
  };

  // --- Submit Logic ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    // Basic Validation
    if (!formData.lastName || !formData.firstName || !formData.phone || !formData.postalCode || !formData.prefecture || !formData.city || !formData.addressLine1) {
      setError('必須項目が入力されていません。赤枠の箇所をご確認ください。');
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      const currentSettings = await getSettings();
      const rawHandle = getRotatedLineOA(currentSettings.line_oas as unknown as string[]);
      const finalHandle = normalizeHandle(rawHandle);

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
        items: items.map(i => ({ 
          sku: i.slug, 
          title: i.title, 
          price: i.price, 
          qty: i.quantity, 
          image: i.image, 
          variant: i.variantTitle, 
          productId: i.productId 
        })),
        subtotal,
        shipping_fee: shippingFee,
        total,
        payment_method: 'COD' as const,
        status: 'new' as const,
        line_oa_handle: finalHandle,
        utm: getUtmParams(searchParams),
        line_confirmed: false
      };

      const { error: insErr } = await supabase.from('orders').insert(payload);
      if (insErr) throw insErr;

      sessionStorage.setItem('last_order', JSON.stringify(payload));
      clearCart();
      router.push(`/order-success?order_no=${newOrderNo}`);
      
    } catch (err: any) {
      console.error(err);
      setError("注文の保存に失敗しました。通信環境をご確認の上、再度お試しください。");
      setIsSubmitting(false);
    }
  };

  // Trigger from sticky footer
  const handleStickySubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24 md:pb-12">
      {/* Top Trust Banner */}
      <div className="bg-green-50 border-b border-green-100 py-2 px-4 text-center">
        <p className="text-xs md:text-sm text-green-800 font-medium flex items-center justify-center gap-2">
          <ShieldCheck size={16} />
          はじめてのご注文でも安心。育児中でもスキマ時間にご相談OK。
        </p>
      </div>

      <div className="container-base py-6 md:py-10 max-w-4xl">
        <h1 className="text-xl md:text-2xl font-bold mb-6 text-gray-900">ご購入手続き</h1>
        
        <form ref={formRef} onSubmit={handleSubmit} className="grid md:grid-cols-12 gap-6 md:gap-10">
          
          {/* LEFT COLUMN: FORM */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg flex items-start gap-3 text-sm animate-in slide-in-from-top-2">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <section className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="font-bold text-lg mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
                <MapPin size={20} className="text-primary" />
                配送先住所
              </h2>
              
              <div className="space-y-5">
                {/* Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">姓 <span className="text-red-500">*</span></label>
                    <input 
                      placeholder="山田" 
                      className="input-base text-base" // text-base prevents iOS zoom
                      required 
                      value={formData.lastName} 
                      onChange={e => setFormData({...formData, lastName: e.target.value})} 
                      autoComplete="family-name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">名 <span className="text-red-500">*</span></label>
                    <input 
                      placeholder="花子" 
                      className="input-base text-base" 
                      required 
                      value={formData.firstName} 
                      onChange={e => setFormData({...formData, firstName: e.target.value})} 
                      autoComplete="given-name"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">電話番号 <span className="text-red-500">*</span></label>
                  <input 
                    placeholder="09012345678" 
                    className="input-base text-base" 
                    required 
                    type="tel" 
                    inputMode="numeric"
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    autoComplete="tel"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">※ 配送時のご連絡に使用します</p>
                </div>

                {/* Postal Code */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">郵便番号 (7桁) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input 
                      placeholder="123-4567" 
                      className={`input-base text-base pr-10 ${zipError ? 'border-red-300 focus:border-red-400' : ''}`} 
                      required 
                      type="tel" // Shows numeric keypad on mobile
                      inputMode="numeric"
                      value={formData.postalCode} 
                      onChange={handleZipChange}
                      autoComplete="postal-code"
                      maxLength={8}
                    />
                    {zipLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="animate-spin text-gray-400" size={18} />
                      </div>
                    )}
                  </div>
                  {zipError ? (
                    <p className="text-xs text-red-500 mt-1.5">{zipError}</p>
                  ) : (
                    <p className="text-[10px] text-gray-400 mt-1">※ 入力すると住所が自動で入力されます</p>
                  )}
                </div>

                {/* Address Group */}
                <div className="p-4 bg-gray-50 rounded-lg space-y-4 border border-gray-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">都道府県 <span className="text-red-500">*</span></label>
                      <select 
                        className="input-base text-base h-[46px]" 
                        required 
                        value={formData.prefecture} 
                        onChange={e => setFormData({...formData, prefecture: e.target.value})}
                        autoComplete="address-level1"
                      >
                        <option value="">選択してください</option>
                        {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">市区町村 <span className="text-red-500">*</span></label>
                      <input 
                        placeholder="例：渋谷区" 
                        className="input-base text-base" 
                        required 
                        value={formData.city} 
                        onChange={e => setFormData({...formData, city: e.target.value})}
                        autoComplete="address-level2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">住所 (番地以降) <span className="text-red-500">*</span></label>
                    <input 
                      placeholder="例：神南1-1-1" 
                      className="input-base text-base" 
                      required 
                      value={formData.addressLine1} 
                      onChange={e => setFormData({...formData, addressLine1: e.target.value})} 
                      autoComplete="address-line1"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">建物名・部屋番号 <span className="text-gray-400 font-normal">(任意)</span></label>
                    <input 
                      placeholder="例：マンション 101号室" 
                      className="input-base text-base" 
                      value={formData.addressLine2} 
                      onChange={e => setFormData({...formData, addressLine2: e.target.value})} 
                      autoComplete="address-line2"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">備考 <span className="text-gray-400 font-normal">(任意)</span></label>
                  <textarea 
                    placeholder="配送時間のご希望など（※宅配ボックス希望など）" 
                    className="input-base text-base h-20 py-2" 
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})} 
                  />
                </div>

              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: SUMMARY & PAYMENT */}
          <div className="md:col-span-5 space-y-6">
            <section className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
              <h2 className="font-bold text-lg mb-5 border-b border-gray-100 pb-3">注文内容</h2>
              
              {/* Items Summary (Collapsed) */}
              <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                {items.map(item => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex gap-3 text-sm">
                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0 relative">
                       {item.image && <img src={item.image} className="object-cover w-full h-full" alt=""/>}
                       <span className="absolute -top-1 -right-1 bg-gray-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border border-white">
                         {item.quantity}
                       </span>
                    </div>
                    <div className="flex-1">
                       <p className="line-clamp-1 font-medium">{item.title}</p>
                       <p className="text-xs text-gray-500">{item.variantTitle}</p>
                    </div>
                    <div className="text-right">
                       <p>¥{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-3 border-t border-gray-100 pt-4 mb-6">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>小計</span>
                  <span>¥{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>送料</span>
                  <span>
                    {shippingFee === 0 ? <span className="text-red-500 font-bold">無料</span> : `¥${shippingFee.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-3">
                  <span className="font-bold text-gray-800">合計 (税込)</span>
                  <span className="text-2xl font-bold text-primary">¥{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Method Display */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                 <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">お支払い方法</h3>
                 <div className="flex items-center gap-2 text-gray-800 font-bold">
                    <span className="bg-gray-800 text-white p-1 rounded"><Lock size={12}/></span>
                    代金引換 (現金)
                 </div>
                 <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                   商品のお届け時に配達員に現金でお支払いください。<br/>
                   <span className="text-primary">※ 受け取り時にお支払いだから安心です。</span>
                 </p>
              </div>

              {/* Desktop Button */}
              <div className="hidden md:block">
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="btn-primary w-full py-4 text-lg font-bold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />}
                  注文を確定する
                </button>
                <p className="text-xs text-center text-gray-400 mt-3">
                  SSL暗号化通信により、情報は安全に送信されます
                </p>
              </div>

            </section>
          </div>
        </form>
      </div>

      {/* MOBILE STICKY FOOTER CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 pb-[calc(env(safe-area-inset-bottom)+12px)] z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
         <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
            <div className="flex flex-col">
               <span className="text-[10px] text-gray-500 font-medium">合計 (税込)</span>
               <span className="text-xl font-bold text-gray-900 leading-none">¥{total.toLocaleString()}</span>
            </div>
            <button 
               onClick={handleStickySubmit}
               disabled={isSubmitting}
               className="flex-1 bg-primary text-white font-bold py-3.5 rounded-xl shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
               {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <span>注文を確定する</span>}
               {!isSubmitting && <ChevronRight size={18} className="opacity-80"/>}
            </button>
         </div>
      </div>

    </div>
  );
}