'use client';

import { api } from '@/lib/api';
import type { ContactMessage } from '@/lib/client';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SlidersHorizontal, Layers2, Search, X } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

type Message = ContactMessage;

type PaginatedResult = {
  data: Message[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: {
    label: 'Pendiente',
    color: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400',
  },
  read: { label: 'Leído', color: 'bg-muted text-muted-foreground' },
  replied: {
    label: 'Respondido',
    color: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400',
  },
  snoozed: {
    label: 'Pospuesto',
    color: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400',
  },
  dismissed: {
    label: 'Descartado',
    color: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400',
  },
};

const STATUSES = Object.entries(STATUS_LABELS);

type GroupBy = 'status' | 'date' | 'isUser';
type IsUserFilter = 'all' | 'client' | 'non-client';

const GROUP_LABELS: Record<GroupBy, string> = {
  status: 'Estado',
  date: 'Fecha',
  isUser: 'Tipo',
};

const ISUSER_LABELS: Record<IsUserFilter, string> = {
  all: 'Todos',
  client: 'Clientes',
  'non-client': 'No clientes',
};

const PAGE_SIZE = 20;

function getDateBucket(dateStr: string): string {
  const msgDate = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const weekAgo = new Date(today.getTime() - 7 * 86_400_000);
  const d = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());
  if (d.getTime() === today.getTime()) return 'Hoy';
  if (d.getTime() === yesterday.getTime()) return 'Ayer';
  if (d >= weekAgo) return 'Esta semana';
  return 'Antes';
}

