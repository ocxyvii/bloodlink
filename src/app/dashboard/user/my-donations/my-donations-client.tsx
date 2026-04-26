'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Heart, Plus, Calendar, Building2,
  CheckCircle2, XCircle, Clock, Loader2,
  Droplets, Award
} from 'lucide-react'
import { scheduleDonation, cancelDonation } from '@/app/actions/donation-actions'
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
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { BloodTypeBadge } from '@/components/ui/blood-type-badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { format } from 'date-fns'

interface Donation {
  id: string
  center_id: string
  blood_type: string
  units_donated: number
  donation_date: string
  status: string
  notes: string | null
  created_at: string
  center?: { id: string; name: string; city: string; address: string; phone: string } | null
}

interface Center {
  id: string
  name: string
  city: string
  address: string
  phone: string
  operating_hours: string | null
}

export function MyDonationsClient({
  donations,
  centers,
}: {
  donations: Donation[]
  centers: Center[]
}) {
  const [isPending, startTransition] = useTransition()
  const [showSchedule, setShowSchedule] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [selected, setSelected] = useState<Donation | null>(null)
  const [form, setForm] = useState({ center_id: '', donation_date: '', notes: '' })

  const completed  = donations.filter(d => d.status === 'completed').length
  const scheduled  = donations.filter(d => d.status === 'scheduled').length
  const totalUnits = donations.filter(d => d.status === 'completed').reduce((s, d) => s + d.units_donated, 0)

  const handleSchedule = () => {
    if (!form.center_id || !form.donation_date) {
      toast.error('Please select a center and date')
      return
    }
    const date = new Date(form.donation_date)
    if (date < new Date()) {
      toast.error('Please select a future date')
      return
    }
    startTransition(async () => {
      const result = await scheduleDonation({
        center_id: form.center_id,
        donation_date: form.donation_date,
        notes: form.notes || undefined,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Donation scheduled! Thank you for saving lives 💉')
        setShowSchedule(false)
        setForm({ center_id: '', donation_date: '', notes: '' })
      }
    })
  }

  const handleCancel = () => {
    if (!selected) return
    startTransition(async () => {
      const result = await cancelDonation(selected.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Donation cancelled')
        setShowCancel(false)
        setSelected(null)
      }
    })
  }

  // Minimum date — tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Heart size={24} className="text-primary" />
            My Donations
          </h1>
          <p className="text-muted-foreground mt-1">
            {completed} completed · {scheduled} upcoming · {totalUnits} units donated
          </p>
        </div>
        <Button onClick={() => setShowSchedule(true)} className="gap-2">
          <Plus size={15} /> Schedule Donation
        </Button>
      </div>

      {/* Impact Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Times Donated', value: completed, icon: <Heart size={16} />,   color: 'bg-red-50 text-red-700 border-red-100' },
          { label: 'Units Given',   value: totalUnits, icon: <Droplets size={16} />, color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Lives Helped',  value: completed * 3, icon: <Award size={16} />,  color: 'bg-green-50 text-green-700 border-green-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <div className="flex items-center justify-between mb-1">{s.icon}</div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming donations alert */}
      {scheduled > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
          <Calendar size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-700">
              You have {scheduled} upcoming donation{scheduled > 1 ? 's' : ''} scheduled
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              Please arrive 15 minutes early and bring your ID.
            </p>
          </div>
        </div>
      )}

      {/* Donations list */}
      {donations.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border text-muted-foreground">
          <Heart size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">No donations yet</p>
          <p className="text-sm mt-1 mb-4">Schedule your first donation and help save lives</p>
          <Button onClick={() => setShowSchedule(true)} size="sm">
            Schedule Donation
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {donations.map(d => (
            <div
              key={d.id}
              className={`bg-card rounded-2xl border p-4 flex items-center gap-4 ${
                d.status === 'completed' ? 'border-green-100' : ''
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                d.status === 'completed' ? 'bg-green-100' :
                d.status === 'scheduled' ? 'bg-blue-100' : 'bg-muted'
              }`}>
                {d.status === 'completed'
                  ? <CheckCircle2 size={18} className="text-green-600" />
                  : d.status === 'scheduled'
                  ? <Clock size={18} className="text-blue-600" />
                  : <XCircle size={18} className="text-muted-foreground" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{d.center?.name ?? '—'}</p>
                  <BloodTypeBadge type={d.blood_type} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(d.donation_date), 'dd MMM yyyy')} · {d.units_donated} unit(s)
                  {d.center?.city ? ` · ${d.center.city}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={d.status} />
                {d.status === 'scheduled' && (
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => { setSelected(d); setShowCancel(true) }}
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

      {/* Schedule Dialog */}
      <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart size={18} className="text-primary" /> Schedule a Donation
            </DialogTitle>
            <DialogDescription>
              Choose a center and date. Your blood type will be used automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Blood Center <span className="text-destructive">*</span></Label>
              <Select onValueChange={v => setForm(p => ({ ...p, center_id: v }))}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select center" />
                </SelectTrigger>
                <SelectContent>
                  {centers.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <div>
                        <p>{c.name} — {c.city}</p>
                        {c.operating_hours && (
                          <p className="text-xs text-muted-foreground">{c.operating_hours}</p>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Preferred Date <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                min={minDate}
                value={form.donation_date}
                onChange={e => setForm(p => ({ ...p, donation_date: e.target.value }))}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Any notes or special requests..."
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700 space-y-1">
              <p className="font-semibold">Before you donate:</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li>Eat a healthy meal before donating</li>
                <li>Drink plenty of water</li>
                <li>Bring a valid ID</li>
                <li>Get adequate sleep the night before</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSchedule(false)} disabled={isPending}>Cancel</Button>
            <Button onClick={handleSchedule} disabled={isPending} className="gap-2">
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Schedule Donation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirm */}
      <AlertDialog open={showCancel} onOpenChange={setShowCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Donation</AlertDialogTitle>
            <AlertDialogDescription>
              Cancel your donation at {selected?.center?.name} on{' '}
              {selected && format(new Date(selected.donation_date), 'dd MMM yyyy')}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Keep It</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Cancel Donation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}