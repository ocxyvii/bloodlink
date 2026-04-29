import { createAdminClient } from '@/lib/supabase/admin'

export async function debugRequestFlow(userId: string) {
  const adminClient = createAdminClient()

  console.log('=== DEBUG REQUEST FLOW ===')
  
  // 1. Check user profile and role
  const { data: profile } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  console.log('User Profile:', profile)

  // 2. Check if user is assigned to any center
  const { data: userCenter } = await adminClient
    .from('blood_centers')
    .select('*')
    .eq('admin_id', userId)
    .single()
  
  console.log('User Assigned Center:', userCenter)

  // 3. Check all centers and their admins
  const { data: allCenters } = await adminClient
    .from('blood_centers')
    .select('*')
    .eq('is_active', true)
  
  console.log('All Active Centers:', allCenters)

  // 4. Check all pending requests
  const { data: pendingRequests } = await adminClient
    .from('blood_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  
  console.log('All Pending Requests:', pendingRequests)

  // 5. Check requests specifically for this user's center
  if (userCenter) {
    const { data: centerRequests } = await adminClient
      .from('blood_requests')
      .select('*')
      .eq('center_id', userCenter.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    console.log('Requests for User Center:', centerRequests)
  }

  return {
    profile,
    userCenter,
    allCenters,
    pendingRequests
  }
}
