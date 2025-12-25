import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getProductBySlug, listProductsByIds } from "@/lib/supabase/queries";
import ProductDetail from "@/components/ProductDetail";
import Accordion from "@/components/Accordion";
import Carousel from "@/components/Carousel";
import ProductCard from "@/components/ProductCard";

interface DescriptionSection {
  type: 'text' | 'image' | 'bullets';
  content?: string;
  url?: string;
  items?: string[];
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);

  if (!product) return notFound();

  // Fetch Recommended Products
  const recommended = await listProductsByIds(product.recommended_product_ids || []);

  // Parse Long Description
  const descriptionSections = Array.isArray(product.long_desc_sections)
    ? (product.long_desc_sections as unknown as DescriptionSection[])
    : [];

  return (
    <div className="pb-16">
      {/* Top Section */}
      <div className="container-base py-8 md:py-12">
        <ProductDetail product={product} />
      </div>

      {/* Description Content */}
      <div className="container-base max-w-3xl mx-auto mb-16 space-y-8">
        <h2 className="text-lg font-bold border-l-4 border-primary pl-4">アイテム詳細</h2>
        
        {descriptionSections.length > 0 ? (
          <div className="space-y-8">
            {descriptionSections.map((section, idx) => {
              if (section.type === 'text') {
                return <p key={idx} className="text-gray-700 leading-8 whitespace-pre-wrap">{section.content}</p>;
              }
              if (section.type === 'image' && section.url) {
                return (
                  <div key={idx} className="relative w-full aspect-video md:aspect-[16/9] rounded-lg overflow-hidden bg-gray-100">
                     <img src={section.url} alt="" className="w-full h-auto" />
                  </div>
                );
              }
              if (section.type === 'bullets' && section.items) {
                return (
                  <ul key={idx} className="list-disc pl-5 space-y-2 text-gray-700">
                    {section.items.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                );
              }
              return null;
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">詳細情報はありません。</p>
        )}

        {/* FAQs */}
        <div className="border-t border-gray-100 pt-8 mt-12">
          <h3 className="font-bold text-gray-800 mb-4">よくある質問</h3>
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
      </div>

      {/* Recommended Products */}
      {recommended.length > 0 && (
        <div className="bg-gray-50 py-12">
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