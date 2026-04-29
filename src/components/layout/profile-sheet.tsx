'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  User, Mail, Phone, MapPin, Calendar,
  Lock, LogOut, Save, Loader2,
  Eye, EyeOff, Shield, Heart, Droplets,
  ChevronDown, ChevronUp, Check
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { updateProfile, changePassword } from '@/app/actions/donation-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { BloodTypeBadge } from '@/components/ui/blood-type-badge'
import { Profile } from '@/types'
import { cn } from '@/lib/utils'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700 border-purple-200',
  admin:       'bg-orange-100 text-orange-700 border-orange-200',
  user:        'bg-green-100 text-green-700 border-green-200',
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin:       'Admin',
  user:        'Member',
}

interface ProfileSheetProps {
  profile: Profile
  trigger?: React.ReactNode
}

function Section({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-sm font-semibold">{title}</span>
        </div>
        {open
          ? <ChevronUp size={15} className="text-muted-foreground" />
          : <ChevronDown size={15} className="text-muted-foreground" />
        }
      </button>
      {open && (
        <div className="px-4 py-4 space-y-4 bg-background">
          {children}
        </div>
      )}
    </div>
  )
}

export function ProfileSheet({ profile, trigger }: ProfileSheetProps) {
  const router = useRouter()
  const [open, setOpen]                   = useState(false)
  const [isPending, startTransition]      = useTransition()
  const [showCurrent, setShowCurrent]     = useState(false)
  const [showNew, setShowNew]             = useState(false)
  const [showConfirm, setShowConfirm]     = useState(false)
  const [pwSaved, setPwSaved]             = useState(false)

  const [form, setForm] = useState({
    full_name:     profile.full_name ?? '',
    phone:         profile.phone ?? '',
    location:      profile.location ?? '',
    date_of_birth: profile.date_of_birth ?? '',
    blood_type:    profile.blood_type ?? '',
    is_donor:      profile.is_donor ?? false,
  })

  const [pwForm, setPwForm] = useState({
    current: '',
    new:     '',
    confirm: '',
  })

  const initials = profile.full_name
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const handleSaveProfile = () => {
    if (!form.full_name.trim()) { toast.error('Full name is required'); return }
    startTransition(async () => {
      const result = await updateProfile({
        full_name:     form.full_name,
        phone:         form.phone || undefined,
        location:      form.location || undefined,
        date_of_birth: form.date_of_birth || undefined,
        blood_type:    form.blood_type || undefined,
        is_donor:      form.is_donor,
      })
      if (result.error) toast.error(result.error)
      else toast.success('Profile updated')
    })
  }

  const handleChangePassword = () => {
    if (!pwForm.current)         { toast.error('Enter your current password'); return }
    if (pwForm.new.length < 8)   { toast.error('New password must be at least 8 characters'); return }
    if (pwForm.new !== pwForm.confirm) { toast.error('Passwords do not match'); return }
    startTransition(async () => {
      const result = await changePassword(pwForm.current, pwForm.new)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Password changed successfully')
        setPwForm({ current: '', new: '', confirm: '' })
        setPwSaved(true)
        setTimeout(() => setPwSaved(false), 3000)
      }
    })
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/login')
  }

  const pwMismatch = !!pwForm.confirm && pwForm.new !== pwForm.confirm

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger ?? (
          <Avatar className="w-8 h-8 cursor-pointer">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:w-[400px] p-0 flex flex-col gap-0"
        >
          {/* Fixed Header */}
          <SheetHeader className="px-5 pt-5 pb-4 border-b flex-shrink-0">
            <SheetTitle className="sr-only">My Profile</SheetTitle>
            {/* Profile card */}
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 flex-shrink-0">
                <AvatarFallback className={`text-lg font-bold ${
                  profile.role === 'super_admin'
                    ? 'bg-purple-100 text-purple-700'
                    : profile.role === 'admin'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-primary/10 text-primary'
                }`}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base truncate">{profile.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <Badge
                    variant="outline"
                    className={`text-xs gap-1 ${roleColors[profile.role] ?? ''}`}
                  >
                    <Shield size={9} />
                    {roleLabels[profile.role] ?? profile.role}
                  </Badge>
                  {profile.blood_type && (
                    <BloodTypeBadge type={profile.blood_type} />
                  )}
                  {profile.is_donor && (
                    <Badge className="bg-red-50 text-red-700 border-red-200 text-xs gap-1 border">
                      <Heart size={9} className="fill-red-600" /> Donor
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

            {/* ── Personal Info ── */}
            <Section
              title="Personal Information"
              icon={<User size={15} />}
              defaultOpen={true}
            >
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Full Name
                  </Label>
                  <Input
                    value={form.full_name}
                    onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                    className="h-9"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Phone
                    </Label>
                    <Input
                      placeholder="+254 700 000 000"
                      value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Location
                    </Label>
                    <Input
                      placeholder="Galkacyo"
                      value={form.location}
                      onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Date of Birth
                  </Label>
                  <Input
                    type="date"
                    value={form.date_of_birth}
                    onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))}
                    className="h-9"
                  />
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={isPending}
                  size="sm"
                  className="w-full gap-2"
                >
                  {isPending
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Save size={13} />
                  }
                  Save Changes
                </Button>
              </div>
            </Section>

            {/* ── Blood Info ── */}
            <Section
              title="Blood Information"
              icon={<Droplets size={15} />}
            >
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Blood Type
                  </Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {BLOOD_TYPES.map(bt => (
                      <button
                        key={bt}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, blood_type: bt }))}
                        className={cn(
                          'flex items-center justify-center p-2 rounded-lg border-2 transition-all text-xs font-bold',
                          form.blood_type === bt
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/40 text-foreground'
                        )}
                      >
                        {bt}
                      </button>
                    ))}
                  </div>
                </div>

                {profile.role === 'user' && (
                  <div
                    onClick={() => setForm(p => ({ ...p, is_donor: !p.is_donor }))}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                      form.is_donor
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      form.is_donor ? 'bg-primary' : 'bg-muted'
                    )}>
                      <Heart size={14} className={form.is_donor ? 'text-white fill-white' : 'text-muted-foreground'} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Blood Donor</p>
                      <p className="text-xs text-muted-foreground">
                        {form.is_donor ? 'Registered — thank you!' : 'Register to donate'}
                      </p>
                    </div>
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                      form.is_donor ? 'border-primary bg-primary' : 'border-muted-foreground'
                    )}>
                      {form.is_donor && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSaveProfile}
                  disabled={isPending}
                  size="sm"
                  className="w-full gap-2"
                >
                  {isPending
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Save size={13} />
                  }
                  Save Blood Info
                </Button>
              </div>
            </Section>

            {/* ── Change Password ── */}
            <Section
              title="Change Password"
              icon={<Lock size={15} />}
            >
              <div className="space-y-3">
                {/* Current password */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Current Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showCurrent ? 'text' : 'password'}
                      placeholder="Enter current password"
                      value={pwForm.current}
                      onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                      className="h-9 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrent ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showNew ? 'text' : 'password'}
                      placeholder="At least 8 characters"
                      value={pwForm.new}
                      onChange={e => setPwForm(p => ({ ...p, new: e.target.value }))}
                      className="h-9 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNew ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                  {pwForm.new.length > 0 && pwForm.new.length < 8 && (
                    <p className="text-xs text-yellow-600">Must be at least 8 characters</p>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repeat new password"
                      value={pwForm.confirm}
                      onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                      className={cn('h-9 pr-9', pwMismatch && 'border-destructive focus-visible:ring-destructive')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                  {pwMismatch && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={isPending || pwMismatch || !pwForm.current || !pwForm.new}
                  size="sm"
                  className={cn(
                    'w-full gap-2 transition-all',
                    pwSaved && 'bg-green-600 hover:bg-green-600'
                  )}
                >
                  {isPending
                    ? <><Loader2 size={13} className="animate-spin" /> Updating...</>
                    : pwSaved
                    ? <><Check size={13} /> Password Changed!</>
                    : <><Lock size={13} /> Change Password</>
                  }
                </Button>
              </div>
            </Section>

            {/* ── Account Info ── */}
            <Section
              title="Account Information"
              icon={<Shield size={15} />}
            >
              <div className="space-y-2">
                {[
                  { label: 'Email',         value: profile.email },
                  { label: 'Role',          value: roleLabels[profile.role] ?? profile.role },
                  { label: 'Blood Type',    value: profile.blood_type ?? 'Not set' },
                  { label: 'Status',        value: profile.is_active ? 'Active' : 'Inactive' },
                  { label: 'Member Since',  value: new Date(profile.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })
                  },
                ].map(item => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    <span className="text-xs font-medium capitalize">{item.value}</span>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* Fixed Footer — Sign Out */}
          <div className="flex-shrink-0 border-t px-4 py-3 bg-background">
            <Button
              variant="outline"
              className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive h-9"
              onClick={handleLogout}
            >
              <LogOut size={14} />
              Sign Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}