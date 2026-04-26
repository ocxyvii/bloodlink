import { createClient } from '@/lib/supabase/server'
import { RequestBloodClient } from './request-blood-client' 

export default async function RequestBloodPage() {
  const supabase = await createClient()

  const [
    { data: centers },
    { data: inventory },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from('blood_centers')
      .select('id, name, city, address, phone, operating_hours')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('blood_inventory')
      .select('center_id, blood_type, units_available')
      .gt('units_available', 0),
    supabase
      .from('profiles')
      .select('blood_type, full_name')
      .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
      .single(),
  ])

  return (
    <RequestBloodClient
      centers={centers ?? []}
      inventory={inventory ?? []}
      userBloodType={profile?.blood_type ?? null}
      userName={profile?.full_name ?? ''}
    />
  )
}