'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
  getUnreadNotifications,
  markNotificationsAsRead,
} from '@/app/actions/donation-actions'

function playPopSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as typeof window & {
      webkitAudioContext?: typeof AudioContext
    }).webkitAudioContext)()
    const oscillator = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(720, audioCtx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(520, audioCtx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.16)
    oscillator.connect(gain)
    gain.connect(audioCtx.destination)
    oscillator.start()
    oscillator.stop(audioCtx.currentTime + 0.16)
    oscillator.onended = () => {
      void audioCtx.close()
    }
  } catch {
    // Ignore audio errors
  }
}

export function UserNotificationListener() {
  const runningRef = useRef(false)

  useEffect(() => {
    let mounted = true

    const checkUnreadNotifications = async () => {
      if (runningRef.current) return
      runningRef.current = true
      try {
        const result = await getUnreadNotifications()
        if (!mounted || result.error || !result.notifications.length) return

        const ids = result.notifications.map(n => n.id)

        for (const n of result.notifications) {
          if (n.type === 'success')       toast.success(n.title,   { description: n.message })
          else if (n.type === 'warning')  toast.warning(n.title,   { description: n.message })
          else if (n.type === 'emergency') toast.error(n.title,    { description: n.message })
          else                            toast.info(n.title,      { description: n.message })
        }

        playPopSound()
        await markNotificationsAsRead(ids)
      } finally {
        runningRef.current = false
      }
    }

    void checkUnreadNotifications()

    const interval = window.setInterval(() => {
      void checkUnreadNotifications()
    }, 15000)

    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [])

  return null
}