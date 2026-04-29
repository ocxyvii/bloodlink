'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function debugInventoryDiscrepancy() {
  const adminClient = createAdminClient()
  
  // Get all inventory records
  const { data: allInventory } = await adminClient
    .from('blood_inventory')
    .select('*')
    .order('created_at', { ascending: false })
  
  // Get all donation records
  const { data: allDonations } = await adminClient
    .from('donations')
    .select('*, donor:profiles(full_name, blood_type)')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
  
  // Get all request fulfillment records
  const { data: allRequests } = await adminClient
    .from('blood_requests')
    .select('*')
    .eq('status', 'fulfilled')
    .order('created_at', { ascending: false })
  
  console.log('=== INVENTORY DEBUG ===')
  console.log('Total inventory records:', allInventory?.length || 0)
  console.log('Total completed donations:', allDonations?.length || 0)
  console.log('Total fulfilled requests:', allRequests?.length || 0)
  
  // Calculate totals by blood type
  const inventoryByType = new Map()
  const donationsByType = new Map()
  const requestsByType = new Map()
  
  allInventory?.forEach(item => {
    const current = inventoryByType.get(item.blood_type) || 0
    inventoryByType.set(item.blood_type, current + item.units_available)
  })
  
  allDonations?.forEach(donation => {
    const current = donationsByType.get(donation.donor?.blood_type) || 0
    donationsByType.set(donation.donor?.blood_type, current + donation.units_donated)
  })
  
  allRequests?.forEach(request => {
    const current = requestsByType.get(request.blood_type) || 0
    requestsByType.set(request.blood_type, current + request.units_needed)
  })
  
  console.log('=== BY BLOOD TYPE ===')
  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
  
  bloodTypes.forEach(type => {
    const inventory = inventoryByType.get(type) || 0
    const donations = donationsByType.get(type) || 0
    const requests = requestsByType.get(type) || 0
    const expected = inventory + donations - requests
    
    console.log(`${type}:`)
    console.log(`  Inventory: ${inventory}`)
    console.log(`  Donations: +${donations}`)
    console.log(`  Requests: -${requests}`)
    console.log(`  Expected: ${expected}`)
    console.log(`  Discrepancy: ${expected - inventory}`)
  })
  
  return {
    inventoryByType,
    donationsByType,
    requestsByType,
    discrepancy: Object.fromEntries(
      bloodTypes.map(type => [
        type, 
        (inventoryByType.get(type) || 0) + (donationsByType.get(type) || 0) - (requestsByType.get(type) || 0)
      ])
    )
  }
}
