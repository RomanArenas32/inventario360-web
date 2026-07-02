'use client';

import { api } from '@/lib/api';
import { clearSession } from '@/lib/auth';
import { ThemeToggle } from '@/components/theme-toggle';
import { LayoutDashboard, LogOut, MessageSquare, Store } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/comercios', label: 'Comercios', icon: Store },
  { href: '/admin/mensajes', label: 'Mensajes', icon: MessageSquare },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    void api.get<number>('/messages/pending-count').then(setPendingCount).catch(() => null);
  }, [pathname]);

  function handleLogout() {
    clearSession();
    router.push('/admin/login');
  }

  return (
    <aside className="w-60 flex flex-col bg-sidebar border-r border-sidebar-border">
      <div className="px-5 py-6 border-b border-sidebar-border">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest">Admin</p>
        <h1 className="text-lg font-bold text-sidebar-foreground mt-0.5">Inventario360</h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          const isMensajes = href === '/admin/mensajes';
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
              }`}
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {isMensajes && pendingCount > 0 && (
                <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        <ThemeToggle className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors" />
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
