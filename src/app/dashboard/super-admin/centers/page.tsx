import { createClient } from '@/lib/supabase/server'
import { CentersClient } from '@/app/dashboard/admin/centers/centers-client'

export default async function SuperAdminCentersPage() {
  const supabase = await createClient()

  const [
    { data: centers },
    { data: admins },
    { data: inventory },
  ] = await Promise.all([
    supabase
      .from('blood_centers')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name, email, location')
      .eq('role', 'admin')
      .eq('is_active', true),
    supabase
      .from('blood_inventory')
      .select('center_id, blood_type, units_available'),
  ])

  return (
    <CentersClient
      centers={centers ?? []}
      admins={admins ?? []}
      inventory={inventory ?? []}
      isSuperAdmin={true}
    />
  )
}