import { createClient } from '@/lib/supabase/server'
import { FindCentersClient } from './find-centers-client'

export default async function FindCentersPage() {
  const supabase = await createClient()

  const [{ data: centers }, { data: inventory }] = await Promise.all([
    supabase
      .from('blood_centers')
      .select('*')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('blood_inventory')
      .select('center_id, blood_type, units_available'),
  ])

  return <FindCentersClient centers={centers ?? []} inventory={inventory ?? []} />
}