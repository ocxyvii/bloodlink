'use client'

import { useState } from 'react'
import { BarChart3, Download, FileText, Droplets, Heart, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BloodTypeBadge } from '@/components/ui/blood-type-badge'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'

interface ReportsClientProps {
  requests:  any[]
  donations: any[]
  inventory: any[]
  centers:   any[]
}

export function ReportsClient({ requests, donations, inventory, centers }: ReportsClientProps) {

  const downloadCSV = (data: any[], filename: string, columns: string[]) => {
    const header = columns.join(',')
    const rows = data.map(row =>
      columns.map(col => {
        const val = col.split('.').reduce((o: any, k: string) => o?.[k], row)
        return `"${String(val ?? '').replace(/"/g, '""')}"`
      }).join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalUnits = inventory.reduce((s: number, i: any) => s + i.units_available, 0)
  const completedDonations = donations.filter((d: any) => d.status === 'completed')
  const fulfilledRequests  = requests.filter((r: any) => r.status === 'fulfilled')

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 size={24} className="text-primary" />
            Reports
          </h1>
          <p className="text-muted-foreground mt-1">Export and review system data</p>
        </div>
      </div>

      {/* Quick Export Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: 'Blood Requests Report',
            desc: `${requests.length} total requests`,
            icon: <ClipboardList size={20} className="text-orange-600" />,
            color: 'bg-orange-50 border-orange-100',
            action: () => downloadCSV(requests, 'blood-requests', [
              'id', 'patient_name', 'blood_type', 'units_needed',
              'urgency', 'status', 'hospital_name', 'requester.full_name',
              'requester.email', 'created_at'
            ]),
          },
          {
            title: 'Donations Report',
            desc: `${completedDonations.length} completed donations`,
            icon: <Heart size={20} className="text-red-600" />,
            color: 'bg-red-50 border-red-100',
            action: () => downloadCSV(donations, 'donations', [
              'id', 'donor.full_name', 'donor.email', 'blood_type',
              'units_donated', 'status', 'center.name', 'center.city', 'donation_date'
            ]),
          },
          {
            title: 'Inventory Report',
            desc: `${totalUnits} total units across ${centers.length} centers`,
            icon: <Droplets size={20} className="text-blue-600" />,
            color: 'bg-blue-50 border-blue-100',
            action: () => downloadCSV(inventory, 'blood-inventory', [
              'blood_type', 'units_available', 'units_reserved',
              'center.name', 'center.city', 'expiry_date', 'last_updated'
            ]),
          },
        ].map(item => (
          <Card key={item.title} className={`rounded-2xl border ${item.color} cursor-pointer hover:shadow-md transition-all`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="gap-1 h-8 text-xs" onClick={item.action}>
                  <Download size={12} /> CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Preview Tabs */}
      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Requests ({requests.length})</TabsTrigger>
          <TabsTrigger value="donations">Donations ({donations.length})</TabsTrigger>
          <TabsTrigger value="inventory">Inventory ({inventory.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4">
          <div className="bg-card rounded-2xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-semibold">Patient</TableHead>
                  <TableHead className="font-semibold">Blood</TableHead>
                  <TableHead className="font-semibold">Units</TableHead>
                  <TableHead className="font-semibold">Hospital</TableHead>
                  <TableHead className="font-semibold">Requester</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.slice(0, 50).map((r: any) => (
                  <TableRow key={r.id} className="hover:bg-muted/30">
                    <TableCell className="text-sm font-medium">{r.patient_name}</TableCell>
                    <TableCell><BloodTypeBadge type={r.blood_type} /></TableCell>
                    <TableCell className="text-sm">{r.units_needed}</TableCell>
                    <TableCell className="text-sm max-w-[140px] truncate">{r.hospital_name}</TableCell>
                    <TableCell>
                      <p className="text-sm">{r.requester?.full_name ?? '—'}</p>
                    </TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(r.created_at), 'dd MMM yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="donations" className="mt-4">
          <div className="bg-card rounded-2xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-semibold">Donor</TableHead>
                  <TableHead className="font-semibold">Blood</TableHead>
                  <TableHead className="font-semibold">Units</TableHead>
                  <TableHead className="font-semibold">Center</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations.slice(0, 50).map((d: any) => (
                  <TableRow key={d.id} className="hover:bg-muted/30">
                    <TableCell>
                      <p className="text-sm font-medium">{d.donor?.full_name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{d.donor?.email ?? ''}</p>
                    </TableCell>
                    <TableCell><BloodTypeBadge type={d.blood_type} /></TableCell>
                    <TableCell className="text-sm">{d.units_donated}</TableCell>
                    <TableCell>
                      <p className="text-sm">{d.center?.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{d.center?.city ?? ''}</p>
                    </TableCell>
                    <TableCell><StatusBadge status={d.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(d.donation_date), 'dd MMM yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-4">
          <div className="bg-card rounded-2xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-semibold">Blood Type</TableHead>
                  <TableHead className="font-semibold">Center</TableHead>
                  <TableHead className="font-semibold">Available</TableHead>
                  <TableHead className="font-semibold">Reserved</TableHead>
                  <TableHead className="font-semibold">Expiry</TableHead>
                  <TableHead className="font-semibold">Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((i: any) => (
                  <TableRow key={i.id} className="hover:bg-muted/30">
                    <TableCell><BloodTypeBadge type={i.blood_type} /></TableCell>
                    <TableCell>
                      <p className="text-sm">{i.center?.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{i.center?.city ?? ''}</p>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-bold ${i.units_available === 0 ? 'text-red-600' : i.units_available < 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {i.units_available}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{i.units_reserved}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {i.expiry_date ? format(new Date(i.expiry_date), 'dd MMM yyyy') : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(i.last_updated), 'dd MMM yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}