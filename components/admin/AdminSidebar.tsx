'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Package, Ticket, Settings, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products', label: '商品管理', icon: ShoppingBag },
    { href: '/admin/orders', label: '注文管理', icon: Package },
    { href: '/admin/coupons', label: 'クーポン', icon: Ticket },
    { href: '/admin/settings', label: '設定', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex-shrink-0 flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-widest uppercase">Admin</h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
              pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                ? 'bg-primary text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-400 hover:bg-gray-800 rounded-md transition-colors"
        >
          <LogOut size={20} />
          <span className="text-sm font-medium">ログアウト</span>
        </button>
      </div>
    </aside>
  );
}