'use client';

import { useState } from 'react';
import { clearSession } from '@/lib/auth';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { LayoutDashboard, LogOut, Menu, Package, Tag, Warehouse } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Productos', icon: Package },
  { href: '/categories', label: 'Categorías', icon: Tag },
  { href: '/stock', label: 'Stock', icon: Warehouse },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
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
            {label}
          </Link>
        );
      })}
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    clearSession();
    router.push('/login');
  }

  const bottomSection = (
    <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
      <ThemeToggle className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors" />
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
      >
        <LogOut size={16} />
        Cerrar sesión
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-sidebar border-r border-sidebar-border">
        <div className="px-5 py-6 border-b border-sidebar-border">
          <h1 className="text-lg font-bold text-sidebar-foreground">Inventario360</h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLinks pathname={pathname} />
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
        <h1 className="ml-3 text-base font-bold text-sidebar-foreground">Inventario360</h1>
      </header>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-60 p-0 bg-sidebar border-sidebar-border flex flex-col gap-0"
        >
          <div className="px-5 py-6 border-b border-sidebar-border">
            <h1 className="text-lg font-bold text-sidebar-foreground">Inventario360</h1>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
          </nav>
          {bottomSection}
        </SheetContent>
      </Sheet>
    </>
  );
}
