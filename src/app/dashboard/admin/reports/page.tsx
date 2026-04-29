import { createClient } from '@/lib/supabase/server'
import { getAdminCenter } from '@/lib/get-admin-center'
import { ReportsClient } from './reports-client'
import { AlertTriangle } from 'lucide-react'

export default async function ReportsPage() {
  const supabase = await createClient()
  const center = await getAdminCenter()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Check if user is super admin
  const isSuperAdmin = user?.user_metadata?.role === 'super_admin'

  const requestsQuery = supabase
    .from('blood_requests')
    .select('*')
    .order('created_at', { ascending: false })

  const donationsQuery = supabase
    .from('donations')
    .select('*')
    .order('created_at', { ascending: false })

  const inventoryQuery = supabase
    .from('blood_inventory')
    .select('*')
    .order('blood_type')

  // Apply center filter only for regular admins, super admins see all data
  if (center && !isSuperAdmin) {
    requestsQuery.eq('center_id', center.id)
    donationsQuery.eq('center_id', center.id)
    inventoryQuery.eq('center_id', center.id)
  }

  // For regular admins: show only their center's data
  // For super admins: show all data across all centers

  const [
    { data: requests },
    { data: donations },
    { data: inventory },
    { data: centers },
  ] = await Promise.all([
    requestsQuery,
    donationsQuery,
    inventoryQuery,
    supabase.from('blood_centers').select('*').eq('is_active', true),
  ])

  // For regular admins: filter requests by their center
  const filteredRequests = center && !isSuperAdmin 
    ? requests?.filter(r => r.center_id === center.id) || []
    : requests || []

  // For regular admins: filter donations by their center
  const filteredDonations = center && !isSuperAdmin 
    ? donations?.filter(d => d.center_id === center.id) || []
    : donations || []

  // For regular admins: filter inventory by their center
  const filteredInventory = center && !isSuperAdmin 
    ? inventory?.filter(i => i.center_id === center.id) || []
    : inventory || []

  return (
    <div className="space-y-0">
      {center && (
        <div className="px-6 lg:px-8 pt-6 pb-2 flex items-center gap-2">
          <AlertTriangle size={14} className="text-primary" />
          <span className="text-sm text-muted-foreground">
            Reports scoped to <strong className="text-foreground">{center.name}</strong> — {center.city} only. CSV exports will contain this center's data only.
          </span>
        </div>
      )}
      <ReportsClient
        requests={filteredRequests ?? []}
        donations={filteredDonations ?? []}
        inventory={filteredInventory ?? []}
        centers={isSuperAdmin ? centers ?? [] : center ? centers?.filter(c => c.id === center.id) ?? [] : []}
        userCenter={center}
        userRole={user?.user_metadata?.role}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  )
}