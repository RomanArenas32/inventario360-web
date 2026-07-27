'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { clearSession } from '@/lib/auth';
import { AppSidebar } from '@/components/shared/app-sidebar';
import type { SidebarNavItem } from '@/components/shared/app-sidebar';
import { Boxes, LayoutDashboard, MessageSquare, Store } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    void api
      .get<number>('/messages/pending-count')
      .then(setPendingCount)
      .catch(() => null);
  }, [pathname]);

  async function handleLogout() {
    try {
      await api.post('/admin/auth/logout', {});
    } catch {
      // ignorar errores — igual limpiamos la sesión local
    }
    clearSession();
    router.push('/admin/login');
  }

  const navItems: SidebarNavItem[] = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/comercios', label: 'Comercios', icon: Store },
    { href: '/admin/mensajes', label: 'Mensajes', icon: MessageSquare, badge: pendingCount },
  ];

  const header = (
    <div className="px-5 py-6 border-b border-sidebar-border">
      <div className="flex items-center gap-2 mb-0.5">
        <div className="flex items-center justify-center w-5 h-5 rounded bg-primary text-primary-foreground shrink-0">
          <Boxes size={11} />
        </div>
        <p className="text-xs font-semibold text-primary uppercase tracking-widest">Admin</p>
      </div>
      <h1 className="text-lg font-bold text-sidebar-foreground pl-7">Inventario360</h1>
    </div>
  );

  const collapsedHeader = (
    <div className="flex justify-center py-6 border-b border-sidebar-border">
      <div className="flex items-center justify-center w-5 h-5 rounded bg-primary text-primary-foreground">
        <Boxes size={11} />
      </div>
    </div>
  );

  const mobileHeader = (
    <>
      <p className="text-[10px] font-semibold text-primary uppercase tracking-widest leading-none">
        Admin
      </p>
      <h1 className="text-sm font-bold text-sidebar-foreground">Inventario360</h1>
    </>
  );

  const mobileBadge =
    pendingCount > 0 ? (
      <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
        {pendingCount > 99 ? '99+' : pendingCount}
      </span>
    ) : null;

  return (
    <AppSidebar
      navItems={navItems}
      header={header}
      collapsedHeader={collapsedHeader}
      mobileHeader={mobileHeader}
      mobileBadge={mobileBadge}
      onLogout={() => void handleLogout()}
    />
  );
}