function groupMessages(msgs: Message[], by: GroupBy): [string, Message[]][] {
  const map = new Map<string, Message[]>();
  for (const m of msgs) {
    const key =
      by === 'status'
        ? (STATUS_LABELS[m.status]?.label ?? m.status)
        : by === 'date'
          ? getDateBucket(m.createdAt)
          : m.isUser
            ? 'Clientes'
            : 'No clientes';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return Array.from(map.entries());
}

export default function MensajesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Filtros (servidor)
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  // Filtros (cliente)
  const [isUserFilter, setIsUserFilter] = useState<IsUserFilter>('all');
  // Agrupamiento (cliente)
  const [groupBy, setGroupBy] = useState<GroupBy | 'none'>('none');
  // Búsqueda (cliente)
  const [search, setSearch] = useState('');

  const [selected, setSelected] = useState<Message | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [_error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const statusFiltersRef = useRef(statusFilters);
  useEffect(() => {
    statusFiltersRef.current = statusFilters;
  }, [statusFilters]);

  const buildPath = useCallback((statuses: string[], off: number) => {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(off) });
    statuses.forEach((s) => params.append('status', s));
    return `/messages?${params.toString()}`;
  }, []);

  async function loadFirst(statuses: string[]) {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<PaginatedResult>(buildPath(statuses, 0));
      setMessages(result.data);
      setHasMore(result.hasMore);
      setOffset(result.data.length);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar mensajes');
      setMessages([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const result = await api.get<PaginatedResult>(buildPath(statusFiltersRef.current, offset));
      setMessages((prev) => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setOffset((prev) => prev + result.data.length);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, offset, buildPath]);

  useEffect(() => {
    setMessages([]);
    setOffset(0);
    setHasMore(true);
    void loadFirst(statusFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilters]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) void loadMore();
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // Mensajes visibles después de filtros cliente
  const visible = useMemo(() => {
    return messages.filter((m) => {
      const matchUser =
        isUserFilter === 'all' || (isUserFilter === 'client' ? m.isUser : !m.isUser);
      const matchSearch =
        !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        m.message.toLowerCase().includes(search.toLowerCase());
      return matchUser && matchSearch;
    });
  }, [messages, isUserFilter, search]);

  // Agrupados
  const grouped = useMemo(
    () => (groupBy !== 'none' ? groupMessages(visible, groupBy as GroupBy) : null),
    [visible, groupBy],
  );

  // Chips activos
  const chips = [
    ...statusFilters.map((s) => ({
      key: `status:${s}`,
      label: STATUS_LABELS[s]?.label,
      onRemove: () => setStatusFilters((prev) => prev.filter((x) => x !== s)),
    })),
    ...(isUserFilter !== 'all'
      ? [
          {
            key: 'isUser',
            label: ISUSER_LABELS[isUserFilter],
            onRemove: () => setIsUserFilter('all'),
          },
        ]
      : []),
    ...(groupBy !== 'none'
      ? [
          {
            key: 'group',
            label: `Agrupado: ${GROUP_LABELS[groupBy as GroupBy]}`,
            onRemove: () => setGroupBy('none'),
          },
        ]
      : []),
  ];

  const hasFilters = statusFilters.length > 0 || isUserFilter !== 'all';

  function openMessage(msg: Message) {
    setSelected(msg);
    setNotes(msg.notes ?? '');
    if (msg.status === 'pending') {
      void api.patch(`/messages/${msg.id}`, { status: 'read' }).then(() => {
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, status: 'read' } : m)));
      });
    }
  }

  async function handleUpdate(id: string, patch: Partial<Message>) {
    setSaving(true);
    try {
      const updated = await api.patch<Message>(`/messages/${id}`, patch);
      setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
      setSelected(updated);
      if ('notes' in patch) toast.success('Notas guardadas');
      else if ('status' in patch)
        toast.success(
          `Estado actualizado a ${STATUS_LABELS[patch.status!]?.label ?? patch.status}`,
        );
      else if ('isUser' in patch)
        toast.success(patch.isUser ? 'Marcado como cliente' : 'Desmarcado como cliente');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este mensaje?')) return;
    try {
      await api.delete(`/messages/${id}`);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setSelected(null);
      toast.success('Mensaje eliminado');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  async function saveNotes() {
    if (!selected) return;
    await handleUpdate(selected.id, { notes });
  }

  function MessageRow({ msg }: { msg: Message }) {
    return (
      <Button
        key={msg.id}
        variant="ghost"
        onClick={() => openMessage(msg)}
        className={`w-full justify-start h-auto rounded-none px-4 py-3 ${selected?.id === msg.id ? 'bg-muted/60' : ''}`}
      >
        <div className="flex items-start justify-between gap-2 w-full">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`font-medium text-sm ${msg.status === 'pending' ? 'text-foreground' : 'text-foreground/80'}`}
              >
                {msg.name}
              </span>
              {msg.isUser && (
                <Badge className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-0">
                  Cliente
                </Badge>
              )}
              {msg.status === 'pending' && (
                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{msg.email}</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{msg.message}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <Badge className={`${STATUS_LABELS[msg.status]?.color ?? ''} border-0`}>
              {STATUS_LABELS[msg.status]?.label}
            </Badge>
            <p className="text-xs text-muted-foreground/50 mt-1">
              {new Date(msg.createdAt).toLocaleDateString('es-AR')}
            </p>
          </div>
        </div>
      </Button>
    );
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Lista */}
      <div className="flex-1 min-w-0">
        <PageHeader title="Mensajes" description="Solicitudes de acceso y consultas" />

        {/* Toolbar */}
        <div
          className={`flex flex-col gap-2 sm:flex-row sm:items-center ${chips.length > 0 ? 'mb-2' : 'mb-4'} flex-wrap`}
        >
          <div className="relative flex-1 max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Buscar por nombre, email o mensaje..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {/* Filtrar */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'gap-1.5',
                hasFilters && 'border-primary text-primary',
              )}
            >
              <SlidersHorizontal size={13} />
              Filtrar
              {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Estado</DropdownMenuLabel>
                {STATUSES.map(([key, { label }]) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={statusFilters.includes(key)}
                    onCheckedChange={(checked) =>
                      setStatusFilters((prev) =>
                        checked ? [...prev, key] : prev.filter((s) => s !== key),
                      )
                    }
                  >
                    {label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={isUserFilter}
                onValueChange={(v) => setIsUserFilter(v as IsUserFilter)}
              >
                <DropdownMenuLabel>Tipo de contacto</DropdownMenuLabel>
                <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="client">Clientes</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="non-client">No clientes</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Agrupar */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'gap-1.5',
                groupBy !== 'none' && 'border-primary text-primary',
              )}
            >
              <Layers2 size={13} />
              Agrupar
              {groupBy !== 'none' && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44">
              <DropdownMenuRadioGroup
                value={groupBy}
                onValueChange={(v) => setGroupBy(v as GroupBy | 'none')}
              >
                <DropdownMenuLabel>Agrupar por</DropdownMenuLabel>
                <DropdownMenuRadioItem value="none">Sin agrupar</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="status">Estado</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="date">Fecha</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="isUser">Tipo</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Chips activos — segunda fila */}
        {chips.length > 0 && (
          <div className="flex items-center gap-1.5 mb-4 flex-wrap">
            {chips.map((chip) => (
              <Badge
                key={chip.key}
                variant="secondary"
                className="gap-1 pl-2.5 pr-1.5 py-1 text-xs font-normal"
              >
                {chip.label}
                <button
                  onClick={chip.onRemove}
                  className="rounded-sm opacity-60 hover:opacity-100 transition-opacity"
                >
                  <X size={11} />
                </button>
              </Badge>
            ))}
            <button
              onClick={() => {
                setStatusFilters([]);
                setIsUserFilter('all');
                setGroupBy('none');
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1 hover:cursor-pointer"
            >
              Limpiar todo
            </button>
          </div>
        )}

        {/* Lista de mensajes */}
        <Card className="p-0 overflow-hidden shadow-sm">
          {loading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="px-4 py-3 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3.5 w-14 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No hay mensajes.</div>
          ) : grouped ? (
            <div className="divide-y divide-border">
              {grouped.map(([group, msgs]) => (
                <div key={group}>
                  <div className="px-4 py-2 flex items-center gap-2 bg-muted/40 border-b border-border">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {group}
                    </span>
                    <span className="text-xs text-muted-foreground/50">({msgs.length})</span>
                  </div>
                  {msgs.map((msg) => (
                    <MessageRow key={msg.id} msg={msg} />
                  ))}
                </div>
              ))}
              <div ref={sentinelRef} className="py-2 flex justify-center">
                {loadingMore && (
                  <span className="text-xs text-muted-foreground">Cargando más...</span>
                )}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {visible.map((msg) => (
                <MessageRow key={msg.id} msg={msg} />
              ))}
              <div ref={sentinelRef} className="py-2 flex justify-center">
                {loadingMore && (
                  <span className="text-xs text-muted-foreground">Cargando más...</span>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Panel de detalle */}
      {selected && (
        <Card className="w-80 flex-shrink-0 p-5 flex flex-col gap-4 self-start sticky top-0 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-foreground font-semibold">{selected.name}</h2>
              <p className="text-muted-foreground text-xs">{selected.email}</p>
              {selected.phone && <p className="text-muted-foreground text-xs">{selected.phone}</p>}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelected(null)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              ×
            </Button>
          </div>

          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Rubro o tipo de comercio
            </p>
            <p className="mt-1 text-sm text-foreground">
              {selected.businessType ?? 'Sin especificar'}
            </p>
          </div>

          <div className="bg-muted rounded-lg p-3">
            <p className="text-foreground/80 text-sm leading-relaxed">{selected.message}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
              Estado
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {STATUSES.map(([key, { label }]) => (
                <Button
                  key={key}
                  size="sm"
                  variant={selected.status === key ? 'default' : 'ghost'}
                  onClick={() =>
                    void handleUpdate(selected.id, { status: key as Message['status'] })
                  }
                  className="text-xs w-full"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              ¿Es cliente?
            </span>
            <Button
              size="sm"
              variant={selected.isUser ? 'default' : 'ghost'}
              onClick={() => void handleUpdate(selected.id, { isUser: !selected.isUser })}
            >
              {selected.isUser ? 'Sí' : 'No'}
            </Button>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
              Notas internas
            </p>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              placeholder="Recordatorios, seguimiento..."
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void saveNotes()}
              disabled={saving || notes === (selected.notes ?? '')}
              className="mt-1.5 w-full"
            >
              {saving ? 'Guardando...' : 'Guardar notas'}
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => void handleDelete(selected.id)}
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            Eliminar mensaje
          </Button>
        </Card>
      )}
    </div>
  );
}
