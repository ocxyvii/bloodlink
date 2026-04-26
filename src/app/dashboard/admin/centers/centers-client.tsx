'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Building2, Plus, Search, MoreHorizontal,
  Pencil, Trash2, Power, PowerOff,
  MapPin, Phone, Mail, Clock,
  Loader2, Droplets, UserCog,
  CheckCircle2, XCircle, Globe
} from 'lucide-react'
import {
  createCenter,
  updateCenter,
  toggleCenterStatus,
  deleteCenter,
  assignAdminToCenter,
} from '@/app/actions/center-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { BloodTypeBadge } from '@/components/ui/blood-type-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
const KENYAN_CITIES = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale', 'Garissa', 'Kakamega']

interface Center {
  id: string
  name: string
  address: string
  city: string
  country: string
  phone: string
  email: string | null
  operating_hours: string | null
  latitude: number | null
  longitude: number | null
  is_active: boolean
  admin_id: string | null
  created_at: string
}

interface Admin {
  id: string
  full_name: string
  email: string
  location: string | null
}

interface InventoryItem {
  center_id: string
  blood_type: string
  units_available: number
}

interface CentersClientProps {
  centers: Center[]
  admins: Admin[]
  inventory: InventoryItem[]
  isSuperAdmin: boolean
}

const EMPTY_FORM = {
  name: '',
  address: '',
  city: '',
  country: 'Kenya',
  phone: '',
  email: '',
  operating_hours: '',
  latitude: '',
  longitude: '',
}

