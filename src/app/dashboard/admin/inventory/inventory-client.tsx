'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Droplets, Plus, Search, Filter,
  Pencil, Trash2, Loader2, AlertTriangle,
  TrendingDown, CheckCircle2, RefreshCw,
  Building2, Calendar
} from 'lucide-react'
import {
  updateInventory,
  addInventoryEntry,
  deleteInventoryEntry,
} from '@/app/actions/inventory-actions'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BloodTypeBadge } from '@/components/ui/blood-type-badge'
import { BloodCenter } from '@/types'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

interface InventoryItem {
  id: string
  center_id: string
  blood_type: string
  units_available: number
  units_reserved: number
  expiry_date: string | null
  last_updated: string
  center?: { id: string; name: string; city: string } | null
}

interface InventoryClientProps {
  inventory: InventoryItem[]
  centers: BloodCenter[]
}

function StockIndicator({ units }: { units: number }) {
  if (units === 0) return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      <span className="text-xs font-medium text-red-600">Out of stock</span>
    </div>
  )
  if (units < 10) return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-red-400" />
      <span className="text-xs font-medium text-red-600">Critical</span>
    </div>
  )
  if (units < 25) return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-yellow-400" />
      <span className="text-xs font-medium text-yellow-600">Low</span>
    </div>
  )
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-green-500" />
      <span className="text-xs font-medium text-green-600">Good</span>
    </div>
  )
}

