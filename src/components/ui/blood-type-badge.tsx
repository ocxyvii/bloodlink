import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const bloodTypeColors: Record<string, string> = {
  'A+':  'bg-red-100 text-red-700 border-red-200',
  'A-':  'bg-red-100 text-red-700 border-red-200',
  'B+':  'bg-blue-100 text-blue-700 border-blue-200',
  'B-':  'bg-blue-100 text-blue-700 border-blue-200',
  'O+':  'bg-green-100 text-green-700 border-green-200',
  'O-':  'bg-green-100 text-green-700 border-green-200',
  'AB+': 'bg-purple-100 text-purple-700 border-purple-200',
  'AB-': 'bg-purple-100 text-purple-700 border-purple-200',
}

export function BloodTypeBadge({ type, className }: { type: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn('font-bold text-xs', bloodTypeColors[type] ?? 'bg-gray-100 text-gray-700', className)}
    >
      {type}
    </Badge>
  )
}