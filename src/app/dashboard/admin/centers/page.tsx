import { createClient } from '@/lib/supabase/server'
import { getAdminCenter } from '@/lib/get-admin-center'
import { CentersClient } from './centers-client'
import { AlertTriangle, Building2 } from 'lucide-react'

export default async function CentersPage() {
  const supabase = await createClient()
  const center = await getAdminCenter()

  // Admin only sees their own center
  const centersQuery = supabase
    .from('blood_centers')
    .select('*')
    .order('created_at', { ascending: false })

  if (center) centersQuery.eq('id', center.id)

  const [
    { data: centers },
    { data: admins },
    { data: inventory },
  ] = await Promise.all([
    centersQuery,
    supabase.from('profiles').select('id, full_name, email, location').eq('role', 'admin').eq('is_active', true),
    supabase.from('blood_inventory').select('center_id, blood_type, units_available'),
  ])

  if (!center) {
    return (
      <div className="p-8">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-50 border border-yellow-200 max-w-lg">
          <AlertTriangle size={18} className="text-yellow-600 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-700">No Center Assigned</p>
            <p className="text-sm text-yellow-600 mt-1">
              Contact the Super Admin to get assigned to a blood center.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      <div className="px-6 lg:px-8 pt-6 pb-2 flex items-center gap-2">
        <Building2 size={14} className="text-primary" />
        <span className="text-sm text-muted-foreground">
          Managing <strong className="text-foreground">{center.name}</strong> — {center.city}
        </span>
      </div>
      <CentersClient
        centers={centers ?? []}
        admins={admins ?? []}
        inventory={inventory ?? []}
        isSuperAdmin={false}
      />
    </div>
  )
}