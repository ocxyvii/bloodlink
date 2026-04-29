'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function debugReportsData() {
  console.log('=== REPORTS DATA DEBUG ===')
  
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.log('No authenticated user found')
    return { error: 'No authenticated user' }
  }
  
  console.log(`User: ${user.email} (ID: ${user.id})`)
  
  // 1. Check admin center assignment
  const { data: adminCenter } = await supabase
    .from('blood_centers')
    .select('*')
    .eq('admin_id', user.id)
    .single()
  
  console.log(`Admin Center Assignment: ${adminCenter ? adminCenter.name : 'None'}`)
  
  // 2. Check all blood requests using admin client
  const { data: allRequests } = await adminClient
    .from('blood_requests')
    .select('*')
    .order('created_at', { ascending: false })
  
  console.log(`Total Blood Requests (Admin Client): ${allRequests?.length || 0}`)
  
  // 3. Check requests for this admin's center
  const centerRequests = adminCenter 
    ? allRequests?.filter(r => r.center_id === adminCenter.id) || []
    : []
  
  console.log(`Requests for ${adminCenter?.name || 'Unassigned'}: ${centerRequests.length}`)
  
  // 4. Check what the regular client sees
  const { data: clientRequests } = await supabase
    .from('blood_requests')
    .select('*')
    .order('created_at', { ascending: false })
  
  console.log(`Total Blood Requests (Regular Client): ${clientRequests?.length || 0}`)
  
  // 5. Check center-specific requests with regular client
  let centerClientRequests = []
  if (adminCenter) {
    const { data: specificRequests } = await supabase
      .from('blood_requests')
      .select('*')
      .eq('center_id', adminCenter.id)
      .order('created_at', { ascending: false })
    
    centerClientRequests = specificRequests || []
    console.log(`Center-specific requests (Regular Client): ${centerClientRequests.length}`)
  }
  
  // 6. Show recent requests for debugging
  if (centerRequests.length > 0) {
    console.log('Recent requests for this center:')
    centerRequests.slice(0, 5).forEach((req, index) => {
      console.log(`  ${index + 1}. ${req.blood_type} - ${req.units_needed} units - ${req.status} - ${req.created_at}`)
    })
  }
  
  // 7. Check for any filtering issues
  const issues = []
  
  if (centerRequests.length > 0 && centerClientRequests.length === 0) {
    issues.push('Admin client sees requests but regular client does not - possible permission issue')
  }
  
  if ((allRequests?.length || 0) > 0 && (clientRequests?.length || 0) === 0) {
    issues.push('Admin client sees requests but regular client sees none - possible RLS issue')
  }
  
  if (centerRequests.length > 0 && adminCenter) {
    const hasRecentRequests = centerRequests.some(r => 
      new Date(r.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    )
    
    if (!hasRecentRequests) {
      issues.push('No recent requests found in last 24 hours')
    }
  }
  
  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'unknown'
    },
    adminCenter,
    requests: {
      totalAdminClient: allRequests?.length || 0,
      totalRegularClient: clientRequests?.length || 0,
      centerSpecificAdmin: centerRequests.length,
      centerSpecificRegular: centerClientRequests.length,
      recentRequests: centerRequests.slice(0, 5)
    },
    issues,
    summary: {
      hasData: centerRequests.length > 0,
      hasRecentData: centerRequests.some(r => 
        new Date(r.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ),
      hasPermissionIssues: issues.length > 0
    }
  }
}
