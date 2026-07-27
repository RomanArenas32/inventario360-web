'use client';

import { useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { LogOut, Menu, PanelLeftClose } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type SidebarNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  badge?: number;
};

type AppSidebarProps = {
  navItems: SidebarNavItem[];
  header: React.ReactNode;
  collapsedHeader: React.ReactNode;
  bottomExtra?: (collapsed: boolean) => React.ReactNode;
  mobileHeader: React.ReactNode;
  mobileBadge?: React.ReactNode;
  onLogout: () => void;
};

function NavLinks({
  items,
  collapsed,
  onNavigate,
}: {
  items: SidebarNavItem[];
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <>
      {items.map(({ href, label, icon: Icon, badge }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={`relative flex items-center py-2 rounded-lg text-sm font-medium transition-colors ${
              collapsed ? 'justify-center px-2' : 'gap-3 px-3'
            } ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
            }`}
          >
            <Icon size={16} />
            <span
              style={{
                maxWidth: collapsed ? 0 : 160,
                opacity: collapsed ? 0 : 1,
                transition: 'max-width 300ms ease-in-out, opacity 200ms ease-in-out',
              }}
              className="overflow-hidden whitespace-nowrap"
            >
              {label}
            </span>
            {!collapsed && badge != null && badge > 0 && (
              <span className="ml-auto bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
            {collapsed && badge != null && badge > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
            )}
          </Link>
        );
      })}
    </>
  );
}

export function AppSidebar({
  navItems,
  header,
  collapsedHeader,
  bottomExtra,
  mobileHeader,
  mobileBadge,
  onLogout,
}: AppSidebarProps) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const toggleButton = (
    <button
      onClick={() => setCollapsed((c) => !c)}
      title={collapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
      className={`flex items-center py-2 w-full rounded-lg text-xs font-medium text-sidebar-foreground/30 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors mb-1 hover:cursor-pointer ${
        collapsed ? 'justify-center px-2' : 'gap-3 px-3'
      }`}
    >
      <span
        style={{
          display: 'block',
          transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 300ms ease-in-out',
        }}
        className="shrink-0"
      >
        <PanelLeftClose size={15} />
      </span>
      <span
        style={{
          maxWidth: collapsed ? 0 : 160,
          opacity: collapsed ? 0 : 1,
          transition: 'max-width 300ms ease-in-out, opacity 200ms ease-in-out',
        }}
        className="overflow-hidden whitespace-nowrap"
      >
        Contraer
      </span>
    </button>
  );

  const bottomSection = (isCollapsed: boolean) => (
    <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
      {bottomExtra?.(isCollapsed)}
      <ThemeToggle
        className={`flex items-center py-2 w-full rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors ${
          isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
        }`}
        hideLabel={isCollapsed}
      />
      <Button
        onClick={onLogout}
        variant="ghost"
        title={isCollapsed ? 'Cerrar sesión' : undefined}
        className={`flex items-center py-2 w-full rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors ${
          isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
        }`}
      >
        <LogOut size={16} className="shrink-0" />
        <span
          style={{
            maxWidth: isCollapsed ? 0 : 160,
            opacity: isCollapsed ? 0 : 1,
            transition: 'max-width 300ms ease-in-out, opacity 200ms ease-in-out',
          }}
          className="overflow-hidden whitespace-nowrap"
        >
          Cerrar sesión
        </span>
      </Button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        style={{ width: collapsed ? '3.5rem' : '15rem', transition: 'width 300ms ease-in-out' }}
        className="hidden md:flex flex-col bg-sidebar border-r border-sidebar-border overflow-hidden"
      >
        {collapsed ? collapsedHeader : header}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {toggleButton}
          <NavLinks items={navItems} collapsed={collapsed} />
        </nav>
        {bottomSection(collapsed)}
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
        <div className="ml-3 flex-1">{mobileHeader}</div>
        {mobileBadge}
      </header>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-60 p-0 bg-sidebar border-sidebar-border flex flex-col gap-0"
        >
          {header}
          <nav className="flex-1 px-3 py-4 space-y-1">
            <NavLinks items={navItems} onNavigate={() => setOpen(false)} />
          </nav>
          {bottomSection(false)}
        </SheetContent>
      </Sheet>
    </>
  );
}
