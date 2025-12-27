
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminUpsertProduct, listCollections } from '@/lib/supabase/queries';
import { Product, ProductVariant } from '@/lib/supabase/types';
import ImageUploader from '@/components/admin/ImageUploader';
import { Loader2, RefreshCw, Save, CloudLightning, Plus, Trash2, ArrowUp, ArrowDown, Upload, Image as ImageIcon } from 'lucide-react';
import { migrateProductImages, migrateProductVariantImages } from '@/app/actions/image-migration';
import { normalizeStringArray, normalizeNumberArray } from '@/lib/utils/arrays';
import { supabase } from '@/lib/supabase/client';

// Define structure for UI sections
interface DescSection {
  title: string;
  content: string;
}

export default function ProductForm({ initialData }: { initialData?: Partial<Product> }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migratingVariants, setMigratingVariants] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  
  // Local state for Tag Input (String)
  const [tagInput, setTagInput] = useState('');
  
  // Local state for Recommended IDs (String)
  const [recIdsInput, setRecIdsInput] = useState('');

  // Local state for Variants
  const [variants, setVariants] = useState<ProductVariant[]>([]);
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
         const uiSections = (initialData.long_desc_sections as any[]).map(s => ({
            title: s.title || '',
            content: s.content || ''
         }));
         setDescSections(uiSections);
      }
      
      // 2. Handle Tags
      const safeTags = normalizeStringArray(initialData.tags);
      setTagInput(safeTags.join(', '));

      // 3. Handle Recommended IDs
      const safeRecs = normalizeNumberArray(initialData.recommended_product_ids);
      setRecIdsInput(safeRecs.join(', '));

      // 4. Handle Variants (Sync JSON string and Object array)
      const vars = (initialData.variants || []) as ProductVariant[];
      setVariants(vars);
      setVariantsJson(JSON.stringify(vars, null, 2));
    }
  }, [initialData]);

  // --- Logic 1: Single Select Collection ---
  const toggleCollection = (handle: string) => {
    const current = normalizeStringArray(formData.collection_handles);
    if (current.includes(handle)) {
      setFormData({ ...formData, collection_handles: [] });
    } else {
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

  // --- Logic 3: Generators & Migration (Main Images) ---
  const handleMigrateImages = async () => {
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
    setFormData(prev => ({ ...prev, slug: generateSlugFromName(formData.title_jp || '') }));
  };

  const handleGenerateSku = () => {
    let base = formData.slug || generateSlugFromName(formData.title_jp || '');
    if (!base) return alert('商品名を入力してください');
    const shortBase = base.slice(0, 15);
    const random4 = Math.floor(1000 + Math.random() * 9000); 
    const newSku = `SKU-${shortBase}-${random4}`.toUpperCase();
    setFormData(prev => ({ ...prev, sku: newSku }));
  };

  // --- Logic 4: Variant Management (Enhanced) ---
  
  // Sync Variants -> JSON
  const updateVariants = (newVariants: ProductVariant[]) => {
    setVariants(newVariants);
    setVariantsJson(JSON.stringify(newVariants, null, 2));
    setJsonError('');
  };

  // Sync JSON -> Variants
  const handleJsonChange = (json: string) => {
    setVariantsJson(json);
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) {
        setVariants(parsed as ProductVariant[]);
        setJsonError('');
      }
    } catch (e) {
      setJsonError('JSON形式が無効です');
    }
  };

  const addVariant = () => {
    const baseSku = formData.sku || 'SKU';
    // Find next suffix
    const nextIdx = variants.length + 1;
    const newSku = `${baseSku}-${String(nextIdx).padStart(2, '0')}`;

    const newVar: ProductVariant = {
      sku: newSku,
      options: { 'Size': '' },
      stock_qty: 0,
      in_stock: false,
      image: ''
    };
    updateVariants([...variants, newVar]);
  };

  const removeVariant = (index: number) => {
    const newVars = [...variants];
    newVars.splice(index, 1);
    updateVariants(newVars);
  };

  const moveVariant = (index: number, direction: 'up' | 'down') => {
    const newVars = [...variants];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newVars.length) return;
    [newVars[index], newVars[target]] = [newVars[target], newVars[index]];
    updateVariants(newVars);
  };

  const updateVariantField = (index: number, field: keyof ProductVariant, val: any) => {
    const newVars = [...variants];
    newVars[index] = { ...newVars[index], [field]: val };
    
    // Auto toggle in_stock if qty changes
    if (field === 'stock_qty') {
       const qty = Number(val);
       if (!isNaN(qty) && qty > 0) newVars[index].in_stock = true;
    }

    updateVariants(newVars);
  };

  const updateVariantOption = (vIndex: number, key: string, val: string) => {
    const newVars = [...variants];
    newVars[vIndex].options = { ...newVars[vIndex].options, [key]: val };
    updateVariants(newVars);
  };

  const regenerateVariantSkus = () => {
    if (!confirm('全ての変体SKUを主SKUに基づいて連番で上書きしますか？')) return;
    const baseSku = formData.sku || 'SKU';
    const newVars = variants.map((v, i) => ({
      ...v,
      sku: `${baseSku}-${String(i + 1).padStart(2, '0')}`
    }));
    updateVariants(newVars);
  };

  const handleVariantImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `variants/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    try {
      const { error } = await supabase.storage.from('product-images').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
      updateVariantField(index, 'image', data.publicUrl);
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    }
  };

  const handleMigrateVariantImages = async () => {
    if (!formData.id || !formData.slug) return alert('先に保存してください');
    if (variants.length === 0) return alert('変体がありません');
    if (!confirm('変体画像をSupabaseへ移行しますか？')) return;

    setMigratingVariants(true);
    try {
      const res = await migrateProductVariantImages(formData.id, formData.slug, variants);
      if (res.success) {
        updateVariants(res.updatedVariants);
        alert(res.message);
      } else {
        alert('Error');
      }
    } catch (e: any) {
      alert('Migration Failed: ' + e.message);
    } finally {
      setMigratingVariants(false);
    }
  };

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setJsonError('');
    
    try {
      // 1. Validate Variants
      // Ensure variants is strictly ProductVariant[] and no extra fields if we want strict mode.
      // We explicitly DO NOT include price/compare_at_price to force inheritance from parent, 
      // or we just trust the editor. Let's sanitize to be safe.
      const sanitizedVariants = variants.map(v => ({
        sku: v.sku,
        options: v.options || {},
        stock_qty: Number(v.stock_qty) || 0,
        in_stock: Boolean(v.in_stock),
        image: v.image || '',
        // Do NOT save price/compare_at_price here to enforce global pricing
      }));

      // 2. Format Long Desc
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
        variants: sanitizedVariants, // Use sanitized array
        
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

      {/* Advanced / Variants (Visual Editor) */}
      <section className="bg-white p-6 rounded shadow border border-gray-200 space-y-6">
         <div className="flex justify-between items-center border-b pb-2 mb-4">
             <div>
                <h2 className="text-lg font-bold text-gray-800">高度な設定 (Variants)</h2>
                <p className="text-xs text-gray-500">色やサイズなどのバリエーションを管理します。</p>
             </div>
             {formData.id && (
               <button 
                 type="button" 
                 onClick={handleMigrateVariantImages}
                 disabled={migratingVariants}
                 className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded flex items-center gap-1 border border-blue-200 hover:bg-blue-100"
               >
                 {migratingVariants ? <Loader2 className="animate-spin" size={14}/> : <CloudLightning size={14}/>}
                 変体画像も移行
               </button>
             )}
         </div>

         {/* Variants Table */}
         <div className="overflow-x-auto">
            <table className="w-full text-sm">
               <thead className="bg-gray-50 text-gray-600 font-bold border-b">
                 <tr>
                   <th className="p-3 w-10"></th>
                   <th className="p-3 text-left w-24">画像</th>
                   <th className="p-3 text-left w-36">SKU</th>
                   <th className="p-3 text-left">Options (規格)</th>
                   <th className="p-3 text-left w-24">在庫</th>
                   <th className="p-3 text-center w-16">有効</th>
                   <th className="p-3 text-center w-10"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {variants.map((v, i) => (
                    <tr key={i} className="group hover:bg-gray-50">
                       <td className="p-3 text-center">
                          <div className="flex flex-col gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                             <button type="button" onClick={() => moveVariant(i, 'up')} disabled={i === 0}><ArrowUp size={14}/></button>
                             <button type="button" onClick={() => moveVariant(i, 'down')} disabled={i === variants.length - 1}><ArrowDown size={14}/></button>
                          </div>
                       </td>
                       <td className="p-3">
                          <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center relative overflow-hidden">
                             {v.image ? (
                               <img src={v.image} className="w-full h-full object-cover" alt="var" />
                             ) : (
                               <ImageIcon size={20} className="text-gray-300" />
                             )}
                             <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                <Upload size={16} className="text-white" />
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleVariantImageUpload(i, e)} />
                             </label>
                          </div>
                          <input 
                             placeholder="URL" 
                             className="w-full text-[10px] mt-1 border rounded px-1"
                             value={v.image || ''}
                             onChange={(e) => updateVariantField(i, 'image', e.target.value)}
                          />
                       </td>
                       <td className="p-3 align-top">
                          <input 
                             className="input-base py-1 px-2 text-xs font-mono" 
                             value={v.sku} 
                             onChange={(e) => updateVariantField(i, 'sku', e.target.value)}
                          />
                       </td>
                       <td className="p-3 align-top">
                          <div className="space-y-1">
                             {Object.entries(v.options || {}).map(([optKey, optVal], kIdx) => (
                                <div key={kIdx} className="flex gap-1 items-center">
                                   <input 
                                      className="border rounded px-2 py-1 w-20 text-xs bg-gray-50"
                                      value={optKey}
                                      placeholder="Name"
                                      // Note: Changing Key is tricky in this structure, skipping for MVP complexity
                                      readOnly
                                   />
                                   <span className="text-gray-400">:</span>
                                   <input 
                                      className="border rounded px-2 py-1 flex-1 text-xs"
                                      value={optVal}
                                      placeholder="Value"
                                      onChange={(e) => updateVariantOption(i, optKey, e.target.value)}
                                   />
                                </div>
                             ))}
                             <button 
                               type="button" 
                               onClick={() => {
                                 // Simple prompt for new option key
                                 const key = prompt('規格名を入力 (例: Color, Size):');
                                 if (key) updateVariantOption(i, key, '');
                               }}
                               className="text-[10px] text-blue-500 hover:underline flex items-center gap-1"
                             >
                               <Plus size={10} /> 規格を追加
                             </button>
                          </div>
                       </td>
                       <td className="p-3 align-top">
                          <input 
                             type="number" 
                             className="input-base py-1 px-2 text-xs w-20"
                             value={v.stock_qty}
                             onChange={(e) => updateVariantField(i, 'stock_qty', e.target.value)}
                          />
                       </td>
                       <td className="p-3 text-center align-top">
                          <input 
                             type="checkbox" 
                             className="w-4 h-4 accent-primary"
                             checked={v.in_stock}
                             onChange={(e) => updateVariantField(i, 'in_stock', e.target.checked)}
                          />
                       </td>
                       <td className="p-3 text-center align-top">
                          <button type="button" onClick={() => removeVariant(i)} className="text-gray-400 hover:text-red-500">
                             <Trash2 size={16} />
                          </button>
                       </td>
                    </tr>
                 ))}
               </tbody>
            </table>
         </div>

         <div className="flex gap-2">
            <button type="button" onClick={addVariant} className="btn-secondary py-2 text-xs flex items-center gap-2">
               <Plus size={14} /> 変体を追加
            </button>
            <button type="button" onClick={regenerateVariantSkus} className="btn-secondary py-2 text-xs flex items-center gap-2">
               <RefreshCw size={14} /> SKU再番
            </button>
         </div>

         {/* Legacy JSON Fallback */}
         <div className="mt-8 pt-6 border-t border-gray-100">
            <label className="block text-xs font-bold text-gray-500 mb-1">JSON Raw Data (Advanced)</label>
            <textarea 
              className={`input-base font-mono text-xs h-32 ${jsonError ? 'border-red-500' : 'bg-gray-50'}`} 
              value={variantsJson} 
              onChange={e => handleJsonChange(e.target.value)}
            />
            {jsonError && <p className="text-xs text-red-500 mt-1">{jsonError}</p>}
         </div>
      </section>

    </form>
  );
}
