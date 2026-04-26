'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ClipboardList, Droplets, Zap, AlertTriangle, Clock, XCircle, Eye, Loader2 } from 'lucide-react'
import { cancelRequest } from '@/app/actions/request-actions'
import { Button } from '@/components/ui/button'
import { BloodTypeBadge } from '@/components/ui/blood-type-badge'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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
import { formatDistanceToNow, format } from 'date-fns'
import Link from 'next/link'

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
  center?: { name: string; city: string; phone: string } | null
}

export function MyRequestsClient({ requests }: { requests: Request[] }) {
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Request | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showCancel, setShowCancel] = useState(false)

  const handleCancel = () => {
    if (!selected) return
    startTransition(async () => {
      const result = await cancelRequest(selected.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Request cancelled')
        setShowCancel(false)
        setSelected(null)
      }
    })
  }

  const urgencyIcon = (urgency: string) => {
    if (urgency === 'emergency') return <Zap size={12} className="text-red-600 fill-red-600" />
    if (urgency === 'urgent')    return <AlertTriangle size={12} className="text-orange-600" />
    return <Clock size={12} className="text-blue-600" />
  }

  const pending   = requests.filter(r => r.status === 'pending').length
  const approved  = requests.filter(r => r.status === 'approved').length
  const fulfilled = requests.filter(r => r.status === 'fulfilled').length

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList size={24} className="text-primary" />
            My Requests
          </h1>
          <p className="text-muted-foreground mt-1">
            {requests.length} total · {pending} pending · {approved} approved
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard/user/request">
            <Droplets size={15} /> New Request
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending',   value: pending,   color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
          { label: 'Approved',  value: approved,  color: 'bg-green-50 text-green-700 border-green-100'   },
          { label: 'Fulfilled', value: fulfilled, color: 'bg-blue-50 text-blue-700 border-blue-100'      },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Requests list */}
      {requests.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-card rounded-2xl border">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">No requests yet</p>
          <p className="text-sm mt-1 mb-4">Submit your first blood request</p>
          <Button asChild size="sm">
            <Link href="/dashboard/user/request">Request Blood</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div
              key={req.id}
              className={`bg-card rounded-2xl border p-4 flex items-center gap-4 hover:shadow-sm transition-all ${
                req.urgency === 'emergency' && req.status === 'pending'
                  ? 'border-red-200 bg-red-50/30'
                  : ''
              }`}
            >
              <BloodTypeBadge type={req.blood_type} className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold">{req.patient_name}</p>
                  {urgencyIcon(req.urgency)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {req.hospital_name} · {req.units_needed} units ·{' '}
                  {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                </p>
                {req.notes && (
                  <p className="text-xs text-muted-foreground mt-0.5 italic">"{req.notes}"</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={req.status} />
                <Button
                  variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => { setSelected(req); setShowDetail(true) }}
                >
                  <Eye size={13} />
                </Button>
                {(req.status === 'pending') && (
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => { setSelected(req); setShowCancel(true) }}
                    disabled={isPending}
                  >
                    <XCircle size={13} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              Submitted {selected && format(new Date(selected.created_at), 'dd MMM yyyy, HH:mm')}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <BloodTypeBadge type={selected.blood_type} />
                <div>
                  <p className="text-sm font-semibold">{selected.units_needed} units</p>
                  <StatusBadge status={selected.status} />
                </div>
              </div>
              {[
                { label: 'Patient',  value: selected.patient_name },
                { label: 'Hospital', value: selected.hospital_name },
                { label: 'Urgency',  value: selected.urgency.charAt(0).toUpperCase() + selected.urgency.slice(1) },
                { label: 'Center',   value: selected.center ? `${selected.center.name}, ${selected.center.city}` : '—' },
                { label: 'Reason',   value: selected.reason ?? '—' },
                { label: 'Notes',    value: selected.notes ?? '—' },
              ].map(item => (
                <div key={item.label} className="flex justify-between p-3 rounded-xl bg-muted/40">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium text-right max-w-[200px]">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirm */}
      <AlertDialog open={showCancel} onOpenChange={setShowCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Request</AlertDialogTitle>
            <AlertDialogDescription>
              Cancel the {selected?.blood_type} blood request for {selected?.patient_name}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Keep Request</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Cancel Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}