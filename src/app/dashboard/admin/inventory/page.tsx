import { createClient } from '@/lib/supabase/server'
import { getAdminCenter } from '@/lib/get-admin-center'
import { InventoryClient } from './inventory-client'
import { AlertTriangle } from 'lucide-react'

export default async function InventoryPage() {
  const supabase = await createClient()
  const center = await getAdminCenter()

  const inventoryQuery = supabase
    .from('blood_inventory')
    .select('*, center:blood_centers(id, name, city)')
    .order('blood_type')

  // Scope to assigned center
  if (center) inventoryQuery.eq('center_id', center.id)

  const [{ data: inventory }, { data: allCenters }] = await Promise.all([
    inventoryQuery,
    supabase.from('blood_centers').select('*').eq('is_active', true).order('name'),
  ])

  // Admin can only manage their own center
  const centersForForm = center
    ? allCenters?.filter(c => c.id === center.id) ?? []
    : allCenters ?? []

  if (!center) {
    return (
      <div className="p-8">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-50 border border-yellow-200 max-w-lg">
          <AlertTriangle size={18} className="text-yellow-600 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-700">No Center Assigned</p>
            <p className="text-sm text-yellow-600 mt-1">
              You must be assigned to a blood center before you can manage inventory.
              Contact the Super Admin.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      <div className="px-6 lg:px-8 pt-6 pb-2 flex items-center gap-2">
        <AlertTriangle size={14} className="text-primary" />
        <span className="text-sm text-muted-foreground">
          Showing inventory for <strong className="text-foreground">{center.name}</strong> — {center.city} only
        </span>
      </div>
      <InventoryClient
        inventory={inventory ?? []}
        centers={centersForForm}
      />
    </div>
  )
}