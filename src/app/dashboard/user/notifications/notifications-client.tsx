'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Bell, CheckCheck, Info,
  CheckCircle2, AlertTriangle, Zap, Loader2
} from 'lucide-react'
import {
  markNotificationRead,
  markAllNotificationsRead,
} from '@/app/actions/donation-actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

const typeConfig = {
  info:      { icon: <Info size={16} />,          bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-600',   iconBg: 'bg-blue-100' },
  success:   { icon: <CheckCircle2 size={16} />,  bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-600',  iconBg: 'bg-green-100' },
  warning:   { icon: <AlertTriangle size={16} />, bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600', iconBg: 'bg-yellow-100' },
  emergency: { icon: <Zap size={16} />,           bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-600',    iconBg: 'bg-red-100' },
}

export function NotificationsClient({ notifications }: { notifications: Notification[] }) {
  const [isPending, startTransition] = useTransition()
  const unread = notifications.filter(n => !n.is_read).length

  const handleMarkRead = (id: string) => {
    startTransition(async () => {
      await markNotificationRead(id)
    })
  }

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsRead()
      toast.success('All notifications marked as read')
    })
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell size={24} className="text-primary" />
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            {notifications.length} total · {unread} unread
          </p>
        </div>
        {unread > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="gap-2"
          >
            {isPending
              ? <Loader2 size={14} className="animate-spin" />
              : <CheckCheck size={14} />
            }
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border text-muted-foreground">
          <Bell size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">No notifications yet</p>
          <p className="text-sm mt-1">You'll be notified about your requests and donations</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const config = typeConfig[n.type as keyof typeof typeConfig] ?? typeConfig.info
            return (
              <div
                key={n.id}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-2xl border transition-all',
                  n.is_read
                    ? 'bg-card border-border opacity-70'
                    : `${config.bg} ${config.border} cursor-pointer hover:opacity-90`
                )}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${config.iconBg} ${config.text}`}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={cn('text-sm font-semibold', !n.is_read && config.text)}>
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0 h-4">
                        New
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                    {n.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!n.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}