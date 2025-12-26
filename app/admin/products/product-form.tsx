
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminUpsertProduct, listCollections } from '@/lib/supabase/queries';
import { Product } from '@/lib/supabase/types';
import ImageUploader from '@/components/admin/ImageUploader';
import { Loader2, RefreshCw } from 'lucide-react';

export default function ProductForm({ initialData }: { initialData?: Partial<Product> }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  
  // Track if fields were manually edited to prevent auto-overwrite
  const [touched, setTouched] = useState({ slug: false, sku: false });

  const [formData, setFormData] = useState<Partial<Product>>(initialData || {
    title_jp: '',
    slug: '',
    sku: '',
    price: 0,
    compare_at_price: null,
    stock_qty: 0,
    in_stock: true,
    active: true,
    images: [],
    tags: [],
    collection_handles: [],
    short_desc_jp: '',
    sort_order: 0,
    variants: [],
    recommended_product_ids: []
  });

  useEffect(() => {
    listCollections().then(setCollections);
  }, []);

  // Auto-generation Logic
  useEffect(() => {
    if (!formData.title_jp) return;

    // Generate Slug (Kebab Case)
    if (!initialData && !touched.slug) {
      // Basic transliteration is hard without a library, so we stick to English chars or simple replacement
      // If title is purely Japanese, this might result in empty string, which is fine (user must enter)
      const newSlug = formData.title_jp
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphen
        .replace(/^-+|-+$/g, '');   // Trim hyphens
      
      if (newSlug.length > 0) {
        setFormData(prev => ({ ...prev, slug: newSlug }));
      }
    }

    // Generate SKU (Abbreviation)
    if (!initialData && !touched.sku) {
      // Take first 3 letters of words (ASCII only) or generate random
      const asciiTitle = formData.title_jp.replace(/[^a-zA-Z0-9 ]/g, '');
      const words = asciiTitle.split(' ').filter(w => w.length > 0);
      let prefix = '';
      if (words.length > 0) {
        prefix = words.map(w => w[0]).join('').toUpperCase().substring(0, 4);
      } else {
        prefix = 'PROD';
      }
      
      // Simple format: PREF-001 (Randomized for now as we don't check DB count here)
      const randomSuffix = Math.floor(100 + Math.random() * 900); 
      const newSku = `${prefix}-${randomSuffix}`;
      
      setFormData(prev => ({ ...prev, sku: newSku }));
    }
  }, [formData.title_jp, touched.slug, touched.sku, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminUpsertProduct(formData);
      alert('保存しました');
      router.push('/admin/products');
    } catch (e: any) {
      alert('保存失敗: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Helper for Number Inputs to avoid "011" issue
  // We allow string intermediate state conceptually, but binding to number works if we handle empty string
  const handleNumberChange = (field: keyof Product, val: string) => {
    if (val === '') {
      // @ts-ignore - Temporary allowance for empty input while typing
      setFormData({ ...formData, [field]: '' });
      return;
    }
    // Parse immediately to remove leading zeros
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setFormData({ ...formData, [field]: num });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-200 space-y-8 max-w-5xl mx-auto">
      
      {/* Section 1: Basic Info */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">基本情報</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-bold text-gray-700 mb-1">商品名 (JP) <span className="text-red-500">*</span></label>
            <input 
              required 
              type="text" 
              className="input-base" 
              placeholder="例: オーガニックコットン ベビー肌着"
              value={formData.title_jp} 
              onChange={e => setFormData({...formData, title_jp: e.target.value})} 
            />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-bold text-gray-700 mb-1">カテゴリー <span className="text-red-500">*</span></label>
            <select 
              required 
              className="input-base" 
              value={formData.collection_handles?.[0] || ''} 
              onChange={e => setFormData({...formData, collection_handles: [e.target.value]})}
            >
              <option value="">選択してください</option>
              {collections.map(c => (
                <option key={c.handle} value={c.handle}>{c.name}</option>
              ))}
            </select>
          </div>
          
          {/* Slug & SKU with Auto-gen indication */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Slug (URL) <span className="text-red-500">*</span>
              <span className="text-xs font-normal text-gray-400 ml-2">自動生成 (英数字・ハイフン)</span>
            </label>
            <div className="relative">
              <input 
                required 
                type="text" 
                className="input-base pr-10" 
                value={formData.slug} 
                onChange={e => {
                  setFormData({...formData, slug: e.target.value});
                  setTouched(prev => ({ ...prev, slug: true }));
                }} 
              />
              {!touched.slug && formData.slug && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" title="自動生成中">
                  <RefreshCw size={14} />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              SKU <span className="text-red-500">*</span>
              <span className="text-xs font-normal text-gray-400 ml-2">在庫管理ID</span>
            </label>
            <div className="relative">
              <input 
                required 
                type="text" 
                className="input-base pr-10" 
                value={formData.sku} 
                onChange={e => {
                  setFormData({...formData, sku: e.target.value});
                  setTouched(prev => ({ ...prev, sku: true }));
                }} 
              />
               {!touched.sku && formData.sku && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" title="自動生成中">
                  <RefreshCw size={14} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Pricing & Inventory */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">価格・在庫</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">販売価格 (¥) <span className="text-red-500">*</span></label>
            <input 
              required 
              type="number" 
              className="input-base" 
              value={formData.price} 
              onChange={e => handleNumberChange('price', e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">定価/比較価格 (¥) <span className="text-gray-400 text-xs">(任意)</span></label>
            <input 
              type="number" 
              className="input-base" 
              placeholder="割引前の価格"
              value={formData.compare_at_price ?? ''} 
              onChange={e => handleNumberChange('compare_at_price', e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">在庫数 <span className="text-red-500">*</span></label>
            <input 
              required 
              type="number" 
              className="input-base" 
              value={formData.stock_qty} 
              onChange={e => handleNumberChange('stock_qty', e.target.value)} 
            />
            <p className="text-xs text-gray-500 mt-1">
              ※ 半角数字のみ。0を入力すると在庫切れになります。
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Media */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">商品画像</h3>
        <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
           <ImageUploader images={formData.images || []} onChange={imgs => setFormData({...formData, images: imgs})} />
        </div>
      </div>

      {/* Section 4: Details */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">詳細説明</h3>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">短い説明 (一覧表示用)</label>
          <textarea 
            className="input-base h-24 resize-y" 
            placeholder="商品一覧や検索結果に表示される短い紹介文です。"
            value={formData.short_desc_jp || ''} 
            onChange={e => setFormData({...formData, short_desc_jp: e.target.value})} 
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white/90 backdrop-blur p-4 -mx-4 -mb-4 md:mb-0 md:static">
        <button 
          type="button" 
          onClick={() => router.back()} 
          className="btn-secondary px-6"
        >
          キャンセル
        </button>
        <button 
          type="submit" 
          disabled={saving} 
          className="btn-primary px-8 flex items-center gap-2 shadow-lg"
        >
          {saving && <Loader2 className="animate-spin" size={18} />}
          保存する
        </button>
      </div>
    </form>
  );
}
