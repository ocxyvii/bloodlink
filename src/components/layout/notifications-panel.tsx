'use client'

import { useState, useEffect, useTransition } from 'react'
import { Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, Zap, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  getNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/app/actions/donation-actions'
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
  info:      { icon: <Info size={14} />,          bg: 'bg-blue-50',   border: 'border-blue-100',   text: 'text-blue-600',   iconBg: 'bg-blue-100' },
  success:   { icon: <CheckCircle2 size={14} />,  bg: 'bg-green-50',  border: 'border-green-100',  text: 'text-green-600',  iconBg: 'bg-green-100' },
  warning:   { icon: <AlertTriangle size={14} />, bg: 'bg-yellow-50', border: 'border-yellow-100', text: 'text-yellow-600', iconBg: 'bg-yellow-100' },
  emergency: { icon: <Zap size={14} />,           bg: 'bg-red-50',    border: 'border-red-100',    text: 'text-red-600',    iconBg: 'bg-red-100' },
}

export function NotificationsPanel() {
  const [open, setOpen]                   = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading]             = useState(false)
  const [isPending, startTransition]      = useTransition()

  const unread = notifications.filter(n => !n.is_read).length

  const fetchNotifications = async () => {
    setLoading(true)
    const result = await getNotificationsForUser()
    setNotifications(result.notifications)
    setLoading(false)
  }

  useEffect(() => {
    if (open) fetchNotifications()
  }, [open])

  const handleMarkRead = (id: string) => {
    startTransition(async () => {
      await markNotificationRead(id)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
    })
  }

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    })
  }

  return (
    <>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(true)}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>

      {/* Notifications Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col">
          <SheetHeader className="px-5 py-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-base">
                <Bell size={16} className="text-primary" />
                Notifications
                {unread > 0 && (
                  <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0 h-5">
                    {unread} new
                  </Badge>
                )}
              </SheetTitle>
              {unread > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 h-7 text-muted-foreground"
                  onClick={handleMarkAllRead}
                  disabled={isPending}
                >
                  {isPending
                    ? <Loader2 size={12} className="animate-spin" />
                    : <CheckCheck size={12} />
                  }
                  Mark all read
                </Button>
              )}
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={24} className="animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Bell size={36} className="mb-3 opacity-20" />
                <p className="font-medium text-sm">No notifications yet</p>
                <p className="text-xs mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map(n => {
                  const config = typeConfig[n.type as keyof typeof typeConfig] ?? typeConfig.info
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        'flex items-start gap-3 px-5 py-4 transition-colors',
                        !n.is_read ? `${config.bg} cursor-pointer hover:opacity-90` : 'bg-background hover:bg-muted/30'
                      )}
                      onClick={() => !n.is_read && handleMarkRead(n.id)}
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                        n.is_read ? 'bg-muted text-muted-foreground' : `${config.iconBg} ${config.text}`
                      )}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            'text-sm font-semibold leading-tight',
                            !n.is_read && config.text
                          )}>
                            {n.title}
                          </p>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}