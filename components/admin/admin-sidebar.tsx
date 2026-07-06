'use client';

import { api } from '@/lib/api';
import { clearSession } from '@/lib/auth';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { LayoutDashboard, LogOut, Menu, MessageSquare, Store } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/comercios', label: 'Comercios', icon: Store },
  { href: '/admin/mensajes', label: 'Mensajes', icon: MessageSquare },
];

function NavLinks({
  pathname,
  pendingCount,
  onNavigate,
}: {
  pathname: string;
  pendingCount: number;
  onNavigate?: () => void;
}) {
  return (
    <>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        const isMensajes = href === '/admin/mensajes';
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
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
    </>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void api
      .get<number>('/messages/pending-count')
      .then(setPendingCount)
      .catch(() => null);
  }, [pathname]);

  function handleLogout() {
    clearSession();
    router.push('/admin/login');
  }

  const bottomSection = (
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
  );

  const headerContent = (
    <div className="px-5 py-6 border-b border-sidebar-border">
      <p className="text-xs font-semibold text-primary uppercase tracking-widest">Admin</p>
      <h1 className="text-lg font-bold text-sidebar-foreground mt-0.5">Inventario360</h1>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-sidebar border-r border-sidebar-border">
        {headerContent}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLinks pathname={pathname} pendingCount={pendingCount} />
        </nav>
        {bottomSection}
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 flex items-center px-4 bg-sidebar border-b border-sidebar-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          className="text-sidebar-foreground"
        >
          <Menu size={20} />
        </Button>
        <div className="ml-3">
          <p className="text-[10px] font-semibold text-primary uppercase tracking-widest leading-none">
            Admin
          </p>
          <h1 className="text-sm font-bold text-sidebar-foreground">Inventario360</h1>
        </div>
        {pendingCount > 0 && (
          <span className="ml-auto bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
            {pendingCount > 99 ? '99+' : pendingCount}
          </span>
        )}
      </header>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-60 p-0 bg-sidebar border-sidebar-border flex flex-col gap-0"
        >
          {headerContent}
          <nav className="flex-1 px-3 py-4 space-y-1">
            <NavLinks
              pathname={pathname}
              pendingCount={pendingCount}
              onNavigate={() => setOpen(false)}
            />
          </nav>
          {bottomSection}
        </SheetContent>
      </Sheet>
    </>
  );
}
