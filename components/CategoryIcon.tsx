
import { Star, Clock, Baby, Shirt, ToyBrick, Gift, Heart, Smile } from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  'star': Star,
  'clock': Clock,
  'baby': Baby,
  'smile': Smile,
  'shirt': Shirt,
  'toy-brick': ToyBrick,
  'heart': Heart,
  'gift': Gift,
};

interface CategoryIconProps {
  name?: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export default function CategoryIcon({ name, size = 24, className, strokeWidth = 2 }: CategoryIconProps) {
  if (!name) return null;
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon size={size} className={className} strokeWidth={strokeWidth} />;
}
