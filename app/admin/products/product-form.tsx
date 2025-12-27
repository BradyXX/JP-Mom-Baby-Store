
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminUpsertProduct, listCollections } from '@/lib/supabase/queries';
import { Product } from '@/lib/supabase/types';
import ImageUploader from '@/components/admin/ImageUploader';
import { Loader2, RefreshCw, Save, CloudLightning, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { migrateProductImages } from '@/app/actions/image-migration';
import { normalizeStringArray, normalizeNumberArray } from '@/lib/utils/arrays';

// Define structure for UI sections
interface DescSection {
  title: string;
  content: string;
}

export default function ProductForm({ initialData }: { initialData?: Partial<Product> }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  
  // Local state for Tag Input (String)
  const [tagInput, setTagInput] = useState('');
  
  // Local state for Recommended IDs (String)
  const [recIdsInput, setRecIdsInput] = useState('');

  // Local state for Variants (JSON String)
  const [variantsJson, setVariantsJson] = useState('[]');
  const [jsonError, setJsonError] = useState('');

  // Local state for Long Description Sections
  const [descSections, setDescSections] = useState<DescSection[]>([]);

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
      images: [], 
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
      // 1. Handle Long Desc Sections
      if (Array.isArray(initialData.long_desc_sections)) {
         // Map existing generic json to our UI structure
         const uiSections = (initialData.long_desc_sections as any[]).map(s => ({
            title: s.title || '',
            content: s.content || ''
         }));
         setDescSections(uiSections);
      }
      
      // 2. Handle Tags (Array -> Comma String)
      const safeTags = normalizeStringArray(initialData.tags);
      setTagInput(safeTags.join(', '));

      // 3. Handle Recommended IDs (Array -> Comma String)
      const safeRecs = normalizeNumberArray(initialData.recommended_product_ids);
      setRecIdsInput(safeRecs.join(', '));

      // 4. Handle Variants (JSON -> String)
      setVariantsJson(JSON.stringify(initialData.variants || [], null, 2));
    }
  }, [initialData]);

  // --- Logic 1: Single Select Collection ---
  const toggleCollection = (handle: string) => {
    // Current logic: Single Select behavior stored as Array
    // If clicking the one currently selected, deselect it.
    // If clicking a new one, replace the selection.
    const current = normalizeStringArray(formData.collection_handles);
    
    if (current.includes(handle)) {
      // Deselect
      setFormData({ ...formData, collection_handles: [] });
    } else {
      // Select (Overwrite)
      setFormData({ ...formData, collection_handles: [handle] });
    }
  };

  // --- Logic 2: Description Sections ---
  const addSection = () => {
    setDescSections([...descSections, { title: '', content: '' }]);
  };
  const updateSection = (index: number, field: keyof DescSection, val: string) => {
    const newSections = [...descSections];
    newSections[index][field] = val;
    setDescSections(newSections);
  };
  const removeSection = (index: number) => {
    const newSections = [...descSections];
    newSections.splice(index, 1);
    setDescSections(newSections);
  };

  // --- Logic 3: Generators & Migration ---
  const handleMigrateImages = async () => {
    /* ... existing logic ... */
    if (!formData.id || !formData.slug || !formData.images?.length) {
      alert('商品ID、Slug、または画像がありません。先に保存してください。');
      return;
    }
    if (!confirm('外部画像をSupabase Storageにコピーしますか？')) return;
    setMigrating(true);
    try {
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

  const generateSlugFromName = (name: string): string => {
    return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');   
  };

  const handleGenerateSlug = () => {
    if (!formData.title_jp) return alert('先に商品名を入力してください');
    setFormData(prev => ({ ...prev, slug: generateSlugFromName(formData.title_jp) }));
  };

  const handleGenerateSku = () => {
    let base = formData.slug || generateSlugFromName(formData.title_jp || '');
    if (!base) return alert('商品名を入力してください');
    const shortBase = base.slice(0, 15);
    const random4 = Math.floor(1000 + Math.random() * 9000); 
    const newSku = `SKU-${shortBase}-${random4}`.toUpperCase();
    setFormData(prev => ({ ...prev, sku: newSku }));
  };

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setJsonError('');
    
    try {
      // 1. Parse Variants JSON
      let parsedVariants = [];
      try {
        parsedVariants = JSON.parse(variantsJson);
        if (!Array.isArray(parsedVariants)) throw new Error('Variants must be an array');
      } catch (err) {
        setJsonError('Variants JSONが無効です。修正してください。');
        setSaving(false);
        return;
      }

      // 2. Format Long Desc (Convert UI sections to JSONB structure)
      // Structure: [{ type: 'text', title: '...', content: '...' }]
      const finalSections = descSections.map(s => ({
        type: 'text',
        title: s.title,
        content: s.content
      }));

      // 3. Construct Payload
      const payload = {
        ...formData,
        tags: normalizeStringArray(tagInput), 
        images: normalizeStringArray(formData.images),
        collection_handles: normalizeStringArray(formData.collection_handles),
        recommended_product_ids: normalizeNumberArray(recIdsInput),
        
        long_desc_sections: finalSections,
        variants: parsedVariants,
        
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

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl space-y-8 pb-20">
      
      {/* Top Actions */}
      <div className="flex justify-end sticky top-4 z-20">
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 shadow-lg">
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          保存する
        </button>
      </div>

      {/* Basic Info */}
      <section className="bg-white p-6 rounded shadow border border-gray-200 space-y-6">
        <h2 className="text-lg font-bold border-b pb-2 mb-4">基本情報</h2>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">商品名 (JP) <span className="text-red-500">*</span></label>
          <input className="input-base" required value={formData.title_jp || ''} onChange={e => setFormData({...formData, title_jp: e.target.value})} />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Slug (URL) <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <input className="input-base font-mono text-sm" required value={formData.slug || ''} onChange={e => setFormData({...formData, slug: e.target.value})} />
              <button type="button" onClick={handleGenerateSlug} className="btn-secondary px-3"><RefreshCw size={18} /></button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">SKU <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <input className="input-base font-mono text-sm" required value={formData.sku || ''} onChange={e => setFormData({...formData, sku: e.target.value})} />
              <button type="button" onClick={handleGenerateSku} className="btn-secondary px-3"><RefreshCw size={18} /></button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing & Stock */}
      <section className="bg-white p-6 rounded shadow border border-gray-200 space-y-6">
        <h2 className="text-lg font-bold border-b pb-2 mb-4">価格・在庫・表示順</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">販売価格 (¥)</label>
            <input type="number" className="input-base" required min={0} value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">通常価格 (¥)</label>
            <input type="number" className="input-base" min={0} value={formData.compare_at_price || ''} onChange={e => setFormData({...formData, compare_at_price: e.target.value ? Number(e.target.value) : null})} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">在庫数</label>
            <input type="number" className="input-base" min={0} value={formData.stock_qty} onChange={e => setFormData({...formData, stock_qty: Number(e.target.value)})} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">表示順 (Sort)</label>
            <input type="number" className="input-base" value={formData.sort_order} onChange={e => setFormData({...formData, sort_order: Number(e.target.value)})} />
            <p className="text-[10px] text-gray-400">※ 小さい数値が優先</p>
          </div>
        </div>
        <div className="flex gap-6">
           <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.in_stock} onChange={e => setFormData({...formData, in_stock: e.target.checked})} className="w-5 h-5 accent-primary" />
              <span className="text-sm font-medium">在庫あり (販売中)</span>
           </label>
           <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="w-5 h-5 accent-primary" />
              <span className="text-sm font-medium">公開する</span>
           </label>
        </div>
      </section>

      {/* Media */}
      <section className="bg-white p-6 rounded shadow border border-gray-200 space-y-6">
        <div className="flex justify-between items-center border-b pb-2 mb-4">
           <h2 className="text-lg font-bold">商品画像</h2>
           {formData.id && (
             <button type="button" onClick={handleMigrateImages} disabled={migrating} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded flex items-center gap-1 border border-blue-200">
               {migrating ? <Loader2 className="animate-spin" size={14} /> : <CloudLightning size={14} />} 画像一括移行
             </button>
           )}
        </div>
        <ImageUploader images={formData.images || []} onChange={(newImages) => setFormData({ ...formData, images: newImages })} />
      </section>

      {/* Organization */}
      <section className="bg-white p-6 rounded shadow border border-gray-200 space-y-6">
        <h2 className="text-lg font-bold border-b pb-2 mb-4">分類・タグ・関連</h2>
        
        <div>
           <label className="block text-sm font-bold text-gray-700 mb-2">コレクション (単一選択)</label>
           <div className="flex flex-wrap gap-2">
              {collections.map(c => {
                const isSelected = (formData.collection_handles || []).includes(c.handle);
                return (
                  <button
                    type="button"
                    key={c.handle}
                    onClick={() => toggleCollection(c.handle)}
                    className={`px-3 py-1.5 rounded text-xs border transition-colors ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-inner'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {isSelected && <span className="mr-1">✓</span>}
                    {c.name}
                  </button>
                );
              })}
           </div>
        </div>

        <div>
           <label className="block text-sm font-bold text-gray-700 mb-1">タグ (カンマ区切り)</label>
           <input className="input-base" placeholder="例: Cotton, Summer, S, M, L" value={tagInput} onChange={e => setTagInput(e.target.value)} />
           <p className="text-xs text-gray-400 mt-1">※ サイズや素材などを入力。商品詳細ページに表示されます。</p>
        </div>

        <div>
           <label className="block text-sm font-bold text-gray-700 mb-1">関連商品 ID (カンマ区切り)</label>
           <input className="input-base" placeholder="例: 101, 102, 105" value={recIdsInput} onChange={e => setRecIdsInput(e.target.value)} />
           <p className="text-xs text-gray-400 mt-1">※ 商品IDを入力すると、詳細ページ下部に「こちらもおすすめ」として表示されます。</p>
        </div>
      </section>

      {/* Descriptions */}
      <section className="bg-white p-6 rounded shadow border border-gray-200 space-y-6">
        <h2 className="text-lg font-bold border-b pb-2 mb-4">商品説明</h2>
        
        <div>
           <label className="block text-sm font-bold text-gray-700 mb-1">短い説明 (キャッチコピー)</label>
           <textarea className="input-base h-20" value={formData.short_desc_jp || ''} onChange={e => setFormData({...formData, short_desc_jp: e.target.value})} />
        </div>

        <div>
           <label className="block text-sm font-bold text-gray-700 mb-2">詳細説明セクション (見出し + 本文)</label>
           <div className="space-y-4">
              {descSections.map((section, idx) => (
                <div key={idx} className="flex gap-4 items-start p-4 bg-gray-50 rounded border border-gray-200 relative">
                   <div className="flex-1 space-y-2">
                      <input 
                        placeholder="見出し (例: 素材について)" 
                        className="input-base font-bold"
                        value={section.title}
                        onChange={e => updateSection(idx, 'title', e.target.value)}
                      />
                      <textarea 
                        placeholder="本文..." 
                        className="input-base h-24"
                        value={section.content}
                        onChange={e => updateSection(idx, 'content', e.target.value)}
                      />
                   </div>
                   <button type="button" onClick={() => removeSection(idx)} className="text-gray-400 hover:text-red-500 mt-2">
                      <Trash2 size={18} />
                   </button>
                   <span className="absolute top-2 right-2 text-[10px] text-gray-300">#{idx + 1}</span>
                </div>
              ))}
              <button 
                type="button" 
                onClick={addSection}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:bg-gray-50 hover:border-gray-400 flex items-center justify-center gap-2 font-bold"
              >
                <Plus size={18}/> セクションを追加
              </button>
           </div>
        </div>
      </section>

      {/* Advanced / Variants */}
      <section className="bg-gray-50 p-6 rounded shadow border border-gray-200 space-y-6">
         <h2 className="text-lg font-bold border-b pb-2 mb-4 text-gray-600">高度な設定 (Variants)</h2>
         <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Variants JSON (SKU設定)</label>
            <p className="text-xs text-gray-500 mb-2">※ 将来的な在庫管理用。現在は手動JSON編集のみ対応。</p>
            <textarea 
              className={`input-base font-mono text-xs h-40 ${jsonError ? 'border-red-500' : ''}`} 
              value={variantsJson} 
              onChange={e => setVariantsJson(e.target.value)}
              placeholder='[{"name":"Size", "options":["S","M"]}]'
            />
            {jsonError && <p className="text-xs text-red-500 mt-1 font-bold">{jsonError}</p>}
         </div>
      </section>

    </form>
  );
}
