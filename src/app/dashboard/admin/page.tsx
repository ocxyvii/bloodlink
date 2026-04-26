import { createClient } from '@/lib/supabase/server'
import { Droplets, ClipboardList, Users, CalendarPlus, AlertTriangle } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BloodTypeBadge } from '@/components/ui/blood-type-badge'
import { StatusBadge } from '@/components/ui/status-badge'

export default async function AdminOverview() {
  const supabase = await createClient()

  const [
    { count: pendingRequests },
    { count: totalDonors },
    { count: totalDonations },
    { data: inventory },
    { data: recentRequests },
  ] = await Promise.all([
    supabase.from('blood_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_donor', true),
    supabase.from('donations').select('*', { count: 'exact', head: true }),
    supabase.from('blood_inventory').select('*').order('units_available'),
    supabase.from('blood_requests')
      .select('*, requester:profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const lowStock = (inventory ?? []).filter(i => i.units_available < 15)

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage blood inventory and requests</p>
      </div>

      {lowStock.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-50 border border-yellow-200">
          <AlertTriangle size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-700">{lowStock.length} blood type(s) running low</p>
            <p className="text-sm text-yellow-600 mt-0.5">
              {lowStock.map(i => i.blood_type).join(', ')} — consider scheduling donation drives.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Pending Requests" value={pendingRequests ?? 0} icon={ClipboardList} color="orange" subtitle="Awaiting approval" />
        <StatCard title="Registered Donors" value={totalDonors ?? 0}   icon={Users}         color="blue"   subtitle="Active donors" />
        <StatCard title="Total Donations"   value={totalDonations ?? 0} icon={CalendarPlus}  color="green"  subtitle="All time" />
        <StatCard title="Low Stock Alerts"  value={lowStock.length}     icon={Droplets}      color="red"    subtitle="Under 15 units" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Droplets size={16} className="text-primary" />
              Inventory Levels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(inventory ?? []).slice(0, 8).map((item) => {
              const pct = Math.min((item.units_available / 80) * 100, 100)
              const color = item.units_available < 10 ? 'bg-red-500' : item.units_available < 20 ? 'bg-yellow-500' : 'bg-green-500'
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <BloodTypeBadge type={item.blood_type} className="w-10 justify-center" />
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-medium w-16 text-right">{item.units_available} units</span>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ClipboardList size={16} className="text-primary" />
              Recent Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentRequests?.map((req) => (
              <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <BloodTypeBadge type={req.blood_type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{req.patient_name}</p>
                  <p className="text-xs text-muted-foreground">{req.units_needed} units · {req.urgency}</p>
                </div>
                <StatusBadge status={req.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}