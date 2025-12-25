'use client';
import { useEffect, useState } from 'react';
import { adminGetProduct } from '@/lib/supabase/queries';
import ProductForm from '../product-form';
import { Loader2 } from 'lucide-react';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await adminGetProduct(Number(params.id));
        setProduct(data);
      } catch (e) {
        alert('Product not found');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) return <Loader2 className="animate-spin" />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">商品編集: {product.title_jp}</h1>
      <ProductForm initialData={product} />
    </div>
  );
}