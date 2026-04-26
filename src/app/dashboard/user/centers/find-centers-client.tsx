'use client'

import { useState } from 'react'
import {
  MapPin, Phone, Mail, Clock,
  Search, Droplets, Building2,
  CheckCircle2, XCircle, Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { BloodTypeBadge } from '@/components/ui/blood-type-badge'
import { Badge } from '@/components/ui/badge'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

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
}

interface InventoryItem {
  center_id: string
  blood_type: string
  units_available: number
}

export function FindCentersClient({
  centers,
  inventory,
}: {
  centers: Center[]
  inventory: InventoryItem[]
}) {
  const [search, setSearch]         = useState('')
  const [filterCity, setFilterCity] = useState('all')
  const [filterBlood, setFilterBlood] = useState('all')
  const [selected, setSelected]     = useState<Center | null>(null)

  const cities = Array.from(new Set(centers.map(c => c.city))).sort()

  const getStock = (centerId: string, bloodType: string) =>
    inventory.find(i => i.center_id === centerId && i.blood_type === bloodType)?.units_available ?? 0

  const getTotalUnits = (centerId: string) =>
    inventory.filter(i => i.center_id === centerId).reduce((s, i) => s + i.units_available, 0)

  const hasBloodType = (centerId: string, bloodType: string) =>
    getStock(centerId, bloodType) > 0

  const filtered = centers.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase())
    const matchCity  = filterCity  === 'all' || c.city === filterCity
    const matchBlood = filterBlood === 'all' || hasBloodType(c.id, filterBlood)
    return matchSearch && matchCity && matchBlood
  })

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MapPin size={24} className="text-primary" />
          Find Blood Centers
        </h1>
        <p className="text-muted-foreground mt-1">
          {centers.length} active centers across Kenya
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search centers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Select value={filterCity} onValueChange={setFilterCity}>
          <SelectTrigger className="h-9 w-[140px]">
            <MapPin size={13} className="mr-1 text-muted-foreground" />
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {cities.map(city => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterBlood} onValueChange={setFilterBlood}>
          <SelectTrigger className="h-9 w-[150px]">
            <Droplets size={13} className="mr-1 text-muted-foreground" />
            <SelectValue placeholder="Blood Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Blood Type</SelectItem>
            {BLOOD_TYPES.map(bt => (
              <SelectItem key={bt} value={bt}>{bt} available</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">
          {filtered.length} center{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Centers grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-card rounded-2xl border">
          <Building2 size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">No centers found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(center => {
            const total = getTotalUnits(center.id)
            return (
              <div
                key={center.id}
                className="bg-card rounded-2xl border p-5 flex flex-col gap-4 hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelected(center)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm leading-tight">{center.name}</p>
                      <p className="text-xs text-muted-foreground">{center.city}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                    Open
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin size={11} /><span className="truncate">{center.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone size={11} /><span>{center.phone}</span>
                  </div>
                  {center.operating_hours && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock size={11} /><span>{center.operating_hours}</span>
                    </div>
                  )}
                </div>

                {/* Blood availability mini grid */}
                <div className="grid grid-cols-4 gap-1">
                  {BLOOD_TYPES.map(bt => {
                    const units = getStock(center.id, bt)
                    return (
                      <div key={bt} className={`flex flex-col items-center py-1.5 rounded-lg text-center border ${
                        units === 0
                          ? 'bg-red-50 border-red-100'
                          : units < 10
                          ? 'bg-yellow-50 border-yellow-100'
                          : 'bg-green-50 border-green-100'
                      }`}>
                        <span className="text-xs font-bold">{bt}</span>
                        <span className={`text-xs ${units === 0 ? 'text-red-500' : units < 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {units}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="flex items-center justify-between text-xs border-t pt-3">
                  <span className="text-muted-foreground">
                    <Droplets size={11} className="inline mr-1" />{total} total units
                  </span>
                  <Button size="sm" variant="outline" className="h-7 text-xs"
                    onClick={e => { e.stopPropagation(); setSelected(center) }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Center Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>{selected?.city}, {selected?.country}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                {[
                  { icon: <MapPin size={14} />,  label: 'Address',  value: `${selected.address}, ${selected.city}` },
                  { icon: <Phone size={14} />,   label: 'Phone',    value: selected.phone },
                  { icon: <Mail size={14} />,    label: 'Email',    value: selected.email ?? '—' },
                  { icon: <Clock size={14} />,   label: 'Hours',    value: selected.operating_hours ?? '—' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground">{item.icon}</span>
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold mb-3 flex items-center gap-1">
                  <Droplets size={14} className="text-primary" /> Blood Availability
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {BLOOD_TYPES.map(bt => {
                    const units = getStock(selected.id, bt)
                    return (
                      <div key={bt} className={`flex items-center justify-between p-3 rounded-xl border ${
                        units === 0
                          ? 'bg-red-50 border-red-200'
                          : units < 10
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-green-50 border-green-200'
                      }`}>
                        <div className="flex items-center gap-2">
                          {units > 0
                            ? <CheckCircle2 size={13} className="text-green-600" />
                            : <XCircle size={13} className="text-red-500" />
                          }
                          <BloodTypeBadge type={bt} />
                        </div>
                        <span className={`text-sm font-bold ${
                          units === 0 ? 'text-red-600' : units < 10 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {units} units
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
              {selected.latitude && selected.longitude && (
                <Button
                  className="w-full gap-2"
                  variant="outline"
                  onClick={() => window.open(
                    `https://maps.google.com/?q=${selected.latitude},${selected.longitude}`,
                    '_blank'
                  )}
                >
                  <MapPin size={14} /> Open in Google Maps
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}