export function CentersClient({ centers, admins, inventory, isSuperAdmin }: CentersClientProps) {
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selected, setSelected] = useState<Center | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const updateForm = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const getCenterInventory = (centerId: string) =>
    inventory.filter(i => i.center_id === centerId)

  const getCenterAdmin = (adminId: string | null) =>
    admins.find(a => a.id === adminId)

  const getTotalUnits = (centerId: string) =>
    getCenterInventory(centerId).reduce((s, i) => s + i.units_available, 0)

  const getCriticalTypes = (centerId: string) =>
    getCenterInventory(centerId).filter(i => i.units_available < 10).map(i => i.blood_type)

  const filtered = centers.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase())
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && c.is_active) ||
      (filterStatus === 'inactive' && !c.is_active)
    return matchSearch && matchStatus
  })

  const handleCreate = () => {
    if (!form.name || !form.address || !form.city || !form.phone) {
      toast.error('Please fill in all required fields')
      return
    }
    startTransition(async () => {
      const result = await createCenter({
        name: form.name,
        address: form.address,
        city: form.city,
        country: form.country,
        phone: form.phone,
        email: form.email || undefined,
        operating_hours: form.operating_hours || undefined,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`${form.name} created successfully`)
        setShowCreate(false)
        setForm(EMPTY_FORM)
      }
    })
  }

  const handleEdit = () => {
    if (!selected) return
    if (!form.name || !form.address || !form.city || !form.phone) {
      toast.error('Please fill in all required fields')
      return
    }
    startTransition(async () => {
      const result = await updateCenter(selected.id, {
        name: form.name,
        address: form.address,
        city: form.city,
        country: form.country,
        phone: form.phone,
        email: form.email || undefined,
        operating_hours: form.operating_hours || undefined,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Center updated successfully')
        setShowEdit(false)
        setSelected(null)
      }
    })
  }

  const handleToggle = (center: Center) => {
    startTransition(async () => {
      const result = await toggleCenterStatus(center.id, !center.is_active)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Center ${center.is_active ? 'deactivated' : 'activated'}`)
      }
    })
  }

  const handleDelete = () => {
    if (!selected) return
    startTransition(async () => {
      const result = await deleteCenter(selected.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Center deleted')
        setShowDelete(false)
        setSelected(null)
      }
    })
  }

  const handleAssignAdmin = (centerId: string, adminId: string) => {
    startTransition(async () => {
      const result = await assignAdminToCenter(
        centerId,
        adminId === 'none' ? null : adminId
      )
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Admin assignment updated')
      }
    })
  }

  const openEdit = (center: Center) => {
    setSelected(center)
    setForm({
      name: center.name,
      address: center.address,
      city: center.city,
      country: center.country,
      phone: center.phone,
      email: center.email ?? '',
      operating_hours: center.operating_hours ?? '',
      latitude: center.latitude?.toString() ?? '',
      longitude: center.longitude?.toString() ?? '',
    })
    setShowEdit(true)
  }

  const openDetail = (center: Center) => {
    setSelected(center)
    setShowDetail(true)
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 size={24} className="text-primary" />
            Blood Centers
          </h1>
          <p className="text-muted-foreground mt-1">
            {centers.length} centers · {centers.filter(c => c.is_active).length} active
          </p>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setShowCreate(true) }} className="gap-2">
          <Plus size={16} />
          Add Center
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Centers',  value: centers.length,                           color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Active',         value: centers.filter(c => c.is_active).length,  color: 'bg-green-50 text-green-700 border-green-100' },
          { label: 'Inactive',       value: centers.filter(c => !c.is_active).length, color: 'bg-gray-50 text-gray-600 border-gray-100' },
          { label: 'Cities Covered', value: new Set(centers.map(c => c.city)).size,   color: 'bg-purple-50 text-purple-700 border-purple-100' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm mt-0.5 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search centers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">
          {filtered.length} of {centers.length} centers
        </span>
      </div>

      {/* Centers Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">No centers found</p>
          <p className="text-sm mt-1">
            {search ? 'Try a different search term' : 'Add your first blood center'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((center) => {
            const admin = getCenterAdmin(center.admin_id)
            const totalUnits = getTotalUnits(center.id)
            const criticalTypes = getCriticalTypes(center.id)
            const centerInventory = getCenterInventory(center.id)

            return (
              <div
                key={center.id}
                className={`bg-card rounded-2xl border flex flex-col transition-all hover:shadow-md ${
                  !center.is_active ? 'opacity-60' : ''
                }`}
              >
                {/* Card Top */}
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        center.is_active ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <Building2 size={18} className={center.is_active ? 'text-primary' : 'text-muted-foreground'} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight">{center.name}</p>
                        <p className="text-xs text-muted-foreground">{center.city}, {center.country}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={center.is_active
                          ? 'bg-green-50 text-green-700 border-green-200 text-xs'
                          : 'bg-gray-100 text-gray-500 border-gray-200 text-xs'
                        }
                      >
                        {center.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal size={14} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => openDetail(center)} className="cursor-pointer">
                            <Droplets size={14} className="mr-2" /> View Inventory
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(center)} className="cursor-pointer">
                            <Pencil size={14} className="mr-2" /> Edit Center
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggle(center)}
                            className="cursor-pointer"
                            disabled={isPending}
                          >
                            {center.is_active
                              ? <><PowerOff size={14} className="mr-2 text-red-500" /> Deactivate</>
                              : <><Power size={14} className="mr-2 text-green-600" /> Activate</>
                            }
                          </DropdownMenuItem>
                          {isSuperAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => { setSelected(center); setShowDelete(true) }}
                                className="cursor-pointer text-destructive focus:text-destructive"
                              >
                                <Trash2 size={14} className="mr-2" /> Delete Center
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Contact info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin size={11} className="flex-shrink-0" />
                      <span className="truncate">{center.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone size={11} className="flex-shrink-0" />
                      <span>{center.phone}</span>
                    </div>
                    {center.email && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail size={11} className="flex-shrink-0" />
                        <span className="truncate">{center.email}</span>
                      </div>
                    )}
                    {center.operating_hours && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock size={11} className="flex-shrink-0" />
                        <span className="truncate">{center.operating_hours}</span>
                      </div>
                    )}
                  </div>

                  {/* Blood type mini grid */}
                  {centerInventory.length > 0 && (
                    <div className="grid grid-cols-4 gap-1">
                      {BLOOD_TYPES.map(bt => {
                        const inv = centerInventory.find(i => i.blood_type === bt)
                        const units = inv?.units_available ?? 0
                        return (
                          <div
                            key={bt}
                            className={`flex flex-col items-center py-1.5 px-1 rounded-lg text-center ${
                              units === 0
                                ? 'bg-red-50 border border-red-100'
                                : units < 10
                                ? 'bg-orange-50 border border-orange-100'
                                : units < 25
                                ? 'bg-yellow-50 border border-yellow-100'
                                : 'bg-green-50 border border-green-100'
                            }`}
                          >
                            <span className="text-xs font-bold">{bt}</span>
                            <span className={`text-xs font-medium ${
                              units === 0 ? 'text-red-600' : units < 10 ? 'text-orange-600' : units < 25 ? 'text-yellow-600' : 'text-green-600'
                            }`}>{units}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="px-5 pb-4 pt-3 border-t mt-auto space-y-3">
                  {/* Admin assignment */}
                  <div className="flex items-center gap-2">
                    <UserCog size={13} className="text-muted-foreground flex-shrink-0" />
                    <Select
                      defaultValue={center.admin_id ?? 'none'}
                      onValueChange={(v) => handleAssignAdmin(center.id, v)}
                      disabled={isPending}
                    >
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue placeholder="Assign admin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No admin assigned</SelectItem>
                        {admins.map(a => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Droplets size={11} />
                      <span>{totalUnits} total units</span>
                    </div>
                    {criticalTypes.length > 0 ? (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle size={11} />
                        <span>{criticalTypes.length} critical</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 size={11} />
                        <span>All stocked</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── CREATE CENTER DIALOG ── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Blood Center</DialogTitle>
            <DialogDescription>
              A new center will be created with empty inventory for all 8 blood types.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Center Name <span className="text-destructive">*</span></Label>
              <Input placeholder="Nairobi Blood Bank" value={form.name} onChange={e => updateForm('name', e.target.value)} className="h-10" />
            </div>
            <div className="space-y-2">
              <Label>Address <span className="text-destructive">*</span></Label>
              <Input placeholder="Hospital Road, Upper Hill" value={form.address} onChange={e => updateForm('address', e.target.value)} className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>City <span className="text-destructive">*</span></Label>
                <Select onValueChange={(v) => updateForm('city', v)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {KENYAN_CITIES.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={form.country} onChange={e => updateForm('country', e.target.value)} className="h-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Phone <span className="text-destructive">*</span></Label>
                <Input placeholder="+254 20 000 0000" value={form.phone} onChange={e => updateForm('phone', e.target.value)} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="center@bloodlink.co.ke" value={form.email} onChange={e => updateForm('email', e.target.value)} className="h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Operating Hours</Label>
              <Input placeholder="Mon-Fri 8am-5pm, Sat 9am-1pm" value={form.operating_hours} onChange={e => updateForm('operating_hours', e.target.value)} className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Globe size={12} /> Latitude</Label>
                <Input type="number" step="any" placeholder="-1.2921" value={form.latitude} onChange={e => updateForm('latitude', e.target.value)} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Globe size={12} /> Longitude</Label>
                <Input type="number" step="any" placeholder="36.8219" value={form.longitude} onChange={e => updateForm('longitude', e.target.value)} className="h-10" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={isPending}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isPending} className="gap-2">
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Create Center
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── EDIT CENTER DIALOG ── */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Center</DialogTitle>
            <DialogDescription>Update details for {selected?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Center Name <span className="text-destructive">*</span></Label>
              <Input value={form.name} onChange={e => updateForm('name', e.target.value)} className="h-10" />
            </div>
            <div className="space-y-2">
              <Label>Address <span className="text-destructive">*</span></Label>
              <Input value={form.address} onChange={e => updateForm('address', e.target.value)} className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>City <span className="text-destructive">*</span></Label>
                <Select value={form.city} onValueChange={(v) => updateForm('city', v)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KENYAN_CITIES.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={form.country} onChange={e => updateForm('country', e.target.value)} className="h-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Phone <span className="text-destructive">*</span></Label>
                <Input value={form.phone} onChange={e => updateForm('phone', e.target.value)} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => updateForm('email', e.target.value)} className="h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Operating Hours</Label>
              <Input value={form.operating_hours} onChange={e => updateForm('operating_hours', e.target.value)} className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input type="number" step="any" value={form.latitude} onChange={e => updateForm('latitude', e.target.value)} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input type="number" step="any" value={form.longitude} onChange={e => updateForm('longitude', e.target.value)} className="h-10" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)} disabled={isPending}>Cancel</Button>
            <Button onClick={handleEdit} disabled={isPending} className="gap-2">
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── CENTER DETAIL / INVENTORY DIALOG ── */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>{selected?.city}, {selected?.country}</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="inventory">
            <TabsList className="w-full">
              <TabsTrigger value="inventory" className="flex-1">Blood Inventory</TabsTrigger>
              <TabsTrigger value="details" className="flex-1">Center Details</TabsTrigger>
            </TabsList>
            <TabsContent value="inventory" className="mt-4">
              <div className="grid grid-cols-2 gap-3">
                {BLOOD_TYPES.map(bt => {
                  const inv = selected
                    ? inventory.find(i => i.center_id === selected.id && i.blood_type === bt)
                    : null
                  const units = inv?.units_available ?? 0
                  return (
                    <div
                      key={bt}
                      className={`flex items-center justify-between p-3 rounded-xl border ${
                        units === 0
                          ? 'bg-red-50 border-red-200'
                          : units < 10
                          ? 'bg-orange-50 border-orange-200'
                          : units < 25
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <BloodTypeBadge type={bt} />
                      <div className="text-right">
                        <p className="text-sm font-bold">{units}</p>
                        <p className="text-xs text-muted-foreground">units</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>
            <TabsContent value="details" className="mt-4 space-y-3">
              {[
                { icon: <MapPin size={14} />,  label: 'Address',  value: `${selected?.address}, ${selected?.city}` },
                { icon: <Phone size={14} />,   label: 'Phone',    value: selected?.phone },
                { icon: <Mail size={14} />,    label: 'Email',    value: selected?.email ?? '—' },
                { icon: <Clock size={14} />,   label: 'Hours',    value: selected?.operating_hours ?? '—' },
                { icon: <Globe size={14} />,   label: 'Coords',   value: selected?.latitude ? `${selected.latitude}, ${selected.longitude}` : '—' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                  <span className="text-muted-foreground mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium">{item.value}</p>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ── DELETE CONFIRMATION ── */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blood Center</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{selected?.name}</strong> and all its inventory records. This cannot be undone.
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
              Delete Center
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}