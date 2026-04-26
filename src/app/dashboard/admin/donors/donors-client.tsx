'use client'

import { useState } from 'react'
import { Users, Search, Heart, Eye, Phone, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BloodTypeBadge } from '@/components/ui/blood-type-badge'
import { format, formatDistanceToNow } from 'date-fns'
import { Profile } from '@/types'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

interface DonorsClientProps {
  donors: Profile[]
  donations: {
    donor_id: string
    status: string
    blood_type: string
    donation_date: string
  }[]
}

export function DonorsClient({ donors, donations }: DonorsClientProps) {
  const [search, setSearch]         = useState('')
  const [filterBlood, setFilterBlood] = useState('all')
  const [selected, setSelected]     = useState<Profile | null>(null)

  const getDonorCount = (id: string) => donations.filter(d => d.donor_id === id).length
  const getLastDonation = (id: string) => {
    const d = donations.filter(d => d.donor_id === id).sort((a, b) =>
      new Date(b.donation_date).getTime() - new Date(a.donation_date).getTime()
    )[0]
    return d ? d.donation_date : null
  }

  const filtered = donors.filter(d => {
    const matchSearch =
      d.full_name.toLowerCase().includes(search.toLowerCase()) ||
      d.email.toLowerCase().includes(search.toLowerCase()) ||
      (d.location ?? '').toLowerCase().includes(search.toLowerCase())
    const matchBlood = filterBlood === 'all' || d.blood_type === filterBlood
    return matchSearch && matchBlood
  })

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users size={24} className="text-primary" />
          Donors
        </h1>
        <p className="text-muted-foreground mt-1">
          {donors.length} registered donors
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {BLOOD_TYPES.map(bt => {
          const count = donors.filter(d => d.blood_type === bt).length
          return (
            <div key={bt} className="bg-card rounded-xl border p-4 flex items-center gap-3">
              <BloodTypeBadge type={bt} />
              <div>
                <p className="text-xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">donors</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search donors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Select value={filterBlood} onValueChange={setFilterBlood}>
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue placeholder="Blood Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {BLOOD_TYPES.map(bt => (
              <SelectItem key={bt} value={bt}>{bt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">
          {filtered.length} of {donors.length}
        </span>
      </div>

      {/* Donors Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border text-muted-foreground">
          <Users size={40} className="mx-auto mb-3 opacity-20" />
          <p>No donors found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(donor => {
            const count = getDonorCount(donor.id)
            const last  = getLastDonation(donor.id)
            return (
              <div key={donor.id} className="bg-card rounded-2xl border p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                        {donor.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{donor.full_name}</p>
                      <p className="text-xs text-muted-foreground">{donor.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => setSelected(donor)}
                  >
                    <Eye size={13} />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  {donor.blood_type
                    ? <BloodTypeBadge type={donor.blood_type} />
                    : <span className="text-xs text-muted-foreground">No blood type</span>
                  }
                  <Badge className="bg-red-50 text-red-700 border-red-200 text-xs gap-1">
                    <Heart size={9} className="fill-red-600" /> Donor
                  </Badge>
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {donor.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={11} /><span>{donor.phone}</span>
                    </div>
                  )}
                  {donor.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={11} /><span>{donor.location}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    <Heart size={11} className="inline mr-1 text-red-500 fill-red-500" />
                    {count} donation{count !== 1 ? 's' : ''}
                  </span>
                  {last && (
                    <span className="text-muted-foreground">
                      Last: {formatDistanceToNow(new Date(last), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Donor Profile</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {selected.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selected.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selected.email}</p>
                  {selected.blood_type && <BloodTypeBadge type={selected.blood_type} className="mt-1" />}
                </div>
              </div>
              {[
                { label: 'Phone',      value: selected.phone ?? '—' },
                { label: 'Location',   value: selected.location ?? '—' },
                { label: 'DOB',        value: selected.date_of_birth ? format(new Date(selected.date_of_birth), 'dd MMM yyyy') : '—' },
                { label: 'Donations',  value: getDonorCount(selected.id) },
                { label: 'Last Donated', value: getLastDonation(selected.id) ? formatDistanceToNow(new Date(getLastDonation(selected.id)!), { addSuffix: true }) : 'Never' },
                { label: 'Joined',     value: format(new Date(selected.created_at), 'dd MMM yyyy') },
              ].map(item => (
                <div key={item.label} className="flex justify-between p-3 rounded-xl bg-muted/40">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}