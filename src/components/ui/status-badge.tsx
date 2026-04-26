import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusStyles: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  approved:  'bg-green-100 text-green-700 border-green-200',
  rejected:  'bg-red-100 text-red-700 border-red-200',
  fulfilled: 'bg-blue-100 text-blue-700 border-blue-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
  scheduled: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  no_show:   'bg-red-100 text-red-700 border-red-200',
  active:    'bg-green-100 text-green-700 border-green-200',
  inactive:  'bg-gray-100 text-gray-500 border-gray-200',
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn('capitalize text-xs font-medium', statusStyles[status] ?? 'bg-gray-100 text-gray-600', className)}
    >
      {status.replace('_', ' ')}
    </Badge>
  )
}