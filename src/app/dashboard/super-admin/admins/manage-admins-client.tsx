'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  UserCog, Plus, Search, MoreHorizontal,
  Pencil, Trash2, PowerOff, Power,
  Building2, Phone, MapPin, Mail,
  Loader2, ShieldCheck, ShieldOff
} from 'lucide-react'
import { createAdmin, toggleAdminStatus, deleteAdmin, updateAdmin } from '@/app/actions/admin-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Profile, BloodCenter } from '@/types'

interface ManageAdminsClientProps {
  admins: Profile[]
  centers: BloodCenter[]
}

const EMPTY_FORM = {
  full_name: '',
  email: '',
  password: '',
  phone: '',
  location: '',
  center_id: '',
}

export function ManageAdminsClient({ admins, centers }: ManageAdminsClientProps) {
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<Profile | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const updateForm = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const filtered = admins.filter((a) =>
    a.full_name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    (a.location ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const getAdminCenter = (adminId: string) =>
    centers.find((c) => c.admin_id === adminId)

  const handleCreate = () => {
    if (!form.full_name || !form.email || !form.password) {
      toast.error('Please fill in all required fields')
      return
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    startTransition(async () => {
      const result = await createAdmin({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        location: form.location,
        center_id: form.center_id || undefined,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Admin account created for ${form.full_name}`)
        setShowCreate(false)
        setForm(EMPTY_FORM)
      }
    })
  }

  const handleEdit = () => {
    if (!selectedAdmin) return
    startTransition(async () => {
      const result = await updateAdmin(selectedAdmin.id, {
        full_name: form.full_name,
        phone: form.phone,
        location: form.location,
        center_id: form.center_id || undefined,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Admin updated successfully')
        setShowEdit(false)
        setSelectedAdmin(null)
      }
    })
  }

  const handleToggleStatus = (admin: Profile) => {
    startTransition(async () => {
      const result = await toggleAdminStatus(admin.id, !admin.is_active)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Admin ${admin.is_active ? 'deactivated' : 'activated'} successfully`)
      }
    })
  }

  const handleDelete = () => {
    if (!selectedAdmin) return
    startTransition(async () => {
      const result = await deleteAdmin(selectedAdmin.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Admin account deleted')
        setShowDelete(false)
        setSelectedAdmin(null)
      }
    })
  }

  const openEdit = (admin: Profile) => {
    const center = getAdminCenter(admin.id)
    setSelectedAdmin(admin)
    setForm({
      full_name: admin.full_name,
      email: admin.email,
      password: '',
      phone: admin.phone ?? '',
      location: admin.location ?? '',
      center_id: center?.id ?? '',
    })
    setShowEdit(true)
  }

  const openDelete = (admin: Profile) => {
    setSelectedAdmin(admin)
    setShowDelete(true)
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UserCog size={24} className="text-primary" />
            Manage Admins
          </h1>
          <p className="text-muted-foreground mt-1">
            {admins.length} admin{admins.length !== 1 ? 's' : ''} · {admins.filter(a => a.is_active).length} active
          </p>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setShowCreate(true) }} className="gap-2">
          <Plus size={16} />
          Add Admin
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Admins',   value: admins.length,                              color: 'bg-purple-50 text-purple-700 border-purple-100' },
          { label: 'Active',         value: admins.filter(a => a.is_active).length,     color: 'bg-green-50 text-green-700 border-green-100' },
          { label: 'Inactive',       value: admins.filter(a => !a.is_active).length,    color: 'bg-red-50 text-red-700 border-red-100' },
          { label: 'With Centers',   value: admins.filter(a => getAdminCenter(a.id)).length, color: 'bg-blue-50 text-blue-700 border-blue-100' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl border p-4 ${stat.color}`}>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm mt-0.5 opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Admin Cards Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <UserCog size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No admins found</p>
          <p className="text-sm mt-1">
            {search ? 'Try a different search term' : 'Create your first admin account'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((admin) => {
            const center = getAdminCenter(admin.id)
            const initials = admin.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            return (
              <div
                key={admin.id}
                className={`bg-card rounded-2xl border p-5 flex flex-col gap-4 transition-all hover:shadow-md ${
                  !admin.is_active ? 'opacity-60' : ''
                }`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-11 h-11">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{admin.full_name}</p>
                      <p className="text-xs text-muted-foreground">{admin.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={admin.is_active
                        ? 'bg-green-50 text-green-700 border-green-200 text-xs'
                        : 'bg-gray-100 text-gray-500 border-gray-200 text-xs'
                      }
                    >
                      {admin.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal size={15} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => openEdit(admin)} className="cursor-pointer">
                          <Pencil size={14} className="mr-2" /> Edit details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(admin)}
                          className="cursor-pointer"
                          disabled={isPending}
                        >
                          {admin.is_active
                            ? <><PowerOff size={14} className="mr-2 text-red-500" /> Deactivate</>
                            : <><Power size={14} className="mr-2 text-green-600" /> Activate</>
                          }
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openDelete(admin)}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 size={14} className="mr-2" /> Delete account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2">
                  {admin.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone size={12} className="flex-shrink-0" />
                      <span>{admin.phone}</span>
                    </div>
                  )}
                  {admin.location && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin size={12} className="flex-shrink-0" />
                      <span>{admin.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail size={12} className="flex-shrink-0" />
                    <span className="truncate">{admin.email}</span>
                  </div>
                </div>

                {/* Center assignment */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                  center
                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                    : 'bg-muted text-muted-foreground border border-border'
                }`}>
                  <Building2 size={12} className="flex-shrink-0" />
                  <span className="truncate">
                    {center ? center.name : 'No center assigned'}
                  </span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 border-t">
                  <span className="text-xs text-muted-foreground">
                    Joined {new Date(admin.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  {admin.is_active
                    ? <ShieldCheck size={14} className="text-green-600" />
                    : <ShieldOff size={14} className="text-muted-foreground" />
                  }
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── CREATE ADMIN DIALOG ── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Admin Account</DialogTitle>
            <DialogDescription>
              The admin will be able to log in immediately with these credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Full name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Jane Wanjiku"
                value={form.full_name}
                onChange={(e) => updateForm('full_name', e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Email address <span className="text-destructive">*</span></Label>
              <Input
                type="email"
                placeholder="admin@bloodlink.co.ke"
                value={form.email}
                onChange={(e) => updateForm('email', e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Password <span className="text-destructive">*</span></Label>
              <Input
                type="password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) => updateForm('password', e.target.value)}
                className="h-10"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  placeholder="+254 700 000 000"
                  value={form.phone}
                  onChange={(e) => updateForm('phone', e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  placeholder="Nairobi"
                  value={form.location}
                  onChange={(e) => updateForm('location', e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assign to Blood Center</Label>
              <Select onValueChange={(v) => updateForm('center_id', v)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a center (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {centers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isPending} className="gap-2">
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Create Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── EDIT ADMIN DIALOG ── */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
            <DialogDescription>
              Update details for {selectedAdmin?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input
                value={form.full_name}
                onChange={(e) => updateForm('full_name', e.target.value)}
                className="h-10"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  placeholder="+254 700 000 000"
                  value={form.phone}
                  onChange={(e) => updateForm('phone', e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  placeholder="Nairobi"
                  value={form.location}
                  onChange={(e) => updateForm('location', e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Blood Center Assignment</Label>
              <Select
                value={form.center_id}
                onValueChange={(v) => updateForm('center_id', v)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a center (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No center</SelectItem>
                  {centers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isPending} className="gap-2">
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DELETE CONFIRMATION ── */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Admin Account</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{selectedAdmin?.full_name}</strong>'s account
              and remove all their access. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}