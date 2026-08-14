'use client';

import { api } from '@/lib/api';
import { useEffect, useRef, useState } from 'react';
import { Bell, Package } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  data: Record<string, unknown> | null;
  createdAt: string;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days} d`;
}

type Props = {
  collapsed?: boolean;
};

export function NotificationBell({ collapsed = false }: Props) {
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchCount() {
    try {
      const res = await api.get<{ count: number }>('/notifications/unread-count');
      setUnread(res.count);
    } catch {
      // silencioso
    }
  }

  async function fetchNotifications() {
    setLoading(true);
    try {
      const list = await api.get<Notification[]>('/notifications');
      setNotifications(list);
      setUnread(list.filter((n) => !n.read).length);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchCount();
    intervalRef.current = setInterval(() => void fetchCount(), 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) await fetchNotifications();
  }

  async function handleMarkRead(id: string) {
    await api.patch(`/notifications/${id}/read`, {});
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((c) => Math.max(0, c - 1));
  }

  async function handleMarkAllRead() {
    await api.patch('/notifications/read-all', {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  }

  const hasUnread = unread > 0;

  return (
    <Popover open={open} onOpenChange={(v) => void handleOpen(v)}>
      <PopoverTrigger
        title={collapsed ? 'Notificaciones' : undefined}
        className={`relative flex items-center py-2 w-full rounded-lg text-sm font-medium transition-colors text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent ${
          collapsed ? 'justify-center px-2' : 'gap-3 px-3'
        }`}
      >
        <span className="relative shrink-0">
          <Bell size={16} />
          {hasUnread && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </span>
        <span
          style={{
            maxWidth: collapsed ? 0 : 160,
            opacity: collapsed ? 0 : 1,
            transition: 'max-width 300ms ease-in-out, opacity 200ms ease-in-out',
          }}
          className="overflow-hidden whitespace-nowrap flex items-center gap-2"
        >
          Notificaciones
          {hasUnread && (
            <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </span>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="end"
        sideOffset={8}
        className="w-80 p-0 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold text-foreground">Notificaciones</span>
          {notifications.some((n) => !n.read) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1 px-2 text-muted-foreground"
              onClick={() => void handleMarkAllRead()}
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>

        {/* Lista */}
        <div className="max-h-96 overflow-y-auto divide-y divide-border">
          {loading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-2.5 bg-muted rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <Bell size={28} className="text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Sin notificaciones</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => { if (!n.read) void handleMarkRead(n.id); }}
                className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors ${
                  n.read ? 'opacity-60' : ''
                }`}
              >
                <span
                  className={`mt-0.5 p-1.5 rounded-full shrink-0 ${
                    n.type === 'low_stock'
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Package size={14} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground leading-tight">{n.title}</p>
                    {!n.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.body}</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Versión compacta para el mobile topbar */
export function NotificationBellMobile() {
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function fetchCount() {
    try {
      const res = await api.get<{ count: number }>('/notifications/unread-count');
      setUnread(res.count);
    } catch {
      // silencioso
    }
  }

  async function fetchNotifications() {
    setLoading(true);
    try {
      const list = await api.get<Notification[]>('/notifications');
      setNotifications(list);
      setUnread(list.filter((n) => !n.read).length);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchCount();
    const id = setInterval(() => void fetchCount(), 30_000);
    return () => clearInterval(id);
  }, []);

  async function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) await fetchNotifications();
  }

  async function handleMarkRead(id: string) {
    await api.patch(`/notifications/${id}/read`, {});
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((c) => Math.max(0, c - 1));
  }

  async function handleMarkAllRead() {
    await api.patch('/notifications/read-all', {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  }

  const hasUnread = unread > 0;

  return (
    <Popover open={open} onOpenChange={(v) => void handleOpen(v)}>
      <PopoverTrigger className="relative p-2 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
        <Bell size={18} />
        {hasUnread && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" sideOffset={8} className="w-80 p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold text-foreground">Notificaciones</span>
          {notifications.some((n) => !n.read) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1 px-2 text-muted-foreground"
              onClick={() => void handleMarkAllRead()}
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto divide-y divide-border">
          {loading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-2.5 bg-muted rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <Bell size={28} className="text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Sin notificaciones</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => { if (!n.read) void handleMarkRead(n.id); }}
                className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors ${
                  n.read ? 'opacity-60' : ''
                }`}
              >
                <span
                  className={`mt-0.5 p-1.5 rounded-full shrink-0 ${
                    n.type === 'low_stock'
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Package size={14} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground leading-tight">{n.title}</p>
                    {!n.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.body}</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
