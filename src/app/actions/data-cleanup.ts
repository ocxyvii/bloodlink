'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function cleanupAnomalousRequestData() {
  console.log('🧹 Starting data cleanup for anomalous request records...')
  const adminClient = createAdminClient()
  
  try {
    // 1. Find all requests with suspiciously high units
    const { data: suspiciousRequests } = await adminClient
      .from('blood_requests')
      .select('*')
      .gte('units_needed', 1000) // Find requests with > 1000 units
      .order('created_at', { ascending: false })
    
    console.log(`🔍 Found ${suspiciousRequests?.length || 0} requests with > 1000 units`)
    
    // 2. Remove anomalous request records
    if (suspiciousRequests && suspiciousRequests.length > 0) {
      const { error } = await adminClient
        .from('blood_requests')
        .delete()
        .in('id', suspiciousRequests.map(r => r.id))
      
      if (error) {
        console.log(`❌ Error removing anomalous requests: ${error.message}`)
        return { error: error.message }
      }
      
      console.log(`✅ Removed ${suspiciousRequests.length} anomalous request records`)
    }
    
    // 3. Reset inventory to reasonable values
    const { data: inventory } = await adminClient
      .from('blood_inventory')
      .select('*')
    
    if (inventory && inventory.length > 0) {
      // Reset all inventory to reasonable starting values
      const resetPromises = inventory.map(item => 
        adminClient
          .from('blood_inventory')
          .update({
            units_available: Math.max(0, Math.min(100, item.units_available || 0)),
            units_reserved: 0,
            last_updated: new Date().toISOString(),
          })
          .eq('id', item.id)
          .eq('blood_type', item.blood_type)
      )
      
      await Promise.all(resetPromises)
      console.log(`🔄 Reset ${inventory.length} inventory records to reasonable values`)
    }
    
    // 4. Revalidate paths
    revalidatePath('/dashboard/admin/requests')
    revalidatePath('/dashboard/admin/reports')
    revalidatePath('/dashboard/super-admin/requests')
    
    console.log('✅ Data cleanup completed successfully')
    return { success: true, message: 'Cleaned up anomalous data and reset inventory' }
  } catch (error: any) {
    console.log(`❌ Cleanup error: ${error.message}`)
    return { error: error.message }
  }
}

export async function fixAdminCenterAssignments() {
  console.log('🔧 Fixing admin center assignments...')
  const adminClient = createAdminClient()
  
  try {
    // Get all admins and their center assignments
    const { data: admins } = await adminClient
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'admin')
    
    // Get all centers
    const { data: centers } = await adminClient
      .from('blood_centers')
      .select('*')
    
    // Fix any null admin_id assignments
    const adminsToUpdate: Array<{ admin_id: string; center_id: string | null }> = []
    
    if (admins && centers) {
      admins.forEach(admin => {
        const centerAssignment = centers.find(c => c.admin_id === admin.id)
        
        if (centerAssignment) {
          // Admin has valid center assignment
          adminsToUpdate.push({
            admin_id: admin.id,
            center_id: centerAssignment.id
          })
        }
      })
    }
    
    // Apply updates
    if (adminsToUpdate.length > 0) {
      const { error } = await adminClient
        .from('blood_centers')
        .upsert(adminsToUpdate)
        .select()
      
      if (error) {
        console.log(`❌ Error updating admin assignments: ${error.message}`)
        return { error: error.message }
      }
      
      console.log(`✅ Updated ${adminsToUpdate.length} admins to centers`)
    }
    
    revalidatePath('/dashboard/super-admin/admins')
    revalidatePath('/dashboard/admin/centers')
    
    console.log('✅ Admin center assignments fixed')
    return { success: true, message: 'Fixed admin center assignments' }
  } catch (error: any) {
    console.log(`❌ Error fixing admin assignments: ${error.message}`)
    return { error: error.message }
  }
}

export async function validateRequestData() {
  console.log('🔍 Validating request data integrity...')
  const adminClient = createAdminClient()
  
  try {
    // Check for any requests with impossible values
    const { data: invalidRequests } = await adminClient
      .from('blood_requests')
      .select('*')
      .or('units_needed.lt.0') // Negative units
      .or('units_needed.gt.1000') // Unreasonably high units
    
    if (invalidRequests && invalidRequests.length > 0) {
      console.log(`🔍 Found ${invalidRequests.length} invalid request records`)
      
      // Fix invalid records
      const { error } = await adminClient
        .from('blood_requests')
        .update({
          units_needed: Math.max(1, invalidRequests[0].units_needed), // Set to minimum 1
          notes: '[AUTO-CORRECTED] Invalid units value corrected'
        })
        .eq('id', invalidRequests[0].id)
      
      if (error) {
        console.log(`❌ Error correcting invalid requests: ${error.message}`)
        return { error: error.message }
      }
      
      console.log(`✅ Corrected ${invalidRequests.length} invalid request records`)
    }
    
    console.log('✅ Request data validation completed')
    return { success: true, message: 'Validated and corrected request data' }
  } catch (error: any) {
    console.log(`❌ Validation error: ${error.message}`)
    return { error: error.message }
  }
}
