'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Ticket } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { createOrder, getCouponByCode, getSettings } from '@/lib/supabase/queries';
import { Coupon, Order } from '@/lib/supabase/types';
import { validateCoupon, calculateDiscountAmount } from '@/lib/utils/coupons';
import { getUtmParams } from '@/lib/utils/utm';

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, getCartTotal, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    postalCode: '',
    prefecture: '',
    city: '',
    addressLine1: '',
    addressLine2: '',
    phone: '',
    notes: ''
  });

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const subtotal = getCartTotal();
  
  // Calculate Totals
  const shippingFee: number = 0;
  const discountTotal = appliedCoupon 
    ? calculateDiscountAmount(appliedCoupon, items, subtotal) 
    : 0;
  const total = Math.max(0, subtotal - discountTotal + shippingFee);

  // Redirect if empty
  useEffect(() => {
    // Small delay to ensure hydration matches
    if (items.length === 0) {
      router.push('/');
    }
  }, [items, router]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    setAppliedCoupon(null);

    try {
      const coupon = await getCouponByCode(couponCode.toUpperCase());
      
      if (!coupon) {
        setCouponError('クーポンが見つかりません');
        return;
      }

      const validation = validateCoupon(coupon, subtotal);
      if (!validation.valid) {
        setCouponError(validation.error || 'クーポンが無効です');
        return;
      }

      const potentialDiscount = calculateDiscountAmount(coupon, items, subtotal);
      if (potentialDiscount === 0) {
        setCouponError('この注文には適用できません（対象商品が含まれていません）');
        return;
      }

      setAppliedCoupon(coupon);
    } catch (err) {
      setCouponError('クーポンの確認中にエラーが発生しました');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.lastName || !formData.firstName || !formData.phone || !formData.postalCode || !formData.prefecture || !formData.city || !formData.addressLine1) {
      setError('必須項目を入力してください');
      window.scrollTo(0, 0);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const settings = await getSettings();
      let oaHandle = '';
      
      const enabledOAs = Array.isArray(settings.line_oas)
        ? (settings.line_oas as any[]).filter((oa: any) => oa.enabled && oa.handle)
        : [];
      
      if (enabledOAs.length > 0) {
        const storedIdx = localStorage.getItem('line_rr_idx');
        let currentIdx = storedIdx ? parseInt(storedIdx, 10) : 0;
        
        if (isNaN(currentIdx)) currentIdx = 0;
        
        oaHandle = enabledOAs[currentIdx % enabledOAs.length].handle;
        
        localStorage.setItem('line_rr_idx', (currentIdx + 1).toString());
      } else {
         oaHandle = ''; 
      }

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderNo = `ORD-${dateStr}-${randomSuffix}`;

      const orderPayload: Partial<Order> = {
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
          sku: 'SKU-PENDING', 
          title: item.title,
          price: item.price,
          qty: item.quantity,
          image: item.image,
          variant: item.variantTitle,
          productId: item.productId,
          collectionHandles: item.collectionHandles
        })),
        subtotal: subtotal,
        discount_total: discountTotal,
        shipping_fee: shippingFee,
        total: total,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        payment_method: 'COD',
        payment_status: 'pending',
        status: 'new',
        utm: getUtmParams(searchParams),
        line_oa_handle: oaHandle,
        line_confirmed: false
      };

      await createOrder(orderPayload);
      sessionStorage.setItem('last_order', JSON.stringify(orderPayload));
      clearCart();
      router.push(`/order-success?order_no=${orderNo}`);

    } catch (err: any) {
      console.error(err);
      setError('注文の作成に失敗しました。もう一度お試しください。');
      setIsSubmitting(false);
      window.scrollTo(0, 0);
    }
  };

  const handleInput = (key: string, val: string) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  // Prevent flash of empty content if redirected
  if (items.length === 0) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <Loader2 className="animate-spin text-gray-400" />
        </div>
    );
  }

  return (
    <div className="container-base py-8 md:py-12 max-w-5xl">
      <h1 className="text-2xl font-bold mb-8 text-center md:text-left">ご購入手続き</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
        <div className="space-y-8">
          <section className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
            <h2 className="font-bold mb-6 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs">1</span>
              配送先住所
            </h2>
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" placeholder="姓" className="input-base" required 
                  value={formData.lastName} onChange={e => handleInput('lastName', e.target.value)}
                />
                <input 
                  type="text" placeholder="名" className="input-base" required 
                  value={formData.firstName} onChange={e => handleInput('firstName', e.target.value)}
                />
              </div>
              <input 
                type="text" placeholder="郵便番号 (例: 123-4567)" className="input-base" required 
                value={formData.postalCode} onChange={e => handleInput('postalCode', e.target.value)}
              />
              <select 
                className="input-base" required
                value={formData.prefecture} onChange={e => handleInput('prefecture', e.target.value)}
              >
                <option value="">都道府県を選択</option>
                {['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <input 
                type="text" placeholder="市区町村" className="input-base" required 
                value={formData.city} onChange={e => handleInput('city', e.target.value)}
              />
              <input 
                type="text" placeholder="番地・建物名" className="input-base" required 
                value={formData.addressLine1} onChange={e => handleInput('addressLine1', e.target.value)}
              />
              <input 
                type="text" placeholder="建物名・部屋番号（任意）" className="input-base" 
                value={formData.addressLine2} onChange={e => handleInput('addressLine2', e.target.value)}
              />
              <input 
                type="tel" placeholder="電話番号" className="input-base" required 
                value={formData.phone} onChange={e => handleInput('phone', e.target.value)}
              />
              <textarea 
                placeholder="備考（任意）" className="input-base h-24 resize-none"
                value={formData.notes} onChange={e => handleInput('notes', e.target.value)}
              ></textarea>
            </form>
          </section>

          <section className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
            <h2 className="font-bold mb-6 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs">2</span>
              お支払い方法
            </h2>
            <div className="space-y-3">
              <label className="flex items-center gap-4 p-4 border border-primary bg-blue-50/30 rounded-lg cursor-pointer transition-colors">
                <input type="radio" name="payment" defaultChecked className="text-primary w-4 h-4 accent-primary" />
                <div>
                  <span className="text-sm font-bold block text-gray-800">代金引換 (COD)</span>
                  <span className="text-xs text-gray-500">商品到着時に現金でお支払いください</span>
                </div>
              </label>
              <label className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg cursor-not-allowed opacity-60 bg-gray-50">
                <input type="radio" name="payment" disabled className="w-4 h-4" />
                <div>
                   <span className="text-sm font-bold block text-gray-400">クレジットカード</span>
                   <span className="text-xs text-gray-400">現在ご利用いただけません</span>
                </div>
              </label>
            </div>
          </section>
        </div>

        <div className="relative">
          <div className="bg-gray-50 p-6 rounded-lg sticky top-24 shadow-sm border border-gray-200">
            <h2 className="font-bold mb-6 text-gray-800">注文内容</h2>
            
            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
              {items.map(item => (
                <div key={`${item.productId}-${item.variantId}`} className="flex gap-3">
                  <div className="relative w-14 h-14 bg-white rounded border border-gray-200 overflow-hidden flex-shrink-0">
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                    <span className="absolute -top-1 -right-1 bg-gray-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.variantTitle}</p>
                  </div>
                  <p className="text-sm font-medium">¥{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>

            <hr className="border-gray-200 mb-6" />

            <div className="mb-6">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="クーポンコード" 
                  className="input-base py-2"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  disabled={!!appliedCoupon}
                />
                <button 
                  type="button"
                  onClick={appliedCoupon ? () => { setAppliedCoupon(null); setCouponCode(''); } : handleApplyCoupon}
                  disabled={couponLoading}
                  className="btn-secondary py-2 px-4 whitespace-nowrap text-xs"
                >
                  {couponLoading ? <Loader2 size={16} className="animate-spin" /> : (appliedCoupon ? '解除' : '適用')}
                </button>
              </div>
              {couponError && <p className="text-xs text-red-500 mt-2">{couponError}</p>}
              {appliedCoupon && <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><Ticket size={12}/> クーポン「{appliedCoupon.code}」を適用しました</p>}
            </div>

            <div className="space-y-3 text-sm text-gray-600 mb-6">
              <div className="flex justify-between">
                <span>小計</span>
                <span>¥{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>送料</span>
                <span>{shippingFee === 0 ? '無料' : `¥${shippingFee.toLocaleString()}`}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-red-500 font-medium">
                  <span>割引</span>
                  <span>-¥{discountTotal.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-baseline border-t border-gray-200 pt-4 mb-8">
              <span className="font-bold text-lg">合計 (税込)</span>
              <span className="font-bold text-2xl text-primary">¥{total.toLocaleString()}</span>
            </div>

            <button 
              type="submit" 
              form="checkout-form"
              disabled={isSubmitting}
              className="btn-primary w-full py-4 text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 size={20} className="animate-spin" />}
              注文を確定する
            </button>
            <p className="text-xs text-gray-400 mt-4 text-center leading-relaxed">
              「注文を確定する」をクリックすることで、<br/>
              利用規約およびプライバシーポリシーに同意したものとみなされます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}