'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie,
  Cell, LineChart, Line, Legend
} from 'recharts'
import {
  TrendingUp, Users, Droplets,
  ClipboardList, Heart, Building2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
const COLORS = ['#e11d48', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']

interface AnalyticsClientProps {
  requests:  { status: string; urgency: string; blood_type: string; created_at: string; units_needed: number }[]
  donations: { status: string; blood_type: string; created_at: string; units_donated: number }[]
  inventory: { blood_type: string; units_available: number; center_id: string }[]
  users:     { role: string; created_at: string; is_donor: boolean }[]
  centers:   { id: string; name: string; is_active: boolean }[]
}

export function AnalyticsClient({ requests, donations, inventory, users, centers }: AnalyticsClientProps) {

  // ── Summary stats ──
  const totalUsers     = users.filter(u => u.role === 'user').length
  const totalDonors    = users.filter(u => u.is_donor).length
  const totalRequests  = requests.length
  const fulfilledReqs  = requests.filter(r => r.status === 'fulfilled').length
  const totalDonations = donations.filter(d => d.status === 'completed').length
  const totalUnits     = inventory.reduce((s, i) => s + i.units_available, 0)
  const fulfillmentRate = totalRequests > 0 ? Math.round((fulfilledReqs / totalRequests) * 100) : 0

  // ── Blood type inventory chart ──
  const inventoryData = BLOOD_TYPES.map(bt => ({
    type: bt,
    units: inventory.filter(i => i.blood_type === bt).reduce((s, i) => s + i.units_available, 0),
  }))

  // ── Request status pie ──
  const statusCounts = ['pending', 'approved', 'fulfilled', 'rejected', 'cancelled'].map(s => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: requests.filter(r => r.status === s).length,
  })).filter(s => s.value > 0)

  // ── Monthly requests (last 6 months) ──
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const month = d.toLocaleString('default', { month: 'short' })
    const year  = d.getFullYear()
    const m     = d.getMonth()
    const y     = d.getFullYear()
    return {
      month,
      requests:  requests.filter(r => { const d = new Date(r.created_at); return d.getMonth() === m && d.getFullYear() === y }).length,
      donations: donations.filter(d => { const dt = new Date(d.created_at); return dt.getMonth() === m && dt.getFullYear() === y }).length,
    }
  })

  // ── Blood type requests ──
  const requestsByType = BLOOD_TYPES.map(bt => ({
    type: bt,
    count: requests.filter(r => r.blood_type === bt).length,
    units: requests.filter(r => r.blood_type === bt).reduce((s, r) => s + r.units_needed, 0),
  })).filter(d => d.count > 0)

  // ── Urgency breakdown ──
  const urgencyData = ['normal', 'urgent', 'emergency'].map(u => ({
    name: u.charAt(0).toUpperCase() + u.slice(1),
    value: requests.filter(r => r.urgency === u).length,
  }))

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <TrendingUp size={24} className="text-primary" />
          Analytics
        </h1>
        <p className="text-muted-foreground mt-1">System-wide performance overview</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total Users"      value={totalUsers}      icon={Users}         color="blue"   />
        <StatCard title="Donors"           value={totalDonors}     icon={Heart}         color="red"    />
        <StatCard title="Total Requests"   value={totalRequests}   icon={ClipboardList} color="orange" />
        <StatCard title="Donations Done"   value={totalDonations}  icon={Heart}         color="green"  />
        <StatCard title="Units in Stock"   value={totalUnits}      icon={Droplets}      color="purple" />
        <StatCard title="Fulfillment Rate" value={`${fulfillmentRate}%`} icon={TrendingUp} color="green" />
      </div>

      {/* Monthly Trend */}
      <Card className="rounded-2xl border">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp size={15} className="text-primary" />
            Requests vs Donations — Last 6 Months
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="requests"  stroke="#e11d48" strokeWidth={2} dot={{ r: 4 }} name="Requests" />
              <Line type="monotone" dataKey="donations" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="Donations" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory by blood type */}
        <Card className="rounded-2xl border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Droplets size={15} className="text-primary" />
              Inventory by Blood Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={inventoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="units" name="Units" radius={[4, 4, 0, 0]}>
                  {inventoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Request status pie */}
        <Card className="rounded-2xl border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ClipboardList size={15} className="text-primary" />
              Request Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusCounts}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusCounts.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Requests by blood type */}
        <Card className="rounded-2xl border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Droplets size={15} className="text-primary" />
              Requests by Blood Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={requestsByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Requests" fill="#e11d48" radius={[4, 4, 0, 0]} />
                <Bar dataKey="units"  name="Units"    fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Urgency breakdown */}
        <Card className="rounded-2xl border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ClipboardList size={15} className="text-primary" />
              Request Urgency Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={urgencyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#f97316" />
                  <Cell fill="#e11d48" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}