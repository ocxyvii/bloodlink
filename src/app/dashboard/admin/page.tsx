import { createClient } from '@/lib/supabase/server'
import { getAdminCenter } from '@/lib/get-admin-center'
import { Droplets, ClipboardList, Users, CalendarPlus, AlertTriangle, Building2 } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BloodTypeBadge } from '@/components/ui/blood-type-badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Badge } from '@/components/ui/badge'

export default async function AdminOverview() {
  const supabase = await createClient()
  const center = await getAdminCenter()

  // Build queries scoped to center if assigned
  const inventoryQuery = supabase
    .from('blood_inventory')
    .select('*')
    .order('units_available')

  const requestsQuery = supabase
    .from('blood_requests')
    .select('*, requester:profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(6)

  const donationsQuery = supabase
    .from('donations')
    .select('*', { count: 'exact', head: true })

  const pendingQuery = supabase
    .from('blood_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Apply center filter if admin has assigned center
  if (center) {
    inventoryQuery.eq('center_id', center.id)
    requestsQuery.eq('center_id', center.id)
    donationsQuery.eq('center_id', center.id)
    pendingQuery.eq('center_id', center.id)
  }

  const [
    { count: pendingRequests },
    { count: totalDonations },
    { data: inventory },
    { data: recentRequests },
    { count: totalDonors },
  ] = await Promise.all([
    pendingQuery,
    donationsQuery,
    inventoryQuery,
    requestsQuery,
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_donor', true),
  ])

  const lowStock = (inventory ?? []).filter(i => i.units_available < 15)

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        {center ? (
          <div className="flex items-center gap-2 mt-1">
            <Building2 size={14} className="text-primary" />
            <span className="text-muted-foreground text-sm">
              Showing data for <strong className="text-foreground">{center.name}</strong> — {center.city}
            </span>
          </div>
        ) : (
          <p className="text-muted-foreground mt-1 text-sm">
            No center assigned — contact Super Admin
          </p>
        )}
      </div>

      {/* No center warning */}
      {!center && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-50 border border-yellow-200">
          <AlertTriangle size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-700">No Blood Center Assigned</p>
            <p className="text-sm text-yellow-600 mt-0.5">
              You are not assigned to any blood center yet. Contact the Super Admin to get assigned.
              You currently have limited data visibility.
            </p>
          </div>
        </div>
      )}

      {lowStock.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-50 border border-yellow-200">
          <AlertTriangle size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-700">
              {lowStock.length} blood type(s) running low
              {center ? ` at ${center.name}` : ''}
            </p>
            <p className="text-sm text-yellow-600 mt-0.5">
              {lowStock.map(i => i.blood_type).join(', ')} — consider scheduling donation drives.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Pending Requests" value={pendingRequests ?? 0} icon={ClipboardList} color="orange" subtitle={center ? `At ${center.name}` : 'All centers'} />
        <StatCard title="Registered Donors" value={totalDonors ?? 0}   icon={Users}         color="blue"   subtitle="Platform-wide" />
        <StatCard title="Total Donations"   value={totalDonations ?? 0} icon={CalendarPlus}  color="green"  subtitle={center ? `At ${center.name}` : 'All centers'} />
        <StatCard title="Low Stock Alerts"  value={lowStock.length}     icon={Droplets}      color="red"    subtitle="Under 15 units" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Droplets size={16} className="text-primary" />
              Inventory Levels
              {center && <Badge variant="outline" className="text-xs ml-auto">{center.name}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(inventory ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {center ? 'No inventory data for your center' : 'No center assigned'}
              </p>
            ) : (
              (inventory ?? []).slice(0, 8).map((item) => {
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
              })
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ClipboardList size={16} className="text-primary" />
              Recent Requests
              {center && <Badge variant="outline" className="text-xs ml-auto">{center.name}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(recentRequests ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {center ? 'No requests for your center yet' : 'No center assigned'}
              </p>
            ) : (
              recentRequests?.map((req) => (
                <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <BloodTypeBadge type={req.blood_type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{req.patient_name}</p>
                    <p className="text-xs text-muted-foreground">{req.units_needed} units · {req.urgency}</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}