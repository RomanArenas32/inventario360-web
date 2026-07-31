'use client';

import { api } from '@/lib/api';
import type { Category } from '@/lib/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Props = {
  target: Category | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: (id: string) => void;
};

export function DeleteCategoryDialog({ target, onOpenChange, onDeleted }: Props) {
  async function handleDelete() {
    if (!target) return;
    try {
      await api.delete(`/categories/${target.id}`);
      onDeleted(target.id);
      toast.success('Categoría eliminada');
    } catch {
      toast.error('Error al eliminar la categoría');
    } finally {
      onOpenChange(false);
    }
  }

  return (
    <AlertDialog open={!!target} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
          <AlertDialogDescription>
            Vas a eliminar <span className="font-semibold">{target?.name}</span>. Esta acción no se
            puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => void handleDelete()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
