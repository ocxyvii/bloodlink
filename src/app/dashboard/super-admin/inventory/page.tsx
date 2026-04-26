import { createClient } from '@/lib/supabase/server'
import { InventoryClient } from '@/app/dashboard/admin/inventory/inventory-client'

export default async function SuperAdminInventoryPage() {
  const supabase = await createClient()

  const [
    { data: inventory },
    { data: centers },
  ] = await Promise.all([
    supabase
      .from('blood_inventory')
      .select('*, center:blood_centers(id, name, city)')
      .order('blood_type'),
    supabase
      .from('blood_centers')
      .select('*')
      .eq('is_active', true)
      .order('name'),
  ])

  return (
    <InventoryClient
      inventory={inventory ?? []}
      centers={centers ?? []}
    />
  )
}