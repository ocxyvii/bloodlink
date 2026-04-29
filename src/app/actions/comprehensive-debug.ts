'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function comprehensiveSystemDebug() {
  console.log('=== COMPREHENSIVE SYSTEM DEBUG ===')
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminClient = createAdminClient()
  
  if (!user) {
    console.log('❌ No authenticated user found')
    return { error: 'No authenticated user' }
  }
  
  console.log(`👤 User: ${user.email} (ID: ${user.id})`)
  
  // 1. Check admin center assignment
  const { data: adminCenter } = await supabase
    .from('blood_centers')
    .select('*')
    .eq('admin_id', user.id)
    .single()
  
  console.log(`🏥 Center Assignment: ${adminCenter ? adminCenter.name : 'None'}`)
  
  // 2. Check all blood requests
  const { data: allRequests } = await adminClient
    .from('blood_requests')
    .select('*')
    .order('created_at', { ascending: false })
  
  console.log(`📋 Total Blood Requests: ${allRequests?.length || 0}`)
  
  // 3. Check requests assigned to this center
  const centerRequests = adminCenter 
    ? allRequests?.filter(r => r.center_id === adminCenter.id) || []
    : []
  
  console.log(`🎯 Requests for ${adminCenter?.name || 'Unassigned'}: ${centerRequests.length}`)
  
  // 4. Check inventory
  const { data: inventory } = await adminClient
    .from('blood_inventory')
    .select('*')
    .order('blood_type')
  
  console.log(`📦 Total Inventory Records: ${inventory?.length || 0}`)
  
  // 5. Check inventory for this center
  const centerInventory = adminCenter 
    ? inventory?.filter(i => i.center_id === adminCenter.id) || []
    : []
  
  console.log(`🏥 Inventory for ${adminCenter?.name || 'Unassigned'}: ${centerInventory.length}`)
  
  // 6. Check donations
  const { data: donations } = await adminClient
    .from('donations')
    .select('*')
    .order('created_at', { ascending: false })
  
  console.log(`🩸 Total Donations: ${donations?.length || 0}`)
  
  // 7. Check donations for this center
  const centerDonations = adminCenter 
    ? donations?.filter(d => d.center_id === adminCenter.id) || []
    : []
  
  console.log(`🎯 Donations for ${adminCenter?.name || 'Unassigned'}: ${centerDonations.length}`)
  
  // 8. Calculate inventory impact
  let totalDeducted = 0
  let totalAdded = 0
  
  allRequests?.forEach(req => {
    if (req.status === 'fulfilled') {
      totalDeducted += req.units_needed || 0
    }
  })
  
  donations?.forEach(donation => {
    if (donation.status === 'completed') {
      totalAdded += donation.units_donated || 0
    }
  })
  
  const expectedInventory = centerInventory.reduce((sum, item) => {
    return sum + (item.units_available || 0)
  }, 0)
  
  const actualInventory = centerInventory.reduce((sum, item) => {
    return sum + (item.units_available || 0)
  }, 0)
  
  console.log(`📊 Inventory Analysis:`)
  console.log(`  Expected inventory: ${expectedInventory}`)
  console.log(`  Actual inventory: ${actualInventory}`)
  console.log(`  Total deducted: ${totalDeducted}`)
  console.log(`  Total added: ${totalAdded}`)
  console.log(`  Net change: ${actualInventory - expectedInventory}`)
  
  // 9. Check for data consistency issues
  const issues = []
  
  if (totalDeducted > 0 && actualInventory === expectedInventory) {
    issues.push('❌ Inventory not updated despite fulfilled requests')
  }
  
  if (centerRequests.length > 0 && adminCenter) {
    const visibleInAdmin = allRequests?.filter(r => 
      r.center_id === adminCenter.id
    ).length || 0
    
    if (centerRequests.length !== visibleInAdmin) {
      issues.push('❌ Admin visibility mismatch - requests exist but not showing')
    }
  }
  
  if (centerDonations.length > 0 && adminCenter) {
    const completedDonations = centerDonations.filter(d => d.status === 'completed').length
    if (completedDonations === 0) {
      issues.push('❌ Donations not recorded in center inventory')
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
      total: allRequests?.length || 0,
      centerSpecific: centerRequests.length,
      centerSpecificData: centerRequests
    },
    inventory: {
      total: inventory?.length || 0,
      centerSpecific: centerInventory.length,
      centerSpecificData: centerInventory,
      expected: expectedInventory,
      actual: actualInventory,
      discrepancy: actualInventory - expectedInventory
    },
    donations: {
      total: donations?.length || 0,
      centerSpecific: centerDonations.length,
      centerSpecificData: centerDonations
    },
    issues,
    summary: {
      totalDeducted,
      totalAdded,
      netInventoryChange: actualInventory - expectedInventory,
      hasInconsistencies: issues.length > 0
    }
  }
}
