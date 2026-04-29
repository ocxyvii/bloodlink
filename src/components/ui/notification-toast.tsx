'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Bell, X, CheckCircle, AlertTriangle, Info } from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'emergency'
  created_at: string
  read: boolean
}

export function NotificationToast() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    
    // Fetch initial notifications and setup subscription
    const setupNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch initial notifications
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(10)

      if (data) {
        setNotifications(data)
        // Show toast for unread notifications
        data.forEach(notification => {
          const icon = notification.type === 'emergency' ? AlertTriangle : 
                       notification.type === 'success' ? CheckCircle : 
                       notification.type === 'warning' ? AlertTriangle : Info
          
          toast(notification.title, {
            description: notification.message,
            action: {
              label: 'View',
              onClick: () => markAsRead(notification.id)
            }
          })
        })
      }

      // Listen for new notifications
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newNotification = payload.new as Notification
            setNotifications(prev => [newNotification, ...prev])
            
            // Show immediate toast for new notifications
            const icon = newNotification.type === 'emergency' ? AlertTriangle : 
                         newNotification.type === 'success' ? CheckCircle : 
                         newNotification.type === 'warning' ? AlertTriangle : Info
            
            toast(newNotification.title, {
              description: newNotification.message,
              action: {
                label: 'View',
                onClick: () => markAsRead(newNotification.id)
              }
            })
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    setupNotifications()
  }, [])

  const markAsRead = async (notificationId: string) => {
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
    
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  const markAllAsRead = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
    
    setNotifications([])
  }

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <div className="bg-white border rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-blue-600" />
            <span className="font-semibold text-sm">
              {notifications.length} New Notification{notifications.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Mark all read
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {notifications.slice(0, 3).map(notification => (
            <div
              key={notification.id}
              className="p-2 bg-gray-50 rounded border-l-4 border-blue-500"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                </div>
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {notifications.length > 3 && (
          <p className="text-xs text-gray-500 text-center pt-2">
            And {notifications.length - 3} more...
          </p>
        )}
      </div>
    </div>
  )
}
