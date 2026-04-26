import { createClient } from '@/lib/supabase/server'
import { getAdminCenter } from '@/lib/get-admin-center'
import { RequestsClient } from './requests-client'
import { AlertTriangle } from 'lucide-react'

export default async function AdminRequestsPage() {
  const supabase = await createClient()
  const center = await getAdminCenter()

  const requestsQuery = supabase
    .from('blood_requests')
    .select(`
      *,
      requester:profiles(id, full_name, email, phone, blood_type),
      center:blood_centers(id, name, city)
    `)
    .order('created_at', { ascending: false })

  // Scope to center — but also show unassigned pending requests
  // so admin can pick them up
  if (center) {
    requestsQuery.or(`center_id.eq.${center.id},and(center_id.is.null,status.eq.pending)`)
  }

  const [{ data: requests }, { data: centers }] = await Promise.all([
    requestsQuery,
    supabase.from('blood_centers').select('id, name, city').eq('is_active', true),
  ])

  return (
    <div className="space-y-0">
      {center && (
        <div className="px-6 lg:px-8 pt-6 pb-2 flex items-center gap-2">
          <AlertTriangle size={14} className="text-primary" />
          <span className="text-sm text-muted-foreground">
            Showing requests for <strong className="text-foreground">{center.name}</strong> + unassigned pending requests
          </span>
        </div>
      )}
      <RequestsClient
        requests={requests ?? []}
        centers={centers ?? []}
        isSuperAdmin={false}
      />
    </div>
  )
}