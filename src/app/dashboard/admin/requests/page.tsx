import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { RequestsClient } from './requests-client'
import { redirect } from 'next/navigation'

export default async function AdminRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard/user')
  }

  const adminClient = createAdminClient()

  const [
    { data: baseRequests, error: requestsError },
    { data: centers },
  ] = await Promise.all([
    adminClient
      .from('blood_requests')
      .select('*')
      .order('created_at', { ascending: false }),
    adminClient
      .from('blood_centers')
      .select('id, name, city')
      .eq('is_active', true),
  ])

  if (requestsError) {
    console.error('Failed to fetch blood requests:', requestsError.message)
  }

  const requesterIds = Array.from(
    new Set((baseRequests ?? []).map(r => r.requester_id).filter(Boolean))
  )
  const centerIds = Array.from(
    new Set((baseRequests ?? []).map(r => r.center_id).filter(Boolean))
  )

  const [{ data: requesters }, { data: requestCenters }] = await Promise.all([
    requesterIds.length > 0
      ? adminClient
          .from('profiles')
          .select('id, full_name, email, phone, blood_type')
          .in('id', requesterIds)
      : Promise.resolve({ data: [] as {
          id: string
          full_name: string
          email: string
          phone: string | null
          blood_type: string | null
        }[] }),
    centerIds.length > 0
      ? adminClient
          .from('blood_centers')
          .select('id, name, city')
          .in('id', centerIds)
      : Promise.resolve({ data: [] as {
          id: string
          name: string
          city: string
        }[] }),
  ])

  const requesterMap = new Map((requesters ?? []).map(r => [r.id, r]))
  const centerMap = new Map((requestCenters ?? []).map(c => [c.id, c]))
  const requests = (baseRequests ?? []).map(r => ({
    ...r,
    requester: r.requester_id ? requesterMap.get(r.requester_id) ?? null : null,
    center: r.center_id ? centerMap.get(r.center_id) ?? null : null,
  }))

  return (
    <RequestsClient
      requests={requests ?? []}
      centers={centers ?? []}
      isSuperAdmin={profile.role === 'super_admin'}
    />
  )
}