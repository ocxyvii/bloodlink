'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  ClipboardList, Search, Filter, Eye,
  CheckCircle2, XCircle, Droplets,
  Loader2, AlertTriangle, Clock,
  User, Building2, Phone, Mail,
  ChevronDown, RefreshCw, Zap
} from 'lucide-react'
import { updateRequestStatus } from '@/app/actions/request-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDistanceToNow } from 'date-fns'

interface Request {
  id: string
  blood_type: string
  units_needed: number
  urgency: string
  status: string
  hospital_name: string
  patient_name: string
  reason: string | null
  notes: string | null
  center_id: string | null
  created_at: string
  updated_at: string
  requester?: {
    id: string
    full_name: string
    email: string
    phone: string | null
    blood_type: string | null
  } | null
  center?: {
    id: string
    name: string
    city: string
  } | null
}

interface RequestsClientProps {
  requests: Request[]
  centers: { id: string; name: string; city: string }[]
  isSuperAdmin: boolean
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  if (urgency === 'emergency') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">
      <Zap size={10} className="fill-red-600" /> EMERGENCY
    </span>
  )
  if (urgency === 'urgent') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold border border-orange-200">
      <AlertTriangle size={10} /> Urgent
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
      <Clock size={10} /> Normal
    </span>
  )
}

