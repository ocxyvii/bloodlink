import { createClient } from '@/lib/supabase/server'
import { CentersClient } from './centers-client'

export default async function CentersPage() {
  const supabase = await createClient()

  const [
    { data: centers },
    { data: admins },
    { data: inventory },
    { data: profile },
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
    supabase
      .from('profiles')
      .select('role')
      .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
      .single(),
  ])

  return (
    <CentersClient
      centers={centers ?? []}
      admins={admins ?? []}
      inventory={inventory ?? []}
      isSuperAdmin={profile?.role === 'super_admin'}
    />
  )
}