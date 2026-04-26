'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Users, Search, RefreshCw, Eye,
  Power, PowerOff, Loader2,
  Heart, ClipboardList, MapPin, Phone
} from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { BloodTypeBadge } from '@/components/ui/blood-type-badge'
import { toggleAdminStatus } from '@/app/actions/admin-actions'
import { format, formatDistanceToNow } from 'date-fns'
import { Profile } from '@/types'

interface UsersClientProps {
  users: Profile[]
  requestCounts: { requester_id: string }[]
  donationCounts: { donor_id: string }[]
}

export function UsersClient({ users, requestCounts, donationCounts }: UsersClientProps) {
  const [isPending, startTransition] = useTransition()
  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDonor, setFilterDonor]   = useState('all')
  const [filterBlood, setFilterBlood]   = useState('all')
  const [selected, setSelected]         = useState<Profile | null>(null)

  const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

  const getUserRequests  = (id: string) => requestCounts.filter(r => r.requester_id === id).length
  const getUserDonations = (id: string) => donationCounts.filter(d => d.donor_id === id).length

  const filtered = users.filter(u => {
    const matchSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.location ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? u.is_active : !u.is_active)
    const matchDonor  = filterDonor  === 'all' || (filterDonor  === 'yes' ? u.is_donor : !u.is_donor)
    const matchBlood  = filterBlood  === 'all' || u.blood_type === filterBlood
    return matchSearch && matchStatus && matchDonor && matchBlood
  })

  const handleToggle = (user: Profile) => {
    startTransition(async () => {
      const result = await toggleAdminStatus(user.id, !user.is_active)
      if (result.error) toast.error(result.error)
      else toast.success(`User ${user.is_active ? 'deactivated' : 'activated'}`)
    })
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users size={24} className="text-primary" />
          All Users
        </h1>
        <p className="text-muted-foreground mt-1">
          {users.length} registered members · {users.filter(u => u.is_donor).length} donors
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',  value: users.length,                           color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Active',       value: users.filter(u => u.is_active).length,  color: 'bg-green-50 text-green-700 border-green-100' },
          { label: 'Donors',       value: users.filter(u => u.is_donor).length,   color: 'bg-red-50 text-red-700 border-red-100' },
          { label: 'With Blood Type', value: users.filter(u => u.blood_type).length, color: 'bg-purple-50 text-purple-700 border-purple-100' },
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
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-9 w-[120px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterDonor} onValueChange={setFilterDonor}>
          <SelectTrigger className="h-9 w-[120px]">
            <SelectValue placeholder="Donor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="yes">Donors</SelectItem>
            <SelectItem value="no">Non-donors</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterBlood} onValueChange={setFilterBlood}>
          <SelectTrigger className="h-9 w-[120px]">
            <SelectValue placeholder="Blood" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {BLOOD_TYPES.map(bt => (
              <SelectItem key={bt} value={bt}>{bt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || filterStatus !== 'all' || filterDonor !== 'all' || filterBlood !== 'all') && (
          <Button
            variant="ghost" size="sm"
            onClick={() => { setSearch(''); setFilterStatus('all'); setFilterDonor('all'); setFilterBlood('all') }}
            className="h-9 text-muted-foreground gap-1"
          >
            <RefreshCw size={13} /> Clear
          </Button>
        )}
        <span className="text-sm text-muted-foreground ml-auto">
          {filtered.length} of {users.length}
        </span>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-semibold">User</TableHead>
              <TableHead className="font-semibold">Blood Type</TableHead>
              <TableHead className="font-semibold">Location</TableHead>
              <TableHead className="font-semibold">Requests</TableHead>
              <TableHead className="font-semibold">Donations</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Joined</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  <Users size={32} className="mx-auto mb-2 opacity-20" />
                  <p>No users found</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(user => (
                <TableRow key={user.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                          {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.blood_type
                      ? <BloodTypeBadge type={user.blood_type} />
                      : <span className="text-xs text-muted-foreground">—</span>
                    }
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{user.location ?? '—'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{getUserRequests(user.id)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {user.is_donor && <Heart size={11} className="text-red-500 fill-red-500" />}
                      <span className="text-sm font-medium">{getUserDonations(user.id)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={user.is_active
                        ? 'bg-green-50 text-green-700 border-green-200 text-xs'
                        : 'bg-gray-100 text-gray-500 border-gray-200 text-xs'
                      }
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => setSelected(user)}
                      >
                        <Eye size={13} />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => handleToggle(user)}
                        disabled={isPending}
                      >
                        {user.is_active
                          ? <PowerOff size={13} className="text-red-500" />
                          : <Power size={13} className="text-green-600" />
                        }
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>Full details for this member</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {selected.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selected.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selected.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {selected.blood_type && <BloodTypeBadge type={selected.blood_type} />}
                    {selected.is_donor && (
                      <Badge className="bg-red-100 text-red-700 border-red-200 text-xs gap-1">
                        <Heart size={9} className="fill-red-600" /> Donor
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {[
                { icon: <Phone size={13} />,       label: 'Phone',    value: selected.phone ?? '—' },
                { icon: <MapPin size={13} />,      label: 'Location', value: selected.location ?? '—' },
                { icon: <ClipboardList size={13} />, label: 'Requests', value: getUserRequests(selected.id) },
                { icon: <Heart size={13} />,       label: 'Donations', value: getUserDonations(selected.id) },
                { icon: <Users size={13} />,       label: 'Joined',   value: format(new Date(selected.created_at), 'dd MMM yyyy') },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                  <span className="text-muted-foreground">{item.icon}</span>
                  <div className="flex items-center justify-between flex-1">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}