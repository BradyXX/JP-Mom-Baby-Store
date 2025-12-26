import { notFound } from 'next/navigation';
import { getProductBySlug, listProductsByIds } from "@/lib/supabase/queries";
import ProductDetail from "@/components/ProductDetail";
import ProductDescription from "@/components/ProductDescription";
import ProductTrustSection from "@/components/ProductTrustSection";
import Accordion from "@/components/Accordion";
import Carousel from "@/components/Carousel";
import ProductCard from "@/components/ProductCard";

// Force dynamic to ensure we always fetch fresh data from DB, avoiding stale cache issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface DescriptionSection {
  type: 'text' | 'image' | 'bullets';
  content?: string;
  url?: string;
  items?: string[];
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  // 1. Decode URL slug to handle Japanese characters correctly
  const decodedSlug = decodeURIComponent(params.slug);

  // 2. Fetch product strictly by slug
  const product = await getProductBySlug(decodedSlug);

  // 3. Strict 404 if not found (no fallback to default/first product)
  if (!product) return notFound();

  // Fetch Recommended Products
  const recommended = await listProductsByIds(product.recommended_product_ids || []);

  // Parse Long Description (JSON)
  // Logic: Only use long_desc_sections. Do NOT fallback to 'description' here.
  const descriptionSections = Array.isArray(product.long_desc_sections)
    ? (product.long_desc_sections as unknown as DescriptionSection[])
    : [];

  return (
    <div className="pb-24 md:pb-16 bg-white">
      {/* Top Section */}
      <div className="container-base py-4 md:py-12">
        <ProductDetail product={product} />
      </div>

      <div className="border-t border-gray-100 my-2 md:my-8" />

      {/* Description Content - Moved ABOVE Trust Section for better flow */}
      <div className="container-base max-w-3xl mx-auto mb-16 space-y-12">
        
        {/* Long Description Block (Expandable) */}
        <section>
           <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
              <span className="w-1 h-6 bg-primary rounded-full"></span>
              アイテム詳細
           </h2>
           <ProductDescription sections={descriptionSections} />
        </section>
        
        {/* Trust Section (General Policies) */}
        <div className="max-w-xl mx-auto">
           <ProductTrustSection />
        </div>

        {/* FAQs */}
        <section className="bg-gray-50 p-6 rounded-2xl">
          <h3 className="font-bold text-gray-800 mb-4 text-center">よくある質問</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-2">
            <Accordion title="送料はいくらですか？">
              <p>全国一律600円です。10,000円以上のお買い上げで送料無料となります。</p>
            </Accordion>
            <Accordion title="返品・交換はできますか？">
              <p>商品到着後7日以内であれば、未使用品に限り返品・交換を承ります。カスタマーサポートまでご連絡ください。</p>
            </Accordion>
            <Accordion title="ギフトラッピングは対応していますか？">
              <p>はい、+300円でギフトラッピングを承っております。カート画面でご指定いただけます。</p>
            </Accordion>
          </div>
        </section>
      </div>

      {/* Recommended Products */}
      {recommended.length > 0 && (
        <div className="bg-gray-50 py-12 border-t border-gray-200">
           <Carousel title="こちらもおすすめ">
              {recommended.map(p => (
                 <div key={p.id} className="w-40 md:w-56 flex-shrink-0 snap-start">
                    <ProductCard product={p} />
                 </div>
              ))}
           </Carousel>
        </div>
      )}
    </div>
  );
}