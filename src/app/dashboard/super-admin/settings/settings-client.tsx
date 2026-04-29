'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Settings, Shield, Database, Bell,
  Save, Loader2, Server, Users,
  ClipboardList, Heart, Building2
} from 'lucide-react'
import { updateProfile } from '@/app/actions/donation-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Profile } from '@/types'

interface SettingsClientProps {
  profile: Profile
  stats: {
    totalUsers: number | null
    totalRequests: number | null
    totalDonations: number | null
    totalCenters: number | null
  }
}

export function SettingsClient({ profile, stats }: SettingsClientProps) {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    full_name: profile.full_name ?? '',
    phone:     profile.phone ?? '',
    location:  profile.location ?? '',
  })

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateProfile({
        full_name: form.full_name,
        phone:     form.phone || undefined,
        location:  form.location || undefined,
      })
      if (result.error) toast.error(result.error)
      else toast.success('Profile updated')
    })
  }

  const initials = profile.full_name
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings size={24} className="text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">System configuration and account settings</p>
      </div>

      {/* System Stats */}
      <Card className="rounded-2xl border">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Server size={15} className="text-primary" /> System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Users',    value: stats.totalUsers,    icon: <Users size={16} />,       color: 'bg-blue-50 text-blue-700' },
              { label: 'Requests',       value: stats.totalRequests, icon: <ClipboardList size={16} />, color: 'bg-orange-50 text-orange-700' },
              { label: 'Donations',      value: stats.totalDonations,icon: <Heart size={16} />,        color: 'bg-red-50 text-red-700' },
              { label: 'Centers',        value: stats.totalCenters,  icon: <Building2 size={16} />,    color: 'bg-green-50 text-green-700' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
                <div className="flex items-center gap-2 mb-1">{s.icon}</div>
                <p className="text-2xl font-bold">{s.value ?? 0}</p>
                <p className="text-sm opacity-80">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card className="rounded-2xl border">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield size={15} className="text-primary" /> Super Admin Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40">
            <Avatar className="w-14 h-14">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{profile.full_name}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <Badge className="mt-1 bg-purple-100 text-purple-700 border-purple-200 text-xs">
                Super Admin
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                placeholder="+252 60 000 0000"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="h-10"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Location</Label>
              <Input
                placeholder="Galkacyo, Somalia"
                value={form.location}
                onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                className="h-10"
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={isPending} className="gap-2">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="rounded-2xl border">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Database size={15} className="text-primary" /> System Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'Application',  value: 'BloodLink Blood Booking System' },
            { label: 'Version',      value: '1.0.0' },
            { label: 'Framework',    value: 'Next.js 16 + Supabase' },
            { label: 'Database',     value: 'PostgreSQL (Supabase)' },
            { label: 'Auth',         value: 'Supabase Auth with RLS' },
            { label: 'Deployed',     value: 'Somalia ��' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="text-sm font-medium">{item.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}