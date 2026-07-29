import { Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';

type TurnStatus = 'disponible' | 'reservado' | 'no_disponible';

function statusClasses(status: TurnStatus) {
  switch (status) {
    case 'disponible':
      return 'bg-green-50 text-green-700 border border-green-100 hover:bg-green-100';
    case 'reservado':
      return 'bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100';
    case 'no_disponible':
      return 'bg-red-50 text-red-700 border border-red-100 opacity-80 hover:bg-red-100';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export default function TurnBlock({
  time,
  status,
  onClick,
}: {
  time: string;
  status: TurnStatus;
  onClick?: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick();
        }
      }}
      className={`p-3 rounded-lg flex items-center justify-between w-full cursor-pointer ${statusClasses(status)}`}
    >
      <div className="flex items-center gap-2">
        <Clock size={16} />
        <span className="font-medium">{time}</span>
      </div>
      <div className="text-xs font-semibold">
        {status === 'disponible' ? 'Libre' : status === 'reservado' ? 'Reservado' : 'No disponible'}
      </div>
    </Card>
  );
}
