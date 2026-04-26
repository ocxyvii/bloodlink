'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Droplets, Loader2, AlertTriangle,
  Zap, Clock, Building2, CheckCircle2,
  ChevronRight, Info
} from 'lucide-react'
import { createBloodRequest } from '@/app/actions/request-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BloodTypeBadge } from '@/components/ui/blood-type-badge'
import { Badge } from '@/components/ui/badge'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

interface RequestBloodClientProps {
  centers: {
    id: string
    name: string
    city: string
    address: string
    phone: string
    operating_hours: string | null
  }[]
  inventory: {
    center_id: string
    blood_type: string
    units_available: number
  }[]
  userBloodType: string | null
  userName: string
}

export function RequestBloodClient({
  centers,
  inventory,
  userBloodType,
  userName,
}: RequestBloodClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    blood_type: userBloodType ?? '',
    units_needed: '1',
    urgency: 'normal',
    hospital_name: '',
    patient_name: '',
    reason: '',
    center_id: '',
  })

  const updateForm = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const getAvailableUnits = (bloodType: string, centerId?: string) => {
    if (!bloodType) return 0
    return inventory
      .filter(i =>
        i.blood_type === bloodType &&
        (centerId ? i.center_id === centerId : true)
      )
      .reduce((s, i) => s + i.units_available, 0)
  }

  const getCenterStock = (centerId: string, bloodType: string) =>
    inventory.find(i => i.center_id === centerId && i.blood_type === bloodType)?.units_available ?? 0

  const availableUnits = getAvailableUnits(form.blood_type)

  const handleSubmit = () => {
    if (!form.blood_type || !form.hospital_name || !form.patient_name) {
      toast.error('Please fill in all required fields')
      return
    }
    startTransition(async () => {
      const result = await createBloodRequest({
        blood_type: form.blood_type,
        units_needed: parseInt(form.units_needed),
        urgency: form.urgency,
        hospital_name: form.hospital_name,
        patient_name: form.patient_name,
        reason: form.reason || undefined,
        center_id: form.center_id || undefined,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Blood request submitted successfully!')
        router.push('/dashboard/user/my-requests')
      }
    })
  }

  const urgencyOptions = [
    {
      value: 'normal',
      label: 'Normal',
      desc: 'Within 24–48 hours',
      icon: <Clock size={16} />,
      color: 'border-blue-200 bg-blue-50 text-blue-700',
      active: 'border-blue-500 bg-blue-100',
    },
    {
      value: 'urgent',
      label: 'Urgent',
      desc: 'Within a few hours',
      icon: <AlertTriangle size={16} />,
      color: 'border-orange-200 bg-orange-50 text-orange-700',
      active: 'border-orange-500 bg-orange-100',
    },
    {
      value: 'emergency',
      label: 'Emergency',
      desc: 'Immediate — life-threatening',
      icon: <Zap size={16} />,
      color: 'border-red-200 bg-red-50 text-red-700',
      active: 'border-red-500 bg-red-100',
    },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Droplets size={24} className="text-primary" />
          Request Blood
        </h1>
        <p className="text-muted-foreground mt-1">
          Fill in the details below to submit a blood request
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[
          { n: 1, label: 'Blood Info' },
          { n: 2, label: 'Patient Info' },
          { n: 3, label: 'Confirm' },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all ${
              step > s.n
                ? 'bg-primary text-primary-foreground'
                : step === s.n
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}>
              {step > s.n ? <CheckCircle2 size={14} /> : s.n}
            </div>
            <span className={`text-sm hidden sm:block ${step >= s.n ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              {s.label}
            </span>
            {i < 2 && <ChevronRight size={14} className="text-muted-foreground mx-1" />}
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border p-6 space-y-6">

        {/* ── STEP 1: Blood Info ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Blood Type Required <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_TYPES.map(bt => {
                  const total = getAvailableUnits(bt)
                  const available = total > 0
                  return (
                    <button
                      key={bt}
                      type="button"
                      onClick={() => updateForm('blood_type', bt)}
                      className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                        form.blood_type === bt
                          ? 'border-primary bg-primary/10'
                          : available
                          ? 'border-border hover:border-primary/50 bg-background'
                          : 'border-border bg-muted/50 opacity-60'
                      }`}
                    >
                      <BloodTypeBadge type={bt} />
                      <span className={`text-xs mt-1 font-medium ${
                        total === 0 ? 'text-red-500' : total < 10 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {total > 0 ? `${total}u` : 'None'}
                      </span>
                    </button>
                  )
                })}
              </div>
              {form.blood_type && availableUnits === 0 && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                  <AlertTriangle size={15} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-600">
                    <strong>{form.blood_type}</strong> is currently out of stock across all centers.
                    Your request will still be submitted and processed as soon as stock is available.
                  </p>
                </div>
              )}
              {form.blood_type && availableUnits > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200">
                  <CheckCircle2 size={14} className="text-green-600" />
                  <p className="text-xs text-green-600">
                    <strong>{availableUnits} units</strong> of <strong>{form.blood_type}</strong> available across all centers
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Units Needed <span className="text-destructive">*</span></Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button" variant="outline" size="icon" className="h-10 w-10 rounded-xl flex-shrink-0"
                  onClick={() => updateForm('units_needed', String(Math.max(1, parseInt(form.units_needed) - 1)))}
                >−</Button>
                <Input
                  type="number" min="1" max="20"
                  value={form.units_needed}
                  onChange={e => updateForm('units_needed', e.target.value)}
                  className="h-10 text-center text-lg font-bold w-20 flex-shrink-0"
                />
                <Button
                  type="button" variant="outline" size="icon" className="h-10 w-10 rounded-xl flex-shrink-0"
                  onClick={() => updateForm('units_needed', String(Math.min(20, parseInt(form.units_needed) + 1)))}
                >+</Button>
                <span className="text-sm text-muted-foreground">units (1 unit ≈ 450ml)</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Urgency Level <span className="text-destructive">*</span></Label>
              <div className="space-y-2">
                {urgencyOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateForm('urgency', opt.value)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                      form.urgency === opt.value ? opt.active : 'border-border hover:border-border/80 bg-background'
                    }`}
                  >
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      form.urgency === opt.value ? opt.color : 'bg-muted text-muted-foreground'
                    }`}>
                      {opt.icon}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      form.urgency === opt.value ? 'border-primary bg-primary' : 'border-muted-foreground'
                    }`}>
                      {form.urgency === opt.value && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full h-11"
              onClick={() => {
                if (!form.blood_type) { toast.error('Please select a blood type'); return }
                setStep(2)
              }}
            >
              Continue <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        )}

        {/* ── STEP 2: Patient Info ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Patient Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Full name of the patient"
                value={form.patient_name}
                onChange={e => updateForm('patient_name', e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Hospital / Facility Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Kenyatta National Hospital"
                value={form.hospital_name}
                onChange={e => updateForm('hospital_name', e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Preferred Blood Center (optional)</Label>
              <Select
                value={form.center_id}
                onValueChange={v => updateForm('center_id', v)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select nearest center" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any available center</SelectItem>
                  {centers.map(c => {
                    const stock = form.blood_type ? getCenterStock(c.id, form.blood_type) : 0
                    return (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <span>{c.name} — {c.city}</span>
                          {form.blood_type && (
                            <Badge variant="outline" className={`text-xs ml-1 ${
                              stock === 0 ? 'text-red-600 border-red-200' : 'text-green-600 border-green-200'
                            }`}>
                              {stock}u
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason / Medical Condition (optional)</Label>
              <Textarea
                placeholder="e.g. Surgery, accident, sickle cell disease..."
                value={form.reason}
                onChange={e => updateForm('reason', e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-11" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                className="flex-1 h-11"
                onClick={() => {
                  if (!form.patient_name || !form.hospital_name) {
                    toast.error('Please fill in patient name and hospital')
                    return
                  }
                  setStep(3)
                }}
              >
                Continue <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Review & Submit ── */}
        {step === 3 && (
          <div className="space-y-5">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Review your request</p>

            {form.urgency === 'emergency' && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border-2 border-red-200">
                <Zap size={16} className="text-red-600 fill-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-700">Emergency Request</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Admins will be immediately notified and will prioritize your request.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {[
                { label: 'Blood Type',  value: <BloodTypeBadge type={form.blood_type} /> },
                { label: 'Units',       value: `${form.units_needed} unit${parseInt(form.units_needed) > 1 ? 's' : ''}` },
                { label: 'Urgency',     value: form.urgency.charAt(0).toUpperCase() + form.urgency.slice(1) },
                { label: 'Patient',     value: form.patient_name },
                { label: 'Hospital',    value: form.hospital_name },
                { label: 'Center',      value: centers.find(c => c.id === form.center_id)?.name ?? 'Any available' },
                { label: 'Reason',      value: form.reason || '—' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <Info size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-600">
                After submission, an admin will review and approve your request.
                You'll receive a notification when it's processed.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-11" onClick={() => setStep(2)} disabled={isPending}>
                Back
              </Button>
              <Button
                className="flex-1 h-11 gap-2"
                onClick={handleSubmit}
                disabled={isPending}
              >
                {isPending
                  ? <><Loader2 size={15} className="animate-spin" /> Submitting...</>
                  : <><Droplets size={15} /> Submit Request</>
                }
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}