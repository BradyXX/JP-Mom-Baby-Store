'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminUpsertProduct, listCollections } from '@/lib/supabase/queries';
import { Product } from '@/lib/supabase/types';
import ImageUploader from '@/components/admin/ImageUploader';
import { Loader2, RefreshCw, Save, CloudLightning, Sparkles, Wand2, FileText } from 'lucide-react';
import { migrateProductImages } from '@/app/actions/image-migration';
import { generateProductDescription } from '@/app/actions/ai-generate'; // IMPORT AI ACTION
import { normalizeStringArray, normalizeNumberArray } from '@/lib/utils/arrays';

export default function ProductForm({ initialData }: { initialData?: Partial<Product> }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false); // AI State
  const [collections, setCollections] = useState<any[]>([]);
  
  // Local state for Tag Input (String)
  const [tagInput, setTagInput] = useState('');

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
      images: [], // Ensure initialized as empty array
      tags: [], 
      collection_handles: [],
      short_desc_jp: '',
      sort_order: 0,
      variants: [], 
      recommended_product_ids: [],
      long_desc_sections: [],
    };
  });

  useEffect(() => {
    listCollections().then(setCollections);
    
    if (initialData) {
      // 1. Handle Long Desc
      if (Array.isArray(initialData.long_desc_sections)) {
         const sections = initialData.long_desc_sections as any[];
         const textSection = sections.find(s => s.type === 'text');
         if (textSection) {
            setLongDescText(textSection.content || '');
         }
      }
      
      // 2. Handle Tags for Display (Array -> Comma String)
      const safeTags = normalizeStringArray(initialData.tags);
      setTagInput(safeTags.join(', '));
    }
  }, [initialData]);

  // --- Image Migration Logic ---
  const handleMigrateImages = async () => {
    if (!formData.id || !formData.slug || !formData.images?.length) {
      alert('商品ID、Slug、または画像がありません。先に保存してください。');
      return;
    }

    if (!confirm('外部画像をSupabase Storageにコピーしますか？\n（元のURLは自動的に置き換えられます）')) return;

    setMigrating(true);
    try {
      // images 必须是数组
      const safeImages = normalizeStringArray(formData.images);
      const result = await migrateProductImages(formData.id, formData.slug, safeImages);
      
      if (result.success) {
        setFormData(prev => ({ ...prev, images: result.updatedImages }));
        alert(result.message);
      } else {
        alert('エラー: ' + result.message);
      }
    } catch (e: any) {
      alert('移行失敗: ' + e.message);
    } finally {
      setMigrating(false);
    }
  };

  // --- AI Generation Logic ---
  const handleAiGenerate = async (mode: 'short' | 'long' | 'both') => {
    const images = normalizeStringArray(formData.images);
    if (!formData.title_jp) return alert('商品名を入力してください');
    if (images.length === 0) return alert('画像を少なくとも1枚追加してください');

    setGeneratingAi(true);
    try {
      const res = await generateProductDescription(
        formData.title_jp,
        images,
        {
          category: normalizeStringArray(formData.collection_handles)[0],
          tags: normalizeStringArray(tagInput)
        }
      );

      if (res.success) {
        if (mode === 'short' || mode === 'both') {
          setFormData(prev => ({ ...prev, short_desc_jp: res.short_desc_jp }));
        }
        if (mode === 'long' || mode === 'both') {
          setLongDescText(res.long_desc_text || '');
        }
        // alert('AI生成が完了しました'); // Optional: Use toast in real app
      } else {
        alert('生成失敗: ' + res.error);
      }
    } catch (e: any) {
      alert('エラー: ' + e.message);
    } finally {
      setGeneratingAi(false);
    }
  };

  // --- Generator Logic ---

  const generateSlugFromName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-') 
      .replace(/^-+|-+$/g, '');   
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
    let base = formData.slug;
    if (!base && formData.title_jp) {
       base = generateSlugFromName(formData.title_jp);
    }

    if (!base) {
      alert('商品名を入力してください');
      return;
    }

    const shortBase = base.slice(0, 15);
    const random4 = Math.floor(1000 + Math.random() * 9000); 
    const newSku = `SKU-${shortBase}-${random4}`.toUpperCase();

    setFormData(prev => ({ ...prev, sku: newSku }));
  };

  // --- Submit Logic ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const longDescPayload = longDescText 
        ? [{ type: 'text', content: longDescText }] 
        : [];
      
      const payload = {
        ...formData, // Spread first to get scalars
        
        // --- Explicit Overwrites for Array Fields ---
        tags: normalizeStringArray(tagInput), 
        images: normalizeStringArray(formData.images),
        collection_handles: normalizeStringArray(formData.collection_handles),
        recommended_product_ids: normalizeNumberArray(formData.recommended_product_ids),
        
        // Scalars / JSONB
        long_desc_sections: longDescPayload,
        price: Number(formData.price),
        compare_at_price: formData.compare_at_price ? Number(formData.compare_at_price) : null,
        stock_qty: Number(formData.stock_qty),
        sort_order: Number(formData.sort_order),
      };

      await adminUpsertProduct(payload);
      router.push('/admin/products');
    } catch (err: any) {
      console.error(err);
      alert('保存に失敗しました: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleCollection = (handle: string) => {
    const current = normalizeStringArray(formData.collection_handles);
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
        <div className="flex justify-between items-center border-b pb-2 mb-4">
           <h2 className="text-lg font-bold">商品画像</h2>
           {formData.id && (
             <button
               type="button"
               onClick={handleMigrateImages}
               disabled={migrating}
               className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
               title="外部URLの画像をSupabaseに保存します"
             >
               {migrating ? <Loader2 className="animate-spin" size={14} /> : <CloudLightning size={14} />}
               画像一括移行
             </button>
           )}
        </div>
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
                    (formData.collection_handles || []).includes(c.handle)
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
             value={tagInput} 
             onChange={e => setTagInput(e.target.value)} 
           />
           <p className="text-xs text-gray-400 mt-1">※ カンマ(,)で区切って複数入力できます</p>
        </div>
      </section>

      {/* Description */}
      <section className="bg-white p-6 rounded shadow border border-gray-200 space-y-6">
        <div className="flex justify-between items-center border-b pb-2 mb-4">
           <h2 className="text-lg font-bold">商品説明</h2>
           
           {/* AI Generation Buttons */}
           <div className="flex gap-1 md:gap-2">
              <button 
                type="button"
                onClick={() => handleAiGenerate('short')}
                disabled={generatingAi}
                className="text-xs btn-secondary py-1.5 px-3 flex items-center gap-1"
                title="短い説明だけ生成"
              >
                {generatingAi ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14} />}
                短
              </button>
              <button 
                type="button"
                onClick={() => handleAiGenerate('long')}
                disabled={generatingAi}
                className="text-xs btn-secondary py-1.5 px-3 flex items-center gap-1"
                title="詳細説明だけ生成"
              >
                {generatingAi ? <Loader2 size={14} className="animate-spin"/> : <FileText size={14} />}
                長
              </button>
              <button 
                type="button"
                onClick={() => handleAiGenerate('both')}
                disabled={generatingAi}
                className="text-xs btn-primary bg-purple-600 hover:bg-purple-700 border-purple-600 py-1.5 px-3 flex items-center gap-1"
                title="両方生成"
              >
                {generatingAi ? <Loader2 size={14} className="animate-spin"/> : <Wand2 size={14} />}
                AIでまとめて生成
              </button>
           </div>
        </div>
        
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