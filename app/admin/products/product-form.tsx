'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminUpsertProduct } from '@/lib/supabase/queries';
import { Product } from '@/lib/supabase/types';
import ImageUploader from '@/components/admin/ImageUploader';
import { Loader2 } from 'lucide-react';

export default function ProductForm({ initialData }: { initialData?: Partial<Product> }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
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
    // Variants default structure as text for simple editing
    variants: [],
    recommended_product_ids: []
  });

  // Simple handlers for array/json inputs
  const handleArrayInput = (key: keyof Product, val: string) => {
    setFormData({ ...formData, [key]: val.split(',').map(s => s.trim()).filter(Boolean) });
  };

  const handleJsonInput = (key: keyof Product, val: string) => {
    try {
      setFormData({ ...formData, [key]: JSON.parse(val) });
    } catch (e) {
      // Allow invalid JSON while typing, but maybe validate on submit
    }
  };

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

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow border border-gray-200 space-y-6 max-w-4xl">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">商品名 (JP)</label>
          <input required type="text" className="input-base" value={formData.title_jp} onChange={e => setFormData({...formData, title_jp: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slug (URL)</label>
          <input required type="text" className="input-base" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">SKU</label>
          <input required type="text" className="input-base" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">表示順 (Sort Order)</label>
          <input type="number" className="input-base" value={formData.sort_order} onChange={e => setFormData({...formData, sort_order: Number(e.target.value)})} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">価格 (¥)</label>
          <input required type="number" className="input-base" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">定価/比較価格 (¥) [任意]</label>
          <input type="number" className="input-base" value={formData.compare_at_price || ''} onChange={e => setFormData({...formData, compare_at_price: e.target.value ? Number(e.target.value) : null})} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">在庫数</label>
          <input required type="number" className="input-base" value={formData.stock_qty} onChange={e => setFormData({...formData, stock_qty: Number(e.target.value)})} />
        </div>
        <div className="flex items-center gap-6 mt-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formData.in_stock} onChange={e => setFormData({...formData, in_stock: e.target.checked})} className="w-5 h-5 accent-primary" />
            <span className="font-medium">在庫あり</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="w-5 h-5 accent-primary" />
            <span className="font-medium">公開する</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">商品画像</label>
        <ImageUploader images={formData.images || []} onChange={imgs => setFormData({...formData, images: imgs})} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">短い説明</label>
        <textarea className="input-base h-20" value={formData.short_desc_jp || ''} onChange={e => setFormData({...formData, short_desc_jp: e.target.value})} />
      </div>

      <div className="grid grid-cols-2 gap-6">
         <div>
            <label className="block text-sm font-medium mb-1">Tags (カンマ区切り)</label>
            <input type="text" className="input-base" value={(formData.tags || []).join(', ')} onChange={e => handleArrayInput('tags', e.target.value)} />
         </div>
         <div>
            <label className="block text-sm font-medium mb-1">Collections (カンマ区切り)</label>
            <input type="text" className="input-base" placeholder="best-sellers, new-arrivals" value={(formData.collection_handles || []).join(', ')} onChange={e => handleArrayInput('collection_handles', e.target.value)} />
         </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">バリエーション (JSON)</label>
        <p className="text-xs text-gray-400 mb-1">例: {`[{"name":"Color","options":["Red","Blue"]}]`}</p>
        <textarea 
          className="input-base font-mono text-xs h-32" 
          defaultValue={JSON.stringify(formData.variants || [], null, 2)} 
          onChange={e => handleJsonInput('variants', e.target.value)} 
        />
      </div>

      <div className="pt-4 flex justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="btn-secondary">キャンセル</button>
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          {saving && <Loader2 className="animate-spin" size={16} />}
          保存する
        </button>
      </div>
    </form>
  );
}