export function InventoryClient({ inventory, centers }: InventoryClientProps) {
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterCenter, setFilterCenter] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [selected, setSelected] = useState<InventoryItem | null>(null)
  const [form, setForm] = useState({
    center_id: '',
    blood_type: '',
    units_available: '',
    units_reserved: '',
    expiry_date: '',
  })

  const updateForm = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  // Summary stats
  const totalUnits = inventory.reduce((s, i) => s + i.units_available, 0)
  const criticalCount = inventory.filter(i => i.units_available < 10).length
  const outOfStock = inventory.filter(i => i.units_available === 0).length
  const goodStock = inventory.filter(i => i.units_available >= 25).length

  // Aggregated by blood type for summary
  const byBloodType = BLOOD_TYPES.map(bt => ({
    type: bt,
    total: inventory
      .filter(i => i.blood_type === bt)
      .reduce((s, i) => s + i.units_available, 0),
  }))

  // Filtered list
  const filtered = inventory.filter(item => {
    const matchSearch =
      item.blood_type.toLowerCase().includes(search.toLowerCase()) ||
      (item.center?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (item.center?.city ?? '').toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'all' || item.blood_type === filterType
    const matchCenter = filterCenter === 'all' || item.center_id === filterCenter
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'critical' && item.units_available < 10) ||
      (filterStatus === 'low' && item.units_available >= 10 && item.units_available < 25) ||
      (filterStatus === 'good' && item.units_available >= 25) ||
      (filterStatus === 'out' && item.units_available === 0)
    return matchSearch && matchType && matchCenter && matchStatus
  })

  const handleAdd = () => {
    if (!form.center_id || !form.blood_type || !form.units_available) {
      toast.error('Please fill in all required fields')
      return
    }
    startTransition(async () => {
      const result = await addInventoryEntry({
        center_id: form.center_id,
        blood_type: form.blood_type,
        units_available: parseInt(form.units_available),
        units_reserved: parseInt(form.units_reserved || '0'),
        expiry_date: form.expiry_date || undefined,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Inventory updated successfully')
        setShowAdd(false)
        setForm({ center_id: '', blood_type: '', units_available: '', units_reserved: '', expiry_date: '' })
      }
    })
  }

  const handleEdit = () => {
    if (!selected) return
    startTransition(async () => {
      const result = await updateInventory(selected.id, {
        units_available: parseInt(form.units_available),
        units_reserved: parseInt(form.units_reserved || '0'),
        expiry_date: form.expiry_date || undefined,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Inventory updated')
        setShowEdit(false)
        setSelected(null)
      }
    })
  }

  const handleDelete = () => {
    if (!selected) return
    startTransition(async () => {
      const result = await deleteInventoryEntry(selected.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Entry removed')
        setShowDelete(false)
        setSelected(null)
      }
    })
  }

  const openEdit = (item: InventoryItem) => {
    setSelected(item)
    setForm({
      center_id: item.center_id,
      blood_type: item.blood_type,
      units_available: item.units_available.toString(),
      units_reserved: item.units_reserved.toString(),
      expiry_date: item.expiry_date ?? '',
    })
    setShowEdit(true)
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Droplets size={24} className="text-primary" />
            Blood Inventory
          </h1>
          <p className="text-muted-foreground mt-1">
            {inventory.length} entries across {centers.length} centers
          </p>
        </div>
        <Button onClick={() => { setForm({ center_id: '', blood_type: '', units_available: '', units_reserved: '', expiry_date: '' }); setShowAdd(true) }} className="gap-2">
          <Plus size={16} />
          Add / Update Stock
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Units',    value: totalUnits,    icon: <Droplets size={16} />,      color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Critical Stock', value: criticalCount, icon: <AlertTriangle size={16} />, color: 'bg-red-50 text-red-700 border-red-100' },
          { label: 'Out of Stock',   value: outOfStock,    icon: <TrendingDown size={16} />,  color: 'bg-orange-50 text-orange-700 border-orange-100' },
          { label: 'Good Stock',     value: goodStock,     icon: <CheckCircle2 size={16} />,  color: 'bg-green-50 text-green-700 border-green-100' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <div className="flex items-center justify-between mb-1">
              {s.icon}
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm mt-0.5 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Blood Type Summary Bar */}
      <div className="bg-card rounded-2xl border p-5">
        <p className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Droplets size={14} className="text-primary" />
          Total Units by Blood Type (All Centers)
        </p>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {byBloodType.map(({ type, total }) => {
            const color = total === 0
              ? 'border-red-200 bg-red-50'
              : total < 10
              ? 'border-red-200 bg-red-50'
              : total < 25
              ? 'border-yellow-200 bg-yellow-50'
              : 'border-green-200 bg-green-50'
            const textColor = total === 0 || total < 10
              ? 'text-red-700'
              : total < 25
              ? 'text-yellow-700'
              : 'text-green-700'
            return (
              <div key={type} className={`flex flex-col items-center p-3 rounded-xl border-2 ${color}`}>
                <BloodTypeBadge type={type} />
                <span className={`text-sm font-bold mt-1.5 ${textColor}`}>{total}</span>
                <span className="text-xs text-muted-foreground">units</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search center or blood type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="h-9 w-[130px]">
            <Filter size={13} className="mr-1 text-muted-foreground" />
            <SelectValue placeholder="Blood Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {BLOOD_TYPES.map(bt => (
              <SelectItem key={bt} value={bt}>{bt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCenter} onValueChange={setFilterCenter}>
          <SelectTrigger className="h-9 w-[160px]">
            <Building2 size={13} className="mr-1 text-muted-foreground" />
            <SelectValue placeholder="Center" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Centers</SelectItem>
            {centers.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="good">Good</SelectItem>
          </SelectContent>
        </Select>
        {(search || filterType !== 'all' || filterCenter !== 'all' || filterStatus !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearch(''); setFilterType('all'); setFilterCenter('all'); setFilterStatus('all') }}
            className="h-9 text-muted-foreground gap-1"
          >
            <RefreshCw size={13} /> Clear
          </Button>
        )}
        <span className="text-sm text-muted-foreground ml-auto">
          {filtered.length} of {inventory.length} entries
        </span>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-semibold">Blood Type</TableHead>
              <TableHead className="font-semibold">Center</TableHead>
              <TableHead className="font-semibold">Available</TableHead>
              <TableHead className="font-semibold">Reserved</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Expiry Date</TableHead>
              <TableHead className="font-semibold">Last Updated</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  <Droplets size={32} className="mx-auto mb-2 opacity-20" />
                  <p>No inventory entries found</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell>
                    <BloodTypeBadge type={item.blood_type} />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{item.center?.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{item.center?.city ?? ''}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-bold">{item.units_available}</span>
                    <span className="text-xs text-muted-foreground ml-1">units</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{item.units_reserved}</span>
                    <span className="text-xs text-muted-foreground ml-1">units</span>
                  </TableCell>
                  <TableCell>
                    <StockIndicator units={item.units_available} />
                  </TableCell>
                  <TableCell>
                    {item.expiry_date ? (
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-muted-foreground" />
                        <span className={`text-xs ${
                          new Date(item.expiry_date) < new Date()
                            ? 'text-red-600 font-medium'
                            : 'text-muted-foreground'
                        }`}>
                          {new Date(item.expiry_date).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                          {new Date(item.expiry_date) < new Date() && ' (Expired)'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.last_updated).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => { setSelected(item); setShowDelete(true) }}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── ADD / UPDATE DIALOG ── */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add / Update Stock</DialogTitle>
            <DialogDescription>
              If an entry already exists for this center and blood type, it will be updated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Blood Center <span className="text-destructive">*</span></Label>
              <Select onValueChange={(v) => updateForm('center_id', v)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select center" />
                </SelectTrigger>
                <SelectContent>
                  {centers.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Blood Type <span className="text-destructive">*</span></Label>
              <Select onValueChange={(v) => updateForm('blood_type', v)}>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Units Available <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.units_available}
                  onChange={(e) => updateForm('units_available', e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label>Units Reserved</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.units_reserved}
                  onChange={(e) => updateForm('units_reserved', e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={form.expiry_date}
                onChange={(e) => updateForm('expiry_date', e.target.value)}
                className="h-10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={isPending} className="gap-2">
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Save Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── EDIT DIALOG ── */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Stock</DialogTitle>
            <DialogDescription>
              Updating <strong>{selected?.blood_type}</strong> at <strong>{selected?.center?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <BloodTypeBadge type={selected?.blood_type ?? ''} />
              <div>
                <p className="text-sm font-medium">{selected?.center?.name}</p>
                <p className="text-xs text-muted-foreground">{selected?.center?.city}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Units Available <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  min="0"
                  value={form.units_available}
                  onChange={(e) => updateForm('units_available', e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label>Units Reserved</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.units_reserved}
                  onChange={(e) => updateForm('units_reserved', e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={form.expiry_date}
                onChange={(e) => updateForm('expiry_date', e.target.value)}
                className="h-10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isPending} className="gap-2">
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Update Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DELETE CONFIRMATION ── */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Inventory Entry</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the <strong>{selected?.blood_type}</strong> entry
              from <strong>{selected?.center?.name}</strong>. This cannot be undone.
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
              Remove Entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}