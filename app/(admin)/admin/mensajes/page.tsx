'use client';

import { api } from '@/lib/api';
import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

type Message = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  isUser: boolean;
  notes: string | null;
  createdAt: string;
};

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
const PAGE_SIZE = 20;

export default function MensajesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Message | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef(filter);

  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  const buildPath = useCallback((status: string, off: number) => {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(off) });
    if (status) params.set('status', status);
    return `/messages?${params.toString()}`;
  }, []);

  // Carga inicial o al cambiar filtro
  async function loadFirst(status: string) {
    setLoading(true);
    try {
      const result = await api.get<PaginatedResult>(buildPath(status, 0));
      setMessages(result.data);
      setHasMore(result.hasMore);
      setOffset(result.data.length);
    } finally {
      setLoading(false);
    }
  }

  // Carga siguiente página
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const result = await api.get<PaginatedResult>(buildPath(filterRef.current, offset));
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
    void loadFirst(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // IntersectionObserver sobre el sentinel al pie de la lista
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
      if ('notes' in patch) {
        toast.success('Notas guardadas');
      } else if ('status' in patch) {
        toast.success(
          `Estado actualizado a ${STATUS_LABELS[patch.status!]?.label ?? patch.status}`,
        );
      } else if ('isUser' in patch) {
        toast.success(patch.isUser ? 'Marcado como cliente' : 'Desmarcado como cliente');
      }
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

  return (
    <div className="flex gap-4 h-full">
      {/* Lista */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mensajes</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Solicitudes de acceso y consultas
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <Button
            size="sm"
            variant={filter === '' ? 'default' : 'outline'}
            onClick={() => setFilter('')}
          >
            Todos
          </Button>
          {STATUSES.map(([key, { label }]) => (
            <Button
              key={key}
              size="sm"
              variant={filter === key ? 'default' : 'outline'}
              onClick={() => setFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>

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
          ) : messages.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No hay mensajes.</div>
          ) : (
            <div className="divide-y divide-border">
              {messages.map((msg) => (
                <Button
                  key={msg.id}
                  variant="ghost"
                  onClick={() => openMessage(msg)}
                  className={`w-full justify-start h-auto rounded-none px-4 py-3 ${selected?.id === msg.id ? 'bg-muted/60' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
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
                      <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">
                        {msg.message}
                      </p>
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
              ))}

              {/* Sentinel para IntersectionObserver */}
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

          <div className="bg-muted rounded-lg p-3">
            <p className="text-foreground/80 text-sm leading-relaxed">{selected.message}</p>
          </div>

          {/* Estado */}
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

          {/* Es cliente */}
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

          {/* Notas */}
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
