import { createClient } from '@/lib/supabase/server'
import { AnalyticsClient } from './analytics-client'

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const [
    { data: requests },
    { data: donations },
    { data: inventory },
    { data: users },
    { data: centers },
  ] = await Promise.all([
    supabase.from('blood_requests').select('status, urgency, blood_type, created_at, units_needed'),
    supabase.from('donations').select('status, blood_type, created_at, units_donated'),
    supabase.from('blood_inventory').select('blood_type, units_available, center_id'),
    supabase.from('profiles').select('role, created_at, is_donor'),
    supabase.from('blood_centers').select('id, name, is_active'),
  ])

  return (
    <AnalyticsClient
      requests={requests ?? []}
      donations={donations ?? []}
      inventory={inventory ?? []}
      users={users ?? []}
      centers={centers ?? []}
    />
  )
}