
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminUpsertProduct, listCollections } from '@/lib/supabase/queries';
import { Product } from '@/lib/supabase/types';
import ImageUploader from '@/components/admin/ImageUploader';
import { Loader2 } from 'lucide-react';

export default function ProductForm({ initialData }: { initialData?: Partial<Product> }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
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
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium mb-1">商品名 (JP)</label>
          <input required type="text" className="input-base" value={formData.title_jp} onChange={e => setFormData({...formData, title_jp: e.target.value})} />
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium mb-1">カテゴリー</label>
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
        <div>
          <label className="block text-sm font-medium mb-1">Slug (URL)</label>
          <input required type="text" className="input-base" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">SKU</label>
          <input required type="text" className="input-base" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">価格 (¥)</label>
          <input required type="number" className="input-base" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">在庫数</label>
          <input required type="number" className="input-base" value={formData.stock_qty} onChange={e => setFormData({...formData, stock_qty: Number(e.target.value)})} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">商品画像 (一括アップロード・並び替え可能)</label>
        <ImageUploader images={formData.images || []} onChange={imgs => setFormData({...formData, images: imgs})} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">短い説明</label>
        <textarea className="input-base h-20" value={formData.short_desc_jp || ''} onChange={e => setFormData({...formData, short_desc_jp: e.target.value})} />
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
