'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { validateSomaliPhone } from '@/lib/phone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading]           = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep]                 = useState(1)
  const [phoneError, setPhoneError]     = useState<string | null>(null)
  const [phoneValid, setPhoneValid]     = useState(false)
  const [form, setForm] = useState({
    full_name: '', email: '', password: '',
    blood_type: '', phone: '', location: '',
    date_of_birth: '', is_donor: false,
  })

  const updateForm = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handlePhoneChange = (value: string) => {
    updateForm('phone', value)
    setPhoneError(null)
    setPhoneValid(false)
  }

  const handlePhoneBlur = () => {
    if (!form.phone.trim()) { setPhoneError(null); setPhoneValid(false); return }
    const { valid, error } = validateSomaliPhone(form.phone)
    if (!valid) { setPhoneError(error); setPhoneValid(false) }
    else { setPhoneError(null); setPhoneValid(true) }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (step === 1) { setStep(2); return }

    if (form.phone.trim()) {
      const { valid, error } = validateSomaliPhone(form.phone)
      if (!valid) { setPhoneError(error); toast.error(error ?? 'Invalid phone number'); return }
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.full_name, role: 'user' } },
      })

      if (error) { toast.error(error.message); return }

      if (data.user) {
        let normalizedPhone: string | null = null
        if (form.phone.trim()) {
          const { formatted } = validateSomaliPhone(form.phone)
          normalizedPhone = formatted
        }

        await supabase.from('profiles').update({
          blood_type:    form.blood_type    || null,
          phone:         normalizedPhone,
          location:      form.location      || null,
          date_of_birth: form.date_of_birth || null,
          is_donor:      form.is_donor,
        }).eq('id', data.user.id)

        if (data.session) {
          toast.success('Account created! Welcome to BloodLink.')
          router.push('/dashboard/user')
        } else {
          toast.success('Account created! Please check your email to confirm.')
          router.push('/login?message=check-email')
        }
      }
    } catch {
      toast.error('Connection failed. Please check your internet and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Create account</h2>
        <p className="text-muted-foreground">Join BloodLink and help save lives in Somalia</p>
      </div>

      <div className="flex items-center gap-3">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all ${
              step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {step > s ? <CheckCircle2 size={16} /> : s}
            </div>
            <span className={`text-sm ${step >= s ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              {s === 1 ? 'Account info' : 'Personal details'}
            </span>
            {s < 2 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleRegister} className="space-y-5">
        {step === 1 ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name" placeholder="John Kamau"
                value={form.full_name}
                onChange={e => updateForm('full_name', e.target.value)}
                required className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email" type="email" placeholder="you@example.com"
                value={form.email}
                onChange={e => updateForm('email', e.target.value)}
                required className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={e => updateForm('password', e.target.value)}
                  required minLength={8} className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Blood type</Label>
                <Select onValueChange={v => updateForm('blood_type', v)}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {BLOOD_TYPES.map(bt => (
                      <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of birth</Label>
                <Input
                  id="dob" type="date"
                  value={form.date_of_birth}
                  onChange={e => updateForm('date_of_birth', e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone number
                <span className="text-muted-foreground font-normal ml-1 text-xs">(optional)</span>
              </Label>
              <Input
                id="phone"
                placeholder="0612 345 678 or +252612345678"
                value={form.phone}
                onChange={e => handlePhoneChange(e.target.value)}
                onBlur={handlePhoneBlur}
                className={cn(
                  'h-11',
                  phoneError ? 'border-destructive focus-visible:ring-destructive' : '',
                  phoneValid && !phoneError ? 'border-green-500 focus-visible:ring-green-500' : '',
                )}
              />
              {phoneError && (
                <p className="text-xs text-destructive flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {phoneError}
                </p>
              )}
              {phoneValid && !phoneError && (
                <p className="text-xs text-green-600 flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Valid Somali number
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">City / Location</Label>
              <Input
                id="location" placeholder="Galkacyo"
                value={form.location}
                onChange={e => updateForm('location', e.target.value)}
                className="h-11"
              />
            </div>

            <div
              onClick={() => updateForm('is_donor', !form.is_donor)}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                form.is_donor ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                form.is_donor ? 'bg-primary' : 'bg-muted'
              }`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2C12 2 5 9.5 5 14a7 7 0 0 0 14 0c0-4.5-7-12-7-12z"
                    fill={form.is_donor ? 'white' : 'currentColor'}
                    className={form.is_donor ? '' : 'text-muted-foreground'}
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm">Register as a blood donor</p>
                <p className="text-xs text-muted-foreground">Help save lives by donating blood</p>
              </div>
              <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                form.is_donor ? 'border-primary bg-primary' : 'border-muted-foreground'
              }`}>
                {form.is_donor && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
          </>
        )}

        <div className="flex gap-3 pt-2">
          {step === 2 && (
            <Button
              type="button" variant="outline" className="flex-1 h-11"
              onClick={() => setStep(1)} disabled={loading}
            >
              Back
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1 h-11 text-base font-medium"
            disabled={loading || (step === 2 && !!phoneError)}
          >
            {loading ? (
              <><Loader2 size={16} className="mr-2 animate-spin" />Creating account...</>
            ) : step === 1 ? 'Continue' : 'Create account'}
          </Button>
        </div>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
      </p>
    </div>
  )
}