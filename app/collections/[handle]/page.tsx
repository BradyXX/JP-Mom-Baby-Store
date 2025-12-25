
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listProductsByCollection, ProductListOptions } from "@/lib/supabase/queries";
import ProductCard from "@/components/ProductCard";
import CollectionFilters from "@/components/CollectionFilters";

// Static mapping for collection titles
const COLLECTION_TITLES: Record<string, string> = {
  'all': '全商品',
  'best-sellers': 'ベストセラー',
  'new-arrivals': '新着アイテム',
  'sale': 'セール',
  'newborn': '新生児 (0-6ヶ月)',
  'baby-clothing': 'ベビー服',
  'kids-clothing': 'キッズ服',
  'maternity': 'マタニティ',
  'toys': 'おもちゃ',
  'gift': 'ギフト',
  'strollers': 'ベビーカー',
  'feeding': '授乳・お食事',
};

interface PageProps {
  params: { handle: string };
  searchParams: {
    sort?: string;
    inStock?: string;
    tags?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  };
}

export default async function CollectionPage({ params, searchParams }: PageProps) {
  const { handle } = params;
  
  const title = COLLECTION_TITLES[handle] || handle.replace(/-/g, ' ');

  // Parse Query Params
  const options: ProductListOptions = {
    limit: 100, // Hard limit for MVP
    page: Number(searchParams.page) || 1,
    pageSize: 20,
    sort: (searchParams.sort as any) || 'new',
    inStockOnly: searchParams.inStock === 'true',
    tagFilters: searchParams.tags ? searchParams.tags.split(',') : undefined,
    priceMin: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    priceMax: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
  };

  const products = await listProductsByCollection(handle, options);

  // Aggregate popular tags from the current product list
  const allTags = products.flatMap(p => p.tags || []) as string[];
  const uniqueTags = Array.from(new Set(allTags)).slice(0, 12); // Top 12 tags

  return (
    <div className="container-base py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 capitalize mb-2">{title}</h1>
        <p className="text-gray-500 text-sm">{products.length} アイテム</p>
      </div>

      {/* Filters */}
      <CollectionFilters availableTags={uniqueTags} />

      {/* Grid */}
      {products.length === 0 ? (
        <div className="py-20 text-center bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">商品が見つかりませんでした。</p>
            <Link href="/" className="text-primary border-b border-primary text-sm">
                ホームに戻る
            </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-y-12">
            {products.map((product) => (
            <ProductCard key={product.id} product={product} />
            ))}
        </div>
      )}
      
      {/* Simple Pagination (Next/Prev) */}
      <div className="mt-12 flex justify-center gap-4">
        {options.page! > 1 && (
            <Link 
                href={`?page=${options.page! - 1}`}
                className="btn-secondary py-2 px-4 text-xs"
            >
                前のページ
            </Link>
        )}
        {products.length === (options.pageSize || 20) && (
             <Link 
                href={`?page=${(options.page || 1) + 1}`}
                className="btn-secondary py-2 px-4 text-xs"
            >
                次のページ
            </Link>
        )}
      </div>
    </div>
  );
}
