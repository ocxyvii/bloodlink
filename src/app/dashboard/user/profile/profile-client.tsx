'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  User, Droplets, Phone, MapPin,
  Calendar, Heart, Save, Loader2,
  ShieldCheck, Mail
} from 'lucide-react'
import { updateProfile } from '@/app/actions/donation-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { BloodTypeBadge } from '@/components/ui/blood-type-badge'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Profile } from '@/types'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

export function ProfileClient({ profile }: { profile: Profile }) {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    full_name:     profile.full_name ?? '',
    phone:         profile.phone ?? '',
    location:      profile.location ?? '',
    date_of_birth: profile.date_of_birth ?? '',
    blood_type:    profile.blood_type ?? '',
    is_donor:      profile.is_donor ?? false,
  })

  const updateForm = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const initials = profile.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleSave = () => {
    if (!form.full_name) {
      toast.error('Full name is required')
      return
    }
    startTransition(async () => {
      const result = await updateProfile({
        full_name:     form.full_name,
        phone:         form.phone || undefined,
        location:      form.location || undefined,
        date_of_birth: form.date_of_birth || undefined,
        blood_type:    form.blood_type || undefined,
        is_donor:      form.is_donor,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Profile updated successfully')
      }
    })
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <User size={24} className="text-primary" />
          My Profile
        </h1>
        <p className="text-muted-foreground mt-1">Manage your personal information</p>
      </div>

      {/* Profile header */}
      <div className="bg-card rounded-2xl border p-6 flex items-center gap-5">
        <Avatar className="w-16 h-16">
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-xl font-bold">{profile.full_name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail size={12} /> {profile.email}
            </span>
            {profile.blood_type && <BloodTypeBadge type={profile.blood_type} />}
            {profile.is_donor && (
              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs gap-1">
                <Heart size={10} className="fill-green-600" /> Registered Donor
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 border border-green-200 px-2.5 py-1.5 rounded-full">
          <ShieldCheck size={12} />
          <span>Verified</span>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-card rounded-2xl border p-6 space-y-6">
        <p className="font-semibold">Personal Information</p>
        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <User size={13} className="text-muted-foreground" /> Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.full_name}
              onChange={e => updateForm('full_name', e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Phone size={13} className="text-muted-foreground" /> Phone Number
            </Label>
            <Input
              placeholder="+254 700 000 000"
              value={form.phone}
              onChange={e => updateForm('phone', e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <MapPin size={13} className="text-muted-foreground" /> City / Location
            </Label>
            <Input
              placeholder="Nairobi"
              value={form.location}
              onChange={e => updateForm('location', e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Calendar size={13} className="text-muted-foreground" /> Date of Birth
            </Label>
            <Input
              type="date"
              value={form.date_of_birth}
              onChange={e => updateForm('date_of_birth', e.target.value)}
              className="h-10"
            />
          </div>
        </div>

        <Separator />
        <p className="font-semibold">Blood Information</p>

        <div className="space-y-3">
          <Label className="flex items-center gap-1">
            <Droplets size={13} className="text-muted-foreground" /> Your Blood Type
          </Label>
          <div className="grid grid-cols-4 gap-2">
            {BLOOD_TYPES.map(bt => (
              <button
                key={bt}
                type="button"
                onClick={() => updateForm('blood_type', bt)}
                className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  form.blood_type === bt
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <BloodTypeBadge type={bt} />
              </button>
            ))}
          </div>
        </div>

        <div
          onClick={() => updateForm('is_donor', !form.is_donor)}
          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
            form.is_donor
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            form.is_donor ? 'bg-primary' : 'bg-muted'
          }`}>
            <Heart size={18} className={form.is_donor ? 'text-white fill-white' : 'text-muted-foreground'} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Registered Blood Donor</p>
            <p className="text-xs text-muted-foreground">
              {form.is_donor
                ? 'You are registered as a donor — thank you!'
                : 'Register to donate blood and help save lives'}
            </p>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
            form.is_donor ? 'border-primary bg-primary' : 'border-muted-foreground'
          }`}>
            {form.is_donor && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isPending}
          className="w-full h-11 gap-2"
        >
          {isPending
            ? <><Loader2 size={15} className="animate-spin" /> Saving...</>
            : <><Save size={15} /> Save Changes</>
          }
        </Button>
      </div>

      {/* Account info */}
      <div className="bg-card rounded-2xl border p-6 space-y-4">
        <p className="font-semibold">Account Information</p>
        <Separator />
        <div className="space-y-3">
          {[
            { label: 'Email',    value: profile.email,    note: 'Cannot be changed' },
            { label: 'Role',     value: profile.role.replace('_', ' '), note: '' },
            { label: 'Member since', value: new Date(profile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), note: '' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <div className="text-right">
                <span className="text-sm font-medium capitalize">{item.value}</span>
                {item.note && <p className="text-xs text-muted-foreground">{item.note}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}