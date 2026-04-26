'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Heart, Search, CheckCircle2, XCircle,
  Loader2, Eye, RefreshCw, Calendar,
  User, Building2, Filter
} from 'lucide-react'
import { updateDonationStatus } from '@/app/actions/donation-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { BloodTypeBadge } from '@/components/ui/blood-type-badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow, format } from 'date-fns'

interface Donation {
  id: string
  donor_id: string
  center_id: string
  blood_type: string
  units_donated: number
  donation_date: string
  status: string
  notes: string | null
  created_at: string
  donor?: { id: string; full_name: string; email: string; phone: string | null; blood_type: string | null } | null
  center?: { id: string; name: string; city: string } | null
}

export function DonationsClient({
  donations,
  centers,
}: {
  donations: Donation[]
  centers: { id: string; name: string; city: string }[]
}) {
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCenter, setFilterCenter] = useState('all')
  const [selected, setSelected] = useState<Donation | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showAction, setShowAction] = useState<'complete' | 'cancel' | 'noshow' | null>(null)
  const [notes, setNotes] = useState('')

  const scheduled  = donations.filter(d => d.status === 'scheduled').length
  const completed  = donations.filter(d => d.status === 'completed').length
  const cancelled  = donations.filter(d => d.status === 'cancelled').length
  const totalUnits = donations.filter(d => d.status === 'completed').reduce((s, d) => s + d.units_donated, 0)

  const filtered = donations.filter(d => {
    const matchSearch =
      (d.donor?.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (d.donor?.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      d.blood_type.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || d.status === filterStatus
    const matchCenter = filterCenter === 'all' || d.center_id === filterCenter
    return matchSearch && matchStatus && matchCenter
  })

  const handleAction = (status: string) => {
    if (!selected) return
    startTransition(async () => {
      const result = await updateDonationStatus(selected.id, status, notes || undefined)
      if (result.error) {
        toast.error(result.error)
      } else {
        const msgs: Record<string, string> = {
          completed: 'Donation marked as completed — inventory updated',
          cancelled: 'Donation cancelled',
          no_show:   'Donor marked as no-show',
        }
        toast.success(msgs[status] ?? 'Updated')
        setShowAction(null)
        setNotes('')
        setSelected(null)
      }
    })
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Heart size={24} className="text-primary" />
          Donations
        </h1>
        <p className="text-muted-foreground mt-1">
          {donations.length} total · {scheduled} scheduled · {totalUnits} units collected
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Scheduled',     value: scheduled,  color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
          { label: 'Completed',     value: completed,  color: 'bg-green-50 text-green-700 border-green-100' },
          { label: 'Cancelled',     value: cancelled,  color: 'bg-gray-50 text-gray-600 border-gray-100' },
          { label: 'Units Collected', value: totalUnits, color: 'bg-red-50 text-red-700 border-red-100' },
        ].map(s => (
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
            placeholder="Search donor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="no_show">No Show</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCenter} onValueChange={setFilterCenter}>
          <SelectTrigger className="h-9 w-[160px]">
            <Filter size={13} className="mr-1 text-muted-foreground" />
            <SelectValue placeholder="Center" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Centers</SelectItem>
            {centers.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || filterStatus !== 'all' || filterCenter !== 'all') && (
          <Button
            variant="ghost" size="sm"
            onClick={() => { setSearch(''); setFilterStatus('all'); setFilterCenter('all') }}
            className="h-9 text-muted-foreground gap-1"
          >
            <RefreshCw size={13} /> Clear
          </Button>
        )}
        <span className="text-sm text-muted-foreground ml-auto">
          {filtered.length} of {donations.length}
        </span>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-semibold">Donor</TableHead>
              <TableHead className="font-semibold">Blood Type</TableHead>
              <TableHead className="font-semibold">Center</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Units</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <Heart size={32} className="mx-auto mb-2 opacity-20" />
                  <p>No donations found</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(d => (
                <TableRow key={d.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {(d.donor?.full_name ?? '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{d.donor?.full_name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">{d.donor?.email ?? ''}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><BloodTypeBadge type={d.blood_type} /></TableCell>
                  <TableCell>
                    <p className="text-sm">{d.center?.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{d.center?.city ?? ''}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{format(new Date(d.donation_date), 'dd MMM yyyy')}</p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-bold">{d.units_donated}</span>
                  </TableCell>
                  <TableCell><StatusBadge status={d.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => { setSelected(d); setShowDetail(true) }}
                      >
                        <Eye size={13} />
                      </Button>
                      {d.status === 'scheduled' && (
                        <>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-green-600 hover:bg-green-50"
                            onClick={() => { setSelected(d); setShowAction('complete') }}
                            disabled={isPending}
                          >
                            <CheckCircle2 size={13} />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-destructive hover:bg-red-50"
                            onClick={() => { setSelected(d); setShowAction('cancel') }}
                            disabled={isPending}
                          >
                            <XCircle size={13} />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Donation Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <BloodTypeBadge type={selected.blood_type} />
                <div>
                  <p className="font-semibold text-sm">{selected.units_donated} unit(s)</p>
                  <StatusBadge status={selected.status} />
                </div>
              </div>
              {[
                { icon: <User size={13} />,      label: 'Donor',    value: selected.donor?.full_name ?? '—' },
                { icon: <Building2 size={13} />, label: 'Center',   value: `${selected.center?.name}, ${selected.center?.city}` },
                { icon: <Calendar size={13} />,  label: 'Date',     value: format(new Date(selected.donation_date), 'dd MMM yyyy') },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                  <span className="text-muted-foreground">{item.icon}</span>
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium">{item.value}</p>
                  </div>
                </div>
              ))}
              {selected.notes && (
                <div className="p-3 rounded-xl bg-muted/40">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm">{selected.notes}</p>
                </div>
              )}
              {selected.status === 'scheduled' && (
                <div className="flex gap-2 pt-1">
                  <Button
                    className="flex-1 gap-1 bg-green-600 hover:bg-green-700"
                    onClick={() => { setShowDetail(false); setShowAction('complete') }}
                  >
                    <CheckCircle2 size={14} /> Complete
                  </Button>
                  <Button
                    variant="destructive" className="flex-1 gap-1"
                    onClick={() => { setShowDetail(false); setShowAction('noshow') }}
                  >
                    No Show
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog
        open={showAction !== null}
        onOpenChange={() => { setShowAction(null); setNotes('') }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {showAction === 'complete' ? '✅ Complete Donation' :
               showAction === 'noshow'   ? '⚠️ Mark No Show' :
               '❌ Cancel Donation'}
            </DialogTitle>
            <DialogDescription>
              {showAction === 'complete'
                ? `This will add ${selected?.units_donated} unit(s) of ${selected?.blood_type} to inventory at ${selected?.center?.name}.`
                : showAction === 'noshow'
                ? 'Mark this donor as a no-show. No inventory will be updated.'
                : 'Cancel this scheduled donation.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Any additional notes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAction(null); setNotes('') }} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => handleAction(
                showAction === 'complete' ? 'completed' :
                showAction === 'noshow'   ? 'no_show' : 'cancelled'
              )}
              disabled={isPending}
              className={`gap-2 ${showAction === 'complete' ? 'bg-green-600 hover:bg-green-700' : ''}`}
              variant={showAction === 'complete' ? 'default' : 'destructive'}
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}