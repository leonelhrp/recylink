import { EventStatus } from '@event-board/shared-types';
import { Badge } from './badge';

const statusConfig: Record<EventStatus, { variant: 'success' | 'warning' | 'destructive'; label: string }> = {
  [EventStatus.CONFIRMED]: { variant: 'success', label: 'Confirmed' },
  [EventStatus.DRAFT]: { variant: 'warning', label: 'Draft' },
  [EventStatus.CANCELLED]: { variant: 'destructive', label: 'Cancelled' },
};

interface StatusBadgeProps {
  status: EventStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  if (!config) return null;

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
