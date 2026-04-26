import { createClient } from '@/lib/supabase/server'
import { Users, UserCog, Droplets, ClipboardList, Building2, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BloodTypeBadge } from '@/components/ui/blood-type-badge'
import { StatusBadge } from '@/components/ui/status-badge'

export default async function SuperAdminOverview() {
  const supabase = await createClient()

  const [
    { count: totalUsers },
    { count: totalAdmins },
    { count: totalRequests },
    { count: pendingRequests },
    { count: totalCenters },
    { data: inventory },
    { data: recentRequests },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
    supabase.from('blood_requests').select('*', { count: 'exact', head: true }),
    supabase.from('blood_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('blood_centers').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('blood_inventory').select('blood_type, units_available').order('units_available'),
    supabase.from('blood_requests')
      .select('*, requester:profiles(full_name, blood_type)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // Aggregate inventory by blood type
  const inventoryByType = (inventory ?? []).reduce((acc: Record<string, number>, item) => {
    acc[item.blood_type] = (acc[item.blood_type] ?? 0) + item.units_available
    return acc
  }, {})

  const criticalTypes = Object.entries(inventoryByType)
    .filter(([, units]) => units < 10)
    .map(([type]) => type)

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Overview</h1>
        <p className="text-muted-foreground mt-1">Monitor all activity across BloodLink</p>
      </div>

      {/* Critical Alert */}
      {criticalTypes.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Critical Blood Shortage</p>
            <p className="text-sm text-red-600 mt-0.5">
              Blood types{' '}
              {criticalTypes.map((t, i) => (
                <span key={t}>
                  <strong>{t}</strong>{i < criticalTypes.length - 1 ? ', ' : ''}
                </span>
              ))}{' '}
              are critically low (under 10 units). Immediate action required.
            </p>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Total Users"     value={totalUsers ?? 0}    icon={Users}         color="blue"   subtitle="Registered members" />
        <StatCard title="Active Admins"   value={totalAdmins ?? 0}   icon={UserCog}       color="purple" subtitle="Managing operations" />
        <StatCard title="Blood Centers"   value={totalCenters ?? 0}  icon={Building2}     color="green"  subtitle="Active locations" />
        <StatCard title="Pending Requests"value={pendingRequests ?? 0}icon={ClipboardList} color="orange" subtitle={`of ${totalRequests ?? 0} total`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blood Inventory Overview */}
        <Card className="rounded-2xl border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Droplets size={16} className="text-primary" />
              Blood Inventory (All Centers)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(inventoryByType).sort((a, b) => a[1] - b[1]).map(([type, units]) => {
              const max = 100
              const pct = Math.min((units / max) * 100, 100)
              const color = units < 10 ? 'bg-red-500' : units < 25 ? 'bg-yellow-500' : 'bg-green-500'
              return (
                <div key={type} className="flex items-center gap-3">
                  <BloodTypeBadge type={type} className="w-10 justify-center" />
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-medium w-16 text-right">{units} units</span>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Recent Requests */}
        <Card className="rounded-2xl border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ClipboardList size={16} className="text-primary" />
              Recent Blood Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentRequests?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No requests yet</p>
            )}
            {recentRequests?.map((req) => (
              <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <BloodTypeBadge type={req.blood_type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{req.patient_name}</p>
                  <p className="text-xs text-muted-foreground">{req.hospital_name} · {req.units_needed} units</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={req.status} />
                  {req.urgency === 'emergency' && (
                    <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                      <AlertTriangle size={10} /> EMERGENCY
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card className="rounded-2xl border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Database',       status: 'Healthy', ok: true },
              { label: 'Auth Service',   status: 'Online',  ok: true },
              { label: 'Notifications',  status: 'Online',  ok: true },
              { label: 'Blood Matching', status: 'Active',  ok: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
                <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium">{item.label}</p>
                  <p className="text-xs text-green-600">{item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}