import { createClient } from '@/lib/supabase/server'
import { getAdminCenter } from '@/lib/get-admin-center'
import { ReportsClient } from './reports-client'
import { AlertTriangle } from 'lucide-react'

export default async function ReportsPage() {
  const supabase = await createClient()
  const center = await getAdminCenter()

  const requestsQuery = supabase
    .from('blood_requests')
    .select('*, requester:profiles(full_name, email)')
    .order('created_at', { ascending: false })

  const donationsQuery = supabase
    .from('donations')
    .select('*, donor:profiles(full_name, email), center:blood_centers(name, city)')
    .order('created_at', { ascending: false })

  const inventoryQuery = supabase
    .from('blood_inventory')
    .select('*, center:blood_centers(name, city)')
    .order('blood_type')

  if (center) {
    requestsQuery.eq('center_id', center.id)
    donationsQuery.eq('center_id', center.id)
    inventoryQuery.eq('center_id', center.id)
  }

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
        requests={requests ?? []}
        donations={donations ?? []}
        inventory={inventory ?? []}
        centers={center ? centers?.filter(c => c.id === center.id) ?? [] : centers ?? []}
      />
    </div>
  )
}