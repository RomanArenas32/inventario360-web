'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { clearSession } from '@/lib/auth';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  Check,
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Tag,
  User,
  Users,
  Warehouse,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Productos', icon: Package },
  { href: '/categories', label: 'Categorías', icon: Tag },
  { href: '/stock', label: 'Stock', icon: Warehouse },
  { href: '/team', label: 'Equipo', icon: Users, ownerOnly: true },
];

function NavLinks({
  pathname,
  tenantRole,
  onNavigate,
}: {
  pathname: string;
  tenantRole: string | null;
  onNavigate?: () => void;
}) {
  return (
    <>
      {NAV_ITEMS.filter((item) => !item.ownerOnly || tenantRole === 'owner').map(
        ({ href, label, icon: Icon }) => {
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
        },
      )}
    </>
  );
}

type TenantOption = { id: string; name: string; role: string };
type SidebarData = {
  userName: string;
  activeTenantId: string;
  activeTenantName: string;
  tenantRole: string | null;
  allTenants: TenantOption[];
};

const ROLE_LABEL: Record<string, string> = { owner: 'Dueño', staff: 'Empleado' };

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<SidebarData | null>(null);

  useEffect(() => {
    void api
      .get<{
        name: string;
        tenantRole: string | null;
        tenant: { id: string; name: string } | null;
        tenants: TenantOption[];
      }>('/auth/me')
      .then((me) => {
        if (me.tenant) {
          setData({
            userName: me.name,
            activeTenantId: me.tenant.id,
            activeTenantName: me.tenant.name,
            tenantRole: me.tenantRole,
            allTenants: me.tenants,
          });
        }
      })
      .catch(() => null);
  }, []);

  function handleLogout() {
    clearSession();
    router.push('/login');
  }

  async function handleSwitchTenant(tenantId: string) {
    if (tenantId === data?.activeTenantId) return;
    try {
      await api.post('/auth/switch-tenant', { tenantId });
      window.location.assign('/dashboard');
    } catch {
      // silent
    }
  }

  const tenantHeader = (onClose?: () => void) => {
    const canSwitch = (data?.allTenants.length ?? 0) > 1;

    if (!canSwitch) {
      return (
        <div className="px-5 py-5 border-b border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/50 uppercase tracking-widest mb-0.5">
            Inventario360
          </p>
          <h1 className="text-base font-bold text-sidebar-foreground leading-tight">
            {data?.activeTenantName ?? '—'}
          </h1>
        </div>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="w-full text-left px-5 py-5 border-b border-sidebar-border hover:bg-sidebar-accent transition-colors outline-none">
          <p className="text-xs text-sidebar-foreground/50 uppercase tracking-widest mb-0.5">
            Inventario360
          </p>
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-base font-bold text-sidebar-foreground leading-tight truncate">
              {data?.activeTenantName ?? '—'}
            </h1>
            <ChevronsUpDown size={14} className="shrink-0 text-sidebar-foreground/40" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start" sideOffset={0}>
          <DropdownMenuLabel>Negocios</DropdownMenuLabel>
          {data?.allTenants.map((t) => (
            <DropdownMenuItem
              key={t.id}
              onClick={() => {
                onClose?.();
                void handleSwitchTenant(t.id);
              }}
            >
              <span className="flex items-center gap-2 flex-1 min-w-0">
                <Check
                  size={12}
                  className={t.id === data.activeTenantId ? 'opacity-100' : 'opacity-0'}
                />
                <span className="truncate">{t.name}</span>
              </span>
              <span className="ml-2 text-xs text-muted-foreground shrink-0">
                {ROLE_LABEL[t.role] ?? t.role}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const bottomSection = (
    <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
      <Link
        href="/profile"
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          pathname === '/profile'
            ? 'bg-primary text-primary-foreground'
            : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
        }`}
      >
        <User size={16} />
        {data?.userName ?? 'Mi perfil'}
      </Link>
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
        {tenantHeader()}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLinks pathname={pathname} tenantRole={data?.tenantRole ?? null} />
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
          <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-widest leading-none">
            Inventario360
          </p>
          <h1 className="text-sm font-bold text-sidebar-foreground">
            {data?.activeTenantName ?? '—'}
          </h1>
        </div>
      </header>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-60 p-0 bg-sidebar border-sidebar-border flex flex-col gap-0"
        >
          {tenantHeader(() => setOpen(false))}
          <nav className="flex-1 px-3 py-4 space-y-1">
            <NavLinks
              pathname={pathname}
              tenantRole={data?.tenantRole ?? null}
              onNavigate={() => setOpen(false)}
            />
          </nav>
          {bottomSection}
        </SheetContent>
      </Sheet>
    </>
  );
}
