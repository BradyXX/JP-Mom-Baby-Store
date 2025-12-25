'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      // Skip check for login page
      if (pathname === '/admin/login') {
        setAuthorized(true);
        setLoading(false);
        return;
      }

      // 1. Get Current User
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('No user session found');
        router.push('/admin/login');
        return;
      }

      // DEBUG: Development Environment Output
      if (process.env.NODE_ENV === 'development') {
        console.group('🔒 Admin Auth Debug');
        console.log('Current User ID:', user.id);
        
        // Explicitly query for debug view
        const { data: debugData, error: debugDbError } = await supabase
          .from('admin_users')
          .select('user_id, role')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('Query: from("admin_users").eq("user_id", uid).maybeSingle()');
        console.log('Result:', debugData);
        if (debugDbError) console.error('DB Error:', debugDbError);
        console.groupEnd();
      }

      // 2. Query admin_users with correct field (user_id)
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('user_id, role')
        .eq('user_id', user.id)
        .maybeSingle();

      // 3. Check permission
      if (!adminUser) {
        if (process.env.NODE_ENV === 'development') {
          alert(`[Debug] 管理者権限がありません。\nUID: ${user.id}\nadmin_usersテーブルにこのUIDが存在するか確認してください。`);
        } else {
          alert('管理者権限がありません');
        }
        await supabase.auth.signOut();
        router.push('/admin/login');
        return;
      }

      // 4. Authorized
      setAuthorized(true);
      setLoading(false);
    };

    checkAuth();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 flex-col gap-4">
        <Loader2 className="animate-spin text-gray-400" size={32} />
        <p className="text-gray-500 text-sm">Checking permissions...</p>
      </div>
    );
  }

  // Login page layout (no sidebar)
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Admin Dashboard layout
  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        {children}
      </main>
    </div>
  );
}