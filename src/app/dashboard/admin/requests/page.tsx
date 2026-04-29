import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminCenter } from '@/lib/get-admin-center'
import { RequestsClient } from './requests-client'

export default async function AdminRequestsPage() {
  const adminClient = createAdminClient()
  const center = await getAdminCenter()


  const { data: centers } = await adminClient
    .from('blood_centers')
    .select('id, name, city')
    .eq('is_active', true)

  let requests: any[] = []

  if (center) {
    // Get requests assigned to this center (without relationships to avoid embedding errors)
    const { data: centerRequests } = await adminClient
      .from('blood_requests')
      .select('*')
      .eq('center_id', center.id)
      .order('created_at', { ascending: false })

    // Get unassigned requests (no center selected by user)
    const { data: unassigned } = await adminClient
      .from('blood_requests')
      .select('*')
      .is('center_id', null)
      .order('created_at', { ascending: false })


    // Merge both — unassigned shown first so admin can claim them
    const merged = [
      ...(unassigned ?? []),
      ...(centerRequests ?? []),
    ]

    // Deduplicate by id
    const seen = new Set()
    const uniqueRequests = merged.filter(r => {
      if (seen.has(r.id)) return false
      seen.add(r.id)
      return true
    })

    // Get unique requester and center IDs
    const requesterIds = Array.from(
      new Set(uniqueRequests.map(r => r.requester_id).filter(Boolean))
    )
    const centerIds = Array.from(
      new Set(uniqueRequests.map(r => r.center_id).filter(Boolean))
    )

    // Fetch profiles and centers separately to avoid relationship conflicts
    const [requestersData, centersData] = await Promise.all([
      requesterIds.length > 0
        ? adminClient
            .from('profiles')
            .select('id, full_name, email, phone, blood_type')
            .in('id', requesterIds)
        : Promise.resolve({ data: [] }),
      centerIds.length > 0
        ? adminClient
            .from('blood_centers')
            .select('id, name, city')
            .in('id', centerIds)
        : Promise.resolve({ data: [] })
    ])

    // Create maps for lookup
    const requesterMap = new Map((requestersData.data ?? []).map(r => [r.id, r]))
    const centerMap = new Map((centersData.data ?? []).map(c => [c.id, c]))
    
    // Combine data
    requests = uniqueRequests.map(r => ({
      ...r,
      requester: r.requester_id ? requesterMap.get(r.requester_id) ?? null : null,
      center: r.center_id ? centerMap.get(r.center_id) ?? null : null,
    }))
  } else {
    // No center assigned — show everything (fallback)
    const { data } = await adminClient
      .from('blood_requests')
      .select('*')
      .order('created_at', { ascending: false })
    requests = data ?? []
    
  }


  // Sort: emergency + pending first, then newest
  requests.sort((a, b) => {
    const aIsUrgent = a.urgency === 'emergency' && a.status === 'pending'
    const bIsUrgent = b.urgency === 'emergency' && b.status === 'pending'
    if (aIsUrgent && !bIsUrgent) return -1
    if (!aIsUrgent && bIsUrgent) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="space-y-0">
      {center && (
        <div className="px-6 lg:px-8 pt-6 pb-0 flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Showing requests for{' '}
            <strong className="text-foreground">{center.name}</strong>
            {' '}and all unassigned requests
          </p>
        </div>
      )}
      <RequestsClient
        requests={requests}
        centers={centers ?? []}
        isSuperAdmin={!center}
      />
    </div>
  )
}