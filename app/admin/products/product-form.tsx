'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminUpsertProduct, listCollections } from '@/lib/supabase/queries';
import { Product } from '@/lib/supabase/types';
import ImageUploader from '@/components/admin/ImageUploader';
import { Loader2, RefreshCw, Save } from 'lucide-react';

export default function ProductForm({ initialData }: { initialData?: Partial<Product> }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  
  // Temp state for the simple "Long Description" text editor
  const [longDescText, setLongDescText] = useState('');

  const [formData, setFormData] = useState<Partial<Product>>(() => {
    if (initialData) return initialData;
    
    return {
      title_jp: '',
      slug: '',
      sku: '',
      price: 0,
      compare_at_price: null,
      stock_qty: 0,
      in_stock: true,
      active: true,
      images: [] as string[],
      tags: '', 
      collection_handles: [] as string[],
      short_desc_jp: '',
      sort_order: 0,
      variants: [] as any[], 
      recommended_product_ids: [] as number[],
      long_desc_sections: [] as any[],
    };
  });

  useEffect(() => {
    listCollections().then(setCollections);
    
    // Initialize longDescText from JSON if it exists and looks like a simple text block
    if (initialData?.long_desc_sections && Array.isArray(initialData.long_desc_sections)) {
       const sections = initialData.long_desc_sections as any[];
       const textSection = sections.find(s => s.type === 'text');
       if (textSection) {
          setLongDescText(textSection.content || '');
       }
    }
  }, [initialData]);

  // --- Generator Logic ---

  const generateSlugFromName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphen
      .replace(/^-+|-+$/g, '');    // Trim leading/trailing hyphens
  };

  const handleGenerateSlug = () => {
    if (!formData.title_jp) {
      alert('先に商品名を入力してください');
      return;
    }

    const newSlug = generateSlugFromName(formData.title_jp);
    setFormData(prev => ({ ...prev, slug: newSlug }));
  };

  const handleGenerateSku = () => {
    // 1. Try to use current slug as base, otherwise generate from title
    let base = formData.slug;
    if (!base && formData.title_jp) {
       base = generateSlugFromName(formData.title_jp);
    }

    if (!base) {
      alert('商品名を入力してください');
      return;
    }

    // 2. Generate SKU: SKU-{base}-{random4}
    // Limit base length to 15 chars to keep SKU manageable
    const shortBase = base.slice(0, 15);
    const random4 = Math.floor(1000 + Math.random() * 9000); // 1000-9999
    
    // Ensure uppercase for SKU standard
    const newSku = `SKU-${shortBase}-${random4}`.toUpperCase();

    setFormData(prev => ({ ...prev, sku: newSku }));
  };

  // --- Submit Logic ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Construct Long Description JSON if text exists
      // Simple MVP: We wrap the textarea content into a single "text" section
      const longDescPayload = longDescText 
        ? [{ type: 'text', content: longDescText }] 
        : [];

      // Ensure array fields are not null/undefined for DB
      const payload = {
        ...formData,
        long_desc_sections: longDescPayload,
        // Ensure numeric fields are numbers
        price: Number(formData.price),
        compare_at_price: formData.compare_at_price ? Number(formData.compare_at_price) : null,
        stock_qty: Number(formData.stock_qty),
        sort_order: Number(formData.sort_order),
      };

      await adminUpsertProduct(payload);
      router.push('/admin/products');
    } catch (err: any) {
      alert('保存に失敗しました: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleCollection = (handle: string) => {
    const current = formData.collection_handles || [];
    if (current.includes(handle)) {
      setFormData({ ...formData, collection_handles: current.filter(h => h !== handle) });
    } else {
      setFormData({ ...formData, collection_handles: [...current, handle] });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl space-y-8 pb-20">
      
      {/* Top Actions */}
      <div className="flex justify-end sticky top-4 z-20">
        <button 
          type="submit" 
          disabled={saving}
          className="btn-primary flex items-center gap-2 shadow-lg"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          保存する
        </button>
      </div>

      {/* Basic Info */}
      <section className="bg-white p-6 rounded shadow border border-gray-200 space-y-6">
        <h2 className="text-lg font-bold border-b pb-2 mb-4">基本情報</h2>
        
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">商品名 (JP) <span className="text-red-500">*</span></label>
          <input 
            className="input-base" 
            required
            value={formData.title_jp || ''} 
            onChange={e => setFormData({...formData, title_jp: e.target.value})} 
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Slug Generator */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Slug (URL) <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <input 
                className="input-base font-mono text-sm" 
                required
                value={formData.slug || ''} 
                onChange={e => setFormData({...formData, slug: e.target.value})} 
              />
              <button 
                type="button" 
                onClick={handleGenerateSlug}
                className="btn-secondary px-3 flex items-center justify-center text-gray-500 hover:text-primary"
                title="商品名から生成"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>

          {/* SKU Generator */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">SKU (在庫管理番号) <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <input 
                className="input-base font-mono text-sm" 
                required
                value={formData.sku || ''} 
                onChange={e => setFormData({...formData, sku: e.target.value})} 
              />
               <button 
                type="button" 
                onClick={handleGenerateSku}
                className="btn-secondary px-3 flex items-center justify-center text-gray-500 hover:text-primary"
                title="自動生成"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing & Stock */}
      <section className="bg-white p-6 rounded shadow border border-gray-200 space-y-6">
        <h2 className="text-lg font-bold border-b pb-2 mb-4">価格・在庫</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">販売価格 (¥)</label>
            <input 
              type="number"
              className="input-base" 
              required
              min={0}
              value={formData.price} 
              onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">通常価格 (¥) <span className="text-xs font-normal text-gray-400">割引前</span></label>
            <input 
              type="number"
              className="input-base" 
              min={0}
              placeholder="空欄可"
              value={formData.compare_at_price || ''} 
              onChange={e => setFormData({...formData, compare_at_price: e.target.value ? Number(e.target.value) : null})} 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">在庫数</label>
            <input 
              type="number"
              className="input-base" 
              min={0}
              value={formData.stock_qty} 
              onChange={e => setFormData({...formData, stock_qty: Number(e.target.value)})} 
            />
          </div>
          <div className="flex flex-col gap-2 pt-6">
             <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.in_stock} 
                  onChange={e => setFormData({...formData, in_stock: e.target.checked})}
                  className="w-5 h-5 accent-primary" 
                />
                <span className="text-sm font-medium">在庫あり (販売中)</span>
             </label>
             <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.active} 
                  onChange={e => setFormData({...formData, active: e.target.checked})}
                  className="w-5 h-5 accent-primary" 
                />
                <span className="text-sm font-medium">公開する</span>
             </label>
          </div>
        </div>
      </section>

      {/* Media */}
      <section className="bg-white p-6 rounded shadow border border-gray-200 space-y-6">
        <h2 className="text-lg font-bold border-b pb-2 mb-4">商品画像</h2>
        <ImageUploader 
          images={formData.images || []} 
          onChange={(newImages) => setFormData({ ...formData, images: newImages })} 
        />
      </section>

      {/* Organization */}
      <section className="bg-white p-6 rounded shadow border border-gray-200 space-y-6">
        <h2 className="text-lg font-bold border-b pb-2 mb-4">分類・タグ</h2>
        
        <div>
           <label className="block text-sm font-bold text-gray-700 mb-2">コレクション</label>
           <div className="flex flex-wrap gap-2">
              {collections.map(c => (
                <button
                  type="button"
                  key={c.handle}
                  onClick={() => toggleCollection(c.handle)}
                  className={`px-3 py-1.5 rounded text-xs border transition-colors ${
                    formData.collection_handles?.includes(c.handle)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {c.name}
                </button>
              ))}
           </div>
        </div>

        <div>
           <label className="block text-sm font-bold text-gray-700 mb-1">タグ (カンマ区切り)</label>
           <input 
             className="input-base" 
             placeholder="例: summer, sale, baby"
             value={formData.tags || ''} 
             onChange={e => setFormData({...formData, tags: e.target.value})} 
           />
        </div>
      </section>

      {/* Description */}
      <section className="bg-white p-6 rounded shadow border border-gray-200 space-y-6">
        <h2 className="text-lg font-bold border-b pb-2 mb-4">商品説明</h2>
        
        <div>
           <label className="block text-sm font-bold text-gray-700 mb-1">短い説明 (キャッチコピー)</label>
           <textarea 
             className="input-base h-20" 
             value={formData.short_desc_jp || ''} 
             onChange={e => setFormData({...formData, short_desc_jp: e.target.value})} 
           />
        </div>

        <div>
           <label className="block text-sm font-bold text-gray-700 mb-1">詳細説明 (本文)</label>
           <textarea 
             className="input-base h-40" 
             value={longDescText} 
             onChange={e => setLongDescText(e.target.value)}
             placeholder="商品の詳細な説明を入力してください..." 
           />
        </div>
      </section>

    </form>
  );
}