'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  User, Mail, Phone, MapPin, Calendar,
  Lock, LogOut, Save, Loader2,
  Eye, EyeOff, Shield, Heart, Droplets
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  updateProfile,
  changePassword,
} from '@/app/actions/donation-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BloodTypeBadge } from '@/components/ui/blood-type-badge'
import { Profile } from '@/types'

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

export function ProfileSheet({ profile, trigger }: ProfileSheetProps) {
  const router = useRouter()
  const [open, setOpen]           = useState(false)
  const [isPending, startTransition] = useTransition()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [form, setForm] = useState({
    full_name:     profile.full_name ?? '',
    phone:         profile.phone ?? '',
    location:      profile.location ?? '',
    date_of_birth: profile.date_of_birth ?? '',
    blood_type:    profile.blood_type ?? '',
    is_donor:      profile.is_donor ?? false,
  })

  const [pwForm, setPwForm] = useState({
    current:  '',
    new:      '',
    confirm:  '',
  })

  const initials = profile.full_name
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const handleSaveProfile = () => {
    if (!form.full_name.trim()) {
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
      if (result.error) toast.error(result.error)
      else toast.success('Profile updated successfully')
    })
  }

  const handleChangePassword = () => {
    if (!pwForm.current)  { toast.error('Enter your current password'); return }
    if (pwForm.new.length < 8) { toast.error('New password must be at least 8 characters'); return }
    if (pwForm.new !== pwForm.confirm) { toast.error('New passwords do not match'); return }

    startTransition(async () => {
      const result = await changePassword(pwForm.current, pwForm.new)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Password changed successfully')
        setPwForm({ current: '', new: '', confirm: '' })
      }
    })
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Signed out successfully')
    router.push('/login')
  }

  return (
    <>
      {/* Trigger */}
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger ?? (
          <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:w-[440px] p-0 flex flex-col">
          <SheetHeader className="px-5 py-4 border-b flex-shrink-0">
            <SheetTitle className="flex items-center gap-2 text-base">
              <User size={16} className="text-primary" />
              My Profile
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {/* Profile Header */}
            <div className="px-5 py-5 border-b bg-muted/20">
              <div className="flex items-center gap-4">
                <Avatar className="w-14 h-14">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{profile.full_name}</p>
                  <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`text-xs ${roleColors[profile.role] ?? ''}`}
                    >
                      <Shield size={10} className="mr-1" />
                      {roleLabels[profile.role] ?? profile.role}
                    </Badge>
                    {profile.blood_type && (
                      <BloodTypeBadge type={profile.blood_type} />
                    )}
                    {profile.is_donor && (
                      <Badge className="bg-red-50 text-red-700 border-red-200 text-xs gap-1">
                        <Heart size={9} className="fill-red-600" /> Donor
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="profile" className="flex-1">
              <TabsList className="w-full rounded-none border-b h-10 bg-transparent px-5 justify-start gap-4">
                <TabsTrigger
                  value="profile"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 h-10 text-sm"
                >
                  Edit Profile
                </TabsTrigger>
                <TabsTrigger
                  value="password"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 h-10 text-sm"
                >
                  Password
                </TabsTrigger>
                <TabsTrigger
                  value="account"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 h-10 text-sm"
                >
                  Account
                </TabsTrigger>
              </TabsList>

              {/* ── EDIT PROFILE TAB ── */}
              <TabsContent value="profile" className="px-5 py-5 space-y-5 mt-0">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <User size={11} /> Full Name
                  </Label>
                  <Input
                    value={form.full_name}
                    onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <Mail size={11} /> Email
                  </Label>
                  <Input
                    value={profile.email}
                    disabled
                    className="h-10 bg-muted/50 text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      <Phone size={11} /> Phone
                    </Label>
                    <Input
                      placeholder="+254 700 000 000"
                      value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      <MapPin size={11} /> Location
                    </Label>
                    <Input
                      placeholder="Nairobi"
                      value={form.location}
                      onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <Calendar size={11} /> Date of Birth
                  </Label>
                  <Input
                    type="date"
                    value={form.date_of_birth}
                    onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <Droplets size={11} /> Blood Type
                  </Label>
                  <Select
                    value={form.blood_type}
                    onValueChange={v => setForm(p => ({ ...p, blood_type: v }))}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOD_TYPES.map(bt => (
                        <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Donor toggle — only show for users */}
                {profile.role === 'user' && (
                  <div
                    onClick={() => setForm(p => ({ ...p, is_donor: !p.is_donor }))}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      form.is_donor
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      form.is_donor ? 'bg-primary' : 'bg-muted'
                    }`}>
                      <Heart size={16} className={form.is_donor ? 'text-white fill-white' : 'text-muted-foreground'} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Blood Donor</p>
                      <p className="text-xs text-muted-foreground">
                        {form.is_donor ? 'Registered — thank you!' : 'Register to donate'}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      form.is_donor ? 'border-primary bg-primary' : 'border-muted-foreground'
                    }`}>
                      {form.is_donor && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSaveProfile}
                  disabled={isPending}
                  className="w-full h-10 gap-2"
                >
                  {isPending
                    ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                    : <><Save size={14} /> Save Changes</>
                  }
                </Button>
              </TabsContent>

              {/* ── PASSWORD TAB ── */}
              <TabsContent value="password" className="px-5 py-5 space-y-5 mt-0">
                <div className="p-3 rounded-xl bg-muted/40 text-xs text-muted-foreground">
                  <Lock size={12} className="inline mr-1" />
                  Password must be at least 8 characters long.
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Current Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showCurrent ? 'text' : 'password'}
                      placeholder="Enter current password"
                      value={pwForm.current}
                      onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                      className="h-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showNew ? 'text' : 'password'}
                      placeholder="At least 8 characters"
                      value={pwForm.new}
                      onChange={e => setPwForm(p => ({ ...p, new: e.target.value }))}
                      className="h-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repeat new password"
                      value={pwForm.confirm}
                      onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                      className="h-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {pwForm.confirm && pwForm.new !== pwForm.confirm && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={isPending || (!!pwForm.confirm && pwForm.new !== pwForm.confirm)}
                  className="w-full h-10 gap-2"
                >
                  {isPending
                    ? <><Loader2 size={14} className="animate-spin" /> Updating...</>
                    : <><Lock size={14} /> Change Password</>
                  }
                </Button>
              </TabsContent>

              {/* ── ACCOUNT TAB ── */}
              <TabsContent value="account" className="px-5 py-5 space-y-4 mt-0">
                <div className="space-y-2">
                  {[
                    { label: 'Email',        value: profile.email },
                    { label: 'Role',         value: roleLabels[profile.role] ?? profile.role },
                    { label: 'Blood Type',   value: profile.blood_type ?? 'Not set' },
                    { label: 'Donor Status', value: profile.is_donor ? 'Registered Donor' : 'Not a donor' },
                    { label: 'Account Status', value: profile.is_active ? 'Active' : 'Inactive' },
                    { label: 'Member Since', value: new Date(profile.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })
                    },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium capitalize">{item.value}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <Button
                  variant="destructive"
                  className="w-full h-10 gap-2"
                  onClick={handleLogout}
                >
                  <LogOut size={14} />
                  Sign Out
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}