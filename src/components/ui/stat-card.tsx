import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
  color?: 'red' | 'blue' | 'green' | 'purple' | 'orange'
  className?: string
}

const colorMap = {
  red:    { bg: 'bg-red-50',    icon: 'bg-red-100 text-red-600',    text: 'text-red-600' },
  blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',  text: 'text-blue-600' },
  green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600',text: 'text-green-600' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', text: 'text-purple-600' },
  orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600', text: 'text-orange-600' },
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'red', className }: StatCardProps) {
  const colors = colorMap[color]
  return (
    <div className={cn('bg-card rounded-2xl border p-6 flex flex-col gap-4', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors.icon)}>
          <Icon size={18} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-xs">
          <span className={cn('font-medium', trend.value >= 0 ? 'text-green-600' : 'text-red-500')}>
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
          <span className="text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  )
}