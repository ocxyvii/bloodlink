import { createClient } from '@/lib/supabase/server'
import { ReportsClient } from './reports-client'

export default async function ReportsPage() {
  const supabase = await createClient()

  const [
    { data: requests },
    { data: donations },
    { data: inventory },
    { data: centers },
  ] = await Promise.all([
    supabase.from('blood_requests').select('*, requester:profiles(full_name, email)').order('created_at', { ascending: false }),
    supabase.from('donations').select('*, donor:profiles(full_name, email), center:blood_centers(name, city)').order('created_at', { ascending: false }),
    supabase.from('blood_inventory').select('*, center:blood_centers(name, city)').order('blood_type'),
    supabase.from('blood_centers').select('*').eq('is_active', true),
  ])

  return (
    <ReportsClient
      requests={requests ?? []}
      donations={donations ?? []}
      inventory={inventory ?? []}
      centers={centers ?? []}
    />
  )
}