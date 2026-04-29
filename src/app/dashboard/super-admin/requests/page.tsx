import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { RequestsClient } from '@/app/dashboard/admin/requests/requests-client'
import { redirect } from 'next/navigation'

export default async function SuperAdminRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    redirect('/dashboard/user')
  }

  const adminClient = createAdminClient()

  // Get all requests for super admin: pending unassigned, pending assigned, and all approved/rejected/fulfilled
  const { data: requests, error: requestsError } = await adminClient
    .from('blood_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (requestsError) {
    console.error('Failed to fetch blood requests:', requestsError.message)
  }

  // Get unique requester and center IDs
  const requesterIds = Array.from(
    new Set((requests ?? []).map(r => r.requester_id).filter(Boolean))
  )
  const centerIds = Array.from(
    new Set((requests ?? []).map(r => r.center_id).filter(Boolean))
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
  const requestsWithDetails = (requests ?? []).map(r => ({
    ...r,
    requester: r.requester_id ? requesterMap.get(r.requester_id) ?? null : null,
    center: r.center_id ? centerMap.get(r.center_id) ?? null : null,
  }))

  return (
    <RequestsClient
      requests={requestsWithDetails ?? []}
      centers={centersData.data ?? []}
      isSuperAdmin={true}
    />
  )
}