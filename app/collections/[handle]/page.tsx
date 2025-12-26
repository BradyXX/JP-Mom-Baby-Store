
import Link from 'next/link';
import { listProductsByCollection, ProductListOptions } from "@/lib/supabase/queries";
import ProductCard from "@/components/ProductCard";
import CollectionFilters from "@/components/CollectionFilters";
import { SHOP_CATEGORIES } from "@/lib/categories";

// Use centralized categories for titles, fallback to handle formatter
const getCollectionTitle = (handle: string) => {
  const found = SHOP_CATEGORIES.find(c => c.handle === handle);
  if (found) return found.name;
  
  // Static map for others or fallbacks
  const STATIC_MAP: Record<string, string> = {
    'all': '全商品',
    'sale': 'セール',
  };
  return STATIC_MAP[handle] || handle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
  const title = getCollectionTitle(handle);

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
    <div className="container-base py-6 md:py-10 min-h-[60vh]">
      {/* Breadcrumb-ish Header */}
      <div className="mb-6 border-b pb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">{title}</h1>
        <p className="text-gray-500 text-xs md:text-sm">{products.length} アイテム</p>
      </div>

      {/* Filters */}
      <CollectionFilters availableTags={uniqueTags} />

      {/* Grid */}
      {products.length === 0 ? (
        <div className="py-20 text-center bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4 font-medium">条件に一致する商品は見つかりませんでした。</p>
            <Link href="/" className="btn-secondary inline-block">
                ホームに戻る
            </Link>
        </div>
      ) : (
        // Mobile: 2 cols, Desktop: 4 cols
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6 md:gap-x-6 md:gap-y-10">
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
                className="btn-secondary py-2 px-6 text-sm"
            >
                前へ
            </Link>
        )}
        {products.length === (options.pageSize || 20) && (
             <Link 
                href={`?page=${(options.page || 1) + 1}`}
                className="btn-secondary py-2 px-6 text-sm"
            >
                次へ
            </Link>
        )}
      </div>
    </div>
  );
}
