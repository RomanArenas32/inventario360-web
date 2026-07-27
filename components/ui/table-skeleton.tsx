import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TableSkeletonProps {
  /** Número de columnas */
  cols: number;
  /** Número de filas skeleton (default 6) */
  rows?: number;
  /** Cabeceras de las columnas */
  headers: string[];
}

export function TableSkeleton({ cols, rows = 6, headers }: TableSkeletonProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="text-xs uppercase tracking-wide hover:bg-transparent">
          {headers.map((h) => (
            <TableHead key={h} className="px-4 py-3 text-muted-foreground">
              {h}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            {Array.from({ length: cols }).map((__, j) => (
              <TableCell key={j} className="px-4 py-3">
                <Skeleton className="h-4 w-full max-w-[120px]" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
