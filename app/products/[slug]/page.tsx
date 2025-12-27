
import React from 'react';
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
        
        {/* Trust Section (Detailed Policies) */}
        <div className="max-w-xl mx-auto">
           <ProductTrustSection />
        </div>

        {/* FAQs - General Service Questions */}
        <section className="bg-gray-50 p-6 rounded-2xl">
          <h3 className="font-bold text-gray-800 mb-4 text-center">よくある質問</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-2">
            <Accordion title="Q. いつ届きますか？">
              <p>通常ご注文後、1〜3営業日以内に国内倉庫（大阪・東京）より発送いたします。発送後は追跡番号をメールまたはLINEにてお知らせします。</p>
            </Accordion>
            <Accordion title="Q. 支払い方法は？">
              <p>「代金引換（現金のみ）」に対応しています。商品受け取り時に配達員へお支払いください。クレジットカード情報の入力が不要で安心です。</p>
            </Accordion>
            <Accordion title="Q. 返品・交換はできますか？">
              <p>はい、初期不良やサイズ違いなど、商品到着後7日以内であれば対応可能です。未使用の状態に限りますので、まずはご相談ください。</p>
            </Accordion>
            <Accordion title="Q. LINEで問い合わせできますか？">
              <p>はい、LINE公式アカウントから24時間お問い合わせを受け付けています（返信は営業時間内となります）。注文後の変更や相談もLINEが便利です。</p>
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