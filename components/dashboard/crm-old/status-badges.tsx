import { Badge } from '@/components/dashboard/ui/badge';
import { cn } from '@/lib/dashboard/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'enquiry' | 'lead';
}

export function StatusBadge({ status, variant = 'enquiry' }: StatusBadgeProps) {
  const getStatusColor = () => {
    if (variant === 'enquiry') {
      switch (status) {
        case 'new':
          return 'bg-blue-500 hover:bg-blue-600';
        case 'contacted':
          return 'bg-purple-500 hover:bg-purple-600';
        case 'in-progress':
          return 'bg-yellow-500 hover:bg-yellow-600';
        case 'converted':
          return 'bg-green-500 hover:bg-green-600';
        case 'closed':
          return 'bg-gray-500 hover:bg-gray-600';
        case 'lost':
          return 'bg-red-500 hover:bg-red-600';
        default:
          return 'bg-gray-500 hover:bg-gray-600';
      }
    } else {
      // Lead statuses
      switch (status) {
        case 'new':
          return 'bg-blue-500 hover:bg-blue-600';
        case 'qualified':
          return 'bg-purple-500 hover:bg-purple-600';
        case 'proposal':
          return 'bg-yellow-500 hover:bg-yellow-600';
        case 'negotiation':
          return 'bg-orange-500 hover:bg-orange-600';
        case 'won':
          return 'bg-green-500 hover:bg-green-600';
        case 'lost':
          return 'bg-red-500 hover:bg-red-600';
        default:
          return 'bg-gray-500 hover:bg-gray-600';
      }
    }
  };

  return (
    <Badge className={cn('text-white capitalize', getStatusColor())}>
      {status.replace('-', ' ')}
    </Badge>
  );
}

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high';
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const getColor = () => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Badge variant="outline" className={cn('capitalize', getColor())}>
      {priority}
    </Badge>
  );
}

interface SourceBadgeProps {
  source: string;
}

export function SourceBadge({ source }: SourceBadgeProps) {
  return (
    <Badge variant="secondary" className="capitalize">
      {source.replace('-', ' ')}
    </Badge>
  );
}