export function RequestsClient({ requests, centers, isSuperAdmin }: RequestsClientProps) {
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterUrgency, setFilterUrgency] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [selected, setSelected] = useState<Request | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showApprove, setShowApprove] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [showFulfill, setShowFulfill] = useState(false)
  const [notes, setNotes] = useState('')
  const [selectedCenter, setSelectedCenter] = useState('')

  const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

  // Stats
  const pending   = requests.filter(r => r.status === 'pending').length
  const approved  = requests.filter(r => r.status === 'approved').length
  const emergency = requests.filter(r => r.urgency === 'emergency' && r.status === 'pending').length
  const fulfilled = requests.filter(r => r.status === 'fulfilled').length

  const filtered = requests.filter(r => {
    const matchSearch =
      r.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      r.hospital_name.toLowerCase().includes(search.toLowerCase()) ||
      r.blood_type.toLowerCase().includes(search.toLowerCase()) ||
      (r.requester?.full_name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus   = filterStatus  === 'all' || r.status  === filterStatus
    const matchUrgency  = filterUrgency === 'all' || r.urgency === filterUrgency
    const matchType     = filterType    === 'all' || r.blood_type === filterType
    return matchSearch && matchStatus && matchUrgency && matchType
  })

  // Sort — emergency pending first
  const sorted = [...filtered].sort((a, b) => {
    if (a.urgency === 'emergency' && a.status === 'pending') return -1
    if (b.urgency === 'emergency' && b.status === 'pending') return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const handleApprove = () => {
    if (!selected) return
    startTransition(async () => {
      const normalizedCenter =
        selectedCenter && selectedCenter !== 'none' ? selectedCenter : undefined

      const result = await updateRequestStatus(
        selected.id,
        'approved',
        notes || undefined,
        normalizedCenter
      )
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Request approved — requester has been notified')
        setShowApprove(false)
        setNotes('')
        setSelected(null)
      }
    })
  }

  const handleReject = () => {
    if (!selected) return
    if (!notes.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }
    startTransition(async () => {
      const result = await updateRequestStatus(
        selected.id, 'rejected', notes
      )
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Request rejected — requester has been notified')
        setShowReject(false)
        setNotes('')
        setSelected(null)
      }
    })
  }

  const handleFulfill = () => {
    if (!selected) return
    startTransition(async () => {
      const result = await updateRequestStatus(
        selected.id, 'fulfilled', notes || undefined
      )
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Request marked as fulfilled 🎉')
        setShowFulfill(false)
        setNotes('')
        setSelected(null)
      }
    })
  }

  const openAction = (req: Request, action: 'approve' | 'reject' | 'fulfill' | 'detail') => {
    setSelected(req)
    setNotes('')
    setSelectedCenter(req.center_id ?? '')
    if (action === 'approve') setShowApprove(true)
    if (action === 'reject')  setShowReject(true)
    if (action === 'fulfill') setShowFulfill(true)
    if (action === 'detail')  setShowDetail(true)
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList size={24} className="text-primary" />
            Blood Requests
          </h1>
          <p className="text-muted-foreground mt-1">
            {requests.length} total · {pending} pending · {emergency} emergency
          </p>
        </div>
      </div>

      {/* Emergency Alert */}
      {emergency > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border-2 border-red-200 animate-pulse">
          <Zap size={18} className="text-red-600 mt-0.5 flex-shrink-0 fill-red-600" />
          <div>
            <p className="text-sm font-bold text-red-700">
              {emergency} Emergency Request{emergency > 1 ? 's' : ''} Pending
            </p>
            <p className="text-sm text-red-600 mt-0.5">
              These require immediate attention. Scroll down to review.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending',   value: pending,   color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
          { label: 'Approved',  value: approved,  color: 'bg-green-50 text-green-700 border-green-100'   },
          { label: 'Emergency', value: emergency, color: 'bg-red-50 text-red-700 border-red-100'         },
          { label: 'Fulfilled', value: fulfilled, color: 'bg-blue-50 text-blue-700 border-blue-100'      },
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
            placeholder="Search patient, hospital..."
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="fulfilled">Fulfilled</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterUrgency} onValueChange={setFilterUrgency}>
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue placeholder="Urgency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Urgency</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="h-9 w-[120px]">
            <SelectValue placeholder="Blood Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {BLOOD_TYPES.map(bt => (
              <SelectItem key={bt} value={bt}>{bt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || filterStatus !== 'all' || filterUrgency !== 'all' || filterType !== 'all') && (
          <Button
            variant="ghost" size="sm"
            onClick={() => { setSearch(''); setFilterStatus('all'); setFilterUrgency('all'); setFilterType('all') }}
            className="h-9 text-muted-foreground gap-1"
          >
            <RefreshCw size={13} /> Clear
          </Button>
        )}
        <span className="text-sm text-muted-foreground ml-auto">
          {sorted.length} of {requests.length}
        </span>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-semibold">Patient</TableHead>
              <TableHead className="font-semibold">Blood Type</TableHead>
              <TableHead className="font-semibold">Units</TableHead>
              <TableHead className="font-semibold">Urgency</TableHead>
              <TableHead className="font-semibold">Hospital</TableHead>
              <TableHead className="font-semibold">Requester</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Submitted</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  <ClipboardList size={32} className="mx-auto mb-2 opacity-20" />
                  <p>No requests found</p>
                </TableCell>
              </TableRow>
            ) : (
              sorted.map(req => (
                <TableRow
                  key={req.id}
                  className={`hover:bg-muted/30 ${
                    req.urgency === 'emergency' && req.status === 'pending'
                      ? 'bg-red-50/50 border-l-4 border-l-red-400'
                      : ''
                  }`}
                >
                  <TableCell>
                    <p className="text-sm font-medium">{req.patient_name}</p>
                  </TableCell>
                  <TableCell>
                    <BloodTypeBadge type={req.blood_type} />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-bold">{req.units_needed}</span>
                  </TableCell>
                  <TableCell>
                    <UrgencyBadge urgency={req.urgency} />
                  </TableCell>
                  <TableCell>
                    <p className="text-sm max-w-[140px] truncate">{req.hospital_name}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{req.requester?.full_name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{req.requester?.email ?? ''}</p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={req.status} />
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                      {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => openAction(req, 'detail')}
                      >
                        <Eye size={13} />
                      </Button>
                      {req.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => openAction(req, 'approve')}
                            disabled={isPending}
                          >
                            <CheckCircle2 size={13} />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50"
                            onClick={() => openAction(req, 'reject')}
                            disabled={isPending}
                          >
                            <XCircle size={13} />
                          </Button>
                        </>
                      )}
                      {req.status === 'approved' && (
                        <Button
                          variant="ghost" size="sm"
                          className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => openAction(req, 'fulfill')}
                          disabled={isPending}
                        >
                          <Droplets size={12} className="mr-1" /> Fulfill
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── DETAIL DIALOG ── */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Request Details
              {selected && <UrgencyBadge urgency={selected.urgency} />}
            </DialogTitle>
            <DialogDescription>
              <span suppressHydrationWarning>
                Submitted {selected && formatDistanceToNow(new Date(selected.created_at), { addSuffix: true })}
              </span>
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {/* Blood info */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                <BloodTypeBadge type={selected.blood_type} className="text-lg px-3 py-1" />
                <div>
                  <p className="font-semibold">{selected.units_needed} units needed</p>
                  <StatusBadge status={selected.status} />
                </div>
              </div>
              {/* Patient */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/40 space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><User size={11} /> Patient</p>
                  <p className="text-sm font-medium">{selected.patient_name}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 size={11} /> Hospital</p>
                  <p className="text-sm font-medium">{selected.hospital_name}</p>
                </div>
              </div>
              {/* Requester */}
              {selected.requester && (
                <div className="p-3 rounded-xl bg-muted/40 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Requested by</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {selected.requester.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{selected.requester.full_name}</p>
                      <p className="text-xs text-muted-foreground">{selected.requester.email}</p>
                    </div>
                  </div>
                  {selected.requester.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone size={11} /> {selected.requester.phone}
                    </p>
                  )}
                </div>
              )}
              {/* Reason */}
              {selected.reason && (
                <div className="p-3 rounded-xl bg-muted/40 space-y-1">
                  <p className="text-xs text-muted-foreground">Reason</p>
                  <p className="text-sm">{selected.reason}</p>
                </div>
              )}
              {/* Admin notes */}
              {selected.notes && (
                <div className="p-3 rounded-xl bg-muted/40 space-y-1">
                  <p className="text-xs text-muted-foreground">Admin Notes</p>
                  <p className="text-sm">{selected.notes}</p>
                </div>
              )}
              {/* Center */}
              {selected.center && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 space-y-1">
                  <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                    <Building2 size={11} /> Assigned Center
                  </p>
                  <p className="text-sm font-medium text-blue-700">{selected.center.name} — {selected.center.city}</p>
                </div>
              )}
              {/* Action buttons in detail */}
              {selected.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                    onClick={() => { setShowDetail(false); openAction(selected, 'approve') }}
                  >
                    <CheckCircle2 size={14} /> Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={() => { setShowDetail(false); openAction(selected, 'reject') }}
                  >
                    <XCircle size={14} /> Reject
                  </Button>
                </div>
              )}
              {selected.status === 'approved' && (
                <Button
                  className="w-full gap-2"
                  onClick={() => { setShowDetail(false); openAction(selected, 'fulfill') }}
                >
                  <Droplets size={14} /> Mark as Fulfilled
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── APPROVE DIALOG ── */}
      <Dialog open={showApprove} onOpenChange={setShowApprove}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 size={18} /> Approve Request
            </DialogTitle>
            <DialogDescription>
              Approving {selected?.blood_type} blood request ({selected?.units_needed} units) for {selected?.patient_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Assign to Center (optional)</Label>
              <Select
                value={selectedCenter}
                onValueChange={setSelectedCenter}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a center" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific center</SelectItem>
                  {centers.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes for requester (optional)</Label>
              <Textarea
                placeholder="e.g. Please visit the center between 9am–4pm with your ID..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprove(false)} disabled={isPending}>Cancel</Button>
            <Button
              onClick={handleApprove}
              disabled={isPending}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Approve Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── REJECT DIALOG ── */}
      <Dialog open={showReject} onOpenChange={setShowReject}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle size={18} /> Reject Request
            </DialogTitle>
            <DialogDescription>
              Rejecting {selected?.blood_type} blood request for {selected?.patient_name}.
              The requester will be notified with your reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Reason for rejection <span className="text-destructive">*</span></Label>
            <Textarea
              placeholder="e.g. Insufficient stock at all centers. Please try again in 3 days..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReject(false)} disabled={isPending}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isPending}
              className="gap-2"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── FULFILL DIALOG ── */}
      <Dialog open={showFulfill} onOpenChange={setShowFulfill}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-700">
              <Droplets size={18} /> Mark as Fulfilled
            </DialogTitle>
            <DialogDescription>
              This will deduct {selected?.units_needed} units of {selected?.blood_type} from inventory
              {selected?.center ? ` at ${selected.center.name}` : ''}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-700">
              <strong>Note:</strong> Inventory will be automatically updated when you confirm fulfillment.
            </div>
            <div className="space-y-2">
              <Label>Fulfillment notes (optional)</Label>
              <Textarea
                placeholder="e.g. Blood collected at KNH on 25 Jan 2025..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFulfill(false)} disabled={isPending}>Cancel</Button>
            <Button
              onClick={handleFulfill}
              disabled={isPending}
              className="gap-2"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Confirm Fulfillment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}