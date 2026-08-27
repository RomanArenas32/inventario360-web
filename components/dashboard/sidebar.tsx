'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { clearSession } from '@/lib/auth';
import { AppSidebar } from '@/components/shared/app-sidebar';
import type { SidebarNavItem } from '@/components/shared/app-sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Check,
  ChevronsUpDown,
  LayoutDashboard,
  Package,
  Settings,
  User,
  Users,
  Warehouse,
  CalendarDays,
  ShoppingCart,
  Scissors,
} from 'lucide-react';
import { NotificationBell, NotificationBellMobile } from '@/components/shared/notification-bell';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

// Ítems que el owner puede restringir para staff (module key → nav item)
const MODULE_NAV: Record<string, SidebarNavItem> = {
  products: { href: '/products', label: 'Productos', icon: Package },
  turns: { href: '/turns', label: 'Turnos', icon: CalendarDays },
  stock: { href: '/stock', label: 'Stock', icon: Warehouse },
  sales: { href: '/sales', label: 'Ventas', icon: ShoppingCart },
  services: { href: '/services', label: 'Servicios', icon: Scissors },
};

type TenantOption = { id: string; name: string; role: string };
type SidebarData = {
  userName: string;
  avatarUrl: string | null;
  activeTenantId: string;
  activeTenantName: string;
  tenantRole: string | null;
  staffModules: string[] | null;
  allTenants: TenantOption[];
};

const ROLE_LABEL: Record<string, string> = { owner: 'Dueño', staff: 'Empleado' };

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [data, setData] = useState<SidebarData | null>(null);

  useEffect(() => {
    void api
      .get<{
        name: string;
        avatarUrl: string | null;
        tenantRole: string | null;
        tenant: { id: string; name: string; staffModules: string[] | null } | null;
        tenants: TenantOption[];
      }>('/auth/me')
      .then((me) => {
        if (me.tenant) {
          setData({
            userName: me.name,
            avatarUrl: me.avatarUrl ?? null,
            activeTenantId: me.tenant.id,
            activeTenantName: me.tenant.name,
            tenantRole: me.tenantRole,
            staffModules: me.tenant.staffModules,
            allTenants: me.tenants,
          });
        }
      })
      .catch(() => null);
  }, []);

  async function handleLogout() {
    try {
      await api.post('/auth/logout', {});
    } catch {
      // ignorar errores — igual limpiamos la sesión local
    }
    clearSession();
    router.push('/login');
  }

  async function handleSwitchTenant(tenantId: string, onClose?: () => void) {
    if (tenantId === data?.activeTenantId) return;
    onClose?.();
    try {
      await api.post('/auth/switch-tenant', { tenantId });
      window.location.assign('/dashboard');
    } catch {
      // silent
    }
  }

  const isOwner = data?.tenantRole === 'owner';

  const navItems: SidebarNavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    // Módulos controlables — si es staff, filtrar según staffModules del tenant
    ...Object.entries(MODULE_NAV)
      .filter(([key]) => {
        if (isOwner) return true;
        const allowed = data?.staffModules;
        return allowed === null || allowed === undefined || allowed.includes(key);
      })
      .map(([, item]) => item),
    // Solo owners
    ...(isOwner ? [{ href: '/team', label: 'Equipo', icon: Users } as SidebarNavItem] : []),
  ];

  const tenantHeader = (onClose?: () => void) => {
    const canSwitch = (data?.allTenants.length ?? 0) > 1;

    if (!canSwitch) {
      return (
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2 mb-1">
            <Image
              src="/logos/logo-color.svg"
              alt="Inventario360"
              width={16}
              height={16}
              className="size-8 shrink-0"
              unoptimized
            />
            <p className="text-xs text-sidebar-foreground/50 tracking-widest">Inventario360</p>
          </div>
          <h1 className="text-base font-bold text-sidebar-foreground leading-tight pl-7">
            {data?.activeTenantName ?? '—'}
          </h1>
        </div>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="w-full text-left px-5 py-5 border-b border-sidebar-border hover:bg-sidebar-accent transition-colors outline-none">
          <div className="flex items-center gap-2 mb-1">
            <Image
              src="/logos/logo-color.svg"
              alt="Inventario360"
              width={16}
              height={16}
              className="size-8 shrink-0"
              unoptimized
            />
            <p className="text-xs text-sidebar-foreground/50 uppercase tracking-widest">
              Inventario360
            </p>
          </div>
          <div className="flex items-center justify-between gap-2 pl-7">
            <h1 className="text-base font-bold text-sidebar-foreground leading-tight truncate">
              {data?.activeTenantName ?? '—'}
            </h1>
            <ChevronsUpDown size={14} className="shrink-0 text-sidebar-foreground/40" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start" sideOffset={0}>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Negocios</DropdownMenuLabel>
            {data?.allTenants.map((t) => (
              <DropdownMenuItem key={t.id} onClick={() => void handleSwitchTenant(t.id, onClose)}>
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
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const collapsedHeader = (
    <div className="flex justify-center py-5 border-b border-sidebar-border">
      <Image
        src="/logos/logo-color.svg"
        alt="Inventario360"
        width={16}
        height={16}
        className="w-4 h-4"
        unoptimized
      />
    </div>
  );

  const bottomExtra = (collapsed: boolean) => (
    <>
      <NotificationBell collapsed={collapsed} />
      {isOwner && (
        <Link
          href="/settings"
          title={collapsed ? 'Integraciones' : undefined}
          className={`flex items-center py-2 rounded-lg text-sm font-medium transition-colors ${
            collapsed ? 'justify-center px-2' : 'gap-3 px-3'
          } ${
            pathname === '/settings'
              ? 'bg-primary text-primary-foreground'
              : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
          }`}
        >
          <Settings size={16} />
          {!collapsed && 'Integraciones'}
        </Link>
      )}
      <Link
        href="/profile"
        title={collapsed ? (data?.userName ?? 'Mi perfil') : undefined}
        className={`flex items-center py-2 rounded-lg text-sm font-medium transition-colors ${
          collapsed ? 'justify-center px-2' : 'gap-3 px-3'
        } ${
          pathname === '/profile'
            ? 'bg-primary text-primary-foreground'
            : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
        }`}
      >
        {data?.avatarUrl ? (
          <Image
            src={data.avatarUrl}
            alt={data.userName}
            width={20}
            height={20}
            className="w-5 h-5 rounded-full object-cover shrink-0"
            unoptimized
          />
        ) : (
          <User size={16} />
        )}
        {!collapsed && (data?.userName ?? 'Mi perfil')}
      </Link>
    </>
  );

  const mobileHeader = (
    <>
      <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-widest leading-none">
        Inventario360
      </p>
      <h1 className="text-sm font-bold text-sidebar-foreground">{data?.activeTenantName ?? '—'}</h1>
    </>
  );

  return (
    <AppSidebar
      navItems={navItems}
      header={tenantHeader()}
      collapsedHeader={collapsedHeader}
      bottomExtra={bottomExtra}
      mobileHeader={mobileHeader}
      mobileBadge={<NotificationBellMobile />}
      onLogout={() => void handleLogout()}
    />
  );
}
