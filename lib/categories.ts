
export interface CategoryDef {
  id: string;
  name: string;
  handle: string;
  iconName?: string; // Changed from 'icon' component to string identifier
  color?: string;
  subTitle?: string;
}

// Hibobi-style category list with string identifiers for icons
export const SHOP_CATEGORIES: CategoryDef[] = [
  { id: 'best-sellers', name: 'ベストセラー', handle: 'best-sellers', subTitle: 'Best Sellers', iconName: 'star', color: 'bg-yellow-100 text-yellow-600' },
  { id: 'new-arrivals', name: '新着アイテム', handle: 'new-arrivals', subTitle: 'New Arrivals', iconName: 'clock', color: 'bg-green-100 text-green-600' },
  { id: 'newborn', name: '新生児 (0-6ヶ月)', handle: 'newborn', subTitle: 'Newborn', iconName: 'baby', color: 'bg-pink-100 text-pink-600' },
  { id: 'baby', name: 'ベビー服', handle: 'baby-clothing', subTitle: 'Baby Clothes', iconName: 'smile', color: 'bg-blue-100 text-blue-600' },
  { id: 'kids', name: 'キッズ服', handle: 'kids-clothing', subTitle: 'Kids Clothes', iconName: 'shirt', color: 'bg-purple-100 text-purple-600' },
  { id: 'toys', name: 'おもちゃ', handle: 'toys', subTitle: 'Toys & Fun', iconName: 'toy-brick', color: 'bg-orange-100 text-orange-600' },
  { id: 'maternity', name: 'マタニティ', handle: 'maternity', subTitle: 'Maternity', iconName: 'heart', color: 'bg-red-100 text-red-600' },
  { id: 'gifts', name: 'ギフト', handle: 'gifts', subTitle: 'Gifts', iconName: 'gift', color: 'bg-teal-100 text-teal-600' },
];
