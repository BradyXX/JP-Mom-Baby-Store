'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
// TopBar removed
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchDrawer from "@/components/drawers/SearchDrawer";
import CartDrawer from "@/components/drawers/CartDrawer";
import CategoryDrawer from "@/components/drawers/CategoryDrawer";
import CookieConsent from "@/components/CookieConsent";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    // Admin Mode: Render only children (layout is handled by app/admin/layout.tsx)
    return <>{children}</>;
  }

  // Shop Mode: Render full chrome
  return (
    <>
      <Header />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
      <SearchDrawer />
      <CartDrawer />
      <CategoryDrawer />
      <CookieConsent />
      <MobileBottomNav />
    </>
  );
}