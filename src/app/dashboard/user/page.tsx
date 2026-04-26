import { createClient } from '@/lib/supabase/server'
import { Droplets, Heart, ClipboardList, MapPin, AlertTriangle, Plus } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BloodTypeBadge } from '@/components/ui/blood-type-badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function UserOverview() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: profile },
    { count: myRequests },
    { count: myDonations },
    { data: recentRequests },
    { data: inventory },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('blood_requests').select('*', { count: 'exact', head: true }).eq('requester_id', user!.id),
    supabase.from('donations').select('*', { count: 'exact', head: true }).eq('donor_id', user!.id),
    supabase.from('blood_requests')
      .select('*')
      .eq('requester_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(4),
    supabase.from('blood_inventory')
      .select('blood_type, units_available')
      .order('units_available', { ascending: false })
      .limit(8),
  ])

  const inventoryByType = (inventory ?? []).reduce((acc: Record<string, number>, item) => {
    acc[item.blood_type] = (acc[item.blood_type] ?? 0) + item.units_available
    return acc
  }, {})

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Welcome */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {profile?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Here's your BloodLink summary</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard/user/request">
            <Plus size={16} />
            Request Blood
          </Link>
        </Button>
      </div>

      {/* Profile completeness prompt */}
      {!profile?.blood_type && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
          <AlertTriangle size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-700">Complete your profile</p>
            <p className="text-sm text-blue-600 mt-0.5">Add your blood type and details for faster emergency matching.</p>
          </div>
          <Button size="sm" variant="outline" asChild className="border-blue-300 text-blue-700 hover:bg-blue-100">
            <Link href="/dashboard/user/profile">Update</Link>
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="My Blood Type"
          value={profile?.blood_type ?? 'Unknown'}
          icon={Droplets}
          color="red"
          subtitle={profile?.blood_type ? 'On file' : 'Not set'}
        />
        <StatCard title="My Requests"  value={myRequests ?? 0}  icon={ClipboardList} color="orange" subtitle="Total submitted" />
        <StatCard title="My Donations" value={myDonations ?? 0} icon={Heart}         color="green"  subtitle="Lives helped" />
        <StatCard title="Donor Status" value={profile?.is_donor ? 'Active' : 'Inactive'} icon={Heart} color={profile?.is_donor ? 'green' : 'blue'} subtitle={profile?.is_donor ? 'Registered donor' : 'Not a donor'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available blood */}
        <Card className="rounded-2xl border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Droplets size={16} className="text-primary" />
                Available Blood
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-xs text-primary">
                <Link href="/dashboard/user/centers">View centers →</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(inventoryByType).map(([type, units]) => (
                <div key={type} className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                  units < 10 ? 'border-red-200 bg-red-50' : units < 25 ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'
                }`}>
                  <BloodTypeBadge type={type} />
                  <span className="text-xs text-muted-foreground mt-1">{units}u</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* My recent requests */}
        <Card className="rounded-2xl border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ClipboardList size={16} className="text-primary" />
                My Recent Requests
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-xs text-primary">
                <Link href="/dashboard/user/my-requests">View all →</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentRequests?.length === 0 && (
              <div className="text-center py-6 space-y-2">
                <p className="text-sm text-muted-foreground">No requests yet</p>
                <Button size="sm" asChild>
                  <Link href="/dashboard/user/request">Make your first request</Link>
                </Button>
              </div>
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
                    <span className="text-xs font-bold text-red-600">EMERGENCY</span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Request Blood',   href: '/dashboard/user/request',      icon: <Droplets size={20} />,    color: 'bg-red-50 text-red-600 border-red-100' },
          { label: 'Find Centers',    href: '/dashboard/user/centers',       icon: <MapPin size={20} />,      color: 'bg-blue-50 text-blue-600 border-blue-100' },
          { label: 'Donate Blood',    href: '/dashboard/user/my-donations',  icon: <Heart size={20} />,       color: 'bg-green-50 text-green-600 border-green-100' },
          { label: 'My Requests',     href: '/dashboard/user/my-requests',   icon: <ClipboardList size={20} />, color: 'bg-orange-50 text-orange-600 border-orange-100' },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all hover:shadow-sm hover:-translate-y-0.5 ${action.color}`}
          >
            {action.icon}
            <span className="text-sm font-medium">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}