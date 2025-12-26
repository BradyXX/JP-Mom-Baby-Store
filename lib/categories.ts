
import { Star, Clock, Baby, Shirt, ToyBrick, Gift, Heart, Smile } from 'lucide-react';

export interface CategoryDef {
  id: string;
  name: string;
  handle: string;
  icon?: any; // Lucide icon component
  color?: string;
}

export const SHOP_CATEGORIES: CategoryDef[] = [
  { id: 'best-sellers', name: 'ベストセラー', handle: 'best-sellers', icon: Star, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'new-arrivals', name: '新着アイテム', handle: 'new-arrivals', icon: Clock, color: 'bg-green-100 text-green-600' },
  { id: 'newborn', name: '新生児 (0-6ヶ月)', handle: 'newborn', icon: Baby, color: 'bg-pink-100 text-pink-600' },
  { id: 'baby', name: 'ベビー服', handle: 'baby-clothing', icon: Smile, color: 'bg-blue-100 text-blue-600' },
  { id: 'kids', name: 'キッズ服', handle: 'kids-clothing', icon: Shirt, color: 'bg-purple-100 text-purple-600' },
  { id: 'toys', name: 'おもちゃ', handle: 'toys', icon: ToyBrick, color: 'bg-orange-100 text-orange-600' },
  { id: 'maternity', name: 'マタニティ', handle: 'maternity', icon: Heart, color: 'bg-red-100 text-red-600' },
  { id: 'gifts', name: 'ギフト', handle: 'gifts', icon: Gift, color: 'bg-teal-100 text-teal-600' },
];
